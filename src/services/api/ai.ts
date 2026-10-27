import { apiRequest } from './client'

export interface AIHealthResponse {
  provider: string
  model: string
  configuration_status: string
  availability: boolean
}

export interface RequirementAnalysisResponse {
  summary: string
  application_type: string
  target_users: string[]
  core_features: string[]
  functional_requirements: string[]
  non_functional_requirements: string[]
  assumptions: string[]
  risks: string[]
}

export interface ProjectPlanResponse {
  project_goals: string[]
  modules: Array<{
    name: string
    description: string
  }>
  tasks: Array<{
    id: string
    title: string
    assigned_agent: string
    status: string
  }>
  dependencies: Array<{
    task_id: string
    depends_on: string
  }>
  suggested_order: string[]
  potential_risks: string[]
}

export interface ArchitectureAnalysisResponse {
  frontend: string
  backend: string
  database: string
  authentication: string
  api_structure: string
  major_components: string[]
  scalability_concerns: string
  security_considerations: string
}

export interface CodeGenerationResponse {
  file_path: string
  purpose: string
  code: string
  explanation: string
  dependencies: string[]
  warnings: string[]
}

export interface CodeExplanationResponse {
  summary: string
  logic: string
  dependencies: string[]
  potential_issues: string
  suggested_improvements: string
}

export interface TestCaseResponse {
  test_name: string
  input: string
  expected_output: string
  test_type: string
  priority: string
}

export interface TestGenerationResponse {
  tests: TestCaseResponse[]
}

export interface BugAnalysisResponse {
  error_summary: string
  probable_root_cause: string
  affected_component: string
  suggested_fix: string
  confidence: number
  additional_investigation: string
}

export interface CodeReviewResponse {
  correctness: string
  readability: string
  maintainability: string
  security: string
  performance: string
  potential_bugs: string
  architecture_consistency: string
}

export interface EvolutionAnalysisResponse {
  what_went_wrong: string
  what_was_fixed: string
  pattern_discovered: string
  what_could_be_improved: string
  potential_reusable_learning: string
}

export interface MemorySummarizationResponse {
  problem: string
  cause: string
  solution: string
  learning: string
  context: string
  confidence: number
}

// REST Client requests object mapping
export const aiApi = {
  health: () =>
    apiRequest<AIHealthResponse>('/ai/health'),

  analyzeRequirement: (projectId: string, requirement: string) =>
    apiRequest<RequirementAnalysisResponse>('/ai/analyze-requirement', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, requirement })
    }),

  createPlan: (projectId: string, requirement: string) =>
    apiRequest<ProjectPlanResponse>('/ai/create-plan', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, requirement })
    }),

  analyzeArchitecture: (projectId: string, requirement: string) =>
    apiRequest<ArchitectureAnalysisResponse>('/ai/analyze-architecture', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, requirement })
    }),

  generateCode: (projectId: string, taskId: string, language: string, framework: string, requirements: string) =>
    apiRequest<CodeGenerationResponse>('/ai/generate-code', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        task_id: taskId,
        language,
        framework,
        requirements
      })
    }),

  explainCode: (code: string, language: string, context: string, projectId?: string) =>
    apiRequest<CodeExplanationResponse>('/ai/explain-code', {
      method: 'POST',
      body: JSON.stringify({ code, language, context, project_id: projectId })
    }),

  generateTests: (requirements: string, code: string, taskDescription: string, projectId?: string) =>
    apiRequest<TestGenerationResponse>('/ai/generate-tests', {
      method: 'POST',
      body: JSON.stringify({ requirements, code, task_description: taskDescription, project_id: projectId })
    }),

  analyzeBug: (errorMessage: string, stackTrace: string, code: string, taskInfo: string, projectId?: string) =>
    apiRequest<BugAnalysisResponse>('/ai/analyze-bug', {
      method: 'POST',
      body: JSON.stringify({
        error_message: errorMessage,
        stack_trace: stackTrace,
        code,
        task_info: taskInfo,
        project_id: projectId
      })
    }),

  reviewCode: (code: string, projectId?: string) =>
    apiRequest<CodeReviewResponse>('/ai/review-code', {
      method: 'POST',
      body: JSON.stringify({ code, project_id: projectId })
    }),

  analyzeEvolution: (projectId: string, iterationId: string, testResults: string, bugs: string, fixes: string, reviewResults: string) =>
    apiRequest<EvolutionAnalysisResponse>('/ai/analyze-evolution', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        iteration_id: iterationId,
        test_results: testResults,
        bugs,
        fixes,
        review_results: reviewResults
      })
    }),

  summarizeMemory: (projectId: string, problem: string, cause: string, solution: string, learning: string, context: string) =>
    apiRequest<MemorySummarizationResponse>('/ai/summarize-memory', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        problem,
        cause,
        solution,
        learning,
        context
      })
    })
}
