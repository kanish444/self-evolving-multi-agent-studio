import sys
import os
import pytest
from fastapi.testclient import TestClient

# Put backend folder in path to allow app import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

def test_ai_health():
    response = client.get("/api/ai/health")
    assert response.status_code == 200
    data = response.json()
    assert "provider" in data
    assert "model" in data
    assert "configuration_status" in data
    assert "availability" in data

def test_analyze_requirement_success():
    payload = {
        "project_id": "P001",
        "requirement": "Build a Vehicle Service Management System"
    }
    response = client.post(
        "/api/ai/analyze-requirement",
        json=payload,
        headers={"X-Trace-Id": "test-trace-123", "X-Correlation-Id": "test-corr-123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "application_type" in data
    assert len(data["target_users"]) > 0
    assert len(data["core_features"]) > 0
    assert len(data["functional_requirements"]) > 0

def test_analyze_requirement_project_not_found():
    payload = {
        "project_id": "P_INVALID_ID",
        "requirement": "Build a Vehicle Service Management System"
    }
    response = client.post("/api/ai/analyze-requirement", json=payload)
    assert response.status_code == 404

def test_create_plan_success():
    payload = {
        "project_id": "P001",
        "requirement": "Build a Vehicle Service Management System"
    }
    response = client.post("/api/ai/create-plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "project_goals" in data
    assert "modules" in data
    assert "tasks" in data
    assert "dependencies" in data
    assert len(data["suggested_order"]) > 0

def test_analyze_architecture_success():
    payload = {
        "project_id": "P001",
        "requirement": "Build a Vehicle Service Management System"
    }
    response = client.post("/api/ai/analyze-architecture", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "frontend" in data
    assert "backend" in data
    assert "database" in data
    assert "authentication" in data
    assert len(data["major_components"]) > 0

def test_generate_code_success():
    payload = {
        "project_id": "P001",
        "task_id": "task-03",
        "language": "python",
        "framework": "fastapi",
        "requirements": "Write a model for Student tracking with validation checks"
    }
    response = client.post("/api/ai/generate-code", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "file_path" in data
    assert "code" in data
    assert "purpose" in data

def test_explain_code_success():
    payload = {
        "code": "def get_db():\n    db = SessionLocal()\n    try:\n        yield db\n    finally:\n        db.close()",
        "language": "python",
        "context": "FastAPI database dependency utility"
    }
    response = client.post("/api/ai/explain-code", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "logic" in data
    assert len(data["dependencies"]) >= 0

def test_generate_tests_success():
    payload = {
        "requirements": "Validate unique email configuration and response codes",
        "code": "def verify_email(email):\n    return '@' in email",
        "task_description": "Add testing for verifying email validations"
    }
    response = client.post("/api/ai/generate-tests", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "tests" in data
    assert len(data["tests"]) > 0
    assert "test_name" in data["tests"][0]

def test_analyze_bug_success():
    payload = {
        "error_message": "OperationalError: database is locked",
        "stack_trace": "Traceback (most recent call last):\n  File 'database.py', line 45, in commit\nsqlite3.OperationalError: database is locked",
        "code": "db.commit()",
        "task_info": "Bulk CSV upload with high write concurrency",
        "project_id": "P001"
    }
    response = client.post("/api/ai/analyze-bug", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "error_summary" in data
    assert "probable_root_cause" in data
    assert "suggested_fix" in data

def test_review_code_success():
    payload = {
        "code": "def save_data(data):\n    db.execute('INSERT INTO log VALUES (' + data + ')')",
        "project_id": "P001"
    }
    response = client.post("/api/ai/review-code", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "correctness" in data
    assert "security" in data
    assert "potential_bugs" in data

def test_analyze_evolution_success():
    payload = {
        "project_id": "P001",
        "iteration_id": "it-P001-3",
        "test_results": "All tests passed. Stress execution successfully serialization checked.",
        "bugs": "Database locking issue fixed.",
        "fixes": "Wrapped database writes in thread-safe locks.",
        "review_results": "Excellent codebase compliance rating."
    }
    response = client.post("/api/ai/analyze-evolution", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "what_went_wrong" in data
    assert "pattern_discovered" in data
    assert "potential_reusable_learning" in data

def test_summarize_memory_success():
    payload = {
        "project_id": "P001",
        "problem": "SQLite write deadlocks under multi-threaded imports.",
        "cause": "SQLite database locks the entire file on writes.",
        "solution": "Wrap write connection calls in serializing thread-safety mutex.",
        "learning": "Implement database connection queue/locks to serialized SQLite writes.",
        "context": "database.py, CSV stress testing"
    }
    response = client.post("/api/ai/summarize-memory", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "problem" in data
    assert "learning" in data
    assert "confidence" in data
