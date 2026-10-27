import React from 'react'
import type { LogEvent, LogEventType } from '../logs.mock'
import { Card } from '../../../components/ui/Card'
import { ArrowDown, Activity } from 'lucide-react'

interface TraceViewerProps {
  selectedEvent: LogEvent
  allEvents: LogEvent[]
  onSelectEvent: (id: string) => void
}

export const TraceViewer: React.FC<TraceViewerProps> = ({
  selectedEvent,
  allEvents,
  onSelectEvent,
}) => {
  // Filter all events sharing the same traceId, sorted oldest to newest (by id / timestamp)
  const traceEvents = React.useMemo(() => {
    return allEvents
      .filter((e) => e.traceId === selectedEvent.traceId)
      .sort((a, b) => a.id.localeCompare(b.id))
  }, [allEvents, selectedEvent.traceId])

  const getTypeColor = (type: LogEventType) => {
    switch (type) {
      case 'ERROR':
        return 'text-error border-error/30 bg-error/10'
      case 'SUCCESS':
        return 'text-success border-success/30 bg-success/10'
      case 'WARNING':
        return 'text-warning border-warning/30 bg-warning/10'
      case 'EVOLUTION':
        return 'text-accent border-accent/30 bg-accent/10'
      case 'MEMORY':
        return 'text-accent-secondary border-accent-secondary/30 bg-accent-secondary/10'
      default:
        return 'text-text-secondary border-border bg-surface-secondary'
    }
  }

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-3.5 select-none font-sans">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <Activity className="w-4 h-4 text-accent animate-pulse" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono flex-1">
          Orchestration Trace Viewer
        </h3>
        <span className="text-[9px] font-bold text-accent font-mono bg-accent/10 border border-accent/20 px-1.5 py-0.2 rounded">
          ID: {selectedEvent.traceId}
        </span>
      </div>

      <div className="space-y-3.5">
        <p className="text-[10px] text-text-secondary leading-normal">
          Chronological propagation path of agents collaborating under the active Trace context:
        </p>

        {traceEvents.length === 0 ? (
          <div className="text-center py-6 text-[10px] text-text-muted font-mono border border-dashed border-border rounded-md">
            No related trace events available.
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 py-1 max-h-[380px] overflow-y-auto custom-scrollbar">
            {traceEvents.map((evt, idx) => {
              const isCurrent = evt.id === selectedEvent.id
              return (
                <React.Fragment key={evt.id}>
                  {/* Event Step Node */}
                  <button
                    onClick={() => onSelectEvent(evt.id)}
                    className={`w-full max-w-[340px] text-left border rounded-md p-2.5 transition-all cursor-pointer shadow-xs hover:scale-[1.015] ${
                      isCurrent
                        ? 'border-accent bg-accent/15 ring-1 ring-accent scale-[1.01]'
                        : 'border-border bg-surface-secondary hover:border-accent/50 hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[9px] font-mono leading-none">
                      <span className="text-text-muted font-bold">{evt.timestamp}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border uppercase ${getTypeColor(evt.type)}`}>
                        {evt.type}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-mono font-bold text-text-primary leading-tight mt-1.5 truncate">
                      {evt.agent}: <span className="font-sans font-semibold text-text-secondary">{evt.action}</span>
                    </h4>
                    <p className="text-[9px] text-text-muted font-medium font-sans leading-normal line-clamp-1 mt-1">
                      {evt.message}
                    </p>
                  </button>

                  {/* Flow Arrow */}
                  {idx < traceEvents.length - 1 && (
                    <ArrowDown className="w-3.5 h-3.5 text-text-muted animate-bounce flex-shrink-0" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
