from typing import List, Optional

# Approved runtime executors only
ALLOWED_RUNTIMES = ["python", "node", "java", "javac"]

# Allowed test commands only (predefined trusted triggers)
ALLOWED_TEST_RUNNERS = {
    "python": ["python -m pytest", "pytest"],
    "javascript": ["npm test", "node test.js"],
    "java": ["mvn test", "gradle test"]
}

def validate_command(language: str, command: str) -> bool:
    """
    Prevents injection of arbitrary commands (like rm, reboot, pipelines).
    Only permits approved test runners or simple script executions.
    """
    cmd_stripped = command.strip()
    
    # 1. Block command concatenation/piping
    for separator in [";", "&&", "||", "|", "`", "$"]:
        if separator in cmd_stripped:
            return False
            
    # 2. Match against allowed runners list
    allowed_runners = ALLOWED_TEST_RUNNERS.get(language.lower(), [])
    for runner in allowed_runners:
        if cmd_stripped.startswith(runner):
            return True
            
    # 3. Allow simple exact file executions
    if language == "python" and (cmd_stripped.startswith("python ") or cmd_stripped.startswith("python3 ")):
        return True
    if language == "javascript" and cmd_stripped.startswith("node "):
        return True
    if language == "java" and (cmd_stripped.startswith("java ") or cmd_stripped.startswith("javac ")):
        return True
        
    return False

def get_network_disabled_args(use_docker: bool) -> List[str]:
    """Returns sandbox-specific networking isolation arguments"""
    if use_docker:
        return ["--network", "none"]
    return []
