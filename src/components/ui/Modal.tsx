import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-3xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        className={`relative w-full ${sizeClasses[size]} bg-surface border border-border rounded-2xl shadow-command-modal overflow-hidden z-10 transition-all animate-in fade-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between p-6 border-b border-border bg-surface">
            <div>
              {title && <h3 className="font-display text-base font-bold text-text-primary">{title}</h3>}
              {description && <p className="text-xs text-text-secondary mt-1 font-sans">{description}</p>}
            </div>
            <IconButton
              icon={<X className="w-4 h-4 text-text-secondary hover:text-text-primary" />}
              aria-label="Close modal"
              onClick={onClose}
              variant="ghost"
              size="sm"
            />
          </div>
        )}

        {/* Content Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
