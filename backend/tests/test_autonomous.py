import sys
import os
import json
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.core.database import SessionLocal
from app.models.autonomous import DevelopmentIteration, ArtifactVersion, FailureAnalysis, AutonomyPolicy
from app.autonomous.failure_classifier import FailureClassifier
from app.autonomous.result_comparator import ResultComparator
from app.autonomous.loop_controller import DevelopmentLoopController
from app.autonomous.iteration_manager import IterationManager
from app.autonomous.fix_manager import FixManager

client = TestClient(app)

def test_failure_classification_mapping():
    """Asserts FailureClassifier correctly maps stacktraces and status flags to error categories"""
    # 1. Timeout
    assert FailureClassifier.classify_failure(1, "", "", True, False) == "TIMEOUT"
    # 2. Resource Limit
    assert FailureClassifier.classify_failure(1, "", "", False, True) == "RESOURCE_LIMIT"
    # 3. Security
    assert FailureClassifier.classify_failure(1, "Permission Denied: Host Command Exec", "", False, False) == "SECURITY_VIOLATION"
    # 4. Code logic error
    assert FailureClassifier.classify_failure(1, "", "NameError: name 'val' is not defined", False, False) == "CODE_ERROR"
    # 5. Assertion failures
    assert FailureClassifier.classify_failure(1, "assert 5 == 10", "", False, False) == "TEST_FAILURE"
    # 6. Dependency
    assert FailureClassifier.classify_failure(1, "", "ModuleNotFoundError: No module named 'pydantic'", False, False) == "DEPENDENCY_ERROR"

def test_result_comparator_metrics():
    """Asserts that ResultComparator identifies improvements or regressions correctly"""
    current_stdout = "========================= 3 passed, 1 failed in 0.5s =========================\n"
    prev_stdout = "========================= 2 passed, 2 failed in 0.5s =========================\n"
    
    comp = ResultComparator.compare_results(current_stdout, "", prev_stdout, "")
    assert comp["passed_diff"] == 1
    assert comp["failed_diff"] == -1
    assert comp["is_improvement"] is True
    assert comp["is_regression"] is False

    # Simulate Regression: failures increased
    regress_stdout = "========================= 1 passed, 3 failed in 0.5s =========================\n"
    comp_reg = ResultComparator.compare_results(regress_stdout, "", prev_stdout, "")
    assert comp_reg["passed_diff"] == -1
    assert comp_reg["failed_diff"] == 1
    assert comp_reg["is_regression"] is True

def test_iterations_manager_lifecycle():
    """Verifies creation and transition states of DevelopmentIteration database rows"""
    db = SessionLocal()
    try:
        # Start iteration
        goal_text = "Implement transactional locks for vehicle booking"
        iteration = IterationManager.start_iteration("P001", "run-mock-123", goal_text, 1, db=db)
        assert iteration.status == "PLANNED"
        assert iteration.goal == goal_text
        assert iteration.iteration_number == 1
        
        # Transition state
        updated = IterationManager.transition_iteration(iteration.id, "TESTING", db=db)
        assert updated.status == "TESTING"
        
        # Terminate
        completed = IterationManager.transition_iteration(iteration.id, "COMPLETED", db=db)
        assert completed.status == "COMPLETED"
        assert completed.completed_at is not None
        
        db.delete(completed)
        db.commit()
    finally:
        db.close()

def test_artifact_versioning_and_patching():
    """Verifies that patch modifications derive increments in version counter without mutating parent files"""
    db = SessionLocal()
    try:
        # Create base artifact version V1
        initial_files = {"app.py": "print('hello v1')"}
        art_v1 = ArtifactVersion(
            id="art-v1-mock",
            version=1,
            project_id="P001",
            files=json.dumps(initial_files),
            created_by_agent="DEVELOPER"
        )
        db.add(art_v1)
        db.commit()

        # Apply patch to derive V2
        art_v2 = FixManager.apply_patch_to_artifact(
            project_id="P001",
            task_id="task-mock-123",
            parent_artifact_id="art-v1-mock",
            changed_files={"main.py": "print('hello v2')"},
            change_summary="Added main entrypoint.",
            created_by_agent="DEVELOPER",
            db=db
        )

        assert art_v2.version == 2
        assert art_v2.parent_artifact_id == "art-v1-mock"
        
        files_v2 = json.loads(art_v2.files)
        assert "app.py" in files_v2
        assert "main.py" in files_v2
        assert files_v2["app.py"] == "print('hello v1')"
        assert files_v2["main.py"] == "print('hello v2')"

        db.delete(art_v2)
        db.delete(art_v1)
        db.commit()
    finally:
        db.close()

def test_repeated_failure_loops():
    """Verifies repeated identical tracebacks are recognized to stop runaway executions"""
    db = SessionLocal()
    try:
        # Add 3 mock iterations with same failure message
        err = "sqlite3.OperationalError: database is locked"
        it1 = DevelopmentIteration(id="it-mock-1", project_id="P001", workflow_run_id="run-loop-mock", iteration_number=1, goal="test", status="FAILED", failure_summary=err)
        it2 = DevelopmentIteration(id="it-mock-2", project_id="P001", workflow_run_id="run-loop-mock", iteration_number=2, goal="test", status="FAILED", failure_summary=err)
        it3 = DevelopmentIteration(id="it-mock-3", project_id="P001", workflow_run_id="run-loop-mock", iteration_number=3, goal="test", status="FAILED", failure_summary=err)
        
        db.add(it1)
        db.add(it2)
        db.add(it3)
        db.commit()

        is_repeated = DevelopmentLoopController.detect_repeated_failure("run-loop-mock", db)
        assert is_repeated is True

        db.delete(it1)
        db.delete(it2)
        db.delete(it3)
        db.commit()
    finally:
        db.close()

