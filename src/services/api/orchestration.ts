import { apiRequest } from './client'
import type { Task } from './tasks'


export interface WorkflowRun {
  id: string
  project_id: string
  status: string
  current_state: string
  current_agent?: string
  started_at: string
  completed_at?: string
  error_message?: string
}

export interface AgentHandoff {
  id: string
  workflow_run_id: string
  from_agent: string
  to_agent: string
  task_id?: string
  payload_reference?: string
  created_at: string
}

export interface Approval {
  id: string
  workflow_run_id: string
  task_id?: string
  status: string
  requested_by: string
  approved_by?: string
  comments?: string
  created_at: string
  updated_at: string
}

export interface TimelineNode {
  state: string
  status: string
  agent_role?: string
  timestamp: string
  message: string
}

export interface TimelineResponse {
  run_id: string
  current_state: string
  nodes: TimelineNode[]
}

export const orchestrationApi = {
  listRuns: (projectId: string) =>
    apiRequest<WorkflowRun[]>(`/orchestration/projects/${projectId}/runs`),
  start: (projectId: string, requirement: string) =>
    apiRequest<WorkflowRun>('/orchestration/start', {
      method: 'POST',
      body: JSON.stringify({ project_id: projectId, requirement })
    }),
  pause: (runId: string) =>
    apiRequest<WorkflowRun>(`/orchestration/${runId}/pause`, {
      method: 'POST'
    }),
  resume: (runId: string) =>
    apiRequest<WorkflowRun>(`/orchestration/${runId}/resume`, {
      method: 'POST'
    }),
  cancel: (runId: string) =>
    apiRequest<WorkflowRun>(`/orchestration/${runId}/cancel`, {
      method: 'POST'
    }),
  get: (runId: string) =>
    apiRequest<WorkflowRun>(`/orchestration/${runId}`),
  getTasks: (runId: string) =>
    apiRequest<Task[]>(`/orchestration/${runId}/tasks`),
  getApprovals: (runId: string) =>
    apiRequest<Approval[]>(`/orchestration/${runId}/approvals`),
  getHandoffs: (runId: string) =>
    apiRequest<AgentHandoff[]>(`/orchestration/${runId}/handoffs`),
  getTimeline: (runId: string) =>
    apiRequest<TimelineResponse>(`/orchestration/${runId}/timeline`),
  approve: (runId: string, taskId: string, comments?: string) =>
    apiRequest<Approval>(`/orchestration/${runId}/tasks/${taskId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    }),
  reject: (runId: string, taskId: string, comments?: string) =>
    apiRequest<Approval>(`/orchestration/${runId}/tasks/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    }),
  requestChanges: (runId: string, taskId: string, comments?: string) =>
    apiRequest<Approval>(`/orchestration/${runId}/tasks/${taskId}/request_changes`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    })
}
