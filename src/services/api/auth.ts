import { apiRequest } from './client'

export interface UserProfile {
  id: string
  username: string
  email: string
  name: string
  role: 'ADMIN' | 'DEVELOPER' | 'TESTER' | 'PROJECT_MANAGER' | 'ARCHITECT' | 'SECURITY_REVIEWER' | 'RELEASE_MANAGER' | 'VIEWER'
  permissions: string[]
  title: string
}

export interface LoginResponse {
  token: string
  token_type: string
  user: UserProfile
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  },

  getMe: async (): Promise<UserProfile> => {
    return apiRequest<UserProfile>('/auth/me', {
      method: 'GET'
    })
  },

  logout: async (): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST'
    })
  }
}
