import { apiRequest } from './client'

export interface MemoryNode {
  id: string
  project_id: string
  category: string
  title: string
  content: string
  source?: string
  confidence: number
  created_at: string
  updated_at: string
  importance: string
  status: string
  tags?: string
  related_failures?: string
  related_agents?: string
  used_in_count: number
  success_rate: number
  impact_score?: string
  usage_count: number
  success_count: number
  last_used?: string
  iteration?: string
}

export const memoryApi = {
  list: (projectId: string) => apiRequest<MemoryNode[]>(`/projects/${projectId}/memory`),
  get: (id: string) => apiRequest<MemoryNode>(`/memory/${id}`),
  create: (projectId: string, memory: Partial<MemoryNode>) =>
    apiRequest<MemoryNode>(`/projects/${projectId}/memory`, {
      method: 'POST',
      body: JSON.stringify(memory)
    }),
  update: (id: string, memory: Partial<MemoryNode>) =>
    apiRequest<MemoryNode>(`/memory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memory)
    }),
  delete: (id: string) =>
    apiRequest<void>(`/memory/${id}`, {
      method: 'DELETE'
    })
}
