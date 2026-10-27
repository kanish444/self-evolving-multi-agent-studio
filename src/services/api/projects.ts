import { apiRequest } from './client'

export interface Project {
  id: string
  name: string
  description?: string
  status: string
  current_iteration: number
  requirements?: string
  architecture_plan?: string
  permissions_granted?: string
  repo_url?: string
  workspace_path?: string
  created_at: string
  updated_at: string
}

export interface ArchitectChatResponse {
  reply: string
  suggested_questions: string[]
  is_live_ai: boolean
}

export interface ArchitectPlanResponse {
  scope: string
  acceptance_criteria: string[]
  modules: string[]
  architecture: string
  proposed_stack: string
  required_resources: Array<{ resource: string; reason: string }>
  agent_roles: string[]
  execution_stages: string[]
  assumptions: string[]
  is_live_ai: boolean
}

export const projectsApi = {
  list: () => apiRequest<Project[]>('/projects'),
  get: (id: string) => apiRequest<Project>(`/projects/${id}`),
  create: (project: { name: string; description?: string; requirements?: string; repo_url?: string }) => 
    apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(project)
    }),
  update: (id: string, project: Partial<Project>) =>
    apiRequest<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project)
    }),
  delete: (id: string) =>
    apiRequest<void>(`/projects/${id}`, {
      method: 'DELETE'
    }),
  architectChat: (projectId: string, message: string, requirements?: string) =>
    apiRequest<ArchitectChatResponse>(`/projects/${projectId}/architect-chat`, {
      method: 'POST',
      body: JSON.stringify({ message, requirements })
    }),
  chatWithArchitect: (projectId: string, message: string, requirements?: string) =>
    apiRequest<ArchitectChatResponse>(`/projects/${projectId}/architect-chat`, {
      method: 'POST',
      body: JSON.stringify({ message, requirements })
    }),
  architectPlan: (projectId: string, customNotes?: string) =>
    apiRequest<ArchitectPlanResponse>(`/projects/${projectId}/architect-plan`, {
      method: 'POST',
      body: JSON.stringify({ custom_notes: customNotes })
    }),
  grantPermissions: (projectId: string, permissions: string[]) =>
    apiRequest<{ status: string; permissions: string[] }>(`/projects/${projectId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissions })
    }),
  approvePlan: (projectId: string, assignedRoles?: string[], planData?: Partial<ArchitectPlanResponse>) =>
    apiRequest<{ status: string; project_status: string; assigned_roles: string[] }>(`/projects/${projectId}/approve-plan`, {
      method: 'POST',
      body: JSON.stringify({ assigned_roles: assignedRoles, plan_data: planData })
    })
}
