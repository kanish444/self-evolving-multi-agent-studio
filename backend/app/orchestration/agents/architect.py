from .base import BaseAgent, AgentRequest, AgentResult
from ...ai.gateway import AIGateway
from ...ai.schemas.analysis import ArchitectureAnalysisSchema
from ...ai.prompts.architecture import ARCHITECTURE_ANALYSIS_PROMPT_V1
from ...ai.prompts.system import BASE_SYSTEM_PROMPT_V1

class ArchitectAgent(BaseAgent):
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        gateway = AIGateway()
        requirement = request.context.get("requirement", "")
        
        prompt = ARCHITECTURE_ANALYSIS_PROMPT_V1.format(
            project_id=request.project_id,
            requirement=requirement
        )
        
        res = await gateway.generate(
            project_id=request.project_id,
            task_type="architecture",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Architect",
            response_schema=ArchitectureAnalysisSchema,
            db_session=db_session
        )
        
        # Requires human check before proceeding to development!
        return AgentResult(
            status="completed",
            summary="Suggested software architecture guidelines, components layout, and database requirements.",
            output=res,
            next_action="human_approval",
            requires_human=True
        )
