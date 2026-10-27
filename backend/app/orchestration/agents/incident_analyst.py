import json
import uuid
from datetime import datetime
from sqlalchemy import desc

from .base import BaseAgent, AgentRequest, AgentResult
from ...ai.gateway import AIGateway
from ...ai.schemas.monitoring import IncidentAnalysisSchema
from ...ai.prompts.system import BASE_SYSTEM_PROMPT_V1
from ...models.monitoring import Incident, IncidentEvent, IncidentAnalysis, MonitoredService, MonitoringHealthCheckResult, Metric
from ...models.delivery import Release, Deployment
from ...models.log import Log
from ...models.memory import Memory

INCIDENT_ANALYST_PROMPT = """
You are the IncidentAnalystAgent, responsible for analyzing production issues and performing Root Cause Analysis (RCA).
Provide a structured analysis based on actual evidence. Avoid making claims of absolute certainty.

Incident Context:
- ID: {incident_id}
- Project ID: {project_id}
- Service ID: {service_id}
- Service Name: {service_name}
- Environment: {environment}
- Title: {title}
- Description: {description}
- Severity: {severity}

Telemetry & Logs Context:
1. Recent Health Checks:
{health_checks}

2. Recent System Metrics:
{metrics}

3. Recent Log Events:
{logs}

4. Recent Releases & Deployments:
{deployments}

5. Long-term Memory lessons:
{memories}

Review this context. Correlate recent changes (deployments, config) to failures. Diagnose the probable root cause, list specific supporting evidence, assign a confidence score (0.0 to 1.0), and specify recommended remediation actions.
Each action must match the ActionRecommendationSchema: action, reason, risk, expected_impact, requires_approval.
Actions can include: ROLLBACK, RESTART_SERVICE, SCALE_SERVICE, INVESTIGATE_DATABASE, DISABLE_FEATURE, DEPLOY_PATCH.
"""

class IncidentAnalystAgent(BaseAgent):
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        incident_id = request.context.get("incident_id")
        if not incident_id:
            return AgentResult(
                status="failed",
                summary="Missing incident_id in context.",
                output={},
                next_action="completed"
            )

        # 1. Fetch Incident context
        incident = db_session.query(Incident).filter(Incident.id == incident_id).first()
        if not incident:
            return AgentResult(
                status="failed",
                summary=f"Incident {incident_id} not found in DB.",
                output={},
                next_action="completed"
            )

        service_name = "Unknown"
        service = None
        if incident.service_id:
            service = db_session.query(MonitoredService).filter(MonitoredService.id == incident.service_id).first()
            if service:
                service_name = service.service_name

        # 2. Gather logs
        recent_logs = db_session.query(Log).filter(
            Log.project_id == incident.project_id
        ).order_by(desc(Log.created_at)).limit(20).all()
        logs_str = "\n".join([f"[{l.timestamp}] {l.type} - {l.action}: {l.message}" for l in recent_logs])

        # 3. Gather health checks
        health_checks = []
        if incident.service_id:
            checks = db_session.query(MonitoringHealthCheckResult).filter(
                MonitoringHealthCheckResult.service_id == incident.service_id
            ).order_by(desc(MonitoringHealthCheckResult.checked_at)).limit(5).all()
            health_checks = [f"[{c.checked_at}] {c.status} (Code: {c.response_code}, Latency: {c.latency_ms}ms) Error: {c.error_message}" for c in checks]
        hc_str = "\n".join(health_checks) or "No recent health check records."

        # 4. Gather metrics
        metrics = []
        if incident.service_id:
            db_metrics = db_session.query(Metric).filter(
                Metric.service_id == incident.service_id
            ).order_by(desc(Metric.timestamp)).limit(10).all()
            metrics = [f"[{m.timestamp}] {m.name}: {m.value}{m.unit} (Source: {m.source})" for m in db_metrics]
        met_str = "\n".join(metrics) or "No metrics found."

        # 5. Gather deployments
        deps = db_session.query(Deployment).join(Release).filter(
            Release.project_id == incident.project_id,
            Deployment.environment == incident.environment
        ).order_by(desc(Deployment.started_at)).limit(3).all()
        dep_str = "\n".join([f"[{d.started_at}] Deployment ID: {d.id}, Release Version: {d.release.version}, Status: {d.status}" for d in deps]) or "No recent deployments."

        # 6. Gather memories
        mems = db_session.query(Memory).filter(
            Memory.project_id == incident.project_id
        ).order_by(desc(Memory.created_at)).limit(5).all()
        mem_str = "\n".join([f"[{m.created_at}] title: {m.title}, content: {m.content}" for m in mems]) or "No cognitive memory nodes found."

        # 7. Construct prompt
        prompt = INCIDENT_ANALYST_PROMPT.format(
            incident_id=incident.id,
            project_id=incident.project_id,
            service_id=incident.service_id or "N/A",
            service_name=service_name,
            environment=incident.environment,
            title=incident.title,
            description=incident.description,
            severity=incident.severity,
            health_checks=hc_str,
            metrics=met_str,
            logs=logs_str,
            deployments=dep_str,
            memories=mem_str
        )

        gateway = AIGateway()
        # Query AI Gateway using IncidentAnalysisSchema
        analysis_dict = await gateway.generate(
            project_id=incident.project_id,
            task_type="incident_analysis",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="IncidentAnalyst",
            response_schema=IncidentAnalysisSchema,
            db_session=db_session
        )

        # 8. Store Analysis in database
        analysis_id = f"ana-{uuid.uuid4().hex[:8]}"
        db_analysis = IncidentAnalysis(
            id=analysis_id,
            incident_id=incident.id,
            summary=analysis_dict.get("summary", ""),
            probable_root_cause=analysis_dict.get("probable_root_cause", ""),
            evidence=json.dumps(analysis_dict.get("evidence", [])),
            confidence=analysis_dict.get("confidence", 0.9),
            impact=analysis_dict.get("impact", "MEDIUM"),
            recommended_actions=json.dumps(analysis_dict.get("recommended_actions", [])),
            requires_human=analysis_dict.get("requires_human", True),
            analyzed_at=datetime.utcnow()
        )
        db_session.add(db_analysis)

        # Update incident root cause summary
        incident.root_cause = db_analysis.probable_root_cause
        db_session.commit()

        # Add event to incident timeline
        timeline_msg = f"AI analysis completed. Diagnosed Probable Cause: '{db_analysis.probable_root_cause}' (Confidence: {int(db_analysis.confidence * 100)}%)."
        event = IncidentEvent(
            id=f"evt-{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            event_type="ANALYSIS_COMPLETED",
            message=timeline_msg,
            timestamp=datetime.utcnow()
        )
        db_session.add(event)
        db_session.commit()

        return AgentResult(
            status="completed",
            summary=f"Incident root cause analysis completed: {db_analysis.probable_root_cause}",
            output={"analysis": analysis_dict},
            next_action="completed"
        )
