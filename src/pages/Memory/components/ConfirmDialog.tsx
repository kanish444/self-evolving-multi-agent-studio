import React from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4 font-sans text-xs">
        <div className="flex items-start gap-3 bg-rose-50/20 border border-rose-100 p-3 rounded-md">
          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="font-bold text-rose-800 uppercase tracking-wider font-mono text-[10px]">
              Destructive Action Warning
            </h4>
            <p className="text-text-secondary mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-border/40">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100 font-bold"
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}
