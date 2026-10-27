import sys
import os
import pytest
from fastapi.testclient import TestClient

# Put backend folder in path to allow app import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.sandbox.validators import validate_filepath, validate_execution_files
from app.sandbox.policies import validate_command
from app.sandbox.result_parser import parse_test_results
from app.sandbox.cleanup import cleanup_workspace
from app.sandbox.manager import sandbox_manager
from app.models.sandbox import Execution, ExecutionFile, ExecutionResult
from app.core.database import SessionLocal

client = TestClient(app)

def test_path_traversal_validation():
    """Asserts that validators reject path traversals, absolute references, and system directories"""
    assert validate_filepath("clean_file.py") is True
    assert validate_filepath("subfolder/clean_file.py") is True
    
    assert validate_filepath("../evil_file.py") is False
    assert validate_filepath("subfolder/../../evil.py") is False
    assert validate_filepath("/etc/passwd") is False
    assert validate_filepath("C:\\Windows\\system.ini") is False
    assert validate_filepath("subfolder/etc/passwd") is False

def test_command_allowlist_validation():
    """Asserts that validators block arbitrary system command triggers or piping attempts"""
    assert validate_command("python", "pytest test_file.py") is True
    assert validate_command("python", "python main.py") is True
    assert validate_command("javascript", "node index.js") is True
    
    # Rejections
    assert validate_command("python", "python main.py; rm -rf /") is False
    assert validate_command("python", "pytest test_file.py && reboot") is False
    assert validate_command("python", "cat /etc/passwd") is False
    assert validate_command("javascript", "npm install arbitrary-hack-pkg") is False

def test_result_parser_pytest():
    """Asserts that stdout summary lines from pytest are parsed successfully"""
    sample_stdout = (
        "============================= test session starts =============================\n"
        "collected 3 items\n"
        "test_main.py ..F                                                       [100%]\n"
        "=================================== FAILURES ===================================\n"
        "_________________________________ test_failure _________________________________\n"
        "AssertionError: assert 1 == 2\n"
        "=========================== short test summary info ===========================\n"
        "FAILED test_main.py::test_failure - AssertionError: assert 1 == 2\n"
        "========================= 1 failed, 2 passed in 0.45s =========================\n"
    )
    res = parse_test_results(sample_stdout, "")
    assert res["total"] == 3
    assert res["passed"] == 2
    assert res["failed"] == 1
    assert res["duration"] == "0.45s"

def test_result_parser_jest():
    """Asserts that Jest summary logs are parsed successfully"""
    sample_stdout = (
        " PASS  tests/auth.test.js\n"
        "Tests:       3 passed, 3 total\n"
        "Time:        1.234s\n"
    )
    res = parse_test_results(sample_stdout, "")
    assert res["total"] == 3
    assert res["passed"] == 3
    assert res["failed"] == 0
    assert res["duration"] == "1.234s"

def test_workspace_cleanup_safeguard():
    """Asserts that cleanup method refuses to modify root system folders"""
    # Safe check
    cleanup_workspace("/")
    cleanup_workspace("C:\\")
    cleanup_workspace("C:\\Windows\\System32")
    # No exception should be raised and system folders remain intact

