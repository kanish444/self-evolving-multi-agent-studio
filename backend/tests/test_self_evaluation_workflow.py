import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.autonomous.demonstration import run_self_evaluating_workflow
from app.models.orchestration import WorkflowRun
from app.models.task import Task
from app.models.sandbox import Execution
from app.models.test_result import TestResult
from app.models.autonomous import DevelopmentIteration, FailureAnalysis, FixAttempt

client = TestClient(app)

def test_self_evaluating_workflow_direct():
    """
    Executes the self-evaluating workflow directly and verifies:
    1. Initial run executes automated tests and fails on the candidate bug.
    2. Debugger & Developer execute a controlled correction attempt.
    3. Rerun executes automated tests in clean sandbox and passes.
    4. ResultComparator confirms before/after improvement.
    5. Database records are persisted.
    6. Stop conditions (max 2 test runs, 1 correction) are respected.
    """
    db = SessionLocal()
    try:
        report = run_self_evaluating_workflow(project_id="P001", db=db)

        # 1. Final Status and Counts
        assert report["final_status"] == "PASS"
        assert report["total_test_runs"] == 2
        assert report["total_correction_attempts"] == 1
        assert report["limits_enforced"]["stopped_safely"] is True

        # 2. Honest AI provider disclosure
        ai_status = report["ai_provider_status"]
        assert "configured_provider" in ai_status
        assert "execution_mode" in ai_status

        # 3. Run 1 Evidence (Initial failure)
        run_1 = report["run_1_evidence"]
        assert run_1["run_number"] == 1
        assert run_1["status"] == "FAIL"
        assert run_1["exit_code"] == 1
        assert "FAILED" in run_1["stdout"] or "AssertionError" in run_1["stdout"]
        assert run_1["parsed_stats"]["failed"] >= 1

        # 4. Debugger Analysis
        dbg = report["debugger_analysis"]
        assert dbg is not None
        assert "math_service.py" in dbg.get("affected_component", "")

        # 5. Run 2 Evidence (Corrected pass)
        run_2 = report["run_2_evidence"]
        assert run_2["run_number"] == 2
        assert run_2["status"] == "PASS"
        assert run_2["exit_code"] == 0
        assert "passed" in run_2["stdout"]
        assert run_2["parsed_stats"]["passed"] >= 1
        assert run_2["parsed_stats"]["failed"] == 0

        # 6. Before/After Comparison Evidence
        comp = report["before_after_comparison"]
        assert comp["is_improvement"] is True
        assert comp["is_regression"] is False
        assert comp["passed_diff"] >= 1
        assert comp["failed_diff"] <= -1

        # 7. Criteria Verification
        crit = report["criteria_verification"]
        assert crit["accepts_two_numeric_inputs"] is True
        assert crit["returns_correct_sum"] is True
        assert crit["automated_tests_actually_executed"] is True
        assert crit["test_results_from_real_test_runner"] is True
        assert crit["correction_followed_by_new_test_run"] is True
        assert crit["final_status_reflects_observed_evidence"] is True

        # 8. Database Persistence Checks
        persisted = report["database_records_persisted"]
        run_rec = db.query(WorkflowRun).filter(WorkflowRun.id == persisted["workflow_run_id"]).first()
        assert run_rec is not None
        assert run_rec.status == "COMPLETED"

        exec_1 = db.query(Execution).filter(Execution.id == persisted["execution_run_1_id"]).first()
        assert exec_1 is not None
        assert exec_1.status == "FAILED"

        exec_2 = db.query(Execution).filter(Execution.id == persisted["execution_run_2_id"]).first()
        assert exec_2 is not None
        assert exec_2.status == "SUCCESS"

        iter_1 = db.query(DevelopmentIteration).filter(DevelopmentIteration.id == persisted["iteration_1_id"]).first()
        assert iter_1 is not None

        iter_2 = db.query(DevelopmentIteration).filter(DevelopmentIteration.id == persisted["iteration_2_id"]).first()
        assert iter_2 is not None
        assert iter_2.status == "PASSED"

    finally:
        db.close()

def test_self_evaluating_workflow_api():
    """Verifies that the workflow is accessible via REST API endpoint"""
    response = client.post("/api/autonomous/demo-self-evaluation?project_id=P001")
    assert response.status_code == 200
    data = response.json()
    assert data["final_status"] == "PASS"
    assert data["total_test_runs"] == 2
    assert data["total_correction_attempts"] == 1
    assert data["criteria_verification"]["returns_correct_sum"] is True
