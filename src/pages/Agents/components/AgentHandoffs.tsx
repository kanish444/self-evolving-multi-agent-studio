import React from 'react'
import { ArrowRight, Users, Clock } from 'lucide-react'
import type { HandoffItem } from '../mockData'

interface AgentHandoffsProps {
  handoffs: HandoffItem[]
}

export const AgentHandoffs: React.FC<AgentHandoffsProps> = ({
  handoffs
}) => {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col h-[280px] shadow-command-card select-none">
      {/* Header */}
      <div className="border-b border-border pb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Agent Handoff Telemetry
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">{handoffs.length} transfers</span>
      </div>

      {/* Handoff steps timeline */}
      <div className="flex-1 overflow-y-auto custom-scrollbar mt-3 space-y-2">
        {handoffs.map((handoff) => (
          <div
            key={handoff.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary border border-border hover:border-[rgba(179, 68, 30, 0.35)] transition-colors font-mono text-[11px]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-text-primary font-semibold truncate max-w-[100px]">
                {handoff.fromAgent}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-accent animate-pulse flex-shrink-0" />
              <span className="text-accent font-semibold truncate max-w-[100px]">
                {handoff.toAgent}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-muted flex-shrink-0 text-[10px]">
              <Clock className="w-3 h-3" />
              <span>{handoff.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
