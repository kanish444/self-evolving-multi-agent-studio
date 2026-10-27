import React from 'react'
import { Card } from '../../../components/ui/Card'
import { AlertCircle, Search, Lightbulb, Save, Upload, Activity, ShieldCheck, ChevronRight } from 'lucide-react'

export const MemoryLifecycle: React.FC = () => {
  const steps = [
    { label: 'OBSERVED', text: 'Failure detected', icon: <AlertCircle className="w-3.5 h-3.5" />, bg: 'bg-error/10 border-error/30 text-error' },
    { label: 'ANALYZED', text: 'Pattern identified', icon: <Search className="w-3.5 h-3.5" />, bg: 'bg-warning/10 border-warning/30 text-warning' },
    { label: 'LEARNED', text: 'Learning created', icon: <Lightbulb className="w-3.5 h-3.5" />, bg: 'bg-accent/10 border-accent/30 text-accent' },
    { label: 'STORED', text: 'Memory stored', icon: <Save className="w-3.5 h-3.5" />, bg: 'bg-accent/15 border-accent/40 text-accent' },
    { label: 'RETRIEVED', text: 'Future tasks retrieval', icon: <Upload className="w-3.5 h-3.5" />, bg: 'bg-system/10 border-system/30 text-system' },
    { label: 'APPLIED', text: 'Agent uses strategy', icon: <Activity className="w-3.5 h-3.5" />, bg: 'bg-system/15 border-system/40 text-system' },
    { label: 'VALIDATED', text: 'Outcome measured', icon: <ShieldCheck className="w-3.5 h-3.5" />, bg: 'bg-success/10 border-success/30 text-success font-bold' },
  ]

  return (
    <Card className="p-4 border border-border shadow-command-card space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-2.5">
        <Activity className="w-4 h-4 text-accent animate-pulse" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Memory & Learning Lifecycle
        </h3>
      </div>

      <div className="flex items-center justify-between gap-1 overflow-x-auto py-2.5 px-1.5 bg-surface-secondary border border-border rounded-md custom-scrollbar">
        {steps.map((step, idx) => (
          <React.Fragment key={step.label}>
            <div className={`flex-1 min-w-[100px] border rounded-md p-2.5 flex flex-col items-center text-center space-y-1.5 shadow-xs ${step.bg}`}>
              <span className="text-[8px] font-bold font-mono tracking-wider">{step.label}</span>
              <div className="p-1 bg-surface-base rounded-full border border-border">
                {step.icon}
              </div>
              <span className="text-[9px] font-medium leading-tight font-sans line-clamp-1">{step.text}</span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </Card>
  )
}
