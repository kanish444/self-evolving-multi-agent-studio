import React, { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import type { IterationData } from '../mockData'
import { Calendar, Activity, Clock, X, Target, Cpu } from 'lucide-react'

interface IterationTimelineProps {
  iterations: IterationData[]
}

export const IterationTimeline: React.FC<IterationTimelineProps> = ({ iterations }) => {
  const [selectedIter, setSelectedIter] = useState<IterationData | null>(null)

  const getStatusColor = (health: IterationData['health']) => {
    switch (health) {
      case 'warning':
        return 'border-warning/30 text-warning bg-warning/10'
      case 'error':
        return 'border-error/30 text-error bg-error/10'
      default:
        return 'border-success/30 text-success bg-success/10'
    }
  }

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <Calendar className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Iteration Run Timeline
        </h3>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
        {iterations.map((iter) => {
          const isWarning = iter.health === 'warning'
          return (
            <div
              key={iter.id}
              onClick={() => setSelectedIter(iter)}
              className="relative group cursor-pointer space-y-1.5"
            >
              {/* Timeline marker node */}
              <span className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 transition-transform group-hover:scale-125 ${
                isWarning
                  ? 'border-warning bg-surface-base group-hover:bg-warning/20'
                  : 'border-success bg-surface-base group-hover:bg-success/20'
              }`} />

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary font-mono group-hover:text-accent transition-colors">
                  {iter.version}
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getStatusColor(iter.health)}`}>
                  {iter.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-text-secondary">
                <div>
                  Success: <span className="font-bold text-text-primary">{iter.successRate}%</span>
                </div>
                <div>
                  Bugs: <span className="font-bold text-text-primary">{iter.bugs}</span>
                </div>
                <div>
                  Learnings: <span className="font-bold text-text-primary">{iter.workflowImps}</span>
                </div>
              </div>

              <div className="text-[10px] text-text-muted font-mono truncate">
                Key Learning: {iter.learning}
              </div>
            </div>
          )
        })}
      </div>

      {/* Side-Drawer Modal detail */}
      {selectedIter && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-surface-base h-full border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 bg-surface-secondary border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <div>
                  <h3 className="text-sm font-bold text-text-primary font-mono">
                    {selectedIter.version} Summary
                  </h3>
                  <span className="text-[10px] text-text-muted font-mono font-medium">
                    Run ID: {selectedIter.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedIter(null)}
                className="p-1 hover:bg-surface-elevated rounded transition-colors text-text-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs custom-scrollbar">
              {/* Iteration overview metrics cards */}
              <div className="grid grid-cols-2 gap-3 text-center font-mono">
                <div className="bg-surface-secondary border border-border rounded-md p-3">
                  <span className="text-[9px] text-text-muted uppercase block leading-none">
                    Test Success Rate
                  </span>
                  <div className="text-base font-bold text-text-primary mt-1 flex items-center justify-center gap-0.5">
                    <Target className="w-4 h-4 text-success" />
                    {selectedIter.successRate}%
                  </div>
                </div>

                <div className="bg-surface-secondary border border-border rounded-md p-3">
                  <span className="text-[9px] text-text-muted uppercase block leading-none">
                    Execution Latency
                  </span>
                  <div className="text-base font-bold text-text-primary mt-1 flex items-center justify-center gap-0.5">
                    <Clock className="w-4 h-4 text-accent-secondary" />
                    {selectedIter.execTime}
                  </div>
                </div>
              </div>

              {/* Dynamic tests summary breakdown */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
                  Test Results Breakdown
                </span>
                <div className="border border-border rounded-md overflow-hidden bg-surface-secondary">
                  <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center py-2 font-mono">
                    <div>
                      <span className="text-[9px] text-text-muted block">Total Tests</span>
                      <span className="font-bold text-text-primary">{selectedIter.totalTests}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted block">Passed</span>
                      <span className="font-bold text-success">{selectedIter.passedTests}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-text-muted block">Failed</span>
                      <span className="font-bold text-error">{selectedIter.failedTests}</span>
                    </div>
                  </div>
                  <div className="p-3 text-[10px] text-text-secondary leading-relaxed font-sans">
                    Timing stats: Iteration execution initialized at <span className="font-bold text-text-primary font-mono">{selectedIter.startTime.split(' ')[1]}</span> and completed sandbox runner tasks at <span className="font-bold text-text-primary font-mono">{selectedIter.endTime.split(' ')[1]}</span>.
                  </div>
                </div>
              </div>

              {/* Pipeline agents involved list */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
                  Active Pipeline Agents
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedIter.agentsInvolved.map((agent) => (
                    <span
                      key={agent}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-accent/15 border border-accent/30 text-accent font-bold font-mono text-[9px] shadow-xs"
                    >
                      <Cpu className="w-3 h-3 text-accent" />
                      {agent}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic learning cards summaries */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
                    Core Failure Learning
                  </span>
                  <p className="bg-surface-secondary border border-border rounded-md p-3 text-text-secondary leading-relaxed font-sans italic">
                    "{selectedIter.learning}"
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
                    Improvements Applied
                  </span>
                  <p className="bg-surface-secondary border border-border rounded-md p-3 text-text-secondary leading-relaxed font-sans">
                    {selectedIter.improvements}
                  </p>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-surface-secondary border-t border-border flex gap-2">
              <button
                onClick={() => setSelectedIter(null)}
                className="flex-1 py-2 border border-border bg-surface-base text-text-primary rounded text-xs font-semibold hover:bg-surface-elevated cursor-pointer transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
