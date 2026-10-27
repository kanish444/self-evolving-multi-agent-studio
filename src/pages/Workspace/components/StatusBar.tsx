import React from 'react'
import { GitBranch, Cpu, Wifi, Code } from 'lucide-react'

interface StatusBarProps {
  activeFile: string
  agentName: string
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeFile,
  agentName
}) => {
  const getLanguage = (file: string) => {
    const ext = file.split('.').pop()
    if (ext === 'py') return 'Python'
    if (ext === 'md') return 'Markdown'
    if (ext === 'ts' || ext === 'tsx') return 'TypeScript'
    if (ext === 'json') return 'JSON'
    return 'Text'
  }

  return (
    <footer className="h-7 bg-surface-base border-t border-border flex items-center justify-between px-4 text-[11px] text-text-muted select-none font-mono flex-shrink-0 z-20">
      {/* Left panel */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-text-primary font-semibold">
          <Code className="w-3.5 h-3.5 text-accent" />
          <span>{getLanguage(activeFile)}</span>
        </div>
        <span className="text-border">|</span>
        <span>UTF-8</span>
        <span className="text-border">|</span>
        <span>Spaces: 2</span>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5">
          <GitBranch className="w-3 h-3 text-accent" />
          <span className="text-text-secondary">main</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-accent/10 border border-accent/20 text-accent font-bold px-2 py-0.5 rounded-md">
          <Cpu className="w-3 h-3 text-accent animate-pulse" />
          <span>Agent: {agentName}</span>
        </div>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5 text-success font-bold">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          <Wifi className="w-3 h-3 text-success" />
          <span>AI Engine: Live</span>
        </div>
      </div>
    </footer>
  )
}
