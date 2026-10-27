import React from 'react'
import { Button } from '../../../components/ui/Button'
import { Play, RotateCcw, AlertTriangle, Square, PlayCircle, Loader2 } from 'lucide-react'

interface TestControlBarProps {
  onRunAllTests: () => void
  onRunFailedTests: () => void
  onRetryFailed: () => void
  onStop: () => void
  status: 'Running' | 'Idle'
  progress: number
  iteration: string
}

export const TestControlBar: React.FC<TestControlBarProps> = ({
  onRunAllTests,
  onRunFailedTests,
  onRetryFailed,
  onStop,
  status,
  progress,
  iteration,
}) => {
  const isRunning = status === 'Running'

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-surface border border-border rounded-2xl shadow-command-card">
      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={onRunAllTests}
          disabled={isRunning}
          leftIcon={isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
        >
          {isRunning ? 'Running...' : 'Run All Tests'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRunFailedTests}
          disabled={isRunning}
          leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-warning" />}
        >
          Run Failed Tests
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetryFailed}
          disabled={isRunning}
          leftIcon={<RotateCcw className="w-3.5 h-3.5 text-accent" />}
        >
          Retry Failed
        </Button>
        {isRunning && (
          <Button
            variant="danger"
            size="sm"
            onClick={onStop}
            leftIcon={<Square className="w-3.5 h-3.5 fill-current" />}
          >
            Stop
          </Button>
        )}
      </div>

      {/* Progress & Run Info HUD */}
      <div className="flex items-center gap-6 flex-1 max-w-md justify-end">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-text-muted mr-1.5 font-sans">Current Run:</span>
            <span className="font-bold text-text-primary">{iteration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted font-sans">Status:</span>
            {isRunning ? (
              <span className="text-system font-bold flex items-center gap-1">
                <PlayCircle className="w-3.5 h-3.5 animate-pulse text-system" />
                Running
              </span>
            ) : (
              <span className="text-text-muted font-bold">Idle</span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="flex-1 min-w-[120px] flex items-center gap-2">
            <div className="flex-1 bg-background h-2 rounded-full overflow-hidden border border-border">
              <div
                className="bg-gradient-to-r from-accent to-[#B8860B] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-accent w-8 text-right">
              {progress}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
