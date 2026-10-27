import React from 'react'
import { X, CheckCircle2, Circle, TrendingUp, Cpu, Activity, FileCheck } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import type { Agent } from '../mockData'

interface AgentDetailProps {
  agent: Agent | null
  isOpen: boolean
  onClose: () => void
  onToggleSubtask: (agentId: string, subtaskId: number) => void
}

export const AgentDetail: React.FC<AgentDetailProps> = ({
  agent,
  isOpen,
  onClose,
  onToggleSubtask
}) => {
  if (!isOpen || !agent) return null

  const getSubtaskIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
      case 'in-progress':
        return <span className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin flex-shrink-0" />
      case 'pending':
      default:
        return <Circle className="w-4 h-4 text-text-muted hover:text-text-secondary transition-colors flex-shrink-0" />
    }
  }

  const getSubtaskStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-text-muted line-through opacity-70'
      case 'in-progress':
        return 'text-accent font-semibold animate-pulse'
      case 'pending':
      default:
        return 'text-text-secondary'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none p-4">
      {/* Dark overlay backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <div className="relative bg-surface w-full max-w-xl mx-auto rounded-2xl border border-border shadow-command-modal flex flex-col max-h-[85vh] overflow-hidden animate-page-enter">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border bg-surface-secondary flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[rgba(179, 68, 30, 0.15)] border border-[rgba(179, 68, 30, 0.3)] rounded-lg text-accent">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-text-primary font-display">{agent.name} Profile</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-surface-elevated rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5 select-text">
          {/* Active Job summary & Progress */}
          <div className="bg-surface-secondary rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block font-mono">Role Description</span>
                <p className="text-text-primary font-sans font-medium text-xs">{agent.role}</p>
              </div>
              <Badge variant={agent.status === 'RUNNING' || agent.status === 'IN PROGRESS' ? 'ai' : agent.status === 'COMPLETED' ? 'success' : 'neutral'} size="xs">
                {agent.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px] font-mono border-t border-border pt-3">
              <div>
                <span className="text-text-muted">Target Model:</span>
                <span className="text-accent font-semibold block mt-0.5">{agent.model}</span>
              </div>
              <div>
                <span className="text-text-muted">Active Project:</span>
                <span className="text-text-primary font-semibold block mt-0.5">Student Management System</span>
              </div>
            </div>

            {/* Progress indicator */}
            {agent.progress > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-border">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-text-muted">Task Completion Progress:</span>
                  <span className="text-accent font-bold">{agent.progress}%</span>
                </div>
                <div className="w-full bg-background border border-border h-2.5 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="bg-gradient-to-r from-accent to-[#B8860B] h-full rounded-full transition-all duration-700"
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Grid: Subtasks List & Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Subtasks Checklist */}
            <div className="border border-border rounded-xl overflow-hidden flex flex-col h-56 select-none bg-surface-secondary">
              <div className="px-3.5 py-2.5 bg-surface-elevated border-b border-border flex items-center gap-1.5 flex-shrink-0">
                <FileCheck className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider font-mono">Subtasks checklist</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2">
                {agent.subtasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleSubtask(agent.id, task.id)}
                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors text-[11px] font-mono group"
                  >
                    {getSubtaskIcon(task.status)}
                    <span className={`flex-1 truncate ${getSubtaskStyle(task.status)}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Ratios */}
            <div className="border border-border rounded-xl overflow-hidden flex flex-col h-56 bg-surface-secondary select-none">
              <div className="px-3.5 py-2.5 bg-surface-elevated border-b border-border flex items-center gap-1.5 flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider font-mono">Operational Metrics</span>
              </div>
              <div className="flex-1 p-3 text-[10px] font-mono text-text-secondary space-y-2.5 flex flex-col justify-center">
                <div className="flex justify-between py-1 border-b border-border">
                  <span>Assigned Tasks:</span>
                  <span className="text-text-primary font-bold">{agent.performance.tasks}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span>Successful Runs:</span>
                  <span className="text-success font-bold">{agent.performance.completed}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span>Failed Operations:</span>
                  <span className="text-error font-bold">{agent.performance.failed}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span>Success Ratio:</span>
                  <span className="text-text-primary font-bold">{agent.performance.successRate}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Avg Latency:</span>
                  <span className="text-text-primary font-semibold">{agent.performance.avgExecTime}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Recent Activity stream */}
          <div className="border border-border rounded-xl overflow-hidden flex flex-col h-44 bg-surface-secondary">
            <div className="px-3.5 py-2.5 bg-surface-elevated border-b border-border flex items-center gap-1.5 flex-shrink-0 select-none">
              <Activity className="w-3.5 h-3.5 text-accent" />
              <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider font-mono">Recent Operations Feed</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
              {agent.recentActivity.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-[10.5px] font-mono">
                  <span className="text-text-muted flex-shrink-0 font-medium">[{log.time}]</span>
                  <p className="text-text-primary flex-1 leading-normal">{log.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-border bg-surface-secondary flex justify-end flex-shrink-0 select-none">
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </div>
  )
}
