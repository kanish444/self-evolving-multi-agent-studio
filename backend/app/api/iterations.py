from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.project import Project
from ..models.iteration import Iteration
from ..schemas.iteration import IterationCreate, IterationUpdate, IterationResponse

router = APIRouter(tags=["iterations"])

@router.post("/projects/{project_id}/iterations", response_model=IterationResponse, status_code=status.HTTP_201_CREATED)
def create_project_iteration(project_id: str, iteration_in: IterationCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    iteration_id = f"it-{project_id}-{iteration_in.number}"
    # Check duplicate
    existing = db.query(Iteration).filter(Iteration.id == iteration_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Iteration already exists")
        
    db_iteration = Iteration(
        id=iteration_id,
        project_id=project_id,
        number=iteration_in.number,
        goal=iteration_in.goal,
        status="PLANNED"
    )
    db.add(db_iteration)
    db.commit()
    db.refresh(db_iteration)
    return db_iteration

@router.get("/projects/{project_id}/iterations", response_model=List[IterationResponse])
def read_project_iterations(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(Iteration).filter(Iteration.project_id == project_id).all()

@router.get("/iterations/{iteration_id}", response_model=IterationResponse)
def read_iteration(iteration_id: str, db: Session = Depends(get_db)):
    iter_obj = db.query(Iteration).filter(Iteration.id == iteration_id).first()
    if not iter_obj:
        raise HTTPException(status_code=404, detail="Iteration not found")
    return iter_obj

@router.put("/iterations/{iteration_id}", response_model=IterationResponse)
def update_iteration(iteration_id: str, iteration_in: IterationUpdate, db: Session = Depends(get_db)):
    iter_obj = db.query(Iteration).filter(Iteration.id == iteration_id).first()
    if not iter_obj:
        raise HTTPException(status_code=404, detail="Iteration not found")
        
    update_data = iteration_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(iter_obj, key, value)
        
    db.commit()
    db.refresh(iter_obj)
    return iter_obj
