import { apiRequest } from './client'

export interface Iteration {
  id: string
  project_id: string
  number: number
  goal?: string
  status: string
  started_at: string
  completed_at?: string
}

export const iterationsApi = {
  list: (projectId: string) => apiRequest<Iteration[]>(`/projects/${projectId}/iterations`),
  get: (id: string) => apiRequest<Iteration>(`/iterations/${id}`),
  create: (projectId: string, iteration: { number: number; goal?: string; status?: string }) =>
    apiRequest<Iteration>(`/projects/${projectId}/iterations`, {
      method: 'POST',
      body: JSON.stringify(iteration)
    }),
  update: (id: string, iteration: Partial<Iteration>) =>
    apiRequest<Iteration>(`/iterations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(iteration)
    })
}
