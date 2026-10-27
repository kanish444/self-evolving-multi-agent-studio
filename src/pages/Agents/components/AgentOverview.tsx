import React from 'react'
import { Bot, PlayCircle, CheckCircle, TrendingUp, Sparkles } from 'lucide-react'

interface AgentOverviewProps {
  totalAgents: number
  activeAgents: number
  completedTasks: number
  successRate: number
  currentIteration: number
}

export const AgentOverview: React.FC<AgentOverviewProps> = ({
  totalAgents,
  activeAgents,
  completedTasks,
  successRate,
  currentIteration
}) => {
  const stats = [
    {
      label: 'Registered Agents',
      value: String(totalAgents).padStart(2, '0'),
      icon: <Bot className="w-4 h-4 text-accent" />,
      color: 'bg-[rgba(179, 68, 30, 0.15)] text-accent border-[rgba(179, 68, 30, 0.3)]'
    },
    {
      label: 'Active Executing',
      value: String(activeAgents).padStart(2, '0'),
      icon: <PlayCircle className="w-4 h-4 text-success animate-pulse" />,
      color: 'bg-[rgba(22, 163, 74, 0.15)] text-success border-[rgba(22, 163, 74, 0.3)]'
    },
    {
      label: 'Tasks Resolved',
      value: String(completedTasks).padStart(2, '0'),
      icon: <CheckCircle className="w-4 h-4 text-accent-secondary" />,
      color: 'bg-[rgba(184, 134, 11, 0.15)] text-system border-[rgba(184, 134, 11, 0.3)]'
    },
    {
      label: 'Team Success Rate',
      value: `${successRate}%`,
      icon: <TrendingUp className="w-4 h-4 text-success" />,
      color: 'bg-[rgba(22, 163, 74, 0.15)] text-success border-[rgba(22, 163, 74, 0.3)]'
    },
    {
      label: 'Active Iteration',
      value: `V${currentIteration}`,
      icon: <Sparkles className="w-4 h-4 text-warning" />,
      color: 'bg-[rgba(217, 119, 6, 0.15)] text-warning border-[rgba(217, 119, 6, 0.3)]'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className="bg-surface border border-border p-4 rounded-2xl flex items-start justify-between shadow-command-card select-none transition-all duration-160 hover:border-border hover:shadow-command-hover"
        >
          <div>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
              {stat.label}
            </span>
            <div className="text-lg font-bold text-text-primary mt-1 font-mono leading-none">
              {stat.value}
            </div>
          </div>
          <div className={`p-2 rounded-xl border ${stat.color} flex-shrink-0 mt-0.5 shadow-xs`}>
            {stat.icon}
          </div>
        </div>
      ))}
    </div>
  )
}
