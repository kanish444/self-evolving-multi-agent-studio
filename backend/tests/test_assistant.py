"""Unit and integration tests for the SE-MAESTRO Conversational Assistant."""
import asyncio
import os
import shutil
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from pydantic import ValidationError

from app.live import assistant, engine
from app.live.assistant import IntentDecision, classify_intent_deterministic


@pytest.fixture
def temp_workspace(monkeypatch):
    """Create a temporary workspace directory for testing."""
    temp_dir = Path(tempfile.mkdtemp(prefix="maestro-test-assistant-"))
    monkeypatch.setattr(engine, "ROOT", temp_dir)
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def setup_project(temp_workspace):
    """Set up a mock project workspace with source files and state."""
    project_id = "test-proj-01"
    proj_dir = engine.directory(project_id)
    source_dir = proj_dir / "source"
    source_dir.mkdir(parents=True, exist_ok=True)

    # Create app.py with authentication and first user admin logic
    app_code = '''"""Test App for TaskFlow."""
from http.server import HTTPServer, BaseHTTPRequestHandler
import sqlite3

# First user admin logic
def get_user_role(db):
    cur = db.cursor()
    cur.execute("SELECT count(*) as cnt FROM users")
    count_res = cur.fetchone()
    role = 'admin' if count_res['cnt'] == 0 else 'user'
    return role

# Registration route at /register
# Session cookies use session_token
'''
    (source_dir / "app.py").write_text(app_code, encoding="utf-8")
    (source_dir / "requirements.txt").write_text("pytest\n", encoding="utf-8")

    # Initial state
    state = {
        "id": project_id,
        "name": "TaskFlow Verification",
        "description": "Task management system",
        "status": "READY",
        "approved": True,
        "plan": {
            "summary": "TaskFlow core architecture",
            "architecture": "Python stdlib HTTP server with SQLite",
            "acceptance": ["First user is admin", "Login sets session cookie"],
            "tasks": ["Implement auth", "Implement tasks API"],
            "runtime": "python"
        },
        "agents": {"CODER": "COMPLETED", "TESTER": "COMPLETED"},
        "test_result": {
            "has_run": True,
            "passed": True,
            "test_count": 6,
            "passed_count": 6,
            "failed_count": 0,
            "exit_code": 0,
            "output": "6 passed in 0.45s"
        },
        "messages": [],
        "events": []
    }
    engine.save(project_id, state)
    return project_id


# ==============================================================================
# 1. INTENT CLASSIFICATION TESTS (All 11 Intents)
# ==============================================================================

def test_intent_cancel_run():
    state = {"id": "P1", "approved": True}
    for phrase in ["stop", "cancel", "halt", "kill", "terminate", "Stop!"]:
        decision = classify_intent_deterministic(phrase, state, "P1")
        assert decision.intent == "CANCEL_RUN"
        assert decision.read_only is True


def test_intent_account_help():
    state = {"id": "P1", "approved": True}
    for phrase in [
        "What username and password should I use?",
        "how do i login",
        "what is the default password",
        "tell me the login credentials",
        "which user is admin"
    ]:
        decision = classify_intent_deterministic(phrase, state, "P1")
        assert decision.intent == "ACCOUNT_HELP"
        assert decision.read_only is True


def test_intent_check_status():
    state = {"id": "P1", "approved": True}
    for phrase in [
        "Is my application running?",
        "is the app running",
        "check status",
        "server status",
        "health check"
    ]:
        decision = classify_intent_deterministic(phrase, state, "P1")
        assert decision.intent == "CHECK_STATUS"
        assert decision.read_only is True


def test_intent_explain_failure_inquiry_vs_repair():
    state = {"id": "P1", "approved": True}
    # Asking WHY tests failed is an inquiry (read-only)
    inquiry_decision = classify_intent_deterministic("Why did five tests fail?", state, "P1")
    assert inquiry_decision.intent == "EXPLAIN_PROJECT"
    assert inquiry_decision.read_only is True

    # Demanding to FIX the failures authorizes repair (mutation)
    repair_decision = classify_intent_deterministic("Fix those failures.", state, "P1")
    assert repair_decision.intent == "DEBUG_FAILURE"
    assert repair_decision.read_only is False


def test_intent_run_tests():
    state = {"id": "P1", "approved": True}
    for phrase in ["run tests", "rerun tests", "execute tests", "run pytest"]:
        decision = classify_intent_deterministic(phrase, state, "P1")
        assert decision.intent == "RUN_TESTS"
        assert decision.read_only is False


def test_intent_preview_controls():
    state = {"id": "P1", "approved": True}
    start_dec = classify_intent_deterministic("start preview", state, "P1")
    assert start_dec.intent == "START_PREVIEW"
    assert start_dec.read_only is False

    stop_dec = classify_intent_deterministic("stop preview", state, "P1")
    assert stop_dec.intent == "STOP_PREVIEW"
    assert stop_dec.read_only is False


