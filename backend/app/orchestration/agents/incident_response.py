import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from .base import BaseAgent, AgentRequest, AgentResult
from ...models.monitoring import Incident, IncidentEvent, RemediationPolicy, RemediationAction
from ...models.delivery import Deployment, Release

class IncidentResponseAgent(BaseAgent):
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        incident_id = request.context.get("incident_id")
        analysis = request.context.get("analysis", {})

        if not incident_id:
            return AgentResult(
                status="failed",
                summary="Missing incident_id in context.",
                output={},
                next_action="completed"
            )

        incident = db_session.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            return AgentResult(
                status="failed",
                summary=f"Incident {incident_id} not found.",
                output={},
                next_action="completed"
            )

        recommended_actions = analysis.get("recommended_actions", [])
        generated_actions = []
        auto_actions = []

        # Default remediation policies if none exist in the database yet
        # We ensure a rollback action defaults to requiring approval
        default_policies = {
            "ROLLBACK": {"enabled": True, "requires_approval": True, "max_attempts": 1},
            "RESTART_SERVICE": {"enabled": True, "requires_approval": True, "max_attempts": 3},
            "SCALE_SERVICE": {"enabled": True, "requires_approval": True, "max_attempts": 2},
            "INVESTIGATE_DATABASE": {"enabled": True, "requires_approval": False, "max_attempts": 5},
            "RETRY_HEALTH_CHECK": {"enabled": True, "requires_approval": False, "max_attempts": 5}
        }

        for rec in recommended_actions:
            action_name = rec.get("action")
            reason = rec.get("reason", "")
            risk = rec.get("risk", "MEDIUM")
            expected_impact = rec.get("expected_impact", "")
            
            # 1. Look up policy in database
            policy = db_session.query(RemediationPolicy).filter(
                RemediationPolicy.project_id == incident.project_id,
                RemediationPolicy.action == action_name
            ).first()

            if policy:
                enabled = policy.enabled
                requires_approval = policy.requires_approval
                env_scope = policy.environment_scope
                # Check environment match
                if env_scope != "ALL" and env_scope != incident.environment:
                    enabled = False
            else:
                # Use default safety fallback
                default_pol = default_policies.get(action_name, {"enabled": True, "requires_approval": True})
                enabled = default_pol["enabled"]
                requires_approval = default_pol["requires_approval"]

            if not enabled:
                # Action disabled by safety policy
                logger_msg = f"Remediation action {action_name} is disabled by policy."
                event = IncidentEvent(
                    id=f"evt-{uuid.uuid4().hex[:8]}",
                    incident_id=incident.id,
                    event_type="POLICY_BLOCKED",
                    message=f"Action '{action_name}' suggested by AI but blocked by project safety policy.",
                    timestamp=datetime.utcnow()
                )
                db_session.add(event)
                db_session.commit()
                continue

            # Create remediation action in DB
            action_id = f"act-{uuid.uuid4().hex[:8]}"
            status = "PENDING"
            if not requires_approval:
                status = "APPROVED"  # Autonomously approved

            db_action = RemediationAction(
                id=action_id,
                incident_id=incident.id,
                action=action_name,
                status=status,
                reason=reason,
                risk=risk,
                expected_impact=expected_impact,
                requires_approval=requires_approval
            )
            db_session.add(db_action)
            db_session.commit()

            # Record in timeline
            approval_msg = "Requires human operator approval." if requires_approval else "Approved autonomously via policy."
            timeline_msg = f"Remediation recommendation generated: '{action_name}'. {approval_msg} Reason: {reason}"
            
            event = IncidentEvent(
                id=f"evt-{uuid.uuid4().hex[:8]}",
                incident_id=incident.id,
                event_type="REMEDIATION_RECOMMENDED",
                message=timeline_msg,
                timestamp=datetime.utcnow()
            )
            db_session.add(event)
            db_session.commit()

            action_data = {
                "action_id": action_id,
                "action": action_name,
                "status": status,
                "requires_approval": requires_approval
            }
            generated_actions.append(action_data)
            if status == "APPROVED":
                auto_actions.append(action_data)

        return AgentResult(
            status="completed",
            summary=f"Incident response plan formulated. Generated {len(generated_actions)} actions.",
            output={
                "actions": generated_actions,
                "auto_actions": auto_actions
            },
            next_action="completed"
        )
