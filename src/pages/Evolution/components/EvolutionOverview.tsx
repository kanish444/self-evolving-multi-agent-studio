import React from 'react'
import { Card } from '../../../components/ui/Card'
import { GitBranch, Target, ShieldAlert, BookOpen, GitMerge, Sparkles } from 'lucide-react'

export const EvolutionOverview: React.FC = () => {
  const metrics = [
    {
      label: 'Total Iterations',
      value: '03',
      icon: <GitBranch className="w-4 h-4 text-accent" />,
      bg: 'bg-accent/10 border-accent/30',
    },
    {
      label: 'Best Success Rate',
      value: '94%',
      icon: <Target className="w-4 h-4 text-success" />,
      bg: 'bg-success/10 border-success/30',
    },
    {
      label: 'Failures Analyzed',
      value: '17',
      icon: <ShieldAlert className="w-4 h-4 text-error" />,
      bg: 'bg-error/10 border-error/30',
    },
    {
      label: 'Total Learnings',
      value: '12',
      icon: <BookOpen className="w-4 h-4 text-system" />,
      bg: 'bg-system/10 border-system/30',
    },
    {
      label: 'Workflow Improvements',
      value: '08',
      icon: <GitMerge className="w-4 h-4 text-warning" />,
      bg: 'bg-warning/10 border-warning/30',
    },
    {
      label: 'Evolution Score',
      value: '+21%',
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      bg: 'bg-accent/10 border-accent/30',
      valueClass: 'text-accent font-bold',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((m, idx) => (
        <Card
          key={idx}
          className={`flex items-center gap-3 p-3.5 border ${m.bg} shadow-command-card`}
        >
          <div className="p-2 bg-surface-base rounded border border-border/40 shadow-xs flex-shrink-0">
            {m.icon}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block font-mono">
              {m.label}
            </span>
            <span className={`text-base font-bold font-mono text-text-primary mt-0.5 block ${m.valueClass || ''}`}>
              {m.value}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}
