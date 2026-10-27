from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="IDLE")  # IDLE, WORKING, WAITING, ERROR, OFFLINE
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="assigned_agent")
    logs = relationship("Log", back_populates="agent", cascade="all, delete-orphan")
