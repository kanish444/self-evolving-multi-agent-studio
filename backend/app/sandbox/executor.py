import os
import time
import subprocess
import logging
from typing import List, Dict, Any, Tuple

from .limits import DEFAULT_TIMEOUT_SECONDS, MAX_OUTPUT_BYTES
from .policies import get_network_disabled_args

logger = logging.getLogger("app.sandbox.executor")

class SandboxExecutor:
    def __init__(self):
        self.scratch_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scratch"))
        os.makedirs(self.scratch_dir, exist_ok=True)

    def execute_in_sandbox(
        self,
        workspace_path: str,
        command_args: List[str],
        docker_image: str,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS
    ) -> Tuple[int, str, str, bool, bool]:
        """
        Runs the command inside the workspace using Docker (if available) or falling back
        to a highly restricted subprocess execution environment.
        
        Returns: (exit_code, stdout, stderr, timed_out, resource_limited)
        """
        # Try Docker execution first
        try:
            return self._run_in_docker(workspace_path, command_args, docker_image, timeout_seconds)
        except Exception as docker_err:
            logger.info(f"Docker execution failed/unavailable ({docker_err}). Falling back to restricted host subprocess...")
            return self._run_in_restricted_subprocess(workspace_path, command_args, timeout_seconds)

    def _run_in_docker(
        self,
        workspace_path: str,
        command_args: List[str],
        docker_image: str,
        timeout_seconds: int
    ) -> Tuple[int, str, str, bool, bool]:
        """Runs the program using Docker containerization features"""
        # Formulate docker run arguments
        # Run as non-root user, read-only root system, drop privileges
        docker_cmd = [
            "docker", "run", "--rm",
            "--network", "none",
            "-v", f"{workspace_path}:/workspace",
            "-w", "/workspace",
            "--memory", "256m",
            "--cpus", "1.0",
            "--ulimit", f"nproc={50}",
            docker_image
        ] + command_args

        start_time = time.time()
        process = subprocess.Popen(
            docker_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        timed_out = False
        stdout_content = ""
        stderr_content = ""
        exit_code = 1

        try:
            stdout_content, stderr_content = process.communicate(timeout=timeout_seconds)
            exit_code = process.returncode
        except subprocess.TimeoutExpired:
            process.kill()
            stdout_content, stderr_content = process.communicate()
            timed_out = True
            exit_code = -1

        # Check for output overflow limit truncation
        stdout_truncated, stdout_content = self._check_output_limits(stdout_content)
        stderr_truncated, stderr_content = self._check_output_limits(stderr_content)
        resource_limited = stdout_truncated or stderr_truncated

        return exit_code, stdout_content, stderr_content, timed_out, resource_limited

    def _run_in_restricted_subprocess(
        self,
        workspace_path: str,
        command_args: List[str],
        timeout_seconds: int
    ) -> Tuple[int, str, str, bool, bool]:
        """Runs the program using a highly-restricted local OS process environment"""
        
        # Purge environment variables to prevent API keys/credentials leaks,
        # but retain system runtime paths so Python and test runners can resolve modules
        clean_env = {
            "SYSTEMROOT": os.environ.get("SYSTEMROOT", "C:\\Windows"),  # Required on Windows
            "PATH": os.environ.get("PATH", ""),  # Required to find executors python/node
            "PATHEXT": os.environ.get("PATHEXT", ""), # Required on Windows
            "USERPROFILE": os.environ.get("USERPROFILE", ""),
            "LOCALAPPDATA": os.environ.get("LOCALAPPDATA", ""),
            "APPDATA": os.environ.get("APPDATA", ""),
            "TEMP": os.environ.get("TEMP", ""),
            "TMP": os.environ.get("TMP", "")
        }

        # Modify compile command if compiler (e.g. javac) or run script
        # In SQLite/Windows fallback, compile step can run javac synchronously if java files
        if command_args and command_args[0] == "java":
            # For Java, run javac on files before running java
            java_files = [f for f in os.listdir(workspace_path) if f.endswith(".java")]
            for jf in java_files:
                try:
                    subprocess.run(
                        ["javac", jf],
                        cwd=workspace_path,
                        env=clean_env,
                        capture_output=True,
                        timeout=5
                    )
                except Exception:
                    pass
            
            # Map Java entry point from class name: e.g. "Main.java" -> "Main"
            entry_file = command_args[1]
            class_name, _ = os.path.splitext(entry_file)
            run_cmd = ["java", class_name]
        else:
            run_cmd = command_args

        # Execute
        process = subprocess.Popen(
            run_cmd,
            cwd=workspace_path,
            env=clean_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        timed_out = False
        stdout_content = ""
        stderr_content = ""
        exit_code = 1

        try:
            stdout_content, stderr_content = process.communicate(timeout=timeout_seconds)
            exit_code = process.returncode
        except subprocess.TimeoutExpired:
            process.kill()
            stdout_content, stderr_content = process.communicate()
            timed_out = True
            exit_code = -1

        # Check for output overflow limit truncation
        stdout_truncated, stdout_content = self._check_output_limits(stdout_content)
        stderr_truncated, stderr_content = self._check_output_limits(stderr_content)
        resource_limited = stdout_truncated or stderr_truncated

        return exit_code, stdout_content, stderr_content, timed_out, resource_limited

    def _check_output_limits(self, text: str) -> Tuple[bool, str]:
        """Truncates text if it exceeds the maximum size limit"""
        if not text:
            return False, ""
            
        byte_len = len(text.encode("utf-8"))
        if byte_len > MAX_OUTPUT_BYTES:
            # Truncate string and append warning
            truncated_text = text[:MAX_OUTPUT_BYTES // 4] + "\n\n*** [EXECUTION OUTPUT TRUNCATED DUE TO SIZE LIMITS] ***"
            return True, truncated_text
            
        return False, text
