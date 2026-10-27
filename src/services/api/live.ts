import { apiRequest } from './client'
export interface LiveEvent { id: string; time: number; agent: string; status: string; message: string; evidence?: unknown }
export interface LiveState {
  status: string; error: string | null; approved: boolean; run_id: string | null
  files: string[]; agents: Record<string, string>; events: LiveEvent[]
  plan: { summary: string; acceptance: string[]; tasks: string[]; runtime: string; architecture: string; questions: string[] } | null
  messages: { role: string; content: string }[]
  preview: { port?: number; status: string } | null
  test_result?: { passed: boolean; test_count: number; output: string; exit_code: number; code_version: string }
  lessons?: { status: string; proposal: { summary: string }; evidence_version: string }[]
}
const base = (id: string) => `/projects/${encodeURIComponent(id)}/live`
export const liveApi = {
  state: (id: string) => apiRequest<LiveState>(base(id)),
  chat: (id: string, message: string) => apiRequest(base(id) + '/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  cancel: (id: string) => apiRequest(base(id) + '/cancel', { method: 'POST' }),
  approve: (id: string) => apiRequest(base(id) + '/approve', { method: 'POST' }),
  file: (id: string, path: string) => apiRequest<{ content: string }>(base(id) + '/file', { params: { path } }),
  save: (id: string, path: string, content: string) => apiRequest(base(id) + '/file', { method: 'PUT', body: JSON.stringify({ path, content }) }),
  restart: (id: string) => apiRequest(base(id) + '/preview/restart', { method: 'POST' }),
  stop: (id: string) => apiRequest(base(id) + '/preview/stop', { method: 'POST' }),
  incident: (id: string) => apiRequest(base(id) + '/incident', { method: 'POST' }),
  configuration: (id: string) => apiRequest<{ provider: string; model: string; provider_configured: boolean; docker_installed: boolean; note: string }>(base(id) + '/configuration'),
}
