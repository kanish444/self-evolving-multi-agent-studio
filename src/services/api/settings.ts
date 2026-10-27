import { apiRequest } from './client'

export interface AIConfig {
  provider: string
  model: string
  is_api_key_configured: boolean
  temperature: number
  max_tokens: number
  timeout_seconds: number
  supported_models: string[]
}

export interface ExecutionLimits {
  command_timeout_seconds: number
  sandbox_timeout_seconds: number
  max_debug_cycles: number
  max_agent_retries: number
  max_file_size_bytes: number
}

export interface DemoStatus {
  has_demo_data: boolean
  suspected_demo_projects: Array<{ id: string; name: string; description: string }>
  message: string
}

export interface StudioUser {
  id: string
  username: string
  email: string
  full_name?: string
  role: string
  is_active: boolean
}

export const settingsApi = {
  getAIConfig: () => apiRequest<AIConfig>('/settings/ai-config'),

  updateAIConfig: (config: { provider?: string; model?: string; api_key?: string; temperature?: number }) =>
    apiRequest<{ status: string; is_api_key_configured: boolean }>('/settings/ai-config', {
      method: 'POST',
      body: JSON.stringify(config)
    }),

  testAIConnection: () =>
    apiRequest<{ status: string; message: string }>('/settings/ai-test', {
      method: 'POST'
    }),

  getExecutionLimits: () => apiRequest<ExecutionLimits>('/settings/execution-limits'),

  updateExecutionLimits: (limits: Partial<ExecutionLimits>) =>
    apiRequest<{ status: string; limits: ExecutionLimits }>('/settings/execution-limits', {
      method: 'POST',
      body: JSON.stringify(limits)
    }),

  getDemoStatus: () => apiRequest<DemoStatus>('/settings/demo-status'),

  cleanupDemoData: () =>
    apiRequest<{ status: string; deleted_count: number; deleted_projects: string[] }>('/settings/cleanup-demo', {
      method: 'POST'
    }),

  listUsers: () => apiRequest<StudioUser[]>('/settings/users'),

  createUser: (user: { username: string; email: string; full_name: string; password: string; role_id: string }) =>
    apiRequest<{ status: string; user_id: string; username: string }>('/settings/users', {
      method: 'POST',
      body: JSON.stringify(user)
    })
}
