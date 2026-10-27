from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- RBAC & Permissions ---
class PermissionBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    resource: Optional[str] = None
    action: Optional[str] = None
    risk_level: str = "MEDIUM"

class PermissionResponse(PermissionBase):
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

class RoleResponse(RoleBase):
    permissions: List[str] = []
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- Agent Boundaries & Tool Permissions ---
class AgentPermissionBase(BaseModel):
    agent_id: str
    project_id: str
    allowed_environments: str = "DEVELOPMENT,STAGING"
    max_risk_limit: str = "MEDIUM"
    allowed_permissions: Optional[str] = None
    allowed_tools: Optional[str] = None

class AgentToolPermissionBase(BaseModel):
    agent_id: str
    tool_name: str
    permission_type: str = "ALLOWED"

class AgentBoundaryResponse(BaseModel):
    agent_id: str
    project_id: str
    allowed_environments: str
    max_risk_limit: str
    allowed_permissions: List[str] = []
    tool_permissions: Dict[str, str] = {}
    class Config:
        from_attributes = True

# --- Policies & Versions ---
class PolicyBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    scope: str = "GLOBAL"
    rules: Optional[str] = None
    enabled: bool = True
    priority: int = 0
    created_by: Optional[str] = "admin"

class PolicyCreateRequest(PolicyBase):
    pass

class PolicyUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scope: Optional[str] = None
    rules: Optional[str] = None
    enabled: Optional[bool] = None
    priority: Optional[int] = None
    updated_by: Optional[str] = "admin"

class PolicyVersionCreate(BaseModel):
    rules: str
    created_by: Optional[str] = "admin"

class PolicyResponse(PolicyBase):
    version: int = 1
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- Policy Simulator ---
class SimulateRequest(BaseModel):
    actor_type: str = "AGENT"
    actor_id: str = "developer"
    action_type: str = "DEPLOY_PRODUCTION"
    project_id: Optional[str] = "P001"
    environment: Optional[str] = "PRODUCTION"
    resource: Optional[str] = None
    tool_name: Optional[str] = None

class SimulationResult(BaseModel):
    decision: str # ALLOW, DENY, APPROVAL_REQUIRED, CONDITIONALLY_ALLOWED
    reason: str
    requires_approval: bool = False
    risk_level: str = "MEDIUM"
    policy_id: Optional[str] = None
    policy_name: Optional[str] = None

# --- Governed Actions & Approvals ---
class GovernedActionResponse(BaseModel):
    id: str
    actor_type: str
    actor_id: str
    action_type: str
    project_id: Optional[str] = None
    environment: Optional[str] = None
    resource: Optional[str] = None
    risk_level: str
    policy_result: str
    approval_status: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ApprovalRequestResponse(BaseModel):
    id: str
    action_id: str
    requester: str
    approver: Optional[str] = None
    risk_level: str
    reason: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ApproveActionRequest(BaseModel):
    approver: str = "admin"
    comment: Optional[str] = None

# --- Violations & Security Exceptions ---
class PolicyViolationResponse(BaseModel):
    id: str
    actor_type: str
    actor_id: str
    action: str
    policy_id: Optional[str] = None
    severity: str
    description: Optional[str] = None
    detected_at: Optional[datetime] = None
    status: str
    resolution: Optional[str] = None
    class Config:
        from_attributes = True

class SecurityExceptionCreate(BaseModel):
    policy_id: Optional[str] = None
    reason: str
    requested_by: str
    approved_by: str
    scope: str = "GLOBAL"
    duration_minutes: int = 60
    risk: str = "MEDIUM"

class SecurityExceptionResponse(BaseModel):
    exception_id: str
    policy_id: Optional[str] = None
    reason: str
    requested_by: str
    approved_by: str
    scope: str
    expiration: datetime
    risk: str
    status: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# --- Audit Events ---
class AuditEventResponse(BaseModel):
    id: str
    actor_type: str
    actor_id: str
    action: str
    resource: Optional[str] = None
    project_id: Optional[str] = None
    environment: Optional[str] = None
    decision: str
    policy_id: Optional[str] = None
    risk_level: str
    approval_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    trace_id: Optional[str] = None
    class Config:
        from_attributes = True

# --- Protected Resources & Data Classification ---
class ProtectedResourceBase(BaseModel):
    path_pattern: str
    description: Optional[str] = None
    requires_approval: bool = True
    min_role: str = "DEVELOPER"

class ProtectedResourceResponse(ProtectedResourceBase):
    id: str
    class Config:
        from_attributes = True

class DataClassificationResponse(BaseModel):
    id: str
    resource_name: str
    classification_level: str
    class Config:
        from_attributes = True

# --- Governance Recommendations (AI Agent) ---
class GovernanceRecommendationResponse(BaseModel):
    id: str
    title: str
    category: str
    recommendation_type: str
    target_id: str
    details: str
    rationale: str
    risk_reduction: str
    status: str
    created_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    resulting_policy_id: Optional[str] = None
    class Config:
        from_attributes = True

class RecommendationActionRequest(BaseModel):
    reviewer: str = "admin"
    comment: Optional[str] = None

# --- Security Events ---
class SecurityEventResponse(BaseModel):
    id: str
    event_type: str
    actor_type: str
    actor_id: str
    severity: str
    description: str
    occurrences: int = 1
    first_detected_at: Optional[datetime] = None
    last_detected_at: Optional[datetime] = None
    status: str
    incident_id: Optional[str] = None
    class Config:
        from_attributes = True

# --- Compliance & Risk Reports ---
class ComplianceReportResponse(BaseModel):
    total_actions: int = 0
    allowed_count: int = 0
    denied_count: int = 0
    pending_approvals: int = 0
    violations_count: int = 0
    security_events_count: int = 0
    risk_distribution: Dict[str, int] = {}
    active_policies_count: int = 0
    active_exceptions_count: int = 0
    trust_score: int = 100
    recommendations_count: int = 0

