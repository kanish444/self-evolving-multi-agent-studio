import { useState, useMemo, useEffect, useRef } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/common/EmptyState'
import {
  Terminal,
  Sparkles,
  Info,
  ShieldAlert,
  Loader2,
  FolderOpen,
  Pin,
  PinOff
} from 'lucide-react'

// Import mock data and types
import {
  mockLogEvents,
  simulatedLiveEvents,
} from './logs.mock'
import type { LogEvent, LogEventType, LogStatus, AgentName } from './logs.mock'

// Import backend API client
import { logsApi } from '../../services/api/logs'
import { useProject } from '../../context/ProjectContext'

// Import components
import { LogsHeader } from './components/LogsHeader'
import { ObservabilitySummary } from './components/ObservabilitySummary'
import { LogFilters } from './components/LogFilters'
import { LogTable } from './components/LogTable'
import { EventDetailDrawer } from './components/EventDetailDrawer'
import { TraceViewer } from './components/TraceViewer'
import { FailureTrace } from './components/FailureTrace'
import { ErrorWarningCenter } from './components/ErrorWarningCenter'
import { MetricsPanel } from './components/MetricsPanel'
import { IterationObservability } from './components/IterationObservability'
import { RawLogFeed } from './components/RawLogFeed'

const mapAgentIdToName = (agentId: string | undefined): AgentName => {
  switch (agentId) {
    case 'PM': return 'Project Manager'
    case 'Architect': return 'Architect'
    case 'Developer': return 'Developer'
    case 'Tester': return 'Tester'
    case 'Reviewer': return 'Code Reviewer'
    case 'Debugger': return 'Debugger'
    case 'Evolution': return 'Evolution Agent'
    default: return 'System'
  }
}

