import sys
import os
import json
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.models.project import Project
from app.models.delivery import Release, Deployment
from app.models.monitoring import (
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
from app.models.autonomous import LearningCandidate
from app.models.memory import Memory
from app.monitoring.health_checker import HealthChecker


client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    db.rollback()
    
    # Clean up test IDs to ensure a fresh slate
    db.query(Alert).delete()
    db.query(IncidentEvent).delete()
    db.query(IncidentAnalysis).delete()
    db.query(RemediationAction).delete()
    db.query(PostIncidentReview).delete()
    db.query(ImprovementProposal).delete()
    db.query(AlertRule).delete()
    db.query(MonitoringHealthCheckResult).delete()
    db.query(MonitoredService).delete()
    db.query(Metric).delete()
    db.query(RemediationPolicy).delete()
    
    # Clean up test deployments
    db.query(Deployment).filter(Deployment.id.like("%test%")).delete()
    db.query(Release).filter(Release.id.like("%test%")).delete()
    db.query(Incident).filter(Incident.id.like("%test%")).delete()
    
    # Seed project P001 if it doesn't exist
    p = db.query(Project).filter(Project.id == "P001").first()
    if not p:
        p = Project(
            id="P001",
            name="SMS Project",
            description="Monitoring tests",
            status="IN_PROGRESS"
        )
        db.add(p)
    db.commit()
    yield db
    db.close()

def test_service_registration_and_health_check(db_session):
    """Verifies service registration and performing health check simulation."""
    # 1. Register service via API
    payload = {
        "project_id": "P001",
        "environment": "PRODUCTION",
        "service_name": "Vehicle API",
        "service_type": "API",
        "endpoint": "http://localhost:8000/api/health",
        "health_check_config": {"expected_status_code": 200, "timeout_seconds": 3.0}
    }
    response = client.post("/api/monitoring/services", json=payload)
    assert response.status_code == 200
    svc_data = response.json()
    assert "id" in svc_data
    assert svc_data["service_name"] == "Vehicle API"

    service_id = svc_data["id"]

    # 2. Run health check on service
    chk_response = client.post(f"/api/monitoring/services/{service_id}/health?simulate_status=HEALTHY")
    assert chk_response.status_code == 200
    chk_data = chk_response.json()
    assert chk_data["status"] == "HEALTHY"
    assert chk_data["response_code"] == 200

    # 3. Check service status updated in DB
    service = db_session.query(MonitoredService).filter(MonitoredService.id == service_id).first()
    assert service.status == "HEALTHY"

def test_alert_rule_creation_and_threshold_evaluation(db_session):
    """Verifies custom rule threshold triggers alert when metric breaches."""
    # 1. Register service & rule
    svc = MonitoredService(
        id="svc-test-rule",
        project_id="P001",
        environment="PRODUCTION",
        service_name="Mock Auth Service",
        service_type="API",
        status="HEALTHY"
    )
    db_session.add(svc)
    
    rule = AlertRule(
        id="rul-test-rule",
        service_id="svc-test-rule",
        metric_name="error_rate",
        operator=">",
        threshold=5.0,
        duration_seconds=300,
        severity="HIGH",
        environment="PRODUCTION",
        enabled=True
    )
    db_session.add(rule)
    db_session.commit()

    # 2. Trigger check simulating failure (forces error_rate metric to 100.0%)
    chk_response = client.post("/api/monitoring/services/svc-test-rule/health?simulate_status=FAILED")
    assert chk_response.status_code == 200

    # 3. Verify alert was triggered
    alert = db_session.query(Alert).filter(
        Alert.service_id == "svc-test-rule",
        Alert.rule_id == "rul-test-rule"
    ).first()
    assert alert is not None
    assert alert.status == "OPEN"
    assert "error_rate > 5.0" in alert.message

def test_alert_deduplication_and_storm_protection(db_session):
    """Verifies that multiple alerts do not spawn multiple incidents (grouping)."""
    # 1. Clear previous incidents for this service
    db_session.query(Alert).filter(Alert.service_id == "svc-test-rule").delete()
    db_session.query(Incident).filter(Incident.service_id == "svc-test-rule").delete()
    db_session.commit()

    # 2. Fire primary alert rule check
    res = client.post("/api/monitoring/services/svc-test-rule/health?simulate_status=FAILED")
    print("HEALTH CHECK RES:", res.status_code, res.text)
    
    # Verify incident created
    incidents = db_session.query(Incident).filter(Incident.service_id == "svc-test-rule").all()
    print("INCIDENTS FOUND IN DB:", [i.id for i in incidents])
    assert len(incidents) == 1
    incident_id = incidents[0].id

    # 3. Simulate alert storm: run multiple failing checks
    for _ in range(5):
        client.post("/api/monitoring/services/svc-test-rule/health?simulate_status=FAILED")

    # Verify no new incidents created (remains 1 incident)
    incidents_post = db_session.query(Incident).filter(Incident.service_id == "svc-test-rule").all()
    assert len(incidents_post) == 1

    # Check alert linkage: all triggered alerts linked to the single incident
    alerts = db_session.query(Alert).filter(Alert.service_id == "svc-test-rule").all()
    for a in alerts:
        assert a.incident_id == incident_id

def test_incident_deployment_correlation(db_session):
    """Simulates a deployment followed by errors and asserts correlation is caught."""
    db_session.query(IncidentEvent).delete()
    db_session.query(Incident).filter(Incident.service_id == "svc-cor-test").delete()
    db_session.query(Alert).filter(Alert.service_id == "svc-cor-test").delete()
    db_session.query(Deployment).filter(Deployment.id == "dep-cor-test").delete()
    db_session.query(Release).filter(Release.id == "rel-cor-test").delete()
    db_session.commit()

    # 1. Seed a completed deployment in DB
    release = Release(
        id="rel-cor-test",
        project_id="P001",
        version="v2.0.0",
        environment="PRODUCTION",
        status="DEPLOYED",
        created_by="Operator"
    )
    db_session.add(release)
    db_session.commit()

    from datetime import datetime
    dep = Deployment(
        id="dep-cor-test",
        release_id="rel-cor-test",
        environment="PRODUCTION",
        status="HEALTHY",
        provider="LOCAL",
        strategy="ROLLING",
        completed_at=datetime.utcnow()
    )
    db_session.add(dep)
    db_session.commit()

    # 2. Register service and rule
    svc = MonitoredService(
        id="svc-cor-test",
        project_id="P001",
        environment="PRODUCTION",
        service_name="Booking Engine",
        service_type="API"
    )
    db_session.add(svc)
    
    rule = AlertRule(
        id="rul-cor-test",
        service_id="svc-cor-test",
        metric_name="error_rate",
        operator=">",
        threshold=5.0,
        duration_seconds=300,
        severity="HIGH",
        environment="PRODUCTION",
        enabled=True
    )
    db_session.add(rule)
    db_session.commit()

    # 3. Trigger health check failure
    res = client.post("/api/monitoring/services/svc-cor-test/health?simulate_status=FAILED")
    print("CORRELATION HEALTH CHECK RES:", res.status_code, res.text)

    # 4. Check deployment correlation logged in incident timeline
    db_session.expire_all()
    inc = db_session.query(Incident).filter(Incident.service_id == "svc-cor-test").first()
    assert inc is not None
    print("CORRELATION INCIDENT:", inc.id, inc.title, inc.description)

    db_session.expire_all()
    events = db_session.query(IncidentEvent).filter(
        IncidentEvent.incident_id == inc.id
    ).all()
    print("CORRELATION EVENTS IN DB:", [f"{e.event_type}: {e.message}" for e in events])


    events_corr = [e for e in events if e.event_type == "DEPLOYMENT_CORRELATION"]
    assert len(events_corr) > 0
    assert "v2.0.0" in events_corr[0].message


def test_safety_remediation_policy_and_approval(db_session):
    """Verifies remediation action triggers approval gates and executes rollback."""
    # 1. Create incident and add ROLLBACK recommendation
    inc = Incident(
        id="inc-safety-test",
        project_id="P001",
        service_id="svc-cor-test",
        environment="PRODUCTION",
        title="Rollback test incident",
        description="Failing checks on booking engine after recent deploy release v2",
        severity="SEV-2",
        status="DETECTED"
    )
    db_session.add(inc)

    # Register remediation policy requiring approvals
    policy = RemediationPolicy(
        id="pol-rollback",
        project_id="P001",
        action="ROLLBACK",
        enabled=True,
        requires_approval=True,
        environment_scope="PRODUCTION"
    )
    db_session.add(policy)
    db_session.commit()

    # 2. Trigger AI analysis on incident (generates recommended action)
    res_ana = client.post(f"/api/incidents/{inc.id}/analyze")
    print("ANALYZE RESPONSE:", res_ana.status_code, res_ana.text)

    # Verify action added as PENDING approval
    db_session.expire_all()
    act = db_session.query(RemediationAction).filter(
        RemediationAction.incident_id == inc.id,
        RemediationAction.action == "ROLLBACK"
    ).first()
    db_session.expire_all()
    all_acts = db_session.query(RemediationAction).filter(RemediationAction.incident_id == inc.id).all()
    print("REMEDIATION ACTIONS IN DB FOR SAFETY TEST:", [f"{a.action}: {a.status}" for a in all_acts])
    assert act is not None


    assert act.status == "PENDING"

    # 3. Submit approval to trigger execution
    app_payload = {"approved_by": "Operator Lead"}
    app_response = client.post(
        f"/api/incidents/{inc.id}/approve-action?action_id={act.id}",
        json=app_payload
    )
    assert app_response.status_code == 200
    assert app_response.json()["status"] == "COMPLETED"

    # Verify deployment rolled back
    db_session.refresh(act)
    assert act.status == "COMPLETED"
    
    # Confirm timeline event logs completion
    evt = db_session.query(IncidentEvent).filter(
        IncidentEvent.incident_id == inc.id,
        IncidentEvent.event_type == "REMEDIATION_COMPLETED"
    ).first()
    assert evt is not None

def test_post_incident_review_and_learning_extraction(db_session):
    """Verifies that finalizing a review extracts memory cards and improvement tasks."""
    # 1. Create a resolved incident
    inc = Incident(
        id="inc-pir-test",
        project_id="P001",
        service_id="svc-cor-test",
        environment="PRODUCTION",
        title="Database locks issue",
        description="Resolved locks",
        severity="SEV-3",
        status="RESOLVED",
        root_cause="SQLite database locked"
    )
    db_session.add(inc)
    db_session.commit()

    # 2. Query PIR (generates draft)
    response = client.get(f"/api/incidents/{inc.id}/post-review")
    assert response.status_code == 200
    pir_data = response.json()
    assert pir_data["status"] == "DRAFT"

    # 3. Approve and update review
    payload = {
        "impact": "Low impact. Resolved.",
        "root_cause": "SQLite file concurrency locks",
        "contributing_factors": ["High threads count"],
        "what_went_well": ["Caught quickly"],
        "what_went_wrong": ["Restart was manual"],
        "corrective_actions": ["Restarted service"],
        "preventive_actions": ["Add database retry backoff handlers"],
        "learning_candidates": [
            {
                "problem": "SQLite connection locks under load",
                "root_cause": "SQLite bottleneck",
                "solution": "Retry queries with backoff",
                "evidence": "Observed locking logs",
                "confidence": 0.95,
                "scope": "DATABASE"
            }
        ],
        "status": "APPROVED"
    }

    approve_resp = client.post(f"/api/incidents/{inc.id}/post-review", json=payload)
    assert approve_resp.status_code == 200

    # 4. Assert memory cards populated
    mem = db_session.query(Memory).filter(
        Memory.project_id == "P001",
        Memory.title.like("%Incident Learning%")
    ).first()
    assert mem is not None
    assert "SQLite" in mem.content

    # Assert LearningCandidate matches
    lc = db_session.query(LearningCandidate).filter(
        LearningCandidate.incident_id == inc.id
    ).first()
    assert lc is not None
    assert lc.status == "APPROVED"

    # 5. Assert Continuous Improvement proposal generated (tasks created)
    proposal = db_session.query(ImprovementProposal).filter(
        ImprovementProposal.incident_id == inc.id
    ).first()
    assert proposal is not None
    assert proposal.status == "APPROVED"
    assert proposal.task_id is not None
