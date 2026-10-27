import React from 'react'
import { FolderOpen } from 'lucide-react'

export interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <FolderOpen className="w-7 h-7 text-text-muted" />,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed border-border rounded-2xl bg-surface min-h-[240px] shadow-command-card">
      <div className="p-3 bg-surface-secondary rounded-xl border border-border mb-3.5">
        {icon}
      </div>
      <h3 className="font-display text-sm font-bold text-text-primary">{title}</h3>
      <p className="text-xs text-text-secondary mt-1 max-w-sm leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
