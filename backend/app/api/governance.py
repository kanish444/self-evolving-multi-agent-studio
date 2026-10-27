import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..core.database import get_db
from ..models.governance import (
    User, Role, Permission, UserRole, RolePermission,
    AgentPermission, AgentToolPermission, Policy, PolicyVersion,
    GovernedAction, ApprovalRequest, PolicyViolation, SecurityException,
    AuditEvent, ProtectedResource, DataClassification,
    GovernanceRecommendation, SecurityEvent
)
from ..schemas.governance import (
    PolicyCreateRequest, PolicyUpdateRequest, PolicyVersionCreate, PolicyResponse,
    SimulateRequest, SimulationResult,
    AgentBoundaryResponse,
    GovernedActionResponse, ApprovalRequestResponse, ApproveActionRequest,
    PolicyViolationResponse, SecurityExceptionCreate, SecurityExceptionResponse,
    AuditEventResponse, ProtectedResourceBase, ProtectedResourceResponse,
    DataClassificationResponse, GovernanceRecommendationResponse,
    RecommendationActionRequest, SecurityEventResponse,
    ComplianceReportResponse, RoleResponse, PermissionResponse
)
from ..governance.policy_engine import PolicyEngine
from ..governance.approval_engine import ApprovalEngine
from ..governance.agent import GovernanceAgent

router = APIRouter(prefix="/governance", tags=["governance"])

# --- Policies Endpoints ---

