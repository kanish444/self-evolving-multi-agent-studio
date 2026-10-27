import React from 'react'
import { Button } from '../../../components/ui/Button'
import { Play, Pause, Download, RotateCcw } from 'lucide-react'

interface LogsHeaderProps {
  isLive: boolean
  onToggleLive: () => void
  onExport: () => void
  onClearAll: () => void
  isFiltered: boolean
}

export const LogsHeader: React.FC<LogsHeaderProps> = ({
  isLive,
  onToggleLive,
  onExport,
  onClearAll,
  isFiltered,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4 select-none font-sans">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Logs & Observability</h1>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="relative flex h-1.5 w-1.5">
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-500"></span>
              )}
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
            </span>
            SYSTEM ONLINE
          </span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Trace agent activity, system events, failures, and execution history across the multi-agent software engineering pipeline.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Project Selector Metadata Box */}
        <div className="flex items-center gap-3.5 bg-surface-secondary border border-border px-3 py-1.5 rounded-md text-[10px] font-mono text-text-secondary shadow-xs">
          <div>
            Current Project: <span className="text-text-primary font-bold">Student Management System</span>
          </div>
          <div className="h-3 w-px bg-border"></div>
          <div>
            Iteration: <span className="text-text-primary font-bold">03</span>
          </div>
        </div>

        {isFiltered && (
          <Button
            variant="outline"
            size="xs"
            onClick={onClearAll}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="font-mono text-[10px] h-8"
          >
            Clear Filters
          </Button>
        )}

        <Button
          variant={isLive ? 'outline' : 'primary'}
          size="xs"
          onClick={onToggleLive}
          leftIcon={isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          className="font-mono text-[10px] h-8 min-w-[76px]"
        >
          {isLive ? 'PAUSE' : 'LIVE'}
        </Button>

        <Button
          variant="outline"
          size="xs"
          onClick={onExport}
          leftIcon={<Download className="w-3.5 h-3.5" />}
          className="font-mono text-[10px] h-8"
        >
          EXPORT
        </Button>
      </div>
    </div>
  )
}
