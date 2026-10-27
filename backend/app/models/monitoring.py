from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class MonitoredService(Base):
    __tablename__ = "monitored_services"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    environment = Column(String, nullable=False)  # DEVELOPMENT, STAGING, PRODUCTION
    service_name = Column(String, nullable=False)
    service_type = Column(String, nullable=False)  # API, DATABASE, WORKER, THIRD_PARTY
    endpoint = Column(String, nullable=True)
    health_check_config = Column(Text, nullable=True)  # JSON string containing timeout, expected responses, headers, etc.
    monitoring_enabled = Column(Boolean, default=True)
    status = Column(String, default="UNKNOWN")  # HEALTHY, DEGRADED, UNAVAILABLE, UNKNOWN
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project")
    health_checks = relationship("MonitoringHealthCheckResult", back_populates="service", cascade="all, delete-orphan")
    metrics = relationship("Metric", back_populates="service", cascade="all, delete-orphan")
    alert_rules = relationship("AlertRule", back_populates="service", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="service", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="service", cascade="all, delete-orphan")


class MonitoringHealthCheckResult(Base):
    __tablename__ = "monitoring_health_check_results"

    id = Column(String, primary_key=True, index=True)
    service_id = Column(String, ForeignKey("monitored_services.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False)  # HEALTHY, DEGRADED, FAILED, TIMEOUT
    response_code = Column(Integer, nullable=True)
    latency_ms = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    service = relationship("MonitoredService", back_populates="health_checks")


class Metric(Base):
    __tablename__ = "metrics"

    id = Column(String, primary_key=True, index=True)
    service_id = Column(String, ForeignKey("monitored_services.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)  # request_latency, error_count, error_rate, availability, cpu_usage, memory_usage, active_requests
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # ms, count, %, ratio, millicores, bytes
    timestamp = Column(DateTime, default=datetime.utcnow)
    source = Column(String, nullable=False)  # e.g., prometheus, internal, aws
    labels = Column(Text, nullable=True)  # JSON dict representing label tags

    # Relationships
    service = relationship("MonitoredService", back_populates="metrics")


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(String, primary_key=True, index=True)
    service_id = Column(String, ForeignKey("monitored_services.id", ondelete="CASCADE"), nullable=False)
    metric_name = Column(String, nullable=False)
    operator = Column(String, nullable=False)  # >, <, =, >=, <=
    threshold = Column(Float, nullable=False)
    duration_seconds = Column(Integer, default=300)
    severity = Column(String, nullable=False)  # INFO, LOW, MEDIUM, HIGH, CRITICAL / SEV-4 to SEV-1
    environment = Column(String, nullable=False)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    service = relationship("MonitoredService", back_populates="alert_rules")
    alerts = relationship("Alert", back_populates="rule", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    service_id = Column(String, ForeignKey("monitored_services.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(String, ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    severity = Column(String, nullable=False)  # INFO, LOW, MEDIUM, HIGH, CRITICAL / SEV-4 to SEV-1
    status = Column(String, default="OPEN")  # OPEN, ACKNOWLEDGED, RESOLVED, IGNORED
    message = Column(Text, nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    incident_id = Column(String, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    service = relationship("MonitoredService", back_populates="alerts")
    rule = relationship("AlertRule", back_populates="alerts")
    incident = relationship("Incident", back_populates="alerts")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(String, ForeignKey("monitored_services.id", ondelete="SET NULL"), nullable=True)
    environment = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False)  # SEV-4 (LOW), SEV-3 (MEDIUM), SEV-2 (HIGH), SEV-1 (CRITICAL)
    status = Column(String, default="DETECTED")  # DETECTED, INVESTIGATING, MITIGATING, MONITORING, RESOLVED, CLOSED
    detected_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    root_cause = Column(Text, nullable=True)
    resolution_summary = Column(Text, nullable=True)
    incident_type = Column(String, default="UNKNOWN")  # AVAILABILITY, PERFORMANCE, APPLICATION_ERROR, DATABASE, DEPENDENCY, DEPLOYMENT, SECURITY, RESOURCE, UNKNOWN

    # Relationships
    project = relationship("Project")
    service = relationship("MonitoredService", back_populates="incidents")
    alerts = relationship("Alert", back_populates="incident")
    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")
    analyses = relationship("IncidentAnalysis", back_populates="incident", cascade="all, delete-orphan")
    remediation_actions = relationship("RemediationAction", back_populates="incident", cascade="all, delete-orphan")
    post_incident_review = relationship("PostIncidentReview", back_populates="incident", uselist=False, cascade="all, delete-orphan")


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)  # e.g., DETECTED, DEPLOYMENT_CORRELATION, ALERT_GROUPING, AI_ANALYSIS_STARTED, ANALYSIS_COMPLETED, RECOVERY_ACTION, APPROVED, HEALTHY_VERIFIED, RESOLVED
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)  # JSON serialized dict

    # Relationships
    incident = relationship("Incident", back_populates="events")


class IncidentAnalysis(Base):
    __tablename__ = "incident_analyses"

    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    summary = Column(Text, nullable=False)
    probable_root_cause = Column(Text, nullable=False)
    evidence = Column(Text, nullable=False)  # JSON serialized list of observations
    confidence = Column(Float, default=0.9)
    impact = Column(String, default="MEDIUM")
    recommended_actions = Column(Text, nullable=False)  # JSON serialized list of recommendations
    requires_human = Column(Boolean, default=True)
    analyzed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="analyses")


class RemediationPolicy(Base):
    __tablename__ = "remediation_policies"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)  # ROLLBACK, RESTART_SERVICE, SCALE_SERVICE, CLEAR_CACHE
    enabled = Column(Boolean, default=True)
    requires_approval = Column(Boolean, default=True)
    environment_scope = Column(String, default="PRODUCTION")  # PRODUCTION, STAGING, ALL
    max_attempts = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project")


class RemediationAction(Base):
    __tablename__ = "remediation_actions"

    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)  # ROLLBACK, RESTART_SERVICE, SCALE_SERVICE, etc.
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED, RUNNING, COMPLETED, FAILED, SKIPPED
    reason = Column(Text, nullable=True)
    risk = Column(String, nullable=True)
    expected_impact = Column(String, nullable=True)
    requires_approval = Column(Boolean, default=True)
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    incident = relationship("Incident", back_populates="remediation_actions")


class PostIncidentReview(Base):
    __tablename__ = "post_incident_reviews"

    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    impact = Column(Text, nullable=False)
    root_cause = Column(Text, nullable=False)
    contributing_factors = Column(Text, nullable=True)
    what_went_well = Column(Text, nullable=True)
    what_went_wrong = Column(Text, nullable=True)
    corrective_actions = Column(Text, nullable=True)
    preventive_actions = Column(Text, nullable=True)
    learning_candidates = Column(Text, nullable=True)  # JSON array of learning candidate details
    status = Column(String, default="DRAFT")  # DRAFT, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    incident = relationship("Incident", back_populates="post_incident_review")


class ImprovementProposal(Base):
    __tablename__ = "improvement_proposals"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    incident_id = Column(String, ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    proposal_type = Column(String, nullable=False)  # CODE_FIX, TEST_COVERAGE, HEALTH_CHECK, TIMEOUT_HANDLING, MONITORING_RULE, REGRESSION_TEST, DEPLOYMENT_SAFETY, DOCUMENTATION
    task_id = Column(String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)  # Links back to Task created in Phase 13
    status = Column(String, default="PROPOSED")  # PROPOSED, REVIEW_REQUIRED, APPROVED, REJECTED, IMPLEMENTED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    project = relationship("Project")
    incident = relationship("Incident")
    task = relationship("Task")
