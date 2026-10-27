import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from '../ui/CommandPalette'
import { useLocation } from 'react-router-dom'
import { useProject } from '../../context/ProjectContext'

interface AppShellProps {
  children: React.ReactNode
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const location = useLocation()
  const { activeProject } = useProject()

  const isWorkspace = location.pathname === '/workspace' || location.pathname === '/editor'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0D141B] text-[#EDF3F8] font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0 h-full">
        <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      </div>

      {/* Mobile Sidebar overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-[208px] max-w-xs h-full bg-[#0B131A] shadow-2xl border-r border-[#263744]">
            <Sidebar isCollapsed={false} setIsCollapsed={() => {}} />
          </div>
        </div>
      )}

      {/* Main Command Center Layout */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <Topbar
          onToggleSidebarMobile={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Main Workspace Canvas */}
        <main className={`flex-1 min-h-0 ${isWorkspace ? 'overflow-hidden p-0' : 'overflow-y-auto custom-scrollbar p-6 sm:p-8'} bg-[#0D141B] relative`}>
          <div className={`${isWorkspace ? 'w-full h-full flex flex-col' : 'max-w-7xl mx-auto h-full flex flex-col animate-page-enter'}`}>
            {children}
          </div>
        </main>

        {/* Studio Status Footer for standard views */}
        {!isWorkspace && (
          <footer className="bg-[#0B131A] border-t border-[#263744] h-8 px-6 flex items-center justify-between text-[11px] text-[#788B9B] select-none font-mono flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#2BC879] rounded-full shadow-[0_0_6px_#2BC879]" />
                <span className="font-semibold text-[#EDF3F8]">SE-MAESTRO</span>
              </div>
              <span className="text-[#263744]">|</span>
              <span className="text-[#A8B8C8]">
                Project: <strong className="text-[#15BDEB] font-medium">{activeProject?.name || 'None selected'}</strong>
              </span>
              {activeProject && (
                <>
                  <span className="text-[#263744]">|</span>
                  <span className="text-[#788B9B]">
                    Status: <span className="text-[#EDF3F8] capitalize">{activeProject.status || 'Active'}</span>
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#788B9B]">Backend: <span className="text-[#2BC879]">127.0.0.1:8000</span></span>
              <span className="text-[#263744]">|</span>
              <span className="text-[#788B9B]">Execution: <span className="text-[#15BDEB]">Check workspace status</span></span>
            </div>
          </footer>
        )}
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  )
}
