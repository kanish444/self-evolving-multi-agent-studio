import React from 'react'
import { Card } from '../../../components/ui/Card'
import { ShieldAlert } from 'lucide-react'
import type { FailurePattern } from '../mockData'

interface FailurePatternChartProps {
  patterns: FailurePattern[]
}

export const FailurePatternChart: React.FC<FailurePatternChartProps> = ({ patterns }) => {
  const colors = [
    { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-rose-700' },
    { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-700' },
    { bg: 'bg-sky-500', border: 'border-sky-600', text: 'text-sky-750' },
    { bg: 'bg-slate-400', border: 'border-slate-500', text: 'text-slate-600' },
  ]

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <ShieldAlert className="w-4 h-4 text-rose-500" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Failure Pattern Distribution
        </h3>
      </div>

      <div className="space-y-3.5">
        {patterns.map((item, idx) => {
          const color = colors[idx % colors.length]
          return (
            <div key={item.category} className="space-y-1 text-xs">
              <div className="flex items-center justify-between text-text-primary">
                <span className="font-semibold font-mono text-[11px]">{item.category}</span>
                <span className="font-mono text-text-secondary">
                  {item.count} occurrences ({item.percentage}%)
                </span>
              </div>
              <div className="bg-slate-100 border border-slate-200/40 h-3 rounded-full overflow-hidden flex">
                <div
                  className={`${color.bg} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
