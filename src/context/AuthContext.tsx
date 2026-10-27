import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi, type UserProfile } from '../services/api/auth'

export type UserRole = 'ADMIN' | 'DEVELOPER' | 'TESTER' | 'PROJECT_MANAGER' | 'ARCHITECT' | 'SECURITY_REVIEWER' | 'RELEASE_MANAGER' | 'VIEWER'

export interface AuthUser extends UserProfile {}


interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AUTH_USER_KEY = 'se_maestro_auth_user'
const AUTH_TOKEN_KEY = 'se_maestro_auth_token'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Validate the stored token with the server before restoring a session.
  useEffect(() => {
    let active = true
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!storedToken) { setIsLoading(false); return }
    authApi.getMe().then(profile => {
      if (active) { setToken(storedToken); setUser(profile) }
    }).catch(() => {
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
    }).finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await authApi.login(email.trim(), password)
      
      // Store session token and user profile (never store plaintext password)
      localStorage.setItem(AUTH_TOKEN_KEY, res.token)
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user))
      
      setToken(res.token)
      setUser(res.user)
      return true
    } catch (err: any) {
      // Clear any partial state on failure
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      setToken(null)
      setUser(null)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authApi.logout().catch(() => {})
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
