import React from 'react'
import type { MemoryRetentionStats } from '../mockData'
import { Card } from '../../../components/ui/Card'
import { Award } from 'lucide-react'

interface MemoryRetentionProps {
  stats: MemoryRetentionStats
}

export const MemoryRetention: React.FC<MemoryRetentionProps> = ({ stats }) => {
  const levels = [
    { label: 'Critical / High Importance', value: stats.critical, color: 'bg-accent' },
    { label: 'Medium Importance', value: stats.medium, color: 'bg-accent-secondary' },
    { label: 'Low Importance', value: stats.low, color: 'bg-text-muted' },
  ]

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <Award className="w-4 h-4 text-accent animate-pulse" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Memory Retention Matrix
        </h3>
      </div>

      <div className="space-y-3.5 text-xs font-mono">
        {levels.map((lvl) => (
          <div key={lvl.label} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-text-secondary">
              <span>{lvl.label}</span>
              <span className="font-bold text-text-primary">{lvl.value}% retained</span>
            </div>
            <div className="bg-surface-secondary border border-border h-2 rounded-full overflow-hidden">
              <div
                className={`${lvl.color} h-full rounded-full transition-all duration-500`}
                style={{ width: `${lvl.value}%` }}
              />
            </div>
          </div>
        ))}
        <div className="bg-surface-secondary border border-border rounded p-2.5 text-[9px] font-sans text-text-secondary leading-relaxed mt-1">
          💡 Retention decay policies automatically offload low-importance knowledge assets while locking critical error patterns against garbage collection.
        </div>
      </div>
    </Card>
  )
}
