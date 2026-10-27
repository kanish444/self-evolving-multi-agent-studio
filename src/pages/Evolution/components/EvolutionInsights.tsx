import React from 'react'
import { Card } from '../../../components/ui/Card'
import { CheckCircle, ShieldAlert, Cpu } from 'lucide-react'
import type { EvolutionInsight } from '../mockData'

interface EvolutionInsightsProps {
  insights: EvolutionInsight[]
}

export const EvolutionInsights: React.FC<EvolutionInsightsProps> = ({ insights }) => {
  const getImpactColor = (impact: EvolutionInsight['impact']) => {
    switch (impact) {
      case 'High':
        return 'text-error font-bold bg-error/10 border-error/20'
      case 'Medium':
        return 'text-warning font-bold bg-warning/10 border-warning/20'
      default:
        return 'text-text-muted font-medium bg-surface-secondary border-border'
    }
  }

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <Cpu className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          System Evolution Insights
        </h3>
      </div>

      <div className="space-y-3.5">
        {insights.map((ins) => (
          <div
            key={ins.id}
            className="border border-border/40 hover:border-accent/30 hover:bg-surface-elevated/40 rounded-md p-3.5 flex items-start gap-3 transition-colors text-xs"
          >
            <div className="mt-0.5">
              {ins.type === 'failure' ? (
                <ShieldAlert className="w-4 h-4 text-error" />
              ) : (
                <CheckCircle className="w-4 h-4 text-success" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-text-primary font-mono block">
                  {ins.title}
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getImpactColor(ins.impact)}`}>
                  {ins.impact} IMPACT
                </span>
              </div>

              <div className="text-[10px] text-text-muted font-mono">
                {ins.type === 'failure' ? 'Occurrences' : 'Successfully Used'}: <span className="font-bold text-text-secondary">{ins.occurrences} tasks</span>
              </div>

              <div className="bg-surface-secondary border border-border rounded px-2.5 py-2 text-text-secondary leading-relaxed font-sans">
                <span className="font-semibold text-accent font-mono block text-[9px] uppercase tracking-wider mb-0.5">
                  Recommendation:
                </span>
                {ins.recommendation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
