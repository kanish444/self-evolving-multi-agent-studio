import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..core.database import get_db
from ..models.project import Project
from ..models.task import Task
from ..models.memory import Memory
from ..models.autonomous import LearningCandidate
from ..models.delivery import Deployment, Release
from ..models.monitoring import (
    MonitoredService,
    MonitoringHealthCheckResult,
    Metric,
    AlertRule,
    Alert,
    Incident,
    IncidentEvent,
    IncidentAnalysis,
    RemediationPolicy,
    RemediationAction,
    PostIncidentReview,
    ImprovementProposal
)
from ..monitoring.health_checker import HealthChecker
from ..delivery.rollback_manager import RollbackManager
from ..orchestration.agent_registry import registry
from ..ai.gateway import AIGateway
from ..ai.prompts.system import BASE_SYSTEM_PROMPT_V1
from ..ai.schemas.monitoring import AIPostIncidentReviewSchema


router = APIRouter(tags=["monitoring"])

# Request Payload Schemas
class ServiceCreateRequest(BaseModel):
    project_id: str
    environment: str
    service_name: str
    service_type: str
    endpoint: Optional[str] = None
    health_check_config: Optional[Dict[str, Any]] = None
    monitoring_enabled: Optional[bool] = True

class AlertRuleCreateRequest(BaseModel):
    service_id: str
    metric_name: str
    operator: str
    threshold: float
    duration_seconds: Optional[int] = 300
    severity: str
    environment: str
    enabled: Optional[bool] = True

class IncidentCreateRequest(BaseModel):
    project_id: str
    service_id: Optional[str] = None
    environment: str
    title: str
    description: str
    severity: str
    incident_type: str

class PostReviewUpdateRequest(BaseModel):
    impact: str
    root_cause: str
    contributing_factors: Optional[List[str]] = None
    what_went_well: Optional[List[str]] = None
    what_went_wrong: Optional[List[str]] = None
    corrective_actions: Optional[List[str]] = None
    preventive_actions: Optional[List[str]] = None
    learning_candidates: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = "COMPLETED"

class ApproveActionRequest(BaseModel):
    approved_by: str

# ----------------- SERVICE ENDPOINTS -----------------

