from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Release(Base):
    __tablename__ = "releases"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    artifact_id = Column(String, ForeignKey("artifact_versions.id", ondelete="SET NULL"), nullable=True)
    version = Column(String, nullable=False)  # e.g., "1.0.0"
    environment = Column(String, nullable=False)  # DEVELOPMENT, STAGING, PRODUCTION
    status = Column(String, default="DRAFT")  # DRAFT, READY, APPROVAL_REQUIRED, APPROVED, DEPLOYING, DEPLOYED, FAILED, ROLLED_BACK, CANCELLED
    created_by = Column(String, nullable=False)
    approved_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    deployed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    rollback_reference = Column(String, nullable=True)

    # Relationships
    project = relationship("Project")
    artifact = relationship("ArtifactVersion")
    deployments = relationship("Deployment", back_populates="release", cascade="all, delete-orphan")


class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(String, primary_key=True, index=True)
    release_id = Column(String, ForeignKey("releases.id", ondelete="CASCADE"), nullable=False)
    environment = Column(String, nullable=False)  # DEVELOPMENT, STAGING, PRODUCTION
    status = Column(String, default="QUEUED")  # QUEUED, PREPARING, DEPLOYING, VERIFYING, HEALTHY, FAILED, ROLLING_BACK, ROLLED_BACK, COMPLETED, CANCELLED
    provider = Column(String, nullable=False)  # LOCAL, STAGING_SIMULATION
    strategy = Column(String, nullable=False)  # ROLLING, BLUE_GREEN
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    release = relationship("Release", back_populates="deployments")
    stages = relationship("DeploymentStage", back_populates="deployment", cascade="all, delete-orphan")
    approvals = relationship("DeploymentApproval", back_populates="deployment", cascade="all, delete-orphan")
    health_checks = relationship("HealthCheckResult", back_populates="deployment", cascade="all, delete-orphan")
    rollbacks = relationship("RollbackRecord", back_populates="deployment", cascade="all, delete-orphan")


class DeploymentStage(Base):
    __tablename__ = "deployment_stages"

    id = Column(String, primary_key=True, index=True)
    deployment_id = Column(String, ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    stage_name = Column(String, nullable=False)  # SOURCE_VALIDATION, BUILD, UNIT_TEST, SECURITY_SCAN, PACKAGE, DEPLOY, SMOKE_TEST
    status = Column(String, default="QUEUED")  # QUEUED, RUNNING, COMPLETED, FAILED
    logs_reference = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    deployment = relationship("Deployment", back_populates="stages")


class DeploymentApproval(Base):
    __tablename__ = "deployment_approvals"

    id = Column(String, primary_key=True, index=True)
    deployment_id = Column(String, ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    comments = Column(Text, nullable=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)

    # Relationships
    deployment = relationship("Deployment", back_populates="approvals")


class HealthCheckResult(Base):
    __tablename__ = "health_check_results"

    id = Column(String, primary_key=True, index=True)
    deployment_id = Column(String, ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "Database Connectivity", "HTTP Availability"
    status = Column(String, nullable=False)  # PASS, FAIL
    check_type = Column(String, nullable=False)  # HTTP, PORT, PING
    response_time_ms = Column(Integer, default=0)
    checked_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    deployment = relationship("Deployment", back_populates="health_checks")


class RollbackRecord(Base):
    __tablename__ = "rollback_records"

    id = Column(String, primary_key=True, index=True)
    deployment_id = Column(String, ForeignKey("deployments.id", ondelete="CASCADE"), nullable=False)
    previous_release_id = Column(String, ForeignKey("releases.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="QUEUED")  # QUEUED, RUNNING, COMPLETED, FAILED
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    deployment = relationship("Deployment", back_populates="rollbacks")
    previous_release = relationship("Release")


class EnvironmentConfig(Base):
    __tablename__ = "environment_configs"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    environment_name = Column(String, nullable=False)  # DEVELOPMENT, STAGING, PRODUCTION
    base_url = Column(String, nullable=False)
    runtime_config = Column(Text, nullable=True)  # JSON serialized config variables
    deployment_policy = Column(Text, nullable=True)  # JSON serialized policies
    health_check_config = Column(Text, nullable=True)  # JSON serialized health check criteria
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project")
