import sys
import os
import json
import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app, setup_database
from app.core.database import SessionLocal
from app.models.project import Project
from app.models.task import Task
from app.models.orchestration import WorkflowRun
from app.models.governance import (
    User, Role, Permission, UserRole, RolePermission,
    AgentPermission, AgentToolPermission, Policy, PolicyVersion,
    GovernedAction, ApprovalRequest, PolicyViolation, SecurityException,
    AuditEvent, ProtectedResource, DataClassification,
    GovernanceRecommendation, SecurityEvent
)
from app.governance.policy_engine import PolicyEngine
from app.governance.approval_engine import ApprovalEngine
from app.governance.agent import GovernanceAgent
from app.orchestration.orchestrator import Orchestrator

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    db.rollback()
    
    # Run setup to ensure baseline defaults exist
    setup_database()
    
    # Create or verify test project P001 exists
    project = db.query(Project).filter(Project.id == "P001").first()
    if not project:
        project = Project(id="P001", name="Test SMS Project")
        db.add(project)
        db.commit()

    yield db
    
    # Teardown / Re-seed after tests to preserve clean database for subsequent test modules
    try:
        setup_database()
    except Exception:
        pass
    db.close()

def test_user_rbac_permissions(db_session):
    """Verifies that RBAC permissions enforce least-privilege for users."""
    # 1. Create a guest user (Viewer role only)
    guest = db_session.query(User).filter(User.id == "test_guest_viewer").first()
    if not guest:
        guest = User(id="test_guest_viewer", username="test_guest_viewer", email="guest_viewer@test.com", is_active=True)
        db_session.add(guest)
        db_session.add(UserRole(user_id="test_guest_viewer", role_id="VIEWER"))
        db_session.commit()

    # Evaluating DEPLOY_PRODUCTION for VIEWER should return DENY
    res_deny = PolicyEngine.evaluate(
        actor_type="USER",
        actor_id="test_guest_viewer",
        action_type="DEPLOY_PRODUCTION",
        project_id="P001",
        environment="PRODUCTION",
        resource="app_release",
        db=db_session
    )
    assert res_deny["decision"] == "DENY"
    assert "permission" in res_deny["reason"].lower()

    # 2. Evaluating READ_PROJECT for VIEWER should return ALLOW
    res_allow = PolicyEngine.evaluate(
        actor_type="USER",
        actor_id="test_guest_viewer",
        action_type="READ_PROJECT",
        project_id="P001",
        environment="DEVELOPMENT",
        resource="dashboard",
        db=db_session
    )
    assert res_allow["decision"] == "ALLOW"

    # 3. Create an admin user
    adm = db_session.query(User).filter(User.id == "test_admin_user").first()
    if not adm:
        adm = User(id="test_admin_user", username="test_admin_user", email="adm_user@test.com", is_active=True)
        db_session.add(adm)
        db_session.add(UserRole(user_id="test_admin_user", role_id="ADMIN"))
        db_session.commit()

    # Admin in DEVELOPMENT should be allowed
    res_adm = PolicyEngine.evaluate(
        actor_type="USER",
        actor_id="test_admin_user",
        action_type="DEPLOY_PRODUCTION",
        project_id="P001",
        environment="DEVELOPMENT",
        resource="app_release",
        db=db_session
    )
    assert res_adm["decision"] == "ALLOW"

