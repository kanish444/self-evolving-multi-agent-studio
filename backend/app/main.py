from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import Base, engine
from .core.security import hash_password
from .api import projects, tasks, agents, iterations, tests, evolution, memory, logs, health, ai, orchestration, sandbox, autonomous, delivery, monitoring, governance, auth

def setup_database():
    import uuid
    from sqlalchemy import text
    from .core.database import SessionLocal
    # Create all tables first
    Base.metadata.create_all(bind=engine)
    # Check and alter learning_candidates columns if not exist
    try:
        with engine.begin() as conn:
            # Users table alterations
            u_res = conn.execute(text("PRAGMA table_info(users)"))
            u_cols = [row[1] for row in u_res.fetchall()]
            if "password_hash" not in u_cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))

            project_owner_columns = [row[1] for row in conn.execute(text("PRAGMA table_info(projects)"))]
            if "owner_id" not in project_owner_columns:
                conn.execute(text("ALTER TABLE projects ADD COLUMN owner_id VARCHAR"))

            # Projects table alterations
            proj_res = conn.execute(text("PRAGMA table_info(projects)"))
            proj_cols = [row[1] for row in proj_res.fetchall()]
            if "requirements" not in proj_cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN requirements TEXT"))
            if "architecture_plan" not in proj_cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN architecture_plan TEXT"))
            if "permissions_granted" not in proj_cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN permissions_granted TEXT"))
            if "repo_url" not in proj_cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN repo_url VARCHAR"))
            if "workspace_path" not in proj_cols:
                conn.execute(text("ALTER TABLE projects ADD COLUMN workspace_path VARCHAR"))

            res = conn.execute(text("PRAGMA table_info(learning_candidates)"))
            columns = [row[1] for row in res.fetchall()]
            if "incident_id" not in columns:
                conn.execute(text("ALTER TABLE learning_candidates ADD COLUMN incident_id VARCHAR"))
            if "evidence" not in columns:
                conn.execute(text("ALTER TABLE learning_candidates ADD COLUMN evidence TEXT"))
            if "scope" not in columns:
                conn.execute(text("ALTER TABLE learning_candidates ADD COLUMN scope VARCHAR"))
            if "status" not in columns:
                conn.execute(text("ALTER TABLE learning_candidates ADD COLUMN status VARCHAR DEFAULT 'PROPOSED'"))

            # Governance table alterations
            p_res = conn.execute(text("PRAGMA table_info(permissions)"))
            p_cols = [row[1] for row in p_res.fetchall()]
            if "resource" not in p_cols:
                conn.execute(text("ALTER TABLE permissions ADD COLUMN resource VARCHAR"))
            if "action" not in p_cols:
                conn.execute(text("ALTER TABLE permissions ADD COLUMN action VARCHAR"))
            if "risk_level" not in p_cols:
                conn.execute(text("ALTER TABLE permissions ADD COLUMN risk_level VARCHAR DEFAULT 'MEDIUM'"))

            ap_res = conn.execute(text("PRAGMA table_info(agent_permissions)"))
            ap_cols = [row[1] for row in ap_res.fetchall()]
            if "allowed_permissions" not in ap_cols:
                conn.execute(text("ALTER TABLE agent_permissions ADD COLUMN allowed_permissions TEXT"))
            if "allowed_tools" not in ap_cols:
                conn.execute(text("ALTER TABLE agent_permissions ADD COLUMN allowed_tools TEXT"))

            pol_res = conn.execute(text("PRAGMA table_info(policies)"))
            pol_cols = [row[1] for row in pol_res.fetchall()]
            if "updated_by" not in pol_cols:
                conn.execute(text("ALTER TABLE policies ADD COLUMN updated_by VARCHAR"))
            if "created_at" not in pol_cols:
                conn.execute(text("ALTER TABLE policies ADD COLUMN created_at DATETIME"))


            apr_res = conn.execute(text("PRAGMA table_info(governance_approval_requests)"))
            apr_cols = [row[1] for row in apr_res.fetchall()]
            if "expires_at" not in apr_cols:
                conn.execute(text("ALTER TABLE governance_approval_requests ADD COLUMN expires_at DATETIME"))
    except Exception as e:
        print(f"Startup database schema check failed: {e}")


    import os
    if os.getenv("SEED_DEMO_DATA", "false").lower() != "true":
        return

    # Seed Governance Defaults
    db = SessionLocal()
    try:
        from .models.governance import (
            Role, Permission, RolePermission, User, UserRole,
            AgentPermission, AgentToolPermission, Policy, PolicyVersion,
            ProtectedResource, DataClassification, GovernanceRecommendation,
            SecurityEvent, GovernedAction, AuditEvent
        )
        
        # 1. Seed All 8 RBAC Roles
        roles = {
            "ADMIN": "Administrator with full system and policy management privileges",
            "DEVELOPER": "Implements code features, runs tests, and accesses sandbox",
            "TESTER": "Runs automated tests and reads test results",
            "PROJECT_MANAGER": "Scopes project requirements and observes project progress",
            "ARCHITECT": "Designs system architectures and modifies configuration files",
            "SECURITY_REVIEWER": "Inspects security reports, audits violations, and reviews exceptions",
            "RELEASE_MANAGER": "Creates releases, manages staging and requests production deployments",
            "VIEWER": "Read-only stakeholder observer access"
        }
        for r_id, r_desc in roles.items():
            r = db.query(Role).filter(Role.id == r_id).first()
            if not r:
                db.add(Role(id=r_id, name=r_id, description=r_desc))
            else:
                r.description = r_desc
        db.commit()
                
        # 2. Seed Granular Permissions with resource, action, and risk_level
        permissions_data = [
            ("READ_PROJECT", "Read project repositories, boards, and artifacts", "PROJECT", "READ", "LOW"),
            ("WRITE_CODE", "Create and modify source files in repository", "CODE", "WRITE", "MEDIUM"),
            ("DELETE_FILE", "Delete source or asset files from workspace", "FILE", "DELETE", "CRITICAL"),
            ("RUN_TEST", "Trigger automated test suites execution", "TEST", "EXECUTE", "LOW"),
            ("RUN_SANDBOX", "Execute arbitrary code inside safe sandbox container", "SANDBOX", "EXECUTE", "LOW"),
            ("ACCESS_DATABASE", "Read database records and schemas", "DATABASE", "READ", "MEDIUM"),
            ("MODIFY_DATABASE", "Execute database writes, migrations, or schema alterations", "DATABASE", "WRITE", "CRITICAL"),
            ("CREATE_RELEASE", "Tag release version and package immutable artifact", "RELEASE", "CREATE", "HIGH"),
            ("DEPLOY_STAGING", "Execute automated deployment on staging environment", "DEPLOYMENT", "DEPLOY", "MEDIUM"),
            ("DEPLOY_PRODUCTION", "Execute live rollout on production environment", "DEPLOYMENT", "DEPLOY", "HIGH"),
            ("REQUEST_PRODUCTION_DEPLOYMENT", "Initiate production release approval pipeline", "DEPLOYMENT", "REQUEST", "HIGH"),
            ("ROLLBACK", "Trigger automated deployment rollback to previous release", "DEPLOYMENT", "ROLLBACK", "HIGH"),
            ("ACCESS_SECRET", "Read encrypted system secrets and environment keys", "SECRET", "ACCESS", "HIGH"),
            ("MODIFY_CONFIGURATION", "Update environment or application configurations", "CONFIG", "MODIFY", "HIGH"),
            ("MANAGE_POLICY", "Create, update, version, or toggle security policies", "POLICY", "MANAGE", "CRITICAL"),
            ("VIEW_SECURITY_REPORT", "Inspect security violations, audit trails, and events", "SECURITY", "READ", "LOW"),
            ("APPROVE_SECURITY_EXCEPTION", "Grant time-bounded temporary security exception bypass", "SECURITY", "APPROVE", "HIGH"),
            ("MANAGE_USERS", "Create, modify, and assign user accounts and roles", "USER", "MANAGE", "CRITICAL"),
            ("MANAGE_ROLES", "Configure role definitions and assigned permission matrices", "ROLE", "MANAGE", "CRITICAL")
        ]
        
        for p_id, p_desc, p_res, p_act, p_risk in permissions_data:
            p = db.query(Permission).filter(Permission.id == p_id).first()
            if not p:
                db.add(Permission(id=p_id, name=p_id, description=p_desc, resource=p_res, action=p_act, risk_level=p_risk))
            else:
                p.resource = p_res
                p.action = p_act
                p.risk_level = p_risk
        db.commit()

        # 3. Associate Explicit Role-Permissions
        role_permissions_map = {
            "ADMIN": [p[0] for p in permissions_data],
            "DEVELOPER": ["READ_PROJECT", "WRITE_CODE", "RUN_TEST", "RUN_SANDBOX", "ACCESS_DATABASE"],
            "TESTER": ["READ_PROJECT", "RUN_TEST", "RUN_SANDBOX"],
            "PROJECT_MANAGER": ["READ_PROJECT", "VIEW_SECURITY_REPORT"],
            "ARCHITECT": ["READ_PROJECT", "WRITE_CODE", "RUN_SANDBOX", "MODIFY_CONFIGURATION"],
            "SECURITY_REVIEWER": ["READ_PROJECT", "VIEW_SECURITY_REPORT", "APPROVE_SECURITY_EXCEPTION"],
            "RELEASE_MANAGER": ["READ_PROJECT", "CREATE_RELEASE", "DEPLOY_STAGING", "REQUEST_PRODUCTION_DEPLOYMENT", "ROLLBACK"],
            "VIEWER": ["READ_PROJECT"]
        }
        for r_id, p_ids in role_permissions_map.items():
            for p_id in p_ids:
                exists = db.query(RolePermission).filter(
                    RolePermission.role_id == r_id,
                    RolePermission.permission_id == p_id
                ).first()
                if not exists:
                    db.add(RolePermission(role_id=r_id, permission_id=p_id))
        db.commit()

        # 4. Seed Users with secure password hashes
        users = [
            ("admin", "admin@se-maestro.ai", "Master Administrator", "ADMIN", "AdminMaestro2026!"),
            ("dev_user", "developer@se-maestro.ai", "Lead Developer (Kanishk)", "DEVELOPER", "DeveloperMaestro2026!"),
            ("tester_user", "tester@se-maestro.ai", "QA Engineer (Sarah Chen)", "TESTER", "TesterMaestro2026!"),
            ("pm_user", "pm@se-maestro.ai", "Product Manager", "PROJECT_MANAGER", "PmMaestro2026!"),
            ("architect_user", "architect@se-maestro.ai", "Lead Architect", "ARCHITECT", "ArchitectMaestro2026!"),
            ("viewer_user", "guest@se-maestro.ai", "Guest Stakeholder", "VIEWER", "GuestMaestro2026!"),
            ("release_mgr", "release@se-maestro.ai", "Release Manager", "RELEASE_MANAGER", "ReleaseMaestro2026!"),
            ("security_rev", "security@se-maestro.ai", "Security Specialist", "SECURITY_REVIEWER", "SecurityMaestro2026!"),
        ]
        for u_id, u_email, u_name, r_id, plain_pass in users:
            u = db.query(User).filter(User.id == u_id).first()
            p_hash = hash_password(plain_pass)
            if not u:
                db.add(User(id=u_id, username=u_id, email=u_email, full_name=u_name, password_hash=p_hash, is_active=True))
                db.add(UserRole(user_id=u_id, role_id=r_id))
            else:
                u.password_hash = p_hash
                u.email = u_email
                u.full_name = u_name
                u.username = u_id
                u.is_active = True
                # Ensure user role association exists
                ur = db.query(UserRole).filter(UserRole.user_id == u.id).first()
                if not ur:
                    db.add(UserRole(user_id=u.id, role_id=r_id))
                else:
                    ur.role_id = r_id
        db.commit()

        # 5. Seed Agent boundaries
        agents_bounds = [
            ("pm", "DEVELOPMENT", "LOW", "READ_PROJECT,VIEW_SECURITY_REPORT"),
            ("architect", "DEVELOPMENT", "LOW", "READ_PROJECT,WRITE_CODE,RUN_SANDBOX"),
            ("developer", "DEVELOPMENT,STAGING", "MEDIUM", "READ_PROJECT,WRITE_CODE,RUN_TEST,RUN_SANDBOX"),
            ("tester", "DEVELOPMENT,STAGING", "LOW", "READ_PROJECT,RUN_TEST,RUN_SANDBOX"),
            ("debugger", "DEVELOPMENT", "LOW", "READ_PROJECT,WRITE_CODE,RUN_TEST,RUN_SANDBOX"),
            ("reviewer", "DEVELOPMENT", "LOW", "READ_PROJECT"),
            ("evolution", "DEVELOPMENT", "MEDIUM", "READ_PROJECT,ACCESS_DATABASE"),
            ("incident_analyst", "PRODUCTION,STAGING", "MEDIUM", "READ_PROJECT,VIEW_SECURITY_REPORT"),
            ("incident_response", "PRODUCTION,STAGING", "HIGH", "READ_PROJECT,DEPLOY_STAGING,DEPLOY_PRODUCTION,ROLLBACK")
        ]
        for a_id, envs, risk, perms_str in agents_bounds:
            ag = db.query(AgentPermission).filter(AgentPermission.agent_id == a_id).first()
            if not ag:
                db.add(AgentPermission(
                    id=f"ap-{a_id}",
                    agent_id=a_id,
                    project_id="P001",
                    allowed_environments=envs,
                    max_risk_limit=risk,
                    allowed_permissions=perms_str
                ))
        db.commit()

        # 6. Seed Agent Tool permissions
        agent_tools = [
            ("developer", "filesystem", "ALLOWED"),
            ("developer", "sandbox", "ALLOWED"),
            ("developer", "database", "RESTRICTED"),
            ("developer", "deployment", "DENIED"),
            ("developer", "secret_manager", "DENIED"),
            ("tester", "filesystem", "ALLOWED"),
            ("tester", "sandbox", "ALLOWED"),
            ("tester", "database", "RESTRICTED"),
            ("tester", "deployment", "DENIED"),
            ("pm", "filesystem", "ALLOWED"),
            ("pm", "sandbox", "DENIED"),
            ("architect", "filesystem", "ALLOWED"),
            ("architect", "sandbox", "ALLOWED"),
            ("incident_response", "deployment", "ALLOWED"),
            ("incident_response", "database", "RESTRICTED"),
            ("incident_response", "sandbox", "ALLOWED")
        ]
        for a_id, t_name, p_type in agent_tools:
            exists = db.query(AgentToolPermission).filter(
                AgentToolPermission.agent_id == a_id,
                AgentToolPermission.tool_name == t_name
            ).first()
            if not exists:
                db.add(AgentToolPermission(
                    id=f"atp-{a_id}-{t_name}",
                    agent_id=a_id,
                    tool_name=t_name,
                    permission_type=p_type
                ))
        db.commit()

        # 7. Seed Default Policies
        policies = [
            ("POL-001", "Production Deployment Policy", "Production deployments require Release Manager approval", "ENVIRONMENT", '{"environment": "PRODUCTION", "action": "DEPLOY_PRODUCTION", "requires_approval": true, "approver_role": "RELEASE_MANAGER", "decision": "APPROVAL_REQUIRED"}', 100),
            ("POL-002", "Database Safety Policy", "Production database destructive operations are blocked", "GLOBAL", '{"action": "MODIFY_DATABASE", "environment": "PRODUCTION", "destructive_only": true, "decision": "DENY"}', 100),
            ("POL-003", "Secret Exposure Prevention Policy", "Strict access restrictions on environment secrets", "GLOBAL", '{"action": "ACCESS_SECRET", "decision": "APPROVAL_REQUIRED", "approver_role": "ADMIN"}', 90),
            ("POL-004", "Core Security Path Policy", "Protect critical security and authentication modules", "RESOURCE", '{"resource_pattern": "^/security/.*", "requires_approval": true, "decision": "APPROVAL_REQUIRED"}', 80)
        ]
        for p_id, p_name, p_desc, p_scope, p_rules, p_pri in policies:
            if not db.query(Policy).filter(Policy.id == p_id).first():
                db.add(Policy(
                    id=p_id,
                    name=p_name,
                    description=p_desc,
                    scope=p_scope,
                    rules=p_rules,
                    enabled=True,
                    priority=p_pri,
                    created_by="system",
                    version=1
                ))
                db.add(PolicyVersion(
                    id=f"pver-{uuid.uuid4().hex[:8]}",
                    policy_id=p_id,
                    version=1,
                    rules=p_rules,
                    created_by="system"
                ))
        db.commit()

        # 8. Seed Protected Resources
        resources = [
            ("pr-security", "^/security/.*", "Requires SECURITY_REVIEWER approval", True, "SECURITY_REVIEWER"),
            ("pr-governance", "^/governance/.*", "Requires ADMIN approval", True, "ADMIN"),
            ("pr-auth", "^/auth/.*", "Requires ADMIN approval", True, "ADMIN"),
            ("pr-deployment", "^/deployment/.*", "Requires RELEASE_MANAGER approval", True, "RELEASE_MANAGER"),
            ("pr-sandbox", "^/sandbox/.*", "Requires DEVELOPER permission", True, "DEVELOPER")
        ]
        for r_id, r_pat, r_desc, r_app, r_role in resources:
            if not db.query(ProtectedResource).filter(ProtectedResource.id == r_id).first():
                db.add(ProtectedResource(
                    id=r_id,
                    path_pattern=r_pat,
                    description=r_desc,
                    requires_approval=r_app,
                    min_role=r_role
                ))
        db.commit()

        # 9. Seed Data Classification
        classifications = [
            ("dc-db", "se_maestro.db", "RESTRICTED"),
            ("dc-secrets", "secrets", "RESTRICTED"),
            ("dc-code", "source_code", "INTERNAL"),
            ("dc-logs", "audit_logs", "CONFIDENTIAL")
        ]
        for c_id, c_res, c_lev in classifications:
            if not db.query(DataClassification).filter(DataClassification.id == c_id).first():
                db.add(DataClassification(
                    id=c_id,
                    resource_name=c_res,
                    classification_level=c_lev
                ))
        db.commit()

        # 10. Seed AI Policy Recommendations
        recs = [
            ("rec-01", "Enforce Four-Eyes Approval on Production Releases", "POLICY", "ADD_APPROVAL", "POL-001", '{"four_eyes": true, "min_approvers": 1, "approver_role": "RELEASE_MANAGER"}', "Prevents developer self-approvals on production code changes.", "HIGH"),
            ("rec-02", "Restrict Database Tool Usage for Developer Agent", "TOOL", "RESTRICT_TOOL", "developer->database", '{"permission_type": "RESTRICTED"}', "Developer agent should require approval before direct SQL modifications.", "HIGH"),
            ("rec-03", "Auto-Mask Environment API Tokens in Sandbox Output", "RESOURCE", "PROTECT_RESOURCE", "^/security/credentials", '{"redaction_enabled": true}', "Prevents API key leaks in stdout logs and traces.", "CRITICAL")
        ]
        for r_id, r_title, r_cat, r_type, r_target, r_details, r_rat, r_reduc in recs:
            if not db.query(GovernanceRecommendation).filter(GovernanceRecommendation.id == r_id).first():
                db.add(GovernanceRecommendation(
                    id=r_id,
                    title=r_title,
                    category=r_cat,
                    recommendation_type=r_type,
                    target_id=r_target,
                    details=r_details,
                    rationale=r_rat,
                    risk_reduction=r_reduc,
                    status="PROPOSED"
                ))
        db.commit()

        # 11. Seed Security Events
        sec_events = [
            ("sec-evt-01", "SUSPICIOUS_SECRET_ACCESS", "AGENT", "developer", "HIGH", "Detected attempt to access /security/secrets file directly without authorization.", 1, "OPEN"),
            ("sec-evt-02", "REPEATED_BLOCKED_ACTIONS", "USER", "viewer_user", "MEDIUM", "Guest user attempted repeated write operations on project P001.", 3, "OPEN")
        ]
        for s_id, s_type, s_act_t, s_act_id, s_sev, s_desc, s_occ, s_stat in sec_events:
            if not db.query(SecurityEvent).filter(SecurityEvent.id == s_id).first():
                db.add(SecurityEvent(
                    id=s_id,
                    event_type=s_type,
                    actor_type=s_act_t,
                    actor_id=s_act_id,
                    severity=s_sev,
                    description=s_desc,
                    occurrences=s_occ,
                    status=s_stat
                ))
        db.commit()
    except Exception as se:
        print(f"Failed to seed initial governance dataset: {se}")
        db.rollback()
    finally:
        db.close()