@router.get("/policies", response_model=List[PolicyResponse])
def list_policies(scope: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns all configured system safety, boundary, and compliance policies."""
    query = db.query(Policy)
    if scope:
        query = query.filter(Policy.scope == scope.upper())
    return query.order_by(desc(Policy.priority)).all()

@router.post("/policies", response_model=PolicyResponse)
def create_policy(payload: PolicyCreateRequest, db: Session = Depends(get_db)):
    """Creates a new security policy with version 1."""
    existing = db.query(Policy).filter(Policy.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy ID already exists")
        
    now = datetime.utcnow()
    policy = Policy(
        id=payload.id,
        name=payload.name,
        description=payload.description,
        scope=payload.scope,
        rules=payload.rules,
        enabled=payload.enabled,
        priority=payload.priority,
        created_by=payload.created_by,
        updated_by=payload.created_by,
        created_at=now,
        updated_at=now,
        version=1
    )
    db.add(policy)
    
    # Save historical version 1
    p_ver = PolicyVersion(
        id=f"pver-{uuid.uuid4().hex[:8]}",
        policy_id=policy.id,
        version=1,
        rules=payload.rules,
        created_by=payload.created_by,
        created_at=now
    )
    db.add(p_ver)
    db.commit()
    db.refresh(policy)
    
    # Log audit event
    PolicyEngine.log_audit(
        "USER", payload.created_by or "admin", "CREATE_POLICY", payload.id,
        None, "GLOBAL", "ALLOW", policy.id, "HIGH", None, db
    )
    
    return policy

@router.get("/policies/{id}", response_model=PolicyResponse)
def read_policy(id: str, db: Session = Depends(get_db)):
    """Fetches details of a specific policy."""
    policy = db.query(Policy).filter(Policy.id == id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@router.put("/policies/{id}", response_model=PolicyResponse)
def update_policy(id: str, payload: PolicyUpdateRequest, db: Session = Depends(get_db)):
    """Updates policy attributes and records a new version if rules change."""
    policy = db.query(Policy).filter(Policy.id == id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    now = datetime.utcnow()
    if payload.name is not None:
        policy.name = payload.name
    if payload.description is not None:
        policy.description = payload.description
    if payload.scope is not None:
        policy.scope = payload.scope
    if payload.enabled is not None:
        policy.enabled = payload.enabled
    if payload.priority is not None:
        policy.priority = payload.priority
        
    if payload.rules is not None and payload.rules != policy.rules:
        new_version = policy.version + 1
        policy.version = new_version
        policy.rules = payload.rules
        
        p_ver = PolicyVersion(
            id=f"pver-{uuid.uuid4().hex[:8]}",
            policy_id=id,
            version=new_version,
            rules=payload.rules,
            created_by=payload.updated_by or "admin",
            created_at=now
        )
        db.add(p_ver)

    policy.updated_by = payload.updated_by or "admin"
    policy.updated_at = now
    db.commit()
    db.refresh(policy)
    return policy

@router.post("/policies/{id}/toggle")
def toggle_policy_status(id: str, db: Session = Depends(get_db)):
    """Toggles policy enabled/disabled status."""
    policy = db.query(Policy).filter(Policy.id == id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    policy.enabled = not policy.enabled
    policy.updated_at = datetime.utcnow()
    db.commit()
    return {"id": policy.id, "enabled": policy.enabled}

@router.post("/policies/{id}/simulate", response_model=SimulationResult)
def simulate_policy_decision(id: str, payload: SimulateRequest, db: Session = Depends(get_db)):
    """Runs an interactive simulation of policy decision scoring for any actor, agent, tool, or action request."""
    result = PolicyEngine.evaluate(
        actor_type=payload.actor_type,
        actor_id=payload.actor_id,
        action_type=payload.action_type,
        project_id=payload.project_id,
        environment=payload.environment,
        resource=payload.resource,
        tool_name=payload.tool_name,
        db=db
    )
    return result

@router.post("/policies/{id}/version", response_model=PolicyResponse)
def create_policy_new_version(id: str, payload: PolicyVersionCreate, db: Session = Depends(get_db)):
    """Increments the version of a policy, archiving the historical rule configuration."""
    policy = db.query(Policy).filter(Policy.id == id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    new_version = policy.version + 1
    now = datetime.utcnow()
    policy.version = new_version
    policy.rules = payload.rules
    policy.updated_at = now
    policy.updated_by = payload.created_by or "admin"
    
    p_ver = PolicyVersion(
        id=f"pver-{uuid.uuid4().hex[:8]}",
        policy_id=id,
        version=new_version,
        rules=payload.rules,
        created_by=payload.created_by or "admin",
        created_at=now
    )
    db.add(p_ver)
    db.commit()
    db.refresh(policy)
    return policy

# --- Agent Boundaries Endpoints ---

@router.get("/agents", response_model=List[AgentBoundaryResponse])
def list_agent_boundaries(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists agent security boundary permissions and tool restrictions."""
    query = db.query(AgentPermission)
    if project_id:
        query = query.filter(AgentPermission.project_id == project_id)
    perms = query.all()
    
    result = []
    for p in perms:
        tools = db.query(AgentToolPermission).filter(AgentToolPermission.agent_id == p.agent_id).all()
        tool_map = {t.tool_name: t.permission_type for t in tools}
        
        allowed_p_list = []
        if p.allowed_permissions:
            try:
                allowed_p_list = json.loads(p.allowed_permissions) if p.allowed_permissions.startswith("[") else [x.strip() for x in p.allowed_permissions.split(",")]
            except Exception:
                allowed_p_list = [p.allowed_permissions]
                
        result.append({
            "agent_id": p.agent_id,
            "project_id": p.project_id,
            "allowed_environments": p.allowed_environments,
            "max_risk_limit": p.max_risk_limit,
            "allowed_permissions": allowed_p_list,
            "tool_permissions": tool_map
        })
    return result

# --- Actions, Violations, Audits Endpoints ---

@router.get("/actions", response_model=List[GovernedActionResponse])
def list_governed_actions(
    actor_id: Optional[str] = None,
    action_type: Optional[str] = None,
    environment: Optional[str] = None,
    risk_level: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieves all evaluated and logged governed actions."""
    query = db.query(GovernedAction)
    if actor_id:
        query = query.filter(GovernedAction.actor_id == actor_id)
    if action_type:
        query = query.filter(GovernedAction.action_type == action_type)
    if environment:
        query = query.filter(GovernedAction.environment == environment)
    if risk_level:
        query = query.filter(GovernedAction.risk_level == risk_level)
    return query.order_by(desc(GovernedAction.created_at)).limit(limit).all()

@router.get("/violations", response_model=List[PolicyViolationResponse])
def list_policy_violations(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns a list of all detected security policy breaches and violations."""
    query = db.query(PolicyViolation)
    if severity:
        query = query.filter(PolicyViolation.severity == severity.upper())
    if status:
        query = query.filter(PolicyViolation.status == status.upper())
    return query.order_by(desc(PolicyViolation.detected_at)).all()

@router.get("/audit", response_model=List[AuditEventResponse])
def explore_audit_trail(
    actor_id: Optional[str] = None,
    action: Optional[str] = None,
    environment: Optional[str] = None,
    decision: Optional[str] = None,
    risk_level: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    """Immutable audit trail log query explorer with secret redaction verified."""
    query = db.query(AuditEvent)
    if actor_id:
        query = query.filter(AuditEvent.actor_id == actor_id)
    if action:
        query = query.filter(AuditEvent.action == action)
    if environment:
        query = query.filter(AuditEvent.environment == environment)
    if decision:
        query = query.filter(AuditEvent.decision == decision)
    if risk_level:
        query = query.filter(AuditEvent.risk_level == risk_level)
        
    return query.order_by(desc(AuditEvent.timestamp)).limit(limit).all()

# --- Approvals Endpoints ---

@router.get("/approvals", response_model=List[ApprovalRequestResponse])
def list_approvals(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetches all request approvals waiting for manual operator validation."""
    # Check and auto-expire old requests
    ApprovalEngine.expire_active_requests(db)
    
    query = db.query(ApprovalRequest)
    if status:
        query = query.filter(ApprovalRequest.status == status.upper())
    return query.order_by(desc(ApprovalRequest.created_at)).all()

@router.post("/approvals/{id}/approve")
def approve_pending_action(id: str, payload: ApproveActionRequest, db: Session = Depends(get_db)):
    """Approves a pending governed action request enforcing Four-Eyes principle."""
    ApprovalEngine.expire_active_requests(db)
    result = ApprovalEngine.approve_request(request_id=id, approver_id=payload.approver, db=db)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/approvals/{id}/reject")
def reject_pending_action(id: str, payload: ApproveActionRequest, db: Session = Depends(get_db)):
    """Rejects a pending governed action request."""
    ApprovalEngine.expire_active_requests(db)
    result = ApprovalEngine.reject_request(request_id=id, approver_id=payload.approver, db=db, reason=payload.comment)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/approvals/{id}/cancel")
def cancel_pending_action(id: str, actor_id: str = "admin", db: Session = Depends(get_db)):
    """Cancels a pending governed action request."""
    result = ApprovalEngine.cancel_request(request_id=id, actor_id=actor_id, db=db)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

# --- Risk & Compliance Reports ---

@router.get("/risk")
def get_risk_dashboard_data(db: Session = Depends(get_db)):
    """Returns risk levels breakdown, distribution, and recently logged high-risk actions."""
    total_actions = db.query(GovernedAction).count()
    risk_distribution = {
        "LOW": db.query(GovernedAction).filter(GovernedAction.risk_level == "LOW").count(),
        "MEDIUM": db.query(GovernedAction).filter(GovernedAction.risk_level == "MEDIUM").count(),
        "HIGH": db.query(GovernedAction).filter(GovernedAction.risk_level == "HIGH").count(),
        "CRITICAL": db.query(GovernedAction).filter(GovernedAction.risk_level == "CRITICAL").count()
    }
    
    high_risk_actions = db.query(GovernedAction).filter(
        GovernedAction.risk_level.in_(["HIGH", "CRITICAL"])
    ).order_by(desc(GovernedAction.created_at)).limit(20).all()
    
    return {
        "total_actions": total_actions,
        "risk_distribution": risk_distribution,
        "high_risk_actions": high_risk_actions
    }

@router.get("/report", response_model=ComplianceReportResponse)
def get_compliance_report(db: Session = Depends(get_db)):
    """Assembles operational metrics, trust score, and compliance statistics."""
    total_actions = db.query(GovernedAction).count()
    allowed_count = db.query(GovernedAction).filter(GovernedAction.policy_result == "ALLOW").count()
    denied_count = db.query(GovernedAction).filter(GovernedAction.policy_result == "DENY").count()
    pending_approvals = db.query(ApprovalRequest).filter(ApprovalRequest.status == "PENDING").count()
    violations_count = db.query(PolicyViolation).count()
    security_events_count = db.query(SecurityEvent).count()
    
    risk_distribution = {
        "LOW": db.query(GovernedAction).filter(GovernedAction.risk_level == "LOW").count(),
        "MEDIUM": db.query(GovernedAction).filter(GovernedAction.risk_level == "MEDIUM").count(),
        "HIGH": db.query(GovernedAction).filter(GovernedAction.risk_level == "HIGH").count(),
        "CRITICAL": db.query(GovernedAction).filter(GovernedAction.risk_level == "CRITICAL").count()
    }
    
    active_policies_count = db.query(Policy).filter(Policy.enabled == True).count()
    active_exceptions = db.query(SecurityException).filter(
        SecurityException.status == "ACTIVE",
        SecurityException.expiration > datetime.utcnow()
    ).count()
    recommendations_count = db.query(GovernanceRecommendation).filter(GovernanceRecommendation.status == "PROPOSED").count()

    # Calculate trust compliance score
    trust_score = max(0, min(100, 100 - (violations_count * 8) - (denied_count * 2) - (security_events_count * 5)))

    return {
        "total_actions": total_actions,
        "allowed_count": allowed_count,
        "denied_count": denied_count,
        "pending_approvals": pending_approvals,
        "violations_count": violations_count,
        "security_events_count": security_events_count,
        "risk_distribution": risk_distribution,
        "active_policies_count": active_policies_count,
        "active_exceptions_count": active_exceptions,
        "trust_score": trust_score,
        "recommendations_count": recommendations_count
    }

# --- Roles & Permissions Endpoints ---

@router.get("/roles", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    """Returns all RBAC roles and their explicit granted permissions."""
    roles = db.query(Role).all()
    res = []
    for r in roles:
        perms = db.query(RolePermission).filter(RolePermission.role_id == r.id).all()
        perm_ids = [p.permission_id for p in perms]
        res.append({
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "permissions": perm_ids,
            "created_at": r.created_at
        })
    return res

@router.get("/permissions", response_model=List[PermissionResponse])
def list_permissions(db: Session = Depends(get_db)):
    """Returns all granular permissions defined in the system."""
    return db.query(Permission).all()

# --- Security Exceptions Endpoints ---

@router.get("/exceptions", response_model=List[SecurityExceptionResponse])
def list_security_exceptions(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists all controlled security exceptions."""
    # Check expiration
    now = datetime.utcnow()
    active_excs = db.query(SecurityException).filter(SecurityException.status == "ACTIVE").all()
    for exc in active_excs:
        if exc.expiration and exc.expiration < now:
            exc.status = "EXPIRED"
    db.commit()
    
    query = db.query(SecurityException)
    if status:
        query = query.filter(SecurityException.status == status.upper())
    return query.order_by(desc(SecurityException.created_at)).all()

@router.post("/exceptions", response_model=SecurityExceptionResponse)
def create_security_exception(payload: SecurityExceptionCreate, db: Session = Depends(get_db)):
    """Creates a temporary security exception with explicit expiration date."""
    now = datetime.utcnow()
    expiration = now + timedelta(minutes=payload.duration_minutes)
    
    exc_id = f"exc-{uuid.uuid4().hex[:8]}"
    exc = SecurityException(
        exception_id=exc_id,
        policy_id=payload.policy_id,
        reason=payload.reason,
        requested_by=payload.requested_by,
        approved_by=payload.approved_by,
        scope=payload.scope,
        expiration=expiration,
        risk=payload.risk,
        status="ACTIVE",
        created_at=now
    )
    db.add(exc)
    db.commit()
    db.refresh(exc)
    
    PolicyEngine.log_audit(
        "USER", payload.approved_by, "CREATE_SECURITY_EXCEPTION", exc_id,
        None, "GLOBAL", "ALLOW", payload.policy_id, payload.risk, None, db
    )
    return exc

@router.post("/exceptions/{id}/revoke")
def revoke_security_exception(id: str, revoker: str = "admin", db: Session = Depends(get_db)):
    """Revokes an active security exception."""
    exc = db.query(SecurityException).filter(SecurityException.exception_id == id).first()
    if not exc:
        raise HTTPException(status_code=404, detail="Security exception not found")
        
    exc.status = "REVOKED"
    db.commit()
    
    PolicyEngine.log_audit(
        "USER", revoker, "REVOKE_SECURITY_EXCEPTION", id,
        None, "GLOBAL", "ALLOW", exc.policy_id, exc.risk, None, db
    )
    return {"message": "Security exception revoked successfully"}

# --- Protected Resources Endpoints ---

@router.get("/protected-resources", response_model=List[ProtectedResourceResponse])
def list_protected_resources(db: Session = Depends(get_db)):
    """Returns all protected resource path patterns."""
    return db.query(ProtectedResource).all()

@router.post("/protected-resources", response_model=ProtectedResourceResponse)
def create_protected_resource(payload: ProtectedResourceBase, db: Session = Depends(get_db)):
    """Adds a new protected resource path pattern."""
    pr_id = f"pr-{uuid.uuid4().hex[:8]}"
    pr = ProtectedResource(
        id=pr_id,
        path_pattern=payload.path_pattern,
        description=payload.description,
        requires_approval=payload.requires_approval,
        min_role=payload.min_role
    )
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return pr

# --- Governance Recommendations (AI Agent) Endpoints ---

@router.get("/recommendations", response_model=List[GovernanceRecommendationResponse])
def list_recommendations(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns AI policy recommendations generated by GovernanceAgent."""
    query = db.query(GovernanceRecommendation)
    if status:
        query = query.filter(GovernanceRecommendation.status == status.upper())
    recs = query.order_by(desc(GovernanceRecommendation.created_at)).all()
    if not recs:
        # Trigger generation if empty
        recs = GovernanceAgent.generate_recommendations(db)
    return recs

@router.post("/recommendations/analyze", response_model=List[GovernanceRecommendationResponse])
def trigger_agent_analysis(db: Session = Depends(get_db)):
    """Triggers GovernanceAgent to analyze telemetry, detect conflicts, and generate policy recommendations."""
    return GovernanceAgent.generate_recommendations(db)

@router.post("/recommendations/{id}/apply")
def apply_ai_recommendation(id: str, payload: RecommendationActionRequest, db: Session = Depends(get_db)):
    """Human Review: Approves and applies an AI recommendation, generating a new policy version or boundary."""
    result = GovernanceAgent.apply_recommendation(recommendation_id=id, reviewer_id=payload.reviewer, db=db)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

@router.post("/recommendations/{id}/reject")
def reject_ai_recommendation(id: str, payload: RecommendationActionRequest, db: Session = Depends(get_db)):
    """Human Review: Rejects an AI policy recommendation."""
    result = GovernanceAgent.reject_recommendation(recommendation_id=id, reviewer_id=payload.reviewer, db=db, comment=payload.comment)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result

# --- Security Events Endpoints ---

@router.get("/events", response_model=List[SecurityEventResponse])
def list_security_events(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns detected security events."""
    query = db.query(SecurityEvent)
    if status:
        query = query.filter(SecurityEvent.status == status.upper())
    return query.order_by(desc(SecurityEvent.last_detected_at)).all()
