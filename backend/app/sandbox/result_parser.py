import re
from typing import Dict, Any

def parse_test_results(stdout: str, stderr: str) -> Dict[str, Any]:
    """
    Parses console stdout/stderr test outputs from pytest or npm test.
    Extracts passed, failed, skipped, and total counts.
    """
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "skipped": 0,
        "errors": 0,
        "duration": "0s"
    }
    
    # 1. Match Pytest style: e.g. "== 1 failed, 2 passed, 3 skipped, 4 errors in 1.45s =="
    combined = stdout + "\n" + stderr
    pytest_summary_match = re.search(r'===\s*(.*?)\s*in\s+([\d.]+s)\s*===', combined)
    if pytest_summary_match:
        summary_text = pytest_summary_match.group(1)
        results["duration"] = pytest_summary_match.group(2)
        
        # Parse counts
        passed_m = re.search(r'(\d+)\s+passed', summary_text)
        failed_m = re.search(r'(\d+)\s+failed', summary_text)
        skipped_m = re.search(r'(\d+)\s+skipped', summary_text)
        errors_m = re.search(r'(\d+)\s+error', summary_text)
        
        if passed_m: results["passed"] = int(passed_m.group(1))
        if failed_m: results["failed"] = int(failed_m.group(1))
        if skipped_m: results["skipped"] = int(skipped_m.group(1))
        if errors_m: results["errors"] = int(errors_m.group(1))
        
        results["total"] = results["passed"] + results["failed"] + results["skipped"] + results["errors"]
        return results

    # 2. Match Jest/Npm style: e.g. "Tests:       2 passed, 2 total"
    jest_match = re.search(r'Tests:\s+(.*)', combined)
    if jest_match:
        jest_text = jest_match.group(1)
        passed_m = re.search(r'(\d+)\s+passed', jest_text)
        failed_m = re.search(r'(\d+)\s+failed', jest_text)
        skipped_m = re.search(r'(\d+)\s+skipped', jest_text)
        total_m = re.search(r'(\d+)\s+total', jest_text)
        
        if passed_m: results["passed"] = int(passed_m.group(1))
        if failed_m: results["failed"] = int(failed_m.group(1))
        if skipped_m: results["skipped"] = int(skipped_m.group(1))
        if total_m:
            results["total"] = int(total_m.group(1))
        else:
            results["total"] = results["passed"] + results["failed"] + results["skipped"]
            
        time_match = re.search(r'Time:\s+([\d.]+s)', combined)
        if time_match:
            results["duration"] = time_match.group(1)
            
        return results

    # 3. Simple Fallback - Count passed/failed keywords in the output
    pass_words = len(re.findall(r'(?i)\bpass\b|\bpassed\b|ok\b', combined))
    fail_words = len(re.findall(r'(?i)\bfail\b|\bfailed\b|error\b|exception\b', combined))
    
    if pass_words > 0 or fail_words > 0:
        results["passed"] = pass_words
        results["failed"] = fail_words
        results["total"] = pass_words + fail_words
        
    return results