def test_autonomy_policy_limits():
    """Verifies loop state constraints halt workflow when thresholds are violated"""
    db = SessionLocal()
    try:
        # Setup temporary policy for project P001
        policy = db.query(AutonomyPolicy).filter(AutonomyPolicy.project_id == "P001").first()
        old_level = policy.level if policy else 1
        
        # Override policy constraints
        if not policy:
            policy = AutonomyPolicy(project_id="P001", level=1, max_iterations=2)
            db.add(policy)
        else:
            policy.max_iterations = 2
        db.commit()

        # Mock 2 iterations
        it1 = DevelopmentIteration(id="it-lim-1", project_id="P001", workflow_run_id="run-lim-mock", iteration_number=1, goal="test", status="FAILED")
        it2 = DevelopmentIteration(id="it-lim-2", project_id="P001", workflow_run_id="run-lim-mock", iteration_number=2, goal="test", status="FAILED")
        db.add(it1)
        db.add(it2)
        db.commit()

        # Assertion: checks if limit is correctly flagged
        allowed, reason = DevelopmentLoopController.check_limits("P001", "run-lim-mock", db)
        assert allowed is False
        assert reason == "MAX_ITERATIONS_REACHED"

        # Restore
        policy.max_iterations = 5
        db.delete(it1)
        db.delete(it2)
        db.commit()
    finally:
        db.close()

def test_success_evaluator_validation():
    """Asserts SuccessEvaluator identifies success states correctly"""
    db = SessionLocal()
    try:
        from app.autonomous.success_evaluator import SuccessEvaluator
        from app.models.sandbox import Execution, ExecutionResult
        from app.models.test_result import TestResult

        # Mock success execution
        exec_id = "exec-test-success"
        db_exec = Execution(id=exec_id, project_id="P001", task_id="task-test-success", language="python", status="SUCCESS", entrypoint="main.py")
        db_res = ExecutionResult(execution_id=exec_id, exit_code=0, stdout="All passed", stderr="", timed_out=False, resource_limited=False)
        db.add(db_exec)
        db.add(db_res)
        
        # Add a passing test
        db_test = TestResult(id="tr-test-succ", project_id="P001", task_id="task-test-success", name="test_sample", status="PASSED")
        db.add(db_test)
        db.commit()

        is_success, reason = SuccessEvaluator.evaluate_success("P001", exec_id, "task-test-success", db)
        assert is_success is True
        assert reason == "ALL_TESTS_PASSED"

        # Cleanup
        db.delete(db_test)
        db.delete(db_res)
        db.delete(db_exec)
        db.commit()
    finally:
        db.close()

def test_api_timeline_and_rollback():
    """Tests the rollback and timeline endpoints directly via API Client"""
    from datetime import datetime
    # Verify timeline retrieval returns nodes
    response = client.get("/api/autonomous/run-lim-mock/timeline")
    assert response.status_code == 404 # run not found (mock)

    # Let's seed a workflow run to test timeline
    db = SessionLocal()
    try:
        from app.models.orchestration import WorkflowRun
        
        run_id = "run-test-timeline-123"
        db_run = WorkflowRun(
            id=run_id,
            project_id="P001",
            status="RUNNING",
            current_state="DEVELOPMENT",
            started_at=datetime.utcnow()
        )
        db.add(db_run)
        db.commit()

        # Call timeline endpoint
        resp = client.get(f"/api/autonomous/{run_id}/timeline")
        assert resp.status_code == 200
        data = resp.json()
        assert data["run_id"] == run_id
        assert len(data["nodes"]) >= 1
        assert data["nodes"][0]["state"] == "CREATED"

        # Seed an artifact version to test rollback
        art_id = "art-test-rollback-v1"
        art_v1 = ArtifactVersion(
            id=art_id,
            version=1,
            project_id="P001",
            files=json.dumps({"app.py": "print('v1')"}),
            created_by_agent="DEVELOPER"
        )
        db.add(art_v1)
        db.commit()

        # Call rollback endpoint
        rollback_resp = client.post(
            f"/api/autonomous/{run_id}/rollback",
            json={"artifact_id": art_id}
        )
        assert rollback_resp.status_code == 200
        rollback_data = rollback_resp.json()
        assert rollback_data["status"] == "SUCCESS"
        assert rollback_data["new_artifact_id"] is not None

        # Clean up seeded objects
        from app.models.task import Task
        db.query(Task).filter(Task.workflow_run_id == run_id).delete()
        db.query(DevelopmentIteration).filter(DevelopmentIteration.workflow_run_id == run_id).delete()
        db.query(ArtifactVersion).filter(ArtifactVersion.project_id == "P001").delete()
        db.delete(db_run)
        db.commit()
    finally:
        db.close()
