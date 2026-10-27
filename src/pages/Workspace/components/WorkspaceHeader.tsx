import React from 'react'
import { Play, Save, GitBranch, Search, Folder, ChevronDown, Check, Cpu, LogOut, User, Settings, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../../components/ui/Avatar'
import { Dropdown } from '../../../components/ui/Dropdown'
import type { DropdownItem } from '../../../components/ui/Dropdown'
import { useAuth } from '../../../context/AuthContext'
import { useProject } from '../../../context/ProjectContext'

interface WorkspaceHeaderProps {
  onRunCode: () => void
  onSaveCode: () => void
  isSaving: boolean
  isRunning: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  onOpenSearch: () => void
  modifiedCount: number
  projectId: string
  onProjectIdChange: (id: string) => void
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  onRunCode,
  onSaveCode,
  isSaving,
  isRunning,
  searchQuery,
  setSearchQuery,
  onOpenSearch,
  modifiedCount,
  projectId,
  onProjectIdChange
}) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { projects, activeProject, selectProject } = useProject()
  const [isOpen, setIsOpen] = React.useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const userMenuItems: DropdownItem[] = [
    {
      id: 'header',
      label: user ? `${user.name} (${user.role})` : 'Lead Developer',
      icon: <User className="w-4 h-4 text-accent" />,
      onClick: () => {}
    },
    { id: 'divider-1', label: '', divider: true },
    {
      id: 'dashboard',
      label: 'Back to Dashboard',
      icon: <Cpu className="w-4 h-4 text-accent" />,
      onClick: () => navigate('/dashboard')
    },
    {
      id: 'settings',
      label: 'Studio Settings',
      icon: <Settings className="w-4 h-4 text-text-muted" />,
      onClick: () => navigate('/settings')
    },
    {
      id: 'security',
      label: 'Security & Governance',
      icon: <ShieldCheck className="w-4 h-4 text-success" />,
      onClick: () => navigate('/governance')
    },
    { id: 'divider-2', label: '', divider: true },
    {
      id: 'logout',
      label: 'Sign Out Session',
      icon: <LogOut className="w-4 h-4 text-error" />,
      onClick: handleLogout,
      danger: true
    },
  ]

  const userName = user?.name || 'Kanishk'

  const currentProject = projects.find(p => p.id === projectId) || activeProject

  return (
    <header className="h-12 bg-surface-base border-b border-border px-4 flex items-center justify-between select-none z-30 shadow-command-card">
      {/* Left: Brand, Project switcher, Branch */}
      <div className="flex items-center gap-3.5">
        {/* Brand Return Badge */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group"
          title="Back to Dashboard"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white shadow-[0_0_10px_rgba(179,68,30,0.3)]">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <span className="font-display text-xs font-black text-text-primary tracking-wider hidden sm:inline">
            SE-MAESTRO
          </span>
        </button>

        <div className="h-4 w-px bg-border" />

        {/* Project Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 text-xs font-semibold text-text-primary bg-surface-secondary hover:bg-surface-elevated border border-border px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5 text-accent" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{currentProject?.name || 'No Project'}</span>
            <span className="text-[10px] font-mono text-accent-light bg-accent/10 px-1.5 py-0.2 rounded border border-accent/20">
              {currentProject?.id || 'NONE'}
            </span>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>

          {isOpen && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-2xl bg-surface-secondary border border-border shadow-command-modal p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                Select Workspace Project
              </div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onProjectIdChange(p.id)
                    selectProject(p.id)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                    p.id === currentProject?.id
                      ? 'bg-accent/10 text-accent font-semibold border border-accent/20'
                      : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                  }`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-[10px] font-mono text-text-muted">{p.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Branch Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-text-secondary bg-surface-secondary border border-border px-2.5 py-1 rounded-xl">
          <GitBranch className="w-3 h-3 text-accent" />
          <span>main</span>
        </div>
      </div>

      {/* Center: Command / File Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6 relative">
        <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClick={onOpenSearch}
          placeholder="Search workspace files or actions... (Ctrl + K)"
          className="w-full h-8 bg-surface-secondary hover:bg-surface-elevated focus:bg-surface-secondary border border-border focus:border-accent rounded-xl text-xs pl-9 pr-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all font-sans"
        />
      </div>

      {/* Right: Actions, Git status, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Run Code Button */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          className={`h-8 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            isRunning
              ? 'bg-success/15 text-success border border-success/30 animate-pulse'
              : 'bg-accent hover:bg-accent-hover text-white shadow-[0_0_12px_rgba(179,68,30,0.3)]'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunning ? 'Running...' : 'Run in Sandbox'}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={onSaveCode}
          disabled={isSaving}
          className="h-8 px-3 rounded-xl text-xs font-medium border border-border bg-surface-secondary hover:bg-surface-elevated text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
        >
          {isSaving ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-text-muted" />
              <span>Save</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-border mx-1" />

        {/* Git Status Badge */}
        {modifiedCount > 0 ? (
          <div className="flex items-center gap-1 text-[11px] font-mono text-warning font-bold bg-warning/15 border border-warning/30 px-2.5 py-1 rounded-xl">
            <span>{modifiedCount} modified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] font-mono text-success font-bold bg-success/15 border border-success/30 px-2.5 py-1 rounded-xl">
            <span>clean</span>
          </div>
        )}

        {/* User Profile with Dropdown */}
        <Dropdown
          trigger={
            <div className="cursor-pointer hover:opacity-85 transition-opacity pl-1">
              <Avatar name={userName} size="sm" status="online" />
            </div>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  )
}
