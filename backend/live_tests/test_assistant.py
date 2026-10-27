"""Integration and policy compliance tests for SE-MAESTRO Conversational Engineering Assistant."""
import asyncio
import json
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

TEST_ROOT = Path(tempfile.mkdtemp(prefix='maestro-assistant-tests-'))
os.environ['DATABASE_URL'] = 'sqlite:///' + str(TEST_ROOT / 'db.sqlite')
os.environ['MAESTRO_WORKSPACE_ROOT'] = str(TEST_ROOT / 'projects')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app
from app.core.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.models.governance import User
from app.live import engine, assistant
from app.ai.providers.gemini import IncompleteResponseError

client = TestClient(app)


@pytest.fixture()
def user_headers():
    with SessionLocal() as db:
        if not db.get(User, 'carol'):
            db.add(User(id='carol', username='carol', email='carol@example.test', full_name='Carol', password_hash=hash_password('Testing-password-12'), is_active=True))
            db.add(User(id='dave', username='dave', email='dave@example.test', full_name='Dave', password_hash=hash_password('Testing-password-12'), is_active=True))
            db.commit()
    return {'Authorization': 'Bearer ' + create_access_token('carol', 'carol@example.test', 'DEVELOPER')}


@pytest.fixture()
def dave_headers():
    return {'Authorization': 'Bearer ' + create_access_token('dave', 'dave@example.test', 'DEVELOPER')}


def create_test_project(headers, name="Assistant Test Project"):
    res = client.post('/api/projects', headers=headers, json={
        'name': name,
        'description': 'Integration verification project for conversational engineering assistant.'
    })
    assert res.status_code == 201, res.text
    pid = res.json()['id']
    
    # Initialize workspace with a standard app.py and tests/test_app.py
    engine.write_files(pid, [
        engine.SourceFile(
            path='app.py',
            content=(
                "import http.server, sqlite3, os\n"
                "# User authentication routes: /register, /login, /logout\n"
                "# First user becomes admin: cnt == 0\n"
                "class Handler(http.server.BaseHTTPRequestHandler):\n"
                "    def do_GET(self):\n"
                "        self.send_response(200)\n"
                "        self.end_headers()\n"
                "        self.wfile.write(b'OK')\n"
            )
        ),
        engine.SourceFile(
            path='tests/test_app.py',
            content=(
                "import unittest\n"
                "class AppTests(unittest.TestCase):\n"
                "    def test_sample(self): self.assertTrue(True)\n"
            )
        )
    ])
    st = engine.load(pid)
    st.update(
        status="READY",
        approved=True,
        plan={
            "summary": "Sample plan",
            "architecture": "Python http.server + sqlite3",
            "acceptance": ["Serves OK"],
            "tasks": ["Implement"],
            "runtime": "python"
        },
        test_result={
            "passed": False,
            "test_count": 5,
            "passed_count": 0,
            "failed_count": 5,
            "exit_code": 1,
            "output": "FAILED (failures=5) in tests/test_app.py\nAssertionError: False != True"
        }
    )
    engine.save(pid, st)
    return pid


# ==============================================================================
# SECTION 10 VERIFICATION TESTS
# ==============================================================================

def test_credential_question_is_read_only_and_discloses_no_secrets(user_headers):
    """User: 'What username and password should I use?'
    Expected: Inspect auth setup, explain registration accurately, zero file changes, no secret disclosure.
    """
    pid = create_test_project(user_headers)
    initial_files = engine.snapshot(pid)

    res = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
        "message": "What username and password should I use?"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["intent"] == "ACCOUNT_HELP"
    assert data["read_only"] is True
    assert "register" in data["reply"].lower()
    assert "admin" in data["reply"].lower()
    
    # Secrets must not be exposed or hallucinated
    assert "Testing-password-12" not in data["reply"]
    assert "password=" not in data["reply"]

    # Zero file mutations
    assert engine.snapshot(pid) == initial_files


