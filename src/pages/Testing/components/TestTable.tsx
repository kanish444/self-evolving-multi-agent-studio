import React from 'react'
import type { TestCase } from '../mockData'
import { CheckCircle2, XCircle, Loader2, SkipForward, Eye } from 'lucide-react'

interface TestTableProps {
  testCases: TestCase[]
  selectedId: string | null
  onSelect: (test: TestCase) => void
  onOpenDetails: (test: TestCase) => void
}

export const TestTable: React.FC<TestTableProps> = ({
  testCases,
  selectedId,
  onSelect,
  onOpenDetails,
}) => {
  const getStatusBadge = (status: TestCase['status']) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            PASS
          </span>
        )
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-red-500/10 border border-red-500/30 text-red-400">
            <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
            FAIL
          </span>
        )
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Loader2 className="w-3 h-3 text-cyan-400 animate-spin flex-shrink-0" />
            RUNNING
          </span>
        )
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider bg-surface-secondary border border-border text-text-secondary">
            <SkipForward className="w-3 h-3 text-text-muted flex-shrink-0" />
            SKIPPED
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-command-card overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-elevated border-b border-border">
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Test Name
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Type
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Agent
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Status
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Time
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Last Run
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {testCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-text-muted font-mono">
                  No test cases found matching filters.
                </td>
              </tr>
            ) : (
              testCases.map((tc) => {
                const isSelected = tc.id === selectedId
                return (
                  <tr
                    key={tc.id}
                    onClick={() => onSelect(tc)}
                    className={`hover:bg-surface-secondary/70 transition-colors cursor-pointer group ${
                      isSelected ? 'bg-[rgba(179, 68, 30, 0.08)] border-l-2 border-l-accent' : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <td className="px-4 py-2 text-xs font-mono font-bold text-text-primary">
                      {tc.name}
                    </td>
                    <td className="px-4 py-2 text-[11px] text-text-secondary">
                      {tc.type}
                    </td>
                    <td className="px-4 py-2 text-[11px] text-text-secondary font-mono">
                      {tc.agent}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {getStatusBadge(tc.status)}
                    </td>
                    <td className="px-4 py-2 text-[11px] text-text-muted font-mono">
                      {tc.executionTime || '--'}
                    </td>
                    <td className="px-4 py-2 text-[11px] text-text-muted font-mono">
                      {tc.lastRun}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onOpenDetails(tc)
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:text-accent transition-colors font-mono cursor-pointer border border-accent/30 rounded px-1.5 py-0.5 bg-[rgba(179, 68, 30, 0.1)] opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Eye className="w-3 h-3" />
                        INSPECT
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
