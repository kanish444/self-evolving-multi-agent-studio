import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from typing import Optional

from ..core.config import settings
from ..core.database import get_db
from ..models.memory import Memory
from ..models.project import Project
from ..ai.gateway import AIGateway
from ..ai.prompts import (
    BASE_SYSTEM_PROMPT_V1,
    REQUIREMENT_ANALYSIS_PROMPT_V1,
    PROJECT_PLANNING_PROMPT_V1,
    ARCHITECTURE_ANALYSIS_PROMPT_V1,
    CODE_GENERATION_PROMPT_V1,
    CODE_EXPLANATION_PROMPT_V1,
    CODE_REVIEW_PROMPT_V1,
    TEST_GENERATION_PROMPT_V1,
    BUG_ANALYSIS_PROMPT_V1,
    EVOLUTION_ANALYSIS_PROMPT_V1,
    MEMORY_SUMMARIZATION_PROMPT_V1
)
from ..ai.schemas.analysis import (
    RequirementAnalysisRequest, RequirementAnalysisSchema,
    ProjectPlanRequest, ProjectPlanSchema,
    ArchitectureAnalysisRequest, ArchitectureAnalysisSchema,
    CodeGenerationRequest, CodeGenerationSchema,
    CodeExplanationRequest, CodeExplanationSchema,
    TestGenerationRequest, TestGenerationSchema,
    BugAnalysisRequest, BugAnalysisSchema,
    CodeReviewRequest, CodeReviewSchema,
    EvolutionAnalysisRequest, EvolutionAnalysisSchema,
    MemorySummarizeRequest, MemorySummarizationSchema
)

logger = logging.getLogger("app.api.ai")
router = APIRouter(prefix="/ai", tags=["ai"])

def get_trace_headers(
    x_trace_id: Optional[str] = Header(None, alias="X-Trace-Id"),
    x_correlation_id: Optional[str] = Header(None, alias="X-Correlation-Id")
):
    """
    HTTP Header Dependency to extract or generate trace/correlation IDs.
    Matches the existing Phase 8 observability trace design.
    """
    return {
        "trace_id": x_trace_id or f"trace_10_{uuid.uuid4().hex[:8]}",
        "correlation_id": x_correlation_id or f"corr_10_{uuid.uuid4().hex[:8]}"
    }

def fetch_memory_context(project_id: str, db: Session) -> str:
    """
    Reads existing cognitive memories from the database to inject as context.
    Prevents unrestricted memory dumps by taking the latest 5 verified items.
    """
    memories = db.query(Memory).filter(
        Memory.project_id == project_id,
        Memory.status == "Verified"
    ).order_by(Memory.created_at.desc()).limit(5).all()
    
    if not memories:
        return "No relevant memories found in the Cognitive Memory Store."
        
    context_lines = []
    for m in memories:
        context_lines.append(f"- Category: {m.category}\n  Title: {m.title}\n  Lesson: {m.content}\n  Tags: {m.tags or 'none'}")
    return "\n\n".join(context_lines)


@router.get("/health")
async def ai_health(db: Session = Depends(get_db)):
    """
    Returns AI provider connection state and default model config.
    Safe and never exposes private credentials.
    """
    try:
        gateway = AIGateway()
        check = await gateway.provider.health_check()
        return {
            "provider": check["provider"],
            "model": check["model"],
            "configuration_status": "configured" if settings.GEMINI_API_KEY else "simulation_mode",
            "availability": check["status"] in ("ok", "warning")
        }
    except Exception as e:
        logger.error(f"AI Gateway health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI Gateway unavailable: {str(e)}"
        )


