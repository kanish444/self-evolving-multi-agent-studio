/* eslint-disable react/set-state-in-effect */
import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import type { Memory, MemoryType, MemoryImportance, MemoryStatus } from '../mockData'

interface EditMemoryModalProps {
  isOpen: boolean
  onClose: () => void
  memory: Memory | null
  onSave: (updatedMemory: Memory) => void
}

export const EditMemoryModal: React.FC<EditMemoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  onSave,
}) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<MemoryType>('Agent Learning')
  const [description, setDescription] = useState('')
  const [learning, setLearning] = useState('')
  const [importance, setImportance] = useState<MemoryImportance>('High')
  const [confidence, setConfidence] = useState(90)
  const [tagsInput, setTagsInput] = useState('')
  const [status, setStatus] = useState<MemoryStatus>('Verified')

  useEffect(() => {
    if (memory) {
      setTitle(memory.title)
      setType(memory.type)
      setDescription(memory.description)
      setLearning(memory.learning)
      setImportance(memory.importance)
      setConfidence(memory.confidence)
      setTagsInput(memory.tags.join(', '))
      setStatus(memory.status)
    }
  }, [memory, isOpen])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!memory) return
    if (!title.trim() || !description.trim() || !learning.trim()) return

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '')

    onSave({
      ...memory,
      title: title.trim(),
      type,
      description: description.trim(),
      learning: learning.trim(),
      confidence,
      importance,
      tags: parsedTags,
      status,
      updatedAt: new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }),
    })

    onClose()
  }

  const typeOptions: MemoryType[] = [
    'Project Knowledge',
    'Agent Learning',
    'Error Pattern',
    'Successful Pattern',
    'Workflow Knowledge',
    'Coding Pattern',
    'Architecture Knowledge',
  ]

  const importanceOptions: MemoryImportance[] = ['Critical', 'High', 'Medium', 'Low']
  const statusOptions: MemoryStatus[] = ['Active', 'Verified', 'Needs Review', 'Archived']

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Cognitive Memory Node" size="md">
      <form onSubmit={handleSave} className="space-y-4 font-sans text-xs">
        {/* Title */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
            Memory Title
          </label>
          <Input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xs font-mono h-8"
          />
        </div>

        {/* Type & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
              Memory Category Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MemoryType)}
              className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
              Status Code
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MemoryStatus)}
              className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
            Description
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface border border-border rounded p-2.5 text-xs font-sans focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Rule / Learning statement */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
            Extracted Rule / Learning Statement
          </label>
          <Input
            type="text"
            required
            value={learning}
            onChange={(e) => setLearning(e.target.value)}
            className="text-xs font-mono h-8"
          />
        </div>

        {/* Importance & Confidence */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
              Importance Rating
            </label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as MemoryImportance)}
              className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {importanceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Confidence Level
              </label>
              <span className="font-mono text-accent font-bold">{confidence}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer h-2 bg-surface-secondary border border-border rounded-lg appearance-none mt-2"
            />
          </div>
        </div>

        {/* Tags Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
            Tags (Comma separated)
          </label>
          <Input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="text-xs font-mono h-8"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2.5 pt-3.5 border-t border-border/60">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
