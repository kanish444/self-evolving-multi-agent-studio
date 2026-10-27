import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_headers():
    token = create_access_token("admin", "admin@se-maestro.ai", "ADMIN")
    return {"Authorization": f"Bearer {token}"}

def test_workspace_file_operations(auth_headers):
    # 1. Create a file in project P001 workspace
    create_res = client.post(
        "/api/projects/P001/workspace/files",
        json={"path": "src/test_service.py", "content": "print('hello from studio')"},
        headers=auth_headers
    )
    assert create_res.status_code == 200
    assert create_res.json()["status"] == "saved"

    # 2. Read the file back
    read_res = client.get(
        "/api/projects/P001/workspace/files/content?path=src/test_service.py",
        headers=auth_headers
    )
    assert read_res.status_code == 200
    assert "hello from studio" in read_res.json()["content"]

    # 3. List workspace files
    list_res = client.get("/api/projects/P001/workspace/files", headers=auth_headers)
    assert list_res.status_code == 200
    files = list_res.json()
    assert any(f["name"] == "src" for f in files) or any(f["name"] == "test_service.py" for f in files)

    # 4. Clean up test file
    del_res = client.delete(
        "/api/projects/P001/workspace/files?path=src/test_service.py",
        headers=auth_headers
    )
    assert del_res.status_code == 200

def test_workspace_path_traversal_blocked(auth_headers):
    bad_res = client.get(
        "/api/projects/P001/workspace/files/content?path=../../etc/passwd",
        headers=auth_headers
    )
    assert bad_res.status_code == 400

def test_settings_ai_config_and_limits(auth_headers):
    # 1. Read AI config
    res = client.get("/api/settings/ai-config", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "provider" in data
    assert "model" in data
    assert "is_api_key_configured" in data

    # 2. Read execution limits
    lim_res = client.get("/api/settings/execution-limits", headers=auth_headers)
    assert lim_res.status_code == 200
    assert lim_res.json()["command_timeout_seconds"] > 0

    # 3. Check demo data status
    demo_res = client.get("/api/settings/demo-status", headers=auth_headers)
    assert demo_res.status_code == 200
    assert "has_demo_data" in demo_res.json()

def test_architect_workflow_endpoints(auth_headers):
    # 1. Chat with architect
    chat_res = client.post(
        "/api/projects/P001/architect-chat",
        json={"message": "What is the recommended architecture for this project?"},
        headers=auth_headers
    )
    assert chat_res.status_code == 200
    assert len(chat_res.json()["reply"]) > 0

    # 2. Create concrete plan
    plan_res = client.post(
        "/api/projects/P001/architect-plan",
        json={},
        headers=auth_headers
    )
    assert plan_res.status_code == 200
    plan = plan_res.json()
    assert "scope" in plan
    assert len(plan["acceptance_criteria"]) > 0
    assert len(plan["modules"]) > 0
    assert len(plan["agent_roles"]) > 0

    # 3. Grant resource permissions
    perm_res = client.post(
        "/api/projects/P001/permissions",
        json={"permissions": ["READ_WRITE_FILES", "RUN_TESTS"]},
        headers=auth_headers
    )
    assert perm_res.status_code == 200
    assert "READ_WRITE_FILES" in perm_res.json()["permissions"]

    # 4. Approve plan
    app_res = client.post(
        "/api/projects/P001/approve-plan",
        json={"assigned_roles": ["Architect", "Developer", "Tester"]},
        headers=auth_headers
    )
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"

def test_preview_status():
    res = client.get("/api/projects/P001/preview/status")
    assert res.status_code == 200
    assert "status" in res.json()
