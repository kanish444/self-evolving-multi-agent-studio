import React, { useState, useRef, useEffect } from 'react'

export interface DropdownItem {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
  danger?: boolean
  active?: boolean
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-56 rounded-2xl bg-surface border border-border shadow-command-modal z-50 p-1.5 select-none animate-in fade-in-50 zoom-in-95 duration-150`}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={`div-${index}`} className="my-1 border-t border-border" />
            }

            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => {
                  if (item.onClick) item.onClick()
                  setIsOpen(false)
                }}
                className={`w-full text-left flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none rounded-xl ${
                  item.disabled
                    ? 'text-text-muted'
                    : item.active
                    ? 'bg-accent/15 text-accent font-semibold border border-accent/30 shadow-xs'
                    : item.danger
                    ? 'text-error hover:bg-[rgba(225, 29, 72, 0.15)]'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon && <span className="w-4 h-4 flex items-center justify-center text-current flex-shrink-0">{item.icon}</span>}
                  <span className="font-medium font-sans truncate">{item.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
