from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="PLANNING")  # PLANNING, IN_PROGRESS, COMPLETED, PAUSED, ARCHIVED
    current_iteration = Column(Integer, default=1)
    requirements = Column(String, nullable=True)
    architecture_plan = Column(String, nullable=True)
    permissions_granted = Column(String, nullable=True)
    repo_url = Column(String, nullable=True)
    workspace_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    iterations = relationship("Iteration", back_populates="project", cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="project", cascade="all, delete-orphan")
    evolutions = relationship("Evolution", back_populates="project", cascade="all, delete-orphan")
    memories = relationship("Memory", back_populates="project", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="project", cascade="all, delete-orphan")
    workflow_runs = relationship("WorkflowRun", back_populates="project", cascade="all, delete-orphan")

