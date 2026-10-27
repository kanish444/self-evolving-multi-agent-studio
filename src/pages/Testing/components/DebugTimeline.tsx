import React from 'react'
import type { TimelineEvent } from '../mockData'
import { CheckCircle2, XCircle, PlayCircle, HelpCircle, Loader } from 'lucide-react'

interface DebugTimelineProps {
  events: TimelineEvent[]
}

export const DebugTimeline: React.FC<DebugTimelineProps> = ({ events }) => {
  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'success':
        return (
          <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
          </div>
        )
      case 'error':
        return (
          <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <XCircle className="w-3 h-3 animate-pulse" />
          </div>
        )
      case 'info':
        return (
          <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <PlayCircle className="w-3 h-3" />
          </div>
        )
      case 'warning':
        return (
          <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-3 h-3" />
          </div>
        )
      case 'pending':
        return (
          <div className="w-5 h-5 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-text-muted">
            <Loader className="w-3 h-3 animate-spin text-text-muted" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-command-card space-y-4">
      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
        Debugging Timeline
      </h3>

      <div className="relative pl-3 border-l border-border space-y-4 ml-2.5">
        {events.map((event, idx) => (
          <div key={idx} className="relative flex items-start gap-3">
            {/* Dot placement offset */}
            <div className="absolute -left-[23px] top-0.5">
              {getStatusIcon(event.status)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-text-primary">
                  {event.label}
                </span>
                <span className="text-[9px] font-mono text-text-muted">
                  {event.time}
                </span>
              </div>
              <p className="text-[10px] text-text-muted font-mono mt-0.5 uppercase tracking-wide">
                Status: {event.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
