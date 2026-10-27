from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Iteration(Base):
    __tablename__ = "iterations"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    number = Column(Integer, nullable=False)
    goal = Column(String, nullable=True)
    status = Column(String, default="PLANNED")  # PLANNED, ACTIVE, COMPLETED, FAILED
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="iterations")
    test_results = relationship("TestResult", back_populates="iteration", cascade="all, delete-orphan")
    evolutions = relationship("Evolution", back_populates="iteration", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="iteration", cascade="all, delete-orphan")
