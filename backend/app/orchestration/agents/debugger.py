from .base import BaseAgent, AgentRequest, AgentResult
from ...ai.gateway import AIGateway
from ...ai.schemas.analysis import BugAnalysisSchema
from ...ai.prompts.debugging import BUG_ANALYSIS_PROMPT_V1
from ...ai.prompts.system import BASE_SYSTEM_PROMPT_V1

class DebuggerAgent(BaseAgent):
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        gateway = AIGateway()
        
        error_message = request.context.get("error_message", "OperationalError: database is locked")
        stack_trace = request.context.get("stack_trace", "Traceback info...")
        code = request.context.get("code", "")
        task_info = request.context.get("task_info", "Debugging concurrency deadlock")
        
        prompt = BUG_ANALYSIS_PROMPT_V1.format(
            error_message=error_message,
            stack_trace=stack_trace,
            code=code,
            task_info=task_info
        )
        
        res = await gateway.generate(
            project_id=request.project_id,
            task_type="debugging",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Debugger",
            response_schema=BugAnalysisSchema,
            db_session=db_session
        )
        
        return AgentResult(
            status="completed",
            summary=f"Debugger analyzed the crash. Isolated root cause: {res.get('probable_root_cause')}.",
            output=res,
            next_action="developer"
        )
