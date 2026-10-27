from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Execution(Base):
    __tablename__ = "executions"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    workflow_run_id = Column(String, ForeignKey("workflow_runs.id", ondelete="SET NULL"), nullable=True)
    language = Column(String, nullable=False)  # python, javascript, java
    status = Column(String, default="QUEUED")  # QUEUED, RUNNING, SUCCESS, FAILED, TIMEOUT, RESOURCE_LIMIT, REJECTED, SYSTEM_ERROR
    entrypoint = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    files = relationship("ExecutionFile", back_populates="execution", cascade="all, delete-orphan")
    result = relationship("ExecutionResult", back_populates="execution", uselist=False, cascade="all, delete-orphan")

class ExecutionFile(Base):
    __tablename__ = "execution_files"

    id = Column(String, primary_key=True, index=True)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    path = Column(String, nullable=False)
    content = Column(Text, nullable=False)

    # Relationships
    execution = relationship("Execution", back_populates="files")

class ExecutionResult(Base):
    __tablename__ = "execution_results"

    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), primary_key=True)
    exit_code = Column(Integer, nullable=True)
    stdout = Column(Text, nullable=True)
    stderr = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=0)
    timed_out = Column(Boolean, default=False)
    resource_limited = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    execution = relationship("Execution", back_populates="result")
