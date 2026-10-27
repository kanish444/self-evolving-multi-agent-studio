import React from 'react'
import {
  FolderKanban,
  Bot,
  Code2,
  FlaskConical,
  Play,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { NavigationItem } from '../navigation/NavigationItem'
import { LeafLogo } from '../ui/LeafLogo'
import { IconButton } from '../ui/Button'

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (val: boolean) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <aside
      className={`bg-[#0B131A] border-r border-[#263744] h-full flex flex-col transition-all duration-200 z-40 select-none ${
        isCollapsed ? 'w-16' : 'w-[208px]'
      }`}
    >
      {/* Brand Header */}
      <div className={`p-4 border-b border-[#263744] flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5'}`}>
        <div className="flex items-center justify-center flex-shrink-0">
          <LeafLogo className="w-6 h-6" size={24} />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-[20px] text-[#EDF3F8] tracking-tight leading-none">
              SE-MAESTRO
            </h1>
            <p className="text-[10px] text-[#788B9B] font-medium leading-[1.25] mt-1 line-clamp-2">
              Self-Evolving Multi-Agent<br />Software Engineering Studio
            </p>
          </div>
        )}
      </div>

      {/* Main Navigation in exact order: Projects, AI Team, Editor, Tests & Fixes, Preview */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-2.5 py-3 space-y-1">
        <NavigationItem
          to="/projects"
          label="Projects"
          icon={<FolderKanban className="w-4 h-4" strokeWidth={1.5} />}
          isCollapsed={isCollapsed}
        />
        <NavigationItem
          to="/team"
          label="AI Team"
          icon={<Bot className="w-4 h-4" strokeWidth={1.5} />}
          isCollapsed={isCollapsed}
        />
        <NavigationItem
          to="/editor"
          label="Editor"
          icon={<Code2 className="w-4 h-4" strokeWidth={1.5} />}
          isCollapsed={isCollapsed}
        />
        <NavigationItem
          to="/tests"
          label="Tests & Fixes"
          icon={<FlaskConical className="w-4 h-4" strokeWidth={1.5} />}
          isCollapsed={isCollapsed}
        />
        <NavigationItem
          to="/preview"
          label="Preview"
          icon={<Play className="w-4 h-4" strokeWidth={1.5} />}
          isCollapsed={isCollapsed}
        />
      </nav>

      {/* Settings Navigation at bottom */}
      <div className="px-2.5 py-2 border-t border-[#263744]">
        <NavigationItem
          to="/settings"
          label="Settings"
          icon={<SettingsIcon className="w-4 h-4" strokeWidth={1.5} />}
          isCollapsed={isCollapsed}
        />
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-2.5 border-t border-[#263744] flex items-center justify-end">
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26]"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          icon={isCollapsed ? <ChevronRight className="w-4 h-4" strokeWidth={1.5} /> : <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />}
        />
      </div>
    </aside>
  )
}
