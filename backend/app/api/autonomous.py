import json
import difflib
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.autonomous import DevelopmentIteration, ArtifactVersion, FailureAnalysis, AutonomyPolicy
from ..models.orchestration import WorkflowRun, Approval
from ..models.task import Task

from ..autonomous.policies import PolicyEngine
from ..orchestration.orchestrator import orchestrator

router = APIRouter(prefix="/autonomous", tags=["Autonomous Loop"])

# Pydantic Schemas
class StartWorkflowRequest(BaseModel):
    project_id: str
    requirement: str
    autonomy_level: Optional[int] = 1

class PolicyUpdateRequest(BaseModel):
    level: int
    max_iterations: Optional[int] = 5
    max_debug_cycles: Optional[int] = 3
    require_approval_for_dependencies: Optional[bool] = True
    require_approval_for_architecture: Optional[bool] = True
    require_approval_for_security_changes: Optional[bool] = True
    allow_auto_retest: Optional[bool] = True
    allow_auto_fix: Optional[bool] = True

# API Handlers
@router.post("/demo-self-evaluation")
def trigger_demo_self_evaluation(
    project_id: str = "P001",
    db: Session = Depends(get_db)
):
    """
    Executes a real, end-to-end self-evaluating software engineering workflow demonstration:
    - Accepts simple requirement: add two numbers
    - Developer produces candidate implementation
    - Real automated tests run in isolated sandbox workspace
    - SuccessEvaluator analyzes real exit codes & test outputs
    - Controlled correction attempt executed via Debugger and Developer
    - Tests rerun in clean sandbox workspace
    - ResultComparator compares before/after test metrics
    - Persists records to database and returns complete evidence
    """
    from ..autonomous.demonstration import run_self_evaluating_workflow
    try:
        report = run_self_evaluating_workflow(project_id=project_id, db=db)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Self-evaluation workflow execution failed: {str(e)}")

