from .base import BaseAgent, AgentRequest, AgentResult
from ...ai.gateway import AIGateway
from ...ai.schemas.analysis import CodeGenerationSchema
from ...ai.prompts.coding import CODE_GENERATION_PROMPT_V1
from ...ai.prompts.system import BASE_SYSTEM_PROMPT_V1

class DeveloperAgent(BaseAgent):
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        gateway = AIGateway()
        
        language = request.context.get("language", "python")
        framework = request.context.get("framework", "fastapi")
        requirements = request.context.get("requirements", request.objective)
        
        prompt = CODE_GENERATION_PROMPT_V1.format(
            project_id=request.project_id,
            task_id=request.task_id,
            language=language,
            framework=framework,
            requirements=requirements
        )
        
        res = await gateway.generate(
            project_id=request.project_id,
            task_type="coding",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Developer",
            response_schema=CodeGenerationSchema,
            db_session=db_session
        )
        
        # Developer code proposal can also require human review before testing, or go straight to testing.
        # To make it robust, we'll mark next_action as human_approval and requires_human=True, 
        # allowing human to review code proposal.
        return AgentResult(
            status="completed",
            summary=f"Generated code block for target component: {res.get('file_path')}",
            output=res,
            next_action="human_approval",
            requires_human=True
        )
