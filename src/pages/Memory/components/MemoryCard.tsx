import React from 'react'
import type { Memory } from '../mockData'
import { ShieldAlert, CheckCircle, Clock, Award } from 'lucide-react'

interface MemoryCardProps {
  memory: Memory
  isSelected: boolean
  onClick: () => void
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, isSelected, onClick }) => {
  const getImportanceBadge = (importance: Memory['importance']) => {
    switch (importance) {
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-error/10 border border-error/20 text-error">
            <ShieldAlert className="w-2.5 h-2.5" />
            CRITICAL
          </span>
        )
      case 'High':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-warning/10 border border-warning/20 text-warning">
            <ShieldAlert className="w-2.5 h-2.5" />
            HIGH
          </span>
        )
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-accent/10 border border-accent/20 text-accent">
            <Award className="w-2.5 h-2.5" />
            MEDIUM
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-surface-secondary border border-border text-text-muted">
            <Clock className="w-2.5 h-2.5" />
            LOW
          </span>
        )
    }
  }

  const getStatusIcon = (status: Memory['status']) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="w-3 h-3 text-success" />
      case 'Needs Review':
        return <ShieldAlert className="w-3 h-3 text-warning animate-pulse" />
      case 'Archived':
        return <Clock className="w-3 h-3 text-text-muted" />
      default:
        return <CheckCircle className="w-3 h-3 text-accent" />
    }
  }

  return (
    <div
      onClick={onClick}
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 bg-surface flex flex-col justify-between h-44 group ${
        isSelected
          ? 'border-accent bg-accent/10 ring-1 ring-accent shadow-[0_4px_12px_rgba(179,68,30,0.15)]'
          : 'border-border/60 hover:border-accent/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]'
      }`}
    >
      <div className="space-y-2">
        {/* Header Badges row */}
        <div className="flex items-center justify-between gap-2 select-none">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider font-mono">
            {memory.type}
          </span>
          <div className="flex items-center gap-1.5">
            {getImportanceBadge(memory.importance)}
            <span className="flex items-center" title={`Status: ${memory.status}`}>
              {getStatusIcon(memory.status)}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-xs font-bold text-text-primary group-hover:text-accent transition-colors font-mono leading-tight line-clamp-2">
          {memory.title}
        </h4>

        {/* Description Snippet */}
        <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-2">
          {memory.description}
        </p>
      </div>

      <div className="space-y-2.5 pt-2 border-t border-border/40 text-[9px] font-mono">
        {/* Confidence rating */}
        <div className="flex items-center justify-between text-text-secondary">
          <span>Confidence:</span>
          <span className="font-bold text-success">{memory.confidence}%</span>
        </div>
        <div className="bg-surface-secondary border border-border h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-success h-full rounded-full transition-all duration-300"
            style={{ width: `${memory.confidence}%` }}
          />
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1 overflow-hidden select-none">
          {memory.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.2 rounded bg-surface-secondary border border-border text-[9px] text-text-muted hover:text-text-primary transition-colors"
            >
              #{tag}
            </span>
          ))}
          {memory.tags.length > 3 && (
            <span className="text-[8px] text-text-muted">+{memory.tags.length - 3}</span>
          )}
        </div>
      </div>
    </div>
  )
}
