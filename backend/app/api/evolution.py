from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.project import Project
from ..models.evolution import Evolution
from ..schemas.evolution import EvolutionCreate, EvolutionResponse

router = APIRouter(tags=["evolution"])

@router.post("/projects/{project_id}/evolution", response_model=EvolutionResponse, status_code=status.HTTP_201_CREATED)
def create_project_evolution(project_id: str, evo_in: EvolutionCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    count = db.query(Evolution).count()
    evo_id = f"evo-{count + 1}"
    while db.query(Evolution).filter(Evolution.id == evo_id).first():
        count += 1
        evo_id = f"evo-{count + 1}"

    db_evo = Evolution(
        id=evo_id,
        project_id=project_id,
        iteration_id=evo_in.iteration_id,
        title=evo_in.title,
        problem=evo_in.problem,
        solution=evo_in.solution,
        learning=evo_in.learning,
        confidence=evo_in.confidence
    )
    db.add(db_evo)
    db.commit()
    db.refresh(db_evo)
    return db_evo

@router.get("/projects/{project_id}/evolution", response_model=List[EvolutionResponse])
def read_project_evolution_records(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(Evolution).filter(Evolution.project_id == project_id).all()

@router.get("/evolution/{evolution_id}", response_model=EvolutionResponse)
def read_evolution_record(evolution_id: str, db: Session = Depends(get_db)):
    evo = db.query(Evolution).filter(Evolution.id == evolution_id).first()
    if not evo:
        raise HTTPException(status_code=404, detail="Evolution record not found")
    return evo
