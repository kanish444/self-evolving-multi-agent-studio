import React from 'react'
import type { TestCase } from '../mockData'
import { Button } from '../../../components/ui/Button'
import { AlertCircle, Bot, Code, CheckCircle, HelpCircle } from 'lucide-react'

interface FailureAnalysisProps {
  testCase: TestCase
  onApplyFix: (id: string) => void
  onAskDebugger: (id: string) => void
  onViewCode: (fileName: string, line?: number) => void
  isFixApplied: boolean
}

export const FailureAnalysis: React.FC<FailureAnalysisProps> = ({
  testCase,
  onApplyFix,
  onAskDebugger,
  onViewCode,
  isFixApplied,
}) => {
  if (testCase.status !== 'FAIL' && !isFixApplied) return null

  return (
    <div className="bg-surface border border-[rgba(179, 68, 30, 0.3)] rounded-2xl p-5 shadow-command-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-accent animate-pulse" />
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            AI Failure Analysis
          </h3>
        </div>
        {isFixApplied ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono tracking-wider bg-[rgba(22, 163, 74, 0.15)] border border-[rgba(22, 163, 74, 0.35)] text-success">
            <CheckCircle className="w-3 h-3 text-success" />
            FIX APPLIED
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono tracking-wider bg-[rgba(179, 68, 30, 0.15)] border border-[rgba(179, 68, 30, 0.35)] text-accent">
            <AlertCircle className="w-3 h-3 text-accent" />
            DIAGNOSED
          </span>
        )}
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface-secondary border border-border rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Detected By
          </span>
          <span className="text-xs font-bold text-text-primary font-mono mt-1">
            {testCase.agent || 'Tester Agent'}
          </span>
        </div>

        <div className="bg-surface-secondary border border-border rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Fix Confidence
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-background h-1.5 rounded-full overflow-hidden border border-border">
              <div className="bg-gradient-to-r from-accent to-[#B8860B] h-full rounded-full" style={{ width: '94%' }} />
            </div>
            <span className="text-xs font-bold font-mono text-accent leading-none">
              94%
            </span>
          </div>
        </div>

        <div className="bg-surface-secondary border border-border rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Related File & Line
          </span>
          <span
            onClick={() => testCase.relatedFile && onViewCode(testCase.relatedFile, testCase.line)}
            className="text-xs font-bold text-accent font-mono mt-1 hover:underline cursor-pointer truncate"
          >
            {testCase.relatedFile || 'StudentController.py'}:{testCase.line || 42}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Root Cause */}
        <div>
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Root Cause Diagnosis
          </h4>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            {isFixApplied 
              ? "Resolved: Add email uniqueness validation before db insertion has successfully corrected this behavior."
              : (testCase.rootCause || "Duplicate email validation is not being enforced before database insertion.")}
          </p>
        </div>

        {/* Suggested Fix */}
        <div>
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
            Suggested Fix Action
          </h4>
          <blockquote className="border-l-2 border-accent bg-surface-secondary px-3.5 py-2.5 text-xs text-text-primary italic rounded-r-xl mt-1 font-mono">
            "{testCase.suggestedFix || "Add email existence validation before inserting a new student."}"
          </blockquote>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
        <Button
          variant="outline"
          size="xs"
          onClick={() => testCase.relatedFile && onViewCode(testCase.relatedFile, testCase.line)}
          leftIcon={<Code className="w-3 h-3 text-text-secondary" />}
        >
          View Code
        </Button>
        
        <Button
          variant={isFixApplied ? "outline" : "primary"}
          size="xs"
          disabled={isFixApplied}
          onClick={() => onApplyFix(testCase.id)}
          leftIcon={<CheckCircle className="w-3 h-3" />}
        >
          {isFixApplied ? 'Fix Applied' : 'Apply Suggested Fix'}
        </Button>

        <Button
          variant="secondary"
          size="xs"
          onClick={() => onAskDebugger(testCase.id)}
          leftIcon={<HelpCircle className="w-3 h-3 text-text-secondary" />}
        >
          Ask Debugger
        </Button>
      </div>
    </div>
  )
}
