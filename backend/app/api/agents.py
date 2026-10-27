from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..models.agent import Agent
from ..schemas.agent import AgentResponse, AgentUpdateStatus

router = APIRouter(prefix="/agents", tags=["agents"])

@router.get("", response_model=List[AgentResponse])
def read_agents(db: Session = Depends(get_db)):
    return db.query(Agent).all()

@router.get("/{agent_id}", response_model=AgentResponse)
def read_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/{agent_id}/status", response_model=AgentResponse)
def update_agent_status(agent_id: str, status_in: AgentUpdateStatus, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    agent.status = status_in.status
    db.commit()
    db.refresh(agent)
    return agent
