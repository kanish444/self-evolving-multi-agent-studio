from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..models.project import Project
from ..models.log import Log
from ..models.agent import Agent
from ..models.task import Task
from ..models.iteration import Iteration
from ..schemas.log import LogResponse

router = APIRouter(tags=["logs"])

@router.get("/projects/{project_id}/logs", response_model=List[LogResponse])
def read_project_logs(
    project_id: str,
    type: Optional[str] = None,
    status: Optional[str] = None,
    agent: Optional[str] = None,
    task: Optional[str] = None,
    iteration: Optional[str] = None,
    trace_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    query = db.query(Log).filter(Log.project_id == project_id)
    
    if type and type != "ALL":
        query = query.filter(Log.type == type)
        
    if status and status != "ALL":
        query = query.filter(Log.status == status)
        
    if agent and agent != "ALL":
        query = query.join(Log.agent).filter((Agent.name == agent) | (Agent.id == agent))
        
    if task and task != "ALL":
        query = query.join(Log.task).filter((Task.title == task) | (Task.id == task))
        
    if iteration and iteration != "ALL":
        # Handles "Iteration 03" formats and number formats
        iter_num = None
        if "iteration" in iteration.lower():
            try:
                iter_num = int(iteration.lower().replace("iteration", "").strip())
            except ValueError:
                pass
        
        if iter_num is not None:
            query = query.join(Log.iteration).filter(Iteration.number == iter_num)
        else:
            query = query.join(Log.iteration).filter((Iteration.id == iteration) | (Iteration.goal.contains(iteration)))
            
    if trace_id and trace_id != "ALL":
        query = query.filter(Log.trace_id == trace_id)
        
    # Sort logs descending (newest first) by default
    return query.order_by(Log.id.desc()).all()

@router.get("/logs/{log_id}", response_model=LogResponse)
def read_log(log_id: str, db: Session = Depends(get_db)):
    log = db.query(Log).filter(Log.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return log

@router.get("/logs/trace/{trace_id}", response_model=List[LogResponse])
def read_trace_logs(trace_id: str, db: Session = Depends(get_db)):
    return db.query(Log).filter(Log.trace_id == trace_id).order_by(Log.id.asc()).all()
