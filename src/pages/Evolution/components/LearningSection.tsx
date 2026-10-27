import React, { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Modal } from '../../../components/ui/Modal'
import type { LearningData } from '../mockData'
import { BookOpen, Cpu } from 'lucide-react'

interface LearningSectionProps {
  learnings: LearningData[]
}

export const LearningSection: React.FC<LearningSectionProps> = ({ learnings }) => {
  const [selectedLearning, setSelectedLearning] = useState<LearningData | null>(null)

  const getImpactBadge = (impact: LearningData['impact']) => {
    switch (impact) {
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-50 border border-rose-200 text-rose-700">
            HIGH IMPACT
          </span>
        )
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 border border-amber-200 text-amber-700">
            MEDIUM IMPACT
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-50 border border-slate-200 text-slate-700">
            LOW IMPACT
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          What the System Learned ({learnings.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {learnings.map((lrn) => (
          <Card
            key={lrn.id}
            hoverable
            onClick={() => setSelectedLearning(lrn)}
            className="p-4 border border-border/80 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:border-accent/40 hover:shadow-[0_4px_12px_rgba(179,68,30,0.1)] cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">
                  {lrn.id}
                </span>
                {getImpactBadge(lrn.impact)}
              </div>

              <div>
                <h4 className="text-xs font-bold text-text-primary font-mono leading-tight">
                  Pattern: {lrn.pattern}
                </h4>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Evidence: {lrn.evidence}
                </p>
              </div>

              <p className="text-[11px] text-text-secondary leading-relaxed bg-slate-50 border border-slate-100 rounded p-2.5 italic">
                "{lrn.learning}"
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[10px] font-mono">
              <span className="text-text-muted flex items-center gap-1">
                <Cpu className="w-3 h-3 text-indigo-500" />
                {lrn.agent}
              </span>
              <span className="font-bold text-emerald-600">
                {lrn.confidence}% Confidence
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Learning Detail Modal */}
      {selectedLearning && (
        <Modal
          isOpen={!!selectedLearning}
          onClose={() => setSelectedLearning(null)}
          title={`Learning Details: ${selectedLearning.id}`}
          size="md"
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center">
                <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">
                  Origin: {selectedLearning.createdIn}
                </span>
                <span className="text-text-muted mx-1.5">•</span>
                <span className="text-[10px] font-bold text-system uppercase tracking-wider font-mono">
                  Active In: {selectedLearning.usedIn}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {getImpactBadge(selectedLearning.impact)}
                <span className="text-[10px] font-bold text-success font-mono bg-success/15 px-1.5 py-0.5 rounded border border-success/30">
                  {selectedLearning.confidence}% CONF
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Repeated Pattern
                </span>
                <div className="p-2 bg-surface-secondary border border-border rounded font-medium text-text-primary">
                  {selectedLearning.pattern}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Agent Investigator
                </span>
                <div className="p-2 bg-surface-secondary border border-border rounded font-mono text-text-primary flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-accent" />
                  {selectedLearning.agent}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                Extracted Logic Rule
              </span>
              <div className="p-3 bg-accent/15 border border-accent/30 rounded text-accent font-bold font-mono">
                "{selectedLearning.learning}"
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                Why This Matters
              </span>
              <p className="text-text-secondary leading-relaxed bg-surface-secondary border border-border rounded p-3">
                {selectedLearning.whyItMatters}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Evidence Sample
                </span>
                <div className="p-2 bg-surface-secondary border border-border rounded text-text-primary font-mono">
                  {selectedLearning.evidence}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Source Reference
                </span>
                <div className="p-2 bg-surface-secondary border border-border rounded text-text-primary font-mono truncate">
                  {selectedLearning.source}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLearning(null)}
                className="px-4 py-2 border border-border bg-surface-secondary rounded text-xs font-semibold hover:bg-surface-elevated text-text-primary cursor-pointer transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
