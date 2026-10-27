from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

# Monitored Service Schemas
class MonitoredServiceCreate(BaseModel):
    project_id: str
    environment: str  # DEVELOPMENT, STAGING, PRODUCTION
    service_name: str
    service_type: str  # API, DATABASE, WORKER, THIRD_PARTY
    endpoint: Optional[str] = None
    health_check_config: Optional[Dict[str, Any]] = None
    monitoring_enabled: Optional[bool] = True

class MonitoredServiceResponse(BaseModel):
    id: str
    project_id: str
    environment: str
    service_name: str
    service_type: str
    endpoint: Optional[str] = None
    health_check_config: Optional[str] = None
    monitoring_enabled: bool
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Metric Schemas
class MetricCreate(BaseModel):
    service_id: str
    name: str
    value: float
    unit: str
    source: str
    labels: Optional[Dict[str, str]] = None

class MetricResponse(BaseModel):
    id: str
    service_id: str
    name: str
    value: float
    unit: str
    timestamp: datetime
    source: str
    labels: Optional[str] = None

    class Config:
        from_attributes = True

# Alert Rule Schemas
class AlertRuleCreate(BaseModel):
    service_id: str
    metric_name: str
    operator: str  # >, <, =, >=, <=
    threshold: float
    duration_seconds: Optional[int] = 300
    severity: str  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    environment: str
    enabled: Optional[bool] = True

class AlertRuleResponse(BaseModel):
    id: str
    service_id: str
    metric_name: str
    operator: str
    threshold: float
    duration_seconds: int
    severity: str
    environment: str
    enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Alert Schemas
class AlertResponse(BaseModel):
    id: str
    service_id: str
    rule_id: Optional[str] = None
    severity: str
    status: str
    message: str
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    incident_id: Optional[str] = None

    class Config:
        from_attributes = True

# Incident Schemas
class IncidentCreate(BaseModel):
    project_id: str
    service_id: Optional[str] = None
    environment: str
    title: str
    description: str
    severity: str  # SEV-4, SEV-3, SEV-2, SEV-1
    incident_type: str

class IncidentResponse(BaseModel):
    id: str
    project_id: str
    service_id: Optional[str] = None
    environment: str
    title: str
    description: str
    severity: str
    status: str
    detected_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    root_cause: Optional[str] = None
    resolution_summary: Optional[str] = None
    incident_type: str

    class Config:
        from_attributes = True

# Incident Event Schemas
class IncidentEventResponse(BaseModel):
    id: str
    incident_id: str
    event_type: str
    message: str
    timestamp: datetime
    details: Optional[str] = None

    class Config:
        from_attributes = True

# Incident Analysis Schemas
class IncidentAnalysisResponse(BaseModel):
    id: str
    incident_id: str
    summary: str
    probable_root_cause: str
    evidence: str  # JSON list
    confidence: float
    impact: str
    recommended_actions: str  # JSON list
    requires_human: bool
    analyzed_at: datetime

    class Config:
        from_attributes = True

# Remediation Policy Schemas
class RemediationPolicyCreate(BaseModel):
    project_id: str
    action: str
    enabled: Optional[bool] = True
    requires_approval: Optional[bool] = True
    environment_scope: Optional[str] = "PRODUCTION"
    max_attempts: Optional[int] = 3

class RemediationPolicyResponse(BaseModel):
    id: str
    project_id: str
    action: str
    enabled: bool
    requires_approval: bool
    environment_scope: str
    max_attempts: int
    created_at: datetime

    class Config:
        from_attributes = True

# Remediation Action Schemas
class RemediationActionResponse(BaseModel):
    id: str
    incident_id: str
    action: str
    status: str
    reason: Optional[str] = None
    risk: Optional[str] = None
    expected_impact: Optional[str] = None
    requires_approval: bool
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

# Post Incident Review Schemas
class PostIncidentReviewCreate(BaseModel):
    impact: str
    root_cause: str
    contributing_factors: Optional[str] = None
    what_went_well: Optional[str] = None
    what_went_wrong: Optional[str] = None
    corrective_actions: Optional[str] = None
    preventive_actions: Optional[str] = None
    learning_candidates: Optional[List[Dict[str, Any]]] = None

class PostIncidentReviewResponse(BaseModel):
    id: str
    incident_id: str
    impact: str
    root_cause: str
    contributing_factors: Optional[str] = None
    what_went_well: Optional[str] = None
    what_went_wrong: Optional[str] = None
    corrective_actions: Optional[str] = None
    preventive_actions: Optional[str] = None
    learning_candidates: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Learning Candidate Schema (for extending existing/new candidate details)
class LearningCandidateResponse(BaseModel):
    id: str
    project_id: str
    incident_id: Optional[str] = None
    problem: str
    root_cause: str
    solution: str
    learning: str
    evidence: Optional[str] = None
    confidence: float
    scope: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Improvement Proposal Schemas
class ImprovementProposalResponse(BaseModel):
    id: str
    project_id: str
    incident_id: Optional[str] = None
    title: str
    description: str
    proposal_type: str
    task_id: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
