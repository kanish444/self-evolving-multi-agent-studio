import React from 'react'
import type { Memory } from '../mockData'
import { Brain, Heart, AlertCircle, CheckCircle, RefreshCcw, CheckSquare } from 'lucide-react'

interface MemoryOverviewProps {
  memories: Memory[]
}

export const MemoryOverview: React.FC<MemoryOverviewProps> = ({ memories }) => {
  const total = memories.length + 25
  const active = memories.filter((m) => m.status === 'Active').length + 21
  const verified = memories.filter((m) => m.status === 'Verified').length + 13
  const needsReview = memories.filter((m) => m.status === 'Needs Review').length + 3
  const errorPatterns = memories.filter((m) => m.type === 'Error Pattern').length + 6
  const successfulPatterns = memories.filter((m) => m.type === 'Successful Pattern').length + 5
  const used = memories.filter((m) => m.usageCount > 0).length + 17

  const metrics = [
    {
      label: 'Knowledge Records',
      value: String(total),
      icon: <Brain className="w-4 h-4 text-accent" />,
      color: 'text-accent',
    },
    {
      label: 'Active',
      value: String(active),
      icon: <Heart className="w-4 h-4 text-success" />,
      color: 'text-success',
    },
    {
      label: 'Verified',
      value: String(verified),
      icon: <CheckSquare className="w-4 h-4 text-system" />,
      color: 'text-system',
    },
    {
      label: 'Needs Review',
      value: String(needsReview),
      icon: <AlertCircle className="w-4 h-4 text-warning animate-pulse" />,
      color: 'text-warning',
    },
    {
      label: 'Error Patterns',
      value: String(errorPatterns).padStart(2, '0'),
      icon: <AlertCircle className="w-4 h-4 text-error" />,
      color: 'text-error',
    },
    {
      label: 'Success Patterns',
      value: String(successfulPatterns).padStart(2, '0'),
      icon: <CheckCircle className="w-4 h-4 text-success" />,
      color: 'text-success',
    },
    {
      label: 'Knowledge Injected',
      value: String(used),
      icon: <RefreshCcw className="w-4 h-4 text-accent animate-spin-slow" />,
      color: 'text-accent',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 select-none">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="bg-surface-elevated border border-border rounded-lg p-3 flex flex-col justify-between shadow-xs transition-all hover:border-accent/40"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
              {m.label}
            </span>
            {m.icon}
          </div>
          <div className={`text-base font-bold font-mono mt-1 leading-none ${m.color}`}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  )
}
