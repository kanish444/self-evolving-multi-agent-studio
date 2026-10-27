import React, { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { CheckCircle2, ShieldAlert, AlertTriangle, Eye, ThumbsUp, ThumbsDown, Check } from 'lucide-react'
import type { DecisionItem } from '../mockData'

interface EvolutionDecisionProps {
  decision: DecisionItem
  onDecisionChange: (id: string, newStatus: 'Accepted' | 'Rejected') => void
}

export const EvolutionDecision: React.FC<EvolutionDecisionProps> = ({
  decision,
  onDecisionChange,
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const handleAction = (status: 'Accepted' | 'Rejected') => {
    onDecisionChange(decision.id, status)
    setFeedback(`Decision status updated to: ${status.toUpperCase()}`)
    setTimeout(() => setFeedback(null), 3000)
  }

  const getStatusBadge = (status: DecisionItem['status']) => {
    switch (status) {
      case 'Accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 border border-emerald-200 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            ACCEPTED
          </span>
        )
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-50 border border-rose-200 text-rose-700">
            <ShieldAlert className="w-3.5 h-3.5 text-error" />
            REJECTED
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 border border-amber-200 text-amber-700 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            RECOMMENDED
          </span>
        )
    }
  }

  return (
    <Card className="p-4 border border-border/80 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      {/* Feedback Alert */}
      {feedback && (
        <div className="bg-slate-900 border border-slate-800 text-white px-3 py-2 rounded text-[10px] font-mono flex items-center gap-1.5 animate-in slide-in-from-top duration-150 absolute top-4 right-4 z-40">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Evolutionary Action Decision
        </h3>
        {getStatusBadge(decision.status)}
      </div>

      <div className="space-y-3.5 text-xs">
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
            System Observation
          </span>
          <p className="text-text-primary leading-relaxed bg-surface-secondary border border-border rounded p-2.5 font-medium">
            "{decision.observation}"
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-bold text-accent uppercase tracking-wider font-mono">
            Proposed Action
          </span>
          <div className="p-2.5 bg-accent/10 border border-accent/20 text-accent rounded font-bold font-mono">
            {decision.decision}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 text-[11px] font-mono">
          <div>
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
              Confidence Index
            </span>
            <span className="font-bold text-emerald-600">{decision.confidence}% Level</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
              Expected Outcome
            </span>
            <span className="text-text-secondary">{decision.expectedImpact}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Button
            variant="outline"
            size="xs"
            leftIcon={<Eye className="w-3 h-3" />}
            onClick={() => setShowReviewModal(true)}
            className="flex-1 justify-center h-8"
          >
            Review Details
          </Button>

          {decision.status === 'Recommended' && (
            <>
              <Button
                variant="outline"
                size="xs"
                className="bg-emerald-50 hover:bg-emerald-100 border-emerald-250 text-emerald-700 font-bold"
                leftIcon={<ThumbsUp className="w-3 h-3" />}
                onClick={() => handleAction('Accepted')}
              >
                Accept
              </Button>
              <Button
                variant="outline"
                size="xs"
                className="bg-rose-50 hover:bg-rose-100 border-rose-250 text-rose-700 font-bold"
                leftIcon={<ThumbsDown className="w-3 h-3" />}
                onClick={() => handleAction('Rejected')}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <Modal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          title="Evolution Proposal Details"
          size="sm"
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                Logical Justification / Reason
              </span>
              <p className="bg-surface-secondary border border-border rounded p-3 text-text-secondary leading-relaxed">
                {decision.reason}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                Involved Sandbox Iteration
              </span>
              <p className="bg-surface-secondary border border-border rounded p-2.5 font-mono text-text-primary font-bold">
                Iteration 03
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-border bg-surface-secondary text-text-primary rounded text-xs font-semibold hover:bg-surface-elevated cursor-pointer transition-colors"
              >
                Dismiss Review
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  )
}
