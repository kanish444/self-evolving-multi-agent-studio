from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.project import Project
from ..models.memory import Memory
from ..schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse

router = APIRouter(tags=["memory"])

@router.post("/projects/{project_id}/memory", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
def create_project_memory(project_id: str, mem_in: MemoryCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    count = db.query(Memory).count()
    memory_id = f"mem-{str(count + 1).zfill(2)}"
    while db.query(Memory).filter(Memory.id == memory_id).first():
        count += 1
        memory_id = f"mem-{str(count + 1).zfill(2)}"

    db_memory = Memory(
        id=memory_id,
        project_id=project_id,
        category=mem_in.category,
        title=mem_in.title,
        content=mem_in.content,
        source=mem_in.source,
        confidence=mem_in.confidence,
        importance=mem_in.importance,
        status=mem_in.status,
        tags=mem_in.tags,
        related_failures=mem_in.related_failures,
        related_agents=mem_in.related_agents,
        used_in_count=mem_in.used_in_count,
        success_rate=mem_in.success_rate,
        impact_score=mem_in.impact_score,
        usage_count=mem_in.usage_count,
        success_count=mem_in.success_count,
        last_used=mem_in.last_used,
        iteration=mem_in.iteration
    )
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

@router.get("/projects/{project_id}/memory", response_model=List[MemoryResponse])
def read_project_memories(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(Memory).filter(Memory.project_id == project_id).all()

@router.get("/memory/{memory_id}", response_model=MemoryResponse)
def read_memory(memory_id: str, db: Session = Depends(get_db)):
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
    return mem

@router.put("/memory/{memory_id}", response_model=MemoryResponse)
def update_memory(memory_id: str, mem_in: MemoryUpdate, db: Session = Depends(get_db)):
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
        
    update_data = mem_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mem, key, value)
        
    db.commit()
    db.refresh(mem)
    return mem

@router.delete("/memory/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(memory_id: str, db: Session = Depends(get_db)):
    mem = db.query(Memory).filter(Memory.id == memory_id).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")
        
    db.delete(mem)
    db.commit()
    return None
