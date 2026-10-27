import uuid
from .base import BaseAgent, AgentRequest, AgentResult
from ...ai.gateway import AIGateway
from ...ai.schemas.analysis import EvolutionAnalysisSchema, MemorySummarizationSchema
from ...ai.prompts.evolution import EVOLUTION_ANALYSIS_PROMPT_V1, MEMORY_SUMMARIZATION_PROMPT_V1
from ...ai.prompts.system import BASE_SYSTEM_PROMPT_V1
from ...models.memory import Memory

class EvolutionAgent(BaseAgent):
    async def execute(self, request: AgentRequest, db_session) -> AgentResult:
        gateway = AIGateway()
        
        iteration_id = request.context.get("iteration_id", "it-P001-3")
        test_results = request.context.get("test_results", "All assertions passed.")
        bugs = request.context.get("bugs", "Deadlock on SQLite writes.")
        fixes = request.context.get("fixes", "Added transaction retry decorators.")
        review_results = request.context.get("review_results", "Clean code review rating.")
        
        # 1. Analyze evolution telemetry
        prompt = EVOLUTION_ANALYSIS_PROMPT_V1.format(
            project_id=request.project_id,
            iteration_id=iteration_id,
            test_results=test_results,
            bugs=bugs,
            fixes=fixes,
            review_results=review_results
        )
        
        res = await gateway.generate(
            project_id=request.project_id,
            task_type="evolution",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Evolution",
            response_schema=EvolutionAnalysisSchema,
            db_session=db_session
        )
        
        # 2. Synthesize structured memory card
        mem_prompt = MEMORY_SUMMARIZATION_PROMPT_V1.format(
            problem=res.get("what_went_wrong", "Concurrency write limits"),
            cause="SQLite lacking native concurrent write capabilities under load",
            solution=res.get("what_was_fixed", "Retry wrapper logic"),
            learning=res.get("potential_reusable_learning", "SQLite needs transaction serialization queue or backoff retry wrappers."),
            context="SQLite, Concurrency, Database"
        )
        
        mem_res = await gateway.generate(
            project_id=request.project_id,
            task_type="memory",
            prompt=mem_prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Evolution",
            response_schema=MemorySummarizationSchema,
            db_session=db_session
        )
        
        # 3. Persist memory node directly in SQLite memories table
        mem_id = f"mem-{uuid.uuid4().hex[:8]}"
        db_memory = Memory(
            id=mem_id,
            project_id=request.project_id,
            category="WORKFLOW",
            title=f"Evolution Lesson: {res.get('pattern_discovered', 'Concurrency Check')[:50]}",
            content=f"Problem: {mem_res.get('problem')}\n\nCause: {mem_res.get('cause')}\n\nSolution: {mem_res.get('solution')}\n\nLearning: {mem_res.get('learning')}",
            source="EvolutionAgent",
            confidence=mem_res.get("confidence", 0.95),
            importance="High",
            status="Verified",
            tags="SQLite,Concurrency,Evolution",
            iteration="Iteration 03"
        )
        db_session.add(db_memory)
        db_session.commit()
        
        return AgentResult(
            status="completed",
            summary=f"Synthesized iteration optimization rule and saved cognitive memory card: {db_memory.title}.",
            output={
                "evolution": res,
                "memory_node_id": mem_id
            },
            next_action="completed"
        )
