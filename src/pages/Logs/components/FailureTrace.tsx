import React from 'react'
import type { LogEvent } from '../logs.mock'
import { Card } from '../../../components/ui/Card'
import { ChevronRight, ShieldAlert } from 'lucide-react'

interface FailureTraceProps {
  selectedEvent: LogEvent
}

export const FailureTrace: React.FC<FailureTraceProps> = ({ selectedEvent }) => {
  // Determine if selected event or its trace contains failure detail, otherwise render fallback template
  const isLockFailure = selectedEvent.traceId === 'trace_03_00219' || selectedEvent.test === 'test_bulk_student_upload_stress'
  const isAuthFailure = selectedEvent.traceId === 'trace_02_00106' || selectedEvent.test === 'test_auth_guard_null_token'

  let failureData = {
    error: 'test_duplicate_email',
    detection: 'Tester Agent detected HTTP 201 instead of 400',
    rootCause: 'Missing validation check before ORM scaffolding runs',
    fix: 'Developer Agent added verify_unique_email hook',
    retest: 'Tester Agent ran API stress verification suites',
    result: 'Test PASSED (HTTP 400 returned)',
    learning: 'Evolution Agent formulated DB check rule',
    memory: 'Stored cognitive learning node (mem-01)',
  }

  if (isLockFailure) {
    failureData = {
      error: 'test_bulk_student_upload_stress',
      detection: 'Tester Agent caught SQLite database lock timeout',
      rootCause: 'Concurrent threads writing bulk data simultaneously without serialize keys',
      fix: 'Developer Agent added transaction serialized lock handle wrappers',
      retest: 'Tester Agent ran bulk concurrency uploads',
      result: 'Test PASSED (Zero write collisions over 20 threads)',
      learning: 'Evolution Agent formulated SQLite transaction lock rule',
      memory: 'Stored cognitive learning node (mem-10)',
    }
  } else if (isAuthFailure) {
    failureData = {
      error: 'test_auth_guard_null_token',
      detection: 'Tester Agent caught NullPointerException (HTTP 500)',
      rootCause: 'Guards bypass payload validation checks before JWT decoding routines',
      fix: 'Developer Agent added early return checks on length validation',
      retest: 'Tester Agent ran authorization bypass scans',
      result: 'Test PASSED (Null tokens return HTTP 401 correctly)',
      learning: 'Evolution Agent formulated auth guard early return rules',
      memory: 'Stored cognitive learning node (mem-08)',
    }
  }

  const steps = [
    { label: 'ERROR', val: failureData.error, bg: 'bg-error/10 border-error/30 text-error font-bold' },
    { label: 'DETECTION', val: failureData.detection, bg: 'bg-error/10 border-error/30 text-error' },
    { label: 'ROOT CAUSE', val: failureData.rootCause, bg: 'bg-warning/10 border-warning/30 text-warning font-bold' },
    { label: 'FIX', val: failureData.fix, bg: 'bg-surface-secondary border-border text-text-secondary' },
    { label: 'RETEST', val: failureData.retest, bg: 'bg-surface-secondary border-border text-text-secondary' },
    { label: 'RESULT', val: failureData.result, bg: 'bg-success/10 border-success/30 text-success font-bold' },
    { label: 'LEARNING', val: failureData.learning, bg: 'bg-accent/10 border-accent/30 text-accent' },
    { label: 'MEMORY', val: failureData.memory, bg: 'bg-accent-secondary/10 border-accent-secondary/30 text-accent-secondary font-bold' },
  ]

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4 select-none font-sans">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <ShieldAlert className="w-4 h-4 text-error animate-pulse" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Failure Analysis & Resolution Lifecycle
        </h3>
      </div>

      <p className="text-[10px] text-text-secondary leading-normal">
        Auditing the resolution lifecycle from error detection down to permanent memory retention:
      </p>

      {/* Grid flowchart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 font-mono text-[9px] py-1">
        {steps.map((st, idx) => (
          <div
            key={st.label}
            className={`border rounded-md p-2.5 flex flex-col justify-between shadow-3xs min-h-[90px] relative ${st.bg}`}
          >
            <div>
              <span className="text-[8px] font-bold block uppercase tracking-wider opacity-75">{st.label}</span>
              <p className="text-[10px] font-sans leading-tight mt-1.5 font-medium line-clamp-3" title={st.val}>
                {st.val}
              </p>
            </div>
            {/* Visual separator helper for desktop flow */}
            {idx < steps.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 text-text-muted/65 absolute -right-2 top-1/2 -translate-y-1/2 hidden lg:block z-10" />
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
