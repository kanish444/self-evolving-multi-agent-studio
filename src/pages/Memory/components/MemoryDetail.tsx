import React, { useState } from 'react'
import type { Memory } from '../mockData'
import { Card } from '../../../components/ui/Card'
import { Cpu, GitBranch, MoreVertical, Edit2, Trash2, Archive, Copy, X } from 'lucide-react'

interface MemoryDetailProps {
  memory: Memory
  allMemories: Memory[]
  onSelectMemory: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (memory: Memory) => void
  onCopy: () => void
  onClose: () => void
}

export const MemoryDetail: React.FC<MemoryDetailProps> = ({
  memory,
  allMemories,
  onSelectMemory,
  onArchive,
  onDelete,
  onEdit,
  onCopy,
  onClose,
}) => {
  const [showDropdown, setShowDropdown] = useState(false)

  // Map related memory IDs to actual memory titles/objects
  const relatedMemoryObjects = memory.relatedMemories
    .map((refId) => allMemories.find((m) => m.id === refId))
    .filter((m): m is Memory => !!m)

  const getImportanceBadge = (importance: Memory['importance']) => {
    switch (importance) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-50 border border-rose-250 text-rose-700">
            CRITICAL
          </span>
        )
      case 'High':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-50 border border-amber-250 text-amber-700">
            HIGH
          </span>
        )
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-50 border border-indigo-250 text-indigo-700">
            MEDIUM
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-50 border border-slate-200 text-slate-700">
            LOW
          </span>
        )
    }
  }

  return (
    <Card className="p-5 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4 relative">
      {/* Detail Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/80 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">
              {memory.id} • {memory.type}
            </span>
            <span className="text-text-muted text-[10px] font-mono">•</span>
            <span className="text-[10px] font-bold text-success font-mono bg-success/10 px-1.5 py-0.2 rounded border border-success/20">
              {memory.status.toUpperCase()}
            </span>
          </div>
          <h3 className="text-sm font-bold text-text-primary font-mono leading-relaxed">
            {memory.title}
          </h3>
        </div>

        {/* Header controls: Close & Dropdown Menu actions */}
        <div className="flex items-center gap-1.5 select-none">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-1 hover:bg-surface-elevated rounded transition-colors text-text-secondary cursor-pointer border border-border bg-surface-secondary"
              title="Memory Actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-1 w-36 bg-surface-elevated border border-border rounded-md shadow-lg py-1 z-20 font-mono text-[10px] animate-in fade-in duration-100">
                  <button
                    onClick={() => {
                      onEdit(memory)
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-surface-secondary text-text-primary flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-accent" />
                    Edit Memory
                  </button>
                  <button
                    onClick={() => {
                      onArchive(memory.id)
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-surface-secondary text-text-primary flex items-center gap-1.5 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5 text-warning" />
                    Archive Memory
                  </button>
                  <button
                    onClick={() => {
                      onCopy()
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-surface-secondary text-text-primary flex items-center gap-1.5 cursor-pointer border-t border-border"
                  >
                    <Copy className="w-3.5 h-3.5 text-system" />
                    Copy Details
                  </button>
                  <button
                    onClick={() => {
                      onDelete(memory.id)
                      setShowDropdown(false)
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-surface-secondary text-error flex items-center gap-1.5 cursor-pointer border-t border-border"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Memory
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-elevated rounded transition-colors text-text-secondary cursor-pointer border border-border bg-surface-secondary"
            title="Close Details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1 text-xs">
        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
          Memory Description
        </span>
        <p className="text-text-secondary leading-relaxed bg-surface-secondary border border-border p-3 rounded-md">
          {memory.description}
        </p>
      </div>

      {/* Knowledge logic rule */}
      <div className="space-y-1 text-xs">
        <span className="text-[9px] font-bold text-accent uppercase tracking-wider font-mono block">
          Retained Rule / Action
        </span>
        <div className="p-3 bg-accent/15 border border-accent/30 rounded text-accent font-bold font-mono">
          "{memory.learning}"
        </div>
      </div>

      {/* Origin Metadata Grid */}
      <div className="grid grid-cols-2 gap-3.5 text-xs">
        <div className="p-2.5 bg-surface-secondary border border-border rounded-md">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
            Origin Source Agent
          </span>
          <div className="text-xs text-text-primary font-semibold mt-1 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-accent" />
            {memory.sourceAgent}
          </div>
        </div>

        <div className="p-2.5 bg-surface-secondary border border-border rounded-md">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
            Iteration / Project
          </span>
          <div className="text-xs text-text-primary font-semibold mt-1 flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-system" />
            {memory.iteration} ({memory.project})
          </div>
        </div>
      </div>

      {/* Stats indicators */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
        <div className="bg-surface-secondary border border-border rounded p-2">
          <span className="text-[8px] text-text-muted block uppercase">Confidence</span>
          <span className="font-bold text-success block mt-0.5">{memory.confidence}%</span>
        </div>
        <div className="bg-surface-secondary border border-border rounded p-2">
          <span className="text-[8px] text-text-muted block uppercase">Importance</span>
          <div className="mt-0.5 block">{getImportanceBadge(memory.importance)}</div>
        </div>
        <div className="bg-surface-secondary border border-border rounded p-2">
          <span className="text-[8px] text-text-muted block uppercase">Created</span>
          <span className="font-semibold text-text-secondary block mt-0.5 truncate">{memory.createdAt.split(',')[0]}</span>
        </div>
      </div>

      {/* Evidence Failures & Agents involved */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
            Related Test Failures
          </span>
          <div className="bg-surface-secondary border border-border rounded p-2.5 max-h-[90px] overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1 text-error">
            {memory.relatedFailures.length > 0 ? (
              memory.relatedFailures.map((fail, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span className="text-error">•</span>
                  <span>{fail}</span>
                </div>
              ))
            ) : (
              <span className="text-text-muted">No test failure records linked.</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block">
            Consulted Agents
          </span>
          <div className="flex flex-wrap gap-1.5 py-1">
            {memory.relatedAgents.map((ag) => (
              <span
                key={ag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/15 border border-accent/30 text-accent font-bold font-mono text-[9px] shadow-xs"
              >
                <Cpu className="w-3 h-3 text-accent" />
                {ag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Clickable Related Memories (Semantic Graph Navigation) (Section 14) */}
      <div className="space-y-2 pt-2 border-t border-border">
        <span className="text-[9px] font-bold text-accent uppercase tracking-wider font-mono block">
          Related Semantic Memories
        </span>
        <div className="flex flex-wrap gap-2 select-none">
          {relatedMemoryObjects.length > 0 ? (
            relatedMemoryObjects.map((rm) => (
              <button
                key={rm.id}
                onClick={() => onSelectMemory(rm.id)}
                className="px-2.5 py-1 rounded bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent text-[10px] font-bold font-mono transition-colors shadow-xs cursor-pointer"
              >
                {rm.title}
              </button>
            ))
          ) : (
            <span className="text-[10px] text-text-muted font-mono">No related memories cataloged.</span>
          )}
        </div>
      </div>
    </Card>
  )
}
