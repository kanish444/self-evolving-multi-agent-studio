from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..models.orchestration import WorkflowRun, AgentExecution, AgentHandoff, Approval
from ..models.task import Task
from ..models.log import Log
from ..schemas.orchestration import (
    WorkflowRunStart,
    WorkflowRunResponse,
    AgentHandoffResponse,
    ApprovalRequest,
    ApprovalResponse,
    TimelineResponse,
    TimelineNode
)
from ..schemas.task import TaskResponse
from ..orchestration.orchestrator import orchestrator

router = APIRouter(prefix="/orchestration", tags=["orchestration"])

@router.post("/start", response_model=WorkflowRunResponse, status_code=status.HTTP_201_CREATED)
def start_workflow(
    run_in: WorkflowRunStart,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        run = orchestrator.start_workflow(
            project_id=run_in.project_id,
            requirement=run_in.requirement,
            db=db
        )
        # Execute orchestrator loop asynchronously in the background
        background_tasks.add_task(orchestrator.run_workflow, run.id)
        return run
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/projects/{project_id}/runs", response_model=List[WorkflowRunResponse])
def read_project_workflow_runs(project_id: str, db: Session = Depends(get_db)):
    return db.query(WorkflowRun).filter(WorkflowRun.project_id == project_id).order_by(WorkflowRun.started_at.desc()).all()

@router.post("/{run_id}/pause", response_model=WorkflowRunResponse)
def pause_workflow(run_id: str, db: Session = Depends(get_db)):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    
    if run.status == "RUNNING":
        run.status = "PAUSED"
        db.commit()
        db.refresh(run)
        
        # Log pause event
        orchestrator._log_event(
            db=db,
            project_id=run.project_id,
            run_id=run.id,
            action="WORKFLOW_PAUSED",
            message="Workflow execution paused by user.",
            status="PAUSED"
        )
        
    return run

@router.post("/{run_id}/resume", response_model=WorkflowRunResponse)
def resume_workflow(
    run_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    
    if run.status == "PAUSED" or run.status == "WAITING_FOR_HUMAN":
        run.status = "RUNNING"
        # If waiting for human approval, state is WAITING_FOR_HUMAN. The runner will determine next task.
        db.commit()
        db.refresh(run)
        
        orchestrator._log_event(
            db=db,
            project_id=run.project_id,
            run_id=run.id,
            action="WORKFLOW_STARTED",
            message="Workflow execution resumed by user.",
            status="RUNNING"
        )
        
        background_tasks.add_task(orchestrator.run_workflow, run.id)
        
    return run

@router.post("/{run_id}/cancel", response_model=WorkflowRunResponse)
def cancel_workflow(run_id: str, db: Session = Depends(get_db)):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
        
    run.status = "CANCELLED"
    run.current_state = "CANCELLED"
    run.current_agent = None
    run.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    
    # Cancel all ready or pending tasks
    ready_tasks = db.query(Task).filter(
        Task.workflow_run_id == run_id,
        Task.status.in_(["READY", "PENDING", "RUNNING"])
    ).all()
    for task in ready_tasks:
        task.status = "CANCELLED"
    db.commit()
    
    orchestrator._log_event(
        db=db,
        project_id=run.project_id,
        run_id=run.id,
        action="WORKFLOW_COMPLETED",
        message="Workflow cancelled by user.",
        status="CANCELLED"
    )
    
    return run

@router.get("/{run_id}", response_model=WorkflowRunResponse)
def read_workflow_run(run_id: str, db: Session = Depends(get_db)):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return run

@router.get("/{run_id}/tasks", response_model=List[TaskResponse])
def read_workflow_tasks(run_id: str, db: Session = Depends(get_db)):
    return db.query(Task).filter(Task.workflow_run_id == run_id).all()

@router.get("/{run_id}/approvals", response_model=List[ApprovalResponse])
def read_workflow_approvals(run_id: str, db: Session = Depends(get_db)):
    return db.query(Approval).filter(Approval.workflow_run_id == run_id).all()

@router.get("/{run_id}/handoffs", response_model=List[AgentHandoffResponse])
def read_workflow_handoffs(run_id: str, db: Session = Depends(get_db)):
    return db.query(AgentHandoff).filter(AgentHandoff.workflow_run_id == run_id).all()

@router.post("/{run_id}/tasks/{task_id}/approve", response_model=ApprovalResponse)
def approve_checkpoint(
    run_id: str,
    task_id: str,
    payload: ApprovalRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        approval = orchestrator.submit_approval(
            run_id=run_id,
            task_id=task_id,
            status="APPROVED",
            comments=payload.comments,
            db=db
        )
        
        # Trigger background execution loop to resume tasks
        background_tasks.add_task(orchestrator.run_workflow, run_id)
        return approval
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{run_id}/tasks/{task_id}/reject", response_model=ApprovalResponse)
def reject_checkpoint(
    run_id: str,
    task_id: str,
    payload: ApprovalRequest,
    db: Session = Depends(get_db)
):
    try:
        approval = orchestrator.submit_approval(
            run_id=run_id,
            task_id=task_id,
            status="REJECTED",
            comments=payload.comments,
            db=db
        )
        return approval
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{run_id}/tasks/{task_id}/request_changes", response_model=ApprovalResponse)
def request_changes_checkpoint(
    run_id: str,
    task_id: str,
    payload: ApprovalRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        approval = orchestrator.submit_approval(
            run_id=run_id,
            task_id=task_id,
            status="REQUEST_CHANGES",
            comments=payload.comments,
            db=db
        )
        
        # Trigger background execution loop to re-run task with remarks
        background_tasks.add_task(orchestrator.run_workflow, run_id)
        return approval
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{run_id}/timeline", response_model=TimelineResponse)
def read_workflow_timeline(run_id: str, db: Session = Depends(get_db)):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
        
    # State mapping in sequential order
    sequence = [
        ("CREATED", "System initialized", None),
        ("REQUIREMENT_ANALYSIS", "Understand requirement specs", "PROJECT_MANAGER"),
        ("PLANNING", "Formulate development modules and tasks", "PROJECT_MANAGER"),
        ("ARCHITECTURE", "Specify modules and API designs", "ARCHITECT"),
        ("DEVELOPMENT", "Generate software files and code", "DEVELOPER"),
        ("TESTING", "Validate correctness and performance", "TESTER"),
        ("DEBUGGING", "Isolate test tracebacks and suggest patches", "DEBUGGER"),
        ("REVIEW", "Audit codebase security and standards", "REVIEWER"),
        ("EVOLUTION", "Synthesize iteration optimization guidelines", "EVOLUTION"),
        ("COMPLETED", "Workflow run completed", None)
    ]
    
    nodes = []
    current_state_found = False
    
    # Fetch logs for dates/times
    logs = db.query(Log).filter(
        Log.project_id == run.project_id,
        Log.trace_id == f"trace_{run.id[-8:]}"
    ).order_by(Log.created_at.asc()).all()
    
    def find_log_time(action_tag):
        for l in logs:
            if l.action == action_tag:
                return l.timestamp
        return datetime.now().strftime("%H:%M:%S")

    for state, description, role in sequence:
        # Check index mapping
        if state == run.current_state:
            current_state_found = True
            
            # If workflow run failed
            if run.status == "FAILED":
                nodes.append(TimelineNode(
                    state=state,
                    status="FAILED",
                    agent_role=role,
                    timestamp=datetime.now().strftime("%H:%M:%S"),
                    message=f"Execution halted at {state}: {run.error_message or 'Internal Failure'}"
                ))
            elif run.status == "PAUSED":
                nodes.append(TimelineNode(
                    state=state,
                    status="WAITING",
                    agent_role=role,
                    timestamp=datetime.now().strftime("%H:%M:%S"),
                    message=f"Waiting for human checkpoint actions at {state}."
                ))
            else:
                nodes.append(TimelineNode(
                    state=state,
                    status="CURRENT",
                    agent_role=role,
                    timestamp=datetime.now().strftime("%H:%M:%S"),
                    message=f"Agent executing {state} active tasks..."
                ))
        else:
            if not current_state_found:
                # Historical state (completed)
                nodes.append(TimelineNode(
                    state=state,
                    status="COMPLETED",
                    agent_role=role,
                    timestamp=find_log_time(f"WORKFLOW_STATE_CHANGED") if state != "CREATED" else find_log_time("WORKFLOW_STARTED"),
                    message=f"Completed {state} phase: {description}."
                ))
            else:
                # Future state (waiting)
                nodes.append(TimelineNode(
                    state=state,
                    status="WAITING",
                    agent_role=role,
                    timestamp="--:--:--",
                    message=f"Queued waiting for transition: {description}."
                ))
                
    return TimelineResponse(
        run_id=run.id,
        current_state=run.current_state,
        nodes=nodes
    )
