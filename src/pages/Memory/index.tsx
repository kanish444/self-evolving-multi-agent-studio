import { useState, useMemo, useEffect } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/common/EmptyState'
import {
  Brain,
  Sparkles,
  Info,
  ShieldAlert,
  Loader2,
  FolderOpen,
  Plus,
  X,
  AlertTriangle
} from 'lucide-react'
import { aiApi } from '../../services/api/ai'

// Import mock stats data
import {
  mockMemoryTimeline,
  mockQualityStats,
  mockRetentionStats,
  mockMemoryInsight,
} from './mockData'
import type {
  Memory,
  MemoryType,
  MemoryImportance,
  MemoryStatus,
} from './mockData'

// Import backend API clients
import { memoryApi } from '../../services/api/memory'

// Import components
import { MemoryOverview } from './components/MemoryOverview'
import { MemoryCategories } from './components/MemoryCategories'
import { MemoryFilters } from './components/MemoryFilters'
import { MemoryCard } from './components/MemoryCard'
import { MemoryDetail } from './components/MemoryDetail'
import { MemoryEvidence } from './components/MemoryEvidence'
import { MemoryLifecycle } from './components/MemoryLifecycle'
import { MemoryUsage } from './components/MemoryUsage'
import { MemoryTimeline } from './components/MemoryTimeline'
import { KnowledgeQuality } from './components/KnowledgeQuality'
import { MemoryRetention } from './components/MemoryRetention'
import { MemoryInsight } from './components/MemoryInsight'
import { AddMemoryModal } from './components/AddMemoryModal'
import { EditMemoryModal } from './components/EditMemoryModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useProject } from '../../context/ProjectContext'

