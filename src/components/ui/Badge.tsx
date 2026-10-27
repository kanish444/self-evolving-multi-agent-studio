import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'primary' | 'ai' | 'system' | 'success' | 'warning' | 'error' | 'info'
  size?: 'xs' | 'sm' | 'md'
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'neutral',
  size = 'sm',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-lg border tracking-wide select-none font-mono transition-colors duration-150'
  
  const variants = {
    neutral: 'bg-surface-secondary text-text-secondary border-border',
    primary: 'bg-[rgba(179,68,30,0.14)] text-[#E8B4A0] border-[rgba(179,68,30,0.35)] font-semibold',
    ai: 'bg-[rgba(179,68,30,0.14)] text-[#E8B4A0] border-[rgba(179,68,30,0.4)] font-semibold shadow-[0_0_12px_rgba(179,68,30,0.2)]',
    system: 'bg-[rgba(184,134,11,0.14)] text-system border-[rgba(184,134,11,0.35)] font-semibold',
    success: 'bg-[rgba(22,163,74,0.14)] text-success border-[rgba(22,163,74,0.35)]',
    warning: 'bg-[rgba(217,119,6,0.14)] text-warning border-[rgba(217,119,6,0.35)]',
    error: 'bg-[rgba(225, 29, 72, 0.14)] text-error border-[rgba(225, 29, 72, 0.35)]',
    info: 'bg-[rgba(14,165,233,0.14)] text-[#0EA5E9] border-[rgba(14,165,233,0.35)]',
  }

  const sizes = {
    xs: 'px-1.5 py-0.2 text-[10px] tracking-wider uppercase',
    sm: 'px-2.5 py-0.5 text-[11px] tracking-wide',
    md: 'px-3 py-1 text-xs',
  }

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  )
}

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'success' | 'warning' | 'error' | 'info' | 'active' | 'inactive' | 'ai' | 'system'
  pulse?: boolean
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  className = '',
  status = 'active',
  pulse = false,
  ...props
}) => {
  const colors = {
    success: 'bg-success shadow-[0_0_8px_#16A34A]',
    warning: 'bg-[#D97706] shadow-[0_0_8px_#D97706]',
    error: 'bg-[#E11D48] shadow-[0_0_8px_#E11D48]',
    info: 'bg-[#0EA5E9] shadow-[0_0_8px_#0EA5E9]',
    active: 'bg-[#B3441E] shadow-[0_0_8px_#B3441E]',
    ai: 'bg-[#B3441E] shadow-[0_0_8px_#B3441E]',
    system: 'bg-system shadow-[0_0_8px_#B8860B]',
    inactive: 'bg-[#85756A]',
  }

  return (
    <span className={`inline-flex items-center justify-center flex-shrink-0 ${className}`} {...props}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[status]}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[status]}`}></span>
      </span>
    </span>
  )
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'success' | 'warning' | 'error' | 'info' | 'active' | 'inactive' | 'ai' | 'system'
  pulse?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  className = '',
  status = 'active',
  pulse = false,
  children,
  ...props
}) => {
  const variantMap = {
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
    active: 'primary',
    ai: 'ai',
    system: 'system',
    inactive: 'neutral',
  } as const

  const labelMap = {
    success: 'Operational',
    warning: 'Warning',
    error: 'Critical',
    info: 'Info',
    active: 'Active',
    ai: 'AI Active',
    system: 'System Live',
    inactive: 'Standby',
  }

  return (
    <Badge
      variant={variantMap[status]}
      size="sm"
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${className}`}
      {...props}
    >
      <StatusIndicator status={status} pulse={pulse} />
      <span>{children || labelMap[status]}</span>
    </Badge>
  )
}
