import React, { useState } from 'react'
import type { LogEvent } from '../logs.mock'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import {
  X,
  Cpu,
  GitBranch,
  FileText,
  ArrowLeft,
  ArrowRight,
  Clipboard,
  ExternalLink
} from 'lucide-react'

interface EventDetailDrawerProps {
  event: LogEvent
  allEvents: LogEvent[]
  onSelectEvent: (id: string) => void
  onClose: () => void
  onCopyFeedback: (msg: string) => void
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  event,
  allEvents,
  onSelectEvent,
  onClose,
  onCopyFeedback,
}) => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'raw' | 'json' | 'payload' | 'telemetry'>('overview')

  // Find index in current events list to get previous & next context
  const currentIndex = allEvents.findIndex((e) => e.id === event.id)
  const prevEvent = currentIndex > 0 ? allEvents[currentIndex - 1] : null
  const nextEvent = currentIndex < allEvents.length - 1 ? allEvents[currentIndex + 1] : null

  // Cross page redirection links based on log type / source
  const handleRedirect = () => {
    switch (event.type) {
      case 'ERROR':
        if (event.action.includes('test') || event.test) {
          navigate('/testing')
        } else {
          navigate('/workspace')
        }
        break
      case 'EVOLUTION':
        navigate('/evolution')
        break
      case 'MEMORY':
        navigate('/memory')
        break
      case 'REVIEW':
      case 'DEBUG':
        navigate('/agents')
        break
      default:
        navigate('/workspace')
        break
    }
  }

  const getRedirectLabel = () => {
    switch (event.type) {
      case 'ERROR':
        if (event.action.includes('test') || event.test) return 'Open in Testing Center'
        return 'Open in Workspace IDE'
      case 'EVOLUTION':
        return 'Open in Self-Evolution Center'
      case 'MEMORY':
        return 'Open in Memory & Learning'
      case 'REVIEW':
      case 'DEBUG':
        return 'Inspect Agent Orchestrator'
      default:
        return 'Go to Workspace IDE'
    }
  }

  // Get raw log ASCII format representation
  const getRawLogText = () => {
    const statusTag = event.status ? ` [${event.status}]` : ''
    const durationTag = event.duration ? ` (elapsed: ${event.duration})` : ''
    return `[${event.timestamp}] [${event.type}]${statusTag} [${event.agent}]
Action: ${event.action}
File: ${event.file} ${event.test ? `| Test: ${event.test}` : ''}
Message: ${event.message}
Trace ID: ${event.traceId} | Correlation ID: ${event.correlationId}${durationTag}`
  }

  return (
    <Card className="p-5 border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 relative flex flex-col h-full overflow-hidden select-none font-sans">
      {/* Header controls */}
      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">
              {event.id} • {event.type}
            </span>
            <span className="text-text-muted text-[10px] font-mono">•</span>
            <span className="text-[9px] font-bold text-accent-secondary font-mono bg-accent-secondary/10 px-1.5 py-0.2 rounded border border-accent-secondary/20">
              {event.status}
            </span>
          </div>
          <h3 className="text-xs font-bold text-text-primary font-mono leading-relaxed truncate" title={event.action}>
            {event.action}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 hover:bg-surface-elevated rounded border border-border text-text-secondary cursor-pointer bg-surface-secondary"
          title="Close details"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs selectors */}
      <div className="border-b border-border select-none">
        <div className="flex gap-2 text-[10px] font-mono font-bold overflow-x-auto custom-scrollbar">
          {(['overview', 'raw', 'json', 'payload', 'telemetry'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setActiveTab(tabKey)}
              className={`pb-2 border-b-2 px-1 cursor-pointer transition-colors whitespace-nowrap ${
                activeTab === tabKey
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {tabKey.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable tab contents */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-0.5 space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            {/* Event Description Message Box */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
                Event Description
              </span>
              <p className="text-text-secondary leading-relaxed bg-surface-secondary border border-border p-3 rounded-md">
                {event.message}
              </p>
            </div>

            {/* Core Metadata layout parameters Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono text-[10px]">
              <div className="p-2.5 bg-surface-secondary border border-border rounded-md">
                <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider block">Agent Executor</span>
                <div className="font-sans font-bold text-text-primary mt-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-accent" />
                  {event.agent}
                </div>
              </div>
              <div className="p-2.5 bg-surface-secondary border border-border rounded-md">
                <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider block">Scope / File</span>
                <div className="font-bold text-text-primary mt-1 flex items-center gap-1.5 truncate" title={event.file}>
                  <FileText className="w-3.5 h-3.5 text-accent-secondary" />
                  {event.file}
                </div>
              </div>
              <div className="p-2.5 bg-surface-secondary border border-border rounded-md">
                <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider block">Scope Project</span>
                <div className="font-sans font-semibold text-text-primary mt-1 truncate" title={event.project}>
                  {event.project}
                </div>
              </div>
              <div className="p-2.5 bg-surface-secondary border border-border rounded-md">
                <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider block">Iteration / Timeline</span>
                <div className="font-semibold text-text-primary mt-1 flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-success" />
                  {event.iteration}
                </div>
              </div>
            </div>

            {/* Diagnostics Stats Bar */}
            <div className="grid grid-cols-3 gap-2.5 text-center font-mono text-[9px] bg-surface-secondary p-2 border border-border rounded-md">
              <div>
                <span className="text-text-muted uppercase block">Time</span>
                <span className="font-semibold text-text-secondary block mt-0.5">{event.timestamp}</span>
              </div>
              <div>
                <span className="text-text-muted uppercase block">Duration</span>
                <span className="font-semibold text-text-secondary block mt-0.5">{event.duration || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-muted uppercase block">Test Name</span>
                <span className="font-bold text-error block mt-0.5 truncate" title={event.test || 'N/A'}>
                  {event.test || 'None'}
                </span>
              </div>
            </div>

            {/* Trace correlation IDs */}
            <div className="p-2.5 bg-surface-secondary border border-border rounded-md space-y-2 font-mono text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-bold">Trace Identifier:</span>
                <span className="text-accent font-bold bg-accent/10 border border-accent/20 px-1.5 py-0.2 rounded">
                  {event.traceId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-bold">Correlation ID:</span>
                <span className="text-accent-secondary font-bold bg-accent-secondary/10 border border-accent-secondary/20 px-1.5 py-0.2 rounded">
                  {event.correlationId}
                </span>
              </div>
            </div>

            {/* Cross-page redirection buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedirect}
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              className="w-full font-mono text-[10px]"
            >
              {getRedirectLabel()}
            </Button>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="relative font-mono text-[10.5px] leading-relaxed bg-surface-secondary border border-border p-4 rounded-md text-text-secondary min-h-[150px]">
            <pre className="whitespace-pre-wrap word-break">{getRawLogText()}</pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(getRawLogText())
                onCopyFeedback('Raw log copied.')
              }}
              className="absolute top-2.5 right-2.5 p-1 rounded bg-surface-elevated hover:bg-surface-secondary text-text-muted hover:text-text-primary border border-border cursor-pointer"
              title="Copy Raw Log"
            >
              <Clipboard className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="relative font-mono text-[10px] bg-surface-secondary border border-border p-3.5 rounded-md text-text-secondary max-h-[340px] overflow-auto custom-scrollbar">
            <pre className="whitespace-pre-wrap leading-normal">{JSON.stringify(event, null, 2)}</pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(event, null, 2))
                onCopyFeedback('JSON payload copied.')
              }}
              className="absolute top-2.5 right-2.5 p-1 rounded bg-surface-elevated hover:bg-surface-secondary text-text-muted hover:text-text-primary border border-border cursor-pointer"
              title="Copy JSON payload"
            >
              <Clipboard className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {activeTab === 'payload' && (
          <div className="space-y-3 font-mono text-[10px]">
            <div className="space-y-1">
              <span className="text-text-muted uppercase text-[8px] block">Raw Input / Request Data</span>
              <pre className="p-2.5 bg-surface-secondary border border-border rounded text-text-secondary overflow-x-auto text-[9.5px] max-h-36 custom-scrollbar">
                {JSON.stringify(event.metadata || { action: event.action, file: event.file, timestamp: event.timestamp }, null, 2)}
              </pre>
            </div>
            <div className="space-y-1">
              <span className="text-text-muted uppercase text-[8px] block">Response Output / State Diff</span>
              <pre className="p-2.5 bg-surface-secondary border border-border rounded text-text-secondary overflow-x-auto text-[9.5px] max-h-36 custom-scrollbar">
                {JSON.stringify({ status: event.status, duration: event.duration, memory_delta: "+1.2MB", state: "CONVERGED" }, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div className="space-y-2.5 font-mono text-[10px]">
            <div className="p-2 border border-border rounded bg-surface-secondary space-y-1">
              <div className="flex justify-between text-text-secondary">
                <span>Memory Footprint:</span>
                <span className="font-bold text-text-primary">14.2 MB / 512 MB</span>
              </div>
              <div className="w-full bg-surface-base border border-border h-1.5 rounded-full overflow-hidden">
                <div className="bg-accent h-full rounded-full" style={{ width: '18%' }} />
              </div>
            </div>

            <div className="p-2 border border-border rounded bg-surface-secondary space-y-1">
              <div className="flex justify-between text-text-secondary">
                <span>CPU Execution Load:</span>
                <span className="font-bold text-text-primary">4.1% / 100%</span>
              </div>
              <div className="w-full bg-surface-base border border-border h-1.5 rounded-full overflow-hidden">
                <div className="bg-accent-secondary h-full rounded-full" style={{ width: '8%' }} />
              </div>
            </div>

            <div className="p-2 border border-border rounded bg-surface-secondary flex items-center justify-between">
              <span className="text-text-secondary">Sandbox Node:</span>
              <span className="font-bold text-text-primary">Worker-04 (Isolate)</span>
            </div>
          </div>
        )}
      </div>

      {/* Context Chronological Event Sequence Navigation */}
      <div className="border-t border-border pt-3.5 space-y-2 select-none">
        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
          Event Context Timeline
        </span>
        <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
          {/* Previous event button */}
          {prevEvent ? (
            <button
              onClick={() => onSelectEvent(prevEvent.id)}
              className="p-2 border border-border hover:border-accent/50 rounded text-left transition-colors bg-surface-secondary hover:bg-surface-elevated cursor-pointer flex flex-col justify-between min-h-[55px] font-mono text-[9px]"
            >
              <span className="text-text-muted flex items-center gap-0.5 uppercase text-[8px] font-bold font-mono">
                <ArrowLeft className="w-2.5 h-2.5" /> Previous ({prevEvent.timestamp})
              </span>
              <span className="text-text-primary font-sans font-bold leading-tight line-clamp-2 mt-1">
                {prevEvent.action}
              </span>
            </button>
          ) : (
            <div className="p-2 border border-dashed border-border rounded bg-surface-secondary text-text-muted flex items-center justify-center text-[9px] min-h-[55px] select-none font-mono">
              Start of Stream
            </div>
          )}

          {/* Next event button */}
          {nextEvent ? (
            <button
              onClick={() => onSelectEvent(nextEvent.id)}
              className="p-2 border border-border hover:border-accent/50 rounded text-left transition-colors bg-surface-secondary hover:bg-surface-elevated cursor-pointer flex flex-col justify-between min-h-[55px] font-mono text-[9px]"
            >
              <span className="text-text-muted flex items-center justify-end gap-0.5 uppercase text-[8px] font-bold font-mono w-full text-right">
                Next ({nextEvent.timestamp}) <ArrowRight className="w-2.5 h-2.5" />
              </span>
              <span className="text-text-primary font-sans font-bold leading-tight line-clamp-2 mt-1 w-full text-right">
                {nextEvent.action}
              </span>
            </button>
          ) : (
            <div className="p-2 border border-dashed border-border rounded bg-surface-secondary text-text-muted flex items-center justify-center text-[9px] min-h-[55px] select-none font-mono">
              End of Stream
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
