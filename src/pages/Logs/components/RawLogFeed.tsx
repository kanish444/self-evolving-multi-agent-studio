import React, { useRef, useEffect } from 'react'
import type { LogEvent } from '../logs.mock'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { Terminal, Copy, Trash2, ArrowDown, Play, Pause } from 'lucide-react'

interface RawLogFeedProps {
  events: LogEvent[]
  isLive: boolean
  onToggleLive: () => void
  onCopyFeedback: (msg: string) => void
}

export const RawLogFeed: React.FC<RawLogFeedProps> = ({
  events,
  isLive,
  onToggleLive,
  onCopyFeedback,
}) => {
  const [clearedCount, setClearedCount] = React.useState(0)
  const [autoScroll, setAutoScroll] = React.useState(true)
  const terminalRef = useRef<HTMLDivElement>(null)

  // Derive active events displayed (filter out logs before clear action)
  const displayedEvents = React.useMemo(() => {
    if (clearedCount >= events.length) return []
    const newEventsCount = events.length - clearedCount
    return events.slice(0, newEventsCount)
  }, [events, clearedCount])

  // Get raw log string lines (Render chronologically in terminal stdout stream)
  const rawLogsText = React.useMemo(() => {
    return [...displayedEvents]
      .reverse()
      .map((e) => `[${e.timestamp}] [${e.type}] [${e.agent}] ${e.action} • ${e.message}`)
      .join('\n')
  }, [displayedEvents])

  // Scroll to bottom if autoScroll is enabled
  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [rawLogsText, autoScroll])

  const handleCopy = () => {
    if (!rawLogsText) return
    navigator.clipboard.writeText(rawLogsText).then(() => {
      onCopyFeedback('Raw logs copied to clipboard.')
    }).catch(() => {
      onCopyFeedback('Raw logs copied to clipboard.')
    })
  }

  const handleClear = () => {
    setClearedCount(events.length)
    onCopyFeedback('Raw console feed cleared.')
  }

  return (
    <Card padded={false} className="flex flex-col bg-slate-900 border-slate-950 text-slate-350 font-mono text-[11px] h-[500px] overflow-hidden select-none">
      {/* Header bar controls */}
      <div className="border-b border-slate-950 px-3.5 py-2.5 flex items-center justify-between text-slate-400 bg-slate-950 select-none">
        <div className="flex items-center gap-1.5 font-bold">
          <Terminal className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>Observability Stdout Feed</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <span className="flex items-center gap-1 text-[9px] font-bold mr-2 text-indigo-400">
            <span className={`w-1.5 h-1.5 rounded-full bg-indigo-500 ${isLive ? 'animate-pulse' : ''}`} />
            {isLive ? 'LIVE STREAMING' : 'STREAM PAUSED'}
          </span>

          <Button
            variant="outline"
            size="xs"
            onClick={onToggleLive}
            className="font-mono text-[9px] h-6 px-2 border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          >
            {isLive ? <Pause className="w-3.5 h-3.5 text-slate-400 mr-1" /> : <Play className="w-3.5 h-3.5 text-slate-400 mr-1" />}
            {isLive ? 'Pause' : 'Resume'}
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`font-mono text-[9px] h-6 px-2 border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-slate-200 ${
              autoScroll ? 'text-accent border-accent/20 bg-accent-soft/5' : 'text-slate-400'
            }`}
          >
            <ArrowDown className="w-3 h-3 mr-1" />
            Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={handleCopy}
            disabled={!rawLogsText}
            className="font-mono text-[9px] h-6 px-2 border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
          >
            <Copy className="w-3 h-3 mr-1" />
            Copy
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={handleClear}
            disabled={!rawLogsText}
            className="font-mono text-[9px] h-6 px-2 border-slate-800 bg-slate-900 text-rose-500 hover:bg-slate-850 hover:text-rose-400"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Monospace content panel */}
      <div
        ref={terminalRef}
        className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-1.5 leading-relaxed bg-slate-950/80 font-mono text-[10.5px] select-text text-slate-300 select-all"
      >
        {rawLogsText ? (
          <pre className="whitespace-pre-wrap">{rawLogsText}</pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 font-sans italic text-xs select-none">
            Stdout feed is clear. Trigger live event generations to populate terminal logs.
          </div>
        )}
      </div>
    </Card>
  )
}
