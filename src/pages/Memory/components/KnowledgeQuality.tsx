import React from 'react'
import type { KnowledgeQualityStats } from '../mockData'
import { Card } from '../../../components/ui/Card'
import { CheckSquare, ShieldAlert, Zap, Layers, FolderHeart } from 'lucide-react'

interface KnowledgeQualityProps {
  stats: KnowledgeQualityStats
}

export const KnowledgeQuality: React.FC<KnowledgeQualityProps> = ({ stats }) => {
  const items = [
    { label: 'Verified Memories', value: stats.verified, icon: <CheckSquare className="w-3.5 h-3.5 text-success" /> },
    { label: 'Needs Review', value: stats.review, icon: <ShieldAlert className="w-3.5 h-3.5 text-warning animate-pulse" /> },
    { label: 'Low Confidence', value: stats.lowConf, icon: <ShieldAlert className="w-3.5 h-3.5 text-error" /> },
    { label: 'Frequently Used', value: stats.freqUsed, icon: <Zap className="w-3.5 h-3.5 text-accent animate-bounce" /> },
    { label: 'Unused / Static', value: stats.unused, icon: <Layers className="w-3.5 h-3.5 text-text-muted" /> },
  ]

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <FolderHeart className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Knowledge Quality Health
        </h3>
      </div>

      <div className="space-y-3.5 text-xs font-mono">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between text-text-secondary border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
            <div className="flex items-center gap-2">
              {it.icon}
              <span>{it.label}</span>
            </div>
            <span className="font-bold text-text-primary">{it.value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
