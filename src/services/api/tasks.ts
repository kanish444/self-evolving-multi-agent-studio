import { apiRequest } from './client'

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string
  status: string
  priority: string
  assigned_agent_id?: string
  created_at: string
  updated_at: string
  workflow_run_id?: string
  parent_task_id?: string
  agent_role?: string
  dependencies?: string
  input_context?: string
  output_reference?: string
  attempt_count?: number
  started_at?: string
  completed_at?: string
}


export const tasksApi = {
  list: (projectId: string) => apiRequest<Task[]>(`/projects/${projectId}/tasks`),
  get: (id: string) => apiRequest<Task>(`/tasks/${id}`),
  create: (projectId: string, task: { title: string; description?: string; priority?: string; assigned_agent_id?: string }) =>
    apiRequest<Task>(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task)
    }),
  update: (id: string, task: Partial<Task>) =>
    apiRequest<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task)
    }),
  delete: (id: string) =>
    apiRequest<void>(`/tasks/${id}`, {
      method: 'DELETE'
    })
}
