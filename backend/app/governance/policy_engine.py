import re
import json
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.governance import (
    User, Role, Permission, UserRole, RolePermission,
    AgentPermission, AgentToolPermission, Policy, PolicyVersion,
    GovernedAction, ApprovalRequest, PolicyViolation, SecurityException,
    AuditEvent, ProtectedResource, DataClassification, SecurityEvent
)

logger = logging.getLogger("app.governance.policy_engine")

# Agent role alias mappings (supporting full names & abbreviations)
AGENT_ROLE_ALIASES = {
    "project_manager": "pm",
    "pm": "pm",
    "architect": "architect",
    "developer": "developer",
    "developer_agent": "developer",
    "tester": "tester",
    "debugger": "debugger",
    "reviewer": "reviewer",
    "evolution": "evolution",
    "incident_analyst": "incident_analyst",
    "incident_response": "incident_response"
}

# Action to Permission mapping
ACTION_TO_PERMISSION = {
    "READ_PROJECT": "READ_PROJECT",
    "READ_FILE": "READ_PROJECT",
    "READ_CODE": "READ_PROJECT",
    "READ_TEST_RESULTS": "READ_PROJECT",
    
    "WRITE_CODE": "WRITE_CODE",
    "WRITE_FILE": "WRITE_CODE",
    "CREATE_FILE": "WRITE_CODE",
    "MODIFY_CODE": "WRITE_CODE",
    "DELETE_FILE": "WRITE_CODE",
    
    "RUN_TEST": "RUN_TEST",
    "RUN_SANDBOX": "RUN_SANDBOX",
    
    "ACCESS_DATABASE": "ACCESS_DATABASE",
    "MODIFY_DATABASE": "MODIFY_DATABASE",
    
    "CREATE_RELEASE": "CREATE_RELEASE",
    "DEPLOY_STAGING": "DEPLOY_STAGING",
    "DEPLOY_PRODUCTION": "DEPLOY_PRODUCTION",
    "REQUEST_PRODUCTION_DEPLOYMENT": "REQUEST_PRODUCTION_DEPLOYMENT",
    "ROLLBACK": "DEPLOY_PRODUCTION",
    
    "ACCESS_SECRET": "ACCESS_SECRET",
    "ACCESS_PRODUCTION_SECRET": "ACCESS_SECRET",
    "MODIFY_CONFIGURATION": "MODIFY_CONFIGURATION",
    "MANAGE_POLICY": "MANAGE_POLICIES",
    "MODIFY_POLICY": "MANAGE_POLICIES",
    "VIEW_SECURITY_REPORT": "VIEW_SECURITY_REPORT",
    "APPROVE_SECURITY_EXCEPTION": "APPROVE_SECURITY_EXCEPTION",
    "MANAGE_USERS": "MANAGE_USERS",
    "MANAGE_ROLES": "MANAGE_ROLES"
}

