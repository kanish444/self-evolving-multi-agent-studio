import React, { forwardRef } from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padded?: boolean
  variant?: 'default' | 'elevated' | 'bordered' | 'glass' | 'glow'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = false, padded = true, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-surface border border-border shadow-command-card',
      elevated: 'bg-surface-secondary border border-border shadow-command-card',
      bordered: 'bg-surface border border-[rgba(179,68,30,0.35)] shadow-command-card',
      glow: 'bg-surface border border-[rgba(179,68,30,0.45)] shadow-command-glow',
      glass: 'bg-surface/90 backdrop-blur-md border border-border shadow-command-card',
    }

    return (
      <div
        ref={ref}
        className={`rounded-2xl transition-all duration-160 ${variantStyles[variant]} ${
          hoverable ? 'card-interactive hover:border-[#453228] cursor-pointer' : ''
        } ${padded ? 'p-6' : ''} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
