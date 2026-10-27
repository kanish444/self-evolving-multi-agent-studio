import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from ..core.database import get_db
from ..models.sandbox import Execution, ExecutionFile, ExecutionResult
from ..schemas.sandbox import (
    ExecutionRequest,
    ExecutionResponse,
    ExecutionResultResponse,
    ExecutionDetailResponse
)
from ..sandbox.manager import sandbox_manager

router = APIRouter(prefix="/sandbox", tags=["sandbox"])

@router.post("/execute", response_model=ExecutionResponse, status_code=status.HTTP_201_CREATED)
def execute_code(
    payload: ExecutionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 0. Check with Policy Engine
    from ..governance.policy_engine import PolicyEngine
    from ..models.task import Task
    
    actor_type = "USER"
    actor_id = "dev_user"
    if payload.task_id:
        task = db.query(Task).filter(Task.id == payload.task_id).first()
        if task:
            actor_type = "AGENT"
            actor_id = task.agent_role.lower()

    eval_res = PolicyEngine.evaluate(
        actor_type=actor_type,
        actor_id=actor_id,
        action_type="RUN_SANDBOX",
        project_id=payload.project_id,
        environment="DEVELOPMENT",
        resource=f"sandbox_entrypoint:{payload.entrypoint}",
        db=db
    )
    
    if eval_res["decision"] == "DENY":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Governance policy blocked sandbox execution: {eval_res['reason']}"
        )
    elif eval_res["decision"] == "APPROVAL_REQUIRED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Sandbox execution requires approval: {eval_res['reason']}"
        )

    try:
        # 1. Create Execution job
        exec_id = f"exec-{uuid.uuid4().hex[:8]}"
        db_exec = Execution(
            id=exec_id,
            project_id=payload.project_id,
            task_id=payload.task_id,
            workflow_run_id=payload.workflow_run_id,
            language=payload.language,
            status="QUEUED",
            entrypoint=payload.entrypoint
        )
        db.add(db_exec)
        db.commit()

        # 2. Persist workspace files to db
        # Note: If the test runner command is defined, we stash it in the dependencies task field
        # or handle it in the manager run loop.
        for f in payload.files:
            db_file = ExecutionFile(
                id=f"file-{uuid.uuid4().hex[:8]}",
                execution_id=exec_id,
                path=f.path,
                content=f.content
            )
            db.add(db_file)
        
        # If test command is provided, update task dependencies field to pass command parameters
        if payload.test_command and payload.task_id:
            from ..models.task import Task
            task = db.query(Task).filter(Task.id == payload.task_id).first()
            if task:
                task.dependencies = payload.test_command
                
        db.commit()
        db.refresh(db_exec)

        # 3. Trigger worker background processing execution
        background_tasks.add_task(sandbox_manager.execute_job, exec_id, db)
        
        return db_exec
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue execution job: {e}")

@router.get("/executions", response_model=List[ExecutionResponse])
def read_executions(project_id: str, db: Session = Depends(get_db)):
    return db.query(Execution).filter(Execution.project_id == project_id).order_by(Execution.created_at.desc()).all()

@router.get("/executions/{execution_id}", response_model=ExecutionDetailResponse)
def read_execution_detail(execution_id: str, db: Session = Depends(get_db)):
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution record not found")
    return execution
