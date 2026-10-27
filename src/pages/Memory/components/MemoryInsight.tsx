import React from 'react'
import type { MemoryInsightCard } from '../mockData'
import { Card } from '../../../components/ui/Card'
import { Sparkles, Lightbulb } from 'lucide-react'

interface MemoryInsightProps {
  insight: MemoryInsightCard
}

export const MemoryInsight: React.FC<MemoryInsightProps> = ({ insight }) => {
  return (
    <Card className="p-4 border border-border/80 bg-surface-secondary/40 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <Sparkles className="w-4 h-4 text-accent animate-pulse" />
        <h3 className="text-xs font-bold text-accent uppercase tracking-wider font-mono">
          AI Cognitive Memory Insight
        </h3>
      </div>

      <div className="space-y-3.5 text-xs">
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-accent uppercase tracking-wider font-mono">
            Auto-Detected Knowledge Pattern
          </span>
          <p className="text-text-primary font-bold text-[12px] leading-relaxed">
            "{insight.title}"
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Corroborating Evidence
          </span>
          <p className="text-text-secondary font-mono text-[10px]">
            {insight.evidence}
          </p>
        </div>

        <div className="space-y-1.5 pt-1.5 border-t border-border/40">
          <span className="text-[9px] font-bold text-accent uppercase tracking-wider font-mono flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-warning" />
            System Recommendation
          </span>
          <div className="p-3 bg-accent/10 rounded border border-accent/20 text-text-primary leading-relaxed font-sans">
            {insight.recommendation}
          </div>
        </div>
      </div>
    </Card>
  )
}
