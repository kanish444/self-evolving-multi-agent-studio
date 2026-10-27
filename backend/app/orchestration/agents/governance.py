from .base import BaseAgent, AgentRequest, AgentResult
from ...ai.gateway import AIGateway
from ...ai.schemas.governance import GovernanceReportSchema
from ...ai.prompts.system import BASE_SYSTEM_PROMPT_V1
from ...models.governance import AuditEvent, PolicyViolation
from sqlalchemy import desc

class GovernanceAgent(BaseAgent):
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        """
        Governance Agent evaluates the current security posture, maps violations,
        and generates automated policy recommendation updates.
        """
        gateway = AIGateway()
        
        # 1. Fetch recent audit events & violations to inject into context
        audits = db_session.query(AuditEvent).order_by(desc(AuditEvent.timestamp)).limit(20).all()
        violations = db_session.query(PolicyViolation).order_by(desc(PolicyViolation.detected_at)).limit(10).all()
        
        audit_str = "\n".join([
            f"[{a.timestamp}] Actor: {a.actor_type}:{a.actor_id} - Action: {a.action} - Decision: {a.decision} - Risk: {a.risk_level}"
            for a in audits
        ]) or "No audit events recorded."
        
        violation_str = "\n".join([
            f"[{v.detected_at}] Actor: {v.actor_id} - Action: {v.action} - Severity: {v.severity} - Desc: {v.description}"
            for v in violations
        ]) or "No active policy violations."
        
        prompt = f"""
        You are the SE-MAESTRO Governance Agent. Your task is to analyze the security events, audit logs, and policy violations on the project to recommend hardening improvements.
        
        Recent Audited Actions:
        {audit_str}
        
        Recent Policy Violations:
        {violation_str}
        
        Analyze this telemetry context and produce:
        1. An assessment of recent violations.
        2. Identified permission conflicts or privilege leaks.
        3. Automated policy updates to strengthen system boundaries.
        4. Behavioral anomalies detected in logs.
        """
        
        res = await gateway.generate(
            project_id=request.project_id,
            task_type="governance_report",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="GovernanceAgent",
            response_schema=GovernanceReportSchema,
            db_session=db_session
        )
        
        return AgentResult(
            status="completed",
            summary="Governance audit and security policy review completed successfully.",
            output=res,
            next_action="completed"
        )
