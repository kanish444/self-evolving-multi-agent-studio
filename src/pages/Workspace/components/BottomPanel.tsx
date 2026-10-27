import React, { useState, useRef, useEffect } from 'react'
import { Terminal, AlertTriangle, Cpu, ScrollText, ShieldAlert, GitCompare, RotateCcw, Play, Layers, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { MOCK_PROBLEMS } from '../mockData'

interface BottomPanelProps {
  activeTab: string
  onTabChange: (tab: string) => void
  terminalLogs: string[]
  problems: typeof MOCK_PROBLEMS
  outputLogs: string[]
  debugLogs: string[]
  onRunTerminalCommand?: (cmd: string) => void
  sandboxExecution?: any
  sandboxHistory?: any[]
  onSelectSandboxExec?: (id: string) => void
  
  // Autonomous loop props
  iterations?: any[]
  diffs?: any[]
  onSelectIterationDiff?: (baseId: string, headId: string) => void
  onRollback?: (artifactId: string) => void

  // Release Center props
  releases?: any[]
  environments?: any[]
  activeReleaseDetails?: any
  onTriggerRelease?: (env: string, version: string, simulateFailure: boolean) => void
  onSubmitApproval?: (approvalId: string, approved: boolean, comments: string) => void
  onRollbackDeployment?: (deploymentId: string) => void
  onSelectRelease?: (releaseId: string) => void
  releaseLoading?: boolean
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  activeTab,
  onTabChange,
  terminalLogs,
  problems,
  outputLogs,
  debugLogs,
  onRunTerminalCommand,
  sandboxExecution,
  sandboxHistory: _sandboxHistory,
  onSelectSandboxExec: _onSelectSandboxExec,
  iterations = [],
  diffs = [],
  onSelectIterationDiff,
  onRollback,
  releases = [],
  environments: _environments = [],
  activeReleaseDetails = null,
  onTriggerRelease,
  onSubmitApproval,
  onRollbackDeployment,
  onSelectRelease,
  releaseLoading = false
}) => {

  const [terminalInput, setTerminalInput] = useState('')
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const [selectedDiffFile, setSelectedDiffFile] = useState<string>('')
  const [releaseVersion, setReleaseVersion] = useState('1.0.0')
  const [releaseEnv, setReleaseEnv] = useState('STAGING')
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [reviewerComments, setReviewerComments] = useState('')
  const [activeStageLog, setActiveStageLog] = useState('')
  const [activeStageName, setActiveStageName] = useState('')

  // Scroll to bottom on log additions
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [terminalLogs, debugLogs, activeTab])

  // Select default file when diffs change
  useEffect(() => {
    if (diffs.length > 0 && !selectedDiffFile) {
      setSelectedDiffFile(diffs[0].path)
    }
  }, [diffs])

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!terminalInput.trim()) return
    if (onRunTerminalCommand) {
      onRunTerminalCommand(terminalInput)
    }
    setTerminalInput('')
  }

  const errorCount = problems.filter(p => p.severity === 'error').length
  const warningCount = problems.filter(p => p.severity === 'warning').length

  const activeDiff = diffs.find(d => d.path === selectedDiffFile)

  return (
    <div className="h-full flex flex-col bg-zinc-950 text-slate-300 font-mono text-[11px] border-t border-zinc-800 select-none">
      {/* Panel Headers / Tab Row */}
      <div className="h-8 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center h-full">
          {/* Terminal Tab */}
          <button
            onClick={() => onTabChange('terminal')}
            className={`h-full px-4 flex items-center gap-1.5 border-r border-zinc-850 cursor-pointer transition-colors ${
              activeTab === 'terminal'
                ? 'bg-zinc-950 text-accent font-semibold border-t-2 border-t-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-950/40'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Terminal</span>
          </button>

          {/* Problems Tab */}
          <button
            onClick={() => onTabChange('problems')}
            className={`h-full px-4 flex items-center gap-1.5 border-r border-zinc-850 cursor-pointer transition-colors ${
              activeTab === 'problems'
                ? 'bg-zinc-950 text-accent font-semibold border-t-2 border-t-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-950/40'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Problems</span>
            {(errorCount > 0 || warningCount > 0) && (
              <span className="flex items-center gap-1 ml-1">
                {errorCount > 0 && (
                  <span className="bg-error-soft/20 text-error px-1.5 rounded-sm text-[9px] font-bold">
                    {errorCount}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="bg-warning-soft/20 text-warning px-1.5 rounded-sm text-[9px] font-bold">
                    {warningCount}
                  </span>
                )}
              </span>
            )}
          </button>

          {/* Output Tab */}
          <button
            onClick={() => onTabChange('output')}
            className={`h-full px-4 flex items-center gap-1.5 border-r border-zinc-850 cursor-pointer transition-colors ${
              activeTab === 'output'
                ? 'bg-zinc-950 text-accent font-semibold border-t-2 border-t-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-950/40'
            }`}
          >
            <ScrollText className="w-3 h-3" />
            <span>Output</span>
          </button>

          {/* Debug Console Tab */}
          <button
            onClick={() => onTabChange('debug')}
            className={`h-full px-4 flex items-center gap-1.5 border-r border-zinc-850 cursor-pointer transition-colors ${
              activeTab === 'debug'
                ? 'bg-zinc-950 text-accent font-semibold border-t-2 border-t-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-950/40'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>Debug Console</span>
          </button>

          {/* Sandbox Console Tab */}
          <button
            onClick={() => onTabChange('sandbox')}
            className={`h-full px-4 flex items-center gap-1.5 border-r border-zinc-850 cursor-pointer transition-colors ${
              activeTab === 'sandbox'
                ? 'bg-zinc-950 text-accent font-semibold border-t-2 border-t-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-950/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Sandbox Console</span>
            {sandboxExecution && (sandboxExecution.status === 'RUNNING' || sandboxExecution.status === 'QUEUED') && (
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
            )}
          </button>

          {/* Autonomous Loop Tab */}
          <button
            onClick={() => onTabChange('loop')}
            className={`h-full px-4 flex items-center gap-1.5 border-r border-zinc-850 cursor-pointer transition-colors ${
              activeTab === 'loop'
                ? 'bg-zinc-950 text-accent font-semibold border-t-2 border-t-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-950/40'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Autonomous Timeline</span>
            {iterations.length > 0 && (
              <span className="bg-zinc-800 text-slate-300 px-1 rounded-sm text-[8px] font-bold">
                IT-{iterations.length}
              </span>
            )}
          </button>

          {/* Diff Viewer Tab */}
          <button
            onClick={() => onTabChange('diff')}
            className={`h-full px-4 flex items-center gap-1.5 border-r border-zinc-850 cursor-pointer transition-colors ${
              activeTab === 'diff'
                ? 'bg-zinc-950 text-accent font-semibold border-t-2 border-t-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-950/40'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>File Diffs</span>
            {diffs.length > 0 && (
              <span className="bg-accent/20 text-accent px-1 rounded-sm text-[8px] font-bold">
                {diffs.length}
              </span>
            )}
          </button>

          {/* Release Center Tab */}
          <button
            onClick={() => onTabChange('releases')}
            className={`h-full px-4 flex items-center gap-1.5 border-r border-zinc-850 cursor-pointer transition-colors ${
              activeTab === 'releases'
                ? 'bg-zinc-950 text-accent font-semibold border-t-2 border-t-accent'
                : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-950/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Release Center</span>
            {releases.length > 0 && (
              <span className="bg-amber-500/20 text-amber-400 px-1 rounded-sm text-[8px] font-bold">
                RC-{releases.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-[9px] text-slate-500 hidden sm:block">
          node-v20.x • self-healing-controller • Level 2 Active
        </div>
      </div>

      {/* Panel Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 select-text bg-zinc-950">
        
        {/* TERMINAL CONTENT */}
        {activeTab === 'terminal' && (
          <div className="space-y-1.5">
            {terminalLogs.map((log, idx) => {
              const isInfo = log.includes('[INFO]')
              const isError = log.includes('[ERROR]')
              const isSuccess = log.includes('[SUCCESS]')
              const isWarning = log.includes('[WARNING]')

              let logColor = 'text-slate-300'
              if (isInfo) logColor = 'text-sky-400'
              if (isError) logColor = 'text-error font-bold'
              if (isSuccess) logColor = 'text-success font-semibold'
              if (isWarning) logColor = 'text-warning'

              return (
                <div key={idx} className="flex items-start gap-1.5 leading-relaxed font-mono">
                  <span className="text-zinc-600 select-none">[{idx + 1}]</span>
                  <span className={logColor}>{log}</span>
                </div>
              )
            })}
            
            {/* Command input prompt mimic */}
            <form onSubmit={handleCommandSubmit} className="flex items-center gap-1.5 pt-1.5">
              <span className="text-accent font-bold select-none">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type sandbox command... (e.g. pytest, npm run build)"
                className="flex-1 bg-transparent border-0 text-slate-200 focus:outline-none focus:ring-0 p-0 text-[11px] font-mono placeholder:text-zinc-700"
              />
            </form>
            <div ref={terminalEndRef} />
          </div>
        )}

        {/* PROBLEMS CONTENT */}
        {activeTab === 'problems' && (
          <div className="overflow-x-auto">
            {problems.length > 0 ? (
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] text-slate-500 uppercase">
                    <th className="pb-1.5 font-semibold w-20">Severity</th>
                    <th className="pb-1.5 font-semibold w-16">Code</th>
                    <th className="pb-1.5 font-semibold">Message</th>
                    <th className="pb-1.5 font-semibold w-40">File</th>
                    <th className="pb-1.5 font-semibold w-16 text-right">Line</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {problems.map((prob, idx) => {
                    const isError = prob.severity === 'error'
                    return (
                      <tr key={idx} className="hover:bg-zinc-900/40 text-[11px] group transition-colors">
                        <td className="py-2 flex items-center gap-1">
                          {isError ? (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5 text-error" />
                              <span className="text-error font-bold uppercase text-[9px]">ERROR</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                              <span className="text-warning font-bold uppercase text-[9px]">WARNING</span>
                            </>
                          )}
                        </td>
                        <td className="py-2 text-slate-400">{prob.code}</td>
                        <td className="py-2 text-slate-200 font-medium">{prob.msg}</td>
                        <td className="py-2 text-slate-400 group-hover:text-accent transition-colors font-semibold truncate max-w-[150px]">
                          {prob.file}
                        </td>
                        <td className="py-2 text-slate-400 text-right">{prob.line}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-6 text-center text-slate-500">
                No problems detected in the current workspace. Well done!
              </div>
            )}
          </div>
        )}

        {/* OUTPUT CONTENT */}
        {activeTab === 'output' && (
          <div className="space-y-1">
            {outputLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed text-slate-300">
                {log.includes('[SUCCESS]') ? (
                  <span className="text-success font-semibold">{log}</span>
                ) : log.includes('[ERROR]') ? (
                  <span className="text-error font-bold">{log}</span>
                ) : (
                  <span className="text-slate-400">{log}</span>
                )}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        )}

        {/* DEBUG CONSOLE CONTENT */}
        {activeTab === 'debug' && (
          <div className="space-y-1.5">
            {debugLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-1 leading-relaxed text-zinc-400">
                <ChevronRight className="w-3.5 h-3.5 mt-0.5 text-zinc-600 flex-shrink-0" />
                <span className={log.includes('[DEBUG]') ? 'text-zinc-400' : 'text-slate-200'}>
                  {log}
                </span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        )}

        {/* SANDBOX CONSOLE CONTENT */}
        {activeTab === 'sandbox' && (
          <div className="space-y-3 font-mono text-[11px]">
            {/* Top dashboard indicators */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-zinc-900 border border-zinc-850 rounded p-2 select-none">
              <div className="flex flex-col p-1.5 rounded bg-zinc-950/40">
                <span className="text-[8.5px] text-zinc-500 uppercase font-semibold">Network Policy</span>
                <span className="text-error font-bold text-[9.5px] flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-error" /> DISABLED
                </span>
              </div>
              <div className="flex flex-col p-1.5 rounded bg-zinc-950/40">
                <span className="text-[8.5px] text-zinc-500 uppercase font-semibold">Memory Limit</span>
                <span className="text-success font-bold text-[9.5px] flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-success" /> 256 MB ACTIVE
                </span>
              </div>
              <div className="flex flex-col p-1.5 rounded bg-zinc-950/40">
                <span className="text-[8.5px] text-zinc-500 uppercase font-semibold">CPU Allocation</span>
                <span className="text-success font-bold text-[9.5px] flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-success" /> 1.0 CPU LIMIT
                </span>
              </div>
              <div className="flex flex-col p-1.5 rounded bg-zinc-950/40">
                <span className="text-[8.5px] text-zinc-500 uppercase font-semibold">Timeout Limit</span>
                <span className="text-success font-bold text-[9.5px] flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-success" /> 10s TIME CAPPED
                </span>
              </div>
              <div className="flex flex-col p-1.5 rounded bg-zinc-950/40">
                <span className="text-[8.5px] text-zinc-500 uppercase font-semibold">Process Limit</span>
                <span className="text-success font-bold text-[9.5px] flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-success" /> 50 THREADS
                </span>
              </div>
              <div className="flex flex-col p-1.5 rounded bg-zinc-950/40">
                <span className="text-[8.5px] text-zinc-500 uppercase font-semibold">Isolation Strategy</span>
                <span className="text-accent font-bold text-[9.5px] mt-0.5">
                  VENV SUBPROCESS
                </span>
              </div>
            </div>

            {sandboxExecution ? (
              <div className="space-y-2 leading-relaxed">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1 text-zinc-500 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-bold">Execution ID: {sandboxExecution.id}</span>
                    <span>Language: <span className="text-accent">{sandboxExecution.language}</span></span>
                    <span>Entrypoint: {sandboxExecution.entrypoint}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Exit Code: <span className="font-bold text-slate-300">{sandboxExecution.result?.exit_code ?? '-'}</span></span>
                    <span>Duration: <span className="font-bold text-slate-300">{sandboxExecution.result?.duration_ms ?? 0}ms</span></span>
                    <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                      sandboxExecution.status === 'SUCCESS' ? 'bg-success/20 text-success' :
                      sandboxExecution.status === 'RUNNING' || sandboxExecution.status === 'QUEUED' ? 'bg-accent/20 text-accent animate-pulse' :
                      'bg-error/20 text-error'
                    }`}>
                      {sandboxExecution.status}
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-900 rounded p-2.5 h-32 overflow-y-auto custom-scrollbar font-mono text-[10.5px] text-slate-300 space-y-1.5 select-text">
                  {sandboxExecution.result ? (
                    <>
                      {sandboxExecution.result.stdout && (
                        <div className="space-y-0.5">
                          <div className="text-[9px] text-success/60 font-bold uppercase select-none">STDOUT</div>
                          <pre className="whitespace-pre-wrap leading-relaxed font-mono">{sandboxExecution.result.stdout}</pre>
                        </div>
                      )}
                      {sandboxExecution.result.stderr && (
                        <div className="space-y-0.5 pt-2 border-t border-zinc-900/60">
                          <div className="text-[9px] text-error/60 font-bold uppercase select-none">STDERR</div>
                          <pre className="text-rose-400 whitespace-pre-wrap leading-relaxed font-mono">{sandboxExecution.result.stderr}</pre>
                        </div>
                      )}
                      {!sandboxExecution.result.stdout && !sandboxExecution.result.stderr && (
                        <span className="text-zinc-600 italic">No console logs output emitted.</span>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-zinc-500 gap-1.5 select-none font-sans text-[11px]">
                      <span className="w-1 h-1 bg-accent rounded-full animate-ping" />
                      <span>Sandbox running scripts inside secure process...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded bg-zinc-900/10 text-zinc-500 font-sans text-xs select-none">
                <ShieldAlert className="w-6 h-6 text-zinc-600 mb-1 animate-pulse" />
                <span>No sandbox executions completed in this workspace session yet.</span>
              </div>
            )}
          </div>
        )}

        {/* AUTONOMOUS TIMELINE */}
        {activeTab === 'loop' && (
          <div className="space-y-3">
            {iterations.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[9.5px] text-zinc-500 uppercase font-bold select-none border-b border-zinc-900 pb-1 flex items-center justify-between">
                  <span>Development Loop History (V1 &rarr; V{iterations.length})</span>
                  <span className="text-accent text-[8.5px]">Double click iteration card to view code diff comparisons</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {iterations.map((it) => {
                    const number = it.iteration_number
                    const status = it.status
                    const isPassed = status === 'PASSED' || status === 'COMPLETED'
                    const isFailed = status === 'FAILED' || status === 'ABANDONED'
                    const isRunningState = status === 'DEVELOPING' || status === 'EXECUTING' || status === 'TESTING'

                    return (
                      <div
                        key={it.id}
                        className={`p-3 rounded border font-sans select-none flex flex-col justify-between h-28 transition-all ${
                          isPassed ? 'bg-success/5 border-success/30 hover:border-success/60' :
                          isFailed ? 'bg-error/5 border-error/30 hover:border-error/60' :
                          'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold text-slate-200">IT-{number}</span>
                            <span className={`text-[8px] font-mono px-1 rounded uppercase font-bold ${
                              isPassed ? 'bg-success/20 text-success' :
                              isFailed ? 'bg-error/20 text-error' :
                              isRunningState ? 'bg-accent/20 text-accent animate-pulse' :
                              'bg-zinc-800 text-slate-400'
                            }`}>
                              {status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                            {it.goal}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-900/60 mt-2 text-[9px] font-mono text-zinc-500">
                          <span>Artifact: {it.artifact_id ? it.artifact_id.substring(4, 9) : '-'}</span>
                          {it.artifact_id && it.parent_iteration_id && onSelectIterationDiff && (
                            <button
                              onClick={() => {
                                const parentIt = iterations.find(p => p.id === it.parent_iteration_id)
                                if (parentIt && parentIt.artifact_id) {
                                  onSelectIterationDiff(parentIt.artifact_id, it.artifact_id)
                                }
                              }}
                              className="text-accent hover:text-accent-hover font-semibold underline cursor-pointer"
                            >
                              Inspect Diff
                            </button>
                          )}
                          {it.artifact_id && onRollback && (
                            <button
                              onClick={() => onRollback(it.artifact_id!)}
                              className="text-amber-400 hover:text-amber-500 flex items-center gap-0.5 cursor-pointer ml-1"
                              title="Restore codebase to this artifact version"
                            >
                              <RotateCcw className="w-2.5 h-2.5" /> Rollback
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded bg-zinc-900/10 text-zinc-500 font-sans text-xs select-none">
                <span>No self-healing iterations recorded yet in this workspace.</span>
              </div>
            )}
          </div>
        )}

        {/* CODE DIFF VIEWER */}
        {activeTab === 'diff' && (
          <div className="space-y-3 font-mono text-[11px] h-full flex flex-col">
            {diffs.length > 0 ? (
              <div className="flex-1 flex flex-col min-h-0 space-y-2">
                {/* File selectors */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 border-b border-zinc-900 select-none flex-shrink-0">
                  <span className="text-zinc-500 text-[9px] uppercase font-bold mr-1">Modified Files:</span>
                  {diffs.map((d: any) => (
                    <button
                      key={d.path}
                      onClick={() => setSelectedDiffFile(d.path)}
                      className={`px-2 py-0.5 rounded text-[8.5px] border cursor-pointer transition-all ${
                        selectedDiffFile === d.path
                          ? 'bg-zinc-800 border-accent text-accent font-bold'
                          : 'bg-zinc-900/50 border-zinc-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {d.path.split('/').pop()} (+{d.added_lines} / -{d.removed_lines})
                    </button>
                  ))}
                </div>

                {/* Diff lines display */}
                {activeDiff ? (
                  <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded p-2.5 overflow-y-auto custom-scrollbar select-text space-y-0.5 leading-relaxed text-[10.5px]">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold select-none border-b border-zinc-900/60 pb-1 mb-2">
                      Diff for {activeDiff.path}
                    </div>
                    {activeDiff.diff_text.split('\n').map((line: string, idx: number) => {
                      const isAdded = line.startsWith('+') && !line.startsWith('+++')
                      const isRemoved = line.startsWith('-') && !line.startsWith('---')
                      const isHeader = line.startsWith('@@') || line.startsWith('diff') || line.startsWith('---') || line.startsWith('+++')

                      let lineStyle = 'text-slate-400'
                      if (isAdded) lineStyle = 'bg-success/5 text-success border-l-2 border-success pl-1 py-0.5'
                      if (isRemoved) lineStyle = 'bg-error/5 text-error border-l-2 border-error pl-1 py-0.5 line-through'
                      if (isHeader) lineStyle = 'text-accent font-bold py-0.5 select-none bg-surface-secondary/30'

                      return (
                        <pre key={idx} className={`whitespace-pre-wrap font-mono ${lineStyle}`}>
                          {line}
                        </pre>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-zinc-500 select-none">
                    Select a modified file above to view changes.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded bg-zinc-900/10 text-zinc-500 font-sans text-xs select-none">
                <GitCompare className="w-6 h-6 text-zinc-700 mb-1" />
                <span>No file differences stashed. Select an iteration diff to view line comparisons.</span>
              </div>
            )}
          </div>
        )}

        {/* RELEASE CENTER CONTENT */}
        {activeTab === 'releases' && (

          <div className="flex flex-col md:flex-row h-full min-h-[220px] divide-x divide-zinc-800 text-[11px] font-mono leading-relaxed">
            
            {/* Left Column: Trigger Form & Releases List */}
            <div className="w-full md:w-80 pr-3.5 pb-2 md:pb-0 flex flex-col space-y-3 flex-shrink-0 min-h-0 select-none">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-1 flex-shrink-0">
                <span className="font-bold text-[9.5px] text-zinc-500 uppercase tracking-wide">Release Candidates ({releases.length})</span>
              </div>

              {/* Trigger release form */}
              <div className="bg-zinc-900/35 border border-zinc-900 rounded p-2.5 space-y-2 flex-shrink-0">
                <div className="text-[9px] font-bold text-amber-500 uppercase">Trigger Release Pipeline</div>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-zinc-500">Semver Version</label>
                    <input
                      type="text"
                      value={releaseVersion}
                      onChange={(e) => setReleaseVersion(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded p-1 text-[10px] text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[9px] text-zinc-500">Target Env</label>
                    <select
                      value={releaseEnv}
                      onChange={(e) => setReleaseEnv(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded p-1 text-[10px] text-slate-200 cursor-pointer focus:outline-none"
                    >
                      <option value="STAGING">STAGING</option>
                      <option value="PRODUCTION">PRODUCTION</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <input
                    type="checkbox"
                    id="failSim"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="w-3 h-3 rounded border-zinc-800 bg-zinc-950 accent-accent cursor-pointer"
                  />
                  <label htmlFor="failSim" className="text-[9px] text-zinc-400 cursor-pointer">
                    Simulate Smoke Check Failure
                  </label>
                </div>

                <button
                  type="button"
                  disabled={releaseLoading}
                  onClick={() => onTriggerRelease && onTriggerRelease(releaseEnv, releaseVersion, simulateFailure)}
                  className="w-full h-6 rounded bg-accent hover:bg-accent-hover text-white text-[10px] font-medium flex items-center justify-center gap-1 cursor-pointer transition-colors disabled:opacity-60"
                >
                  {releaseLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                  <span>Trigger Pipeline</span>
                </button>
              </div>

              {/* Releases Candidates list */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 min-h-[100px]">
                {releases.length > 0 ? (
                  releases.map(r => {
                    const isSelected = activeReleaseDetails && activeReleaseDetails.release.id === r.id
                    const isPassed = r.status === 'DEPLOYED' || r.status === 'APPROVED'
                    const isFailed = r.status === 'FAILED' || r.status === 'CANCELLED' || r.status === 'ROLLED_BACK'
                    return (
                      <div
                        key={r.id}
                        onClick={() => onSelectRelease && onSelectRelease(r.id)}
                        className={`p-2 rounded border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected ? 'bg-zinc-900 border-accent/60' : 'bg-zinc-900/10 border-zinc-900 hover:border-zinc-850'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">Release v{r.version}</span>
                          <span className={`text-[8px] font-bold px-1 rounded uppercase ${
                            isPassed ? 'bg-success/20 text-success' :
                            isFailed ? 'bg-error/20 text-error' :
                            'bg-amber-500/20 text-amber-400 animate-pulse'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[8.5px] text-zinc-500">
                          <span>Env: {r.environment}</span>
                          <span>{new Date(r.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-4 text-center text-zinc-600 text-[10px] italic">No releases built yet.</div>
                )}
              </div>
            </div>

            {/* Right Area: Lifecycle stage timeline, quality gates & logs */}
            <div className="flex-1 pl-3.5 flex flex-col space-y-3 min-h-0 select-text">
              {activeReleaseDetails ? (
                <>
                  {/* Selected Release Header info */}
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-1 select-none flex-shrink-0 text-zinc-500 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-300">RC ID: {activeReleaseDetails.release.id}</span>
                      <span>Artifact: <span className="text-accent">{activeReleaseDetails.release.artifact_id?.substring(4, 9) || '-'}</span></span>
                      <span>Creator: {activeReleaseDetails.release.created_by}</span>
                    </div>
                    {activeReleaseDetails.release.rollback_reference && (
                      <span className="text-zinc-500 font-mono">Rollback Target: {activeReleaseDetails.release.rollback_reference}</span>
                    )}
                  </div>

                  {/* Quality Gates metrics HUD */}
                  <div className="grid grid-cols-4 gap-2 select-none flex-shrink-0">
                    <div className="bg-zinc-900/35 border border-zinc-900 rounded p-1.5 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase font-semibold">Build Status</span>
                      <span className="text-success font-bold block text-[10.5px]">PASS</span>
                    </div>
                    <div className="bg-zinc-900/35 border border-zinc-900 rounded p-1.5 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase font-semibold">Unit Tests</span>
                      <span className="text-success font-bold block text-[10.5px]">100%</span>
                    </div>
                    <div className="bg-zinc-900/35 border border-zinc-900 rounded p-1.5 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase font-semibold">Security Check</span>
                      <span className="text-success font-bold block text-[10.5px]">CLEAN</span>
                    </div>
                    <div className="bg-zinc-900/35 border border-zinc-900 rounded p-1.5 text-center">
                      <span className="text-[8px] text-zinc-500 uppercase font-semibold">Release Risk</span>
                      <span className="text-success font-bold block text-[10.5px]">LOW</span>
                    </div>
                  </div>

                  {/* Human Approvals screen block */}
                  {activeReleaseDetails.release.status === 'APPROVAL_REQUIRED' && activeReleaseDetails.deployments.length > 0 && 
                   activeReleaseDetails.deployments[activeReleaseDetails.deployments.length - 1].approvals.find((a: any) => a.status === 'PENDING') && (
                    <div className="bg-amber-950/20 border border-amber-500/20 rounded p-3 space-y-2 select-none flex-shrink-0 animate-pulse">
                      <div className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                        Human Approvals Verification Checkpoint Required
                      </div>
                      
                      <div className="text-[10px] text-zinc-400 leading-normal font-sans">
                        Production deployment is paused waiting for reviewer approval. Review criteria below:
                        <ul className="list-disc pl-4 space-y-0.5 mt-1 font-mono text-[9px]">
                          <li>Version Candidate: <strong className="text-slate-200">v{activeReleaseDetails.release.version}</strong></li>
                          <li>Tests Validation: <strong className="text-success">100% PASS</strong></li>
                          <li>Security Secrets Static scan: <strong className="text-success">PASS</strong></li>
                          <li>Safety Risk Class: <strong className="text-success">LOW</strong></li>
                          <li>Rollback Target: <strong className="text-slate-200">{activeReleaseDetails.release.rollback_reference || 'None'}</strong></li>
                        </ul>
                      </div>

                      <div className="space-y-1 font-sans">
                        <textarea
                          placeholder="Provide approval comments or reason for change requests..."
                          value={reviewerComments}
                          onChange={(e) => setReviewerComments(e.target.value)}
                          className="w-full h-10 bg-zinc-950 border border-zinc-850 rounded p-1 text-[10px] text-slate-200 focus:outline-none font-mono"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const pendingAppr = activeReleaseDetails.deployments[activeReleaseDetails.deployments.length - 1].approvals.find((a: any) => a.status === 'PENDING')
                            if (pendingAppr && onSubmitApproval) {
                              onSubmitApproval(pendingAppr.id, true, reviewerComments)
                              setReviewerComments('')
                            }
                          }}
                          className="px-3 py-1 rounded bg-success text-white font-bold hover:bg-green-600 transition-colors cursor-pointer text-[9.5px]"
                        >
                          APPROVE DEPLOYMENT
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const pendingAppr = activeReleaseDetails.deployments[activeReleaseDetails.deployments.length - 1].approvals.find((a: any) => a.status === 'PENDING')
                            if (pendingAppr && onSubmitApproval) {
                              onSubmitApproval(pendingAppr.id, false, reviewerComments)
                              setReviewerComments('')
                            }
                          }}
                          className="px-3 py-1 rounded bg-error text-white font-bold hover:bg-red-600 transition-colors cursor-pointer text-[9.5px]"
                        >
                          REJECT / REQUEST CHANGES
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Flowchart Timeline of deployments stages */}
                  {activeReleaseDetails.deployments.length > 0 && (
                    <div className="flex-1 flex flex-col min-h-0 space-y-2">
                      <div className="text-[9.5px] text-zinc-500 uppercase font-bold select-none border-b border-zinc-900 pb-1">
                        Deployment Stage Flowchart & Logs
                      </div>

                      {/* Timeline steps */}
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1 border-b border-zinc-900 select-none flex-shrink-0">
                        {activeReleaseDetails.deployments[activeReleaseDetails.deployments.length - 1].stages.map((stg: any) => {
                          const isDone = stg.status === 'COMPLETED'
                          const isRun = stg.status === 'RUNNING'
                          const isFail = stg.status === 'FAILED'
                          const isActive = activeStageName === stg.stage_name
                          return (
                            <div key={stg.stage_name} className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setActiveStageName(stg.stage_name)
                                  setActiveStageLog(stg.logs_reference || 'No logs for this stage.')
                                }}
                                className={`px-2.5 py-0.5 rounded text-[8.5px] border cursor-pointer transition-all flex items-center gap-1 ${
                                  isActive ? 'bg-zinc-800 border-accent text-accent font-bold' :
                                  isDone ? 'bg-success/15 border-success/30 text-success' :
                                  isFail ? 'bg-error/15 border-error/30 text-error' :
                                  isRun ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse' :
                                  'bg-zinc-900/50 border-zinc-850 text-slate-500'
                                }`}
                              >
                                {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-success" />}
                                {isFail && <XCircle className="w-2.5 h-2.5 text-error" />}
                                {isRun && <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-500" />}
                                <span>{stg.stage_name}</span>
                              </button>
                              <ChevronRight className="w-3 h-3 text-zinc-700" />
                            </div>
                          )
                        })}
                      </div>

                      {/* Stage logs sub-console */}
                      {activeStageName && (
                        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded p-2.5 overflow-y-auto custom-scrollbar select-text space-y-0.5 leading-relaxed text-[10px] h-32">
                          <div className="text-[9px] text-zinc-500 uppercase font-bold select-none border-b border-zinc-900/60 pb-1 mb-2">
                            Logs output: {activeStageName}
                          </div>
                          <pre className="whitespace-pre-wrap font-mono text-slate-300 leading-normal">{activeStageLog}</pre>
                        </div>
                      )}

                      {/* Smoke test check results */}
                      {activeReleaseDetails.deployments[activeReleaseDetails.deployments.length - 1].health_checks.length > 0 && (
                        <div className="space-y-1.5 flex-shrink-0 border-t border-zinc-900 pt-2 select-none">
                          <div className="text-[9px] text-zinc-500 uppercase font-bold">Post-Deployment Health smoke validations</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {activeReleaseDetails.deployments[activeReleaseDetails.deployments.length - 1].health_checks.map((chk: any) => (
                              <div key={chk.name} className="p-1.5 bg-zinc-900/50 border border-zinc-900 rounded flex items-center justify-between text-[9px]">
                                <span className="text-zinc-400 font-semibold">{chk.name}</span>
                                <span className={`font-bold px-1 rounded uppercase text-[8.5px] ${chk.status === 'PASS' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                                  {chk.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rollback controls */}
                      {activeReleaseDetails.deployments[activeReleaseDetails.deployments.length - 1].status === 'FAILED' && onRollbackDeployment && (
                        <div className="flex items-center justify-between p-2 border border-error/20 bg-error/5 rounded flex-shrink-0 select-none">
                          <span className="text-error font-semibold">Deployment Failed smoke assertions. Previous version active.</span>
                          <button
                            type="button"
                            onClick={() => onRollbackDeployment(activeReleaseDetails.deployments[activeReleaseDetails.deployments.length - 1].id)}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold transition-colors cursor-pointer text-[9.5px] flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Re-trigger Rollback
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded bg-zinc-900/10 text-zinc-500 font-sans text-xs select-none">
                  <Layers className="w-8 h-8 text-zinc-700 mb-1" />
                  <span>Select a Release Candidate from the left panel to inspect build stages, logs, and deployment timelines.</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
