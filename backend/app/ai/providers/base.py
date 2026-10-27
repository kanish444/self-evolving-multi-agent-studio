from abc import ABC, abstractmethod
from typing import Optional, Any

class AIProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: str,
        response_schema: Optional[Any] = None,
        temperature: float = 0.2,
        max_tokens: int = 4096,
        timeout: float = 30.0
    ) -> dict:
        """
        Sends request to LLM and returns structured JSON output.
        Returns dict matching response_schema if specified, or parsed raw JSON.
        """
        pass

    @abstractmethod
    async def health_check(self) -> dict:
        """
        Check connectivity and availability status of the LLM provider.
        """
        pass
