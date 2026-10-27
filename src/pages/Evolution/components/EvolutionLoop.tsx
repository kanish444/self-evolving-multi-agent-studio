import React, { useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import {
  Code,
  Play,
  AlertTriangle,
  Search,
  Layers,
  BookOpen,
  GitMerge,
  RefreshCw,
  TrendingUp,
  Award,
  Info
} from 'lucide-react'

interface LoopStep {
  label: string
  title: string
  desc: string
  icon: React.ReactNode
  status: 'active' | 'completed' | 'idle'
  details: string
}

export const EvolutionLoop: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number | null>(4)

  const steps: LoopStep[] = [
    {
      label: 'BUILD',
      title: 'Task Execution',
      desc: 'Database and controllers scaffolded.',
      icon: <Code className="w-4 h-4" />,
      status: 'completed',
      details: 'Project Manager decomposes backlog issues, Architect maps API contracts, and Developer Agent generates source code.',
    },
    {
      label: 'TEST',
      title: 'Observed Results',
      desc: 'Executing test suites inside sandboxes.',
      icon: <Play className="w-4 h-4" />,
      status: 'completed',
      details: 'Tester Agent triggers isolated test suite runner containing unit, API, and stress verification parameters.',
    },
    {
      label: 'FAILURE',
      title: 'Failure Detection',
      desc: 'Deadlocks and bypassed constraints found.',
      icon: <AlertTriangle className="w-4 h-4" />,
      status: 'completed',
      details: 'Test runner captures unhandled assertions. Detailed reports identify SQL deadlock failures and missing email validation errors.',
    },
    {
      label: 'ANALYZE',
      title: 'Failure Analysis',
      desc: 'Debugger isolates root causes.',
      icon: <Search className="w-4 h-4" />,
      status: 'completed',
      details: 'Debugger Agent analyzes source code repositories, traceback stacks, and runtime environmental states to locate code defects.',
    },
    {
      label: 'PATTERN',
      title: 'Pattern Detection',
      desc: 'Correlating errors across iterations.',
      icon: <Layers className="w-4 h-4" />,
      status: 'active',
      details: 'Evolution Engine reviews historic database validation failures, identifying a repeating pattern across multiple tasks.',
    },
    {
      label: 'LEARNING',
      title: 'Create Learnings',
      desc: 'Formulate database validation rules.',
      icon: <BookOpen className="w-4 h-4" />,
      status: 'completed',
      details: 'System registers learning record: Enforce database constraint validation at model controllers before queries execution.',
    },
    {
      label: 'WORKFLOW',
      title: 'Workflow Change',
      desc: 'Injected schema validation step.',
      icon: <GitMerge className="w-4 h-4" />,
      status: 'completed',
      details: 'Self-Evolution Engine updates developer agent instructions and introduces strict pre-compilation schema checks.',
    },
    {
      label: 'ITERATION',
      title: 'New Iteration',
      desc: 'Run updated agent pipeline.',
      icon: <RefreshCw className="w-4 h-4" />,
      status: 'completed',
      details: 'V2 system re-runs. Developer Agent operates under the newly optimized schema validation instructions.',
    },
    {
      label: 'MEASURE',
      title: 'Measurement',
      desc: 'Analyze database crash drops.',
      icon: <TrendingUp className="w-4 h-4" />,
      status: 'completed',
      details: 'Re-runs verify the changes. Database integration failures dropped by 76% following prompt updates.',
    },
    {
      label: 'IMPROVE',
      title: 'System Improvement',
      desc: 'Success rate climbed to 94%.',
      icon: <Award className="w-4 h-4" />,
      status: 'completed',
      details: 'Overall system benchmark checks confirm successful convergence, raising success rate metrics.',
    },
  ]

  return (
    <div className="bg-surface-base border border-border rounded-2xl p-6 space-y-5 shadow-command-card select-none">
      <div className="flex items-center justify-between border-b border-border pb-3.5">
        <div>
          <h3 className="font-display text-sm font-bold text-text-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-accent animate-spin-slow" />
            Continuous Self-Evolution Loop
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            SE-MAESTRO learns from previous engineering iterations and updates agent prompt guidelines automatically.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="ai" size="sm">
            AUTO-EVOLUTION: ACTIVE
          </Badge>
        </div>
      </div>

      {/* Grid of Loop Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 relative">
        {steps.map((step, idx) => {
          const isSelected = activeStep === idx
          const isCompleted = step.status === 'completed'
          const isActive = step.status === 'active'

          return (
            <div
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`border rounded-xl p-3.5 transition-all duration-160 cursor-pointer flex flex-col justify-between h-32 relative ${
                isSelected
                  ? 'border-accent bg-accent/15 ring-2 ring-accent/30 shadow-command-card'
                  : isActive
                  ? 'border-system bg-system/15 ring-2 ring-system/30 animate-soft-pulse'
                  : 'border-border bg-surface-secondary hover:bg-surface-elevated hover:border-border-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold font-mono text-text-muted tracking-wider">
                  {step.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs shadow-xs ${
                    isSelected
                      ? 'bg-accent text-white border-transparent'
                      : isActive
                      ? 'bg-system text-white border-transparent font-bold'
                      : isCompleted
                      ? 'bg-success/15 text-success border-success/30'
                      : 'bg-surface-base text-text-secondary border-border'
                  }`}
                >
                  {step.icon}
                </div>
              </div>

              <div className="mt-2">
                <h4 className="font-display text-xs font-bold text-text-primary truncate">{step.title}</h4>
                <p className="text-[11px] text-text-secondary leading-tight mt-0.5 line-clamp-2">
                  {step.desc}
                </p>
              </div>

              {isSelected && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full animate-ping" />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Inspector Panel */}
      {activeStep !== null && (
        <div className="bg-surface-secondary border border-accent/40 rounded-xl p-4 flex items-start gap-3.5 animate-in slide-in-from-bottom-2 duration-150">
          <div className="p-2.5 bg-accent/10 rounded-lg text-accent mt-0.5 border border-accent/30">
            <Info className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">
                Stage Detail: {steps[activeStep].label}
              </span>
              <span className="text-border-hover font-normal text-xs">•</span>
              <span className="font-display text-xs font-bold text-text-primary">
                {steps[activeStep].title}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mt-1 font-sans">
              {steps[activeStep].details}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