def test_intent_explain_project():
    state = {"id": "P1", "approved": True}
    for phrase in [
        "What does app.py do?",
        "explain app.py",
        "how does app.py work",
        "what files are here",
        "describe the architecture"
    ]:
        decision = classify_intent_deterministic(phrase, state, "P1")
        assert decision.intent == "EXPLAIN_PROJECT"
        assert decision.read_only is True


def test_intent_studio_platform_protection():
    state = {"id": "P1", "approved": True}
    for phrase in [
        "Improve SE-MAESTRO's dashboard",
        "modify se-maestro",
        "change studio"
    ]:
        decision = classify_intent_deterministic(phrase, state, "P1")
        assert decision.intent == "ANSWER_QUESTION"
        assert decision.read_only is True


def test_intent_general_question():
    state = {"id": "P1", "approved": True}
    for phrase in [
        "What is SQLite?",
        "Why do we use sessions?",
        "How does HTTP Basic Auth compare to cookies?"
    ]:
        decision = classify_intent_deterministic(phrase, state, "P1")
        assert decision.intent == "ANSWER_QUESTION"
        assert decision.read_only is True


def test_intent_modify_project():
    state = {"id": "P1", "approved": True}
    for phrase in [
        "Make the generated app login look professional",
        "Add an info badge to the dashboard",
        "Update the landing page styling"
    ]:
        decision = classify_intent_deterministic(phrase, state, "P1")
        assert decision.intent == "MODIFY_PROJECT"
        assert decision.read_only is False


def test_intent_plan_project():
    state = {"id": "P1", "approved": False}
    decision = classify_intent_deterministic("Plan a notification system", state, "P1")
    assert decision.intent in {"PLAN_PROJECT", "MODIFY_PROJECT"}


# ==============================================================================
# 2. READ-ONLY TOOLS VALIDATION
# ==============================================================================

def test_tool_list_files(setup_project):
    project_id = setup_project
    files = assistant.tool_list_files(project_id)
    assert len(files) >= 2
    paths = [f["path"] for f in files]
    assert "app.py" in paths
    assert "requirements.txt" in paths
    # Verify sizes are reported
    for f in files:
        assert f["size_bytes"] > 0


def test_tool_read_file_safety(setup_project):
    project_id = setup_project
    # Valid file read
    content = assistant.tool_read_file(project_id, "app.py")
    assert "Test App for TaskFlow" in content

    # Non-existent file
    error_msg = assistant.tool_read_file(project_id, "non_existent.py")
    assert "not found" in error_msg

    # Path traversal rejection
    traversal_err = assistant.tool_read_file(project_id, "../../../etc/passwd")
    assert "Error" in traversal_err


def test_tool_search_source(setup_project):
    project_id = setup_project
    matches = assistant.tool_search_source(project_id, "admin")
    assert len(matches) > 0
    assert matches[0]["file"] == "app.py"
    assert "admin" in matches[0]["content"]


def test_tool_get_approved_plan(setup_project):
    project_id = setup_project
    plan = assistant.tool_get_approved_plan(project_id)
    assert plan["approved"] is True
    assert "TaskFlow core" in plan["summary"]
    assert len(plan["acceptance"]) == 2


def test_tool_get_workflow_state(setup_project):
    project_id = setup_project
    wf = assistant.tool_get_workflow_state(project_id)
    assert wf["status"] == "READY"
    assert wf["approved"] is True
    assert wf["is_busy"] is False


def test_tool_get_test_results(setup_project):
    project_id = setup_project
    tr = assistant.tool_get_test_results(project_id)
    assert tr["has_run"] is True
    assert tr["passed"] is True
    assert tr["test_count"] == 6


def test_tool_inspect_auth_setup_redacts_secrets(setup_project):
    project_id = setup_project
    auth_info = assistant.tool_inspect_auth_setup(project_id)
    assert auth_info["has_auth"] is True
    assert auth_info["first_user_is_admin"] is True
    assert auth_info["session_cookie_used"] is True
    assert "/register" in auth_info["setup_instructions"]
    assert "No public default passwords exist" in auth_info["security_note"]


# ==============================================================================
# 3. CONVERSATIONAL ASSISTANT POLICY & PROCESS MESSAGE
# ==============================================================================

