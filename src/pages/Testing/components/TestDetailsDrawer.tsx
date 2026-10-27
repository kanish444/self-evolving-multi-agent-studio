import React, { useEffect } from 'react'
import type { TestCase } from '../mockData'
import { Button } from '../../../components/ui/Button'
import { X, Play, Code, CheckCircle, XCircle, SkipForward, Loader } from 'lucide-react'

interface TestDetailsDrawerProps {
  isOpen: boolean
  onClose: () => void
  testCase: TestCase | null
  onRunAgain: (id: string) => void
  onApplyFix: (id: string) => void
  onViewCode: (fileName: string, line?: number) => void
}

export const TestDetailsDrawer: React.FC<TestDetailsDrawerProps> = ({
  isOpen,
  onClose,
  testCase,
  onRunAgain,
  onApplyFix,
  onViewCode,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !testCase) return null

  const getStatusBadge = (status: TestCase['status']) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-mono tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            PASS
          </span>
        )
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-mono tracking-wider bg-red-500/10 border border-red-500/30 text-red-400">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            FAIL
          </span>
        )
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-mono tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Loader className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            RUNNING
          </span>
        )
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold font-mono tracking-wider bg-surface-secondary border border-border text-text-secondary">
            <SkipForward className="w-3.5 h-3.5 text-text-muted" />
            SKIPPED
          </span>
        )
      default:
        return null
    }
  }

  const isFailed = testCase.status === 'FAIL'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-surface border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-surface-elevated">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-text-primary font-mono uppercase tracking-wide">
                Test Inspector
              </h2>
              <p className="text-[10px] text-text-muted font-mono truncate max-w-[280px] md:max-w-[380px]">
                {testCase.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer border border-border p-1.5 rounded bg-surface-secondary hover:bg-surface-elevated"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Status & Basic Details Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border/60">
              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Execution Status
                </span>
                <div className="mt-1">{getStatusBadge(testCase.status)}</div>
              </div>

              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Test Type
                </span>
                <div className="text-xs font-bold text-text-secondary mt-1.5 font-mono">
                  {testCase.type}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Assigned Agent
                </span>
                <div className="text-xs font-bold text-text-secondary mt-1.5 font-mono">
                  {testCase.agent}
                </div>
              </div>

              <div>
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Runtime / Last Run
                </span>
                <div className="text-xs font-bold text-text-muted mt-1.5 font-mono">
                  {testCase.executionTime || '0.00s'} ({testCase.lastRun})
                </div>
              </div>
            </div>

            {/* HTTP Context */}
            {testCase.endpoint && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  HTTP Endpoint
                </span>
                <div className="text-xs font-bold font-mono text-text-secondary bg-surface-secondary border border-border px-3 py-1.5 rounded">
                  {testCase.endpoint}
                </div>
              </div>
            )}

            {/* Inputs & Outputs */}
            <div className="space-y-4">
              {testCase.input && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                    Input Parameters
                  </span>
                  <pre className="bg-background text-text-primary rounded text-xs p-3 font-mono overflow-x-auto max-h-[120px] custom-scrollbar border border-border">
                    {testCase.input}
                  </pre>
                </div>
              )}

              {testCase.expected && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                    Expected Assert Target
                  </span>
                  <pre className="bg-background text-emerald-400 rounded text-xs p-3 font-mono overflow-x-auto max-h-[120px] custom-scrollbar border border-border">
                    {testCase.expected}
                  </pre>
                </div>
              )}

              {testCase.actual && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                    Actual Return Output
                  </span>
                  <pre className={`bg-background rounded text-xs p-3 font-mono overflow-x-auto max-h-[120px] custom-scrollbar border border-border ${
                    isFailed ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {testCase.actual}
                  </pre>
                </div>
              )}
            </div>

            {/* Failure Analysis Report */}
            {isFailed && (testCase.rootCause || testCase.suggestedFix) && (
              <div className="bg-[rgba(179, 68, 30, 0.08)] border border-[rgba(179, 68, 30, 0.25)] rounded-lg p-4 space-y-3">
                <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">
                  AI Failure Diagnosis
                </h4>
                {testCase.rootCause && (
                  <div>
                    <span className="text-[9px] font-semibold text-text-muted uppercase font-mono">
                      Root Cause:
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">{testCase.rootCause}</p>
                  </div>
                )}
                {testCase.suggestedFix && (
                  <div>
                    <span className="text-[9px] font-semibold text-text-muted uppercase font-mono">
                      Suggested Fix Action:
                    </span>
                    <p className="text-xs text-accent font-mono bg-background border border-[rgba(179, 68, 30, 0.3)] p-2 rounded italic mt-0.5">
                      "{testCase.suggestedFix}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 bg-surface-elevated">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {testCase.relatedFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (testCase.relatedFile) onViewCode(testCase.relatedFile, testCase.line)
                }}
                leftIcon={<Code className="w-3.5 h-3.5" />}
              >
                View Code
              </Button>
            )}
            {isFailed && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onApplyFix(testCase.id)}
                className="bg-accent hover:bg-accent border-accent text-white shadow-command-glow"
                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
              >
                Apply Fix
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onRunAgain(testCase.id)}
              leftIcon={<Play className="w-3.5 h-3.5 text-text-secondary" />}
            >
              Run Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
