import React from 'react'
import { Input } from '../../../components/ui/Input'
import { Search, RotateCcw, ArrowUpDown, Filter } from 'lucide-react'

interface LogFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  selectedType: string
  onTypeChange: (val: string) => void
  selectedAgent: string
  onAgentChange: (val: string) => void
  selectedStatus: string
  onStatusChange: (val: string) => void
  selectedIteration: string
  onIterationChange: (val: string) => void
  selectedProject: string
  onProjectChange: (val: string) => void
  selectedTime: string
  onTimeChange: (val: string) => void
  sortBy: string
  onSortChange: (val: string) => void
  onClearFilters: () => void
  activeFiltersCount: number
  isFiltered: boolean
}

export const LogFilters: React.FC<LogFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedAgent,
  onAgentChange,
  selectedStatus,
  onStatusChange,
  selectedIteration,
  onIterationChange,
  selectedProject,
  onProjectChange,
  selectedTime,
  onTimeChange,
  sortBy,
  onSortChange,
  onClearFilters,
  activeFiltersCount,
  isFiltered,
}) => {
  const typeOptions = [
    { label: 'All Event Types', value: 'ALL' },
    { label: 'Info', value: 'INFO' },
    { label: 'Success', value: 'SUCCESS' },
    { label: 'Warning', value: 'WARNING' },
    { label: 'Error', value: 'ERROR' },
    { label: 'Debug', value: 'DEBUG' },
    { label: 'Review', value: 'REVIEW' },
    { label: 'Evolution', value: 'EVOLUTION' },
    { label: 'Memory', value: 'MEMORY' },
    { label: 'System', value: 'SYSTEM' },
  ]

  const agentOptions = [
    { label: 'All Agents', value: 'ALL' },
    { label: 'Project Manager', value: 'Project Manager' },
    { label: 'Architect', value: 'Architect' },
    { label: 'Developer', value: 'Developer' },
    { label: 'Tester', value: 'Tester' },
    { label: 'Code Reviewer', value: 'Code Reviewer' },
    { label: 'Debugger', value: 'Debugger' },
    { label: 'Evolution Agent', value: 'Evolution Agent' },
    { label: 'Memory System', value: 'Memory System' },
    { label: 'System', value: 'System' },
  ]

  const statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Running', value: 'RUNNING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Waiting', value: 'WAITING' },
    { label: 'Analyzing', value: 'ANALYZING' },
    { label: 'Retrying', value: 'RETRYING' },
    { label: 'Stored', value: 'STORED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ]

  const iterationOptions = [
    { label: 'All Iterations', value: 'ALL' },
    { label: 'Iteration 01', value: 'Iteration 01' },
    { label: 'Iteration 02', value: 'Iteration 02' },
    { label: 'Iteration 03', value: 'Iteration 03' },
  ]

  const projectOptions = [
    { label: 'All Projects', value: 'ALL' },
    { label: 'Student Management System', value: 'Student Management System' },
  ]

  const timeOptions = [
    { label: 'All Time', value: 'ALL' },
    { label: 'Last 5 minutes', value: '5m' },
    { label: 'Last 15 minutes', value: '15m' },
    { label: 'Last hour', value: '1h' },
    { label: 'Today', value: 'today' },
  ]

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Errors First', value: 'errors' },
    { label: 'Warnings First', value: 'warnings' },
    { label: 'Agent Name', value: 'agent' },
    { label: 'Event Type', value: 'type' },
  ]

  return (
    <div className="bg-surface border border-border rounded-md shadow-xs p-4 space-y-4 font-sans select-none">
      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search logs, agents, files, tasks, errors, trace IDs..."
          className="pl-8.5 text-xs font-mono h-8.5"
        />
        <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-2.5" />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Event Type */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-text-secondary flex items-center gap-0.5"><Filter className="w-3 h-3 text-text-muted" /> Type:</span>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="bg-surface-secondary text-text-primary border border-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Agent */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-text-secondary">Agent:</span>
          <select
            value={selectedAgent}
            onChange={(e) => onAgentChange(e.target.value)}
            className="bg-surface-secondary text-text-primary border border-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {agentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-text-secondary">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-surface-secondary text-text-primary border border-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Iteration */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-text-secondary">Iteration:</span>
          <select
            value={selectedIteration}
            onChange={(e) => onIterationChange(e.target.value)}
            className="bg-surface-secondary text-text-primary border border-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {iterationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Project */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-text-secondary">Project:</span>
          <select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            className="bg-surface-secondary text-text-primary border border-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {projectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-text-secondary">Time:</span>
          <select
            value={selectedTime}
            onChange={(e) => onTimeChange(e.target.value)}
            className="bg-surface-secondary text-text-primary border border-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {timeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono ml-auto lg:ml-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-text-secondary">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-surface-secondary text-text-primary border border-border rounded px-2.5 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filter Badges */}
        {activeFiltersCount > 0 && (
          <span className="inline-flex items-center text-[10px] font-mono font-bold text-accent bg-accent/10 border border-accent/20 rounded px-2 py-0.5 shadow-2xs">
            Filters Active: {activeFiltersCount}
          </span>
        )}

        {isFiltered && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent-hover transition-colors font-mono cursor-pointer border border-accent/20 rounded px-2.5 py-1 bg-accent-soft/10"
          >
            <RotateCcw className="w-3 h-3" />
            CLEAR FILTERS
          </button>
        )}
      </div>
    </div>
  )
}