def test_agent_permission_boundaries(db_session):
    """Verifies that AI agents respect environmental, risk, and permission boundaries."""
    # Ensure developer agent boundary is registered
    ag_perm = db_session.query(AgentPermission).filter(AgentPermission.agent_id == "developer").first()
    if not ag_perm:
        ag_perm = AgentPermission(
            id="ap-test-dev",
            agent_id="developer",
            project_id="P001",
            allowed_environments="DEVELOPMENT,STAGING",
            max_risk_limit="MEDIUM",
            allowed_permissions="READ_PROJECT,WRITE_CODE,RUN_TEST,RUN_SANDBOX"
        )
        db_session.add(ag_perm)
        db_session.commit()

    # 1. Low risk task in DEVELOPMENT -> ALLOW
    res_low = PolicyEngine.evaluate(
        actor_type="AGENT",
        actor_id="developer",
        action_type="READ_FILE",
        project_id="P001",
        environment="DEVELOPMENT",
        resource="index.tsx",
        db=db_session
    )
    assert res_low["decision"] == "ALLOW"

    # 2. Medium risk task in PRODUCTION -> DENY (due to environment restriction)
    res_env = PolicyEngine.evaluate(
        actor_type="AGENT",
        actor_id="developer",
        action_type="WRITE_CODE",
        project_id="P001",
        environment="PRODUCTION",
        resource="index.tsx",
        db=db_session
    )
    assert res_env["decision"] == "DENY"
    assert "environment" in res_env["reason"].lower()

    # 3. High risk task in STAGING -> APPROVAL_REQUIRED (exceeds MEDIUM risk limit)
    res_high = PolicyEngine.evaluate(
        actor_type="AGENT",
        actor_id="developer",
        action_type="DEPLOY_PRODUCTION",
        project_id="P001",
        environment="STAGING",
        resource="deploy_pkg",
        db=db_session
    )
    assert res_high["decision"] == "APPROVAL_REQUIRED"

    # 4. Critical risk task -> DENY
    res_crit = PolicyEngine.evaluate(
        actor_type="AGENT",
        actor_id="developer",
        action_type="MODIFY_DATABASE",
        project_id="P001",
        environment="DEVELOPMENT",
        resource="users_table",
        db=db_session
    )
    assert res_crit["decision"] == "DENY"

def test_agent_tool_permissions(db_session):
    """Verifies that tool permissions (ALLOWED, RESTRICTED, DENIED) are strictly enforced."""
    # Ensure developer:deployment is DENIED and developer:database is RESTRICTED
    dep_tool = db_session.query(AgentToolPermission).filter(
        AgentToolPermission.agent_id == "developer",
        AgentToolPermission.tool_name == "deployment"
    ).first()
    if not dep_tool:
        dep_tool = AgentToolPermission(
            id="atp-test-dev-dep",
            agent_id="developer",
            tool_name="deployment",
            permission_type="DENIED"
        )
        db_session.add(dep_tool)
    else:
        dep_tool.permission_type = "DENIED"

    db_tool = db_session.query(AgentToolPermission).filter(
        AgentToolPermission.agent_id == "developer",
        AgentToolPermission.tool_name == "database"
    ).first()
    if not db_tool:
        db_tool = AgentToolPermission(
            id="atp-test-dev-db",
            agent_id="developer",
            tool_name="database",
            permission_type="RESTRICTED"
        )
        db_session.add(db_tool)
    else:
        db_tool.permission_type = "RESTRICTED"
    db_session.commit()

    # 1. Action with DENIED tool -> DENY
    res_denied = PolicyEngine.evaluate(
        actor_type="AGENT",
        actor_id="developer",
        action_type="READ_FILE",
        project_id="P001",
        environment="DEVELOPMENT",
        resource="src",
        tool_name="deployment",
        db=db_session
    )
    assert res_denied["decision"] == "DENY"
    assert "prohibited from using tool" in res_denied["reason"]

    # 2. Action with RESTRICTED tool -> APPROVAL_REQUIRED
    res_restricted = PolicyEngine.evaluate(
        actor_type="AGENT",
        actor_id="developer",
        action_type="READ_FILE",
        project_id="P001",
        environment="DEVELOPMENT",
        resource="src",
        tool_name="database",
        db=db_session
    )
    assert res_restricted["decision"] == "APPROVAL_REQUIRED"
    assert "requires human operator approval" in res_restricted["reason"]

def test_production_deployment_requires_approval(db_session):
    """Verifies that production deployments match POL-001 and require human operator approval."""
    res = PolicyEngine.evaluate(
        actor_type="USER",
        actor_id="test_admin_user",
        action_type="DEPLOY_PRODUCTION",
        project_id="P001",
        environment="PRODUCTION",
        resource="production_server",
        db=db_session
    )
    assert res["decision"] == "APPROVAL_REQUIRED"
    assert res["policy_id"] == "POL-001"

