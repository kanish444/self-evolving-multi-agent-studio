import sys
import os
import json
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.models.project import Project
from app.models.test_result import TestResult
from app.models.delivery import Release, Deployment, DeploymentStage, DeploymentApproval, EnvironmentConfig
from app.delivery.policies import DeliveryPolicyEngine
from app.delivery.build_manager import BuildManager
from app.delivery.release_manager import ReleaseManager
from app.delivery.pipeline import DeliveryPipeline

client = TestClient(app)

@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    # Seed a project if not exists
    p = db.query(Project).filter(Project.id == "P001").first()
    if not p:
        p = Project(
            id="P001",
            name="Student Management System",
            description="Test Project",
            status="IN_PROGRESS",
            current_iteration=1
        )
        db.add(p)
        db.commit()
    yield db
    db.close()

def test_delivery_policy_engine_risk():
    """Asserts risk analysis engine correctly categorizes threat levels"""
    # 1. Low risk
    files_low = {"main.py": "print('hello')"}
    assert DeliveryPolicyEngine.analyze_risk(files_low) == "LOW"
    
    # 2. Critical: destructive sql
    files_crit = {"schema.sql": "DROP TABLE students;"}
    assert DeliveryPolicyEngine.analyze_risk(files_crit) == "CRITICAL"
    
    # 3. High: dockerfiles or configuration
    files_high = {"Dockerfile": "FROM python:3.10-slim"}
    assert DeliveryPolicyEngine.analyze_risk(files_high) == "HIGH"

def test_secret_scanner_detection():
    """Asserts secret scanner catches exposed tokens and masks them"""
    files_dirty = {"config.py": "AWS_KEY = 'AKIA1234567890ABCDEF'"}
    clean, violations = DeliveryPolicyEngine.scan_for_secrets(files_dirty)
    assert clean is False
    assert len(violations) > 0
    # Must mask secret in logs
    assert "AKIA" in violations[0]
    assert "AKIA1234567890ABCDEF" not in violations[0]

def test_dockerfile_compliance():
    """Asserts Dockerfile compliance checks prevent root execution or unpinned base images"""
    # Compliant
    df_ok = "FROM python:3.10-slim\nUSER guest\nCMD ['python']"
    ok, violations = DeliveryPolicyEngine.validate_dockerfile(df_ok)
    assert ok is True
    
    # Non-compliant: running as root (missing USER)
    df_root = "FROM python:3.10-slim\nCMD ['python']"
    root_ok, root_violations = DeliveryPolicyEngine.validate_dockerfile(df_root)
    assert root_ok is False
    assert "runs as ROOT" in root_violations[0]

def test_build_vulnerable_packages(db_session):
    """Asserts build blocks if vulnerable requirements packages are listed"""
    files_bad = {
        "main.py": "print('ok')",
        "requirements.txt": "pycrypto==2.6.1"
    }
    success, msg, stages, files = BuildManager.run_build("P001", files_bad, "1.0.0", db_session)
    assert success is False
    assert "Vulnerable package dependency detected" in msg

def test_api_environments_load(db_session):
    """Asserts environments API initializes Development, Staging, and Production profiles"""
    response = client.get("/api/delivery/environments/P001")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    names = [e["environment_name"] for e in data]
    assert "DEVELOPMENT" in names
    assert "STAGING" in names
    assert "PRODUCTION" in names

def test_pipeline_staging_success(db_session):
    """Asserts staging delivery runs successfully through smoke health checks"""
    # Set no failing test results in database to pass quality gates
    db_session.query(TestResult).filter(TestResult.project_id == "P001", TestResult.status == "FAILED").delete()
    db_session.commit()

    files = {
        "vehicle_service.py": "class Book:\n    pass\n",
        "requirements.txt": "fastapi>=0.100.0\n"
    }

    # Trigger Staging Release candidate
    payload = {
        "project_id": "P001",
        "version": "1.0.0",
        "environment": "STAGING",
        "created_by": "Operator",
        "simulate_health_failure": False,
        "files": files
    }
    
    response = client.post("/api/delivery/releases", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "release_id" in data

    # Check release status in db
    release = db_session.query(Release).filter(Release.id == data["release_id"]).first()
    assert release.status == "DEPLOYED"

def test_pipeline_production_approval_flow(db_session):
    """Asserts production deployment pauses for approval and resumes/rejects correctly"""
    files = {
        "vehicle_service.py": "class Book:\n    pass\n",
        "requirements.txt": "fastapi>=0.100.0\n",
        "Dockerfile": "FROM python:3.10-slim\nUSER guest\n"
    }

    payload = {
        "project_id": "P001",
        "version": "1.1.0",
        "environment": "PRODUCTION",
        "created_by": "Operator",
        "simulate_health_failure": False,
        "files": files
    }

    # 1. Trigger production - should return APPROVAL_REQUIRED
    response = client.post("/api/delivery/releases", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "APPROVAL_REQUIRED"
    assert "approval_id" in res_data
    
    release_id = res_data["release_id"]
    approval_id = res_data["approval_id"]

    # Assert release status in DB
    release = db_session.query(Release).filter(Release.id == release_id).first()
    assert release.status == "APPROVAL_REQUIRED"

    # 2. Submit rejection to test rejection cancel
    reject_payload = {
        "approved": False,
        "comments": "Fails manual audit",
        "approved_by": "Lead Reviewer"
    }
    rej_response = client.post(f"/api/delivery/approvals/{approval_id}", json=reject_payload)
    assert rej_response.status_code == 200
    assert rej_response.json()["status"] == "REJECTED"
    
    db_session.refresh(release)
    assert release.status == "CANCELLED"

    # 3. Trigger again for approval
    payload["version"] = "1.2.0"
    response2 = client.post("/api/delivery/releases", json=payload)
    res_data2 = response2.json()
    approval_id2 = res_data2["approval_id"]
    release_id2 = res_data2["release_id"]

    # Approve release
    approve_payload = {
        "approved": True,
        "comments": "Checked and ready",
        "approved_by": "Lead Reviewer"
    }
    appr_response = client.post(f"/api/delivery/approvals/{approval_id2}", json=approve_payload)
    assert appr_response.status_code == 200
    assert appr_response.json()["status"] == "SUCCESS"

    db_session.expire_all()
    release2 = db_session.query(Release).filter(Release.id == release_id2).first()
    assert release2.status == "DEPLOYED"

def test_pipeline_smoke_failure_auto_rollback(db_session):
    """Asserts that failing post-deployment health check triggers automatic rollback to previous release"""
    files = {
        "vehicle_service.py": "class Book:\n    pass\n",
        "requirements.txt": "fastapi>=0.100.0\n"
    }

    # Ensure there is a previously deployed release in database (Release 1.2.0 is DEPLOYED from previous test)
    # Trigger Staging Release with simulate_health_failure = True
    payload = {
        "project_id": "P001",
        "version": "1.3.0",
        "environment": "STAGING",
        "created_by": "Operator",
        "simulate_health_failure": True,
        "files": files
    }

    response = client.post("/api/delivery/releases", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ROLLED_BACK"
    assert "Automatic rollback completed successfully" in data["message"]

    # Verify release state in DB is ROLLED_BACK
    release = db_session.query(Release).filter(Release.id == data["release_id"]).first()
    assert release.status == "ROLLED_BACK"