@router.post("/start", status_code=status.HTTP_201_CREATED)
def start_autonomous_loop(
    payload: StartWorkflowRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Spawns a new workflow execution run in autonomous mode.
    """
    # 1. Update/set project autonomy policy level
    policy = PolicyEngine.get_or_create_policy(payload.project_id, db)
    policy.level = payload.autonomy_level
    db.commit()

    # 2. Trigger orchestrator run
    try:
        run = orchestrator.start_workflow(payload.project_id, payload.requirement, db)
        # Schedule runner loop
        background_tasks.add_task(orchestrator.run_workflow, run.id)
        return {
            "workflow_run_id": run.id,
            "status": run.status,
            "current_state": run.current_state,
            "autonomy_level": policy.level
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{run_id}")
def get_loop_status(run_id: str, db: Session = Depends(get_db)):
    """
    Returns active state-machine status of the autonomous loop.
    """
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
        
    policy = PolicyEngine.get_or_create_policy(run.project_id, db)
    iterations = db.query(DevelopmentIteration)\
                   .filter(DevelopmentIteration.workflow_run_id == run_id)\
                   .order_by(DevelopmentIteration.iteration_number.desc())\
                   .all()

    active_iteration = iterations[0] if iterations else None

    return {
        "run_id": run.id,
        "project_id": run.project_id,
        "status": run.status,
        "current_state": run.current_state,
        "error_message": run.error_message,
        "autonomy_level": policy.level,
        "iteration_count": len(iterations),
        "active_iteration": active_iteration,
        "started_at": run.started_at,
        "completed_at": run.completed_at
    }

@router.post("/{run_id}/pause")
def pause_loop(run_id: str, db: Session = Depends(get_db)):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    run.status = "PAUSED"
    run.current_state = "PAUSED"
    db.commit()
    return {"status": "PAUSED"}

@router.post("/{run_id}/resume")
def resume_loop(
    run_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    run.status = "RUNNING"
    run.current_state = "DEVELOPING"
    db.commit()

    # Retrigger runner in background task
    background_tasks.add_task(orchestrator.run_workflow, run.id)
    return {"status": "RUNNING"}

@router.post("/{run_id}/stop")
def stop_loop(run_id: str, db: Session = Depends(get_db)):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    run.status = "FAILED"
    run.current_state = "FAILED"
    run.error_message = "Workflow stopped by human operator override."
    db.commit()
    return {"status": "STOPPED"}

@router.post("/{run_id}/approve")
def approve_checkpoint(
    run_id: str,
    background_tasks: BackgroundTasks,
    comments: Optional[str] = "",
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.workflow_run_id == run_id,
        Approval.status == "PENDING"
    ).first()
    
    if not approval:
        raise HTTPException(status_code=404, detail="No pending human approval checkpoint found")

    # Call submit_approval directly from orchestrator
    try:
        orchestrator.submit_approval(run_id, approval.task_id, "APPROVED", comments, db)
        # Retrigger runner loop in background
        background_tasks.add_task(orchestrator.run_workflow, run_id)
        return {"status": "APPROVED"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{run_id}/reject")
def reject_checkpoint(
    run_id: str,
    comments: Optional[str] = "",
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.workflow_run_id == run_id,
        Approval.status == "PENDING"
    ).first()
    
    if not approval:
        raise HTTPException(status_code=404, detail="No pending human approval checkpoint found")

    try:
        orchestrator.submit_approval(run_id, approval.task_id, "REJECTED", comments, db)
        return {"status": "REJECTED"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{run_id}/iterations")
def list_loop_iterations(run_id: str, db: Session = Depends(get_db)):
    """
    Returns timeline logs of development iteration histories.
    """
    iterations = db.query(DevelopmentIteration)\
                   .filter(DevelopmentIteration.workflow_run_id == run_id)\
                   .order_by(DevelopmentIteration.iteration_number.desc())\
                   .all()
    return iterations

@router.get("/{run_id}/artifacts")
def list_loop_artifacts(run_id: str, db: Session = Depends(get_db)):
    """
    Returns list of saved artifact versions for diffs or rollback options.
    """
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
        
    artifacts = db.query(ArtifactVersion)\
                  .filter(ArtifactVersion.project_id == run.project_id)\
                  .order_by(ArtifactVersion.version.desc())\
                  .all()
    return artifacts

@router.get("/{run_id}/diff")
def get_artifacts_diff(
    run_id: str,
    base_artifact_id: str,
    head_artifact_id: str,
    db: Session = Depends(get_db)
):
    """
    Computes line-by-line unified diff between two code artifact version maps.
    """
    base = db.query(ArtifactVersion).filter(ArtifactVersion.id == base_artifact_id).first()
    head = db.query(ArtifactVersion).filter(ArtifactVersion.id == head_artifact_id).first()

    if not base or not head:
        raise HTTPException(status_code=404, detail="Base or Head artifact version not found")

    base_files = json.loads(base.files)
    head_files = json.loads(head.files)

    diff_results = []

    # Match all file paths present in either version
    all_paths = set(list(base_files.keys()) + list(head_files.keys()))
    for path in all_paths:
        base_content = base_files.get(path, "")
        head_content = head_files.get(path, "")

        if base_content == head_content:
            continue

        base_lines = base_content.splitlines(keepends=True)
        head_lines = head_content.splitlines(keepends=True)

        diff = list(difflib.unified_diff(
            base_lines,
            head_lines,
            fromfile=f"a/{path}",
            tofile=f"b/{path}"
        ))

        # Count added and removed lines
        added = 0
        removed = 0
        for line in diff:
            if line.startswith("+") and not line.startswith("+++"):
                added += 1
            elif line.startswith("-") and not line.startswith("---"):
                removed += 1

        diff_results.append({
            "path": path,
            "added_lines": added,
            "removed_lines": removed,
            "diff_text": "".join(diff)
        })

    return diff_results

@router.get("/{run_id}/policy")
def get_autonomy_policy(run_id: str, db: Session = Depends(get_db)):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return PolicyEngine.get_or_create_policy(run.project_id, db)

@router.put("/{run_id}/policy")
def update_autonomy_policy(
    run_id: str,
    payload: PolicyUpdateRequest,
    db: Session = Depends(get_db)
):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
        
    policy = PolicyEngine.get_or_create_policy(run.project_id, db)
    policy.level = payload.level
    if payload.max_iterations is not None:
        policy.max_iterations = payload.max_iterations
    if payload.max_debug_cycles is not None:
        policy.max_debug_cycles = payload.max_debug_cycles
    if payload.require_approval_for_dependencies is not None:
        policy.require_approval_for_dependencies = payload.require_approval_for_dependencies
    if payload.require_approval_for_architecture is not None:
        policy.require_approval_for_architecture = payload.require_approval_for_architecture
    if payload.require_approval_for_security_changes is not None:
        policy.require_approval_for_security_changes = payload.require_approval_for_security_changes
    if payload.allow_auto_retest is not None:
        policy.allow_auto_retest = payload.allow_auto_retest
    if payload.allow_auto_fix is not None:
        policy.allow_auto_fix = payload.allow_auto_fix
        
    policy.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(policy)
    return policy

# Extended Phase 13 endpoints
import uuid

class RollbackRequest(BaseModel):
    artifact_id: str

@router.get("/{run_id}/timeline")
def get_loop_timeline(run_id: str, db: Session = Depends(get_db)):
    """
    Returns timeline nodes for the autonomous loop iterations.
    """
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")

    iterations = db.query(DevelopmentIteration)\
                   .filter(DevelopmentIteration.workflow_run_id == run_id)\
                   .order_by(DevelopmentIteration.iteration_number.asc())\
                   .all()

    nodes = []
    
    # Baseline Created
    nodes.append({
        "state": "CREATED",
        "status": "COMPLETED",
        "message": f"Workflow run {run_id} initialized",
        "timestamp": run.started_at.strftime("%H:%M:%S") if run.started_at else ""
    })

    # Sequence of iterations
    for it in iterations:
        # Developer node
        dev_status = "COMPLETED" if it.status in ["TESTING", "FAILED", "DEBUGGING", "FIXING", "PASSED", "REVIEWING", "COMPLETED"] else ("CURRENT" if it.status == "DEVELOPING" else "PENDING")
        nodes.append({
            "state": f"DEVELOPMENT_IT{it.iteration_number}",
            "status": dev_status,
            "message": f"Iteration {it.iteration_number} coding",
            "timestamp": it.created_at.strftime("%H:%M:%S") if it.created_at else ""
        })

        # Tester/Execution node
        test_status = "PENDING"
        if it.status in ["FAILED", "DEBUGGING", "FIXING", "PASSED", "REVIEWING", "COMPLETED"]:
            test_status = "FAILED" if it.status in ["FAILED", "DEBUGGING", "FIXING"] else "COMPLETED"
        elif it.status == "TESTING":
            test_status = "CURRENT"
            
        nodes.append({
            "state": f"TESTING_IT{it.iteration_number}",
            "status": test_status,
            "message": f"Iteration {it.iteration_number} validation tests: {it.failure_summary or ''}",
            "timestamp": it.completed_at.strftime("%H:%M:%S") if (it.completed_at and test_status != "PENDING") else ""
        })

        # Debugger node (if it failed)
        if it.status in ["DEBUGGING", "FIXING", "FAILED"]:
            deb_status = "COMPLETED" if it.status == "FIXING" else "CURRENT"
            nodes.append({
                "state": f"DEBUGGER_IT{it.iteration_number}",
                "status": deb_status,
                "message": f"Isolating cause: {it.failure_summary or ''}",
                "timestamp": ""
            })

    # Review & Evolution & Completed nodes at the end
    last_it = iterations[-1] if iterations else None
    if last_it and last_it.status in ["PASSED", "REVIEWING", "COMPLETED"]:
        nodes.append({
            "state": "REVIEW",
            "status": "COMPLETED" if last_it.status == "COMPLETED" else "CURRENT",
            "message": "Reviewing codebase constraints",
            "timestamp": ""
        })
        nodes.append({
            "state": "EVOLUTION",
            "status": "COMPLETED" if last_it.status == "COMPLETED" else "CURRENT",
            "message": "Extracting rules and guidelines",
            "timestamp": ""
        })
        
    if run.status == "COMPLETED":
        nodes.append({
            "state": "COMPLETED",
            "status": "COMPLETED",
            "message": "Workflow run completed successfully",
            "timestamp": run.completed_at.strftime("%H:%M:%S") if run.completed_at else ""
        })
    elif run.status == "FAILED":
        nodes.append({
            "state": "FAILED",
            "status": "FAILED",
            "message": f"Workflow failed: {run.error_message or ''}",
            "timestamp": run.completed_at.strftime("%H:%M:%S") if run.completed_at else ""
        })

    return {
        "run_id": run_id,
        "nodes": nodes
    }

@router.post("/{run_id}/rollback")
def rollback_to_artifact(
    run_id: str,
    payload: RollbackRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")

    target_art = db.query(ArtifactVersion).filter(ArtifactVersion.id == payload.artifact_id).first()
    if not target_art:
        raise HTTPException(status_code=404, detail="Target artifact not found")

    # Fetch max version number for this project
    latest_art = db.query(ArtifactVersion).filter(ArtifactVersion.project_id == run.project_id).order_by(ArtifactVersion.version.desc()).first()
    next_ver = (latest_art.version + 1) if latest_art else 1

    # Create rolled back artifact copy
    new_art = ArtifactVersion(
        id=f"art-{uuid.uuid4().hex[:8]}",
        version=next_ver,
        parent_artifact_id=payload.artifact_id,
        project_id=run.project_id,
        files=target_art.files,
        created_by_agent="HUMAN_ROLLBACK",
        change_summary=f"Rollback codebase to version {target_art.version} ({target_art.id})"
    )
    db.add(new_art)
    
    # Start a new iteration for this rollback run
    active_iter = db.query(DevelopmentIteration)\
                    .filter(DevelopmentIteration.workflow_run_id == run_id)\
                    .order_by(DevelopmentIteration.iteration_number.desc())\
                    .first()
    iter_num = (active_iter.iteration_number + 1) if active_iter else 1
    
    new_iter = DevelopmentIteration(
        id=f"it-{uuid.uuid4().hex[:8]}",
        project_id=run.project_id,
        workflow_run_id=run_id,
        iteration_number=iter_num,
        parent_iteration_id=active_iter.id if active_iter else None,
        goal=f"Verify rollback to artifact version {target_art.version}",
        status="PLANNED",
        artifact_id=new_art.id
    )
    db.add(new_iter)

    # Resume the workflow run and set task to TESTER
    run.status = "RUNNING"
    run.current_state = "TESTING"
    run.current_agent = "TESTER"
    
    # Create Tester task to re-verify rolled back code
    files_map = json.loads(target_art.files)
    code_val = files_map.get("vehicle_service.py", "") or files_map.get("app.py", "")
    
    test_task_id = f"task-{uuid.uuid4().hex[:8]}"
    db_next = Task(
        id=test_task_id,
        project_id=run.project_id,
        workflow_run_id=run.id,
        agent_role="TESTER",
        title="Execute Validation Suite (Rollback Verification)",
        description=f"Run assertions against rolled-back version {target_art.version}.",
        status="READY",
        priority="HIGH",
        input_context=json.dumps({
            "requirement": "Validate vehicle CRUD and slot reservations.",
            "task_description": "Validate concurrency appointments scheduler",
            "code": code_val,
            "attempt_number": 1
        }),
        attempt_count=0
    )
    db.add(db_next)
    db.commit()
    
    # Log rollback event
    orchestrator._log_event(
        db=db, project_id=run.project_id, run_id=run.id,
        action="ROLLBACK", message=f"Codebase rolled back to version {target_art.version}. Triggered validation re-test."
    )

    # Trigger background execution loop to resume tasks
    background_tasks.add_task(orchestrator.run_workflow, run_id)

    return {
        "status": "SUCCESS",
        "new_artifact_id": new_art.id,
        "new_iteration_id": new_iter.id,
        "task_id": test_task_id
    }