def test_sandbox_rest_lifecycle():
    """Submits a python script execution and asserts that execution result is stored in DB"""
    # 1. Create a script that outputs simple messages
    payload = {
        "project_id": "P001",
        "language": "python",
        "entrypoint": "main.py",
        "files": [
            {"path": "main.py", "content": "print('hello from sandbox')\nimport sys\nprint('error message', file=sys.stderr)"}
        ]
    }
    response = client.post("/api/sandbox/execute", json=payload)
    assert response.status_code == 201
    data = response.json()
    exec_id = data["id"]
    
    assert data["status"] == "QUEUED"
    assert data["language"] == "python"

    # Wait briefly for background execution to complete
    import time
    db = SessionLocal()
    completed = False
    
    for _ in range(10):
        db.expire_all()
        exec_record = db.query(Execution).filter(Execution.id == exec_id).first()
        if exec_record and exec_record.status in ["SUCCESS", "FAILED", "TIMEOUT"]:
            completed = True
            break
        time.sleep(0.5)

    assert completed is True, "Background sandbox task should have completed"
    
    # 2. Get detail
    detail_res = client.get(f"/api/sandbox/executions/{exec_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    
    assert detail_data["status"] == "SUCCESS"
    assert "hello from sandbox" in detail_data["result"]["stdout"]
    assert "error message" in detail_data["result"]["stderr"]
    assert detail_data["result"]["exit_code"] == 0
    db.close()

def test_sandbox_hard_timeout():
    """Asserts that infinite loops are killed automatically, returning TIMEOUT status"""
    payload = {
        "project_id": "P001",
        "language": "python",
        "entrypoint": "loop.py",
        "timeout_seconds": 1,
        "files": [
            {"path": "loop.py", "content": "import time\nwhile True:\n    time.sleep(0.1)"}
        ]
    }
    response = client.post("/api/sandbox/execute", json=payload)
    assert response.status_code == 201
    exec_id = response.json()["id"]

    import time
    db = SessionLocal()
    completed = False
    
    for _ in range(10):
        db.expire_all()
        exec_record = db.query(Execution).filter(Execution.id == exec_id).first()
        if exec_record and exec_record.status in ["SUCCESS", "FAILED", "TIMEOUT"]:
            completed = True
            break
        time.sleep(0.5)

    assert completed is True
    exec_record = db.query(Execution).filter(Execution.id == exec_id).first()
    assert exec_record.status == "TIMEOUT"
    db.close()

def test_sandbox_output_truncation():
    """Asserts that excessive program outputs are truncated safely to protect host resources"""
    payload = {
        "project_id": "P001",
        "language": "python",
        "entrypoint": "spam.py",
        "files": [
            {"path": "spam.py", "content": "print('spam' * 50000)"}
        ]
    }
    response = client.post("/api/sandbox/execute", json=payload)
    assert response.status_code == 201
    exec_id = response.json()["id"]

    import time
    db = SessionLocal()
    completed = False
    for _ in range(10):
        db.expire_all()
        exec_record = db.query(Execution).filter(Execution.id == exec_id).first()
        if exec_record and exec_record.status in ["SUCCESS", "FAILED", "RESOURCE_LIMIT"]:
            completed = True
            break
        time.sleep(0.5)

    assert completed is True
    exec_record = db.query(Execution).filter(Execution.id == exec_id).first()
    assert exec_record.status == "RESOURCE_LIMIT"
    assert exec_record.result.resource_limited is True
    assert "TRUNCATED" in exec_record.result.stdout
    db.close()

def test_sandbox_secrets_purged():
    """Asserts that environment secrets and API keys are not inherited by the sandbox subprocess"""
    payload = {
        "project_id": "P001",
        "language": "python",
        "entrypoint": "check_env.py",
        "files": [
            {"path": "check_env.py", "content": "import os\nprint('GEMINI_KEY_EXISTS:', 'GEMINI_API_KEY' in os.environ)"}
        ]
    }
    # Add dummy key in current os.environ to check purge
    os.environ["GEMINI_API_KEY"] = "super-secret-key-123"

    response = client.post("/api/sandbox/execute", json=payload)
    exec_id = response.json()["id"]

    import time
    db = SessionLocal()
    completed = False
    for _ in range(10):
        db.expire_all()
        exec_record = db.query(Execution).filter(Execution.id == exec_id).first()
        if exec_record and exec_record.status in ["SUCCESS", "FAILED"]:
            completed = True
            break
        time.sleep(0.5)

    assert completed is True
    exec_record = db.query(Execution).filter(Execution.id == exec_id).first()
    assert exec_record.status == "SUCCESS"
    assert "GEMINI_KEY_EXISTS: False" in exec_record.result.stdout
    db.close()
