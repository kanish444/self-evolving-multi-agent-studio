import React from 'react'
import type { TestStats } from '../mockData'
import { CheckCircle2, XCircle, PlayCircle, SkipForward, Percent, Clock, FlaskConical } from 'lucide-react'

interface TestSummaryProps {
  stats: TestStats
}

export const TestSummary: React.FC<TestSummaryProps> = ({ stats }) => {
  const items = [
    {
      label: 'Total Tests',
      value: stats.total,
      icon: <FlaskConical className="w-4 h-4 text-text-secondary" />,
      color: 'text-text-primary',
    },
    {
      label: 'Passed',
      value: stats.passed,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      color: 'text-emerald-400',
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: <XCircle className="w-4 h-4 text-red-400" />,
      color: 'text-red-400',
    },
    {
      label: 'Running',
      value: stats.running,
      icon: <PlayCircle className="w-4 h-4 text-cyan-400 animate-spin" />,
      color: 'text-cyan-400',
    },
    {
      label: 'Skipped',
      value: stats.skipped,
      icon: <SkipForward className="w-4 h-4 text-text-muted" />,
      color: 'text-text-muted',
    },
    {
      label: 'Pass Rate',
      value: `${stats.passRate}%`,
      icon: <Percent className="w-4 h-4 text-accent" />,
      color: 'text-accent',
    },
    {
      label: 'Duration',
      value: stats.executionTime,
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      color: 'text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bg-surface border border-border rounded-lg p-3 flex flex-col justify-between shadow-command-card select-none transition-all hover:border-[rgba(179, 68, 30, 0.4)]"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
              {item.label}
            </span>
            {item.icon}
          </div>
          <div className={`text-base font-bold font-mono mt-1.5 leading-none ${item.color}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}
