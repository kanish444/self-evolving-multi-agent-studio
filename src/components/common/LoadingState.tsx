import React from 'react'

export interface LoadingStateProps {
  rows?: number
  variant?: 'list' | 'card' | 'spinner'
}

export const LoadingState: React.FC<LoadingStateProps> = ({ rows = 3, variant = 'list' }) => {
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center p-12 w-full">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-[rgba(179,68,30,0.2)] border-t-[#B3441E]" />
        <span className="text-xs text-text-muted font-medium mt-3">Loading studio data...</span>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 shadow-command-card space-y-3">
            <div className="h-4 bg-surface-secondary animate-pulse rounded-md w-1/3" />
            <div className="h-3 bg-surface-secondary animate-pulse rounded-md w-full" />
            <div className="h-3 bg-surface-secondary animate-pulse rounded-md w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center justify-between shadow-command-card">
          <div className="space-y-2 flex-1 mr-4">
            <div className="h-4 bg-surface-secondary animate-pulse rounded-md w-1/4" />
            <div className="h-3 bg-surface-secondary animate-pulse rounded-md w-1/2" />
          </div>
          <div className="h-7 bg-surface-secondary animate-pulse rounded-lg w-16" />
        </div>
      ))}
    </div>
  )
}
