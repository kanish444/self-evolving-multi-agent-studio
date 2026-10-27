from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class DevelopmentIteration(Base):
    __tablename__ = "development_iterations"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    workflow_run_id = Column(String, ForeignKey("workflow_runs.id", ondelete="SET NULL"), nullable=True)
    iteration_number = Column(Integer, default=1)
    parent_iteration_id = Column(String, nullable=True)
    goal = Column(String, nullable=False)
    status = Column(String, default="PLANNED")  # PLANNED, DEVELOPING, EXECUTING, TESTING, FAILED, DEBUGGING, FIXING, PASSED, REVIEWING, COMPLETED, ABANDONED
    artifact_id = Column(String, ForeignKey("artifact_versions.id", ondelete="SET NULL"), nullable=True)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="SET NULL"), nullable=True)
    test_result_id = Column(String, nullable=True)
    failure_summary = Column(String, nullable=True)
    learning_reference = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    artifact = relationship("ArtifactVersion", foreign_keys=[artifact_id])
    execution = relationship("Execution", foreign_keys=[execution_id])

class ArtifactVersion(Base):
    __tablename__ = "artifact_versions"

    id = Column(String, primary_key=True, index=True)
    version = Column(Integer, default=1)
    parent_artifact_id = Column(String, nullable=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    files = Column(Text, nullable=False)  # JSON formatted dictionary: {path: content}
    created_by_agent = Column(String, nullable=False)
    change_summary = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FailureAnalysis(Base):
    __tablename__ = "failure_analyses"

    id = Column(String, primary_key=True, index=True)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    failure_type = Column(String, nullable=False)  # CODE_ERROR, TEST_FAILURE, TIMEOUT, RESOURCE_LIMIT, SECURITY_VIOLATION, UNKNOWN
    summary = Column(String, nullable=False)
    root_cause = Column(Text, nullable=False)
    affected_files = Column(Text, nullable=True)  # JSON list
    affected_functions = Column(Text, nullable=True)  # JSON list
    recommended_fix = Column(Text, nullable=False)
    confidence = Column(Float, default=0.9)
    risk_level = Column(String, default="LOW")
    created_at = Column(DateTime, default=datetime.utcnow)

class FixAttempt(Base):
    __tablename__ = "fix_attempts"

    id = Column(String, primary_key=True, index=True)
    iteration_id = Column(String, ForeignKey("development_iterations.id", ondelete="CASCADE"), nullable=False)
    debugger_analysis_id = Column(String, ForeignKey("failure_analyses.id", ondelete="SET NULL"), nullable=True)
    suggested_fix = Column(Text, nullable=False)
    applied_patch = Column(Text, nullable=True)
    status = Column(String, default="SUCCESS")  # SUCCESS, FAILED
    created_at = Column(DateTime, default=datetime.utcnow)

class LearningCandidate(Base):
    __tablename__ = "learning_candidates"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    incident_id = Column(String, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    problem = Column(String, nullable=False)
    root_cause = Column(Text, nullable=False)
    solution = Column(Text, nullable=False)
    learning = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    confidence = Column(Float, default=0.9)
    scope = Column(String, nullable=True)
    status = Column(String, default="PROPOSED")  # PROPOSED, REVIEW_REQUIRED, APPROVED, REJECTED, STORED
    created_at = Column(DateTime, default=datetime.utcnow)


class AutonomyPolicy(Base):
    __tablename__ = "autonomy_policies"

    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    level = Column(Integer, default=1)  # 0 - MANUAL, 1 - ASSISTED, 2 - CONTROLLED AUTONOMY
    max_iterations = Column(Integer, default=5)
    max_debug_cycles = Column(Integer, default=3)
    require_approval_for_dependencies = Column(Boolean, default=True)
    require_approval_for_architecture = Column(Boolean, default=True)
    require_approval_for_security_changes = Column(Boolean, default=True)
    allow_auto_retest = Column(Boolean, default=True)
    allow_auto_fix = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
