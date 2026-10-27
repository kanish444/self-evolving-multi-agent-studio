import React from 'react'
import { FolderKanban, Compass, Code2, FlaskConical, Eye, Wrench, Sparkles, ChevronDown } from 'lucide-react'
import type { Agent } from '../mockData'

interface AgentNetworkProps {
  agents: Agent[]
  selectedAgentId: string
  onSelectAgent: (id: string) => void
}

export const AgentNetwork: React.FC<AgentNetworkProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent
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

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'border-[rgba(22, 163, 74, 0.4)] text-success bg-[rgba(22, 163, 74, 0.12)]'
      case 'IN PROGRESS':
      case 'RUNNING':
        return 'border-[rgba(179, 68, 30, 0.45)] text-accent bg-[rgba(179, 68, 30, 0.15)] ring-1 ring-accent/40 animate-pulse'
      case 'ANALYZING':
        return 'border-[rgba(217, 119, 6, 0.45)] text-warning bg-[rgba(217, 119, 6, 0.15)] ring-1 ring-[#D97706]/40 animate-pulse'
      case 'FAILED':
        return 'border-[rgba(225, 29, 72, 0.45)] text-error bg-[rgba(225, 29, 72, 0.15)]'
      case 'WAITING':
      case 'IDLE':
      default:
        return 'border-border text-text-muted bg-surface'
    }
  }

  const renderNode = (id: string, className = '') => {
    const agent = agents.find(a => a.id === id)
    if (!agent) return null

    const isSelected = selectedAgentId === id
    const statusColor = getStatusColor(agent.status)

    return (
      <div
        key={id}
        onClick={() => onSelectAgent(id)}
        className={`w-56 border rounded-xl p-3 shadow-command-card cursor-pointer select-none transition-all duration-160 ${className} ${
          isSelected
            ? 'border-[rgba(179, 68, 30, 0.6)] bg-[rgba(179, 68, 30, 0.15)] shadow-command-glow'
            : 'bg-surface-secondary border-border hover:border-border hover:bg-surface-elevated'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${statusColor}`}>
            {getAgentIcon(id)}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-display text-xs font-bold text-text-primary block truncate">
              {agent.name.replace(' Agent', '')}
            </span>
            <span className="text-[10px] text-text-secondary block truncate font-mono leading-normal">
              {agent.currentTask === 'Idle' ? 'System Standby' : agent.currentTask}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono border-t border-border pt-2">
          <span className="text-text-muted">{agent.model}</span>
          <span className={`font-bold flex items-center gap-1 ${
            agent.status === 'COMPLETED' ? 'text-success' :
            agent.status === 'IN PROGRESS' || agent.status === 'RUNNING' ? 'text-accent' :
            agent.status === 'ANALYZING' ? 'text-warning' :
            'text-text-muted'
          }`}>
            {agent.status}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center relative overflow-hidden select-none shadow-command-card">
      <div className="w-full border-b border-border pb-3 mb-6 flex items-center justify-between">
        <span className="font-display text-xs font-bold text-text-primary uppercase tracking-wider">
          Multi-Agent Orchestration Flow Graph
        </span>
        <span className="text-[11px] text-text-muted font-mono">
          Click any agent node to inspect telemetry & handoffs
        </span>
      </div>

      <div className="flex flex-col items-center gap-4 w-full relative min-w-[550px] md:min-w-0 overflow-x-auto custom-scrollbar pb-2">
        {/* ROW 1: Project Manager */}
        <div className="flex justify-center">
          {renderNode('pm')}
        </div>
        <ChevronDown className="w-4 h-4 text-text-muted" />

        {/* ROW 2: Architect */}
        <div className="flex justify-center">
          {renderNode('architect')}
        </div>
        <ChevronDown className="w-4 h-4 text-text-muted" />

        {/* ROW 3: Developer */}
        <div className="flex justify-center">
          {renderNode('developer')}
        </div>

        {/* Split Connectors Line */}
        <div className="flex justify-between w-64 h-4 relative">
          <div className="w-px h-full bg-surface-secondary absolute left-0" />
          <div className="h-px w-full bg-surface-secondary absolute top-0" />
          <div className="w-px h-full bg-surface-secondary absolute right-0" />
        </div>

        {/* ROW 4: Tester & Code Reviewer */}
        <div className="flex justify-between w-[480px] gap-8">
          {renderNode('tester')}
          {renderNode('reviewer')}
        </div>

        {/* Join Connectors Line */}
        <div className="flex justify-between w-[480px] h-6 relative">
          <div className="w-px h-full bg-surface-secondary absolute left-28" />
          <div className="h-px w-64 bg-surface-secondary absolute bottom-0 left-28" />
          <div className="w-px h-full bg-surface-secondary absolute right-28" />
        </div>
        <ChevronDown className="w-4 h-4 text-text-muted" />

        {/* ROW 5: Debugger */}
        <div className="flex justify-center">
          {renderNode('debugger')}
        </div>
        <ChevronDown className="w-4 h-4 text-text-muted" />

        {/* ROW 6: Evolution Agent */}
        <div className="flex justify-center">
          {renderNode('evolution')}
        </div>
      </div>
    </div>
  )
}
