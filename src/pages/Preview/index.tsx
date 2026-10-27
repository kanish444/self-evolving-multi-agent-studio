import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Terminal,
  AlertCircle,
  Loader2,
  Layers,
  Shield
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useProject } from '../../context/ProjectContext'
import { previewApi, type PreviewStatus } from '../../services/api/preview'

export default function Preview() {
  const { activeProject, activeProjectId } = useProject()
  const [statusData, setStatusData] = useState<PreviewStatus>({
    status: 'NOT_STARTED',
    port: null,
    url: null,
    logs: [],
    uptime_seconds: 0,
    error: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showLogs, setShowLogs] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const fetchStatus = useCallback(async () => {
    if (!activeProjectId) return
    try {
      const data = await previewApi.getStatus(activeProjectId)
      setStatusData(data)
    } catch (err: any) {
      console.warn('Failed to poll preview status:', err)
    }
  }, [activeProjectId])

  // Poll status every 2 seconds when running or starting
  useEffect(() => {
    fetchStatus()
    const timer = setInterval(() => {
      fetchStatus()
    }, 2500)
    return () => clearInterval(timer)
  }, [fetchStatus])

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [statusData.logs])

  const handleStart = async () => {
    if (!activeProjectId) return
    setIsLoading(true)
    setActionError(null)
    try {
      const res = await previewApi.start(activeProjectId)
      if (res.status === 'RUNNING') {
        fetchStatus()
      } else {
        setActionError(res.message || 'Failed to start preview server.')
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to start application.')
    } finally {
      setIsLoading(false)
      fetchStatus()
    }
  }

  const handleStop = async () => {
    if (!activeProjectId) return
    setIsLoading(true)
    setActionError(null)
    try {
      await previewApi.stop(activeProjectId)
      fetchStatus()
    } catch (err: any) {
      setActionError(err.message || 'Failed to stop application.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestart = async () => {
    if (!activeProjectId) return
    setIsLoading(true)
    setActionError(null)
    try {
      await previewApi.restart(activeProjectId)
      fetchStatus()
    } catch (err: any) {
      setActionError(err.message || 'Failed to restart application.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!activeProject) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
        <Layers className="w-12 h-12 text-slate-500 mb-3" />
        <h2 className="text-lg font-semibold text-slate-200">No Active Project Selected</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          Select or create a project from the Projects tab to build, run, and preview the application.
        </p>
      </div>
    )
  }

  const isRunning = statusData.status === 'RUNNING'

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] overflow-hidden">
      {/* Top Controls Header */}
      <div className="bg-[#111827] border-b border-[#1F2937] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-slate-100">{activeProject.name}</h1>
              <span className="text-xs text-slate-400 font-mono">({activeProject.id})</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Live Local Preview Environment</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 pl-4 border-l border-[#1F2937]">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning
                  ? 'bg-emerald-500 animate-pulse'
                  : statusData.status === 'STARTING'
                  ? 'bg-amber-400 animate-pulse'
                  : statusData.status === 'FAILED'
                  ? 'bg-rose-500'
                  : 'bg-slate-500'
              }`}
            />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-300 font-mono">
              {statusData.status.replace('_', ' ')}
            </span>
            {statusData.port && (
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Port {statusData.port}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {!isRunning ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStart}
              disabled={isLoading}
              className="bg-[#2563EB] hover:bg-blue-600 text-white font-medium flex items-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>Run App</span>
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRestart}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-slate-200 border-[#1F2937]"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleStop}
                disabled={isLoading}
                className="flex items-center gap-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop App</span>
              </Button>
            </>
          )}

          {statusData.url && (
            <a
              href={statusData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-[#1F2937] hover:bg-[#334155] rounded-md transition-colors"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogs(!showLogs)}
            className={`flex items-center gap-1.5 ${showLogs ? 'text-blue-400' : 'text-slate-400'}`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Logs</span>
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-2.5 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Preview Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Live Preview Screen */}
        <div className="flex-1 bg-[#0B0F19] flex flex-col overflow-hidden relative">
          {isRunning && statusData.url ? (
            <iframe
              src={statusData.url}
              title={`Preview - ${activeProject.name}`}
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0B0F19]">
              <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center mb-4">
                <Play className="w-8 h-8 text-blue-400 ml-1" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">Application Not Running</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
                Start the application to verify functionality and interact with the live user interface in real time.
              </p>
              <div className="mt-5 flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStart}
                  disabled={isLoading}
                  className="bg-[#2563EB] hover:bg-blue-600 text-white font-medium flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>Run App</span>
                </Button>
              </div>

              {statusData.error && (
                <div className="mt-6 max-w-md bg-rose-950/40 border border-rose-800/40 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Startup Failure Diagnostics</span>
                  </div>
                  <pre className="text-[11px] font-mono text-rose-300 whitespace-pre-wrap">{statusData.error}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Runtime Logs Panel */}
        {showLogs && (
          <div className="w-96 border-l border-[#1F2937] bg-[#0A0F1D] flex flex-col flex-shrink-0">
            <div className="px-4 py-2.5 border-b border-[#1F2937] flex items-center justify-between bg-[#111827]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-200">Process Logs</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {statusData.logs.length} lines
              </span>
            </div>

            <div
              ref={logContainerRef}
              className="flex-1 p-3 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 custom-scrollbar bg-[#0A0F1D]"
            >
              {statusData.logs.length === 0 ? (
                <div className="text-slate-500 text-center py-8 text-xs font-sans">
                  No log output yet. Output from the process will appear here when running.
                </div>
              ) : (
                statusData.logs.map((log, idx) => (
                  <div key={idx} className="leading-tight text-[11px] hover:bg-[#111827] px-1 py-0.5 rounded">
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="p-2.5 border-t border-[#1F2937] bg-[#111827] text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Isolated Workspace Execution</span>
              </span>
              <span>Local preview</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
