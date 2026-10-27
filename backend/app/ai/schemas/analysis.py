from pydantic import BaseModel, Field
from typing import List, Optional

# --- REQUIREMENT ANALYSIS SCHEMAS ---
class RequirementAnalysisSchema(BaseModel):
    summary: str = Field(..., description="High-level description of the project requirement.")
    application_type: str = Field(..., description="Type of application, e.g., web_application, service, library.")
    target_users: List[str] = Field(..., description="Target user roles.")
    core_features: List[str] = Field(..., description="Main software features.")
    functional_requirements: List[str] = Field(..., description="Detailed functional requirements.")
    non_functional_requirements: List[str] = Field(..., description="Detailed performance, safety, and reliability constraints.")
    assumptions: List[str] = Field(..., description="Assumptions made about constraints or architecture.")
    risks: List[str] = Field(..., description="Identified technical or delivery risks.")

# --- PROJECT PLANNING SCHEMAS ---
class ModuleSchema(BaseModel):
    name: str = Field(..., description="Name of the software module.")
    description: str = Field(..., description="Description of the module responsibilities.")

class TaskPlanSchema(BaseModel):
    id: str = Field(..., description="Short task ID, e.g. T1, T2.")
    title: str = Field(..., description="Clear title of the task.")
    assigned_agent: str = Field(..., description="Assigned agent role, e.g. PM, Developer, Tester, Debugger.")
    status: str = Field("pending", description="Status of the task, e.g. pending, completed.")

class DependencySchema(BaseModel):
    task_id: str = Field(..., description="ID of the task that has dependencies.")
    depends_on: str = Field(..., description="ID of the task it depends on.")

class ProjectPlanSchema(BaseModel):
    project_goals: List[str] = Field(..., description="High level engineering goals.")
    modules: List[ModuleSchema] = Field(..., description="List of proposed application modules.")
    tasks: List[TaskPlanSchema] = Field(..., description="List of tasks to execute.")
    dependencies: List[DependencySchema] = Field(..., description="List of task dependencies.")
    suggested_order: List[str] = Field(..., description="List of task IDs in recommended execution order.")
    potential_risks: List[str] = Field(..., description="Risks identified during planning.")

# --- ARCHITECTURE ANALYSIS SCHEMAS ---
class ArchitectureAnalysisSchema(BaseModel):
    frontend: str = Field(..., description="Frontend architecture, frameworks, and state strategies.")
    backend: str = Field(..., description="Backend framework, structure, and design patterns.")
    database: str = Field(..., description="Database engine, connection pooling, and migration patterns.")
    authentication: str = Field(..., description="Authentication protocols and credentials storage design.")
    api_structure: str = Field(..., description="Base API endpoint routes structure description.")
    major_components: List[str] = Field(..., description="Major logical blocks of the system.")
    scalability_concerns: str = Field(..., description="Analysis of bottlenecks under stress workloads.")
    security_considerations: str = Field(..., description="Crucial security safeguards required.")

# --- CODE EXPLANATION SCHEMAS ---
class CodeExplanationSchema(BaseModel):
    summary: str = Field(..., description="High-level overview of the code module.")
    logic: str = Field(..., description="Step-by-step description of logical flow.")
    dependencies: List[str] = Field(..., description="Identified module dependencies.")
    potential_issues: str = Field(..., description="Bugs, performance bottlenecks, or edge cases.")
    suggested_improvements: str = Field(..., description="Refactoring or optimization recommendations.")

# --- TEST GENERATION SCHEMAS ---
class TestCaseSchema(BaseModel):
    test_name: str = Field(..., description="The unique name of the test case.")
    input: str = Field(..., description="The inputs or parameters triggered in the test.")
    expected_output: str = Field(..., description="The expected outcome or assertion value.")
    test_type: str = Field(..., description="Type of test, e.g. UNIT, INTEGRATION, STRESS.")
    priority: str = Field(..., description="Priority of the test case, e.g. HIGH, MEDIUM, LOW.")

class TestGenerationSchema(BaseModel):
    tests: List[TestCaseSchema] = Field(..., description="List of generated test cases.")

