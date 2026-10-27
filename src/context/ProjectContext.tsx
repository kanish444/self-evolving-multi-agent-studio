import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { projectsApi } from '../services/api/projects'
import type { Project } from '../services/api/projects'
import { useAuth } from './AuthContext'
interface ProjectContextType {
  projects: Project[]; activeProject: Project | null; activeProjectId: string
  setActiveProjectId: (id: string) => void; selectProject: (id: string | Project) => void
  isLoading: boolean; error: string | null; refreshProjects: () => Promise<Project[]>
}
export const DEFAULT_PROJECTS: Project[] = []
const Context = createContext<ProjectContextType | undefined>(undefined)
export function ProjectProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setId] = useState('')
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const key = `se-maestro-project-${user?.id || ''}`
  const accountKey = useRef(key)
  accountKey.current = key
  const refreshProjects = useCallback(async () => {
    if (!isAuthenticated) { setProjects([]); setId(''); return [] }
    setLoading(true)
    try {
      const data = await projectsApi.list()
      if (accountKey.current !== key) return []
      setProjects(data); setError(null)
      setId(previous => data.some(p => p.id === previous) ? previous : data.find(p => p.id === localStorage.getItem(key))?.id || data[0]?.id || '')
      return data
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load projects'); setProjects([]); setId(''); return [] }
    finally { setLoading(false) }
  }, [isAuthenticated, key])
  useEffect(() => { setProjects([]); setId(''); void refreshProjects() }, [refreshProjects])
  const selectProject = useCallback((value: string | Project) => { const id = typeof value === 'string' ? value : value.id; setId(id); localStorage.setItem(key, id) }, [key])
  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId) || null, [projects, activeProjectId])
  return <Context.Provider value={{ projects, activeProject, activeProjectId, setActiveProjectId: selectProject, selectProject, isLoading, error, refreshProjects }}>{children}</Context.Provider>
}
export function useProject() { const context = useContext(Context); if (!context) throw new Error('ProjectProvider required'); return context }
