import React from 'react'
import { Card } from '../../../components/ui/Card'
import { CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react'

interface RetestFlowProps {
  beforePassCount: number
  afterPassCount: number
  totalCount: number
}

export const RetestFlow: React.FC<RetestFlowProps> = ({
  beforePassCount,
  afterPassCount,
  totalCount,
}) => {
  const beforeRate = Math.round((beforePassCount / totalCount) * 100)
  const afterRate = Math.round((afterPassCount / totalCount) * 100)
  const improvement = afterRate - beforeRate

  const flowSteps = [
    { label: 'FAIL', bg: 'bg-red-500/10 border-red-500/30 text-red-400' },
    { label: 'ANALYZE', bg: 'bg-[rgba(179, 68, 30, 0.1)] border-[rgba(179, 68, 30, 0.3)] text-accent' },
    { label: 'FIX', bg: 'bg-[rgba(179, 68, 30, 0.15)] border-[rgba(179, 68, 30, 0.4)] text-accent' },
    { label: 'RETEST', bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' },
    { label: 'PASS', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold' },
  ]

  return (
    <Card className="p-4 border border-border bg-surface shadow-command-card space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <TrendingUp className="w-4 h-4 text-accent" />
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Evolution Impact & Retest Flow
        </span>
      </div>

      {/* Retest Pipeline Diagram */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 custom-scrollbar">
        {flowSteps.map((step, index) => (
          <React.Fragment key={index}>
            <div
              className={`flex-1 min-w-[70px] text-center py-1.5 border rounded text-[10px] font-bold font-mono tracking-wide ${step.bg}`}
            >
              {step.label}
            </div>
            {index < flowSteps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="bg-surface-secondary border border-border rounded-lg p-2.5 text-center">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Before Fix
          </span>
          <div className="text-xs font-bold font-mono text-text-secondary mt-1">
            {beforePassCount} / {totalCount} passed
          </div>
          <div className="text-[10px] text-text-muted font-mono mt-0.5">({beforeRate}%)</div>
        </div>

        <div className="bg-surface-secondary border border-border rounded-lg p-2.5 text-center">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
            After Fix
          </span>
          <div className="text-xs font-bold font-mono text-emerald-400 mt-1 flex items-center justify-center gap-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {afterPassCount} / {totalCount} passed
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5 font-bold">({afterRate}%)</div>
        </div>

        <div className="bg-[rgba(179, 68, 30, 0.08)] border border-[rgba(179, 68, 30, 0.25)] rounded-lg p-2.5 text-center">
          <span className="text-[9px] font-bold text-accent uppercase tracking-wider font-mono">
            Improvement
          </span>
          <div className="text-xs font-bold font-mono text-accent mt-1">
            +{improvement}%
          </div>
          <div className="text-[10px] text-text-muted font-mono mt-0.5">Success delta</div>
        </div>
      </div>
    </Card>
  )
}
