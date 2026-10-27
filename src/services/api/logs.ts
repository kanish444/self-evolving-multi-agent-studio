import { apiRequest } from './client'

export interface LogEvent {
  id: string
  project_id: string
  iteration_id?: string
  agent_id?: string
  task_id?: string
  type: string
  status: string
  action: string
  message: string
  file?: string
  test?: string
  trace_id: string
  correlation_id: string
  timestamp: string
  created_at: string
}

export interface LogFilterParams {
  type?: string
  status?: string
  agent?: string
  task?: string
  iteration?: string
  trace_id?: string
}

export const logsApi = {
  list: (projectId: string, params?: LogFilterParams) =>
    apiRequest<LogEvent[]>(`/projects/${projectId}/logs`, {
      params: params as any
    }),
  get: (id: string) => apiRequest<LogEvent>(`/logs/${id}`),
  getTrace: (traceId: string) => apiRequest<LogEvent[]>(`/logs/trace/${traceId}`)
}
