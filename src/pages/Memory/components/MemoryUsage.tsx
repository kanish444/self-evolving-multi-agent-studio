import React from 'react'
import type { Memory } from '../mockData'
import { Card } from '../../../components/ui/Card'
import { RefreshCcw, Cpu, CheckCircle2, TrendingUp } from 'lucide-react'

interface MemoryUsageProps {
  memory: Memory
}

export const MemoryUsage: React.FC<MemoryUsageProps> = ({ memory }) => {
  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <RefreshCcw className="w-4 h-4 text-accent animate-spin-slow" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Memory Usage & Reuse tracking
        </h3>
      </div>

      <div className="space-y-3.5 text-xs">
        <div className="grid grid-cols-2 gap-3 text-center font-mono">
          <div className="bg-surface-secondary border border-border rounded p-2.5">
            <span className="text-[8px] text-text-muted uppercase block leading-none">
              Applications
            </span>
            <span className="text-sm font-bold text-text-primary mt-1 block">
              {memory.usageCount} tasks
            </span>
          </div>

          <div className="bg-surface-secondary border border-border rounded p-2.5">
            <span className="text-[8px] text-text-muted uppercase block leading-none">
              Re-use Success
            </span>
            <span className="text-sm font-bold text-success mt-1 block flex items-center justify-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              {memory.successCount} / {memory.usageCount}
            </span>
          </div>
        </div>

        {/* Success rate progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary">
            <span>Successful Application Rate</span>
            <span className="font-bold text-success">{memory.successRate}%</span>
          </div>
          <div className="bg-surface-secondary border border-border h-2 rounded-full overflow-hidden">
            <div
              className="bg-success h-full rounded-full transition-all duration-300"
              style={{ width: `${memory.successRate}%` }}
            />
          </div>
        </div>

        {/* Consumed Agents list */}
        <div className="space-y-2 pt-1 border-t border-border/40">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
            Used By Agent Models
          </span>
          <div className="flex flex-wrap gap-1.5">
            {memory.relatedAgents.map((agent) => (
              <span
                key={agent}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-accent/10 border border-accent/20 text-accent font-bold font-mono text-[9px] shadow-2xs animate-in fade-in"
              >
                <Cpu className="w-3 h-3 text-accent" />
                {agent}
              </span>
            ))}
          </div>
        </div>

        {/* Impact outcomes banner */}
        <div className="bg-accent/10 border border-accent/20 rounded-md p-3.5 flex items-start gap-2.5">
          <TrendingUp className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-accent uppercase tracking-wider font-mono block leading-none mb-1">
              Active Optimization Outcome
            </span>
            <p className="text-[10px] text-text-primary leading-normal font-semibold">
              {memory.impactScore}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
