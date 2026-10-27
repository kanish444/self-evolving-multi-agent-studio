import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  FolderGit2,
  Code2,
  Bot,
  TestTube2,
  Dna,
  Database,
  Terminal,
  Activity,
  ShieldCheck,
  Settings,
  Sparkles,
  Play,
  ArrowRight,
  Zap,
  Lock,
  FolderKanban
} from 'lucide-react'
import { useProject } from '../../context/ProjectContext'

export interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  category: 'Repositories' | 'Navigation' | 'Agents' | 'Commands'
  action: () => void
  badge?: string
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { projects, activeProjectId, selectProject } = useProject()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const projectCommands: CommandItem[] = projects.map((p) => ({
    id: `switch-proj-${p.id}`,
    title: `Switch Repository: ${p.name}`,
    subtitle: `${p.description || 'Repository workspace'} · ${p.id}`,
    category: 'Repositories',
    icon: <FolderKanban className="w-4 h-4 text-[#B3441E]" />,
    badge: p.id === activeProjectId ? 'ACTIVE' : p.id,
    action: () => {
      selectProject(p.id)
    },
  }))

  const staticCommands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Mission control & multi-agent pipeline overview',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4 text-[#B3441E]" />,
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav-projects',
      title: 'Projects & Backlog',
      subtitle: 'Repository workspaces and user stories',
      category: 'Navigation',
      icon: <FolderGit2 className="w-4 h-4 text-system" />,
      action: () => navigate('/projects'),
    },
    {
      id: 'nav-workspace',
      title: 'Workspace IDE',
      subtitle: 'Multi-agent code editor and terminal suite',
      category: 'Navigation',
      icon: <Code2 className="w-4 h-4 text-success" />,
      action: () => navigate('/workspace'),
    },
    {
      id: 'nav-agents',
      title: 'Agent Team Registry',
      subtitle: 'Role boundaries, capabilities, and flow graph',
      category: 'Navigation',
      icon: <Bot className="w-4 h-4 text-[#B3441E]" />,
      action: () => navigate('/agents'),
    },
    {
      id: 'nav-testing',
      title: 'Testing Engine',
      subtitle: 'Automated test execution & AI diagnostics',
      category: 'Navigation',
      icon: <TestTube2 className="w-4 h-4 text-[#0EA5E9]" />,
      action: () => navigate('/testing'),
    },
    {
      id: 'nav-evolution',
      title: 'Self-Evolution Center',
      subtitle: 'Autonomous prompt mutation & optimization loop',
      category: 'Navigation',
      icon: <Dna className="w-4 h-4 text-[#E8B4A0]" />,
      action: () => navigate('/evolution'),
    },
    {
      id: 'nav-memory',
      title: 'Knowledge & Memory',
      subtitle: 'Cognitive learnings & guidelines repository',
      category: 'Navigation',
      icon: <Database className="w-4 h-4 text-warning" />,
      action: () => navigate('/memory'),
    },
    {
      id: 'nav-logs',
      title: 'Observability & Logs',
      subtitle: 'Real-time telemetry streams and trace viewer',
      category: 'Navigation',
      icon: <Terminal className="w-4 h-4 text-success" />,
      action: () => navigate('/logs'),
    },
    {
      id: 'nav-monitoring',
      title: 'Health & Incident Center',
      subtitle: 'Telemetry monitors and AI root-cause mitigation',
      category: 'Navigation',
      icon: <Activity className="w-4 h-4 text-error" />,
      action: () => navigate('/monitoring'),
    },
    {
      id: 'nav-governance',
      title: 'AI Trust & Governance',
      subtitle: 'Policy engine, authorization, and audit trail',
      category: 'Navigation',
      icon: <ShieldCheck className="w-4 h-4 text-success" />,
      action: () => navigate('/governance'),
    },
    {
      id: 'nav-settings',
      title: 'Engine Configuration',
      subtitle: 'LLM providers, sandbox isolation, and API parameters',
      category: 'Navigation',
      icon: <Settings className="w-4 h-4 text-text-secondary" />,
      action: () => navigate('/settings'),
    },

    // Agent Quick Actions
    {
      id: 'agent-pm',
      title: 'Decompose Backlog with PM Agent',
      subtitle: 'Synthesize agile user stories and acceptance criteria',
      category: 'Agents',
      icon: <Bot className="w-4 h-4 text-[#B3441E]" />,
      action: () => navigate('/projects'),
      badge: 'PM Agent',
    },
    {
      id: 'agent-dev',
      title: 'Trigger Developer Implementation Run',
      subtitle: 'Execute full self-evolving multi-agent coding cycle',
      category: 'Agents',
      icon: <Play className="w-4 h-4 text-success" />,
      action: () => navigate('/dashboard'),
      badge: 'Dev Agent',
    },
    {
      id: 'agent-tester',
      title: 'Run Verification Test Suite',
      subtitle: 'Execute stress testing & boundary regression suite',
      category: 'Agents',
      icon: <TestTube2 className="w-4 h-4 text-[#0EA5E9]" />,
      action: () => navigate('/testing'),
      badge: 'Tester',
    },
    {
      id: 'agent-evolution',
      title: 'Compile Evolution Insights',
      subtitle: 'Reflect on recent failures and formulate new rules',
      category: 'Agents',
      icon: <Sparkles className="w-4 h-4 text-[#E8B4A0]" />,
      action: () => navigate('/evolution'),
      badge: 'Evolution',
    },

    // Studio Commands
    {
      id: 'cmd-simulate',
      title: 'Simulate Step-by-Step Execution',
      subtitle: 'Step through Manager → Architect → Dev → Test sequence',
      category: 'Commands',
      icon: <Zap className="w-4 h-4 text-warning" />,
      action: () => navigate('/dashboard'),
    },
    {
      id: 'cmd-audit',
      title: 'Inspect PolicyEngine Security Audit',
      subtitle: 'Review immutable compliance records and permissions',
      category: 'Commands',
      icon: <Lock className="w-4 h-4 text-error" />,
      action: () => navigate('/governance'),
    },
  ]

  const commands = [...projectCommands, ...staticCommands]

  const filtered = commands.filter((cmd) => {
    const q = query.toLowerCase().trim()
    if (!q) return true
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q)
    )
  })

  // Keyboard navigation inside command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action()
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filtered, selectedIndex, onClose])

  // Global Ctrl+K trigger listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          // Open
          setQuery('')
          setSelectedIndex(0)
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isOpen, onClose])

  // Auto-focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      setSelectedIndex(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Palette Card */}
      <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-command-modal overflow-hidden z-10 animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col max-h-[70vh]">
        {/* Search Header */}
        <div className="flex items-center px-5 py-4 border-b border-border bg-surface gap-3.5">
          <Search className="w-5 h-5 text-[#B3441E] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search studio modules, agents, commands, or documentation..."
            className="flex-1 bg-transparent border-none text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-sans"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-text-secondary bg-surface-secondary border border-border rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2.5 custom-scrollbar space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted font-mono">
              No matching commands or navigation routes found for "{query}".
            </div>
          ) : (
            filtered.map((item, index) => {
              const isSelected = index === selectedIndex
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl text-xs transition-all duration-120 cursor-pointer ${
                    isSelected
                      ? 'bg-surface-secondary text-text-primary border border-[rgba(179,68,30,0.4)] shadow-xs'
                      : 'text-text-secondary hover:bg-surface-secondary/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                        isSelected ? 'bg-surface-elevated border-[rgba(179,68,30,0.4)] shadow-[0_0_10px_rgba(179,68,30,0.2)]' : 'bg-surface-secondary border-border'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-text-primary flex items-center gap-2 font-sans">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-[rgba(179,68,30,0.15)] text-[#E8B4A0] border border-[rgba(179,68,30,0.3)] rounded-md">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-text-muted truncate mt-0.5 font-sans">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted flex-shrink-0 ml-3">
                    <span className="font-mono uppercase">{item.category}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 border-t border-border bg-surface-secondary flex items-center justify-between text-[11px] text-text-muted font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-2 py-0.5 bg-surface border border-border rounded text-[10px]">↵</kbd> Select
            </span>
          </div>
          <div className="text-[#B3441E] font-semibold">SE-MAESTRO OS</div>
        </div>
      </div>
    </div>
  )
}
