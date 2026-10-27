import { apiRequest } from './client'

export interface EvolutionRecord {
  id: string
  project_id: string
  iteration_id: string
  title: string
  problem: string
  solution: string
  learning: string
  confidence: string
  created_at: string
}

export const evolutionApi = {
  list: (projectId: string) => apiRequest<EvolutionRecord[]>(`/projects/${projectId}/evolution`),
  get: (id: string) => apiRequest<EvolutionRecord>(`/evolution/${id}`),
  create: (projectId: string, evo: Partial<EvolutionRecord>) =>
    apiRequest<EvolutionRecord>(`/projects/${projectId}/evolution`, {
      method: 'POST',
      body: JSON.stringify(evo)
    })
}