export default function Logs() {
  const { activeProjectId, activeProject } = useProject()

  // Primary State
  const [events, setEvents] = useState<LogEvent[]>([])
  const [pageState, setPageState] = useState<'loading' | 'normal' | 'error' | 'empty'>('loading')
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null)
  
  // Selected Event & Drawer State
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pinnedIds, setPinnedIds] = useState<string[]>(['log-003', 'log-008'])
  const [activeConsoleTab, setActiveConsoleTab] = useState<'stream' | 'raw'>('stream')

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedAgent, setSelectedAgent] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedIteration, setSelectedIteration] = useState('ALL')
  const [selectedProject, setSelectedProject] = useState('ALL')
  const [selectedTime, setSelectedTime] = useState('ALL')
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<string | null>(null)
  const [selectedFileFilter, setSelectedFileFilter] = useState<string | null>(null)
  const [selectedErrorCategory, setSelectedErrorCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('newest')

  // Simulation timer controls
  const [isLive, setIsLive] = useState(true)
  const liveIndexRef = useRef(0)

  // Load initial logs from backend
  const fetchLogs = async () => {
    setPageState('loading')
    try {
      const data = await logsApi.list(activeProjectId)
      if (Array.isArray(data) && data.length > 0) {
        const mapped: LogEvent[] = data.map((d) => ({
          id: d.id,
          timestamp: d.timestamp,
          type: d.type as LogEventType,
          status: d.status as LogStatus,
          agent: mapAgentIdToName(d.agent_id),
          action: d.action,
          message: d.message,
          project: activeProject?.name || 'Workspace',
          iteration: d.iteration_id ? `Iteration 0${activeProject?.current_iteration || 1}` : 'Iteration 01',
          task: d.task_id || 'task-01',
          file: d.file || '',
          test: d.test || '',
          traceId: d.trace_id,
          correlationId: d.correlation_id,
        }))
        setEvents(mapped)
      } else {
        // Fallback default events for the active repository
        const fallbackEvents: LogEvent[] = [
          {
            id: `log-${activeProjectId}-1`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'SYSTEM',
            status: 'COMPLETED',
            agent: 'System',
            action: 'Repository Initialization',
            message: `Workspace context attached to ${activeProject?.name || 'Workspace'} (${activeProjectId}).`,
            project: activeProject?.name || 'Workspace',
            iteration: `Iteration 0${activeProject?.current_iteration || 1}`,
            task: 'init',
            file: '',
            traceId: `tr-${activeProjectId.toLowerCase()}-01`,
            correlationId: `corr-${activeProjectId.toLowerCase()}-01`
          },
          {
            id: `log-${activeProjectId}-2`,
            timestamp: new Date().toLocaleTimeString(),
            type: 'INFO',
            status: 'COMPLETED',
            agent: 'Project Manager',
            action: 'Backlog Verification',
            message: `Active user stories parsed for repository ${activeProjectId}.`,
            project: activeProject?.name || 'Workspace',
            iteration: `Iteration 0${activeProject?.current_iteration || 1}`,
            task: 'backlog-check',
            file: '',
            traceId: `tr-${activeProjectId.toLowerCase()}-02`,
            correlationId: `corr-${activeProjectId.toLowerCase()}-02`
          }
        ]
        setEvents(fallbackEvents)
      }
      setPageState('normal')
    } catch (err: any) {
      setPageState('error')
      setFeedbackMsg(err.message || 'Failed to fetch logs.')
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [activeProjectId])

  // Auto-hide toast feedback message
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [feedbackMsg])

  // Simulated Live stream logic
  useEffect(() => {
    if (!isLive || pageState !== 'normal') return

    const appendInterval = setInterval(() => {
      const nextEventData = simulatedLiveEvents[liveIndexRef.current % simulatedLiveEvents.length]
      
      liveIndexRef.current += 1
      const now = new Date()
      const timeStr = now.toTimeString().split(' ')[0]
      const newId = `evt-live-${liveIndexRef.current}`

      const newEventItem: LogEvent = {
        id: newId,
        timestamp: timeStr,
        type: nextEventData.type as LogEventType,
        status: nextEventData.status as LogStatus,
        agent: nextEventData.agent as AgentName,
        action: nextEventData.action,
        message: nextEventData.message,
        project: nextEventData.project,
        iteration: nextEventData.iteration,
        task: nextEventData.task,
        file: nextEventData.file,
        test: nextEventData.test,
        traceId: nextEventData.traceId,
        correlationId: nextEventData.correlationId,
      }

      setEvents((prev) => [newEventItem, ...prev])
      setFeedbackMsg(`Live event received: ${newEventItem.action}`)
    }, 8000)

    return () => clearInterval(appendInterval)
  }, [isLive, pageState])

  // Active selected event object
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedId) || null
  }, [events, selectedId])

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedType('ALL')
    setSelectedAgent('ALL')
    setSelectedStatus('ALL')
    setSelectedIteration('ALL')
    setSelectedProject('ALL')
    setSelectedTime('ALL')
    setSelectedTaskFilter(null)
    setSelectedFileFilter(null)
    setSelectedErrorCategory(null)
    setFeedbackMsg('Filters cleared.')
  }

  // Toggle pin
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPinnedIds((prev) => {
      const exists = prev.includes(id)
      if (exists) {
        setFeedbackMsg('Event unpinned.')
        return prev.filter((pid) => pid !== id)
      } else {
        setFeedbackMsg('Event pinned.')
        return [...prev, id]
      }
    })
  }

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sortedEvents, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `se-maestro-observability-logs-${new Date().toISOString().slice(0, 10)}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setFeedbackMsg('Filtered logs JSON exported.')
  }

  const handleFilterAgent = (agentName: string) => {
    setSelectedAgent(agentName)
    setFeedbackMsg(`Filtered stream to agent: ${agentName}`)
  }

  const handleFilterTask = (taskName: string) => {
    setSelectedTaskFilter(taskName === selectedTaskFilter ? null : taskName)
    setFeedbackMsg(taskName === selectedTaskFilter ? 'Task filter cleared.' : `Filtered stream to task: ${taskName}`)
  }

  const handleFilterFile = (fileName: string) => {
    setSelectedFileFilter(fileName === selectedFileFilter ? null : fileName)
    setFeedbackMsg(fileName === selectedFileFilter ? 'File filter cleared.' : `Filtered stream to file: ${fileName}`)
  }

  const handleFilterErrorCategory = (categoryName: string) => {
    setSelectedErrorCategory(categoryName === selectedErrorCategory ? null : categoryName)
    setSelectedType(categoryName === selectedErrorCategory ? 'ALL' : 'ERROR')
    setFeedbackMsg(categoryName === selectedErrorCategory ? 'Error class filter cleared.' : `Filtered errors class: ${categoryName}`)
  }

  const handleFilterWarningStatus = (status: string) => {
    setSelectedStatus(status === 'RESOLVED' ? 'COMPLETED' : 'ALL')
    setSelectedType('WARNING')
    setFeedbackMsg(`Filtered warning logs to status: ${status}`)
  }

  const handleFilterHealth = (service: string) => {
    setSearchQuery(service.replace(' MOCK', '').replace(' System', '').replace(' Sandbox', ''))
    setFeedbackMsg(`Filtered to health logs: ${service}`)
  }

  // Filter master events list
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedType !== 'ALL' && e.type !== selectedType) return false
      if (selectedAgent !== 'ALL' && e.agent !== selectedAgent) return false
      if (selectedStatus !== 'ALL' && e.status !== selectedStatus) return false
      if (selectedIteration !== 'ALL' && e.iteration !== selectedIteration) return false
      if (selectedProject !== 'ALL' && e.project !== selectedProject) return false

      if (selectedTime !== 'ALL') {
        if (selectedTime === '5m' && !e.id.includes('live')) return false
        if (selectedTime === '15m' && !e.id.includes('live') && e.id.includes('evt-0')) return false
      }

      if (selectedTaskFilter && e.task !== selectedTaskFilter) return false
      if (selectedFileFilter && e.file !== selectedFileFilter) return false
      if (selectedErrorCategory) {
        const messageLower = e.message.toLowerCase()
        const actionLower = e.action.toLowerCase()
        if (selectedErrorCategory === 'Validation Error' && !messageLower.includes('validation') && !messageLower.includes('constraint')) return false
        if (selectedErrorCategory === 'Database Error' && !messageLower.includes('database') && !messageLower.includes('sqlite') && !messageLower.includes('lock')) return false
        if (selectedErrorCategory === 'API Error' && !messageLower.includes('api') && !messageLower.includes('http')) return false
        if (selectedErrorCategory === 'Test Failure' && !actionLower.includes('test') && !e.test) return false
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchMsg = e.message.toLowerCase().includes(query)
        const matchAction = e.action.toLowerCase().includes(query)
        const matchAgent = e.agent.toLowerCase().includes(query)
        const matchFile = e.file.toLowerCase().includes(query)
        const matchTask = e.task.toLowerCase().includes(query)
        const matchProj = e.project.toLowerCase().includes(query)
        const matchTrace = e.traceId.toLowerCase().includes(query)
        const matchCorr = e.correlationId.toLowerCase().includes(query)
        const matchType = e.type.toLowerCase().includes(query)

        if (!matchMsg && !matchAction && !matchAgent && !matchFile && !matchTask && !matchProj && !matchTrace && !matchCorr && !matchType) {
          return false
        }
      }

      return true
    })
  }, [events, selectedType, selectedAgent, selectedStatus, selectedIteration, selectedProject, selectedTime, selectedTaskFilter, selectedFileFilter, selectedErrorCategory, searchQuery])

  // Sort events list
  const sortedEvents = useMemo(() => {
    const list = [...filteredEvents]
    return list.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.id.localeCompare(b.id)
        case 'errors':
          if (a.type === 'ERROR' && b.type !== 'ERROR') return -1
          if (a.type !== 'ERROR' && b.type === 'ERROR') return 1
          return b.id.localeCompare(a.id)
        case 'warnings':
          if (a.type === 'WARNING' && b.type !== 'WARNING') return -1
          if (a.type !== 'WARNING' && b.type === 'WARNING') return 1
          return b.id.localeCompare(a.id)
        case 'agent':
          return a.agent.localeCompare(b.agent)
        case 'type':
          return a.type.localeCompare(b.type)
        case 'newest':
        default:
          return b.id.localeCompare(a.id)
      }
    })
  }, [filteredEvents, sortBy])

  // Count active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (selectedType !== 'ALL') count++
    if (selectedAgent !== 'ALL') count++
    if (selectedStatus !== 'ALL') count++
    if (selectedIteration !== 'ALL') count++
    if (selectedProject !== 'ALL') count++
    if (selectedTime !== 'ALL') count++
    if (selectedTaskFilter) count++
    if (selectedFileFilter) count++
    if (selectedErrorCategory) count++
    return count
  }, [searchQuery, selectedType, selectedAgent, selectedStatus, selectedIteration, selectedProject, selectedTime, selectedTaskFilter, selectedFileFilter, selectedErrorCategory])

  const isFiltered = activeFiltersCount > 0

  // Calculate dynamic summary stats
  const stats = useMemo(() => {
    const total = 1248 + (events.length - mockLogEvents.length)
    const success = 381 + events.filter((e) => e.type === 'SUCCESS').length - mockLogEvents.filter((e) => e.type === 'SUCCESS').length
    const info = 642 + events.filter((e) => e.type === 'INFO').length - mockLogEvents.filter((e) => e.type === 'INFO').length
    const warnings = 97 + events.filter((e) => e.type === 'WARNING').length - mockLogEvents.filter((e) => e.type === 'WARNING').length
    const errors = 28 + events.filter((e) => e.type === 'ERROR').length - mockLogEvents.filter((e) => e.type === 'ERROR').length
    return { total, success, info, warnings, errors }
  }, [events])

  // Get pinned events list objects
  const pinnedEvents = useMemo(() => {
    return events.filter((e) => pinnedIds.includes(e.id))
  }, [events, pinnedIds])

  const renderMainContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center p-16 text-center border border-border rounded-2xl bg-surface-base min-h-[350px] shadow-command-card">
            <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
            <h3 className="font-display text-sm font-bold text-text-primary">Streaming observability telemetry...</h3>
          </div>
        )
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-error/30 bg-error/10 rounded-2xl min-h-[300px]">
            <ShieldAlert className="w-8 h-8 text-error mb-3 animate-bounce" />
            <h3 className="font-display text-sm font-bold text-error">Unable to load telemetry streams.</h3>
            <p className="text-xs text-text-secondary mt-1">Please verify telemetry collector connection.</p>
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
      case 'empty':
        return (
          <EmptyState
            title="No log events match your current filters."
            description="Clear active search queries or dropdown selections to display full telemetry feed."
            icon={<FolderOpen className="w-8 h-8 text-text-muted" />}
            action={
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Reset Filters
              </Button>
            }
          />
        )
      default:
        return (
          <div className="space-y-6">
            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Filters and Tables */}
              <div className="lg:col-span-8 space-y-4">
                {/* Search & Filters */}
                <LogFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedType={selectedType}
                  onTypeChange={setSelectedType}
                  selectedAgent={selectedAgent}
                  onAgentChange={setSelectedAgent}
                  selectedStatus={selectedStatus}
                  onStatusChange={setSelectedStatus}
                  selectedIteration={selectedIteration}
                  onIterationChange={setSelectedIteration}
                  selectedProject={selectedProject}
                  onProjectChange={setSelectedProject}
                  selectedTime={selectedTime}
                  onTimeChange={setSelectedTime}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onClearFilters={handleClearFilters}
                  activeFiltersCount={activeFiltersCount}
                  isFiltered={isFiltered}
                />

                {/* Log Console Mode selectors Tab bar */}
                <div className="flex gap-2.5 text-xs font-mono font-bold select-none border-b border-border pb-3">
                  <button
                    onClick={() => setActiveConsoleTab('stream')}
                    className={`px-3.5 py-2 rounded-xl border cursor-pointer transition-all duration-120 ${
                      activeConsoleTab === 'stream'
                        ? 'bg-accent text-white border-transparent shadow-command-card'
                        : 'bg-surface-base border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    TABULAR LOG STREAM
                  </button>
                  <button
                    onClick={() => setActiveConsoleTab('raw')}
                    className={`px-3.5 py-2 rounded-xl border cursor-pointer transition-all duration-120 ${
                      activeConsoleTab === 'raw'
                        ? 'bg-accent text-white border-transparent shadow-command-card'
                        : 'bg-surface-base border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    STDOUT RAW TERMINAL FEED
                  </button>
                </div>

                {/* Display active tab */}
                {activeConsoleTab === 'stream' ? (
                  sortedEvents.length === 0 ? (
                    <EmptyState
                      title="No log events match your current filters."
                      description="Try resetting search keywords or category selections to restore feed."
                      icon={<FolderOpen className="w-8 h-8 text-text-muted" />}
                      action={
                        <Button variant="outline" size="sm" onClick={handleClearFilters}>
                          Reset Filters
                        </Button>
                      }
                    />
                  ) : (
                    <div className="animate-in fade-in duration-200">
                      <LogTable
                        events={sortedEvents}
                        selectedId={selectedId}
                        onSelectEvent={setSelectedId}
                        pinnedIds={pinnedIds}
                        onTogglePin={handleTogglePin}
                      />
                    </div>
                  )
                ) : (
                  <div className="animate-in fade-in duration-200">
                    <RawLogFeed
                      events={sortedEvents}
                      isLive={isLive}
                      onToggleLive={() => setIsLive(!isLive)}
                      onCopyFeedback={setFeedbackMsg}
                    />
                  </div>
                )}
              </div>

              {/* Right Column: Details inspect stack */}
              <div className="lg:col-span-4 space-y-6">
                {selectedEvent ? (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-200 h-full">
                    {/* Event detail inspector card */}
                    <EventDetailDrawer
                      event={selectedEvent}
                      allEvents={sortedEvents}
                      onSelectEvent={setSelectedId}
                      onClose={() => setSelectedId(null)}
                      onCopyFeedback={setFeedbackMsg}
                    />

                    {/* Trace timeline sequence */}
                    <TraceViewer
                      selectedEvent={selectedEvent}
                      allEvents={events}
                      onSelectEvent={setSelectedId}
                    />
                  </div>
                ) : (
                  <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-border min-h-[300px] select-none font-sans">
                    <Terminal className="w-8 h-8 text-text-muted mb-2" />
                    <p className="text-xs font-mono text-text-secondary">
                      Select an event row from the stream list to audit trace details.
                    </p>
                  </Card>
                )}

                {/* Pinned Events widget */}
                {pinnedEvents.length > 0 && (
                  <div className="bg-surface-base border border-border rounded-2xl p-5 shadow-command-card space-y-3 font-sans select-none">
                    <div className="flex items-center gap-2 border-b border-border pb-2.5">
                      <Pin className="w-4 h-4 text-accent" />
                      <h4 className="font-display text-xs font-bold text-text-primary uppercase tracking-wider">
                        Pinned Events ({pinnedEvents.length})
                      </h4>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                      {pinnedEvents.map((pe) => (
                        <div
                          key={pe.id}
                          onClick={() => setSelectedId(pe.id)}
                          className="flex items-start justify-between gap-2.5 p-2.5 rounded-xl bg-surface-secondary border border-border hover:border-accent cursor-pointer transition-colors"
                        >
                          <div className="min-w-0 font-mono text-xs">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent">
                              <span>{pe.timestamp}</span> • <span>{pe.id}</span>
                            </div>
                            <span className="font-semibold text-text-primary block mt-0.5 truncate">{pe.action}</span>
                          </div>
                          <button
                            onClick={(e) => handleTogglePin(pe.id, e)}
                            className="p-1 rounded-lg hover:bg-surface-elevated text-accent cursor-pointer flex-shrink-0"
                            title="Unpin Event"
                          >
                            <PinOff className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Failure trace audits */}
            {selectedEvent && (
              <div className="animate-in fade-in duration-200">
                <FailureTrace selectedEvent={selectedEvent} />
              </div>
            )}

            {/* Errors / Warnings Center */}
            <ErrorWarningCenter
              onFilterErrorCategory={handleFilterErrorCategory}
              onFilterWarningStatus={handleFilterWarningStatus}
              onClearFilters={handleClearFilters}
              currentErrorCategoryFilter={selectedErrorCategory}
            />

            {/* Metrics panels */}
            <MetricsPanel
              onFilterAgent={handleFilterAgent}
              onFilterTask={handleFilterTask}
              onFilterFile={handleFilterFile}
              onFilterHealth={handleFilterHealth}
              selectedAgentFilter={selectedAgent === 'ALL' ? null : selectedAgent}
              selectedTaskFilter={selectedTaskFilter}
              selectedFileFilter={selectedFileFilter}
            />

            {/* Iterations performance comparison list */}
            <IterationObservability />
          </div>
        )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-sans">
      {/* Toast notifications */}
      {feedbackMsg && (
        <div className="fixed top-5 right-5 z-50 bg-surface-elevated border border-accent/40 text-text-primary px-4 py-3 rounded-xl shadow-command-card text-xs font-mono flex items-center gap-2.5 animate-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {/* Developer state switcher row */}
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

      {/* Main page Observability header */}
      <LogsHeader
        isLive={isLive}
        onToggleLive={() => {
          setIsLive(!isLive)
          setFeedbackMsg(isLive ? 'Live log simulation paused.' : 'Live log simulation resumed.')
        }}
        onExport={handleExport}
        onClearAll={handleClearFilters}
        isFiltered={isFiltered}
      />

      {/* Summary count cards */}
      <ObservabilitySummary
        total={stats.total}
        success={stats.success}
        info={stats.info}
        warnings={stats.warnings}
        errors={stats.errors}
        activeAgents={3}
        iteration="03"
      />

      {/* Main content viewport */}
      {renderMainContent()}
    </div>
  )
}
