import React from 'react'
import { Card } from '../../../components/ui/Card'
import { Sparkles, ArrowUpRight } from 'lucide-react'
import type { EvolutionScoreBreakdown } from '../mockData'

interface EvolutionScoreProps {
  scoreBreakdown: EvolutionScoreBreakdown[]
}

export const EvolutionScore: React.FC<EvolutionScoreProps> = ({ scoreBreakdown }) => {
  return (
    <Card className="p-4 border border-border/80 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-500 animate-pulse" />
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Evolution Score Breakdown
          </h3>
        </div>
        <span className="text-[10px] font-bold font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          STATUS: IMPROVING
        </span>
      </div>

      <div className="flex items-center gap-4 py-1">
        <div className="text-center bg-teal-50/50 border border-teal-100/80 rounded-lg p-3 min-w-[90px] shadow-2xs">
          <span className="text-[9px] font-bold text-teal-800 uppercase tracking-wider font-mono">
            Net Index
          </span>
          <div className="text-xl font-bold font-mono text-teal-600 mt-1 flex items-center justify-center gap-0.5">
            +21%
            <ArrowUpRight className="w-4 h-4 text-teal-500" />
          </div>
          <span className="text-[8px] font-mono text-text-muted mt-0.5 block">Cross-Iteration</span>
        </div>

        <p className="text-xs text-text-secondary leading-relaxed font-sans">
          Evolution score metrics represent aggregate improvement indices based on static analysis audits, unit execution rates, and execution time speedups across generations.
        </p>
      </div>

      <div className="space-y-2.5 pt-1.5">
        {scoreBreakdown.map((item) => (
          <div key={item.label} className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-text-secondary font-mono text-[10px]">
              <span>{item.label}</span>
              <span className="font-bold text-emerald-600">+{item.value}%</span>
            </div>
            <div className="bg-slate-100 border border-slate-200/40 h-2 rounded-full overflow-hidden">
              <div
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${item.value * 2.2}%` }} // Scale factor for presentation
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
