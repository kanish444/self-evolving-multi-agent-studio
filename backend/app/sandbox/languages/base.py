from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple

class LanguageRuntime(ABC):
    @abstractmethod
    def validate(self, files: List[Dict[str, str]], entrypoint: str) -> Tuple[bool, str]:
        """Validates run files and settings. Returns (is_valid, error_message)"""
        pass

    @abstractmethod
    def prepare(self, workspace_path: str, files: List[Dict[str, str]]) -> None:
        """Copies scripts into workspace folders"""
        pass

    @abstractmethod
    def get_run_command(self, entrypoint: str, test_command: str = None) -> List[str]:
        """Builds command parameters to execute"""
        pass

    @abstractmethod
    def get_docker_image(self) -> str:
        """Returns pinned container image tag"""
        pass
