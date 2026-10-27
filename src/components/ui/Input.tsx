import React, { forwardRef } from 'react'
import { Search } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="w-full relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={`w-full bg-surface-secondary border border-border text-text-primary text-xs rounded-xl px-3.5 py-2.5 transition-all placeholder:text-text-muted focus:outline-none focus:border-[#B3441E] focus:ring-2 focus:ring-[#B3441E]/20 disabled:opacity-50 disabled:bg-surface disabled:cursor-not-allowed font-sans ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${error ? 'border-[#E11D48] focus:border-[#E11D48] focus:ring-[#E11D48]/20' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-text-muted">
            {rightIcon}
          </div>
        )}
        {error && <p className="mt-1.5 text-xs text-error font-mono">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export const CommandInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={ref}
          className={`w-full bg-surface-secondary hover:bg-surface-elevated focus:bg-surface-secondary border border-border focus:border-[#B3441E] text-text-primary text-xs rounded-xl pl-10 pr-14 py-2.5 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#B3441E]/20 transition-all font-sans ${className}`}
          placeholder="Search files, agents, commands... (Ctrl + K)"
          {...props}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="px-2 py-0.5 text-[10px] font-mono text-text-secondary bg-surface border border-border rounded-md shadow-xs">
            CTRL K
          </kbd>
        </div>
      </div>
    )
  }
)

CommandInput.displayName = 'CommandInput'

export const SearchInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => {
    return (
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
          <Search className="w-4 h-4" />
        </div>
        <input
          ref={ref}
          className={`w-full bg-surface-secondary border border-border text-text-primary text-xs rounded-xl pl-10 pr-3.5 py-2 placeholder:text-text-muted focus:outline-none focus:border-[#B3441E] focus:ring-2 focus:ring-[#B3441E]/20 transition-all font-sans ${className}`}
          {...props}
        />
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
