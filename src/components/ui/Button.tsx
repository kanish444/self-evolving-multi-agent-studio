import React, { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'system' | 'success'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl border cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#B3441E]/30 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 select-none font-sans'
    
    const variants = {
      primary: 'bg-[#B3441E] hover:bg-[#8F3517] text-white border-[rgba(179,68,30,0.4)] shadow-[0_0_15px_rgba(179,68,30,0.3)] hover:shadow-[0_0_20px_rgba(179,68,30,0.45)]',
      system: 'bg-[rgba(184,134,11,0.15)] hover:bg-[rgba(184,134,11,0.25)] text-system border-[rgba(184,134,11,0.35)] shadow-[0_0_12px_rgba(184,134,11,0.15)]',
      success: 'bg-[rgba(22,163,74,0.15)] hover:bg-[rgba(22,163,74,0.25)] text-success border-[rgba(22,163,74,0.35)] shadow-[0_0_12px_rgba(22,163,74,0.15)]',
      secondary: 'bg-surface-secondary hover:bg-surface-elevated text-text-primary border-border hover:border-[#453228]',
      outline: 'bg-transparent hover:bg-surface-secondary text-text-secondary hover:text-text-primary border-border hover:border-[#453228]',
      ghost: 'bg-transparent hover:bg-surface-secondary text-text-secondary hover:text-text-primary border-transparent',
      danger: 'bg-[rgba(225, 29, 72, 0.15)] hover:bg-[rgba(225, 29, 72, 0.25)] text-error border-[rgba(225, 29, 72, 0.35)] shadow-[0_0_12px_rgba(225, 29, 72, 0.15)]',
    }

    const sizes = {
      xs: 'px-2.5 py-1 text-xs gap-1.5',
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-sm gap-2.5',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  icon: React.ReactNode
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className = '', variant = 'ghost', size = 'sm', icon, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl border cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#B3441E]/30 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none'
    
    const variants = {
      primary: 'bg-[#B3441E] hover:bg-[#8F3517] text-white border-[rgba(179,68,30,0.4)] shadow-[0_0_15px_rgba(179,68,30,0.3)]',
      secondary: 'bg-surface-secondary hover:bg-surface-elevated text-text-primary border-border',
      outline: 'bg-transparent hover:bg-surface-secondary text-text-secondary hover:text-text-primary border-border hover:border-[#453228]',
      ghost: 'bg-transparent hover:bg-surface-secondary text-text-secondary hover:text-text-primary border-transparent',
      danger: 'bg-[rgba(225, 29, 72, 0.15)] hover:bg-[rgba(225, 29, 72, 0.25)] text-error border-[rgba(225, 29, 72, 0.35)]',
    }

    const sizes = {
      xs: 'p-1 text-xs w-6 h-6',
      sm: 'p-1.5 text-xs w-8 h-8',
      md: 'p-2 text-sm w-9 h-9',
      lg: 'p-2.5 text-sm w-10 h-10',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
