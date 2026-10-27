import uuid
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..models.governance import (
    User, Role, Permission, UserRole, RolePermission,
    AgentPermission, AgentToolPermission, Policy, PolicyVersion,
    GovernedAction, ApprovalRequest, PolicyViolation, SecurityException,
    AuditEvent, ProtectedResource, DataClassification,
    GovernanceRecommendation, SecurityEvent
)
from ..governance.policy_engine import PolicyEngine

logger = logging.getLogger("app.governance.agent")

class GovernanceAgent:
    """
    GovernanceAgent:
    Analyzes policy violations, identifies permission conflicts and excessive privileges,
    explains governance decisions, detects unusual agent behaviors, and generates
    safe policy improvement recommendations requiring human operator approval.
    """
    
    @staticmethod
    def analyze_violations(db: Session) -> Dict[str, Any]:
        """Analyzes policy violations and detects recurring security violation patterns."""
        violations = db.query(PolicyViolation).order_by(desc(PolicyViolation.detected_at)).all()
        
        actor_counts = {}
        action_counts = {}
        severity_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        
        for v in violations:
            actor_key = f"{v.actor_type}:{v.actor_id}"
            actor_counts[actor_key] = actor_counts.get(actor_key, 0) + 1
            action_counts[v.action] = action_counts.get(v.action, 0) + 1
            sev = v.severity.upper() if v.severity else "MEDIUM"
            if sev in severity_counts:
                severity_counts[sev] += 1
                
        # Detect repeated violation patterns (e.g. 3+ violations by an actor)
        flagged_actors = [actor for actor, cnt in actor_counts.items() if cnt >= 3]
        
        return {
            "total_violations": len(violations),
            "severity_distribution": severity_counts,
            "top_actors": sorted(actor_counts.items(), key=lambda x: x[1], reverse=True)[:5],
            "top_actions": sorted(action_counts.items(), key=lambda x: x[1], reverse=True)[:5],
            "flagged_actors": flagged_actors
        }

    @staticmethod
    def identify_permission_conflicts(db: Session) -> List[Dict[str, Any]]:
        """Identifies excessive privileges, conflicting permissions, and unconstrained agent profiles."""
        findings = []
        
        # 1. Check for agents with CRITICAL risk limits
        agents = db.query(AgentPermission).all()
        for ag in agents:
            if ag.max_risk_limit.upper() == "CRITICAL":
                findings.append({
                    "type": "EXCESSIVE_AGENT_RISK",
                    "target": f"Agent {ag.agent_id}",
                    "severity": "HIGH",
                    "description": f"Agent {ag.agent_id} has unconstrained CRITICAL risk limits. Recommended to downgrade to HIGH or MEDIUM with approval gates."
                })
            # Check for production environment access on development agents
            if "developer" in ag.agent_id.lower() and "PRODUCTION" in (ag.allowed_environments or "").upper():
                findings.append({
                    "type": "BROAD_ENVIRONMENT_ACCESS",
                    "target": f"Agent {ag.agent_id}",
                    "severity": "MEDIUM",
                    "description": f"Developer agent {ag.agent_id} has direct PRODUCTION environment access enabled."
                })

        # 2. Check for tool permissions: e.g. deployment tool granted to non-release agents
        tool_perms = db.query(AgentToolPermission).filter(AgentToolPermission.permission_type == "ALLOWED").all()
        for tp in tool_perms:
            if tp.tool_name.lower() in ["deployment", "secret_manager"] and tp.agent_id not in ["incident_response", "release_manager", "admin"]:
                findings.append({
                    "type": "UNRESTRICTED_SENSITIVE_TOOL",
                    "target": f"{tp.agent_id} -> {tp.tool_name}",
                    "severity": "HIGH",
                    "description": f"Tool '{tp.tool_name}' is set to ALLOWED for agent '{tp.agent_id}'. Recommended to RESTRICT or DENY."
                })
                
        # 3. Check for expired security exceptions that should be cleaned up
        now = datetime.utcnow()
        expired_count = db.query(SecurityException).filter(
            SecurityException.status == "ACTIVE",
            SecurityException.expiration < now
        ).count()
        if expired_count > 0:
            findings.append({
                "type": "EXPIRED_EXCEPTIONS_PENDING_CLEANUP",
                "target": "Security Exceptions",
                "severity": "LOW",
                "description": f"{expired_count} security exceptions have passed their expiration date."
            })

        return findings

    @staticmethod
    def generate_recommendations(db: Session) -> List[GovernanceRecommendation]:
        """
        Synthesizes governance observations, violation telemetry, and permission analysis
        into concrete, actionable policy improvements.
        NOTE: These recommendations NEVER automatically apply without human approval.
        """
        # Run conflict analysis
        conflicts = GovernanceAgent.identify_permission_conflicts(db)
        violations_analysis = GovernanceAgent.analyze_violations(db)
        
        created_recommendations = []
        
        # 1. Recommendation for excessive agent risk
        for conf in conflicts:
            if conf["type"] == "EXCESSIVE_AGENT_RISK":
                rec_id = f"rec-{uuid.uuid4().hex[:8]}"
                existing = db.query(GovernanceRecommendation).filter(
                    GovernanceRecommendation.recommendation_type == "REDUCE_RISK",
                    GovernanceRecommendation.status == "PROPOSED"
                ).first()
                if not existing:
                    rec = GovernanceRecommendation(
                        id=rec_id,
                        title="Cap Maximum Agent Execution Risk to HIGH",
                        category="AGENT",
                        recommendation_type="REDUCE_RISK",
                        target_id="agent_permissions",
                        details=json.dumps({"action": "SET_MAX_RISK", "value": "HIGH"}),
                        rationale="Autonomous agents should not have CRITICAL execution autonomy. Critical operations must require explicit Human-in-the-loop approval.",
                        risk_reduction="HIGH",
                        status="PROPOSED",
                        created_at=datetime.utcnow()
                    )
                    db.add(rec)
                    created_recommendations.append(rec)

            elif conf["type"] == "UNRESTRICTED_SENSITIVE_TOOL":
                rec_id = f"rec-{uuid.uuid4().hex[:8]}"
                existing = db.query(GovernanceRecommendation).filter(
                    GovernanceRecommendation.target_id == conf["target"],
                    GovernanceRecommendation.status == "PROPOSED"
                ).first()
                if not existing:
                    rec = GovernanceRecommendation(
                        id=rec_id,
                        title=f"Restrict Tool Access: {conf['target']}",
                        category="TOOL",
                        recommendation_type="RESTRICT_TOOL",
                        target_id=conf["target"],
                        details=json.dumps({"permission_type": "RESTRICTED"}),
                        rationale=conf["description"],
                        risk_reduction="HIGH",
                        status="PROPOSED",
                        created_at=datetime.utcnow()
                    )
                    db.add(rec)
                    created_recommendations.append(rec)

        # 2. Recommendation if high violations detected
        if violations_analysis["total_violations"] > 0:
            rec_id = f"rec-{uuid.uuid4().hex[:8]}"
            existing = db.query(GovernanceRecommendation).filter(
                GovernanceRecommendation.recommendation_type == "ADD_APPROVAL",
                GovernanceRecommendation.status == "PROPOSED"
            ).first()
            if not existing:
                rec = GovernanceRecommendation(
                    id=rec_id,
                    title="Enforce Mandatory Approval for Production DB Operations",
                    category="POLICY",
                    recommendation_type="ADD_APPROVAL",
                    target_id="POL-002",
                    details=json.dumps({"requires_approval": True, "approver_role": "ADMIN"}),
                    rationale="Recent violation telemetry highlights repeated privileged database requests. Adding strict approval verification reduces blast radius.",
                    risk_reduction="CRITICAL",
                    status="PROPOSED",
                    created_at=datetime.utcnow()
                )
                db.add(rec)
                created_recommendations.append(rec)

        # 3. Add default baseline recommendation if none exist
        if db.query(GovernanceRecommendation).count() == 0:
            rec1 = GovernanceRecommendation(
                id=f"rec-{uuid.uuid4().hex[:8]}",
                title="Enforce Four-Eyes Approval on Production Releases",
                category="POLICY",
                recommendation_type="ADD_APPROVAL",
                target_id="POL-001",
                details=json.dumps({"four_eyes": True, "min_approvers": 1, "approver_role": "RELEASE_MANAGER"}),
                rationale="Prevents single-point developer self-approvals on production code changes.",
                risk_reduction="HIGH",
                status="PROPOSED",
                created_at=datetime.utcnow()
            )
            rec2 = GovernanceRecommendation(
                id=f"rec-{uuid.uuid4().hex[:8]}",
                title="Mask All Environment API Tokens in Sandbox Telemetry",
                category="RESOURCE",
                recommendation_type="PROTECT_RESOURCE",
                target_id="/security/credentials",
                details=json.dumps({"redaction_enabled": True}),
                rationale="Ensures agent sandbox outputs and logs never leak credentials.",
                risk_reduction="CRITICAL",
                status="PROPOSED",
                created_at=datetime.utcnow()
            )
            db.add_all([rec1, rec2])
            created_recommendations.extend([rec1, rec2])

        db.commit()
        return db.query(GovernanceRecommendation).order_by(desc(GovernanceRecommendation.created_at)).all()

    @staticmethod
    def apply_recommendation(recommendation_id: str, reviewer_id: str, db: Session) -> Dict[str, Any]:
        """
        Human Review Workflow:
        Validates, approves, and activates an AI policy recommendation, creating a new policy version or boundary update.
        """
        rec = db.query(GovernanceRecommendation).filter(GovernanceRecommendation.id == recommendation_id).first()
        if not rec:
            return {"success": False, "message": "Recommendation not found"}
            
        if rec.status != "PROPOSED":
            return {"success": False, "message": f"Recommendation is already {rec.status}"}

        now = datetime.utcnow()
        rec.status = "APPLIED"
        rec.reviewed_by = reviewer_id
        rec.reviewed_at = now
        
        resulting_policy_id = None
        
        try:
            # If recommendation targets an existing policy (e.g. POL-001 or POL-002)
            if rec.target_id.startswith("POL-"):
                pol = db.query(Policy).filter(Policy.id == rec.target_id).first()
                if pol:
                    new_version = pol.version + 1
                    pol.version = new_version
                    pol.updated_at = now
                    pol.updated_by = reviewer_id
                    
                    # Merge rules
                    current_rules = json.loads(pol.rules) if pol.rules else {}
                    rec_details = json.loads(rec.details) if rec.details.startswith("{") else {}
                    current_rules.update(rec_details)
                    pol.rules = json.dumps(current_rules)
                    
                    # Create PolicyVersion record
                    p_ver = PolicyVersion(
                        id=f"pver-{uuid.uuid4().hex[:8]}",
                        policy_id=pol.id,
                        version=new_version,
                        rules=pol.rules,
                        created_by=reviewer_id,
                        created_at=now
                    )
                    db.add(p_ver)
                    resulting_policy_id = pol.id

            elif rec.recommendation_type == "RESTRICT_TOOL" and "->" in rec.target_id:
                parts = rec.target_id.split("->")
                agent_id = parts[0].strip()
                tool_name = parts[1].strip().lower()
                
                tool_perm = db.query(AgentToolPermission).filter(
                    AgentToolPermission.agent_id == agent_id,
                    AgentToolPermission.tool_name == tool_name
                ).first()
                if tool_perm:
                    tool_perm.permission_type = "RESTRICTED"
                else:
                    db.add(AgentToolPermission(
                        id=f"atp-{agent_id}-{tool_name}",
                        agent_id=agent_id,
                        tool_name=tool_name,
                        permission_type="RESTRICTED"
                    ))

            rec.resulting_policy_id = resulting_policy_id
            db.commit()

            # Log audit event for policy change
            PolicyEngine.log_audit(
                "USER", reviewer_id, "APPLY_AI_RECOMMENDATION", rec.target_id,
                None, "GLOBAL", "ALLOW", resulting_policy_id, "MEDIUM", None, db
            )

            return {
                "success": True,
                "message": f"Recommendation approved and applied successfully. Policy {resulting_policy_id or 'boundary'} updated.",
                "resulting_policy_id": resulting_policy_id
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Failed to apply recommendation {recommendation_id}: {e}")
            return {"success": False, "message": f"Failed to apply recommendation: {e}"}

    @staticmethod
    def reject_recommendation(recommendation_id: str, reviewer_id: str, db: Session, comment: Optional[str] = None) -> Dict[str, Any]:
        """Rejects an AI policy recommendation."""
        rec = db.query(GovernanceRecommendation).filter(GovernanceRecommendation.id == recommendation_id).first()
        if not rec:
            return {"success": False, "message": "Recommendation not found"}
            
        if rec.status != "PROPOSED":
            return {"success": False, "message": f"Recommendation is already {rec.status}"}

        rec.status = "REJECTED"
        rec.reviewed_by = reviewer_id
        rec.reviewed_at = datetime.utcnow()
        db.commit()

        # Log audit event
        PolicyEngine.log_audit(
            "USER", reviewer_id, "REJECT_AI_RECOMMENDATION", rec.target_id,
            None, "GLOBAL", "DENY", None, "LOW", None, db
        )

        return {"success": True, "message": "Recommendation rejected"}
