import re
from typing import Dict, Any

class FailureClassifier:
    @staticmethod
    def classify_failure(
        exit_code: int,
        stdout: str,
        stderr: str,
        timed_out: bool,
        resource_limited: bool
    ) -> str:
        """
        Analyses exit code, stdout, and stderr to classify the execution failure type.
        """
        if timed_out:
            return "TIMEOUT"
            
        if resource_limited:
            return "RESOURCE_LIMIT"
            
        combined = (stdout or "") + "\n" + (stderr or "")
        combined_lower = combined.lower()

        # 1. Security violations
        if "security" in combined_lower or "permission denied" in combined_lower or "blocked" in combined_lower:
            return "SECURITY_VIOLATION"

        # 2. Dependency errors
        if "modulenotfounderror" in combined_lower or "no module named" in combined_lower or "npm err! missing" in combined_lower:
            return "DEPENDENCY_ERROR"

        # 3. Code logic errors
        code_exceptions = [
            "syntaxerror", "nameerror", "typeerror", "operationalerror",
            "attributeerror", "indexerror", "keyerror", "zerodivisionerror",
            "nullpointerexception", "indentationerror", "unboundlocalerror"
        ]
        for exc in code_exceptions:
            if exc in combined_lower:
                return "CODE_ERROR"

        # 4. Standard assertions test failure
        if "assertionerror" in combined_lower or "assert" in combined_lower or "failed test" in combined_lower:
            return "TEST_FAILURE"

        # 5. Configuration errors
        if "configerror" in combined_lower or "setting" in combined_lower or "database configuration" in combined_lower:
            return "CONFIGURATION_ERROR"

        if exit_code != 0:
            return "CODE_ERROR"

        return "UNKNOWN"