setup_database()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="SE-MAESTRO AI Engineering Studio backend API foundation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS - allows local Vite dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(health.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(iterations.router, prefix="/api")
app.include_router(tests.router, prefix="/api")
app.include_router(evolution.router, prefix="/api")
app.include_router(memory.router, prefix="/api")
app.include_router(logs.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(orchestration.router, prefix="/api")
app.include_router(sandbox.router, prefix="/api")
app.include_router(autonomous.router, prefix="/api")
app.include_router(delivery.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
app.include_router(governance.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])







@app.get("/")
def read_root():
    return {"message": "Welcome to SE-MAESTRO REST API. Visit /docs for OpenAPI Swagger specifications."}



from .api import live
from .live.engine import recover_interrupted
recover_interrupted()
app.include_router(live.router, prefix="/api")

# Legacy demonstration APIs contain simulated execution. Keep them inaccessible by
# default rather than letting the new workspace accidentally call them.
@app.middleware("http")
async def live_api_boundary(request, call_next):
    import os
    import re
    from fastapi.responses import JSONResponse
    path = request.url.path.rstrip("/")
    allowed = (path == "/api/health" or path.startswith("/api/auth/") or
               path == "/api/projects" or
               re.fullmatch(r"/api/projects/[A-Za-z0-9_-]+/(?:architect-chat|architect-plan|approve-plan|permissions)", path) or
               re.fullmatch(r"/api/projects/[A-Za-z0-9_-]+", path) or
               re.match(r"/api/projects/[A-Za-z0-9_-]+/live(?:/|$)", path))
    if request.method != "OPTIONS" and path.startswith("/api/") and not allowed and os.getenv("ENABLE_LEGACY_DEMOS", "false").lower() != "true":
        return JSONResponse(status_code=410, content={"detail": "Legacy demonstration endpoint disabled. Use the authenticated live workspace API."})
    return await call_next(request)
