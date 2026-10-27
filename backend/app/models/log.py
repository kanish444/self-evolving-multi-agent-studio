from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Log(Base):
    __tablename__ = "logs"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    iteration_id = Column(String, ForeignKey("iterations.id", ondelete="SET NULL"), nullable=True)
    agent_id = Column(String, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    
    type = Column(String, nullable=False)  # INFO, SUCCESS, WARNING, ERROR, DEBUG, REVIEW, EVOLUTION, MEMORY, SYSTEM
    status = Column(String, nullable=False)  # RUNNING, COMPLETED, FAILED, WAITING, ANALYZING, STORED
    action = Column(String, nullable=False)
    message = Column(String, nullable=False)
    file = Column(String, nullable=True)
    test = Column(String, nullable=True)
    trace_id = Column(String, nullable=False, index=True)
    correlation_id = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)  # Display time e.g. "10:41:50"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="logs")
    iteration = relationship("Iteration", back_populates="logs")
    agent = relationship("Agent", back_populates="logs")
    task = relationship("Task", back_populates="logs")