@router.post("/analyze-requirement", response_model=RequirementAnalysisSchema)
async def analyze_requirement(
    req: RequirementAnalysisRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    # Verify project exists
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    gateway = AIGateway()
    prompt = REQUIREMENT_ANALYSIS_PROMPT_V1.format(
        project_id=req.project_id,
        requirement=req.requirement
    )

    try:
        return await gateway.generate(
            project_id=req.project_id,
            task_type="REQUIREMENT_ANALYSIS",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="PM",
            response_schema=RequirementAnalysisSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            db_session=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Requirement analysis failed: {str(e)}")


@router.post("/create-plan", response_model=ProjectPlanSchema)
async def create_plan(
    req: ProjectPlanRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    gateway = AIGateway()
    prompt = PROJECT_PLANNING_PROMPT_V1.format(
        project_id=req.project_id,
        requirement=req.requirement
    )

    try:
        return await gateway.generate(
            project_id=req.project_id,
            task_type="PROJECT_PLANNING",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="PM",
            response_schema=ProjectPlanSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            db_session=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project planning failed: {str(e)}")


@router.post("/analyze-architecture", response_model=ArchitectureAnalysisSchema)
async def analyze_architecture(
    req: ArchitectureAnalysisRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    gateway = AIGateway()
    prompt = ARCHITECTURE_ANALYSIS_PROMPT_V1.format(
        project_id=req.project_id,
        requirement=req.requirement
    )

    try:
        return await gateway.generate(
            project_id=req.project_id,
            task_type="ARCHITECTURE_ANALYSIS",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="PM",
            response_schema=ArchitectureAnalysisSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            db_session=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Architecture analysis failed: {str(e)}")


@router.post("/generate-code", response_model=CodeGenerationSchema)
async def generate_code(
    req: CodeGenerationRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Read relevant cognitive memories for context injector
    memories_str = fetch_memory_context(req.project_id, db)
    goals_with_memories = f"{req.requirements}\n\n[Cognitive Memory context entries]:\n{memories_str}"

    gateway = AIGateway()
    prompt = CODE_GENERATION_PROMPT_V1.format(
        project_id=req.project_id,
        task_id=req.task_id,
        language=req.language,
        framework=req.framework,
        requirements=goals_with_memories
    )

    try:
        return await gateway.generate(
            project_id=req.project_id,
            task_type="CODE_GENERATION",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Developer",
            response_schema=CodeGenerationSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            task_id=req.task_id,
            db_session=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")


@router.post("/explain-code", response_model=CodeExplanationSchema)
async def explain_code(
    req: CodeExplanationRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    gateway = AIGateway()
    prompt = CODE_EXPLANATION_PROMPT_V1.format(
        language=req.language,
        code=req.code,
        context=req.context
    )

    try:
        return await gateway.generate(
            project_id=req.project_id or "P001",
            task_type="CODE_EXPLANATION",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Developer",
            response_schema=CodeExplanationSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            db_session=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code explanation failed: {str(e)}")


@router.post("/generate-tests", response_model=TestGenerationSchema)
async def generate_tests(
    req: TestGenerationRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    gateway = AIGateway()
    prompt = TEST_GENERATION_PROMPT_V1.format(
        requirements=req.requirements,
        task_description=req.task_description,
        code=req.code
    )

    try:
        return await gateway.generate(
            project_id=req.project_id or "P001",
            task_type="TEST_GENERATION",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Tester",
            response_schema=TestGenerationSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            db_session=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test case generation failed: {str(e)}")


@router.post("/analyze-bug", response_model=BugAnalysisSchema)
async def analyze_bug(
    req: BugAnalysisRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    # Retrieve cognitive memories for context enrichment during bug isolating
    memories_str = fetch_memory_context(req.project_id or "P001", db)
    task_info_with_memories = f"{req.task_info}\n\n[Cognitive Memory context entries]:\n{memories_str}"

    gateway = AIGateway()
    prompt = BUG_ANALYSIS_PROMPT_V1.format(
        error_message=req.error_message,
        stack_trace=req.stack_trace,
        code=req.code,
        task_info=task_info_with_memories
    )

    try:
        return await gateway.generate(
            project_id=req.project_id or "P001",
            task_type="BUG_ANALYSIS",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Debugger",
            response_schema=BugAnalysisSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            db_session=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bug analysis failed: {str(e)}")


@router.post("/review-code", response_model=CodeReviewSchema)
async def review_code(
    req: CodeReviewRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    gateway = AIGateway()
    prompt = CODE_REVIEW_PROMPT_V1.format(code=req.code)

    try:
        return await gateway.generate(
            project_id=req.project_id or "P001",
            task_type="CODE_REVIEW",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Reviewer",
            response_schema=CodeReviewSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            db_session=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code review failed: {str(e)}")


@router.post("/analyze-evolution", response_model=EvolutionAnalysisSchema)
async def analyze_evolution(
    req: EvolutionAnalysisRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    gateway = AIGateway()
    prompt = EVOLUTION_ANALYSIS_PROMPT_V1.format(
        project_id=req.project_id,
        iteration_id=req.iteration_id,
        test_results=req.test_results,
        bugs=req.bugs,
        fixes=req.fixes,
        review_results=req.review_results
    )

    try:
        return await gateway.generate(
            project_id=req.project_id,
            task_type="EVOLUTION_ANALYSIS",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Evolution",
            response_schema=EvolutionAnalysisSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            iteration_id=req.iteration_id,
            db_session=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evolution analysis failed: {str(e)}")


@router.post("/summarize-memory", response_model=MemorySummarizationSchema)
async def summarize_memory(
    req: MemorySummarizeRequest,
    db: Session = Depends(get_db),
    trace: dict = Depends(get_trace_headers)
):
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    gateway = AIGateway()
    prompt = MEMORY_SUMMARIZATION_PROMPT_V1.format(
        problem=req.problem,
        cause=req.cause,
        solution=req.solution,
        learning=req.learning,
        context=req.context
    )

    try:
        summary_data = await gateway.generate(
            project_id=req.project_id,
            task_type="MEMORY_SUMMARIZATION",
            prompt=prompt,
            system_prompt=BASE_SYSTEM_PROMPT_V1,
            agent_role="Memory",
            response_schema=MemorySummarizationSchema,
            trace_id=trace["trace_id"],
            correlation_id=trace["correlation_id"],
            db_session=db
        )

        # Automatically store the validated result through the Memory DB model
        memory_id = f"mem-{uuid.uuid4().hex[:8]}"
        new_memory = Memory(
            id=memory_id,
            project_id=req.project_id,
            category="CODING",  # Default category
            title=f"AI Summarized Learning: {summary_data['problem'][:50]}...",
            content=f"Problem: {summary_data['problem']}\nCause: {summary_data['cause']}\nSolution: {summary_data['solution']}\nLearning: {summary_data['learning']}",
            source="Memory Agent",
            confidence=summary_data['confidence'],
            importance="High",
            status="Verified",
            tags=req.context
        )
        db.add(new_memory)
        db.commit()

        return summary_data
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Memory summarization failed: {str(e)}")
