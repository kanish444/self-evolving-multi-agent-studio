from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from datetime import datetime
from ..core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Role(Base):
    __tablename__ = "roles"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    resource = Column(String, nullable=True) # e.g. PROJECT, CODE, FILE, TEST, SANDBOX, DATABASE, RELEASE, DEPLOYMENT, SECRET, CONFIG, POLICY
    action = Column(String, nullable=True)   # e.g. READ, WRITE, DELETE, EXECUTE, DEPLOY, MANAGE, ACCESS
    risk_level = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    created_at = Column(DateTime, default=datetime.utcnow)

class UserRole(Base):
    __tablename__ = "user_roles"
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(String, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)

class RolePermission(Base):
    __tablename__ = "role_permissions"
    role_id = Column(String, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    permission_id = Column(String, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)

class AgentPermission(Base):
    __tablename__ = "agent_permissions"
    id = Column(String, primary_key=True, index=True)
    agent_id = Column(String, index=True, nullable=False)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    allowed_environments = Column(String, default="DEVELOPMENT,STAGING") # Comma-separated: DEVELOPMENT, STAGING, PRODUCTION
    max_risk_limit = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    allowed_permissions = Column(Text, nullable=True) # JSON list or comma-separated list of granted permission IDs
    allowed_tools = Column(Text, nullable=True) # JSON list or comma-separated list of allowed tool names
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentToolPermission(Base):
    __tablename__ = "agent_tool_permissions"
    id = Column(String, primary_key=True, index=True)
    agent_id = Column(String, index=True, nullable=False)
    tool_name = Column(String, index=True, nullable=False) # e.g. filesystem, sandbox, database, deployment, secret_manager
    permission_type = Column(String, default="ALLOWED")  # ALLOWED, RESTRICTED, DENIED
    created_at = Column(DateTime, default=datetime.utcnow)

class Policy(Base):
    __tablename__ = "policies"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)
    scope = Column(String, default="GLOBAL")  # GLOBAL, PROJECT, AGENT, TOOL, USER, ROLE, ENVIRONMENT, ACTION
    rules = Column(Text, nullable=True)  # JSON-serialized rules mapping
    enabled = Column(Boolean, default=True)
    priority = Column(Integer, default=0)
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    version = Column(Integer, default=1)

class PolicyVersion(Base):
    __tablename__ = "policy_versions"
    id = Column(String, primary_key=True, index=True)
    policy_id = Column(String, ForeignKey("policies.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    rules = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, nullable=True)

class GovernedAction(Base):
    __tablename__ = "governed_actions"
    id = Column(String, primary_key=True, index=True)
    actor_type = Column(String, nullable=False)  # USER, AGENT, TOOL, WORKFLOW, SYSTEM
    actor_id = Column(String, nullable=False)
    action_type = Column(String, nullable=False)  # READ_FILE, WRITE_FILE, DEPLOY_PRODUCTION, etc.
    project_id = Column(String, nullable=True)
    environment = Column(String, nullable=True)
    resource = Column(String, nullable=True) # Target resource/filepath/endpoint
    risk_level = Column(String, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    policy_result = Column(String, nullable=False)  # ALLOW, DENY, APPROVAL_REQUIRED, CONDITIONALLY_ALLOWED
    approval_status = Column(String, nullable=True)  # PENDING, APPROVED, REJECTED, EXPIRED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class ApprovalRequest(Base):
    __tablename__ = "governance_approval_requests"
    id = Column(String, primary_key=True, index=True)
    action_id = Column(String, ForeignKey("governed_actions.id", ondelete="CASCADE"), nullable=False)
    requester = Column(String, nullable=False)
    approver = Column(String, nullable=True)
    risk_level = Column(String, nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED, EXPIRED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

class PolicyViolation(Base):
    __tablename__ = "policy_violations"
    id = Column(String, primary_key=True, index=True)
    actor_type = Column(String, nullable=False) # USER, AGENT, TOOL, SYSTEM
    actor_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    policy_id = Column(String, nullable=True)
    severity = Column(String, nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(String, nullable=True)
    detected_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="DETECTED")  # DETECTED, RESOLVING, RESOLVED
    resolution = Column(String, nullable=True)

class SecurityException(Base):
    __tablename__ = "security_exceptions"
    exception_id = Column(String, primary_key=True, index=True)
    policy_id = Column(String, nullable=True)
    reason = Column(String, nullable=False)
    requested_by = Column(String, nullable=False)
    approved_by = Column(String, nullable=False)
    scope = Column(String, nullable=False) # e.g. GLOBAL, PROJECT:P001, AGENT:developer
    expiration = Column(DateTime, nullable=False)
    risk = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")  # ACTIVE, EXPIRED, REVOKED
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditEvent(Base):
    __tablename__ = "governance_audit_events"
    id = Column(String, primary_key=True, index=True)
    actor_type = Column(String, nullable=False)
    actor_id = Column(String, nullable=False)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=True)
    project_id = Column(String, nullable=True)
    environment = Column(String, nullable=True)
    decision = Column(String, nullable=False) # ALLOW, DENY, APPROVAL_REQUIRED, CONDITIONALLY_ALLOWED
    policy_id = Column(String, nullable=True)
    risk_level = Column(String, nullable=False)
    approval_id = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    trace_id = Column(String, nullable=True)

class ProtectedResource(Base):
    __tablename__ = "protected_resources"
    id = Column(String, primary_key=True, index=True)
    path_pattern = Column(String, unique=True, nullable=False) # regex or prefix e.g. /security/.*
    description = Column(String, nullable=True)
    requires_approval = Column(Boolean, default=True)
    min_role = Column(String, default="DEVELOPER")

class DataClassification(Base):
    __tablename__ = "data_classifications"
    id = Column(String, primary_key=True, index=True)
    resource_name = Column(String, unique=True, nullable=False) # database, configs, repo, secrets
    classification_level = Column(String, nullable=False)  # PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED

class GovernanceRecommendation(Base):
    __tablename__ = "governance_recommendations"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False) # PERMISSION, TOOL, POLICY, RESOURCE, MONITORING
    recommendation_type = Column(String, nullable=False) # RESTRICT_TOOL, REMOVE_PERMISSION, ADD_APPROVAL, PROTECT_RESOURCE, REDUCE_RISK
    target_id = Column(String, nullable=False) # agent_id, role_id, tool_name, or resource_pattern
    details = Column(Text, nullable=False) # JSON or descriptive text
    rationale = Column(Text, nullable=False)
    risk_reduction = Column(String, default="MEDIUM") # LOW, MEDIUM, HIGH
    status = Column(String, default="PROPOSED") # PROPOSED, APPROVED, REJECTED, APPLIED
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    resulting_policy_id = Column(String, nullable=True)

class SecurityEvent(Base):
    __tablename__ = "governance_security_events"
    id = Column(String, primary_key=True, index=True)
    event_type = Column(String, nullable=False) # REPEATED_AUTH_FAILURES, REPEATED_BLOCKED_ACTIONS, UNEXPECTED_TOOL_USAGE, PRIVILEGE_ESCALATION, SUSPICIOUS_SECRET_ACCESS, UNEXPECTED_PROD_ACTION
    actor_type = Column(String, nullable=False)
    actor_id = Column(String, nullable=False)
    severity = Column(String, nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(String, nullable=False)
    occurrences = Column(Integer, default=1)
    first_detected_at = Column(DateTime, default=datetime.utcnow)
    last_detected_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="OPEN") # OPEN, ACKNOWLEDGED, RESOLVED, ESCALATED_TO_INCIDENT
    incident_id = Column(String, nullable=True) # Linked incident in monitoring system

