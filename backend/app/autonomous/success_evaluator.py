import logging
from sqlalchemy.orm import Session
from ..models.sandbox import Execution
from ..models.test_result import TestResult
from .failure_classifier import FailureClassifier

logger = logging.getLogger(__name__)

class SuccessEvaluator:
    @staticmethod
    def evaluate_success(
        project_id: str,
        execution_id: str,
        task_id: str,
        db: Session
    ) -> tuple[bool, str]:
        """
        Evaluates the success of a development iteration run.
        Checks sandbox execution result, exit code, and pytest validation statuses.
        Returns (is_success, reason).
        """
        # 1. Retrieve execution
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if not execution:
            return False, "EXECUTION_NOT_FOUND"

        # 2. Check execution status
        if execution.status == "REJECTED":
            return False, "EXECUTION_REJECTED"
        if execution.status == "TIMEOUT":
            return False, "TIMEOUT"
        if execution.status == "RESOURCE_LIMIT":
            return False, "RESOURCE_LIMIT"

        # 3. Check execution result exit code and output
        res = execution.result
        if not res:
            return False, "EXECUTION_RESULT_MISSING"

        if res.timed_out:
            return False, "TIMEOUT"
        if res.resource_limited:
            return False, "RESOURCE_LIMIT"

        if res.exit_code != 0:
            # Classify what went wrong
            cls_type = FailureClassifier.classify_failure(
                res.exit_code, res.stdout, res.stderr, res.timed_out, res.resource_limited
            )
            return False, f"EXECUTION_FAILED: {cls_type}"

        # 4. Query test result validation items
        test_results = db.query(TestResult).filter(
            TestResult.project_id == project_id,
            TestResult.task_id == task_id
        ).all()

        if not test_results:
            # If no test results are recorded yet but exit_code is 0, we can assume execution succeeded
            return True, "EXECUTION_PASSED_NO_TESTS"

        # If any test failed, then the iteration is considered failed
        failed_tests = [t for t in test_results if t.status == "FAILED"]
        if failed_tests:
            return False, f"TEST_FAILURE: {failed_tests[0].name} failed"

        return True, "ALL_TESTS_PASSED"
