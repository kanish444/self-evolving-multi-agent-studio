from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    iteration_id = Column(String, ForeignKey("iterations.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="RUNNING")  # PASSED, FAILED, SKIPPED, RUNNING
    expected_result = Column(String, nullable=True)
    actual_result = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    duration = Column(String, nullable=True)  # e.g., "12ms" or "1.4s"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="test_results")
    task = relationship("Task", back_populates="test_results")
    iteration = relationship("Iteration", back_populates="test_results")
