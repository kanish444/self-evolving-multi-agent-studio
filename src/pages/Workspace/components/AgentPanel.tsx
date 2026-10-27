import React, { useState } from 'react'
import { Bot, CheckCircle2, Circle, ChevronDown, ChevronUp, Cpu, Activity, FileCheck } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import { MOCK_AGENT_INFO } from '../mockData'

interface AgentPanelProps {
  agentInfo: typeof MOCK_AGENT_INFO
  onToggleSubtask?: (subtaskId: number) => void
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  agentInfo,
  onToggleSubtask
}) => {
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(true)
  const [isActivityExpanded, setIsActivityExpanded] = useState(true)
  const [isContextExpanded, setIsContextExpanded] = useState(true)

  const getSubtaskIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-success" />
      case 'in-progress':
        return <span className="w-3 h-3 rounded-full border-2 border-accent border-t-transparent animate-spin flex-shrink-0" />
      case 'pending':
      default:
        return <Circle className="w-3.5 h-3.5 text-text-muted hover:text-text-secondary transition-colors" />
    }
  }

  const getSubtaskStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-text-muted line-through'
      case 'in-progress':
        return 'text-accent font-semibold'
      case 'pending':
      default:
        return 'text-text-secondary'
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface-base border-l border-border overflow-hidden select-none font-sans">
      {/* Panel Header */}
      <div className="h-10 px-3.5 border-b border-border bg-surface-secondary flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider font-mono">
            AI Assistant
          </span>
        </div>
        <Badge variant="ai" size="xs">
          {agentInfo.status}
        </Badge>
      </div>

      {/* Main Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-4">
        {/* Active Agent Info & Progress */}
        <div className="bg-surface-secondary border border-border rounded-xl p-3.5 space-y-3 shadow-2xs">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-display text-xs font-bold text-text-primary">{agentInfo.name}</h4>
              <p className="text-[10.5px] text-text-muted mt-0.5 font-mono">Role: {agentInfo.context.role}</p>
            </div>
            <span className="text-xs font-bold text-accent font-mono bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md">
              {agentInfo.progress}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-surface-base border border-border h-2 rounded-full overflow-hidden">
            <div
              className="bg-accent h-full transition-all duration-300 rounded-full"
              style={{ width: `${agentInfo.progress}%` }}
            />
          </div>

          <div className="text-xs text-text-secondary bg-surface-base border border-border rounded-lg p-2.5 font-sans">
            <span className="text-text-muted block text-[10px] uppercase font-bold font-mono">Active Task</span>
            <span className="text-text-primary font-semibold">{agentInfo.context.task}</span>
          </div>
        </div>

        {/* Subtasks Section */}
        <div className="space-y-2">
          <button
            onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-text-primary uppercase tracking-wider font-mono py-1 hover:text-accent transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-accent" />
              Tasks ({agentInfo.subtasks.filter(s => s.status === 'completed').length}/{agentInfo.subtasks.length})
            </span>
            {isSubtasksExpanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
          </button>

          {isSubtasksExpanded && (
            <div className="space-y-1 bg-surface-secondary border border-border rounded-xl p-2 shadow-2xs">
              {agentInfo.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  onClick={() => onToggleSubtask && onToggleSubtask(subtask.id)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors text-xs"
                >
                  {getSubtaskIcon(subtask.status)}
                  <span className={`flex-1 truncate ${getSubtaskStyle(subtask.status)}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Stream */}
        <div className="space-y-2">
          <button
            onClick={() => setIsActivityExpanded(!isActivityExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-text-primary uppercase tracking-wider font-mono py-1 hover:text-accent transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-accent-secondary" />
              Recent Agent Actions
            </span>
            {isActivityExpanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
          </button>

          {isActivityExpanded && (
            <div className="space-y-2 bg-surface-secondary border border-border rounded-xl p-3 font-mono text-[11px] shadow-2xs">
              {agentInfo.activity.map((act, idx) => (
                <div key={idx} className="border-l-2 border-accent/40 pl-2.5 space-y-0.5">
                  <div className="flex items-center justify-between text-[10px] text-text-muted">
                    <span className="text-accent font-bold">{act.action}</span>
                    <span>{act.time}</span>
                  </div>
                  <div className="text-text-secondary text-xs font-sans">{act.agent}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Context */}
        <div className="space-y-2">
          <button
            onClick={() => setIsContextExpanded(!isContextExpanded)}
            className="w-full flex items-center justify-between text-xs font-bold text-text-primary uppercase tracking-wider font-mono py-1 hover:text-accent transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-warning" />
              Telemetry
            </span>
            {isContextExpanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
          </button>

          {isContextExpanded && (
            <div className="grid grid-cols-2 gap-2 bg-surface-secondary border border-border rounded-xl p-3 font-mono text-xs text-text-secondary shadow-2xs">
              <div>
                <span className="text-text-muted block text-[10px]">Model:</span>
                <span className="text-text-primary font-semibold">{agentInfo.context.model}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">Modified:</span>
                <span className="text-accent font-bold">{agentInfo.context.filesModified} files</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">Added:</span>
                <span className="text-success font-bold">+{agentInfo.context.linesAdded} lines</span>
              </div>
              <div>
                <span className="text-text-muted block text-[10px]">Removed:</span>
                <span className="text-error font-bold">-{agentInfo.context.linesRemoved} lines</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
