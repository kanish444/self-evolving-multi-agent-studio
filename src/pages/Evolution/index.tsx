import { useState, useMemo, useEffect } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/common/EmptyState'
import {
  Sparkles,
  FolderOpen,
  Info,
  ShieldAlert,
  Loader2,
  X,
  AlertTriangle
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { aiApi } from '../../services/api/ai'
import { useProject } from '../../context/ProjectContext'

// Import mock data
import {
  mockIterations,
  mockWorkflowChanges,
  mockEvolutionInsights,
  mockFailurePatterns,
  mockScoreBreakdown,
  mockEvolutionSession,
  mockEvolutionDecision,
} from './mockData'
import type {
  IterationData,
  LearningData,
  WorkflowChange,
  EvolutionInsight,
  FailurePattern,
  EvolutionScoreBreakdown,
  EvolutionSession,
  DecisionItem
} from './mockData'

import { evolutionApi } from '../../services/api/evolution'

// Import components
import { EvolutionOverview } from './components/EvolutionOverview'
import { EvolutionLoop } from './components/EvolutionLoop'
import { IterationPerformance } from './components/IterationPerformance'
import { IterationComparison } from './components/IterationComparison'
import { LearningSection } from './components/LearningSection'
import { EvolutionFilters } from './components/EvolutionFilters'
import { WorkflowImprovement } from './components/WorkflowImprovement'
import { EvolutionInsights } from './components/EvolutionInsights'
import { FailurePatternChart } from './components/FailurePatternChart'
import { EvolutionScore } from './components/EvolutionScore'
import { CurrentEvolutionSession } from './components/CurrentEvolutionSession'
import { EvolutionDecision } from './components/EvolutionDecision'
import { IterationTimeline } from './components/IterationTimeline'

export default function Evolution() {
  const { activeProjectId, activeProject } = useProject()

  // Primary State
  const [session, setSession] = useState<EvolutionSession>(mockEvolutionSession)
  const [learnings, setLearnings] = useState<LearningData[]>([])
  const [pageState, setPageState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading')
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  // Simulation Data States
  const [iterations] = useState<IterationData[]>(mockIterations)
  const [workflowChanges] = useState<WorkflowChange[]>(mockWorkflowChanges)
  const [insights] = useState<EvolutionInsight[]>(mockEvolutionInsights)
  const [failurePatterns] = useState<FailurePattern[]>(mockFailurePatterns)
  const [scoreBreakdown] = useState<EvolutionScoreBreakdown[]>(mockScoreBreakdown)
  const [decision, setDecision] = useState<DecisionItem>(mockEvolutionDecision)

  // AI Evolution State variables
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [aiTestResults, setAiTestResults] = useState("Assertion error in student model uniqueness validation")
  const [aiBugs, setAiBugs] = useState("E104: Email uniqueness check missing prior to commit")
  const [aiFixes, setAiFixes] = useState("Added database query pre-filter check")
  const [aiReviewResults, setAiReviewResults] = useState("Security policy check passed")
  const [aiState, setAiState] = useState<"idle" | "analyzing" | "generating" | "completed" | "failed">("idle")
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [ruleFormulated, setRuleFormulated] = useState(false)
  const [formulatingRule, setFormulatingRule] = useState(false)

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedIteration, setSelectedIteration] = useState('ALL')
  const [selectedImpact, setSelectedImpact] = useState('ALL')

  // Map DB record to LearningData
  const mapDbToLearning = (dbEvo: any): LearningData => ({
    id: dbEvo.id,
    pattern: dbEvo.problem || 'Database constraints checking',
    evidence: '3 failed verification runs',
    learning: dbEvo.learning || 'Enforce unique values validation check prior to database transaction write locks.',
    confidence: dbEvo.confidence === 'HIGH' ? 95 : 85,
    agent: 'Evolution Agent',
    iteration: dbEvo.iteration_id ? `Iteration 0${activeProject?.current_iteration || 1}` : 'Iteration 01',
    impact: dbEvo.confidence === 'HIGH' ? 'High' : 'Medium',
    whyItMatters: dbEvo.solution || 'Missing check verification allows collision errors.',
    source: 'main_controller.py',
    createdIn: dbEvo.iteration_id ? `Iteration 0${activeProject?.current_iteration || 1}` : 'Iteration 01',
    usedIn: `Iteration 0${activeProject?.current_iteration || 1}`
  })

  // Load learnings on mount and project change
  const fetchLearnings = async () => {
    setPageState('loading')
    try {
      const data = await evolutionApi.list(activeProjectId)
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapDbToLearning)
        setLearnings(mapped)
      } else {
        // Fallback default learning for the active repository
        const fallbackLearnings: LearningData[] = [
          {
            id: `evo-${activeProjectId}-01`,
            pattern: `${activeProject?.name || 'Workspace'} Model Validation & Schema Bindings`,
            evidence: 'Baseline initialization diagnostics verified',
            learning: `Strict schema types and async serialization locks required for ${activeProject?.name || 'Workspace'}.`,
            confidence: 94,
            agent: 'Evolution Agent',
            iteration: `Iteration 0${activeProject?.current_iteration || 1}`,
            impact: 'High',
            whyItMatters: 'Prevents concurrency collisions and unhandled runtime exceptions.',
            source: 'architecture_guidelines.md',
            createdIn: `Iteration 0${activeProject?.current_iteration || 1}`,
            usedIn: `Iteration 0${activeProject?.current_iteration || 1}`
          }
        ]
        setLearnings(fallbackLearnings)
      }
      setPageState('normal')
    } catch (err: any) {
      setPageState('error')
      setFeedbackMsg(err.message || 'Failed to fetch evolution learnings.')
    }
  }

  useEffect(() => {
    fetchLearnings()
  }, [activeProjectId])

  // AI Evolution handlers
  const handleRunEvolutionAI = async () => {
    setAiState("analyzing")
    setAiError(null)
    setRuleFormulated(false)
    try {
      const res = await aiApi.analyzeEvolution(
        activeProjectId,
        `it-${activeProjectId}-${activeProject?.current_iteration || 1}`,
        aiTestResults,
        aiBugs,
        aiFixes,
        aiReviewResults
      )
      setAiResult(res)
      setAiState("completed")
    } catch (err: any) {
      setAiState("failed")
      setAiError(err.message || "Failed to analyze evolution iteration.")
    }
  }

  const handleFormulateRule = async () => {
    if (!aiResult) return
    setFormulatingRule(true)
    try {
      await evolutionApi.create(activeProjectId, {
        iteration_id: `it-${activeProjectId}-${activeProject?.current_iteration || 1}`,
        title: `AI Pattern: ${aiResult.pattern_discovered.substring(0, 50)}...`,
        problem: aiResult.what_went_wrong,
        solution: aiResult.what_was_fixed,
        learning: aiResult.potential_reusable_learning,
        confidence: "HIGH"
      })
      setRuleFormulated(true)
      setFeedbackMsg("Evolution learning rule formulated and stored successfully!")
      fetchLearnings()
    } catch (err: any) {
      alert("Failed to formulate rule: " + err.message)
    } finally {
      setFormulatingRule(false)
    }
  }

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedType('ALL')
    setSelectedIteration('ALL')
    setSelectedImpact('ALL')
  }

  // Handle Decision state change (Accept/Reject)
  const handleDecisionChange = (_id: string, newStatus: 'Accepted' | 'Rejected') => {
    setDecision((prev) => ({
      ...prev,
      status: newStatus,
    }))

    if (newStatus === 'Accepted') {
      setFeedbackMsg('Orchestrator prompt updated: Schema validation step applied.')

      setSession((prev) => ({
        ...prev,
        workflowChanges: prev.workflowChanges + 1,
        logs: [
          { time: '10:44:15', msg: 'Decision Accepted: Integrated Schema Validation' },
          ...prev.logs
        ]
      }))
    } else {
      setFeedbackMsg('Evolution suggestion rejected.')
    }
  }

  // Filtered Learnings based on filters and search
  const filteredLearnings = useMemo(() => {
    return learnings.filter((lrn) => {
      if (
        searchQuery &&
        !lrn.pattern.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !lrn.learning.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !lrn.agent.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      if (selectedType !== 'ALL' && selectedType !== 'LEARNINGS') {
        return false
      }

      if (selectedIteration !== 'ALL') {
        const iterName = `Iteration ${selectedIteration}`
        if (lrn.createdIn !== iterName && !lrn.usedIn.includes(iterName)) {
          return false
        }
      }

      if (selectedImpact !== 'ALL' && lrn.impact !== selectedImpact) {
        return false
      }

      return true
    })
  }, [learnings, searchQuery, selectedType, selectedIteration, selectedImpact])

  // Filtered Insights
  const filteredInsights = useMemo(() => {
    return insights.filter((ins) => {
      if (searchQuery && !ins.title.toLowerCase().includes(searchQuery.toLowerCase()) && !ins.recommendation.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (selectedType !== 'ALL') {
        if (selectedType === 'FAILURES' && ins.type !== 'failure') return false
        if (selectedType === 'RECOMMENDATIONS' && ins.type !== 'success') return false
        if (selectedType !== 'FAILURES' && selectedType !== 'RECOMMENDATIONS') return false
      }
      if (selectedImpact !== 'ALL' && ins.impact !== selectedImpact) {
        return false
      }
      return true
    })
  }, [insights, searchQuery, selectedType, selectedImpact])

  // Filtered Workflow changes
  const filteredWorkflowChanges = useMemo(() => {
    return workflowChanges.filter((change) => {
      if (searchQuery && !change.whyChanged.toLowerCase().includes(searchQuery.toLowerCase()) && !change.expectedImpact.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (selectedType !== 'ALL' && selectedType !== 'WORKFLOW') return false
      if (selectedIteration !== 'ALL' && !change.iteration.includes(selectedIteration)) return false
      return true
    })
  }, [workflowChanges, searchQuery, selectedType, selectedIteration])

  const hasFilteredResults = useMemo(() => {
    return filteredLearnings.length > 0 || filteredInsights.length > 0 || filteredWorkflowChanges.length > 0
  }, [filteredLearnings, filteredInsights, filteredWorkflowChanges])

  const renderContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center p-16 text-center border border-border rounded-2xl bg-surface-base min-h-[350px] shadow-command-card">
            <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
            <h3 className="font-display text-sm font-bold text-text-primary">Analyzing evolution telemetry...</h3>
            <p className="text-xs text-text-secondary mt-1">Please wait while the Evolution Agent parses previous runs & logs.</p>
          </div>
        )
      case 'empty':
        return (
          <EmptyState
            title="No evolution data available for this project."
            description="The evolution center relies on completed development runs to extract learnings and optimization indexes."
            icon={<FolderOpen className="w-8 h-8 text-text-muted" />}
          />
        )
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-error/30 bg-error/10 rounded-2xl min-h-[300px]">
            <ShieldAlert className="w-8 h-8 text-error mb-3 animate-bounce" />
            <h3 className="font-display text-sm font-bold text-error">Unable to load evolution history.</h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm">Failed to connect to the self-evolution compilation logs buffer. Please check connectivity schemas.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageState('normal')}
              className="mt-4 border-error/40 hover:bg-error/20 text-error font-bold"
            >
              Retry Connection
            </Button>
          </div>
        )
      default:
        return (
          <div className="space-y-6">
            {/* Core Loop Process Visualization */}
            <EvolutionLoop />

            {/* Performance Trends */}
            <IterationPerformance />

            {/* Matrix comparison */}
            <IterationComparison />

            {/* Filter controls panel */}
            <div className="bg-surface-base border border-border p-4 rounded-2xl shadow-command-card">
              <EvolutionFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                selectedIteration={selectedIteration}
                onIterationChange={setSelectedIteration}
                selectedImpact={selectedImpact}
                onImpactChange={setSelectedImpact}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* Filtered outputs content */}
            {!hasFilteredResults ? (
              <EmptyState
                title="No items matched your filters."
                description="Try clearing search query constraints or resetting the dropdown criteria to discover more evolution items."
                icon={<FolderOpen className="w-8 h-8 text-text-muted" />}
                action={
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Reset Filters
                  </Button>
                }
              />
            ) : (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Learnings Feed */}
                {filteredLearnings.length > 0 && (
                  <LearningSection learnings={filteredLearnings} />
                )}

                {/* Workflow modifications */}
                {filteredWorkflowChanges.length > 0 && (
                  <WorkflowImprovement workflowChanges={filteredWorkflowChanges} />
                )}

                {/* Insights and Failure pattern distribution row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-8">
                    {filteredInsights.length > 0 && (
                      <EvolutionInsights insights={filteredInsights} />
                    )}
                  </div>
                  <div className="lg:col-span-4">
                    <FailurePatternChart patterns={failurePatterns} />
                  </div>
                </div>
              </div>
            )}

            {/* Evolution Score, Current Session, Decision timeline bottom grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              <div className="lg:col-span-4">
                <EvolutionScore scoreBreakdown={scoreBreakdown} />
              </div>
              <div className="lg:col-span-4">
                <CurrentEvolutionSession session={session} />
              </div>
              <div className="lg:col-span-4 space-y-4">
                <EvolutionDecision
                  decision={decision}
                  onDecisionChange={handleDecisionChange}
                />
                <IterationTimeline iterations={iterations} />
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast feedback notifier */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-surface-elevated border border-accent/40 text-text-primary px-4 py-3 rounded-xl shadow-command-card text-xs font-mono flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {/* State simulated switcher strip */}
      <div className="bg-surface-base border border-border rounded-xl px-4 py-2 flex items-center justify-between gap-2 text-xs font-mono text-text-secondary select-none shadow-command-card">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-accent" />
          <span>UI State Views:</span>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-secondary border border-border rounded-lg p-0.5">
          {(['normal', 'loading', 'empty', 'error'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setPageState(st)
                setFeedbackMsg(`Switched to simulated ${st.toUpperCase()} state.`)
              }}
              className={`px-2 py-0.5 rounded-md capitalize cursor-pointer font-bold transition-colors ${
                pageState === st
                  ? 'bg-surface-elevated text-text-primary shadow-xs'
                  : 'hover:bg-surface-base text-text-muted hover:text-text-primary'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <PageHeader
        title="Evolution Center"
        description="Autonomous failure reflection, prompt mutation synthesis, and continuous multi-agent learning loop."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right text-[11px] font-mono leading-tight">
              <div>
                Project: <span className="text-text-primary font-bold">{activeProject?.name || 'Studio'} ({activeProject?.id || 'None'})</span>
              </div>
              <div className="mt-0.5">
                Target: <span className="text-accent font-bold">Iteration 0{activeProject?.current_iteration || 1}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-surface-base border border-border rounded-xl px-3 py-1.5 text-xs shadow-command-card">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="font-mono text-text-secondary font-bold uppercase text-[11px]">
                {session.status}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAIOpen(true)}
              className="border-accent/40 text-accent hover:bg-accent/10"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
            >
              AI Evolution
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPageState('normal')
                setFeedbackMsg('Loaded latest converged iteration records.')
              }}
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
            >
              View Latest Iteration
            </Button>
          </div>
        }
      />

      {/* Overview Analytics Bar */}
      <EvolutionOverview />

      {/* Render selected state content */}
      {renderContent()}

      {/* AI Evolution Analysis Modal */}
      {isAIOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl p-6 border border-border shadow-command-card space-y-4 bg-surface-base max-h-[85vh] flex flex-col font-sans text-xs text-text-primary rounded-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3.5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-display text-base font-bold text-text-primary">
                  AI Evolution Compiler & Analyzer
                </h3>
              </div>
              <button onClick={() => setIsAIOpen(false)} className="p-1 hover:bg-surface-secondary rounded-lg text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary">Test Results Summary</label>
                <textarea
                  value={aiTestResults}
                  onChange={(e) => setAiTestResults(e.target.value)}
                  placeholder="Details of previous verification runs..."
                  className="w-full border border-border rounded-xl px-3 py-2 h-18 resize-none text-xs bg-surface-secondary text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary">Bugs Detected</label>
                <textarea
                  value={aiBugs}
                  onChange={(e) => setAiBugs(e.target.value)}
                  placeholder="Description of errors, locks, or failures..."
                  className="w-full border border-border rounded-xl px-3 py-2 h-18 resize-none text-xs bg-surface-secondary text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary">Fixes Applied</label>
                <textarea
                  value={aiFixes}
                  onChange={(e) => setAiFixes(e.target.value)}
                  placeholder="Details of patches or lock checks configured..."
                  className="w-full border border-border rounded-xl px-3 py-2 h-18 resize-none text-xs bg-surface-secondary text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary">Code Review Results</label>
                <textarea
                  value={aiReviewResults}
                  onChange={(e) => setAiReviewResults(e.target.value)}
                  placeholder="Compliance and security review reports..."
                  className="w-full border border-border rounded-xl px-3 py-2 h-18 resize-none text-xs bg-surface-secondary text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end flex-shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRunEvolutionAI}
                disabled={aiState === "analyzing" || !aiTestResults.trim() || !aiBugs.trim()}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                {aiState === "analyzing" ? "Compiling..." : "Analyze evolution iteration"}
              </Button>
            </div>

            {/* RESULTS VIEW */}
            {aiState === "analyzing" && (
              <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-2">
                <Loader2 className="w-7 h-7 text-accent animate-spin" />
                <span className="font-bold text-text-secondary animate-pulse font-mono">AI is compiling logs & formulating rules...</span>
              </div>
            )}

            {aiState === "failed" && aiError && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-error py-6">
                <AlertTriangle className="w-7 h-7 mb-1" />
                <span className="font-bold font-mono">Analysis Failed</span>
                <span className="text-xs font-mono">{aiError}</span>
              </div>
            )}

            {aiState === "completed" && aiResult && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-2 flex-shrink-0 bg-accent/10 p-3 rounded-xl">
                  <div>
                    <span className="font-bold text-accent font-display">Evolution learning rule formulated</span>
                    <p className="text-[11px] text-text-secondary mt-0.5 font-sans">Click Formulate Rule to save this learning node into the project database.</p>
                  </div>
                  <Button
                    variant="success"
                    size="xs"
                    disabled={formulatingRule || ruleFormulated}
                    onClick={handleFormulateRule}
                  >
                    {formulatingRule ? "Saving..." : ruleFormulated ? "Rule Stored" : "Formulate Evolution Rule"}
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 text-text-secondary">
                  <div className="bg-surface-secondary border border-border p-3 rounded-xl">
                    <span className="font-bold text-[10px] text-text-muted uppercase block mb-1 font-mono">Root Problem Diagnosis</span>
                    <p className="text-text-primary leading-normal text-xs">{aiResult.what_went_wrong}</p>
                  </div>
                  <div className="bg-surface-secondary border border-border p-3 rounded-xl">
                    <span className="font-bold text-[10px] text-text-muted uppercase block mb-1 font-mono">Fix Verified</span>
                    <p className="text-text-primary leading-normal text-xs">{aiResult.what_was_fixed}</p>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 p-3 rounded-xl">
                    <span className="font-bold text-accent uppercase block mb-1 text-[11px] font-mono">Converged Architectural Pattern</span>
                    <p className="text-text-primary leading-normal text-xs font-medium">{aiResult.pattern_discovered}</p>
                  </div>
                  <div className="bg-surface-secondary border border-border p-3 rounded-xl">
                    <span className="font-bold text-[10px] text-text-muted uppercase block mb-1 font-mono">Workflow Optimizations</span>
                    <p className="text-text-primary leading-normal text-xs">{aiResult.what_could_be_improved}</p>
                  </div>
                  <div className="bg-success/10 border border-success/30 p-3 rounded-xl">
                    <span className="font-bold text-[10px] text-success uppercase block mb-1 font-mono">Reusable Guideline</span>
                    <p className="text-success leading-normal text-xs font-medium">{aiResult.potential_reusable_learning}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsAIOpen(false)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
