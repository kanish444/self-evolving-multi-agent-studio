import { apiRequest } from './client'

export interface ExecutionFile {
  path: string
  content: string
}

export interface ExecutionRequest {
  project_id: string
  task_id?: string
  workflow_run_id?: string
  language: string
  files: ExecutionFile[]
  entrypoint: string
  test_command?: string
  timeout_seconds?: number
}

export interface ExecutionResponse {
  id: string
  project_id: string
  task_id?: string
  workflow_run_id?: string
  language: string
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'RESOURCE_LIMIT' | 'REJECTED' | 'SYSTEM_ERROR'
  entrypoint: string
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface ExecutionResultResponse {
  execution_id: string
  exit_code?: number
  stdout?: string
  stderr?: string
  duration_ms: number
  timed_out: boolean
  resource_limited: boolean
  created_at: string
}

export interface ExecutionDetailResponse extends ExecutionResponse {
  files: ExecutionFile[]
  result?: ExecutionResultResponse
}

export const sandboxApi = {
  execute: async (payload: ExecutionRequest): Promise<ExecutionResponse> => {
    return apiRequest<ExecutionResponse>('/sandbox/execute', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  },

  listExecutions: async (projectId: string): Promise<ExecutionResponse[]> => {
    return apiRequest<ExecutionResponse[]>(`/sandbox/executions?project_id=${projectId}`)
  },

  getExecution: async (executionId: string): Promise<ExecutionDetailResponse> => {
    return apiRequest<ExecutionDetailResponse>(`/sandbox/executions/${executionId}`)
  }
}