def test_secret_redaction(db_session):
    """Verifies that API keys, passwords, and tokens are automatically masked."""
    text_with_secrets = "The api_key = 'AIzaSy1234567890abcdefghijklmnopqrstuvwxyz' and db_password=super_secret_passwd and bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    redacted = PolicyEngine.redact_secrets(text_with_secrets)
    assert "AIzaSy" not in redacted
    assert "super_secret" not in redacted
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in redacted
    assert "********" in redacted

def test_four_eyes_self_approval_block(db_session):
    """Verifies Four-Eyes principle: Requester cannot approve their own high-risk approval request."""
    # Create an approval request
    req = ApprovalEngine.create_approval_request(
        actor_type="USER",
        actor_id="dev_user",
        action_type="DEPLOY_PRODUCTION",
        project_id="P001",
        environment="PRODUCTION",
        resource="release_file",
        risk_level="HIGH",
        reason="Deploy fixes",
        policy_id="POL-001",
        db=db_session
    )
    
    # Requester dev_user attempts to self-approve
    res_self = ApprovalEngine.approve_request(request_id=req.id, approver_id="dev_user", db=db_session)
    assert res_self["success"] is False
    assert "Four-Eyes Principle violation" in res_self["message"]
    
    # Check if a policy violation was recorded
    vio = db_session.query(PolicyViolation).filter(
        PolicyViolation.actor_id == "dev_user",
        PolicyViolation.action == "SELF_APPROVE_ATTEMPT"
    ).first()
    assert vio is not None

    # Independent approver (release_mgr) approves successfully
    res_ind = ApprovalEngine.approve_request(request_id=req.id, approver_id="release_mgr", db=db_session)
    assert res_ind["success"] is True
    assert req.status == "APPROVED"
    assert req.approver == "release_mgr"

def test_security_exceptions_expiration(db_session):
    """Verifies that security exceptions expire and expired exceptions cease to bypass policy."""
    db_session.rollback()
    import uuid
    exp_id = f"exc-test-exp-{uuid.uuid4().hex[:6]}"
    act_id = f"exc-test-act-{uuid.uuid4().hex[:6]}"

    # 1. Create expired exception
    expired_exc = SecurityException(
        exception_id=exp_id,
        policy_id="POL-001",
        reason="Expired emergency bypass",
        requested_by="dev_user",
        approved_by="admin",
        scope="GLOBAL",
        expiration=datetime.utcnow() - timedelta(minutes=10),
        risk="HIGH",
        status="ACTIVE"
    )
    db_session.add(expired_exc)
    db_session.commit()

    # Expired exception should NOT allow bypass -> APPROVAL_REQUIRED
    res_exp = PolicyEngine.evaluate(
        actor_type="USER",
        actor_id="test_admin_user",
        action_type="DEPLOY_PRODUCTION",
        project_id="P001",
        environment="PRODUCTION",
        resource="prod_server",
        db=db_session
    )
    assert res_exp["decision"] == "APPROVAL_REQUIRED"

    # 2. Create active exception
    active_exc = SecurityException(
        exception_id=act_id,
        policy_id="POL-001",
        reason="Active staging sync bypass",
        requested_by="dev_user",
        approved_by="admin",
        scope="GLOBAL",
        expiration=datetime.utcnow() + timedelta(minutes=45),
        risk="HIGH",
        status="ACTIVE"
    )
    db_session.add(active_exc)
    db_session.commit()

    # Active exception should override and ALLOW
    res_act = PolicyEngine.evaluate(
        actor_type="USER",
        actor_id="test_admin_user",
        action_type="DEPLOY_PRODUCTION",
        project_id="P001",
        environment="PRODUCTION",
        resource="prod_server",
        db=db_session
    )
    assert res_act["decision"] == "ALLOW"
    assert "active security exception" in res_act["reason"]

    # Clean up test exception
    db_session.delete(active_exc)
    db_session.delete(expired_exc)
    db_session.commit()


