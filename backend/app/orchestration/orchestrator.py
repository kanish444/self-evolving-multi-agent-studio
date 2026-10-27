import uuid
import time
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from ..core.database import SessionLocal
from ..models.orchestration import WorkflowRun, AgentExecution, AgentHandoff, Approval
from ..models.task import Task
from ..models.log import Log
from ..models.project import Project
from ..models.autonomous import DevelopmentIteration, ArtifactVersion, FailureAnalysis, FixAttempt, LearningCandidate, AutonomyPolicy
from .agent_registry import registry
from .agents.base import AgentRequest


logger = logging.getLogger("app.orchestration.orchestrator")

class Orchestrator:
    def __init__(self):
        self.max_agent_attempts = 3
        self.max_debug_cycles = 3

    def _update_db_agent_status(self, db: Session, role: str, status: str):
        mappings = {
            "PROJECT_MANAGER": "PM",
            "PM": "PM",
            "ARCHITECT": "Architect",
            "DEVELOPER": "Developer",
            "TESTER": "Tester",
            "DEBUGGER": "Debugger",
            "REVIEWER": "Reviewer",
            "EVOLUTION": "Evolution",
            "MEMORY": "Memory",
            "SYSTEM": "System"
        }
        agent_id = mappings.get(role.upper(), role)
        if agent_id:
            from ..models.agent import Agent
            from sqlalchemy import func
            agent = db.query(Agent).filter(
                (Agent.id == agent_id) | (func.lower(Agent.id) == agent_id.lower())
            ).first()
            if agent:
                agent.status = status
                db.commit()


    def _log_event(
        self,
        db: Session,
        project_id: str,
        run_id: str,
        action: str,
        message: str,
        type_: str = "INFO",
        status: str = "RUNNING",
        task_id: Optional[str] = None,
        agent_role: Optional[str] = None,
        trace_id: Optional[str] = None,
        correlation_id: Optional[str] = None
    ):
        """Helper to create log entries consistent with Phase 8 Logs & Observability"""
        timestamp_str = datetime.now().strftime("%H:%M:%S")
        log_id = f"evt-{uuid.uuid4().hex[:8]}"
        trace = trace_id or f"trace_{run_id[-8:]}"
        corr = correlation_id or f"corr_{run_id[-8:]}"
        
        log_entry = Log(
            id=log_id,
            project_id=project_id,
            agent_id=agent_role,
            task_id=task_id,
            type=type_,
            status=status,
            action=action,
            message=message,
            trace_id=trace,
            correlation_id=corr,
            timestamp=timestamp_str
        )
        db.add(log_entry)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Error persisting orchestrator event log: {e}")

    def start_workflow(self, project_id: str, requirement: str, db: Session) -> WorkflowRun:
        """Initializes a workflow run and schedules requirements analysis"""
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        
        # Check if project exists
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project not found: {project_id}")

        run = WorkflowRun(
            id=run_id,
            project_id=project_id,
            status="RUNNING",
            current_state="CREATED",
            current_agent="PROJECT_MANAGER"
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        self._log_event(
            db=db,
            project_id=project_id,
            run_id=run_id,
            action="WORKFLOW_STARTED",
            message=f"Orchestrator started multi-agent workflow for project {project_id}. Requirement: '{requirement}'"
        )

        # Create first task for requirement scoping
        task_id = f"task-{uuid.uuid4().hex[:8]}"
        pm_task = Task(
            id=task_id,
            project_id=project_id,
            workflow_run_id=run_id,
            agent_role="PROJECT_MANAGER",
            title="Scope Project Requirements",
            description=f"Decompose requirement: '{requirement}'",
            status="READY",
            priority="HIGH",
            input_context=json.dumps({"requirement": requirement}),
            attempt_count=0
        )
        db.add(pm_task)
        db.commit()

        self._log_event(
            db=db,
            project_id=project_id,
            run_id=run_id,
            action="TASK_CREATED",
            message=f"Created requirement scoping task: {task_id}",
            task_id=task_id,
            agent_role="PROJECT_MANAGER"
        )

        # Update run to active state
        run.current_state = "REQUIREMENT_ANALYSIS"
        db.commit()
        db.refresh(run)

        self._log_event(
            db=db,
            project_id=project_id,
            run_id=run_id,
            action="WORKFLOW_STATE_CHANGED",
            message="Workflow transitioned to REQUIREMENT_ANALYSIS"
        )

        return run

    def run_workflow(self, run_id: str):
        """The main asynchronous processing loop, executing sequential agent steps in background"""
        db = SessionLocal()
        try:
            # Load run
            run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
            if not run or run.status != "RUNNING":
                return

            # Keep execution sequential
            while run.status == "RUNNING":
                # Find task assigned to the current active agent role that is READY
                active_agent_role = run.current_agent
                if not active_agent_role:
                    # Workflow is paused or waiting for human input
                    break

                task = db.query(Task).filter(
                    Task.workflow_run_id == run_id,
                    Task.agent_role == active_agent_role,
                    Task.status.in_(["READY", "PENDING"])
                ).first()

                if not task:
                    # No ready task. Create one dynamically if needed based on state, or complete run.
                    if run.current_state == "COMPLETED" or run.current_state == "FAILED":
                        break
                    else:
                        logger.warning(f"No pending/ready tasks in active state '{run.current_state}' for role '{active_agent_role}'")
                        break

                # Execute this task
                success = self._execute_task(db, run, task)
                if not success:
                    # FAILED or WAITING_FOR_HUMAN, exit loop
                    break

                db.refresh(run)
        except Exception as e:
            logger.error(f"Error in background workflow orchestration loop: {e}", exc_info=True)
        finally:
            db.close()

    def _execute_task(self, db: Session, run: WorkflowRun, task: Task) -> bool:
        """Executes a single agent task including Hand-offs, retries, and schema validation"""
        agent_role = task.agent_role
        agent = registry.get_agent(agent_role)
        if not agent:
            task.status = "FAILED"
            run.status = "FAILED"
            run.error_message = f"Agent not found in registry for role: {agent_role}"
            db.commit()
            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="AGENT_FAILED", message=run.error_message,
                task_id=task.id, agent_role=agent_role, type_="ERROR", status="FAILED"
            )
            return False

        # Check if already approved by human operator
        from ..models.governance import ApprovalRequest, GovernedAction
        
        approved_req = db.query(ApprovalRequest).join(GovernedAction).filter(
            GovernedAction.resource == task.id,
            ApprovalRequest.status == "APPROVED"
        ).first()
        
        if not approved_req:
            # Evaluate policy engine boundary for agent role
            from ..governance.policy_engine import PolicyEngine
            
            evaluation = PolicyEngine.evaluate(
                actor_type="AGENT",
                actor_id=agent_role.lower(),
                action_type=task.agent_role.upper(),
                project_id=run.project_id,
                environment="DEVELOPMENT",
                resource=task.id,
                db=db
            )
            
            if evaluation["decision"] == "DENY":
                task.status = "FAILED"
                run.status = "FAILED"
                run.error_message = f"Governance policy blocked agent execution: {evaluation['reason']}"
                db.commit()
                
                # Log violation record
                from ..models.governance import PolicyViolation
                vio_id = f"vio-{uuid.uuid4().hex[:8]}"
                violation = PolicyViolation(
                    id=vio_id,
                    actor_type="AGENT",
                    actor_id=agent_role.lower(),
                    action=task.agent_role.upper(),
                    severity="HIGH",
                    description=run.error_message,
                    detected_at=datetime.utcnow(),
                    status="DETECTED"
                )
                db.add(violation)
                db.commit()
                
                self._log_event(
                    db=db, project_id=run.project_id, run_id=run.id,
                    action="GOVERNANCE_BLOCKED", message=run.error_message,
                    task_id=task.id, agent_role=agent_role, type_="ERROR", status="FAILED"
                )
                return False
                
            elif evaluation["decision"] == "APPROVAL_REQUIRED":
                from ..governance.approval_engine import ApprovalEngine
                
                app_req = ApprovalEngine.create_approval_request(
                    actor_type="AGENT",
                    actor_id=agent_role.lower(),
                    action_type=task.agent_role.upper(),
                    project_id=run.project_id,
                    environment="DEVELOPMENT",
                    resource=task.id,
                    risk_level=evaluation["risk_level"],
                    reason=evaluation["reason"],
                    policy_id=evaluation.get("policy_id"),
                    db=db
                )
                
                task.status = "PENDING"
                run.status = "PAUSED"
                db.commit()
                
                self._log_event(
                    db=db, project_id=run.project_id, run_id=run.id,
                    action="APPROVAL_REQUIRED", message=f"Agent task execution requires approval: {evaluation['reason']}",
                    task_id=task.id, agent_role=agent_role, type_="WARNING", status="PAUSED"
                )
                return False

        # Transition task to RUNNING
        task.status = "RUNNING"
        task.started_at = datetime.utcnow()
        db.commit()
        self._update_db_agent_status(db, agent_role, "RUNNING")

        # Autonomous Loop State Integrations
        active_iter = db.query(DevelopmentIteration)\
                        .filter(DevelopmentIteration.workflow_run_id == run.id)\
                        .order_by(DevelopmentIteration.iteration_number.desc())\
                        .first()

        if agent_role.upper() == "DEVELOPER":
            from ..autonomous.loop_controller import DevelopmentLoopController
            from ..autonomous.iteration_manager import IterationManager
            
            # Check limits before starting iteration
            is_allowed, halt_reason = DevelopmentLoopController.check_limits(run.project_id, run.id, db)
            if not is_allowed:
                DevelopmentLoopController.trigger_fail_safe(run.id, halt_reason, db)
                return False
                
            if not active_iter or active_iter.status in ["PASSED", "COMPLETED", "FAILED", "ABANDONED"]:
                iter_num = (active_iter.iteration_number + 1) if active_iter else 1
                active_iter = IterationManager.start_iteration(
                    project_id=run.project_id,
                    workflow_run_id=run.id,
                    goal=task.title,
                    iteration_number=iter_num,
                    parent_iteration_id=active_iter.id if active_iter else None,
                    db=db
                )
            
            active_iter.status = "DEVELOPING"
            db.commit()

        elif agent_role.upper() == "TESTER" and active_iter:
            active_iter.status = "TESTING"
            db.commit()

        elif agent_role.upper() == "DEBUGGER" and active_iter:
            active_iter.status = "DEBUGGING"
            db.commit()

        elif agent_role.upper() == "REVIEWER" and active_iter:
            active_iter.status = "REVIEWING"
            db.commit()


        self._log_event(
            db=db, project_id=run.project_id, run_id=run.id,
            action="AGENT_STARTED", message=f"{agent_role} Agent starting task: {task.title}",
            task_id=task.id, agent_role=agent_role
        )

        trace_id = f"trace_{run.id[-8:]}"
        corr_id = f"corr_{run.id[-8:]}"
        
        # Prepare context payload
        input_data = {}
        if task.input_context:
            try:
                input_data = json.loads(task.input_context)
            except Exception:
                pass

        if active_iter:
            input_data["iteration_id"] = active_iter.id

        # Execute agent with retries and latency calculation
        attempt = 1
        agent_result = None
        start_time = time.time()

        while attempt <= self.max_agent_attempts:
            try:
                task.attempt_count = attempt
                db.commit()

                # Build request payload
                req = AgentRequest(
                    project_id=run.project_id,
                    task_id=task.id,
                    agent_role=agent_role,
                    objective=task.description or task.title,
                    context=input_data
                )

                # Execute target agent using Phase 10 validation pathway
                import asyncio
                agent_result = asyncio.run(agent.execute(req, db))
                
                if agent_result.status == "completed" or agent_result.status == "failed":
                    break
            except Exception as ex:
                logger.error(f"Attempt {attempt} failed executing {agent_role} Agent: {ex}")
                attempt += 1
                if attempt > self.max_agent_attempts:
                    task.status = "FAILED"
                    run.status = "FAILED"
                    run.error_message = f"Max execution retries exceeded for agent {agent_role}: {ex}"
                    db.commit()
                    self._log_event(
                        db=db, project_id=run.project_id, run_id=run.id,
                        action="AGENT_FAILED", message=run.error_message,
                        task_id=task.id, agent_role=agent_role, type_="ERROR", status="FAILED"
                    )
                    return False
                time.sleep(1)

        latency_ms = int((time.time() - start_time) * 1000)

        # Log agent execution tracking entry
        exec_id = f"exec-{uuid.uuid4().hex[:8]}"
        db_exec = AgentExecution(
            id=exec_id,
            workflow_run_id=run.id,
            agent_role=agent_role,
            task_id=task.id,
            input_reference=task.input_context,
            output_reference=json.dumps(agent_result.output) if agent_result else None,
            status=agent_result.status.upper() if agent_result else "FAILED",
            attempt_number=attempt,
            latency_ms=latency_ms
        )
        db.add(db_exec)
        db.commit()

        # Handle agent execution outputs
        if not agent_result or agent_result.status == "failed":
            # Handle simulated failures (e.g. Tester failure)
            if run.current_state == "TESTING" and agent_result and agent_result.status == "failed":
                # Tester simulated concurrency deadlock
                task.status = "FAILED"
                task.completed_at = datetime.utcnow()
                task.output_reference = json.dumps(agent_result.output)
                db.commit()
                self._update_db_agent_status(db, agent_role, "FAILED")
                
                # Intercept with DevelopmentIteration FAILED updates
                if active_iter:
                    active_iter.status = "FAILED"
                    # Capture traceback
                    failed_test_info = agent_result.output.get("failed_test", {}) if agent_result else {}
                    err_msg = failed_test_info.get("error_message", "AssertionError SQLite concurrency booking deadlock")
                    active_iter.failure_summary = err_msg
                    db.commit()
                    
                    # Associate sandbox execution reference
                    from ..models.sandbox import Execution
                    db_exec_ref = db.query(Execution).filter(Execution.task_id == task.id).order_by(Execution.created_at.desc()).first()
                    if db_exec_ref:
                        active_iter.execution_id = db_exec_ref.id
                        db.commit()
                        
                    # Classify failure type
                    from ..autonomous.failure_classifier import FailureClassifier
                    from ..autonomous.loop_controller import DevelopmentLoopController
                    from ..autonomous.policies import PolicyEngine
                    
                    exit_code = 1
                    stdout = ""
                    stderr = err_msg
                    timed_out = False
                    resource_limited = False
                    if db_exec_ref and db_exec_ref.result:
                        exit_code = db_exec_ref.result.exit_code or 1
                        stdout = db_exec_ref.result.stdout or ""
                        stderr = db_exec_ref.result.stderr or ""
                        timed_out = db_exec_ref.result.timed_out
                        resource_limited = db_exec_ref.result.resource_limited
                        
                    cls_type = FailureClassifier.classify_failure(exit_code, stdout, stderr, timed_out, resource_limited)
                    
                    # Failure Routing logic
                    if cls_type == "SECURITY_VIOLATION":
                        active_iter.status = "ABANDONED"
                        db.commit()
                        DevelopmentLoopController.trigger_fail_safe(run.id, "SECURITY_VIOLATION_HALT", db)
                        return False
                    elif cls_type in ["CONFIGURATION_ERROR", "UNKNOWN"]:
                        active_iter.status = "WAITING_FOR_HUMAN"
                        db.commit()
                        DevelopmentLoopController.trigger_fail_safe(run.id, f"CONFIGURATION_OR_UNKNOWN_ERROR: {cls_type}", db)
                        return False
                    elif cls_type == "DEPENDENCY_ERROR":
                        active_iter.status = "WAITING_FOR_HUMAN"
                        db.commit()
                        DevelopmentLoopController.trigger_fail_safe(run.id, "DEPENDENCY_ERROR_HALT", db)
                        return False
                    elif cls_type == "RESOURCE_LIMIT":
                        active_iter.status = "WAITING_FOR_HUMAN"
                        db.commit()
                        DevelopmentLoopController.trigger_fail_safe(run.id, "RESOURCE_LIMIT_EXCEEDED_HALT", db)
                        return False
                    elif cls_type == "REQUIREMENT_MISMATCH":
                        active_iter.status = "ABANDONED"
                        db.commit()
                        
                        run.current_state = "REQUIREMENT_ANALYSIS"
                        run.current_agent = "PROJECT_MANAGER"
                        db.commit()
                        
                        next_task_id = f"task-{uuid.uuid4().hex[:8]}"
                        db_next = Task(
                            id=next_task_id,
                            project_id=run.project_id,
                            workflow_run_id=run.id,
                            agent_role="PROJECT_MANAGER",
                            title="Resolve Requirement Mismatch",
                            description="Resolve mismatch between implemented features and target specs.",
                            status="READY",
                            priority="HIGH",
                            input_context=json.dumps({"requirement": err_msg}),
                            attempt_count=0
                        )
                        db.add(db_next)
                        db.commit()
                        
                        self._log_event(
                            db=db, project_id=run.project_id, run_id=run.id,
                            action="AGENT_HANDOFF", message="Handoff: TESTER -> PROJECT_MANAGER (Requirement Mismatch)",
                            task_id=task.id, agent_role=agent_role
                        )
                        return True

                    # Run loop protections: detect repeated failure loop
                    if DevelopmentLoopController.detect_repeated_failure(run.id, db):
                        active_iter.status = "ABANDONED"
                        db.commit()
                        DevelopmentLoopController.trigger_fail_safe(run.id, "REPEATED_FAILURE_LIMIT_HALT", db)
                        return False

                    # Check debug cycle count limit
                    debugging_tasks = db.query(Task).filter(
                        Task.workflow_run_id == run.id,
                        Task.agent_role == "DEBUGGER"
                    ).all()
                    
                    if len(debugging_tasks) >= self.max_debug_cycles:
                        active_iter.status = "ABANDONED"
                        db.commit()
                        DevelopmentLoopController.trigger_fail_safe(run.id, "MAX_DEBUG_CYCLES_EXCEEDED", db)
                        return False

                    # Regression checks
                    is_regression = False
                    regression_details = ""
                    if active_iter.iteration_number > 1:
                        prev_iter = db.query(DevelopmentIteration).filter(
                            DevelopmentIteration.workflow_run_id == run.id,
                            DevelopmentIteration.iteration_number == active_iter.iteration_number - 1
                        ).first()
                        if prev_iter:
                            from ..models.test_result import TestResult
                            prev_tests = db.query(TestResult).filter(TestResult.iteration_id == prev_iter.id).all()
                            curr_tests = db.query(TestResult).filter(TestResult.iteration_id == active_iter.id).all()
                            
                            prev_passed = {t.name for t in prev_tests if t.status == "PASSED"}
                            curr_failed = {t.name for t in curr_tests if t.status == "FAILED"}
                            
                            regressed_tests = prev_passed.intersection(curr_failed)
                            if regressed_tests:
                                is_regression = True
                                regression_details = f"Regression detected: {', '.join(regressed_tests)} passed previously but are now failing."
                                logger.warning(regression_details)
                                
                                self._log_event(
                                    db=db, project_id=run.project_id, run_id=run.id,
                                    action="REGRESSION_DETECTED", message=regression_details,
                                    task_id=task.id, agent_role=agent_role, type_="ERROR", status="FAILED"
                                )

                    # Validate checkpoint approval requirements
                    change_category = "architecture"
                    if cls_type == "DEPENDENCY_ERROR":
                        change_category = "dependencies"
                    elif cls_type == "SECURITY_VIOLATION":
                        change_category = "security"

                    if PolicyEngine.is_approval_required(run.project_id, change_category, db):
                        active_iter.status = "WAITING_FOR_HUMAN"
                        db.commit()
                        
                        run.current_state = "WAITING_FOR_HUMAN"
                        run.status = "PAUSED"
                        run.current_agent = None
                        db.commit()
                        
                        approval_id = f"appr-{uuid.uuid4().hex[:8]}"
                        db_appr = Approval(
                            id=approval_id,
                            workflow_run_id=run.id,
                            task_id=task.id,
                            status="PENDING",
                            requested_by="TESTER"
                        )
                        db.add(db_appr)
                        db.commit()
                        
                        self._log_event(
                            db=db, project_id=run.project_id, run_id=run.id,
                            action="APPROVAL_REQUIRED", message=f"Approval Checkpoint required: classified failure is {cls_type}.",
                            task_id=task.id, agent_role=agent_role, type_="WARNING", status="WAITING"
                        )
                        return False
                
                # Check maximum debug iterations loop limit (fallback backup safeguard check)
                debugging_tasks = db.query(Task).filter(
                    Task.workflow_run_id == run.id,
                    Task.agent_role == "DEBUGGER"
                ).all()
                if len(debugging_tasks) >= self.max_debug_cycles:
                    # Cap loops and wait for human
                    run.current_state = "WAITING_FOR_HUMAN"
                    run.status = "PAUSED"
                    run.current_agent = None
                    db.commit()
                    return False
                
                # Hand off to Debugger
                failed_test_info = agent_result.output.get("failed_test", {})
                
                # Create handoff payload
                handoff_payload = {
                    "from_agent": "TESTER",
                    "to_agent": "DEBUGGER",
                    "project_id": run.project_id,
                    "task_id": task.id,
                    "objective": "Debug database locking issue",
                    "error_message": failed_test_info.get("error_message"),
                    "stack_trace": failed_test_info.get("traceback"),
                    "code": input_data.get("code", ""),
                    "task_info": f"Test run attempt {len(debugging_tasks)+1}",
                    "is_regression": is_regression if 'is_regression' in locals() else False,
                    "regression_details": regression_details if 'regression_details' in locals() else ""
                }
                
                handoff_id = f"ho-{uuid.uuid4().hex[:8]}"
                db_handoff = AgentHandoff(
                    id=handoff_id,
                    workflow_run_id=run.id,
                    from_agent="TESTER",
                    to_agent="DEBUGGER",
                    task_id=task.id,
                    payload_reference=json.dumps(handoff_payload)
                )
                db.add(db_handoff)
                
                # Create Debugger Task
                debug_task_id = f"task-{uuid.uuid4().hex[:8]}"
                db_debug_task = Task(
                    id=debug_task_id,
                    project_id=run.project_id,
                    workflow_run_id=run.id,
                    agent_role="DEBUGGER",
                    title="Diagnose SQLite Concurrency Lock",
                    description="Isolate probable root cause and provide patch suggestions.",
                    status="READY",
                    priority="HIGH",
                    input_context=json.dumps(handoff_payload),
                    attempt_count=0
                )
                db.add(db_debug_task)
                
                # Update run state
                run.current_state = "DEBUGGING"
                run.current_agent = "DEBUGGER"
                db.commit()
                
                self._log_event(
                    db=db, project_id=run.project_id, run_id=run.id,
                    action="AGENT_HANDOFF", message="Handoff: TESTER -> DEBUGGER",
                    task_id=task.id, agent_role=agent_role
                )
                self._log_event(
                    db=db, project_id=run.project_id, run_id=run.id,
                    action="WORKFLOW_STATE_CHANGED", message="Workflow transitioned to DEBUGGING"
                )
                return True
            else:
                task.status = "FAILED"
                run.status = "FAILED"
                run.error_message = agent_result.summary if agent_result else "Execution failed."
                db.commit()
                self._update_db_agent_status(db, agent_role, "FAILED")
                self._log_event(
                    db=db, project_id=run.project_id, run_id=run.id,
                    action="AGENT_FAILED", message=run.error_message,
                    task_id=task.id, agent_role=agent_role, type_="ERROR", status="FAILED"
                )
                return False

        # Success - Transition task to COMPLETED
        task.status = "COMPLETED"
        task.completed_at = datetime.utcnow()
        task.output_reference = json.dumps(agent_result.output)
        db.commit()
        self._update_db_agent_status(db, agent_role, "COMPLETED")

        # Sync code revisions, test result metrics, and evolutionary learning entries
        if agent_role.upper() == "DEVELOPER":
            try:
                from ..autonomous.fix_manager import FixManager
                parent_art = db.query(ArtifactVersion).filter(ArtifactVersion.project_id == run.project_id).order_by(ArtifactVersion.version.desc()).first()
                parent_id = parent_art.id if parent_art else None
                
                dev_out = json.loads(task.output_reference)
                files_map = { dev_out.get("file_path", "vehicle_service.py"): dev_out.get("code", "") }
                
                art_ver = FixManager.apply_patch_to_artifact(
                    project_id=run.project_id,
                    task_id=task.id,
                    parent_artifact_id=parent_id,
                    changed_files=files_map,
                    change_summary=dev_out.get("purpose", "Auto-applied code revisions."),
                    created_by_agent="DEVELOPER",
                    db=db
                )
                if active_iter:
                    active_iter.artifact_id = art_ver.id
                    db.commit()
            except Exception as e:
                logger.error(f"Error persisting artifact version details: {e}")

        elif agent_role.upper() == "TESTER":
            if active_iter:
                active_iter.status = "PASSED"
                from ..models.sandbox import Execution
                db_exec_ref = db.query(Execution).filter(Execution.task_id == task.id).order_by(Execution.created_at.desc()).first()
                if db_exec_ref:
                    active_iter.execution_id = db_exec_ref.id
                db.commit()

        elif agent_role.upper() == "DEBUGGER":
            try:
                from ..models.autonomous import FailureAnalysis
                from ..models.sandbox import Execution
                db_exec_ref = db.query(Execution).filter(Execution.project_id == run.project_id).order_by(Execution.created_at.desc()).first()
                exec_id = db_exec_ref.id if db_exec_ref else "exec-dummy"
                
                debug_out = json.loads(task.output_reference)
                
                db_analysis = FailureAnalysis(
                    id=f"fa-{uuid.uuid4().hex[:8]}",
                    execution_id=exec_id,
                    failure_type="CODE_ERROR",
                    summary=debug_out.get("summary", "SQLite deadlock booking database failures"),
                    root_cause=debug_out.get("root_cause", "Writes deadlock during concurrent transaction commit calls"),
                    affected_files=json.dumps(debug_out.get("affected_files", ["vehicle_service.py"])),
                    recommended_fix=debug_out.get("recommended_fix", "Wrapped transactional operations in mutex retries"),
                    confidence=debug_out.get("confidence", 0.95),
                    risk_level=debug_out.get("risk_level", "LOW")
                )
                db.add(db_analysis)
                db.commit()
                
                if active_iter:
                    active_iter.status = "FIXING"
                    db.commit()
            except Exception as e:
                logger.error(f"Error persisting failure analysis: {e}")

        elif agent_role.upper() == "EVOLUTION":
            try:
                from ..models.autonomous import LearningCandidate
                db_candidate = LearningCandidate(
                    id=f"lc-{uuid.uuid4().hex[:8]}",
                    project_id=run.project_id,
                    problem="Concurrent SQLite database writes deadlock",
                    root_cause="SQLite default isolation transactions lock DB file during concurrent operations",
                    solution="Wrap transactions in backoff retry loop handlers",
                    learning="Always implement retry queues when using SQLite concurrently"
                )
                db.add(db_candidate)
                db.commit()
                
                if active_iter:
                    active_iter.status = "COMPLETED"
                    active_iter.learning_reference = db_candidate.id
                    db.commit()
            except Exception as e:
                logger.error(f"Error persisting learning candidate: {e}")


        self._log_event(
            db=db, project_id=run.project_id, run_id=run.id,
            action="AGENT_COMPLETED", message=f"{agent_role} Agent completed task: {task.title}",
            task_id=task.id, agent_role=agent_role
        )

        # State transition router based on agent results
        next_action = agent_result.next_action
        
        if next_action == "human_approval" or agent_result.requires_human:
            # Pause workflow for checkpoint approval
            run.current_state = "WAITING_FOR_HUMAN"
            run.status = "PAUSED"
            run.current_agent = None
            db.commit()

            # Create Approval record
            approval_id = f"appr-{uuid.uuid4().hex[:8]}"
            db_appr = Approval(
                id=approval_id,
                workflow_run_id=run.id,
                task_id=task.id,
                status="PENDING",
                requested_by=agent_role
            )
            db.add(db_appr)
            db.commit()

            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="APPROVAL_REQUIRED", message=f"Approval Checkpoint required for {agent_role} deliverables.",
                task_id=task.id, agent_role=agent_role, type_="WARNING", status="WAITING"
            )
            return False

        elif next_action == "planning":
            # PM requirements analysis done -> प्लानिंग task
            next_task_id = f"task-{uuid.uuid4().hex[:8]}"
            db_next = Task(
                id=next_task_id,
                project_id=run.project_id,
                workflow_run_id=run.id,
                agent_role="PROJECT_MANAGER",
                title="Create Project Development Plan",
                description="Formulate modules, task lists, and dependency structures.",
                status="READY",
                priority="HIGH",
                input_context=json.dumps({"requirement": input_data.get("requirement", "")}),
                attempt_count=0
            )
            db.add(db_next)
            
            run.current_state = "PLANNING"
            run.current_agent = "PROJECT_MANAGER"
            db.commit()

            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="WORKFLOW_STATE_CHANGED", message="Workflow transitioned to PLANNING"
            )
            return True

        elif next_action == "architecture":
            # Planning done -> architect task
            next_task_id = f"task-{uuid.uuid4().hex[:8]}"
            db_next = Task(
                id=next_task_id,
                project_id=run.project_id,
                workflow_run_id=run.id,
                agent_role="ARCHITECT",
                title="Design System Architecture Directives",
                description="Specify REST patterns, SQLite databases constraints, and framework components.",
                status="READY",
                priority="HIGH",
                input_context=json.dumps({"requirement": input_data.get("requirement", "")}),
                attempt_count=0
            )
            db.add(db_next)

            run.current_state = "ARCHITECTURE"
            run.current_agent = "ARCHITECT"
            db.commit()

            # Persist PM -> Architect handoff
            handoff_id = f"ho-{uuid.uuid4().hex[:8]}"
            db_handoff = AgentHandoff(
                id=handoff_id,
                workflow_run_id=run.id,
                from_agent="PROJECT_MANAGER",
                to_agent="ARCHITECT",
                task_id=task.id,
                payload_reference=task.output_reference
            )
            db.add(db_handoff)
            db.commit()

            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="AGENT_HANDOFF", message="Handoff: PROJECT_MANAGER -> ARCHITECT",
                task_id=task.id, agent_role=agent_role
            )
            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="WORKFLOW_STATE_CHANGED", message="Workflow transitioned to ARCHITECTURE"
            )
            return True

        elif next_action == "developer":
            # Debugger suggested patch -> Hand off to Developer to re-apply code modifications
            debug_out = agent_result.output
            
            next_task_id = f"task-{uuid.uuid4().hex[:8]}"
            db_next = Task(
                id=next_task_id,
                project_id=run.project_id,
                workflow_run_id=run.id,
                agent_role="DEVELOPER",
                title="Apply Debugger Concurrency Fix",
                description="Integrate SQLite thread-safe lock wrappers suggested patch.",
                status="READY",
                priority="HIGH",
                input_context=json.dumps({
                    "language": "python",
                    "framework": "fastapi",
                    "requirements": f"Apply fix patch: {debug_out.get('suggested_fix')}. Affected component: {debug_out.get('affected_component')}"
                }),
                attempt_count=0
            )
            db.add(db_next)

            run.current_state = "DEVELOPMENT"
            run.current_agent = "DEVELOPER"
            db.commit()

            # Debugger -> Developer handoff
            handoff_id = f"ho-{uuid.uuid4().hex[:8]}"
            db_handoff = AgentHandoff(
                id=handoff_id,
                workflow_run_id=run.id,
                from_agent="DEBUGGER",
                to_agent="DEVELOPER",
                task_id=task.id,
                payload_reference=task.output_reference
            )
            db.add(db_handoff)
            db.commit()

            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="AGENT_HANDOFF", message="Handoff: DEBUGGER -> DEVELOPER",
                task_id=task.id, agent_role=agent_role
            )
            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="WORKFLOW_STATE_CHANGED", message="Workflow transitioned to DEVELOPMENT"
            )
            return True

        elif next_action == "review":
            # Testing passed -> Hand off to Reviewer
            tester_out = agent_result.output
            
            # Fetch Developer code output context from previous development tasks
            dev_task = db.query(Task).filter(
                Task.workflow_run_id == run.id,
                Task.agent_role == "DEVELOPER",
                Task.status == "COMPLETED"
            ).order_by(Task.completed_at.desc()).first()
            
            code_val = ""
            if dev_task and dev_task.output_reference:
                try:
                    code_val = json.loads(dev_task.output_reference).get("code", "")
                except Exception:
                    pass

            next_task_id = f"task-{uuid.uuid4().hex[:8]}"
            db_next = Task(
                id=next_task_id,
                project_id=run.project_id,
                workflow_run_id=run.id,
                agent_role="REVIEWER",
                title="Audit Code Base Quality & Security",
                description="Perform strict static review compliance verification.",
                status="READY",
                priority="HIGH",
                input_context=json.dumps({"code": code_val}),
                attempt_count=0
            )
            db.add(db_next)

            run.current_state = "REVIEW"
            run.current_agent = "REVIEWER"
            db.commit()

            # Tester -> Reviewer handoff
            handoff_id = f"ho-{uuid.uuid4().hex[:8]}"
            db_handoff = AgentHandoff(
                id=handoff_id,
                workflow_run_id=run.id,
                from_agent="TESTER",
                to_agent="REVIEWER",
                task_id=task.id,
                payload_reference=task.output_reference
            )
            db.add(db_handoff)
            db.commit()

            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="AGENT_HANDOFF", message="Handoff: TESTER -> REVIEWER",
                task_id=task.id, agent_role=agent_role
            )
            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="WORKFLOW_STATE_CHANGED", message="Workflow transitioned to REVIEW"
            )
            return True

        elif next_action == "evolution":
            # Review done -> Hand off to Evolution
            reviewer_out = agent_result.output
            
            # Retrieve bug/fix logs to provide telemetry context
            debug_task = db.query(Task).filter(
                Task.workflow_run_id == run.id,
                Task.agent_role == "DEBUGGER",
                Task.status == "COMPLETED"
            ).first()
            
            bugs_desc = "SQLite concurrency write lock OperationalError" if debug_task else "None"
            fixes_desc = "Thread-safe mutex serialize queue wrapper" if debug_task else "None"

            next_task_id = f"task-{uuid.uuid4().hex[:8]}"
            db_next = Task(
                id=next_task_id,
                project_id=run.project_id,
                workflow_run_id=run.id,
                agent_role="EVOLUTION",
                title="Synthesize Iteration Telemetry & Learnt Rules",
                description="Extract lessons, isolate patterns, and commit guidelines to memory bank.",
                status="READY",
                priority="HIGH",
                input_context=json.dumps({
                    "iteration_id": "it-P001-3",
                    "test_results": "Simulated stress tests PASSED successfully",
                    "bugs": bugs_desc,
                    "fixes": fixes_desc,
                    "review_results": json.dumps(reviewer_out)
                }),
                attempt_count=0
            )
            db.add(db_next)

            run.current_state = "EVOLUTION"
            run.current_agent = "EVOLUTION"
            db.commit()

            # Reviewer -> Evolution handoff
            handoff_id = f"ho-{uuid.uuid4().hex[:8]}"
            db_handoff = AgentHandoff(
                id=handoff_id,
                workflow_run_id=run.id,
                from_agent="REVIEWER",
                to_agent="EVOLUTION",
                task_id=task.id,
                payload_reference=task.output_reference
            )
            db.add(db_handoff)
            db.commit()

            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="AGENT_HANDOFF", message="Handoff: REVIEWER -> EVOLUTION",
                task_id=task.id, agent_role=agent_role
            )
            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="WORKFLOW_STATE_CHANGED", message="Workflow transitioned to EVOLUTION"
            )
            return True

        elif next_action == "completed":
            # Evolution done -> Complete workflow run
            run.current_state = "COMPLETED"
            run.status = "COMPLETED"
            run.current_agent = None
            run.completed_at = datetime.utcnow()
            db.commit()

            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="WORKFLOW_COMPLETED", message="Orchestration completed successfully. Project and memories synchronized.",
                status="COMPLETED"
            )
            return True
            
        return False

    def submit_approval(self, run_id: str, task_id: str, status: str, comments: Optional[str], db: Session) -> Approval:
        """Processes user decisions at human checkpoints, resuming or rolling back execution states"""
        run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
        if not run:
            raise ValueError(f"WorkflowRun not found: {run_id}")

        approval = db.query(Approval).filter(
            Approval.workflow_run_id == run_id,
            Approval.task_id == task_id,
            Approval.status == "PENDING"
        ).first()

        if not approval:
            raise ValueError(f"No pending approval found for task: {task_id}")

        approval.status = status.upper()
        approval.comments = comments
        approval.approved_by = "HUMAN"
        approval.updated_at = datetime.utcnow()
        db.commit()

        self._log_event(
            db=db, project_id=run.project_id, run_id=run.id,
            action="APPROVAL_REQUIRED", message=f"User submitted approval decision: {status.upper()}.",
            task_id=task_id, status=status.upper()
        )

        if status.upper() == "APPROVED":
            # Resume next execution state
            run.status = "RUNNING"
            
            if approval.requested_by == "ARCHITECT":
                # Create Developer Task
                arch_task = db.query(Task).filter(Task.id == task_id).first()
                
                # Fetch architect suggestions schema
                arch_out = {}
                if arch_task and arch_task.output_reference:
                    try:
                        arch_out = json.loads(arch_task.output_reference)
                    except Exception:
                        pass
                
                dev_task_id = f"task-{uuid.uuid4().hex[:8]}"
                db_next = Task(
                    id=dev_task_id,
                    project_id=run.project_id,
                    workflow_run_id=run.id,
                    agent_role="DEVELOPER",
                    title="Implement Core System Components",
                    description="Generate clean, compliant files based on approved API boundaries.",
                    status="READY",
                    priority="HIGH",
                    input_context=json.dumps({
                        "language": "python",
                        "framework": "fastapi",
                        "requirements": f"Build application components. Architecture guidelines: {arch_out.get('api_structure')}"
                    }),
                    attempt_count=0
                )
                db.add(db_next)

                # Architect -> Developer handoff
                handoff_id = f"ho-{uuid.uuid4().hex[:8]}"
                db_handoff = AgentHandoff(
                    id=handoff_id,
                    workflow_run_id=run.id,
                    from_agent="ARCHITECT",
                    to_agent="DEVELOPER",
                    task_id=task_id,
                    payload_reference=arch_task.output_reference
                )
                db.add(db_handoff)

                run.current_state = "DEVELOPMENT"
                run.current_agent = "DEVELOPER"
                db.commit()

                self._log_event(
                    db=db, project_id=run.project_id, run_id=run.id,
                    action="AGENT_HANDOFF", message="Handoff: ARCHITECT -> DEVELOPER",
                    task_id=task_id, agent_role="ARCHITECT"
                )
                self._log_event(
                    db=db, project_id=run.project_id, run_id=run.id,
                    action="WORKFLOW_STATE_CHANGED", message="Workflow transitioned to DEVELOPMENT"
                )

            elif approval.requested_by == "DEVELOPER":
                # Create Tester Task
                dev_task = db.query(Task).filter(Task.id == task_id).first()
                
                # Fetch developer code schema
                dev_out = {}
                if dev_task and dev_task.output_reference:
                    try:
                        dev_out = json.loads(dev_task.output_reference)
                    except Exception:
                        pass
                
                test_task_id = f"task-{uuid.uuid4().hex[:8]}"
                db_next = Task(
                    id=test_task_id,
                    project_id=run.project_id,
                    workflow_run_id=run.id,
                    agent_role="TESTER",
                    title="Execute Validation Suite",
                    description="Run auto-generated assertions against source code components.",
                    status="READY",
                    priority="HIGH",
                    input_context=json.dumps({
                        "requirement": "Validate vehicle CRUD and slot reservations.",
                        "task_description": "Validate concurrency appointments scheduler",
                        "code": dev_out.get("code", ""),
                        "attempt_number": 1 # First test run attempt (will fail SQLite concurrency)
                    }),
                    attempt_count=0
                )
                db.add(db_next)

                # Developer -> Tester handoff
                handoff_id = f"ho-{uuid.uuid4().hex[:8]}"
                db_handoff = AgentHandoff(
                    id=handoff_id,
                    workflow_run_id=run.id,
                    from_agent="DEVELOPER",
                    to_agent="TESTER",
                    task_id=task_id,
                    payload_reference=dev_task.output_reference
                )
                db.add(db_handoff)

                run.current_state = "TESTING"
                run.current_agent = "TESTER"
                db.commit()

                self._log_event(
                    db=db, project_id=run.project_id, run_id=run.id,
                    action="AGENT_HANDOFF", message="Handoff: DEVELOPER -> TESTER",
                    task_id=task_id, agent_role="DEVELOPER"
                )
                self._log_event(
                    db=db, project_id=run.project_id, run_id=run.id,
                    action="WORKFLOW_STATE_CHANGED", message="Workflow transitioned to TESTING"
                )
        
        elif status.upper() == "REQUEST_CHANGES":
            # Go back to requesting agent with change remarks injected as task input context!
            run.status = "RUNNING"
            req_agent = approval.requested_by
            
            task_to_redo = db.query(Task).filter(Task.id == task_id).first()
            if task_to_redo:
                task_to_redo.status = "READY"
                task_to_redo.attempt_count += 1
                
                # Inject human change suggestions as a context parameter
                try:
                    ctx = json.loads(task_to_redo.input_context or "{}")
                    ctx["human_feedback"] = comments
                    task_to_redo.input_context = json.dumps(ctx)
                except Exception:
                    pass
                
            run.current_state = "ARCHITECTURE" if req_agent == "ARCHITECT" else "DEVELOPMENT"
            run.current_agent = req_agent
            db.commit()
            
            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="WORKFLOW_STATE_CHANGED", message=f"Change requested by human. Rolling back to state: {run.current_state}"
            )

        else: # REJECTED
            # Stop workflow run
            run.status = "FAILED"
            run.current_state = "FAILED"
            run.current_agent = None
            run.error_message = f"Rejected at human checkpoint: {comments}"
            
            task_to_fail = db.query(Task).filter(Task.id == task_id).first()
            if task_to_fail:
                task_to_fail.status = "FAILED"
            
            db.commit()

            self._log_event(
                db=db, project_id=run.project_id, run_id=run.id,
                action="AGENT_FAILED", message=run.error_message,
                task_id=task_id, type_="ERROR", status="FAILED"
            )

        return approval

# Global singleton
orchestrator = Orchestrator()
