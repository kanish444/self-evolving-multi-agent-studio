import React, { useState, useRef, useEffect } from 'react'
import { FolderKanban, ChevronDown, Check, GitBranch } from 'lucide-react'
import { StatusIndicator } from '../ui/Badge'
import { useProject } from '../../context/ProjectContext'

export const ProjectSelector: React.FC<{ isCollapsed?: boolean }> = ({ isCollapsed = false }) => {
  const { projects, activeProject, activeProjectId, selectProject } = useProject()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (id: string) => {
    selectProject(id)
    setIsOpen(false)
  }

  const getEnvBadge = (projId: string) => {
    switch (projId) {
      case 'P001': return { env: 'Dev', status: 'success' as const }
      case 'P002': return { env: 'Staging', status: 'warning' as const }
      case 'P003': return { env: 'Prod', status: 'info' as const }
      case 'P004': return { env: 'Dev', status: 'success' as const }
      case 'P005': return { env: 'Dev', status: 'success' as const }
      default: return { env: 'Dev', status: 'success' as const }
    }
  }

  const currentEnv = getEnvBadge(activeProject?.id || '')

  return (
    <div className="w-full relative select-none" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 border border-border bg-surface-secondary hover:bg-surface-elevated hover:border-[rgba(179,68,30,0.35)] transition-all rounded-xl px-3 py-2 cursor-pointer text-left ${
          isCollapsed ? 'justify-center p-2' : ''
        } ${isOpen ? 'border-accent ring-2 ring-accent/20' : ''}`}
        title={activeProject ? `${activeProject.name} (${activeProject.id})` : 'No Project Selected'}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-surface border border-[rgba(179,68,30,0.3)] flex items-center justify-center text-[#E8B4A0] flex-shrink-0 shadow-xs">
            <FolderKanban className="w-3.5 h-3.5 text-accent" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-text-primary truncate font-sans" title={activeProject?.name || 'No Project Selected'}>
                {activeProject?.name || 'No Project'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusIndicator status={currentEnv.status} pulse />
                <span className="text-[10px] text-text-muted font-mono tracking-tight">
                  {activeProject?.id || 'NONE'} · {currentEnv.env} · V{activeProject?.current_iteration || 1}
                </span>
              </div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-text-muted flex-shrink-0 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-accent' : ''
            }`}
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${
            isCollapsed ? 'left-full ml-2 top-0' : 'left-0 right-0'
          } mt-2 w-72 rounded-2xl bg-surface border border-border shadow-command-modal z-50 p-2 select-none animate-in fade-in-50 zoom-in-95 duration-150`}
        >
          <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-border/60 mb-1.5">
            <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
              Switch Repository
            </span>
            <span className="text-[10px] font-mono text-accent font-semibold">
              {projects.length} Repositories
            </span>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar">
            {projects.map((p) => {
              const isActive = p.id === activeProjectId
              const { env } = getEnvBadge(p.id)

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id)}
                  className={`w-full text-left flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-accent/15 text-text-primary border border-accent/35 shadow-xs font-semibold'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive
                          ? 'bg-accent/20 text-accent border border-accent/40 shadow-[0_0_8px_rgba(179,68,30,0.25)]'
                          : 'bg-surface border border-border text-text-muted'
                      }`}
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs truncate font-sans ${isActive ? 'text-accent font-bold' : 'text-text-primary'}`}>
                          {p.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono mt-0.5">
                        <span className="text-accent-light font-semibold">{p.id}</span>
                        <span>·</span>
                        <span>{env}</span>
                        <span>·</span>
                        <div className="flex items-center gap-0.5">
                          <GitBranch className="w-2.5 h-2.5" />
                          <span>main</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center flex-shrink-0 ml-2 border border-accent/30">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