export default function MemoryPage() {
  const { activeProject, activeProjectId } = useProject()

  // Page UI States
  const [pageState, setPageState] = useState<'normal' | 'loading' | 'empty' | 'error'>('normal')
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)

  // Memories Master State
  const [memories, setMemories] = useState<Memory[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [selectedImportance, setSelectedImportance] = useState('ALL')
  const [selectedAgent, setSelectedAgent] = useState('ALL')
  const [selectedProject, setSelectedProject] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedIteration, setSelectedIteration] = useState('ALL')
  const [sortBy, setSortBy] = useState('newest')

  // Modal open triggers
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editTargetMemory, setEditTargetMemory] = useState<Memory | null>(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  
  // AI Memory Summarizer state variables
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [aiErrorFileLogs, setAiErrorFileLogs] = useState("OperationalError: database is locked when running stress-test runs concurrently.")
  const [aiContext, setAiContext] = useState("Multiple thread workers attempting transaction writes concurrently to Student database.")
  const [aiState, setAiState] = useState<"idle" | "analyzing" | "completed" | "failed">("idle")
  const [aiResult, setAiResult] = useState<any>(null)
  const [aiError, setAiError] = useState<string | null>(null)
  const [memoryCommitted, setMemoryCommitted] = useState(false)
  const [committingMemory, setCommittingMemory] = useState(false)

  // Map backend Pydantic MemoryResponse models to Frontend Memory interface
  const mapDbToMemory = (dbMem: any): Memory => ({
    id: dbMem.id,
    title: dbMem.title,
    type: dbMem.category as MemoryType,
    description: dbMem.content,
    learning: dbMem.content,
    sourceAgent: dbMem.source || 'Developer',
    project: activeProject?.name || 'Global',
    iteration: dbMem.iteration || `Iteration 0${activeProject?.current_iteration || 1}`,
    createdAt: new Date(dbMem.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    confidence: dbMem.confidence || 0.95,
    importance: (dbMem.importance || 'High') as MemoryImportance,
    status: (dbMem.status || 'Verified') as MemoryStatus,
    tags: dbMem.tags ? dbMem.tags.split(',') : [],
    relatedFailures: dbMem.related_failures ? dbMem.related_failures.split(',') : [],
    relatedAgents: dbMem.related_agents ? dbMem.related_agents.split(',') : [],
    usedInCount: dbMem.used_in_count || 0,
    successRate: dbMem.success_rate || 0,
    impactScore: dbMem.impact_score || 'Applied in task',
    usageCount: dbMem.usage_count || 0,
    successCount: dbMem.success_count || 0,
    lastUsed: dbMem.last_used || 'Never',
    relatedMemories: []
  })

  // Load memories from backend
  const fetchMemories = async () => {
    if (!activeProjectId) return
    setPageState('loading')
    try {
      const data = await memoryApi.list(activeProjectId)
      const mapped = data.map(mapDbToMemory)
      setMemories(mapped)
      if (mapped.length > 0) {
        setSelectedId(mapped[0].id)
        setPageState('normal')
      } else {
        setPageState('empty')
      }
    } catch (err: any) {
      setPageState('error')
      setFeedbackMsg(err.message || 'Failed to fetch memory data.')
    }
  }

  // AI Memory Summarizer handlers
  const handleSummarizeMemory = async () => {
    setAiState("analyzing")
    setAiError(null)
    setMemoryCommitted(false)
    try {
      const res = await aiApi.summarizeMemory(
        activeProjectId,
        aiErrorFileLogs,
        aiContext,
        `Wrapped ${activeProject?.name || ''} database transactions in thread-safe locks.`,
        "Use concurrent backoff retry queues for SQLite access.",
        `${activeProject?.name || ''}, SQLite deadlock`
      )
      setAiResult(res)
      setAiState("completed")
    } catch (err: any) {
      setAiState("failed")
      setAiError(err.message || "Failed to compile memory summary.")
    }
  }

  const handleCommitMemory = async () => {
    if (!aiResult) return
    setCommittingMemory(true)
    try {
      await memoryApi.create(activeProjectId, {
        category: aiResult.suggested_category.toLowerCase(),
        title: aiResult.title,
        content: `Learning: ${aiResult.learning}\n\nSolution: ${aiResult.suggested_solution}\n\nRoot Cause: ${aiResult.root_cause}`,
        confidence: 0.95,
        importance: "HIGH",
        status: "VERIFIED",
        tags: aiResult.suggested_tags.join(","),
        iteration: `Iteration 0${activeProject?.current_iteration || 1}`
      })
      setMemoryCommitted(true)
      setFeedbackMsg("Cognitive learning memory card created successfully!")
      fetchMemories()
    } catch (err: any) {
      alert("Failed to commit memory: " + err.message)
    } finally {
      setCommittingMemory(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [activeProjectId])

  // Auto-hide toast feedback message
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [feedbackMsg])

  // Get active selected memory object
  const selectedMemory = useMemo(() => {
    return memories.find((m) => m.id === selectedId) || null
  }, [memories, selectedId])

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedImportance('ALL')
    setSelectedAgent('ALL')
    setSelectedProject('ALL')
    setSelectedStatus('ALL')
    setSelectedIteration('ALL')
    setActiveCategory('ALL')
    setFeedbackMsg('Filters cleared.')
  }

  // Handle Add Memory Save
  const handleSaveMemory = async (newMemory: {
    title: string
    type: MemoryType
    description: string
    learning: string
    sourceAgent: string
    project: string
    iteration: string
    importance: MemoryImportance
    confidence: number
    tags: string[]
    relatedFailures: string[]
    relatedTask?: string
  }) => {
    try {
      const dbPayload = {
        category: newMemory.type,
        title: newMemory.title,
        content: newMemory.description,
        source: newMemory.sourceAgent,
        confidence: newMemory.confidence,
        importance: newMemory.importance,
        status: 'Verified',
        tags: newMemory.tags.join(','),
        related_failures: newMemory.relatedFailures.join(','),
        related_agents: [newMemory.sourceAgent].join(','),
        used_in_count: newMemory.relatedTask ? 1 : 0,
        success_rate: newMemory.relatedTask ? 100.0 : 0.0,
        impact_score: newMemory.relatedTask ? `Applied in task: "${newMemory.relatedTask}"` : 'Unused',
        usage_count: newMemory.relatedTask ? 1 : 0,
        success_count: newMemory.relatedTask ? 1 : 0,
        last_used: newMemory.relatedTask ? 'Just now' : 'Never',
        iteration: newMemory.iteration
      }
      
      const created = await memoryApi.create(activeProjectId, dbPayload)
      const mapped = mapDbToMemory(created)
      setMemories((prev) => [mapped, ...prev])
      setSelectedId(mapped.id)
      setFeedbackMsg('Memory saved successfully.')
    } catch (err: any) {
      alert(err.message || 'Failed to save memory.')
    }
  }

  // Handle Edit Memory Save
  const handleUpdateMemory = (updated: Memory) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    )
    setFeedbackMsg('Memory updated successfully.')
  }

  // Handle Delete Memory Trigger
  const handleConfirmDelete = () => {
    if (!deleteTargetId) return
    setMemories((prev) => prev.filter((m) => m.id !== deleteTargetId))
    if (selectedId === deleteTargetId) {
      const remaining = memories.filter((m) => m.id !== deleteTargetId)
      setSelectedId(remaining.length > 0 ? remaining[0].id : null)
    }
    setIsConfirmDeleteOpen(false)
    setDeleteTargetId(null)
    setFeedbackMsg('Memory deleted.')
  }

  // Filter & Search Logic
  const filteredMemories = useMemo(() => {
    return memories
      .filter((mem) => {
        if (activeCategory !== 'ALL' && mem.type !== activeCategory) {
          return false
        }
        if (
          searchQuery &&
          !mem.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !mem.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !mem.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
        ) {
          return false
        }
        if (selectedImportance !== 'ALL' && mem.importance !== selectedImportance) {
          return false
        }
        if (selectedAgent !== 'ALL' && mem.sourceAgent !== selectedAgent) {
          return false
        }
        if (selectedProject !== 'ALL' && mem.project !== selectedProject) {
          return false
        }
        if (selectedStatus !== 'ALL' && mem.status !== selectedStatus) {
          return false
        }
        if (selectedIteration !== 'ALL' && mem.iteration !== selectedIteration) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'confidence') return b.confidence - a.confidence
        if (sortBy === 'usage') return b.usageCount - a.usageCount
        if (sortBy === 'importance') {
          const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 }
          return (rank[b.importance] || 0) - (rank[a.importance] || 0)
        }
        return 0
      })
  }, [
    memories,
    activeCategory,
    searchQuery,
    selectedImportance,
    selectedAgent,
    selectedProject,
    selectedStatus,
    selectedIteration,
    sortBy,
  ])

  // Count items per category
  const categoryItems = useMemo(() => {
    const list: { name: string; value: string; count: number }[] = [
      { name: 'All Categories', value: 'ALL', count: memories.length },
      { name: 'Project Knowledge', value: 'Project Knowledge', count: memories.filter(m => m.type === 'Project Knowledge').length },
      { name: 'Agent Learning', value: 'Agent Learning', count: memories.filter(m => m.type === 'Agent Learning').length },
      { name: 'Error Patterns', value: 'Error Pattern', count: memories.filter(m => m.type === 'Error Pattern').length },
      { name: 'Successful Patterns', value: 'Successful Pattern', count: memories.filter(m => m.type === 'Successful Pattern').length },
      { name: 'Coding Patterns', value: 'Coding Pattern', count: memories.filter(m => m.type === 'Coding Pattern').length },
      { name: 'Architecture', value: 'Architecture Knowledge', count: memories.filter(m => m.type === 'Architecture Knowledge').length },
    ]
    return list
  }, [memories])

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-surface-elevated border border-accent/40 text-text-primary px-4 py-3 rounded-xl shadow-command-card text-xs font-mono flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {/* State Switcher Strip */}
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
        title="Knowledge & Memory Repository"
        description="Persistent cognitive memory, architectural decisions, and reusable prompt guidelines across projects."
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAIOpen(true)}
              className="border-accent/40 text-accent hover:bg-accent/10"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
            >
              AI Memory Summarizer
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Memory
            </Button>
          </div>
        }
      />

      {/* Memory Overview Top Banner */}
      <MemoryOverview memories={memories} />

      {/* Main Content Sections */}
      {pageState === 'loading' ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border border-border rounded-2xl bg-surface-base min-h-[350px] shadow-command-card">
          <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
          <h3 className="font-display text-sm font-bold text-text-primary">Indexing cognitive knowledge graph...</h3>
        </div>
      ) : pageState === 'empty' ? (
        <EmptyState
          title="No memory records found."
          description="Synthesize cognitive memory records from recent test diagnostics or manually add new guidelines."
          icon={<FolderOpen className="w-8 h-8 text-text-muted" />}
          action={
            <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
              Create First Memory
            </Button>
          }
        />
      ) : pageState === 'error' ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-error/30 bg-error/10 rounded-2xl min-h-[300px]">
          <ShieldAlert className="w-8 h-8 text-error mb-3 animate-bounce" />
          <h3 className="font-display text-sm font-bold text-error">Unable to load repository memory records.</h3>
          <p className="text-xs text-text-secondary mt-1">Please verify database vector schema connection.</p>
          <Button variant="outline" size="sm" onClick={fetchMemories} className="mt-4 border-error/40 text-error hover:bg-error/20">
            Retry Connection
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category Tabs Strip */}
          <MemoryCategories
            categories={categoryItems}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />

          {/* Search & Filter Controls */}
          <div className="bg-surface-base border border-border p-4 rounded-2xl shadow-command-card">
            <MemoryFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedImportance={selectedImportance}
              onImportanceChange={setSelectedImportance}
              selectedAgent={selectedAgent}
              onAgentChange={setSelectedAgent}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedIteration={selectedIteration}
              onIterationChange={setSelectedIteration}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* 2-Column Split Master Detail View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Memory Cards List */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between px-1 text-xs font-mono text-text-muted">
                <span>Showing {filteredMemories.length} memories</span>
                <span>Active: {activeCategory}</span>
              </div>

              <div className="space-y-3.5 max-h-[720px] overflow-y-auto custom-scrollbar pr-1">
                {filteredMemories.length > 0 ? (
                  filteredMemories.map((mem) => (
                    <MemoryCard
                      key={mem.id}
                      memory={mem}
                      isSelected={selectedId === mem.id}
                      onClick={() => setSelectedId(mem.id)}
                    />
                  ))
                ) : (
                  <div className="p-12 text-center border border-dashed border-border rounded-xl bg-surface-base text-text-muted font-mono text-xs">
                    No memories matching search criteria.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Selected Memory Inspector */}
            <div className="lg:col-span-6 space-y-6">
              {selectedMemory ? (
                <>
                  <MemoryDetail
                    memory={selectedMemory}
                    allMemories={memories}
                    onSelectMemory={setSelectedId}
                    onArchive={(id) => {
                      setMemories((prev) =>
                        prev.map((m) => (m.id === id ? { ...m, status: 'Archived' } : m))
                      )
                      setFeedbackMsg('Memory archived.')
                    }}
                    onDelete={(id) => {
                      setDeleteTargetId(id)
                      setIsConfirmDeleteOpen(true)
                    }}
                    onEdit={(m) => {
                      setEditTargetMemory(m)
                      setIsEditOpen(true)
                    }}
                    onCopy={() => setFeedbackMsg('Memory markdown content copied to clipboard.')}
                    onClose={() => setSelectedId(null)}
                  />
                  <MemoryEvidence memory={selectedMemory} />
                  <MemoryLifecycle />
                  <MemoryUsage memory={selectedMemory} />
                </>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl bg-surface-base text-text-muted text-xs font-mono">
                  <Brain className="w-8 h-8 text-text-muted mb-2" />
                  Select a memory card to inspect details.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
            <div className="lg:col-span-4">
              {selectedMemory && (
                <MemoryTimeline
                  memory={selectedMemory}
                  timelineItems={mockMemoryTimeline[selectedMemory.id] || []}
                />
              )}
            </div>
            <div className="lg:col-span-4">
              <KnowledgeQuality stats={mockQualityStats} />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <MemoryRetention stats={mockRetentionStats} />
              <MemoryInsight insight={mockMemoryInsight} />
            </div>
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      <AddMemoryModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={handleSaveMemory}
      />

      {/* Edit Memory Modal */}
      <EditMemoryModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false)
          setEditTargetMemory(null)
        }}
        memory={editTargetMemory}
        onSave={handleUpdateMemory}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Knowledge Record"
        description="Are you sure you want to delete this memory item? Agents will no longer reference this guideline during orchestration."
      />

      {/* AI Memory Summarizer Modal */}
      {isAIOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl p-6 border border-border shadow-command-card space-y-4 bg-surface-base max-h-[85vh] flex flex-col font-sans text-xs text-text-primary rounded-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3.5 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-display text-base font-bold text-text-primary">
                  AI Cognitive Memory Summarizer
                </h3>
              </div>
              <button onClick={() => setIsAIOpen(false)} className="p-1 hover:bg-surface-secondary rounded-lg text-text-muted hover:text-text-primary cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-shrink-0">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary">Error & Traceback Logs</label>
                <textarea
                  value={aiErrorFileLogs}
                  onChange={(e) => setAiErrorFileLogs(e.target.value)}
                  placeholder="Paste traceback logs..."
                  className="w-full border border-border rounded-xl px-3 py-2 h-20 resize-none text-xs bg-surface-secondary text-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-secondary">Context & Environment</label>
                <textarea
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  placeholder="Environment details..."
                  className="w-full border border-border rounded-xl px-3 py-2 h-20 resize-none text-xs bg-surface-secondary text-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end flex-shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSummarizeMemory}
                disabled={aiState === "analyzing" || !aiErrorFileLogs.trim() || !aiContext.trim()}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                {aiState === "analyzing" ? "Synthesizing..." : "Synthesize Knowledge Memory"}
              </Button>
            </div>

            {/* RESULTS VIEW */}
            {aiState === "analyzing" && (
              <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-2">
                <Loader2 className="w-7 h-7 text-accent animate-spin" />
                <span className="font-bold text-text-secondary animate-pulse font-mono">AI is extracting cognitive patterns...</span>
              </div>
            )}

            {aiState === "failed" && aiError && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-error py-6">
                <AlertTriangle className="w-7 h-7 mb-1" />
                <span className="font-bold font-mono">Synthesis Failed</span>
                <span className="text-xs font-mono">{aiError}</span>
              </div>
            )}

            {aiState === "completed" && aiResult && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-2 flex-shrink-0 bg-accent/10 p-3 rounded-xl">
                  <div>
                    <span className="font-bold text-accent font-display">Proposed Knowledge Card: {aiResult.title}</span>
                    <p className="text-[11px] text-text-secondary mt-0.5 font-sans">Click Commit Memory to save this into the project memory repository.</p>
                  </div>
                  <Button
                    variant="success"
                    size="xs"
                    disabled={committingMemory || memoryCommitted}
                    onClick={handleCommitMemory}
                  >
                    {committingMemory ? "Saving..." : memoryCommitted ? "Memory Stored" : "Commit Memory"}
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 text-text-secondary">
                  <div className="bg-surface-secondary border border-border p-3 rounded-xl">
                    <span className="font-bold text-[10px] text-text-muted uppercase block mb-1 font-mono">Discovered Learning</span>
                    <p className="text-text-primary leading-normal text-xs">{aiResult.learning}</p>
                  </div>
                  <div className="bg-surface-secondary border border-border p-3 rounded-xl">
                    <span className="font-bold text-[10px] text-text-muted uppercase block mb-1 font-mono">Suggested Solution</span>
                    <p className="text-text-primary leading-normal text-xs">{aiResult.suggested_solution}</p>
                  </div>
                  <div className="bg-accent/10 border border-accent/30 p-3 rounded-xl">
                    <span className="font-bold text-accent uppercase block mb-1 text-[11px] font-mono">Root Cause & Categorization</span>
                    <p className="text-text-primary leading-normal text-xs font-medium">{aiResult.root_cause} (Category: {aiResult.suggested_category})</p>
                  </div>
                  <div className="bg-success/10 border border-success/30 p-3 rounded-xl">
                    <span className="font-bold text-[10px] text-success uppercase block mb-1 font-mono">Tags</span>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {aiResult.suggested_tags?.map((tag: string, idx: number) => (
                        <span key={idx} className="bg-surface-base border border-success/30 text-success font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
                          #{tag}
                        </span>
                      ))}
                    </div>
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
