import React from 'react'
import { SearchInput } from '../../../components/ui/Input'

interface TestFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  selectedStatus: string
  onStatusChange: (val: string) => void
  selectedType: string
  onTypeChange: (val: string) => void
  selectedAgent: string
  onAgentChange: (val: string) => void
  selectedIteration: string
  onIterationChange: (val: string) => void
  onClearFilters: () => void
}

export const TestFilters: React.FC<TestFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedType,
  onTypeChange,
  selectedAgent,
  onAgentChange,
  selectedIteration,
  onIterationChange,
  onClearFilters,
}) => {
  const isAnyFilterActive =
    searchQuery !== '' ||
    selectedStatus !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedAgent !== 'ALL' ||
    selectedIteration !== 'ALL'

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-surface border border-border rounded-lg shadow-command-card">
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1">
          <SearchInput
            placeholder="Search test cases by name or endpoint..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Dropdown Select Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:flex lg:items-center">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-surface-secondary text-text-secondary border-border text-xs px-2.5 py-1.5 rounded focus:ring-1 focus:ring-accent focus:border-accent border cursor-pointer font-medium h-[32px] min-w-[100px]"
            >
              <option value="ALL">Status: All</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="RUNNING">RUNNING</option>
              <option value="SKIPPED">SKIPPED</option>
            </select>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="bg-surface-secondary text-text-secondary border-border text-xs px-2.5 py-1.5 rounded focus:ring-1 focus:ring-accent focus:border-accent border cursor-pointer font-medium h-[32px] min-w-[100px]"
            >
              <option value="ALL">Type: All</option>
              <option value="Unit">Unit</option>
              <option value="API">API</option>
              <option value="Integration">Integration</option>
              <option value="Security">Security</option>
              <option value="UI">UI</option>
            </select>
          </div>

          {/* Agent */}
          <div className="flex flex-col gap-1">
            <select
              value={selectedAgent}
              onChange={(e) => onAgentChange(e.target.value)}
              className="bg-surface-secondary text-text-secondary border-border text-xs px-2.5 py-1.5 rounded focus:ring-1 focus:ring-accent focus:border-accent border cursor-pointer font-medium h-[32px] min-w-[120px]"
            >
              <option value="ALL">Agent: All</option>
              <option value="Tester Agent">Tester Agent</option>
              <option value="Debugger Agent">Debugger Agent</option>
              <option value="Reviewer Agent">Reviewer Agent</option>
            </select>
          </div>

          {/* Iteration */}
          <div className="flex flex-col gap-1">
            <select
              value={selectedIteration}
              onChange={(e) => onIterationChange(e.target.value)}
              className="bg-surface-secondary text-text-secondary border-border text-xs px-2.5 py-1.5 rounded focus:ring-1 focus:ring-accent focus:border-accent border cursor-pointer font-medium h-[32px] min-w-[110px]"
            >
              <option value="ALL">Iteration: All</option>
              <option value="01">Iteration 01</option>
              <option value="02">Iteration 02</option>
              <option value="03">Iteration 03</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {isAnyFilterActive && (
          <button
            onClick={onClearFilters}
            className="text-[11px] font-bold text-accent hover:text-accent transition-colors font-mono cursor-pointer self-center whitespace-nowrap bg-[rgba(179, 68, 30, 0.1)] px-2.5 py-1.5 rounded border border-[rgba(179, 68, 30, 0.3)] hover:border-[rgba(179, 68, 30, 0.5)]"
          >
            CLEAR FILTERS
          </button>
        )}
      </div>
    </div>
  )
}
