import { useState, useEffect, useCallback } from 'react'
import {
  FlaskConical,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Wrench,
  Loader2,
  Check
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useProject } from '../../context/ProjectContext'
import { testsApi, type TestResult, type TestRunResult, type AutoFixResult } from '../../services/api/tests'

export default function Testing() {
  const { activeProject, activeProjectId } = useProject()
  
  // Test execution state
  const [testHistory, setTestHistory] = useState<TestResult[]>([])
  const [lastRun, setLastRun] = useState<TestRunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState<AutoFixResult | null>(null)
  const [selectedFailure, setSelectedFailure] = useState<any | null>(null)
  const [outputTab, setOutputTab] = useState<'summary' | 'terminal' | 'acceptance'>('summary')

  // Load previous test run history from backend
  const loadHistory = useCallback(async () => {
    if (!activeProjectId) return
    try {
      const list = await testsApi.list(activeProjectId)
      setTestHistory(list)
    } catch (err: any) {
      console.warn('Failed to load test history:', err)
    }
  }, [activeProjectId])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Run real test suite in workspace
  const handleRunTests = async () => {
    if (!activeProjectId) return
    setIsRunning(true)
    setFixResult(null)
    setSelectedFailure(null)
    try {
      const res = await testsApi.runTests(activeProjectId)
      setLastRun(res)
      if (res.failures && res.failures.length > 0) {
        setSelectedFailure(res.failures[0])
      }
      loadHistory()
    } catch (err: any) {
      setLastRun({
        status: 'ERROR',
        total: 0,
        passed: 0,
        failed: 1,
        duration_seconds: 0,
        output: err.message || 'Failed to trigger test runner.',
        error_summary: err.message,
        failures: []
      })
    } finally {
      setIsRunning(false)
    }
  }

  // Trigger automated fix
  const handleFixIssues = async () => {
    if (!activeProjectId || !lastRun) return
    setIsFixing(true)
    try {
      const res = await testsApi.fixIssues(activeProjectId, {
        error_message: selectedFailure?.traceback || lastRun.error_summary || 'Test assertion failure'
      })
      setFixResult(res)
      setLastRun(res.retest_result)
      loadHistory()
    } catch (err: any) {
      alert(err.message || 'Failed to apply scoped fix.')
    } finally {
      setIsFixing(false)
    }
  }

  if (!activeProject) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-[#0B0F19]">
        <Layers className="w-12 h-12 text-slate-500 mb-3" />
        <h2 className="text-lg font-semibold text-slate-200">No Active Project Selected</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          Select or create a project from the Projects tab to inspect and execute test suites.
        </p>
      </div>
    )
  }

  // Parse acceptance criteria if present in architecture plan
  let criteriaList: string[] = []
  if (activeProject.architecture_plan) {
    try {
      const parsed = JSON.parse(activeProject.architecture_plan)
      if (Array.isArray(parsed.acceptance_criteria)) {
        criteriaList = parsed.acceptance_criteria
      }
    } catch {}
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] overflow-hidden">
      {/* Module Header & Action Bar */}
      <div className="bg-[#111827] border-b border-[#1F2937] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-100">Tests & Fixes</h1>
            <span className="text-xs text-slate-400 font-mono">({activeProject.name})</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real test runner diagnostics, build verification, and automated defect correction.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {lastRun && lastRun.status === 'FAILED' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFixIssues}
              disabled={isFixing || isRunning}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1.5"
            >
              {isFixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
              <span>Fix Issues</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunTests}
            disabled={isRunning}
            className="bg-[#2563EB] hover:bg-blue-600 text-white font-medium flex items-center gap-1.5"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{lastRun ? 'Run Again' : 'Run Tests'}</span>
          </Button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Results, Metrics & Failures */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Status</span>
              <div className="text-base font-bold font-mono">
                {lastRun ? (
                  <span
                    className={
                      lastRun.status === 'PASSED'
                        ? 'text-emerald-400'
                        : lastRun.status === 'FAILED'
                        ? 'text-rose-400'
                        : lastRun.status === 'NO_TESTS'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }
                  >
                    {lastRun.status}
                  </span>
                ) : (
                  <span className="text-slate-500">NOT RUN</span>
                )}
              </div>
            </div>

            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Executed</span>
              <div className="text-xl font-bold font-mono text-slate-100">
                {lastRun ? lastRun.total : 0}
              </div>
            </div>

            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Passed</span>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {lastRun ? lastRun.passed : 0}
              </div>
            </div>

            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Failed</span>
              <div className="text-xl font-bold font-mono text-rose-400">
                {lastRun ? lastRun.failed : 0}
              </div>
            </div>
          </div>

          {/* Zero Tests Warning Banner if no tests */}
          {lastRun && lastRun.status === 'NO_TESTS' && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-200">Zero Tests Detected in Workspace</h4>
                <p className="mt-1 leading-relaxed text-amber-300/90">
                  SE-MAESTRO enforces real execution integrity: zero executed tests can never be treated as verified success.
                  Add unit tests (e.g. <code className="font-mono bg-black/40 px-1 py-0.5 rounded">tests/test_app.py</code>) to the project workspace in the Editor module before releasing.
                </p>
              </div>
            </div>
          )}

          {/* Fix Result Alert */}
          {fixResult && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
              fixResult.status === 'FIXED'
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
            }`}>
              <div className="flex items-center gap-2 font-semibold mb-1">
                {fixResult.status === 'FIXED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                )}
                <span>Correction Attempt: {fixResult.status}</span>
              </div>
              <p className="text-slate-300 mb-2">{fixResult.analysis}</p>
              {fixResult.diff && (
                <pre className="font-mono text-[11px] bg-black/40 p-2.5 rounded border border-[#1F2937] text-slate-200 overflow-x-auto">
                  {fixResult.diff}
                </pre>
              )}
            </div>
          )}

          {/* Tabs for Test Evidence */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl overflow-hidden flex flex-col flex-1">
            <div className="px-4 py-2.5 border-b border-[#1F2937] flex items-center gap-4 bg-[#0A0F1D]">
              <button
                type="button"
                onClick={() => setOutputTab('summary')}
                className={`text-xs font-medium pb-0.5 border-b-2 transition-colors ${
                  outputTab === 'summary' ? 'text-blue-400 border-blue-500 font-semibold' : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                Diagnostic Evidence
              </button>
              <button
                type="button"
                onClick={() => setOutputTab('terminal')}
                className={`text-xs font-medium pb-0.5 border-b-2 transition-colors ${
                  outputTab === 'terminal' ? 'text-blue-400 border-blue-500 font-semibold' : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                Runner Output
              </button>
              <button
                type="button"
                onClick={() => setOutputTab('acceptance')}
                className={`text-xs font-medium pb-0.5 border-b-2 transition-colors ${
                  outputTab === 'acceptance' ? 'text-blue-400 border-blue-500 font-semibold' : 'text-slate-400 border-transparent hover:text-white'
                }`}
              >
                Acceptance Criteria ({criteriaList.length})
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar font-mono text-xs">
              {outputTab === 'summary' && (
                <div>
                  {lastRun && lastRun.failures && lastRun.failures.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-rose-400 font-semibold text-xs mb-2">
                        {lastRun.failures.length} Test Failure(s) Recorded:
                      </div>
                      {lastRun.failures.map((f: any, idx: number) => (
                        <div key={idx} className="bg-[#0A0F1D] border border-rose-900/40 rounded-lg p-3">
                          <span className="text-rose-300 font-bold block mb-1.5">{f.test_name}</span>
                          <pre className="text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed">
                            {f.traceback}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : lastRun && lastRun.status === 'PASSED' ? (
                    <div className="text-center py-10 text-emerald-400 font-sans">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                      <h3 className="font-semibold text-sm">All Test Suites Passed</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Verified {lastRun.total} test cases across workspace in {lastRun.duration_seconds}s.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500 font-sans">
                      <FlaskConical className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                      <p className="text-xs">No active test results. Click "Run Tests" to execute verification.</p>
                    </div>
                  )}
                </div>
              )}

              {outputTab === 'terminal' && (
                <pre className="whitespace-pre-wrap text-slate-300 text-[11px] leading-relaxed">
                  {lastRun ? lastRun.output : 'Runner has not executed yet.'}
                </pre>
              )}

              {outputTab === 'acceptance' && (
                <div className="space-y-2 font-sans">
                  {criteriaList.length === 0 ? (
                    <div className="text-slate-500 text-xs py-4 text-center">
                      No acceptance criteria documented for this project plan yet.
                    </div>
                  ) : (
                    criteriaList.map((crit, idx) => (
                      <div
                        key={idx}
                        className="bg-[#0A0F1D] border border-[#1F2937] rounded-lg p-3 flex items-start gap-3"
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          lastRun && lastRun.status === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <div className="text-xs text-slate-300">
                          {crit}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Historical Retest Runs */}
        <div className="w-80 bg-[#0A0F1D] border-l border-[#1F2937] flex flex-col flex-shrink-0">
          <div className="p-3.5 border-b border-[#1F2937] flex items-center justify-between bg-[#111827]">
            <span className="text-xs font-semibold text-slate-200">Execution History</span>
            <span className="text-[10px] font-mono text-slate-500">{testHistory.length} runs</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-2">
            {testHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No past test runs on record.
              </div>
            ) : (
              testHistory.map(item => (
                <div
                  key={item.id}
                  className="bg-[#111827] border border-[#1F2937] rounded-lg p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                    <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border uppercase ${
                      item.status === 'PASSED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">{item.actual_result || item.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>{item.duration ? `${item.duration}s` : ''}</span>
                    <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
