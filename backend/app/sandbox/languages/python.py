import os
from typing import List, Dict, Tuple
from .base import LanguageRuntime
from ..validators import validate_execution_files

class PythonRuntime(LanguageRuntime):
    def validate(self, files: List[Dict[str, str]], entrypoint: str) -> Tuple[bool, str]:
        if not validate_execution_files(files):
            return False, "File structure violates security limits (oversized files or directory traversal)."
            
        # Entrypoint check
        has_entrypoint = any(f.get("path") == entrypoint for f in files)
        if not has_entrypoint:
            return False, f"Entrypoint file not found: {entrypoint}"
            
        if not entrypoint.endswith(".py"):
            return False, "Entrypoint must be a Python (.py) file."
            
        return True, ""

    def prepare(self, workspace_path: str, files: List[Dict[str, str]]) -> None:
        for f in files:
            target_path = os.path.join(workspace_path, f["path"])
            # Create subdirs if needed
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            with open(target_path, "w", encoding="utf-8") as out:
                out.write(f["content"])

    def get_run_command(self, entrypoint: str, test_command: str = None) -> List[str]:
        if test_command:
            # Parse test command triggers
            cmd_args = test_command.split()
            # If the command starts with pytest or python -m pytest, map it
            if "pytest" in cmd_args:
                # E.g. pytest test_file.py
                return ["pytest", entrypoint] if entrypoint not in cmd_args else cmd_args
            return cmd_args
        return ["python", entrypoint]

    def get_docker_image(self) -> str:
        return "python:3.10-alpine"
