import React from 'react'
import { Card } from '../../../components/ui/Card'
import { GitBranch, XCircle, AlertTriangle, Activity } from 'lucide-react'

export const IterationObservability: React.FC = () => {
  const iterations = [
    {
      id: 'it-1',
      name: 'ITERATION 01',
      events: 314,
      errors: 18,
      warnings: 26,
      successRate: '87.6%',
      status: 'ARCHIVED',
      statusColor: 'text-text-muted bg-surface-base border-border',
    },
    {
      id: 'it-2',
      name: 'ITERATION 02',
      events: 421,
      errors: 8,
      warnings: 19,
      successRate: '93.8%',
      status: 'ARCHIVED',
      statusColor: 'text-text-muted bg-surface-base border-border',
    },
    {
      id: 'it-3',
      name: 'ITERATION 03',
      events: 513,
      errors: 2,
      warnings: 11,
      successRate: '97.4%',
      status: 'ACTIVE',
      statusColor: 'text-success bg-success/10 border-success/30 font-bold animate-pulse',
    },
  ]

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4 select-none font-sans">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <GitBranch className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          System Iteration Observability
        </h3>
      </div>

      <p className="text-[10px] text-text-secondary leading-normal">
        Performance audit log tracking across development iterations. Self-evolution algorithms reduce error and warning rates over time:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {iterations.map((iter) => (
          <div
            key={iter.id}
            className="p-3 border border-border rounded-md bg-surface-secondary space-y-3 font-mono text-[9px] relative hover:border-accent/40 transition-colors shadow-xs"
          >
            {/* Iteration title & status */}
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary text-[10.5px]">{iter.name}</span>
              <span className={`inline-block px-1.5 py-0.2 rounded text-[7.5px] border ${iter.statusColor}`}>
                {iter.status}
              </span>
            </div>

            {/* Metrics data rows */}
            <div className="space-y-1.5 text-xs text-text-secondary">
              <div className="flex items-center justify-between bg-surface-base border border-border rounded px-2 py-0.5 text-[10px]">
                <span className="flex items-center gap-1 font-sans font-medium"><Activity className="w-3 h-3 text-accent" /> Total Events</span>
                <span className="font-bold text-text-primary font-mono">{iter.events}</span>
              </div>
              <div className="flex items-center justify-between bg-surface-base border border-border rounded px-2 py-0.5 text-[10px]">
                <span className="flex items-center gap-1 font-sans font-medium"><XCircle className="w-3 h-3 text-error" /> Errors logged</span>
                <span className={`font-bold font-mono ${iter.errors > 5 ? 'text-error' : 'text-text-secondary'}`}>{iter.errors}</span>
              </div>
              <div className="flex items-center justify-between bg-surface-base border border-border rounded px-2 py-0.5 text-[10px]">
                <span className="flex items-center gap-1 font-sans font-medium"><AlertTriangle className="w-3 h-3 text-warning" /> Warnings logged</span>
                <span className="font-bold text-text-primary font-mono">{iter.warnings}</span>
              </div>
            </div>

            {/* Comparison graph line */}
            <div className="space-y-1 pt-1.5 border-t border-border text-[9px]">
              <div className="flex items-center justify-between text-text-secondary">
                <span>Successful run rate:</span>
                <span className="font-bold text-success">{iter.successRate}</span>
              </div>
              <div className="bg-surface-base border border-border h-2 rounded-full overflow-hidden">
                <div
                  className="bg-success h-full rounded-full transition-all duration-300"
                  style={{ width: iter.successRate }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
