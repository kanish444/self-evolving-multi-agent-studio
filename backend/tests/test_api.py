from fastapi.testclient import TestClient
import sys
import os

# Put backend folder in path to allow app import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}

def test_get_projects():
    response = client.get("/api/projects")
    assert response.status_code == 200
    projects = response.json()
    assert len(projects) > 0
    assert any(p["id"] == "P001" for p in projects)

def test_get_agents():
    response = client.get("/api/agents")
    assert response.status_code == 200
    agents = response.json()
    assert len(agents) > 0
    assert any(a["id"] == "PM" for a in agents)

def test_get_project_tasks():
    response = client.get("/api/projects/P001/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) > 0
    assert tasks[0]["project_id"] == "P001"

def test_get_project_iterations():
    response = client.get("/api/projects/P001/iterations")
    assert response.status_code == 200
    iterations = response.json()
    assert len(iterations) > 0
    assert iterations[0]["project_id"] == "P001"

def test_get_project_tests():
    response = client.get("/api/projects/P001/tests")
    assert response.status_code == 200
    tests = response.json()
    assert len(tests) > 0
    assert tests[0]["project_id"] == "P001"

def test_get_project_evolution():
    response = client.get("/api/projects/P001/evolution")
    assert response.status_code == 200
    evos = response.json()
    assert len(evos) > 0
    assert evos[0]["project_id"] == "P001"

def test_get_project_memory():
    response = client.get("/api/projects/P001/memory")
    assert response.status_code == 200
    memories = response.json()
    assert len(memories) > 0
    assert memories[0]["project_id"] == "P001"

def test_get_project_logs():
    response = client.get("/api/projects/P001/logs")
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) > 0
    assert logs[0]["project_id"] == "P001"
