import React from 'react'
import { FolderKanban, Compass, Code2, FlaskConical, Eye, Wrench, Sparkles, CheckSquare, Clock, Shield, Wrench as ToolIcon } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import type { Agent } from '../mockData'

interface AgentCardProps {
  agent: Agent
  onSelectAgent: (id: string) => void
  onViewAgent: (agent: Agent) => void
  isSelected: boolean
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onSelectAgent,
  onViewAgent,
  isSelected
}) => {
  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'pm': return <FolderKanban className="w-4 h-4" />
      case 'architect': return <Compass className="w-4 h-4" />
      case 'developer': return <Code2 className="w-4 h-4" />
      case 'tester': return <FlaskConical className="w-4 h-4" />
      case 'reviewer': return <Eye className="w-4 h-4" />
      case 'debugger': return <Wrench className="w-4 h-4" />
      case 'evolution': return <Sparkles className="w-4 h-4" />
      default: return <Code2 className="w-4 h-4" />
    }
  }

  const getAgentRisk = (id: string): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (id === 'developer' || id === 'debugger') return 'MEDIUM'
    if (id === 'evolution' || id === 'release') return 'HIGH'
    return 'LOW'
  }

  const risk = getAgentRisk(agent.id)

  return (
    <div
      onClick={() => onSelectAgent(agent.id)}
      className={`border rounded-2xl p-5 flex flex-col justify-between select-none transition-all duration-160 cursor-pointer ${
        isSelected
          ? 'border-[rgba(179, 68, 30, 0.6)] bg-[rgba(179, 68, 30, 0.12)] shadow-command-glow'
          : 'bg-surface border-border hover:border-border shadow-command-card hover:shadow-command-hover'
      }`}
    >
      <div className="space-y-3.5">
        {/* Header: Title, Icon & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-[rgba(179, 68, 30, 0.15)] border border-[rgba(179, 68, 30, 0.3)] rounded-xl text-accent flex-shrink-0 shadow-xs">
              {getAgentIcon(agent.id)}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-bold text-text-primary truncate">
                {agent.name}
              </h3>
              <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider block mt-0.5 font-bold">
                {agent.category}
              </span>
            </div>
          </div>
          <Badge
            variant={
              agent.status === 'RUNNING' || agent.status === 'IN PROGRESS'
                ? 'ai'
                : agent.status === 'COMPLETED'
                ? 'success'
                : agent.status === 'FAILED'
                ? 'error'
                : 'neutral'
            }
            size="xs"
          >
            {agent.status}
          </Badge>
        </div>

        {/* Role Description */}
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 h-8 font-sans">
          {agent.role}
        </p>

        {/* Progress & Risk Row */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-text-muted">Execution Progress:</span>
            <span className="text-accent font-bold">{agent.progress || 82}%</span>
          </div>
          <div className="w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border">
            <div
              className="bg-gradient-to-r from-accent to-[#B8860B] h-full transition-all duration-300 rounded-full"
              style={{ width: `${agent.progress || 82}%` }}
            />
          </div>
        </div>

        {/* Details & Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-text-secondary border-t border-b border-border py-2.5">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-text-muted" />
            <span className="truncate">Tasks: <span className="font-bold text-text-primary">{agent.tasksCompleted}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-warning" />
            <span>Risk: <span className={`font-bold ${risk === 'HIGH' ? 'text-error' : risk === 'MEDIUM' ? 'text-warning' : 'text-success'}`}>{risk}</span></span>
          </div>
        </div>

        {/* Current Task Box */}
        <div className="bg-surface-secondary rounded-xl border border-border p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
              Current Task
            </span>
            <span className="text-[10px] text-system font-mono flex items-center gap-1 font-semibold">
              <ToolIcon className="w-2.5 h-2.5" /> sandbox
            </span>
          </div>
          <p className="text-xs text-text-primary font-mono truncate font-medium">
            {agent.currentTask === 'Idle' ? 'System Standby' : agent.currentTask}
          </p>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>{agent.lastActive}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewAgent(agent)
          }}
          className="px-3 py-1 border border-border bg-surface-secondary hover:bg-surface-elevated text-accent font-bold rounded-lg hover:border-[rgba(179, 68, 30, 0.4)] transition-colors cursor-pointer text-xs shadow-xs"
        >
          Inspect Profile
        </button>
      </div>
    </div>
  )
}
