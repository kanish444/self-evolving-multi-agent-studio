import React from 'react'
import type { Memory, MemoryTimelineItem } from '../mockData'
import { Card } from '../../../components/ui/Card'
import { Calendar } from 'lucide-react'

interface MemoryTimelineProps {
  memory: Memory
  timelineItems: MemoryTimelineItem[]
}

export const MemoryTimeline: React.FC<MemoryTimelineProps> = ({ memory, timelineItems }) => {
  return (
    <Card className="p-4 border border-border shadow-command-card space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-2.5">
        <Calendar className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Memory History & Refinement
        </h3>
      </div>

      <div className="relative pl-5 space-y-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {timelineItems.length > 0 ? (
          timelineItems.map((item) => (
            <div key={item.id} className="relative space-y-1 text-xs">
              {/* node marker */}
              <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-accent bg-surface-base" />
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary font-mono text-[10px]">
                  {item.iteration}
                </span>
                <span className="text-[9px] font-bold font-mono text-accent uppercase bg-accent/15 px-1 rounded border border-accent/30">
                  {item.label}
                </span>
              </div>
              <p className="text-[10px] text-text-secondary leading-relaxed font-sans">
                {item.details}
              </p>
            </div>
          ))
        ) : (
          <div className="relative space-y-1 text-xs">
            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full border border-accent bg-surface-base" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary font-mono text-[10px]">
                {memory.iteration}
              </span>
              <span className="text-[9px] font-bold font-mono text-accent uppercase bg-accent/15 px-1 rounded border border-accent/30">
                Created
              </span>
            </div>
            <p className="text-[10px] text-text-secondary leading-relaxed font-sans">
              Memory initialized following {memory.sourceAgent} checks in sandbox workspace run.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
