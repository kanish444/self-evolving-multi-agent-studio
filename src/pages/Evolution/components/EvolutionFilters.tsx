import React from 'react'
import { Input } from '../../../components/ui/Input'
import { Search, RotateCcw } from 'lucide-react'

interface EvolutionFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedType: string
  onTypeChange: (type: string) => void
  selectedIteration: string
  onIterationChange: (iter: string) => void
  selectedImpact: string
  onImpactChange: (impact: string) => void
  onClearFilters: () => void
}

export const EvolutionFilters: React.FC<EvolutionFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedIteration,
  onIterationChange,
  selectedImpact,
  onImpactChange,
  onClearFilters,
}) => {
  const typeOptions = [
    { label: 'All Types', value: 'ALL' },
    { label: 'Failures', value: 'FAILURES' },
    { label: 'Patterns', value: 'PATTERNS' },
    { label: 'Learnings', value: 'LEARNINGS' },
    { label: 'Workflow Changes', value: 'WORKFLOW' },
    { label: 'Recommendations', value: 'RECOMMENDATIONS' },
  ]

  const iterationOptions = [
    { label: 'All Iterations', value: 'ALL' },
    { label: 'Iteration 01', value: '01' },
    { label: 'Iteration 02', value: '02' },
    { label: 'Iteration 03', value: '03' },
  ]

  const impactOptions = [
    { label: 'All Impacts', value: 'ALL' },
    { label: 'High', value: 'High' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Low', value: 'Low' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="flex-1 min-w-[200px] relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search learnings, patterns..."
          className="pl-8 text-xs font-mono h-8"
        />
        <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5" />
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono">
        <span className="text-text-muted">Type:</span>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Iteration Filter */}
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

      {/* Impact Filter */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono">
        <span className="text-text-muted">Impact:</span>
        <select
          value={selectedImpact}
          onChange={(e) => onImpactChange(e.target.value)}
          className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
        >
          {impactOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters Button */}
      {(searchQuery || selectedType !== 'ALL' || selectedIteration !== 'ALL' || selectedImpact !== 'ALL') && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent-hover transition-colors font-mono cursor-pointer border border-accent/20 rounded px-2 py-1.5 bg-accent-soft/10"
        >
          <RotateCcw className="w-3 h-3" />
          CLEAR
        </button>
      )}
    </div>
  )
}
