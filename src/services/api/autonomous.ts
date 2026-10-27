import { apiRequest } from './client'

export interface DevelopmentIteration {
  id: string
  project_id: string
  workflow_run_id?: string
  iteration_number: number
  parent_iteration_id?: string
  goal: string
  status: 'PLANNED' | 'DEVELOPING' | 'EXECUTING' | 'TESTING' | 'FAILED' | 'DEBUGGING' | 'FIXING' | 'PASSED' | 'REVIEWING' | 'COMPLETED' | 'ABANDONED'
  artifact_id?: string
  execution_id?: string
  test_result_id?: string
  failure_summary?: string
  learning_reference?: string
  created_at: string
  completed_at?: string
}

export interface ArtifactVersion {
  id: string
  version: number
  parent_artifact_id?: string
  project_id: string
  task_id?: string
  files: string // JSON representation
  created_by_agent: string
  change_summary?: string
  created_at: string
}

export interface AutonomyPolicy {
  project_id: string
  level: number // 0 - MANUAL, 1 - ASSISTED, 2 - CONTROLLED AUTONOMY
  max_iterations: number
  max_debug_cycles: number
  require_approval_for_dependencies: boolean
  require_approval_for_architecture: boolean
  require_approval_for_security_changes: boolean
  allow_auto_retest: boolean
  allow_auto_fix: boolean
  created_at: string
  updated_at: string
}

export interface DiffResult {
  path: string
  added_lines: number
  removed_lines: number
  diff_text: string
}

export const autonomousApi = {
  start: async (payload: { project_id: string; requirement: string; autonomy_level?: number }) => {
    return apiRequest<{ workflow_run_id: string; status: string; current_state: string; autonomy_level: number }>('/autonomous/start', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  get: async (runId: string) => {
    return apiRequest<{
      run_id: string
      project_id: string
      status: string
      current_state: string
      error_message?: string
      autonomy_level: number
      iteration_count: number
      active_iteration?: DevelopmentIteration
      started_at: string
      completed_at?: string
    }>(`/autonomous/${runId}`)
  },

  pause: async (runId: string) => {
    return apiRequest<{ status: string }>(`/autonomous/${runId}/pause`, { method: 'POST' })
  },

  resume: async (runId: string) => {
    return apiRequest<{ status: string }>(`/autonomous/${runId}/resume`, { method: 'POST' })
  },

  stop: async (runId: string) => {
    return apiRequest<{ status: string }>(`/autonomous/${runId}/stop`, { method: 'POST' })
  },

  approve: async (runId: string, comments?: string) => {
    return apiRequest<{ status: string }>(`/autonomous/${runId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    })
  },

  reject: async (runId: string, comments?: string) => {
    return apiRequest<{ status: string }>(`/autonomous/${runId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    })
  },

  listIterations: async (runId: string): Promise<DevelopmentIteration[]> => {
    return apiRequest<DevelopmentIteration[]>(`/autonomous/${runId}/iterations`)
  },

  listArtifacts: async (runId: string): Promise<ArtifactVersion[]> => {
    return apiRequest<ArtifactVersion[]>(`/autonomous/${runId}/artifacts`)
  },

  getDiff: async (runId: string, baseId: string, headId: string): Promise<DiffResult[]> => {
    return apiRequest<DiffResult[]>(`/autonomous/${runId}/diff?base_artifact_id=${baseId}&head_artifact_id=${headId}`)
  },

  getPolicy: async (runId: string): Promise<AutonomyPolicy> => {
    return apiRequest<AutonomyPolicy>(`/autonomous/${runId}/policy`)
  },

  updatePolicy: async (runId: string, policy: Partial<AutonomyPolicy>): Promise<AutonomyPolicy> => {
    return apiRequest<AutonomyPolicy>(`/autonomous/${runId}/policy`, {
      method: 'PUT',
      body: JSON.stringify(policy)
    })
  },

  getTimeline: async (runId: string) => {
    return apiRequest<{
      run_id: string
      nodes: Array<{
        state: string
        status: 'COMPLETED' | 'CURRENT' | 'FAILED' | 'PENDING'
        message: string
        timestamp: string
      }>
    }>(`/autonomous/${runId}/timeline`)
  },

  rollback: async (runId: string, artifactId: string) => {
    return apiRequest<{
      status: string
      new_artifact_id: string
      new_iteration_id: string
      task_id: string
    }>(`/autonomous/${runId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ artifact_id: artifactId })
    })
  }
}
