import React from 'react'
import { Layers } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import type { TaskQueueItem } from '../mockData'

interface AgentTaskQueueProps {
  tasks: TaskQueueItem[]
}

export const AgentTaskQueue: React.FC<AgentTaskQueueProps> = ({
  tasks
}) => {
  const getPriorityBadge = (priority: TaskQueueItem['priority']) => {
    switch (priority) {
      case 'High':
        return <Badge variant="error" size="xs">HIGH</Badge>
      case 'Medium':
        return <Badge variant="warning" size="xs">MED</Badge>
      case 'Low':
      default:
        return <Badge variant="neutral" size="xs">LOW</Badge>
    }
  }

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase()
    if (s.includes('progress') || s.includes('run')) return 'text-accent font-semibold animate-pulse'
    if (s.includes('analyz')) return 'text-warning font-semibold animate-pulse'
    if (s.includes('wait')) return 'text-text-muted font-medium'
    return 'text-success font-medium'
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-command-card select-none">
      {/* Header */}
      <div className="border-b border-border pb-3 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Multi-Agent Task Queue
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          {tasks.length} queued / active tasks
        </span>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left font-mono border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-border text-[10px] text-text-muted uppercase tracking-wider">
              <th className="pb-2.5 font-semibold">Task</th>
              <th className="pb-2.5 font-semibold w-40">Assigned Agent</th>
              <th className="pb-2.5 font-semibold text-center w-20">Priority</th>
              <th className="pb-2.5 font-semibold w-24">Status</th>
              <th className="pb-2.5 font-semibold w-36">Progress</th>
              <th className="pb-2.5 font-semibold text-right w-24">Started At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-[11px] text-text-secondary">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-surface-secondary/50 transition-colors">
                <td className="py-2.5 font-semibold text-text-primary font-sans text-xs">
                  {task.task}
                </td>
                <td className="py-2.5 text-text-secondary">
                  {task.agent}
                </td>
                <td className="py-2.5 text-center">
                  {getPriorityBadge(task.priority)}
                </td>
                <td className={`py-2.5 ${getStatusStyle(task.status)}`}>
                  {task.status}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary w-8">{task.progress}%</span>
                    <div className="flex-1 bg-background border border-border h-1.5 rounded-full overflow-hidden max-w-[80px]">
                      <div
                        className="bg-gradient-to-r from-accent to-[#B8860B] h-full rounded-full transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-2.5 text-right text-text-muted">
                  {task.started}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
