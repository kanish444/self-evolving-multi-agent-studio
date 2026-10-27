from .base import BaseAgent, AgentRequest, AgentResult
from ...ai.gateway import AIGateway
from ...ai.schemas.analysis import RequirementAnalysisSchema, ProjectPlanSchema
from ...ai.prompts.requirements import REQUIREMENT_ANALYSIS_PROMPT_V1, PROJECT_PLANNING_PROMPT_V1
from ...ai.prompts.system import BASE_SYSTEM_PROMPT_V1

class ProjectManagerAgent(BaseAgent):
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        gateway = AIGateway()
        
        obj_lower = request.objective.lower()
        if "analyze" in obj_lower or "scope" in obj_lower or "decompose" in obj_lower:
            requirement = request.context.get("requirement", "")

            prompt = REQUIREMENT_ANALYSIS_PROMPT_V1.format(
                project_id=request.project_id,
                requirement=requirement
            )
            
            res = await gateway.generate(
                project_id=request.project_id,
                task_type="scoping",
                prompt=prompt,
                system_prompt=BASE_SYSTEM_PROMPT_V1,
                agent_role="PM",
                response_schema=RequirementAnalysisSchema,
                db_session=db_session
            )
            
            return AgentResult(
                status="completed",
                summary="Scoped project requirements and parameters.",
                output=res,
                next_action="planning"
            )
            
        elif "plan" in obj_lower or "module" in obj_lower or "task" in obj_lower:
            requirement = request.context.get("requirement", "")

            prompt = PROJECT_PLANNING_PROMPT_V1.format(
                project_id=request.project_id,
                requirement=requirement
            )
            
            res = await gateway.generate(
                project_id=request.project_id,
                task_type="planning",
                prompt=prompt,
                system_prompt=BASE_SYSTEM_PROMPT_V1,
                agent_role="PM",
                response_schema=ProjectPlanSchema,
                db_session=db_session
            )
            
            return AgentResult(
                status="completed",
                summary="Created step-by-step project plan with module assignments and tasks.",
                output=res,
                next_action="architecture"
            )

            
        else:
            return AgentResult(
                status="failed",
                summary=f"Unknown PM objective: {request.objective}",
                output={},
                next_action="idle"
            )
