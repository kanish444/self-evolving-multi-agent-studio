import React from 'react'

export interface PageHeaderProps {
  title: string
  description?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, badge, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5 mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl sm:text-[26px] font-bold text-text-primary tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {description && (
          <p className="text-xs sm:text-[13px] text-text-secondary leading-relaxed max-w-3xl font-sans">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-shrink-0">{actions}</div>}
    </div>
  )
}