def test_protected_resources_guard(db_session):
    """Verifies that protected resources (/security/.*, /auth/.*) require explicit approval/authorization."""
    # Agent attempting to modify a protected resource -> APPROVAL_REQUIRED
    res_agent = PolicyEngine.evaluate(
        actor_type="AGENT",
        actor_id="developer",
        action_type="WRITE_CODE",
        project_id="P001",
        environment="DEVELOPMENT",
        resource="/security/auth_provider.py",
        db=db_session
    )
    assert res_agent["decision"] == "APPROVAL_REQUIRED"
    assert ("protected under security policy" in res_agent["reason"] or "Core Security Path Policy" in res_agent["reason"])

def test_policy_engine_fails_safe():
    """Verifies fail-safe design: When PolicyEngine encounters an error, it returns DENY."""
    res = PolicyEngine.evaluate(
        actor_type="USER",
        actor_id="test_adm",
        action_type="DEPLOY_PRODUCTION",
        project_id="P001",
        environment="PRODUCTION",
        resource="prod_server",
        db=None # db is None triggers fail-safe
    )
    assert res["decision"] == "DENY"
    assert "fail-safe" in res["reason"]

def test_governance_agent_recommendations_workflow(db_session):
    """Verifies GovernanceAgent conflict analysis, AI recommendations generation, and human review."""
    import uuid
    # Ensure a fresh proposed recommendation exists for test
    rec_id = f"rec-test-{uuid.uuid4().hex[:6]}"
    rec_test = GovernanceRecommendation(
        id=rec_id,
        title="Test Guardrail Recommendation",
        category="POLICY",
        recommendation_type="ADD_APPROVAL",
        target_id="POL-001",
        details='{"four_eyes": true}',
        rationale="Testing approval workflow",
        risk_reduction="HIGH",
        status="PROPOSED"
    )
    db_session.add(rec_test)
    db_session.commit()

    # 1. Trigger agent scan
    recs = GovernanceAgent.generate_recommendations(db_session)
    assert len(recs) > 0
    
    # 2. Human reviewer approves recommendation
    result = GovernanceAgent.apply_recommendation(rec_test.id, "admin", db_session)
    assert result["success"] is True
    assert rec_test.status == "APPLIED"
    assert rec_test.reviewed_by == "admin"


def test_api_governance_endpoints():
    """Verifies REST API endpoints for policies, agents, approvals, audit, risk, and report."""
    # 1. GET /api/governance/policies
    res_pol = client.get("/api/governance/policies")
    assert res_pol.status_code == 200
    assert len(res_pol.json()) >= 3

    # 2. GET /api/governance/agents
    res_ag = client.get("/api/governance/agents")
    assert res_ag.status_code == 200
    assert len(res_ag.json()) > 0

    # 3. POST /api/governance/policies/{id}/simulate
    sim_payload = {
        "actor_type": "AGENT",
        "actor_id": "developer",
        "action_type": "DEPLOY_PRODUCTION",
        "project_id": "P001",
        "environment": "PRODUCTION",
        "resource": "server"
    }
    res_sim = client.post("/api/governance/policies/POL-001/simulate", json=sim_payload)
    assert res_sim.status_code == 200
    sim_data = res_sim.json()
    assert sim_data["decision"] in ["APPROVAL_REQUIRED", "DENY"]

    # 4. GET /api/governance/report
    res_rep = client.get("/api/governance/report")
    assert res_rep.status_code == 200
    rep_data = res_rep.json()
    assert "trust_score" in rep_data
    assert "total_actions" in rep_data
    assert "risk_distribution" in rep_data

    # 5. GET /api/governance/roles
    res_roles = client.get("/api/governance/roles")
    assert res_roles.status_code == 200
    assert len(res_roles.json()) >= 5

    # 6. GET /api/governance/permissions
    res_perms = client.get("/api/governance/permissions")
    assert res_perms.status_code == 200
    assert len(res_perms.json()) >= 10

    # 7. GET /api/governance/audit
    res_audit = client.get("/api/governance/audit")
    assert res_audit.status_code == 200
