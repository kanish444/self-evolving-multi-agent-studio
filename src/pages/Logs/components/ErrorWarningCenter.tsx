import React from 'react'
import { Card } from '../../../components/ui/Card'
import {
  AlertOctagon,
  AlertTriangle
} from 'lucide-react'

interface ErrorWarningCenterProps {
  onFilterErrorCategory: (category: string) => void
  onFilterWarningStatus: (status: string) => void
  onClearFilters: () => void
  currentErrorCategoryFilter: string | null
}

export const ErrorWarningCenter: React.FC<ErrorWarningCenterProps> = ({
  onFilterErrorCategory,
  onFilterWarningStatus,
  onClearFilters,
  currentErrorCategoryFilter,
}) => {
  // Error categories definitions
  const errorCategories = [
    { name: 'Validation Error', count: 8, color: 'bg-rose-50 border-rose-200 text-rose-700' },
    { name: 'Database Error', count: 7, color: 'bg-red-50 border-red-200 text-red-700' },
    { name: 'API Error', count: 5, color: 'bg-orange-50 border-orange-200 text-orange-700' },
    { name: 'Test Failure', count: 4, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { name: 'Other Errors', count: 4, color: 'bg-slate-50 border-slate-200 text-slate-700' },
  ]

  // Warning alerts definitions
  const warningsList = [
    { id: 'w-1', label: 'Unused import statement found in controller module', type: 'Unused Import', status: 'OPEN' },
    { id: 'w-2', label: 'Slow API endpoint response detected: /api/grades averages (148ms)', type: 'Slow API', status: 'ACKNOWLEDGED' },
    { id: 'w-3', label: 'Low test integration coverage warning on attendance packages (62%)', type: 'Low Coverage', status: 'RESOLVED' },
    { id: 'w-4', label: 'Deprecated SQLite transaction commit methods detected', type: 'Deprecated Pattern', status: 'OPEN' },
    { id: 'w-5', label: 'Potential duplicate logic spotted inside schema decorators', type: 'Duplicate Logic', status: 'RESOLVED' },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold font-mono bg-rose-50 border border-rose-200 text-rose-700">
            OPEN
          </span>
        )
      case 'ACKNOWLEDGED':
        return (
          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold font-mono bg-amber-50 border border-amber-250 text-amber-700">
            ACK
          </span>
        )
      default:
        return (
          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold font-mono bg-emerald-50 border border-emerald-250 text-emerald-700">
            RESOLVED
          </span>
        )
    }
  }

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4 select-none font-sans">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2.5">
        <AlertOctagon className="w-4 h-4 text-rose-500 animate-pulse" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono flex-1">
          Diagnostics & Error Center
        </h3>
        {currentErrorCategoryFilter && (
          <button
            onClick={onClearFilters}
            className="text-[9px] font-mono font-bold text-accent hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            Clear Diagnostic Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Error Diagnostics Stats Column */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-[10px] font-bold font-mono text-text-secondary">
            <span>ERROR SUMMARY STATISTICS</span>
            <span className="text-rose-700 font-bold bg-rose-50 px-1 rounded">TOTAL: 28</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px]">
            <div className="bg-emerald-50/20 border border-emerald-200/50 rounded p-2">
              <span className="text-[7.5px] text-text-muted uppercase block leading-none">Resolved</span>
              <span className="text-xs font-bold text-emerald-750 block mt-1 leading-none">22</span>
            </div>
            <div className="bg-rose-50/20 border border-rose-250 rounded p-2 animate-pulse">
              <span className="text-[7.5px] text-text-muted uppercase block leading-none">Open</span>
              <span className="text-xs font-bold text-rose-700 block mt-1 leading-none">04</span>
            </div>
            <div className="bg-amber-50/20 border border-amber-250 rounded p-2">
              <span className="text-[7.5px] text-text-muted uppercase block leading-none">Retrying</span>
              <span className="text-xs font-bold text-amber-700 block mt-1 leading-none">02</span>
            </div>
          </div>

          {/* Categories select list */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
              Filter Log Stream by Error Class
            </span>
            <div className="flex flex-wrap gap-1.5 select-none">
              {errorCategories.map((cat) => {
                const isActive = currentErrorCategoryFilter === cat.name
                return (
                  <button
                    key={cat.name}
                    onClick={() => onFilterErrorCategory(cat.name)}
                    className={`px-2 py-1 rounded text-[9.5px] font-bold font-mono border transition-all cursor-pointer flex items-center gap-1 shadow-3xs ${cat.color} ${
                      isActive ? 'ring-1 ring-rose-500 scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="inline-block bg-surface-base px-1 rounded text-[8px]">{cat.count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Warning Alerts Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold font-mono text-text-secondary">
            <span>SYSTEM OBSERVABILITY WARNINGS</span>
            <span className="text-warning font-bold bg-warning/15 px-1 rounded">WARN: 97</span>
          </div>

          <div className="bg-surface-secondary border border-border rounded-md p-2.5 max-h-[125px] overflow-y-auto custom-scrollbar space-y-2">
            {warningsList.map((warn) => (
              <div
                key={warn.id}
                onClick={() => onFilterWarningStatus(warn.status)}
                className="flex items-start justify-between gap-3 text-[10px] bg-surface-base border border-border hover:border-warning/50 p-2 rounded shadow-xs cursor-pointer transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[8px] font-bold text-text-muted uppercase font-mono block leading-none mb-0.5">
                      {warn.type}
                    </span>
                    <p className="text-[10px] text-text-secondary font-medium leading-tight font-sans">
                      {warn.label}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">{getStatusBadge(warn.status)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