class PolicyEngine:
    @staticmethod
    def get_action_risk_level(action_type: str) -> str:
        """Classifies action types into configurable risk levels (LOW, MEDIUM, HIGH, CRITICAL)."""
        if not action_type:
            return "MEDIUM"
            
        action_upper = action_type.upper()
        
        # Low risk actions
        low_actions = {
            "READ_FILE", "READ_PROJECT", "READ_CODE", "READ_TEST_RESULTS",
            "RUN_TEST", "RUN_SANDBOX", "VIEW_SECURITY_REPORT", "LIST_POLICIES"
        }
        if action_upper in low_actions:
            return "LOW"
            
        # Medium risk actions
        medium_actions = {
            "WRITE_FILE", "CREATE_FILE", "MODIFY_CODE", "DEPLOY_STAGING",
            "ACCESS_DATABASE", "DATABASE_READ", "VIEW_LOGS"
        }
        if action_upper in medium_actions:
            return "MEDIUM"
            
        # High risk actions
        high_actions = {
            "CREATE_RELEASE", "DEPLOY_PRODUCTION", "ROLLBACK", "ACCESS_SECRET",
            "MODIFY_CONFIGURATION", "REQUEST_PRODUCTION_DEPLOYMENT",
            "DATABASE_WRITE", "DATABASE_MIGRATION", "APPROVE_SECURITY_EXCEPTION"
        }
        if action_upper in high_actions:
            return "HIGH"
            
        # Critical risk actions
        critical_actions = {
            "MODIFY_DATABASE", "DELETE_FILE", "MODIFY_POLICY", "MANAGE_POLICY",
            "ACCESS_PRODUCTION_SECRET", "MODIFY_SECURITY_POLICY",
            "DATABASE_DESTRUCTIVE", "DELETE_AUDIT", "MANAGE_USERS", "MANAGE_ROLES"
        }
        if action_upper in critical_actions:
            return "CRITICAL"
            
        return "MEDIUM"

    @staticmethod
    def checkRisk(action_type: str) -> str:
        """Helper alias for risk classification."""
        return PolicyEngine.get_action_risk_level(action_type)

    @staticmethod
    def redact_secrets(text: str) -> str:
        """Automatically redacts sensitive API keys, passwords, tokens, and credentials from text."""
        if not text or not isinstance(text, str):
            return text
            
        patterns = [
            (r'(?i)(api_key|apikey|password|passwd|secret|token|auth_token|db_password|access_token|private_key)\s*[:=]\s*["\']?[a-zA-Z0-9_\-\.\:\@]{6,}["\']?', r'\1=********'),
            (r'(?i)(bearer\s+)[a-zA-Z0-9_\-\.\:\@]{10,}', r'\1********'),
            (r'(?i)(AIzaSy)[a-zA-Z0-9_\-]{35}', r'********'), # Google Cloud API Key
            (r'AKIA[0-9A-Z]{16}', r'AKIA********'), # AWS Access Key
            (r'gh[opsr]_[0-9a-zA-Z]{36}', r'gh********'), # GitHub Token
            (r'(?i)(mongodb|postgres|mysql|sqlite|redis):\/\/[a-zA-Z0-9_]+:[a-zA-Z0-9_\-]+@', r'\1://user:********@')
        ]
        redacted = text
        for pat, repl in patterns:
            redacted = re.sub(pat, repl, redacted)
        return redacted

    @staticmethod
    def log_audit(
        actor_type: str, actor_id: str, action: str, resource: Optional[str],
        project_id: Optional[str], environment: Optional[str], decision: str,
        policy_id: Optional[str], risk_level: str, approval_id: Optional[str],
        db: Session, trace_id: Optional[str] = None
    ) -> Optional[AuditEvent]:
        """Generates an immutable audit record in the database."""
        if not db:
            return None
        try:
            event_id = f"aud-{uuid.uuid4().hex[:8]}"
            audit = AuditEvent(
                id=event_id,
                actor_type=actor_type,
                actor_id=actor_id,
                action=action,
                resource=PolicyEngine.redact_secrets(resource) if resource else None,
                project_id=project_id,
                environment=environment,
                decision=decision,
                policy_id=policy_id,
                risk_level=risk_level,
                approval_id=approval_id,
                timestamp=datetime.utcnow(),
                trace_id=trace_id or f"trace_{uuid.uuid4().hex[:6]}"
            )
            db.add(audit)
            db.commit()
            return audit
        except Exception as e:
            logger.error(f"Failed to persist audit log event: {e}")
            if db:
                db.rollback()
            return None

    @staticmethod
    def checkPermission(actor_type: str, actor_id: str, permission_id: str, db: Session) -> bool:
        """Checks if a user or agent holds an explicit permission."""
        if not db:
            return False
        try:
            if actor_type.upper() == "USER":
                user_roles = db.query(UserRole).filter(UserRole.user_id == actor_id).all()
                role_ids = [ur.role_id for ur in user_roles]
                if "ADMIN" in role_ids:
                    return True
                role_perms = db.query(RolePermission).filter(RolePermission.role_id.in_(role_ids)).all()
                granted_perms = [rp.permission_id for rp in role_perms]
                return permission_id in granted_perms
            elif actor_type.upper() == "AGENT":
                canonical_id = AGENT_ROLE_ALIASES.get(actor_id.lower(), actor_id.lower())
                agent_perm = db.query(AgentPermission).filter(AgentPermission.agent_id == canonical_id).first()
                if not agent_perm or not agent_perm.allowed_permissions:
                    return False
                allowed = [p.strip().upper() for p in agent_perm.allowed_permissions.split(",")]
                return permission_id.upper() in allowed
            return False
        except Exception:
            return False

    @staticmethod
    def checkEnvironment(agent_id: str, environment: str, project_id: Optional[str], db: Session) -> bool:
        """Checks if an agent is authorized to operate in the specified environment."""
        if not db or not environment:
            return True
        try:
            canonical_id = AGENT_ROLE_ALIASES.get(agent_id.lower(), agent_id.lower())
            query = db.query(AgentPermission).filter(AgentPermission.agent_id == canonical_id)
            if project_id:
                query = query.filter(AgentPermission.project_id == project_id)
            agent_perm = query.first()
            if not agent_perm:
                return False
            allowed_envs = [e.strip().upper() for e in agent_perm.allowed_environments.split(",")]
            return environment.upper() in allowed_envs
        except Exception:
            return False

    @staticmethod
    def requiresApproval(action_type: str, environment: Optional[str], risk_level: str, policy_id: Optional[str], db: Session) -> bool:
        """Checks if an action requires human approval."""
        if risk_level in ["HIGH", "CRITICAL"] and environment and environment.upper() == "PRODUCTION":
            return True
        if policy_id and db:
            pol = db.query(Policy).filter(Policy.id == policy_id, Policy.enabled == True).first()
            if pol and pol.rules:
                try:
                    rules = json.loads(pol.rules)
                    return rules.get("requires_approval", False) or rules.get("decision") == "APPROVAL_REQUIRED"
                except Exception:
                    pass
        return risk_level == "HIGH"

    @staticmethod
    def explainDecision(eval_result: Dict[str, Any]) -> str:
        """Returns a concise operational explanation for governance decision without hidden chain of thought."""
        decision = eval_result.get("decision", "DENY")
        reason = eval_result.get("reason", "No reason provided")
        risk = eval_result.get("risk_level", "MEDIUM")
        pol_id = eval_result.get("policy_id")
        
        pol_str = f" under policy {pol_id}" if pol_id else ""
        return f"Decision: {decision} (Risk: {risk}){pol_str}. Reason: {reason}"

    @staticmethod
    def evaluate(
        actor_type: str, # USER, AGENT, TOOL, WORKFLOW, SYSTEM
        actor_id: str,   # user_id or agent_id (e.g. dev_user, developer, pm, tester)
        action_type: str, # DEPLOY_PRODUCTION, READ_FILE, RUN_SANDBOX, etc.
        project_id: Optional[str] = None,
        environment: Optional[str] = None,
        resource: Optional[str] = None,
        tool_name: Optional[str] = None,
        db: Optional[Session] = None,
        trace_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates an action request against active policy sets.
        Returns: {
            "decision": "ALLOW" | "DENY" | "APPROVAL_REQUIRED" | "CONDITIONALLY_ALLOWED",
            "reason": str,
            "requires_approval": bool,
            "risk_level": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
            "policy_id": str | None,
            "policy_name": str | None
        }
        """
        try:
            # 1. Classify Risk Level
            risk_level = PolicyEngine.get_action_risk_level(action_type)
            action_type_upper = action_type.upper() if action_type else "UNKNOWN"
            actor_type_upper = actor_type.upper() if actor_type else "USER"
            actor_id_str = actor_id or "unknown"
            
            # If db is not provided or uninitialized, fail safe
            if not db:
                return {
                    "decision": "DENY",
                    "reason": "PolicyEngine database session unavailable: fail-safe DENY triggered",
                    "requires_approval": False,
                    "risk_level": "CRITICAL",
                    "policy_id": None,
                    "policy_name": None
                }

            # Check if governance database is initialized
            try:
                role_count = db.query(Role).count()
                if role_count == 0:
                    return {
                        "decision": "ALLOW",
                        "reason": "Governance system not initialized",
                        "requires_approval": False,
                        "risk_level": risk_level,
                        "policy_id": None,
                        "policy_name": None
                    }
            except Exception:
                pass

            # 2. Check Security Exceptions (must be ACTIVE and not expired)
            active_exceptions = db.query(SecurityException).filter(
                SecurityException.status == "ACTIVE"
            ).all()
            
            now = datetime.utcnow()
            for exc in active_exceptions:
                if exc.expiration and exc.expiration < now:
                    # Mark expired in DB
                    exc.status = "EXPIRED"
                    db.commit()
                    continue
                    
                # Match scope: GLOBAL, PROJECT:xxx, AGENT:xxx, USER:xxx
                scope_match = False
                if exc.scope == "GLOBAL":
                    scope_match = True
                elif project_id and exc.scope == f"PROJECT:{project_id}":
                    scope_match = True
                elif exc.scope == f"AGENT:{actor_id_str}" or exc.scope == f"AGENT:{AGENT_ROLE_ALIASES.get(actor_id_str.lower(), actor_id_str)}":
                    scope_match = True
                elif exc.scope == f"USER:{actor_id_str}":
                    scope_match = True

                if scope_match:
                    PolicyEngine.log_audit(
                        actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                        "ALLOW", exc.policy_id, risk_level, None, db, trace_id
                    )
                    return {
                        "decision": "ALLOW",
                        "reason": f"Allowed by active security exception ({exc.exception_id}): {exc.reason}",
                        "requires_approval": False,
                        "risk_level": risk_level,
                        "policy_id": exc.policy_id,
                        "policy_name": "Security Exception Bypass"
                    }

            # 3. User RBAC Checks (if Actor is a USER)
            if actor_type_upper == "USER":
                user = db.query(User).filter(User.id == actor_id_str).first()
                if not user or not user.is_active:
                    PolicyEngine.log_audit(
                        actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                        "DENY", None, risk_level, None, db, trace_id
                    )
                    return {
                        "decision": "DENY",
                        "reason": f"User '{actor_id_str}' does not exist or is deactivated",
                        "requires_approval": False,
                        "risk_level": risk_level,
                        "policy_id": None,
                        "policy_name": None
                    }

                # Find permissions mapped to user roles
                user_roles = db.query(UserRole).filter(UserRole.user_id == actor_id_str).all()
                role_ids = [ur.role_id for ur in user_roles]
                is_admin = "ADMIN" in role_ids

                role_perms = db.query(RolePermission).filter(RolePermission.role_id.in_(role_ids)).all()
                granted_permissions = [rp.permission_id for rp in role_perms]

                req_perm = ACTION_TO_PERMISSION.get(action_type_upper)
                if req_perm and not is_admin and req_perm not in granted_permissions:
                    PolicyEngine.log_audit(
                        actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                        "DENY", None, risk_level, None, db, trace_id
                    )
                    return {
                        "decision": "DENY",
                        "reason": f"User '{actor_id_str}' does not hold required permission: {req_perm}",
                        "requires_approval": False,
                        "risk_level": risk_level,
                        "policy_id": None,
                        "policy_name": None
                    }

            # 4. Agent Boundary Checks (if Actor is an AGENT)
            elif actor_type_upper == "AGENT":
                canonical_agent_id = AGENT_ROLE_ALIASES.get(actor_id_str.lower(), actor_id_str.lower())
                
                # Check agent boundary profile
                query = db.query(AgentPermission).filter(AgentPermission.agent_id == canonical_agent_id)
                if project_id:
                    # First try matching project, otherwise fallback to project-independent boundary
                    proj_perm = query.filter(AgentPermission.project_id == project_id).first()
                    agent_perm = proj_perm or db.query(AgentPermission).filter(AgentPermission.agent_id == canonical_agent_id).first()
                else:
                    agent_perm = query.first()

                if not agent_perm:
                    # Default DENY if agent has no permissions mapped
                    PolicyEngine.log_audit(
                        actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                        "DENY", None, risk_level, None, db, trace_id
                    )
                    return {
                        "decision": "DENY",
                        "reason": f"Agent '{actor_id_str}' permission boundary profile not registered",
                        "requires_approval": False,
                        "risk_level": risk_level,
                        "policy_id": None,
                        "policy_name": None
                    }

                # Verify Environment Restriction
                if environment:
                    allowed_envs = [e.strip().upper() for e in agent_perm.allowed_environments.split(",")]
                    if environment.upper() not in allowed_envs:
                        PolicyEngine.log_audit(
                            actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                            "DENY", None, risk_level, None, db, trace_id
                        )
                        return {
                            "decision": "DENY",
                            "reason": f"Agent '{actor_id_str}' is restricted from executing actions in environment: {environment}",
                            "requires_approval": False,
                            "risk_level": risk_level,
                            "policy_id": None,
                            "policy_name": None
                        }

                # Verify Agent Risk Limit
                risk_order = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
                agent_max_risk = agent_perm.max_risk_limit.upper()
                
                if risk_order.get(risk_level, 2) > risk_order.get(agent_max_risk, 2):
                    if risk_level == "CRITICAL":
                        PolicyEngine.log_audit(
                            actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                            "DENY", None, risk_level, None, db, trace_id
                        )
                        return {
                            "decision": "DENY",
                            "reason": f"Critical risk action blocked for agent execution profile ({agent_max_risk} limit)",
                            "requires_approval": False,
                            "risk_level": risk_level,
                            "policy_id": None,
                            "policy_name": None
                        }
                    else:
                        PolicyEngine.log_audit(
                            actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                            "APPROVAL_REQUIRED", None, risk_level, None, db, trace_id
                        )
                        return {
                            "decision": "APPROVAL_REQUIRED",
                            "reason": f"Action risk level ({risk_level}) exceeds agent max risk threshold ({agent_max_risk})",
                            "requires_approval": True,
                            "risk_level": risk_level,
                            "policy_id": None,
                            "policy_name": None
                        }

                # 5. Agent Tool Permissions
                target_tool = tool_name
                if not target_tool and action_type_upper.startswith("TOOL_"):
                    target_tool = action_type_upper.replace("TOOL_", "").lower()

                if target_tool:
                    tool_perm = db.query(AgentToolPermission).filter(
                        AgentToolPermission.agent_id == canonical_agent_id,
                        AgentToolPermission.tool_name == target_tool.lower()
                    ).first()
                    
                    if tool_perm:
                        if tool_perm.permission_type == "DENIED":
                            PolicyEngine.log_audit(
                                actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                                "DENY", None, risk_level, None, db, trace_id
                            )
                            return {
                                "decision": "DENY",
                                "reason": f"Agent '{actor_id_str}' is prohibited from using tool: {target_tool}",
                                "requires_approval": False,
                                "risk_level": risk_level,
                                "policy_id": None,
                                "policy_name": None
                            }
                        elif tool_perm.permission_type == "RESTRICTED":
                            PolicyEngine.log_audit(
                                actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                                "APPROVAL_REQUIRED", None, risk_level, None, db, trace_id
                            )
                            return {
                                "decision": "APPROVAL_REQUIRED",
                                "reason": f"Agent tool usage of '{target_tool}' requires human operator approval",
                                "requires_approval": True,
                                "risk_level": risk_level,
                                "policy_id": None,
                                "policy_name": None
                            }

            # 6. Evaluate Versioned Active Policies
            active_policies = db.query(Policy).filter(Policy.enabled == True).order_by(desc(Policy.priority)).all()
            for policy in active_policies:
                try:
                    rules = json.loads(policy.rules) if policy.rules else {}
                    
                    match_action = rules.get("action")
                    match_env = rules.get("environment")
                    match_res_pat = rules.get("resource_pattern") or rules.get("resource")
                    match_actor = rules.get("actor_id") or rules.get("agent_id")
                    
                    matches = True
                    has_filter = False

                    if match_action:
                        has_filter = True
                        if match_action.upper() != action_type_upper:
                            matches = False
                    if match_env:
                        has_filter = True
                        if not environment or match_env.upper() != environment.upper():
                            matches = False
                    if match_res_pat:
                        has_filter = True
                        if not resource or not re.search(match_res_pat, resource):
                            matches = False
                    if match_actor:
                        has_filter = True
                        if match_actor.lower() not in [actor_id_str.lower(), AGENT_ROLE_ALIASES.get(actor_id_str.lower(), actor_id_str.lower())]:
                            matches = False

                    if not has_filter and policy.scope and policy.scope.upper() not in ["GLOBAL", "ACTION"]:
                        matches = False
                        
                    if matches:
                        decision = rules.get("decision", "ALLOW").upper()
                        requires_app = rules.get("requires_approval", False) or decision == "APPROVAL_REQUIRED"

                        
                        if decision == "DENY":
                            PolicyEngine.log_audit(
                                actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                                "DENY", policy.id, risk_level, None, db, trace_id
                            )
                            return {
                                "decision": "DENY",
                                "reason": f"Action blocked by policy: {policy.name}",
                                "requires_approval": False,
                                "risk_level": risk_level,
                                "policy_id": policy.id,
                                "policy_name": policy.name
                            }
                        elif requires_app:
                            PolicyEngine.log_audit(
                                actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                                "APPROVAL_REQUIRED", policy.id, risk_level, None, db, trace_id
                            )
                            return {
                                "decision": "APPROVAL_REQUIRED",
                                "reason": f"Policy '{policy.name}' requires operator approval",
                                "requires_approval": True,
                                "risk_level": risk_level,
                                "policy_id": policy.id,
                                "policy_name": policy.name
                            }
                except Exception as e:
                    logger.warning(f"Error parsing rules for policy {policy.id}: {e}")

            # 7. Check Protected Resources (e.g. /security/.*, /governance/.*, /auth/.*, /deployment/.*, /sandbox/.*)
            if resource:
                protected_list = db.query(ProtectedResource).all()
                for pr in protected_list:
                    if re.search(pr.path_pattern, resource):
                        # Protected resources require explicit authorization/approval
                        if actor_type_upper == "AGENT":
                            PolicyEngine.log_audit(
                                actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                                "APPROVAL_REQUIRED", None, risk_level, None, db, trace_id
                            )
                            return {
                                "decision": "APPROVAL_REQUIRED",
                                "reason": f"Resource '{resource}' is protected under security policy: {pr.description}",
                                "requires_approval": True,
                                "risk_level": risk_level,
                                "policy_id": None,
                                "policy_name": "Protected Resource Policy"
                            }
                        elif actor_type_upper == "USER":
                            user_roles = db.query(UserRole).filter(UserRole.user_id == actor_id_str).all()
                            role_ids = [ur.role_id for ur in user_roles]
                            if pr.min_role not in role_ids and "ADMIN" not in role_ids:
                                PolicyEngine.log_audit(
                                    actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                                    "DENY", None, risk_level, None, db, trace_id
                                )
                                return {
                                    "decision": "DENY",
                                    "reason": f"Resource '{resource}' requires {pr.min_role} role",
                                    "requires_approval": False,
                                    "risk_level": risk_level,
                                    "policy_id": None,
                                    "policy_name": "Protected Resource Policy"
                                }

            # 8. Check Data Governance (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED)
            if resource:
                dc = db.query(DataClassification).filter(DataClassification.resource_name == resource).first()
                if dc and dc.classification_level == "RESTRICTED" and actor_type_upper == "AGENT":
                    PolicyEngine.log_audit(
                        actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                        "DENY", None, risk_level, None, db, trace_id
                    )
                    return {
                        "decision": "DENY",
                        "reason": f"Data classification RESTRICTED blocks agent access to resource: {resource}",
                        "requires_approval": False,
                        "risk_level": risk_level,
                        "policy_id": None,
                        "policy_name": "Data Classification Policy"
                    }

            # 9. Default ALLOW under least-privilege boundary rules
            PolicyEngine.log_audit(
                actor_type_upper, actor_id_str, action_type_upper, resource, project_id, environment,
                "ALLOW", None, risk_level, None, db, trace_id
            )
            return {
                "decision": "ALLOW",
                "reason": "Approved under default least-privilege boundary rules",
                "requires_approval": False,
                "risk_level": risk_level,
                "policy_id": None,
                "policy_name": None
            }

        except Exception as err:
            logger.error(f"PolicyEngine execution failed, failing safe with DENY: {err}")
            # Fail-Safe Design: If evaluating policy crashes or errors, block execution!
            return {
                "decision": "DENY",
                "reason": f"PolicyEngine fail-safe block triggered: {err}",
                "requires_approval": False,
                "risk_level": "CRITICAL",
                "policy_id": None,
                "policy_name": None
            }

    evaluateAction = evaluate