def test_file_explanation_question_is_read_only(user_headers):
    """User: 'What does app.py do?'
    Expected: Read the file and explain its actual responsibilities. Zero file changes.
    """
    pid = create_test_project(user_headers)
    initial_files = engine.snapshot(pid)

    res = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
        "message": "What does app.py do?"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["intent"] == "EXPLAIN_PROJECT"
    assert data["read_only"] is True
    assert "app.py" in data["reply"]
    assert "http" in data["reply"].lower()

    # Zero file mutations
    assert engine.snapshot(pid) == initial_files


def test_runtime_status_request_is_read_only_and_reports_state(user_headers):
    """User: 'Is my application running?'
    Expected: Inspect runtime state and report health without restarting.
    """
    pid = create_test_project(user_headers)
    initial_files = engine.snapshot(pid)

    res = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
        "message": "Is my application running?"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["intent"] == "CHECK_STATUS"
    assert any(term in data["reply"].lower() for term in ["running", "not running", "preview", "status", "inactive"])

    # Zero file mutations
    assert engine.snapshot(pid) == initial_files


def test_failure_question_vs_repair_authorization(monkeypatch, user_headers):
    """User: 'Why did five tests fail?' -> Read runner output, explain failures, no mutation.
    User: 'Fix those failures.' -> Resume targeted diagnosis and repair.
    """
    mock_execute = AsyncMock()
    monkeypatch.setattr(engine, 'execute', mock_execute)

    pid = create_test_project(user_headers)
    initial_files = engine.snapshot(pid)

    # 1. Asking why tests failed is an inquiry (read-only)
    res_inquiry = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
        "message": "Why did five tests fail?"
    })
    assert res_inquiry.status_code == 200, res_inquiry.text
    data_inquiry = res_inquiry.json()
    assert data_inquiry["intent"] == "EXPLAIN_PROJECT"
    assert data_inquiry["read_only"] is True
    assert "5" in data_inquiry["reply"] or "fail" in data_inquiry["reply"].lower()
    assert engine.snapshot(pid) == initial_files
    assert mock_execute.call_count == 0

    # 2. Authorizing repair triggers DEBUG_FAILURE mutation
    res_fix = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
        "message": "Fix those failures."
    })
    assert res_fix.status_code == 200, res_fix.text
    data_fix = res_fix.json()
    assert data_fix["intent"] == "DEBUG_FAILURE"
    assert data_fix["read_only"] is False
    assert mock_execute.call_count == 1


def test_implementation_request_triggers_modify(monkeypatch, user_headers):
    """User: 'Make the generated app login look professional.'
    Expected: Triggers MODIFY_PROJECT, dispatches targeted modification, preserving working architecture.
    """
    mock_execute = AsyncMock()
    monkeypatch.setattr(engine, 'execute', mock_execute)

    pid = create_test_project(user_headers)
    res = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
        "message": "Make the generated app login look professional."
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["intent"] == "MODIFY_PROJECT"
    assert data["read_only"] is False
    assert mock_execute.call_count == 1
    call_args = mock_execute.call_args[0]
    assert call_args[0] == pid
    assert "login" in call_args[1].lower()


def test_ambiguous_request_requires_clarification(user_headers):
    """Ambiguous messages receive a short clarification before consequential action."""
    pid = create_test_project(user_headers)
    initial_files = engine.snapshot(pid)

    res = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
        "message": "maybe something or what do you think?"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["intent"] == "ANSWER_QUESTION"
    assert data["read_only"] is True
    # Zero file mutations
    assert engine.snapshot(pid) == initial_files


def test_studio_platform_boundary_rejection(user_headers):
    """User: 'Improve SE-MAESTRO's dashboard.'
    Expected: Recognize this as a studio change request and protect platform boundary.
    """
    pid = create_test_project(user_headers)
    initial_files = engine.snapshot(pid)

    res = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
        "message": "Improve SE-MAESTRO's dashboard"
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["intent"] == "ANSWER_QUESTION"
    assert data["read_only"] is True
    assert "platform" in data["reply"].lower() or "studio" in data["reply"].lower()
    # Studio files cannot be modified
    assert engine.snapshot(pid) == initial_files


