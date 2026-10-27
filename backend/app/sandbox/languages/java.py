import os
from typing import List, Dict, Tuple
from .base import LanguageRuntime
from ..validators import validate_execution_files

class JavaRuntime(LanguageRuntime):
    def validate(self, files: List[Dict[str, str]], entrypoint: str) -> Tuple[bool, str]:
        if not validate_execution_files(files):
            return False, "File structure violates security limits (oversized files or directory traversal)."
            
        has_entrypoint = any(f.get("path") == entrypoint for f in files)
        if not has_entrypoint:
            return False, f"Entrypoint file not found: {entrypoint}"
            
        if not entrypoint.endswith(".java"):
            return False, "Entrypoint must be a Java (.java) class file."
            
        return True, ""

    def prepare(self, workspace_path: str, files: List[Dict[str, str]]) -> None:
        for f in files:
            target_path = os.path.join(workspace_path, f["path"])
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            with open(target_path, "w", encoding="utf-8") as out:
                out.write(f["content"])

    def get_run_command(self, entrypoint: str, test_command: str = None) -> List[str]:
        if test_command:
            return test_command.split()
            
        # For Java compiling and running, we run javac first, then java.
        # To make it fit within a single command list execution block in the adapter,
        # we can build a compilation compile script command sequence or javac followed by java command wrapper.
        # But wait, running standard java classes is javac entrypoint.java && java entrypoint
        # We can construct a wrapper command sequence: ["java", entrypoint] after compiling in preparation step!
        return ["java", entrypoint]

    def get_docker_image(self) -> str:
        return "openjdk:17-alpine"
