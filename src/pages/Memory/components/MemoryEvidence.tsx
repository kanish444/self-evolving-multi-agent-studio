import React, { useState } from 'react'
import type { Memory } from '../mockData'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import {
  FileText,
  FlaskConical,
  CheckSquare,
  GitBranch,
  Cpu,
  ArrowRight,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'

interface MemoryEvidenceProps {
  memory: Memory
}

export const MemoryEvidence: React.FC<MemoryEvidenceProps> = ({ memory }) => {
  const [showFlow, setShowFlow] = useState(false)

  // Use dynamic properties from mock data or fallback to defaults
  const failuresCount = memory.relatedFailuresCount ?? memory.relatedFailures.length ?? 6
  const testsCount = memory.relatedTestsCount ?? 8
  const tasksCount = memory.relatedTasksCount ?? 8
  const iterationsCount = memory.relatedIterationsCount ?? 3
  const agentsCount = memory.relatedAgentsCount ?? memory.relatedAgents.length ?? 3
  const summary = memory.evidenceSummary ?? "Learning supported by repeated observations across multiple software-development iterations."

  const flow = memory.evidenceFailureFlow ?? {
    test: "test_duplicate_email",
    problem: "Duplicate email validation missing.",
    detectedBy: "Tester Agent",
    rootCauseBy: "Debugger Agent",
    learningCreatedBy: "Evolution Agent"
  }

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Memory Evidence & Support
          </h3>
        </div>
        <Button
          variant="outline"
          size="xs"
          onClick={() => setShowFlow(!showFlow)}
          className="font-mono text-[10px]"
        >
          {showFlow ? 'Hide Flow' : 'View Evidence'}
        </Button>
      </div>

      <div className="space-y-3.5">
        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-2 text-center select-none">
          <div className="bg-surface-secondary border border-border rounded p-1.5 flex flex-col justify-between">
            <span className="text-[7.5px] text-text-muted font-bold font-mono uppercase truncate" title="Related Failures">Failures</span>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              <ShieldAlert className="w-3 h-3 text-error" />
              <span className="text-xs font-bold text-text-primary font-mono">{failuresCount}</span>
            </div>
          </div>
          <div className="bg-surface-secondary border border-border rounded p-1.5 flex flex-col justify-between">
            <span className="text-[7.5px] text-text-muted font-bold font-mono uppercase truncate" title="Related Tests">Tests</span>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              <FlaskConical className="w-3 h-3 text-accent-secondary" />
              <span className="text-xs font-bold text-text-primary font-mono">{testsCount}</span>
            </div>
          </div>
          <div className="bg-surface-secondary border border-border rounded p-1.5 flex flex-col justify-between">
            <span className="text-[7.5px] text-text-muted font-bold font-mono uppercase truncate" title="Related Tasks">Tasks</span>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              <CheckSquare className="w-3 h-3 text-accent" />
              <span className="text-xs font-bold text-text-primary font-mono">{tasksCount}</span>
            </div>
          </div>
          <div className="bg-surface-secondary border border-border rounded p-1.5 flex flex-col justify-between">
            <span className="text-[7.5px] text-text-muted font-bold font-mono uppercase truncate" title="Related Iterations">Iterations</span>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              <GitBranch className="w-3 h-3 text-success" />
              <span className="text-xs font-bold text-text-primary font-mono">{iterationsCount}</span>
            </div>
          </div>
          <div className="bg-surface-secondary border border-border rounded p-1.5 flex flex-col justify-between">
            <span className="text-[7.5px] text-text-muted font-bold font-mono uppercase truncate" title="Related Agents">Agents</span>
            <div className="mt-1 flex items-center justify-center gap-0.5">
              <Cpu className="w-3 h-3 text-accent" />
              <span className="text-xs font-bold text-text-primary font-mono">{agentsCount}</span>
            </div>
          </div>
        </div>

        {/* Evidence Summary Statement */}
        <div className="text-xs text-text-secondary leading-relaxed bg-surface-secondary border border-border p-2.5 rounded-md italic">
          "{summary}"
        </div>

        {/* Expandable Flow Detail */}
        {showFlow && (
          <div className="border border-border rounded-md p-3.5 bg-surface-secondary space-y-4 animate-in slide-in-from-top-2 duration-200 font-mono text-[10px]">
            <div className="flex items-center gap-1 border-b border-border pb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              <span className="font-bold text-text-primary uppercase text-[9px]">Related Failure Flow Chain</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-surface-base border border-border rounded-md">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">Test Suite Name</span>
                  <div className="font-mono text-error font-bold mt-1 text-[11px]">
                    {flow.test}
                  </div>
                </div>
                <div className="p-2.5 bg-surface-base border border-border rounded-md">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">Observed Problem</span>
                  <div className="text-text-primary font-semibold mt-1">
                    {flow.problem}
                  </div>
                </div>
              </div>

              <div className="bg-surface-base border border-border rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">Agent Collaboration Chain</span>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs bg-surface-secondary border border-border rounded px-2.5 py-1">
                    <span className="text-text-secondary">Detected by</span>
                    <span className="font-mono font-bold text-accent">{flow.detectedBy}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-surface-secondary border border-border rounded px-2.5 py-1">
                    <span className="text-text-secondary">Root cause identified by</span>
                    <span className="font-mono font-bold text-accent">{flow.rootCauseBy}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs bg-surface-secondary border border-border rounded px-2.5 py-1">
                    <span className="text-text-secondary">Learning created by</span>
                    <span className="font-mono font-bold text-success">{flow.learningCreatedBy}</span>
                  </div>
                </div>
              </div>

              {/* Graphical Chain Flow */}
              <div className="bg-surface-base border border-border p-2.5 rounded-md flex items-center justify-between gap-1 overflow-x-auto text-[9px] font-mono select-none">
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-error/15 border border-error/30 text-error font-bold">TEST</span>
                  <ArrowRight className="w-3 h-3 text-text-muted" />
                  <span className="px-1.5 py-0.5 rounded bg-error/15 border border-error/30 text-error font-bold">FAILURE</span>
                  <ArrowRight className="w-3 h-3 text-text-muted" />
                  <span className="px-1.5 py-0.5 rounded bg-warning/15 border border-warning/30 text-warning font-bold">DEBUG</span>
                  <ArrowRight className="w-3 h-3 text-text-muted" />
                  <span className="px-1.5 py-0.5 rounded bg-accent/15 border border-accent/30 text-accent font-bold">LEARNING</span>
                  <ArrowRight className="w-3 h-3 text-text-muted" />
                  <span className="px-1.5 py-0.5 rounded bg-accent-secondary/15 border border-accent-secondary/30 text-accent-secondary font-bold">MEMORY</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
