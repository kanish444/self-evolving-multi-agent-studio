from typing import Dict, Any, Optional
from ..sandbox.result_parser import parse_test_results

class ResultComparator:
    @staticmethod
    def compare_results(
        current_stdout: str,
        current_stderr: str,
        prev_stdout: Optional[str] = None,
        prev_stderr: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parses test counts for current and previous runs, returning improvement stats and regression alerts.
        """
        current_stats = parse_test_results(current_stdout or "", current_stderr or "")
        
        # Default fallback values if no prev run is given
        prev_stats = {
            "passed": 0,
            "failed": 0,
            "total": 0,
            "duration": "0s"
        }
        if prev_stdout or prev_stderr:
            prev_stats = parse_test_results(prev_stdout or "", prev_stderr or "")

        passed_diff = current_stats["passed"] - prev_stats["passed"]
        failed_diff = current_stats["failed"] - prev_stats["failed"]
        
        # Regression is detected if current run has MORE failures than previous run
        is_regression = (current_stats["failed"] > 0) and (failed_diff > 0)

        # Improvement is detected if we passed more tests, or failed fewer
        is_improvement = (passed_diff > 0) or (failed_diff < 0)

        return {
            "current": current_stats,
            "previous": prev_stats,
            "passed_diff": passed_diff,
            "failed_diff": failed_diff,
            "is_regression": is_regression,
            "is_improvement": is_improvement,
            "summary_message": f"Passed: {current_stats['passed']} ({'+' if passed_diff >= 0 else ''}{passed_diff}), Failed: {current_stats['failed']} ({'+' if failed_diff >= 0 else ''}{failed_diff})"
        }
