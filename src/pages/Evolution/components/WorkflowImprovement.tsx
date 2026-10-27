import React from 'react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { GitMerge, ChevronRight, CheckCircle2 } from 'lucide-react'
import type { WorkflowChange } from '../mockData'

interface WorkflowImprovementProps {
  workflowChanges: WorkflowChange[]
}

export const WorkflowImprovement: React.FC<WorkflowImprovementProps> = ({ workflowChanges }) => {
  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <GitMerge className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Workflow Improvement & Pipeline Evolution
        </h3>
      </div>

      <div className="space-y-6">
        {workflowChanges.map((change) => (
          <div key={change.id} className="border border-border/50 rounded-lg p-4 bg-surface-secondary/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-accent font-mono bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                  {change.iteration}
                </span>
                <span className="text-xs font-bold text-text-primary font-mono">
                  Pipeline Restructure
                </span>
              </div>
              <Badge variant="success" className="font-mono text-[9px] px-1.5 py-0">
                {change.status}
              </Badge>
            </div>

            {/* Pipeline comparison row */}
            <div className="space-y-3">
              {/* Before pipeline */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono">
                  Before Pipeline
                </span>
                <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
                  {change.beforeWorkflow.map((node, nIdx) => (
                    <React.Fragment key={nIdx}>
                      <span className="px-2.5 py-1 bg-surface-secondary border border-border text-[10px] font-semibold rounded font-mono text-text-secondary shadow-xs">
                        {node}
                      </span>
                      {nIdx < change.beforeWorkflow.length - 1 && (
                        <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* After pipeline */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-accent uppercase tracking-wider font-mono">
                  After Pipeline (Evolved)
                </span>
                <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
                  {change.afterWorkflow.map((node, nIdx) => {
                    const isNew = !change.beforeWorkflow.includes(node)
                    return (
                      <React.Fragment key={nIdx}>
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded font-mono shadow-xs ${
                          isNew
                            ? 'bg-accent/15 border border-accent/40 text-accent animate-pulse'
                            : 'bg-surface-secondary border border-border text-text-secondary'
                        }`}>
                          {node}
                        </span>
                        {nIdx < change.afterWorkflow.length - 1 && (
                          <ChevronRight className={`w-3.5 h-3.5 ${isNew ? 'text-accent' : 'text-text-muted'}`} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Impact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border/40 text-[11px] leading-relaxed">
              <div className="space-y-2">
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
                    Trigger Cause / Why Changed
                  </span>
                  <p className="text-text-secondary mt-0.5 font-sans">
                    {change.whyChanged}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
                    Expected Workflow Impact
                  </span>
                  <p className="text-text-secondary mt-0.5 font-sans">
                    {change.expectedImpact}
                  </p>
                </div>
              </div>

              <div className="bg-success/10 border border-success/20 rounded p-3 flex flex-col justify-center space-y-1.5">
                <div className="flex items-center gap-1.5 text-success font-bold">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Measured Evolution Outcome</span>
                </div>
                <p className="text-text-primary font-medium">
                  {change.actualImpact}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
