from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="RUNNING")  # RUNNING, COMPLETED, FAILED, PAUSED, CANCELLED
    current_state = Column(String, default="CREATED")  # CREATED, REQUIREMENT_ANALYSIS, PLANNING, ARCHITECTURE, DEVELOPMENT, TESTING, DEBUGGING, REVIEW, EVOLUTION, COMPLETED, FAILED, PAUSED, WAITING_FOR_HUMAN
    current_agent = Column(String, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(String, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="workflow_runs")
    tasks = relationship("Task", back_populates="workflow_run", cascade="all, delete-orphan")
    executions = relationship("AgentExecution", back_populates="workflow_run", cascade="all, delete-orphan")
    handoffs = relationship("AgentHandoff", back_populates="workflow_run", cascade="all, delete-orphan")
    approvals = relationship("Approval", back_populates="workflow_run", cascade="all, delete-orphan")

class AgentExecution(Base):
    __tablename__ = "agent_executions"

    id = Column(String, primary_key=True, index=True)
    workflow_run_id = Column(String, ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False)
    agent_role = Column(String, nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    input_reference = Column(String, nullable=True) # JSON details
    output_reference = Column(String, nullable=True) # JSON details
    status = Column(String, nullable=False)  # SUCCESS, RETRYABLE_FAILURE, PERMANENT_FAILURE, WAITING_FOR_HUMAN
    attempt_number = Column(Integer, default=1)
    latency_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workflow_run = relationship("WorkflowRun", back_populates="executions")
    task = relationship("Task")

class AgentHandoff(Base):
    __tablename__ = "agent_handoffs"

    id = Column(String, primary_key=True, index=True)
    workflow_run_id = Column(String, ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False)
    from_agent = Column(String, nullable=False)
    to_agent = Column(String, nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    payload_reference = Column(String, nullable=True) # JSON payload
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    workflow_run = relationship("WorkflowRun", back_populates="handoffs")
    task = relationship("Task")

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, index=True)
    workflow_run_id = Column(String, ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    requested_by = Column(String, nullable=False)  # Agent role
    approved_by = Column(String, nullable=True)
    comments = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    workflow_run = relationship("WorkflowRun", back_populates="approvals")
    task = relationship("Task")