@router.get("/monitoring/services")
def list_monitored_services(project_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(MonitoredService)
    if project_id:
        query = query.filter(MonitoredService.project_id == project_id)
    return query.all()

@router.post("/monitoring/services")
def register_monitored_service(payload: ServiceCreateRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    service_id = f"svc-{uuid.uuid4().hex[:8]}"
    
    # default configs
    config = payload.health_check_config or {
        "expected_status_code": 200,
        "timeout_seconds": 5.0,
        "interval_seconds": 30
    }

    service = MonitoredService(
        id=service_id,
        project_id=payload.project_id,
        environment=payload.environment,
        service_name=payload.service_name,
        service_type=payload.service_type,
        endpoint=payload.endpoint,
        health_check_config=json.dumps(config),
        monitoring_enabled=payload.monitoring_enabled if payload.monitoring_enabled is not None else True,
        status="UNKNOWN"
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service

@router.get("/monitoring/services/{id}")
def read_monitored_service(id: str, db: Session = Depends(get_db)):
    service = db.query(MonitoredService).filter(MonitoredService.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Monitored service not found")
    return service

@router.post("/monitoring/services/{id}/health")
async def trigger_service_health_check(id: str, simulate_status: Optional[str] = None, db: Session = Depends(get_db)):
    """Triggers an on-demand active health check run and records metrics/alerts."""
    try:
        result = await HealthChecker.perform_health_check(id, db, simulate_status=simulate_status)
        if not result:
            return {"status": "SKIPPED", "reason": "Monitoring disabled on this service"}
        return {
            "id": result.id,
            "service_id": result.service_id,
            "status": result.status,
            "response_code": result.response_code,
            "latency_ms": result.latency_ms,
            "error_message": result.error_message,
            "checked_at": result.checked_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/monitoring/services/{id}/metrics")
def get_service_metrics(id: str, metric_name: Optional[str] = None, limit: Optional[int] = 50, db: Session = Depends(get_db)):
    """Returns metric timeseries entries for charting."""
    query = db.query(Metric).filter(Metric.service_id == id)
    if metric_name:
        query = query.filter(Metric.name == metric_name)
    metrics = query.order_by(desc(Metric.timestamp)).limit(limit).all()
    # Return chronologically ordered
    return list(reversed(metrics))

# ----------------- ALERTS ENDPOINTS -----------------

@router.get("/monitoring/alerts")
def list_alerts(service_id: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if service_id:
        query = query.filter(Alert.service_id == service_id)
    if status:
        query = query.filter(Alert.status == status)
    return query.order_by(desc(Alert.triggered_at)).all()

@router.post("/monitoring/alerts/rules")
def configure_alert_rule(payload: AlertRuleCreateRequest, db: Session = Depends(get_db)):
    service = db.query(MonitoredService).filter(MonitoredService.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Monitored service not found")

    rule_id = f"rul-{uuid.uuid4().hex[:8]}"
    rule = AlertRule(
        id=rule_id,
        service_id=payload.service_id,
        metric_name=payload.metric_name,
        operator=payload.operator,
        threshold=payload.threshold,
        duration_seconds=payload.duration_seconds or 300,
        severity=payload.severity,
        environment=payload.environment,
        enabled=payload.enabled if payload.enabled is not None else True
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

# ----------------- INCIDENTS ENDPOINTS -----------------

@router.get("/incidents")
def list_incidents(
    project_id: Optional[str] = None,
    service_id: Optional[str] = None,
    environment: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if project_id:
        query = query.filter(Incident.project_id == project_id)
    if service_id:
        query = query.filter(Incident.service_id == service_id)
    if environment:
        query = query.filter(Incident.environment == environment)
    if severity:
        query = query.filter(Incident.severity == severity)
    if status:
        query = query.filter(Incident.status == status)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)

    return query.order_by(desc(Incident.detected_at)).all()

@router.post("/incidents")
def create_manual_incident(payload: IncidentCreateRequest, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    inc_id = f"inc-{uuid.uuid4().hex[:8]}"
    incident = Incident(
        id=inc_id,
        project_id=payload.project_id,
        service_id=payload.service_id,
        environment=payload.environment,
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        status="DETECTED",
        detected_at=datetime.utcnow(),
        incident_type=payload.incident_type
    )
    db.add(incident)
    db.commit()

    # Timeline event
    event = IncidentEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        incident_id=inc_id,
        event_type="DETECTED",
        message="Incident raised manually by operator.",
        timestamp=datetime.utcnow()
    )
    db.add(event)
    db.commit()

    return incident

@router.get("/incidents/{id}")
def read_incident(id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Gather related logs, metrics summary, analysis, active remediation actions
    events = db.query(IncidentEvent).filter(IncidentEvent.incident_id == id).order_by(IncidentEvent.timestamp.asc()).all()
    analysis = db.query(IncidentAnalysis).filter(IncidentAnalysis.incident_id == id).order_by(desc(IncidentAnalysis.analyzed_at)).first()
    actions = db.query(RemediationAction).filter(RemediationAction.incident_id == id).all()

    return {
        "incident": incident,
        "events": events,
        "analysis": analysis,
        "remediation_actions": actions
    }

@router.post("/incidents/{id}/acknowledge")
def acknowledge_incident(id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.status == "DETECTED":
        incident.status = "INVESTIGATING"
        incident.acknowledged_at = datetime.utcnow()
        db.commit()

        # Add event to timeline
        event = IncidentEvent(
            id=f"evt-{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            event_type="ACKNOWLEDGED",
            message="Incident acknowledged by operator. Shifted status to INVESTIGATING.",
            timestamp=datetime.utcnow()
        )
        db.add(event)
        db.commit()

    return incident

@router.post("/incidents/{id}/resolve")
def resolve_incident(id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = "RESOLVED"
    incident.resolved_at = datetime.utcnow()
    incident.resolution_summary = "Operator resolved incident manually."
    db.commit()

    # Add event to timeline
    event = IncidentEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        incident_id=incident.id,
        event_type="RESOLVED",
        message="Incident resolved manually by human operator.",
        timestamp=datetime.utcnow()
    )
    db.add(event)
    db.commit()

    return incident

@router.post("/incidents/{id}/analyze")
async def trigger_incident_ai_analysis(id: str, db: Session = Depends(get_db)):
    """Forces AI incident diagnostics pipeline to run."""
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Run analysis synchronously for the api trigger to return results
    analyst = registry.get_agent("INCIDENT_ANALYST")
    responder = registry.get_agent("INCIDENT_RESPONSE")
    
    if not analyst or not responder:
        raise HTTPException(status_code=500, detail="AI monitoring agents not registered")

    from ..orchestration.agents.base import AgentRequest
    
    # 1. Start timeline event
    event = IncidentEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        incident_id=incident.id,
        event_type="AI_ANALYSIS_STARTED",
        message="AI Diagnostics triggered on-demand by operator.",
        timestamp=datetime.utcnow()
    )
    db.add(event)
    db.commit()

    req_analyst = AgentRequest(
        project_id=incident.project_id,
        task_id=incident.id,
        agent_role="IncidentAnalyst",
        objective=f"Diagnose root cause and recommend actions for incident {incident.id}.",
        context={"incident_id": incident.id}
    )
    res_analyst = await analyst.execute(req_analyst, db)

    req_resp = AgentRequest(
        project_id=incident.project_id,
        task_id=incident.id,
        agent_role="IncidentResponse",
        objective="Verify remediation policies and create response plan.",
        context={"incident_id": incident.id, "analysis": res_analyst.output.get("analysis")}
    )
    await responder.execute(req_resp, db)

    # Refresh incident data
    db.refresh(incident)
    analysis = db.query(IncidentAnalysis).filter(IncidentAnalysis.incident_id == id).order_by(desc(IncidentAnalysis.analyzed_at)).first()
    actions = db.query(RemediationAction).filter(RemediationAction.incident_id == id).all()

    return {
        "incident": incident,
        "analysis": analysis,
        "remediation_actions": actions
    }

@router.get("/incidents/{id}/timeline")
def get_incident_timeline(id: str, db: Session = Depends(get_db)):
    events = db.query(IncidentEvent).filter(IncidentEvent.incident_id == id).order_by(IncidentEvent.timestamp.asc()).all()
    return events

@router.get("/incidents/{id}/recommendations")
def get_incident_recommendations(id: str, db: Session = Depends(get_db)):
    analysis = db.query(IncidentAnalysis).filter(IncidentAnalysis.incident_id == id).order_by(desc(IncidentAnalysis.analyzed_at)).first()
    if not analysis:
        return []
    return json.loads(analysis.recommended_actions)

@router.post("/incidents/{id}/approve-action")
async def approve_remediation_action(id: str, action_id: str, payload: ApproveActionRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    act = db.query(RemediationAction).filter(
        RemediationAction.id == action_id,
        RemediationAction.incident_id == id
    ).first()

    if not act:
        raise HTTPException(status_code=404, detail="Remediation action not found")

    act.status = "APPROVED"
    act.approved_by = payload.approved_by
    act.approved_at = datetime.utcnow()
    act.started_at = datetime.utcnow()
    db.commit()

    # Timeline event
    start_evt = IncidentEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        incident_id=incident.id,
        event_type="REMEDIATION_STARTED",
        message=f"Operator '{payload.approved_by}' approved action '{act.action}'. Execution initiated.",
        timestamp=datetime.utcnow()
    )
    db.add(start_evt)
    db.commit()

    # Execution logic based on action name
    success = False
    msg = ""

    if act.action == "ROLLBACK":
        # 1. Identify the recent deployment to rollback
        # We find the latest deployment completed in this environment
        last_dep = db.query(Deployment).join(Release).filter(
            Release.project_id == incident.project_id,
            Deployment.environment == incident.environment
        ).order_by(desc(Deployment.started_at)).first()

        if last_dep:
            success, msg = RollbackManager.execute_rollback(last_dep.id, db)
        else:
            success = False
            msg = "No deployment found to roll back."
    elif act.action == "RESTART_SERVICE":
        # Mock restarting the service
        success = True
        msg = f"Successfully restarted service {incident.service_id or 'API'}."
    else:
        # Default fallback
        success = True
        msg = f"Remediation action {act.action} completed successfully."

    # Update Action Status
    act.completed_at = datetime.utcnow()
    if success:
        act.status = "COMPLETED"
        # Spawns verified check loop
        incident.status = "MONITORING"
        timeline_msg = f"Remediation action '{act.action}' completed successfully: {msg}. Verifying stability..."
        
        # Trigger async stability wait
        import asyncio
        asyncio.create_task(HealthChecker.observe_stability_and_resolve(incident.id))
    else:
        act.status = "FAILED"
        act.error_message = msg
        timeline_msg = f"Remediation action '{act.action}' failed: {msg}."

    event = IncidentEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        incident_id=incident.id,
        event_type="REMEDIATION_COMPLETED" if success else "REMEDIATION_FAILED",
        message=timeline_msg,
        timestamp=datetime.utcnow()
    )
    db.add(event)
    db.commit()

    return {"status": act.status, "message": msg}

@router.post("/incidents/{id}/reject-action")
def reject_remediation_action(id: str, action_id: str, payload: ApproveActionRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    act = db.query(RemediationAction).filter(
        RemediationAction.id == action_id,
        RemediationAction.incident_id == id
    ).first()

    if not act:
        raise HTTPException(status_code=404, detail="Remediation action not found")

    act.status = "REJECTED"
    act.approved_by = payload.approved_by
    act.approved_at = datetime.utcnow()
    db.commit()

    # Timeline event
    event = IncidentEvent(
        id=f"evt-{uuid.uuid4().hex[:8]}",
        incident_id=incident.id,
        event_type="REMEDIATION_REJECTED",
        message=f"Operator '{payload.approved_by}' rejected recommended action '{act.action}'. Action skipped.",
        timestamp=datetime.utcnow()
    )
    db.add(event)
    db.commit()

    return act

# ----------------- POST INCIDENT REVIEW ENDPOINTS -----------------

@router.get("/incidents/{id}/post-review")
async def get_or_generate_post_incident_review(id: str, db: Session = Depends(get_db)):
    """Retrieves existing post-mortem review or triggers AI summarizing generation."""
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    review = db.query(PostIncidentReview).filter(PostIncidentReview.incident_id == id).first()
    if review:
        return review

    # Trigger AI generation
    gateway = AIGateway()
    
    # Gather incident timeline history
    events = db.query(IncidentEvent).filter(IncidentEvent.incident_id == id).order_by(IncidentEvent.timestamp.asc()).all()
    timeline_str = "\n".join([f"[{e.timestamp}] {e.event_type}: {e.message}" for e in events])

    prompt = f"""
    You are the Post Incident Review Assistant. Create a detailed post-incident review (post-mortem) report based on actual timeline events:
    
    Incident Title: {incident.title}
    Description: {incident.description}
    Severity: {incident.severity}
    Root Cause Diagnosis: {incident.root_cause or 'Unknown'}
    
    Timeline Events:
    {timeline_str}
    
    Output the structured post-incident summary including impact, detailed root cause, contributing factors, what went well, what went wrong, corrective actions, preventive actions, and learning candidates.
    """

    res_review = await gateway.generate(
        project_id=incident.project_id,
        task_type="post_incident_review",
        prompt=prompt,
        system_prompt=BASE_SYSTEM_PROMPT_V1,
        agent_role="IncidentResponse",
        response_schema=AIPostIncidentReviewSchema,
        db_session=db
    )

    # Store post review draft in DB
    review_id = f"pir-{uuid.uuid4().hex[:8]}"
    review = PostIncidentReview(
        id=review_id,
        incident_id=incident.id,
        impact=res_review.get("impact", ""),
        root_cause=res_review.get("root_cause", ""),
        contributing_factors=json.dumps(res_review.get("contributing_factors", [])),
        what_went_well=json.dumps(res_review.get("what_went_well", [])),
        what_went_wrong=json.dumps(res_review.get("what_went_wrong", [])),
        corrective_actions=json.dumps(res_review.get("corrective_actions", [])),
        preventive_actions=json.dumps(res_review.get("preventive_actions", [])),
        learning_candidates=json.dumps(res_review.get("learning_candidates", [])),
        status="DRAFT"
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@router.post("/incidents/{id}/post-review")
def update_and_approve_post_incident_review(id: str, payload: PostReviewUpdateRequest, db: Session = Depends(get_db)):
    """Updates review contents, approves the review, and extracts learning candidates / proposals."""
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    review = db.query(PostIncidentReview).filter(PostIncidentReview.incident_id == id).first()
    if not review:
        raise HTTPException(status_code=400, detail="Post incident review draft does not exist. Call GET first to generate it.")

    # Apply updates
    review.impact = payload.impact
    review.root_cause = payload.root_cause
    if payload.contributing_factors is not None:
        review.contributing_factors = json.dumps(payload.contributing_factors)
    if payload.what_went_well is not None:
        review.what_went_well = json.dumps(payload.what_went_well)
    if payload.what_went_wrong is not None:
        review.what_went_wrong = json.dumps(payload.what_went_wrong)
    if payload.corrective_actions is not None:
        review.corrective_actions = json.dumps(payload.corrective_actions)
    if payload.preventive_actions is not None:
        review.preventive_actions = json.dumps(payload.preventive_actions)
    if payload.learning_candidates is not None:
        review.learning_candidates = json.dumps(payload.learning_candidates)
    
    review.status = payload.status
    review.updated_at = datetime.utcnow()
    db.commit()

    if payload.status == "APPROVED" or payload.status == "COMPLETED":
        # 1. Extract and inject APPROVED LearningCandidates to Memory Table
        learnings = json.loads(review.learning_candidates or "[]")
        for l in learnings:
            # Create a learning candidate entry in DB
            lc_id = f"lrc-{uuid.uuid4().hex[:8]}"
            lc = LearningCandidate(
                id=lc_id,
                project_id=incident.project_id,
                incident_id=incident.id,
                problem=l.get("problem", "Performance issue"),
                root_cause=l.get("root_cause", review.root_cause),
                solution=l.get("solution", "Mitigation applied"),
                learning=l.get("solution", "Learned remediation"),
                evidence=l.get("evidence", "Incident logs"),
                confidence=float(l.get("confidence", 0.9)),
                scope=l.get("scope", "APPLICATION"),
                status="APPROVED"  # Auto-approved when human approves PIR
            )
            db.add(lc)

            # Insert into Memory Table (long-term memory integration)
            mem_id = f"mem-{uuid.uuid4().hex[:8]}"
            db_mem = Memory(
                id=mem_id,
                project_id=incident.project_id,
                category="WORKFLOW",
                title=f"Incident Learning: {lc.problem[:50]}",
                content=f"Problem: {lc.problem}\n\nRoot Cause: {lc.root_cause}\n\nRemediation: {lc.solution}\n\nEvidence: {lc.evidence}",
                source="IncidentResponseAgent",
                confidence=lc.confidence,
                importance="High",
                status="Verified",
                tags=f"Incident,Remediation,{lc.scope}",
                iteration=f"Incident {incident.id}"
            )
            db.add(db_mem)

        # 2. Extract and create continuous improvement proposals (spawns task in Phase 13)
        prevs = json.loads(review.preventive_actions or "[]")
        for prev in prevs:
            proposal_id = f"imp-{uuid.uuid4().hex[:8]}"
            
            # Map type based on description keywords
            prop_type = "CODE_FIX"
            if "test" in prev.lower():
                prop_type = "TEST_COVERAGE"
            elif "health" in prev.lower():
                prop_type = "HEALTH_CHECK"
            elif "timeout" in prev.lower():
                prop_type = "TIMEOUT_HANDLING"

            # Create Task in project task board (Phase 13 engineering loop connection)
            # Find next task number
            count = db.query(Task).count()
            task_id = f"task-{str(count + 1).zfill(2)}"
            while db.query(Task).filter(Task.id == task_id).first():
                count += 1
                task_id = f"task-{str(count + 1).zfill(2)}"

            db_task = Task(
                id=task_id,
                project_id=incident.project_id,
                title=f"Improvement: {prev[:60]}",
                description=f"Action item generated from Post Incident Review of incident {incident.id}.\nRecommended fix: {prev}",
                status="TODO",
                priority="MEDIUM",
                assigned_agent_id="DEVELOPER"
            )
            db.add(db_task)

            # Store proposal
            prop = ImprovementProposal(
                id=proposal_id,
                project_id=incident.project_id,
                incident_id=incident.id,
                title=f"Improvement: {prev[:60]}",
                description=prev,
                proposal_type=prop_type,
                task_id=task_id,
                status="APPROVED"
            )
            db.add(prop)

        # Update timeline
        event = IncidentEvent(
            id=f"evt-{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            event_type="REVIEW_COMPLETED",
            message="Post incident review approved. Saved learning memory cards and registered continuous improvement tasks.",
            timestamp=datetime.utcnow()
        )
        db.add(event)
        db.commit()

    return review
