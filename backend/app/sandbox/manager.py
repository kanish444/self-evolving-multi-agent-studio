import os
import uuid
import logging
import json
from datetime import datetime
from sqlalchemy.orm import Session

from ..models.sandbox import Execution, ExecutionFile, ExecutionResult
from ..models.log import Log
from ..models.task import Task

from .languages.python import PythonRuntime
from .languages.javascript import JavaScriptRuntime
from .languages.java import JavaRuntime
from .validators import validate_execution_files
from .policies import validate_command
from .executor import SandboxExecutor
from .cleanup import cleanup_workspace

logger = logging.getLogger("app.sandbox.manager")

class SandboxManager:
    def __init__(self):
        self.executor = SandboxExecutor()
        self.runtimes = {
            "python": PythonRuntime(),
            "javascript": JavaScriptRuntime(),
            "java": JavaRuntime()
        }

    def _log_security_event(
        self,
        db: Session,
        project_id: str,
        execution_id: str,
        action: str,
        message: str,
        task_id: str = None,
        run_id: str = None
    ):
        """Logs security events to Logs database table consistent with Phase 8"""
        timestamp_str = datetime.now().strftime("%H:%M:%S")
        log_id = f"evt-{uuid.uuid4().hex[:8]}"
        trace = f"trace_{run_id[-8:]}" if run_id else f"trace_{execution_id[-8:]}"
        corr = f"corr_{run_id[-8:]}" if run_id else f"corr_{execution_id[-8:]}"

        log_entry = Log(
            id=log_id,
            project_id=project_id,
            agent_id="Sandbox",
            task_id=task_id,
            type="WARNING" if action != "EXECUTION_REJECTED" else "ERROR",
            status="FAILED",
            action=action,
            message=f"[SECURITY] {message} (Execution: {execution_id})",
            trace_id=trace,
            correlation_id=corr,
            timestamp=timestamp_str
        )
        db.add(log_entry)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error logging sandbox security event: {e}")

    def execute_job(self, execution_id: str, db: Session) -> dict:
        """Executes the queued run synchronously on the worker thread, saving results to SQLite"""
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            logger.error(f"Execution job not found: {execution_id}")
            return {"error": "Execution job not found"}

        # 1. Resolve Language adapter
        lang = execution.language.lower()
        runtime = self.runtimes.get(lang)
        if not runtime:
            execution.status = "REJECTED"
            db.commit()
            self._save_error_result(db, execution_id, "Unsupported language runtime requested.")
            return {"status": "REJECTED", "error": "Unsupported language."}

        # 2. Retrieve Files
        db_files = db.query(ExecutionFile).filter(ExecutionFile.execution_id == execution_id).all()
        files = [{"path": df.path, "content": df.content} for df in db_files]

        # 3. Validate File Structure
        is_valid, err_msg = runtime.validate(files, execution.entrypoint)
        if not is_valid:
            execution.status = "REJECTED"
            db.commit()
            self._save_error_result(db, execution_id, f"Validation failure: {err_msg}")
            
            # Log security event
            self._log_security_event(
                db=db,
                project_id=execution.project_id,
                execution_id=execution_id,
                action="PATH_TRAVERSAL_BLOCKED" if "traversal" in err_msg.lower() else "EXECUTION_REJECTED",
                message=err_msg,
                task_id=execution.task_id,
                run_id=execution.workflow_run_id
            )
            return {"status": "REJECTED", "error": err_msg}

        # 4. Resolve Test Command & Validate Allowlist
        # Retrieve test command from project/runtime configuration where available.
        # Check if the command is allowed
        # Fallback to simple run commands
        test_command = db.query(Task).filter(Task.id == execution.task_id).first()
        cmd_str = None
        if test_command and test_command.dependencies: # Store test command in dependencies field for execution routing
            cmd_str = test_command.dependencies

        run_args = runtime.get_run_command(execution.entrypoint, cmd_str)
        flat_command = " ".join(run_args)

        if not validate_command(lang, flat_command):
            execution.status = "REJECTED"
            db.commit()
            err = f"Execution command violates allowlist policy: '{flat_command}'"
            self._save_error_result(db, execution_id, err)
            self._log_security_event(
                db=db,
                project_id=execution.project_id,
                execution_id=execution_id,
                action="COMMAND_REJECTED",
                message=err,
                task_id=execution.task_id,
                run_id=execution.workflow_run_id
            )
            return {"status": "REJECTED", "error": err}

        # 5. Create Isolated Temporary workspace folder under backend/scratch
        workspace_name = f"workspace-{execution_id}"
        workspace_path = os.path.abspath(os.path.join(self.executor.scratch_dir, workspace_name))
        os.makedirs(workspace_path, exist_ok=True)

        try:
            # 6. Prepare Files in Workspace
            runtime.prepare(workspace_path, files)

            # 7. Transition status to RUNNING
            execution.status = "RUNNING"
            execution.started_at = datetime.utcnow()
            db.commit()

            # 8. Execute in Sandbox
            exit_code, stdout, stderr, timed_out, resource_limited = self.executor.execute_in_sandbox(
                workspace_path=workspace_path,
                command_args=run_args,
                docker_image=runtime.get_docker_image()
            )

        except Exception as run_err:
            exit_code = 1
            stdout = ""
            stderr = f"Sandbox execution crash: {run_err}"
            timed_out = False
            resource_limited = False
            
            # Log security event
            self._log_security_event(
                db=db,
                project_id=execution.project_id,
                execution_id=execution_id,
                action="SANDBOX_FAILURE",
                message=stderr,
                task_id=execution.task_id,
                run_id=execution.workflow_run_id
            )

        finally:
            # 9. Ensure Cleanup occurs
            cleanup_workspace(workspace_path)

        # 10. Map Execution Status outcomes
        status_outcome = "SUCCESS"
        if timed_out:
            status_outcome = "TIMEOUT"
            self._log_security_event(
                db=db,
                project_id=execution.project_id,
                execution_id=execution_id,
                action="TIMEOUT",
                message="Subprocess execution timed out.",
                task_id=execution.task_id,
                run_id=execution.workflow_run_id
            )
        elif resource_limited:
            status_outcome = "RESOURCE_LIMIT"
            self._log_security_event(
                db=db,
                project_id=execution.project_id,
                execution_id=execution_id,
                action="RESOURCE_LIMIT_REACHED",
                message="Execution truncated due to output limits.",
                task_id=execution.task_id,
                run_id=execution.workflow_run_id
            )
        elif exit_code != 0:
            status_outcome = "FAILED"

        # 11. Persist Results
        execution.status = status_outcome
        execution.completed_at = datetime.utcnow()
        
        duration = int((execution.completed_at - execution.started_at).total_seconds() * 1000)

        db_res = ExecutionResult(
            execution_id=execution_id,
            exit_code=exit_code,
            stdout=stdout,
            stderr=stderr,
            duration_ms=duration,
            timed_out=timed_out,
            resource_limited=resource_limited
        )
        db.add(db_res)
        db.commit()

        return {
            "execution_id": execution_id,
            "status": status_outcome,
            "exit_code": exit_code,
            "stdout": stdout,
            "stderr": stderr,
            "duration_ms": duration,
            "timed_out": timed_out,
            "resource_limited": resource_limited
        }

    def _save_error_result(self, db: Session, execution_id: str, error_message: str):
        """Saves system rejection output traces"""
        db_res = ExecutionResult(
            execution_id=execution_id,
            exit_code=1,
            stdout="",
            stderr=error_message,
            duration_ms=0,
            timed_out=False,
            resource_limited=False
        )
        db.add(db_res)
        db.commit()

# Global manager instance
sandbox_manager = SandboxManager()
