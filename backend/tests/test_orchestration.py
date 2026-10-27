import sys
import os
import pytest
from fastapi.testclient import TestClient

# Put backend folder in path to allow app import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.orchestration.agent_registry import registry

client = TestClient(app)

def test_agent_registry():
    """Asserts that all 7 specialized agents are successfully registered"""
    roles = [
        "PROJECT_MANAGER",
        "ARCHITECT",
        "DEVELOPER",
        "TESTER",
        "DEBUGGER",
        "REVIEWER",
        "EVOLUTION"
    ]
    for role in roles:
        agent = registry.get_agent(role)
        assert agent is not None, f"Agent for role {role} should be registered"

def test_workflow_lifecycle_success():
    """Starts, pauses, resumes, and cancels a workflow run"""
    # 1. Start run
    payload = {
        "project_id": "P001",
        "requirement": "Build a Vehicle Service Management System"
    }
    response = client.post("/api/orchestration/start", json=payload)
    assert response.status_code == 201
    run_data = response.json()
    run_id = run_data["id"]
    
    assert run_data["project_id"] == "P001"
    assert run_data["status"] == "RUNNING"
    assert run_data["current_state"] == "REQUIREMENT_ANALYSIS"

    # 2. Read run details
    get_res = client.get(f"/api/orchestration/{run_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == run_id

    # 3. Read tasks
    tasks_res = client.get(f"/api/orchestration/{run_id}/tasks")
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()
    assert len(tasks) > 0
    assert tasks[0]["agent_role"] == "PROJECT_MANAGER"

    # 4. Pause run
    pause_res = client.post(f"/api/orchestration/{run_id}/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "PAUSED"

    # 5. Resume run
    resume_res = client.post(f"/api/orchestration/{run_id}/resume")
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "RUNNING"

    # 6. Cancel run
    cancel_res = client.post(f"/api/orchestration/{run_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

def test_workflow_timeline():
    """Asserts that visual timeline node metadata is successfully built"""
    payload = {
        "project_id": "P001",
        "requirement": "Verify timeline"
    }
    response = client.post("/api/orchestration/start", json=payload)
    run_id = response.json()["id"]
    
    timeline_res = client.get(f"/api/orchestration/{run_id}/timeline")
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()
    assert timeline["run_id"] == run_id
    assert len(timeline["nodes"]) > 0
    
    # Assert sequence structure
    states = [node["state"] for node in timeline["nodes"]]
    assert "CREATED" in states
    assert "REQUIREMENT_ANALYSIS" in states
    assert "COMPLETED" in states

def test_workflow_approvals_not_found():
    """Asserts validation checks when approving non-existent tasks"""
    response = client.post("/api/orchestration/run-invalid/tasks/task-invalid/approve", json={"comments": "looks good"})
    assert response.status_code == 404
