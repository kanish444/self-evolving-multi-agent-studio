from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.project import Project
from ..models.task import Task
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(tags=["tasks"])

@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_project_task(project_id: str, task_in: TaskCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    count = db.query(Task).count()
    task_id = f"task-{str(count + 1).zfill(2)}"
    while db.query(Task).filter(Task.id == task_id).first():
        count += 1
        task_id = f"task-{str(count + 1).zfill(2)}"

    db_task = Task(
        id=task_id,
        project_id=project_id,
        title=task_in.title,
        description=task_in.description,
        status="TODO",
        priority=task_in.priority or "MEDIUM",
        assigned_agent_id=task_in.assigned_agent_id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/projects/{project_id}/tasks", response_model=List[TaskResponse])
def read_project_tasks(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(Task).filter(Task.project_id == project_id).all()

@router.get("/tasks/{task_id}", response_model=TaskResponse)
def read_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task_in: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    db.commit()
    db.refresh(task)
    return task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(task)
    db.commit()
    return None
