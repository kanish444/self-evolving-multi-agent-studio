import React from 'react'
import { Card } from '../../../components/ui/Card'
import { Activity, Terminal } from 'lucide-react'
import type { EvolutionSession } from '../mockData'

interface CurrentEvolutionSessionProps {
  session: EvolutionSession
}

export const CurrentEvolutionSession: React.FC<CurrentEvolutionSessionProps> = ({ session }) => {
  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent animate-pulse" />
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Current Evolution Session
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-[10px] font-bold font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded border border-accent/20">
            {session.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono border-b border-border/40 pb-3">
        <div className="p-2 bg-surface-secondary border border-border rounded">
          <span className="text-[9px] text-text-muted uppercase block">Iteration</span>
          <span className="font-bold text-text-primary">{session.iteration}</span>
        </div>
        <div className="p-2 bg-surface-secondary border border-border rounded">
          <span className="text-[9px] text-text-muted uppercase block">Progress</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex-1 bg-surface-base h-1.5 rounded overflow-hidden">
              <div
                className="bg-accent h-full rounded"
                style={{ width: `${session.progress}%` }}
              />
            </div>
            <span className="font-bold text-accent text-[10px]">
              {session.progress}%
            </span>
          </div>
        </div>
        <div className="p-2 bg-surface-secondary border border-border rounded col-span-2 grid grid-cols-4 gap-1 text-center">
          <div>
            <span className="text-[8px] text-text-muted block leading-none">Reviews</span>
            <span className="font-bold text-text-secondary mt-0.5 block">{session.failuresReviewed}</span>
          </div>
          <div>
            <span className="text-[8px] text-text-muted block leading-none">Patterns</span>
            <span className="font-bold text-text-secondary mt-0.5 block">{session.patternsFound}</span>
          </div>
          <div>
            <span className="text-[8px] text-text-muted block leading-none">Learnings</span>
            <span className="font-bold text-text-secondary mt-0.5 block">{session.newLearnings}</span>
          </div>
          <div>
            <span className="text-[8px] text-text-muted block leading-none">Changes</span>
            <span className="font-bold text-text-secondary mt-0.5 block">{session.workflowChanges}</span>
          </div>
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold font-mono">
          <Terminal className="w-3.5 h-3.5 text-text-muted" />
          <span>Active Session Events</span>
        </div>
        <div className="bg-surface-base border border-border text-text-primary font-mono text-[10px] p-3.5 rounded-md h-36 overflow-y-auto custom-scrollbar flex flex-col justify-between">
          <div className="space-y-2">
            {session.logs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-1.5 leading-relaxed text-text-secondary">
                <span className="text-text-muted">[{log.time}]</span>
                <span className="text-success font-semibold flex-shrink-0">&gt;</span>
                <span className="break-words">{log.msg}</span>
              </div>
            ))}
          </div>
          <div className="text-[9px] text-text-muted text-right pt-2 border-t border-border mt-2 flex justify-between">
            <span>Buffer OK</span>
            <span className="text-success animate-pulse">● CONNECTED</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