# --- BUG ANALYSIS SCHEMAS ---
class BugAnalysisSchema(BaseModel):
    error_summary: str = Field(..., description="Summary of the error message or crash event.")
    probable_root_cause: str = Field(..., description="Logical analysis of how the failure triggers.")
    affected_component: str = Field(..., description="File name, route, or function where fix is needed.")
    suggested_fix: str = Field(..., description="Detailed instructions or code snippet resolving the issue.")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0.")
    additional_investigation: str = Field(..., description="Any further traces or logs needed to verify completely.")

# --- CODE REVIEW SCHEMAS ---
class CodeReviewSchema(BaseModel):
    correctness: str = Field(..., description="Evaluation of functional logic and correctness.")
    readability: str = Field(..., description="Evaluation of code style, naming, and readability.")
    maintainability: str = Field(..., description="Evaluation of code modularity and structural patterns.")
    security: str = Field(..., description="Identified security flaws or input vulnerabilities.")
    performance: str = Field(..., description="Execution performance or memory usage considerations.")
    potential_bugs: str = Field(..., description="Any minor bugs, edge cases, or exception handling gaps.")
    architecture_consistency: str = Field(..., description="Consistency with the rest of the application stack.")

# --- EVOLUTION ANALYSIS SCHEMAS ---
class EvolutionAnalysisSchema(BaseModel):
    what_went_wrong: str = Field(..., description="Summary of failures or deadlocks encountered.")
    what_was_fixed: str = Field(..., description="Summary of adjustments and patches deployed.")
    pattern_discovered: str = Field(..., description="Core architectural pattern or constraint learned.")
    what_could_be_improved: str = Field(..., description="Further optimizations or refactor options.")
    potential_reusable_learning: str = Field(..., description="General rule formulated for the agent system.")

# --- MEMORY SUMMARIZATION SCHEMAS ---
class MemorySummarizationSchema(BaseModel):
    problem: str = Field(..., description="Engineering problem statement.")
    cause: str = Field(..., description="Technical cause of the problem.")
    solution: str = Field(..., description="The applied solution.")
    learning: str = Field(..., description="General engineering lesson learned.")
    context: str = Field(..., description="Context tags, iterations, or code files affected.")
    confidence: float = Field(..., description="Confidence index from 0.0 to 1.0.")

# --- CODE GENERATION SCHEMAS ---
class CodeGenerationSchema(BaseModel):
    file_path: str = Field(..., description="The recommended relative path of the file.")
    purpose: str = Field(..., description="Short explanation of the file's purpose.")
    code: str = Field(..., description="The complete generated source code. No truncated placeholder comments.")
    explanation: str = Field(..., description="Walkthrough of the code structure.")
    dependencies: List[str] = Field(..., description="Required libraries or package imports.")
    warnings: List[str] = Field(..., description="Potential side effects or implementation caveats.")

# --- REQUEST INPUT SCHEMAS ---
class RequirementAnalysisRequest(BaseModel):
    project_id: str
    requirement: str

class ProjectPlanRequest(BaseModel):
    project_id: str
    requirement: str

class ArchitectureAnalysisRequest(BaseModel):
    project_id: str
    requirement: str

class CodeGenerationRequest(BaseModel):
    project_id: str
    task_id: str
    language: str
    framework: str
    requirements: str

class CodeExplanationRequest(BaseModel):
    code: str
    language: str
    context: str
    project_id: Optional[str] = "P001"

class TestGenerationRequest(BaseModel):
    requirements: str
    code: str
    task_description: str
    project_id: Optional[str] = "P001"

class BugAnalysisRequest(BaseModel):
    error_message: str
    stack_trace: str
    code: str
    task_info: str
    project_id: Optional[str] = "P001"

class CodeReviewRequest(BaseModel):
    code: str
    project_id: Optional[str] = "P001"

class EvolutionAnalysisRequest(BaseModel):
    project_id: str
    iteration_id: str
    test_results: str
    bugs: str
    fixes: str
    review_results: str

class MemorySummarizeRequest(BaseModel):
    project_id: str
    problem: str
    cause: str
    solution: str
    learning: str
    context: str

