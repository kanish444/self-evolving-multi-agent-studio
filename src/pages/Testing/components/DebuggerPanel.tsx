import React from 'react'
import type { DebuggerAnalysis } from '../mockData'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Bot, PlayCircle, Loader2, Award, FileSearch, Sparkles, Check } from 'lucide-react'

interface DebuggerPanelProps {
  analysis: DebuggerAnalysis
  onApplyFix: () => void
  isFixApplied: boolean
}

export const DebuggerPanel: React.FC<DebuggerPanelProps> = ({
  analysis,
  onApplyFix,
  isFixApplied,
}) => {
  const isAnalyzing = analysis.status === 'ANALYZING' && !isFixApplied

  return (
    <Card className="border border-border bg-surface shadow-command-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-accent" />
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
              AI Debugger
            </h3>
            <p className="text-[9px] text-text-muted font-mono leading-none mt-0.5">
              {analysis.agent}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {isFixApplied ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Check className="w-3 h-3 text-emerald-400" />
            IDLE
          </span>
        ) : isAnalyzing ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[rgba(179, 68, 30, 0.15)] border border-[rgba(179, 68, 30, 0.35)] text-accent">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-accent"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            ANALYZING
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-surface-secondary border border-border text-text-secondary">
            IDLE
          </span>
        )}
      </div>

      {/* Main Issue */}
      <div className="space-y-2 bg-[rgba(179, 68, 30, 0.08)] border border-[rgba(179, 68, 30, 0.25)] rounded-lg p-3">
        <div className="flex items-center justify-between text-[10px] font-bold font-mono text-accent">
          <span>TARGET ISSUE:</span>
          <span>{isFixApplied ? 'RESOLVED' : 'ACTIVE'}</span>
        </div>
        <div className="text-xs font-bold font-mono text-text-primary truncate">
          {analysis.currentIssue}
        </div>
        <div className="text-[11px] text-text-secondary">
          <span className="font-bold text-text-primary mr-1">Root Cause:</span>
          {isFixApplied ? 'Validation rules enforced.' : analysis.rootCause}
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="space-y-3">
        <div>
          <h4 className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Reasoning Log
          </h4>
          <p className="text-xs text-text-secondary leading-relaxed mt-1">
            {isFixApplied
              ? "The email duplicate validation constraint was successfully written to StudentController.py, safeguarding student entity records."
              : analysis.analysis}
          </p>
        </div>

        <div>
          <h4 className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Recommended Action
          </h4>
          <p className="text-xs font-mono bg-surface-secondary border border-border rounded px-2.5 py-1.5 mt-1 text-text-secondary">
            {isFixApplied
              ? "Ready for deploy iteration."
              : analysis.suggestedAction}
          </p>
        </div>
      </div>

      {/* Progress HUD */}
      {isAnalyzing && (
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] font-mono text-accent font-bold">
            <span>AUDIT PROGRESS:</span>
            <span>{analysis.progress}%</span>
          </div>
          <div className="bg-surface-secondary h-1.5 rounded-full overflow-hidden border border-border">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${analysis.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
        <div className="flex flex-col items-center">
          <FileSearch className="w-3.5 h-3.5 text-text-muted mb-1" />
          <span className="text-[14px] font-bold font-mono text-text-primary leading-none">
            {isFixApplied ? 0 : analysis.filesAnalyzed}
          </span>
          <span className="text-[9px] font-semibold text-text-muted uppercase mt-1">
            Files Audited
          </span>
        </div>
        <div className="flex flex-col items-center">
          <Sparkles className="w-3.5 h-3.5 text-text-muted mb-1" />
          <span className="text-[14px] font-bold font-mono text-text-primary leading-none">
            {isFixApplied ? 0 : analysis.possibleCauses}
          </span>
          <span className="text-[9px] font-semibold text-text-muted uppercase mt-1">
            Root Causes
          </span>
        </div>
        <div className="flex flex-col items-center">
          <Award className="w-3.5 h-3.5 text-text-muted mb-1" />
          <span className="text-[14px] font-bold font-mono text-text-primary leading-none">
            {isFixApplied ? '100%' : `${analysis.fixConfidence}%`}
          </span>
          <span className="text-[9px] font-semibold text-text-muted uppercase mt-1">
            Confidence
          </span>
        </div>
      </div>

      {/* Quick Action Button */}
      <Button
        variant={isFixApplied ? "outline" : "primary"}
        className={`w-full ${!isFixApplied ? "bg-accent hover:bg-accent border-accent text-white shadow-command-glow" : ""}`}
        disabled={isFixApplied || isAnalyzing}
        onClick={onApplyFix}
        leftIcon={isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
      >
        {isFixApplied ? 'Suggested Fix Applied' : 'Apply AI Recommended Fix'}
      </Button>
    </Card>
  )
}
