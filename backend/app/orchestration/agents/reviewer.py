from .base import BaseAgent, AgentRequest, AgentResult
from ...ai.gateway import AIGateway
from ...ai.schemas.analysis import CodeReviewSchema
from ...ai.prompts.coding import CODE_REVIEW_PROMPT_V1
from ...ai.prompts.system import BASE_SYSTEM_PROMPT_V1

class ReviewerAgent(BaseAgent):
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        gateway = AIGateway()
        code = request.context.get("code", "")
        
        prompt = CODE_REVIEW_PROMPT_V1.format(
            code=code
        )
        
        res = await gateway.generate(
            project_id=request.project_id,
            task_type="review",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Reviewer",
            response_schema=CodeReviewSchema,
            db_session=db_session
        )
        
        return AgentResult(
            status="completed",
            summary="Completed strict security and style review audit of the codebase components.",
            output=res,
            next_action="evolution"
        )
