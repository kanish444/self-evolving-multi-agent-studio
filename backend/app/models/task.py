from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    workflow_run_id = Column(String, ForeignKey("workflow_runs.id", ondelete="SET NULL"), nullable=True)
    parent_task_id = Column(String, nullable=True)
    agent_role = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="TODO")  # TODO, READY, RUNNING, BLOCKED, COMPLETED, FAILED, CANCELLED, WAITING_FOR_HUMAN
    priority = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    assigned_agent_id = Column(String, ForeignKey("agents.id", ondelete="SET NULL"), nullable=True)
    dependencies = Column(String, nullable=True) # JSON list
    input_context = Column(String, nullable=True) # JSON payload
    output_reference = Column(String, nullable=True) # JSON output
    attempt_count = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    assigned_agent = relationship("Agent", back_populates="tasks")
    workflow_run = relationship("WorkflowRun", back_populates="tasks")
    test_results = relationship("TestResult", back_populates="task", cascade="all, delete-orphan")
    logs = relationship("Log", back_populates="task", cascade="all, delete-orphan")

