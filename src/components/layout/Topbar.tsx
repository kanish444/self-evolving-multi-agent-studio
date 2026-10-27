import React from 'react'
import { Settings as SettingsIcon, User, LogOut, Folder, ChevronDown, Menu, Plus } from 'lucide-react'
import { Dropdown } from '../ui/Dropdown'
import type { DropdownItem } from '../ui/Dropdown'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProject } from '../../context/ProjectContext'

interface TopbarProps {
  onToggleSidebarMobile?: () => void
  onOpenCommandPalette?: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebarMobile }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { activeProject, projects, selectProject } = useProject()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const projectMenuItems: DropdownItem[] = [
    ...projects.map(p => ({
      id: p.id,
      label: p.name,
      icon: <Folder className="w-3.5 h-3.5 text-[#15BDEB]" strokeWidth={1.5} />,
      active: p.id === activeProject?.id,
      onClick: () => selectProject(p.id)
    })),
    { id: 'divider-new', label: '', divider: true },
    {
      id: 'create-new-project',
      label: 'New Project...',
      icon: <Plus className="w-3.5 h-3.5 text-[#0878F9]" strokeWidth={2} />,
      onClick: () => navigate('/projects')
    }
  ]

  const userMenuItems: DropdownItem[] = [
    {
      id: 'header-user',
      label: user ? `${user.name} (${user.email})` : 'Authenticated User',
      icon: <User className="w-4 h-4 text-[#15BDEB]" strokeWidth={1.5} />,
      onClick: () => {}
    },
    { id: 'divider-user-1', label: '', divider: true },
    {
      id: 'settings',
      label: 'Studio Settings',
      icon: <SettingsIcon className="w-4 h-4 text-[#A8B8C8]" strokeWidth={1.5} />,
      onClick: () => navigate('/settings')
    },
    { id: 'divider-user-2', label: '', divider: true },
    {
      id: 'logout',
      label: 'Sign Out Session',
      icon: <LogOut className="w-4 h-4 text-rose-400" strokeWidth={1.5} />,
      onClick: handleLogout,
      danger: true
    }
  ]

  // Extract user initials
  const userName = user?.name || user?.username || 'Studio User'
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SU'

  const projectDescription = activeProject?.description || activeProject?.requirements || 'Engineering workspace active'

  return (
    <header className="bg-[#0B131A] border-b border-[#263744] h-[74px] flex items-center justify-between px-5 select-none flex-shrink-0 z-30">
      {/* Left side: Project Icon, Selected Project Name, Switch Dropdown, and Description beneath */}
      <div className="flex items-center gap-3 min-w-0 max-w-2xl">
        <button
          type="button"
          onClick={onToggleSidebarMobile}
          className="md:hidden p-1.5 rounded-md hover:bg-[#121D26] text-[#A8B8C8] hover:text-[#EDF3F8] cursor-pointer focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="w-8 h-8 rounded-md bg-[#121D26] border border-[#263744] flex items-center justify-center flex-shrink-0 text-[#15BDEB]">
          <Folder className="w-4 h-4" strokeWidth={1.5} />
        </div>

        <div className="min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="font-display font-semibold text-[18px] text-[#EDF3F8] tracking-tight truncate leading-tight">
              {activeProject ? activeProject.name : 'No Project Selected'}
            </h1>

            <Dropdown
              align="left"
              trigger={
                <button
                  type="button"
                  className="p-1 rounded hover:bg-[#121D26] text-[#788B9B] hover:text-[#EDF3F8] transition-colors cursor-pointer"
                  title="Switch project"
                  aria-label="Switch project dropdown"
                >
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              }
              items={projectMenuItems}
            />
          </div>

          <p className="text-[12px] text-[#788B9B] truncate leading-tight mt-0.5">
            {projectDescription}
          </p>
        </div>
      </div>

      {/* Right side: New Project primary button, Settings icon & label, Compact Profile Avatar */}
      <div className="flex items-center gap-3.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="bg-[#0878F9] hover:bg-[#076AD9] text-white text-xs font-semibold px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm focus:outline-none"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
          <span>New Project</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="text-xs text-[#A8B8C8] hover:text-[#EDF3F8] hover:bg-[#121D26] px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer focus:outline-none"
          title="Studio Settings"
        >
          <SettingsIcon className="w-4 h-4 text-[#788B9B] hover:text-[#A8B8C8]" strokeWidth={1.5} />
          <span className="hidden sm:inline font-medium">Settings</span>
        </button>

        <Dropdown
          align="right"
          trigger={
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-[#182630] border border-[#263744] hover:border-[#15BDEB]/50 flex items-center justify-center text-xs font-mono font-bold text-[#EDF3F8] transition-colors cursor-pointer focus:outline-none"
              aria-label="User profile options"
              title={userName}
            >
              {initials}
            </button>
          }
          items={userMenuItems}
        />
      </div>
    </header>
  )
}
