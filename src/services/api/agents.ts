import { apiRequest } from './client'

export interface Agent {
  id: string
  name: string
  role: string
  description?: string
  status: string
  created_at: string
}

export const agentsApi = {
  list: () => apiRequest<Agent[]>('/agents'),
  get: (id: string) => apiRequest<Agent>(`/agents/${id}`),
  updateStatus: (id: string, status: string) =>
    apiRequest<Agent>(`/agents/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
}