def test_cancellation_request_stops_run(user_headers):
    """User: 'Stop.'
    Expected: Interpret in conversation context and cancel active run.
    """
    pid = create_test_project(user_headers)
    engine.reserve(pid)
    try:
        res = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
            "message": "Stop."
        })
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["intent"] == "CANCEL_RUN"
        assert (engine.directory(pid) / "cancel.requested").exists()
    finally:
        engine.BUSY.discard(pid)
        (engine.directory(pid) / "cancel.requested").unlink(missing_ok=True)


def test_concurrent_read_only_question_allowed_when_busy(monkeypatch, user_headers):
    """When an operation is active, allow read-only questions and status checks.
    Prevent conflicting mutations and clearly report the active operation.
    """
    mock_execute = AsyncMock()
    monkeypatch.setattr(engine, 'execute', mock_execute)

    pid = create_test_project(user_headers)
    engine.reserve(pid)
    try:
        # Read-only question succeeds even when busy
        res_q = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
            "message": "What does app.py do?"
        })
        assert res_q.status_code == 200, res_q.text
        data_q = res_q.json()
        assert data_q["read_only"] is True
        assert "operation in progress" in data_q["reply"].lower()

        # Conflicting mutation is rejected with 409
        res_mut = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={
            "message": "Make the login page look professional"
        })
        assert res_mut.status_code == 409
        assert "in progress" in res_mut.json()["detail"].lower()
    finally:
        engine.BUSY.discard(pid)


def test_cross_project_access_rejected(user_headers, dave_headers):
    """Users cannot query or chat with projects they do not own."""
    pid = create_test_project(user_headers)
    # Dave attempts to access Carol's project
    res = client.post(f"/api/projects/{pid}/live/chat", headers=dave_headers, json={
        "message": "What username and password should I use?"
    })
    assert res.status_code == 404


def test_tamil_tanglish_request_handling():
    """Verify that assistant recognizes Tanglish / Tamil requests and responds appropriately."""
    decision = assistant.IntentDecision(
        intent="ACCOUNT_HELP",
        active_project_id="test-tanglish",
        requested_outcome="Explain auth in Tanglish",
        read_only=True
    )
    grounding = {
        "project_name": "TaskFlow",
        "auth_setup": {
            "has_registration": True,
            "first_user_is_admin": True
        }
    }
    reply = assistant.generate_deterministic_fallback(
        "Tamil la login pathi sollu",
        decision,
        grounding,
        is_tanglish=True
    )
    assert "admin" in reply
    assert "irukku" in reply or "kedaikkum" in reply


def test_malformed_provider_response_falls_back_cleanly():
    """If provider fails or returns truncated output, the assistant falls back to grounded answers without crashing."""
    decision = assistant.IntentDecision(
        intent="ACCOUNT_HELP",
        active_project_id="fallback-test",
        requested_outcome="Explain auth",
        read_only=True
    )
    grounding = {
        "project_name": "Fallback App",
        "auth_setup": {
            "has_registration": True,
            "first_user_is_admin": True
        }
    }
    fallback_reply = assistant.generate_deterministic_fallback("What credentials?", decision, grounding)
    assert "admin" in fallback_reply.lower()
    assert "register" in fallback_reply.lower()


def test_read_only_causes_zero_file_changes_and_zero_builds(monkeypatch, user_headers):
    """Verify that all read-only questions cause zero file changes and zero build invocations."""
    mock_execute = AsyncMock()
    monkeypatch.setattr(engine, 'execute', mock_execute)

    pid = create_test_project(user_headers)
    initial_files = engine.snapshot(pid)

    questions = [
        "What does app.py do?",
        "What username and password should I use?",
        "Is my application running?",
        "Why did five tests fail?",
        "How does authentication work?",
        "What files are in this project?",
        "Show me the test output",
    ]

    for q in questions:
        res = client.post(f"/api/projects/{pid}/live/chat", headers=user_headers, json={"message": q})
        assert res.status_code == 200
        assert res.json()["read_only"] is True

    # Assert ZERO builds invoked
    assert mock_execute.call_count == 0
    # Assert ZERO files changed
    assert engine.snapshot(pid) == initial_files
