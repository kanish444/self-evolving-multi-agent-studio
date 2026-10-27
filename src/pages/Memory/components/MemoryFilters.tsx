import React from 'react'
import { Input } from '../../../components/ui/Input'
import { Search, RotateCcw, ArrowUpDown } from 'lucide-react'

interface MemoryFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedImportance: string
  onImportanceChange: (imp: string) => void
  selectedAgent: string
  onAgentChange: (agent: string) => void
  selectedProject: string
  onProjectChange: (project: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  selectedIteration: string
  onIterationChange: (iteration: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  onClearFilters: () => void
}

export const MemoryFilters: React.FC<MemoryFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedImportance,
  onImportanceChange,
  selectedAgent,
  onAgentChange,
  selectedProject,
  onProjectChange,
  selectedStatus,
  onStatusChange,
  selectedIteration,
  onIterationChange,
  sortBy,
  onSortChange,
  onClearFilters,
}) => {
  const importanceOptions = [
    { label: 'All Importances', value: 'ALL' },
    { label: 'Critical', value: 'Critical' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ]

  const agentOptions = [
    { label: 'All Agents', value: 'ALL' },
    { label: 'Project Manager', value: 'Project Manager' },
    { label: 'Architect', value: 'Architect' },
    { label: 'Developer', value: 'Developer' },
    { label: 'Tester', value: 'Tester' },
    { label: 'Code Reviewer', value: 'Code Reviewer' },
    { label: 'Debugger', value: 'Debugger' },
    { label: 'Evolution', value: 'Evolution' },
  ]

  const projectOptions = [
    { label: 'All Projects', value: 'ALL' },
    { label: 'Student Management System', value: 'Student Management System' },
    { label: 'Other Projects', value: 'Other Projects' },
  ]

  const statusOptions = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Active', value: 'Active' },
    { label: 'Archived', value: 'Archived' },
    { label: 'Needs Review', value: 'Needs Review' },
    { label: 'Verified', value: 'Verified' },
  ]

  const iterationOptions = [
    { label: 'All Iterations', value: 'ALL' },
    { label: '01', value: '01' },
    { label: '02', value: '02' },
    { label: '03', value: '03' },
  ]

  const sortOptions = [
    { label: 'Newest', value: 'newest' },
    { label: 'Oldest', value: 'oldest' },
    { label: 'Importance', value: 'importance' },
    { label: 'Confidence', value: 'confidence' },
    { label: 'Most Used', value: 'most_used' },
    { label: 'Least Used', value: 'least_used' },
  ]

  const isFiltered =
    searchQuery !== '' ||
    selectedImportance !== 'ALL' ||
    selectedAgent !== 'ALL' ||
    selectedProject !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedIteration !== 'ALL'

  let activeFiltersCount = 0
  if (searchQuery !== '') activeFiltersCount++
  if (selectedImportance !== 'ALL') activeFiltersCount++
  if (selectedAgent !== 'ALL') activeFiltersCount++
  if (selectedProject !== 'ALL') activeFiltersCount++
  if (selectedStatus !== 'ALL') activeFiltersCount++
  if (selectedIteration !== 'ALL') activeFiltersCount++

  return (
    <div className="space-y-3.5">
      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search memories, patterns, errors, tags, agents..."
          className="pl-8 text-xs font-mono h-8.5"
        />
        <Search className="w-4 h-4 text-text-muted absolute left-2.5 top-2.5" />
      </div>

      {/* Select selectors row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Project */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-text-muted">Project:</span>
          <select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {projectOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Importance */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-text-muted">Importance:</span>
          <select
            value={selectedImportance}
            onChange={(e) => onImportanceChange(e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {importanceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Agent */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-text-muted">Agent:</span>
          <select
            value={selectedAgent}
            onChange={(e) => onAgentChange(e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
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
          <span className="text-text-muted">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
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
          <span className="text-text-muted">Iteration:</span>
          <select
            value={selectedIteration}
            onChange={(e) => onIterationChange(e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {iterationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <ArrowUpDown className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-text-muted">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filter Count */}
        {activeFiltersCount > 0 && (
          <span className="inline-flex items-center text-[10px] font-mono font-bold text-accent bg-accent/10 border border-accent/20 rounded-md px-2 py-1">
            Filters Active: {activeFiltersCount}
          </span>
        )}

        {/* Clear Filters */}
        {isFiltered && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent-hover transition-colors font-mono cursor-pointer border border-accent/20 rounded px-2 py-1 bg-accent-soft/10 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            CLEAR ALL FILTERS
          </button>
        )}
      </div>
    </div>
  )
}
