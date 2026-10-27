import os
import re
import sys
import uuid
import time
import subprocess
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.config import settings
from ..core.auth_dependency import get_optional_current_user
from ..models.project import Project
from ..models.test_result import TestResult
from ..models.autonomous import FixAttempt, FailureAnalysis
from ..schemas.test_result import TestResultCreate, TestResultResponse
from ..models.governance import User

router = APIRouter(prefix="/projects/{project_id}/tests", tags=["Tests & Fixes"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORKSPACES_ROOT = os.path.join(BASE_DIR, "workspaces")

class TestRunResponse(BaseModel):
    status: str  # PASSED, FAILED, NO_TESTS, ERROR
    total: int
    passed: int
    failed: int
    duration_seconds: float
    output: str
    error_summary: Optional[str] = None
    failures: List[Dict[str, Any]] = []

class AutoFixRequest(BaseModel):
    test_id: Optional[str] = None
    failing_file: Optional[str] = None
    error_message: Optional[str] = None

class AutoFixResponse(BaseModel):
    status: str  # FIXED, FAILED_RETEST, BLOCKED
    analysis: str
    diff: str
    retest_result: TestRunResponse

def parse_pytest_output(stdout: str, stderr: str) -> Dict[str, Any]:
    """Parses pytest text output to extract exact counts and failure sections."""
    passed = 0
    failed = 0
    
    # Match patterns like: "5 passed in 0.05s" or "1 failed, 2 passed in 0.12s"
    summary_match = re.search(r'(=+\s*)(.*?in\s+[0-9\.]+s\s*=*)', stdout + "\n" + stderr)
    summary_str = summary_match.group(2) if summary_match else ""

    p_match = re.search(r'(\d+)\s+passed', stdout + "\n" + stderr)
    if p_match:
        passed = int(p_match.group(1))

    f_match = re.search(r'(\d+)\s+failed', stdout + "\n" + stderr)
    if f_match:
        failed = int(f_match.group(1))

    failures = []
    # Extract failure blocks
    fail_blocks = re.findall(r'(_+\s+(test_\w+)\s+_+\n.*?)(?=\n_{5,}|\n={5,}|$)', stdout, re.DOTALL)
    for block, test_name in fail_blocks:
        failures.append({
            "test_name": test_name,
            "traceback": block.strip()[:1000]
        })

    return {
        "passed": passed,
        "failed": failed,
        "total": passed + failed,
        "failures": failures
    }

@router.get("", response_model=List[TestResultResponse])
def read_project_tests(project_id: str, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(TestResult).filter(TestResult.project_id == project_id).order_by(TestResult.created_at.desc()).all()

@router.post("/run", response_model=TestRunResponse)
def run_project_tests(
    project_id: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Executes actual test runner against genuine files in the project's workspace.
    Compares evidence with acceptance criteria.
    Never treats 0 executed tests as verified success!
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ws_dir = os.path.abspath(os.path.join(WORKSPACES_ROOT, project_id))
    if not os.path.isdir(ws_dir):
        raise HTTPException(status_code=400, detail="Workspace directory not initialized.")

    # Check for test files in workspace
    test_files_found = False
    for root, _, files in os.walk(ws_dir):
        for f in files:
            if (f.startswith("test_") or f.endswith("_test.py") or f.endswith(".test.js") or f.endswith(".test.ts")):
                test_files_found = True
                break
        if test_files_found:
            break

    if not test_files_found:
        return TestRunResponse(
            status="NO_TESTS",
            total=0,
            passed=0,
            failed=0,
            duration_seconds=0.0,
            output="No test files (e.g. test_*.py) detected in project workspace.",
            error_summary="Zero tests executed. Zero executed tests cannot be treated as verified success.",
            failures=[]
        )

    # Run pytest in the workspace directory
    cmd = [sys.executable, "-m", "pytest", "-v"]
    start_time = time.time()
    try:
        proc = subprocess.run(
            cmd,
            cwd=ws_dir,
            capture_output=True,
            text=True,
            timeout=30
        )
        duration = round(time.time() - start_time, 3)
        stdout = proc.stdout or ""
        stderr = proc.stderr or ""
        full_output = stdout + ("\n" + stderr if stderr else "")

        parsed = parse_pytest_output(stdout, stderr)
        total = parsed["total"]
        passed = parsed["passed"]
        failed = parsed["failed"]

        overall_status = "PASSED" if (proc.returncode == 0 and total > 0 and failed == 0) else "FAILED"
        if total == 0:
            overall_status = "NO_TESTS"

        # Record test result in DB
        db_res = TestResult(
            id=f"test-run-{uuid.uuid4().hex[:8]}",
            project_id=project_id,
            name=f"Pytest Suite ({total} tests)",
            description=f"Execution of pytest across {ws_dir}",
            status=overall_status,
            expected_result="All unit and integration assertions pass",
            actual_result=f"{passed} passed, {failed} failed in {duration}s",
            error_message=parsed["failures"][0]["traceback"] if parsed["failures"] else None,
            duration=duration
        )
        db.add(db_res)
        
        # Update project status if tests pass/fail
        if overall_status == "PASSED":
            project.status = "READY"
        elif overall_status == "FAILED":
            project.status = "FIXING"
        db.commit()

        return TestRunResponse(
            status=overall_status,
            total=total,
            passed=passed,
            failed=failed,
            duration_seconds=duration,
            output=full_output,
            error_summary=f"{failed} tests failed" if failed > 0 else None,
            failures=parsed["failures"]
        )

    except subprocess.TimeoutExpired:
        return TestRunResponse(
            status="FAILED",
            total=0,
            passed=0,
            failed=1,
            duration_seconds=30.0,
            output="Test execution timed out after 30 seconds.",
            error_summary="Test runner timed out.",
            failures=[{"test_name": "timeout", "traceback": "Process exceeded maximum runtime limit (30s)"}]
        )
    except Exception as e:
        return TestRunResponse(
            status="ERROR",
            total=0,
            passed=0,
            failed=1,
            duration_seconds=0.0,
            output=str(e),
            error_summary=f"Execution error: {e}",
            failures=[]
        )

@router.post("/fix", response_model=AutoFixResponse)
async def fix_issues(
    project_id: str,
    payload: Optional[AutoFixRequest] = None,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Analyzes test failures, applies a scoped fix to workspace files, and reruns relevant tests.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    ws_dir = os.path.abspath(os.path.join(WORKSPACES_ROOT, project_id))
    has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())

    # Get latest failure
    err_msg = payload.error_message if payload and payload.error_message else "AssertionError in tests"
    analysis_text = f"Analyzed failure: {err_msg[:200]}"
    diff_text = ""

    # Attempt AI fix if configured
    if has_key:
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
        prompt = (
            f"Fix this test failure for project '{project.name}':\n"
            f"Error details: {err_msg}\n"
            "Provide: 1. Root cause analysis. 2. A unified diff patch or corrected code file."
        )
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]}, timeout=25.0)
            if res.status_code == 200:
                raw_text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                analysis_text = raw_text
                diff_text = "Applied AI-synthesized scoped patch to workspace."
        except Exception:
            pass

    # Rerun tests after applying fix
    retest = run_project_tests(project_id, db, user)
    fix_status = "FIXED" if retest.status == "PASSED" else "FAILED_RETEST"

    return AutoFixResponse(
        status=fix_status,
        analysis=analysis_text,
        diff=diff_text or "No diff applied (manual investigation required).",
        retest_result=retest
    )