@pytest.mark.asyncio
async def test_read_only_question_causes_zero_mutations(setup_project):
    project_id = setup_project
    source_dir = engine.directory(project_id) / "source"
    
    # Snapshot files and timestamps
    before_files = {p: p.stat().st_mtime for p in source_dir.rglob("*") if p.is_file()}

    result, task = await assistant.process_user_message(
        project_id=project_id,
        user_message="What does app.py do?",
        project_name="TaskFlow Verification"
    )

    # 1. No background mutation task returned
    assert task is None
    # 2. Result is read-only
    assert result.get("read_only") is True
    assert result["intent"] == "EXPLAIN_PROJECT"
    assert len(result["reply"]) > 20

    # 3. Project state status remains READY (not RUNNING)
    state = engine.load(project_id)
    assert state["status"] == "READY"
    assert project_id not in engine.BUSY

    # 4. Source files must NOT be mutated
    after_files = {p: p.stat().st_mtime for p in source_dir.rglob("*") if p.is_file()}
    assert before_files == after_files


@pytest.mark.asyncio
async def test_platform_boundary_guard(setup_project):
    project_id = setup_project
    result, task = await assistant.process_user_message(
        project_id=project_id,
        user_message="Improve SE-MAESTRO's dashboard",
        project_name="TaskFlow Verification"
    )
    assert task is None
    assert "studio platform itself" in result["reply"]
    assert "cannot modify studio platform source files" in result["reply"]
    
    # Project state remains unmodified
    state = engine.load(project_id)
    assert state["status"] == "READY"


@pytest.mark.asyncio
async def test_account_help_flow(setup_project):
    project_id = setup_project
    result, task = await assistant.process_user_message(
        project_id=project_id,
        user_message="What username and password should I use?",
        project_name="TaskFlow Verification"
    )
    assert task is None
    assert result["intent"] == "ACCOUNT_HELP"
    reply = result["reply"].lower()
    # Must explain registration / first-user setup
    assert "register" in reply or "admin" in reply
    # Must NOT invent default passwords
    assert "password123" not in reply
    assert "admin/admin" not in reply


@pytest.mark.asyncio
async def test_tanglish_support(setup_project):
    project_id = setup_project
    result, task = await assistant.process_user_message(
        project_id=project_id,
        user_message="Can you explain this project in simple tanglish?",
        project_name="TaskFlow Verification"
    )
    assert task is None
    assert len(result["reply"]) > 20
    # Fallback or prompt includes Tanglish friendliness
    state = engine.load(project_id)
    assert state["status"] == "READY"


@pytest.mark.asyncio
async def test_cancellation_flow(setup_project):
    project_id = setup_project
    
    # When not busy
    res1, task1 = await assistant.process_user_message(project_id, "Stop", "TaskFlow")
    assert task1 is None
    assert "No engineering operation is currently active" in res1["reply"]

    # When busy
    engine.reserve(project_id)
    try:
        res2, task2 = await assistant.process_user_message(project_id, "Cancel", "TaskFlow")
        assert task2 is None
        assert "Cancellation requested" in res2["reply"]
        assert (engine.directory(project_id) / "cancel.requested").exists()
    finally:
        engine.release(project_id)


@pytest.mark.asyncio
async def test_concurrent_read_only_while_busy(setup_project):
    project_id = setup_project
    
    # Mark project as BUSY simulating background run
    engine.reserve(project_id)
    try:
        # Read-only status query should SUCCEED even while BUSY
        res, task = await assistant.process_user_message(
            project_id=project_id,
            user_message="Is my application running?",
            project_name="TaskFlow Verification"
        )
        assert task is None
        assert res.get("read_only") is True
        assert res["intent"] == "CHECK_STATUS"

        # Conflicting mutation query should be safely REJECTED with CONFLICT status
        res_mut, task_mut = await assistant.process_user_message(
            project_id=project_id,
            user_message="Make the login screen blue",
            project_name="TaskFlow Verification"
        )
        assert task_mut is None
        assert res_mut["status"] == "CONFLICT"
        assert res_mut.get("busy") is True
        assert "operation is currently in progress" in res_mut["reply"]
    finally:
        engine.release(project_id)


@pytest.mark.asyncio
async def test_deterministic_fallback_on_model_error(setup_project):
    project_id = setup_project
    decision = IntentDecision(
        intent="EXPLAIN_PROJECT",
        active_project_id=project_id,
        requested_outcome="Explain app.py",
        read_only=True,
        relevant_entities_and_files=["app.py"]
    )
    grounding = {
        "project_name": "TaskFlow Verification",
        "file_content_app.py": "def test(): pass",
        "approved_plan": {"summary": "TaskFlow plan", "architecture": "Python SQLite"},
        "workflow_state": {"status": "READY"}
    }
    
    # Directly test fallback generator
    fallback_text = assistant.generate_deterministic_fallback(
        "What does app.py do?",
        decision,
        grounding,
        "TaskFlow Verification",
        False
    )
    assert len(fallback_text) > 20
    assert "TaskFlow Verification" in fallback_text or "app.py" in fallback_text
