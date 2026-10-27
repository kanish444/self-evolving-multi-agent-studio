import React from 'react'
import type { LogEvent, LogEventType, LogStatus } from '../logs.mock'
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Bug,
  Eye,
  Sparkles,
  Brain,
  Settings,
  Clock,
  RefreshCw,
  Archive,
  Ban,
  Activity,
  Pin
} from 'lucide-react'

interface LogTableProps {
  events: LogEvent[]
  selectedId: string | null
  onSelectEvent: (id: string) => void
  pinnedIds: string[]
  onTogglePin: (id: string, e: React.MouseEvent) => void
}

export const LogTable: React.FC<LogTableProps> = ({
  events,
  selectedId,
  onSelectEvent,
  pinnedIds,
  onTogglePin,
}) => {
  const getEventBadge = (type: LogEventType) => {
    const styles: Record<LogEventType, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
      INFO: {
        bg: 'bg-accent-secondary/10',
        text: 'text-accent-secondary',
        border: 'border-accent-secondary/20',
        icon: <Info className="w-3 h-3" />,
      },
      SUCCESS: {
        bg: 'bg-success/10',
        text: 'text-success',
        border: 'border-success/20',
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      WARNING: {
        bg: 'bg-warning/10',
        text: 'text-warning',
        border: 'border-warning/20',
        icon: <AlertTriangle className="w-3 h-3" />,
      },
      ERROR: {
        bg: 'bg-error/10',
        text: 'text-error',
        border: 'border-error/20',
        icon: <XCircle className="w-3 h-3" />,
      },
      DEBUG: {
        bg: 'bg-surface-secondary',
        text: 'text-text-muted',
        border: 'border-border',
        icon: <Bug className="w-3 h-3" />,
      },
      REVIEW: {
        bg: 'bg-surface-secondary',
        text: 'text-text-secondary',
        border: 'border-border',
        icon: <Eye className="w-3 h-3" />,
      },
      EVOLUTION: {
        bg: 'bg-accent/10',
        text: 'text-accent',
        border: 'border-accent/20',
        icon: <Sparkles className="w-3 h-3" />,
      },
      MEMORY: {
        bg: 'bg-accent-secondary/10',
        text: 'text-accent-secondary',
        border: 'border-accent-secondary/20',
        icon: <Brain className="w-3 h-3" />,
      },
      SYSTEM: {
        bg: 'bg-surface-secondary',
        text: 'text-text-muted',
        border: 'border-border',
        icon: <Settings className="w-3 h-3" />,
      },
    }

    const val = styles[type] || styles.INFO
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono border shadow-3xs ${val.bg} ${val.text} ${val.border}`}>
        {val.icon}
        {type}
      </span>
    )
  }

  const getStatusBadge = (status: LogStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-success bg-success/10 px-2 py-0.2 rounded border border-success/20">
            <CheckCircle2 className="w-2.5 h-2.5 text-success" />
            COMPLETED
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-error bg-error/10 px-2 py-0.2 rounded border border-error/20">
            <XCircle className="w-2.5 h-2.5 text-error" />
            FAILED
          </span>
        )
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-accent bg-accent/10 px-2 py-0.2 rounded border border-accent/20 animate-pulse">
            <RefreshCw className="w-2.5 h-2.5 animate-spin text-accent" />
            RUNNING
          </span>
        )
      case 'WAITING':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-warning bg-warning/10 px-2 py-0.2 rounded border border-warning/20">
            <Clock className="w-2.5 h-2.5 text-warning" />
            WAITING
          </span>
        )
      case 'ANALYZING':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-accent bg-accent/10 px-2 py-0.2 rounded border border-accent/20">
            <RefreshCw className="w-2.5 h-2.5 animate-spin-slow text-accent" />
            ANALYZING
          </span>
        )
      case 'RETRYING':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-warning bg-warning/10 px-2 py-0.2 rounded border border-warning/20">
            <RefreshCw className="w-2.5 h-2.5 animate-spin text-warning" />
            RETRYING
          </span>
        )
      case 'STORED':
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-accent-secondary bg-accent-secondary/10 px-2 py-0.2 rounded border border-accent-secondary/20">
            <Archive className="w-2.5 h-2.5 text-accent-secondary" />
            STORED
          </span>
        )
      case 'CANCELLED':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono text-text-muted bg-surface-secondary px-2 py-0.2 rounded border border-border">
            <Ban className="w-2.5 h-2.5" />
            CANCELLED
          </span>
        )
    }
  }

  return (
    <div className="bg-surface border border-border rounded-md shadow-xs overflow-hidden select-none font-sans flex flex-col h-[520px]">
      {/* Table Title Header bar */}
      <div className="bg-surface-secondary border-b border-border px-4 py-3 flex items-center justify-between text-xs font-bold text-text-primary font-mono">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent animate-pulse" />
          <span>EVENT OBSERVABILITY LOG STREAM</span>
        </div>
        <span className="text-[10px] text-text-muted font-mono">Showing {events.length} logs</span>
      </div>

      {/* Main Table Content wrapper */}
      <div className="overflow-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-surface-secondary/80 border-b border-border/80 text-[10px] font-bold font-mono text-text-secondary uppercase tracking-wider select-none sticky top-0 bg-opacity-95 backdrop-blur-[1px] z-10">
              <th className="px-4 py-2.5 w-24">TIME</th>
              <th className="px-3 py-2.5 w-32">TYPE</th>
              <th className="px-3 py-2.5 w-40">AGENT</th>
              <th className="px-3 py-2.5 min-w-[200px] w-auto">ACTION / MESSAGE</th>
              <th className="px-3 py-2.5 w-52">PROJECT</th>
              <th className="px-3 py-2.5 w-28">ITERATION</th>
              <th className="px-3 py-2.5 w-32">STATUS</th>
              <th className="px-3 py-2.5 w-14 text-center">PIN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-xs font-mono">
            {events.map((evt) => {
              const isSelected = selectedId === evt.id
              const isPinned = pinnedIds.includes(evt.id)

              return (
                <tr
                  key={evt.id}
                  onClick={() => onSelectEvent(evt.id)}
                  className={`hover:bg-surface-secondary/80 cursor-pointer transition-colors group ${
                    isSelected ? 'bg-accent/10 font-semibold text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  <td className="px-4 py-2.5 text-text-muted font-bold tracking-tight">
                    {evt.timestamp}
                  </td>
                  <td className="px-3 py-2.5">
                    {getEventBadge(evt.type)}
                  </td>
                  <td className="px-3 py-2.5 text-text-primary font-semibold truncate" title={evt.agent}>
                    {evt.agent}
                  </td>
                  <td className="px-3 py-2.5 min-w-[200px] truncate" title={`${evt.action}: ${evt.message}`}>
                    <span className="text-text-primary font-bold">{evt.action}</span>
                    <span className="text-text-muted mx-1.5">•</span>
                    <span className="text-[11px] font-sans font-medium text-text-secondary">{evt.message}</span>
                  </td>
                  <td className="px-3 py-2.5 truncate" title={evt.project}>
                    {evt.project}
                  </td>
                  <td className="px-3 py-2.5 text-center text-accent font-bold bg-accent/5 border-x border-border/10">
                    {evt.iteration.replace('Iteration ', '')}
                  </td>
                  <td className="px-3 py-2.5">
                    {getStatusBadge(evt.status)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={(e) => onTogglePin(evt.id, e)}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        isPinned
                          ? 'text-accent hover:text-accent-hover bg-accent/15'
                          : 'text-text-muted hover:text-accent hover:bg-surface-secondary opacity-0 group-hover:opacity-100'
                      }`}
                      title={isPinned ? 'Unpin Event' : 'Pin Event'}
                    >
                      {isPinned ? <Pin className="w-3 h-3 fill-current" /> : <Pin className="w-3 h-3" />}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
