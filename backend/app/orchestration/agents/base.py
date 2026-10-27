from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Dict, Any, Optional

class AgentRequest(BaseModel):
    project_id: str
    task_id: str
    agent_role: str
    objective: str
    context: Dict[str, Any]

class AgentResult(BaseModel):
    status: str  # "completed", "failed", "requires_human"
    summary: str
    output: Dict[str, Any]
    next_action: str
    requires_human: bool = False

class BaseAgent(ABC):
    @abstractmethod
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        """
        Executes the agent logic.
        Communicates with the AI Gateway and returns an AgentResult.
        """
        pass
