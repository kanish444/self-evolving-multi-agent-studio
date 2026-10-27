import React, { useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import type { MemoryType, MemoryImportance } from '../mockData'

interface AddMemoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newMemory: {
    title: string
    type: MemoryType
    description: string
    learning: string
    sourceAgent: string
    project: string
    iteration: string
    importance: MemoryImportance
    confidence: number
    tags: string[]
    relatedFailures: string[]
    relatedTask?: string
  }) => void
}

export const AddMemoryModal: React.FC<AddMemoryModalProps> = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<MemoryType>('Agent Learning')
  const [description, setDescription] = useState('')
  const [learning, setLearning] = useState('')
  const [sourceAgent, setSourceAgent] = useState('Evolution')
  const [project, setProject] = useState('Student Management System')
  const [iteration, setIteration] = useState('Iteration 03')
  const [importance, setImportance] = useState<MemoryImportance>('High')
  const [confidence, setConfidence] = useState(90)
  const [tagsInput, setTagsInput] = useState('')
  const [relatedFailure, setRelatedFailure] = useState('')
  const [relatedTask, setRelatedTask] = useState('')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !learning.trim()) return

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t !== '')

    const failuresArray = relatedFailure.trim() ? [relatedFailure.trim()] : []

    onSave({
      title: title.trim(),
      type,
      description: description.trim(),
      learning: learning.trim(),
      sourceAgent,
      project,
      iteration,
      confidence,
      importance,
      tags: parsedTags,
      relatedFailures: failuresArray,
      relatedTask: relatedTask.trim(),
    })

    // Reset inputs
    setTitle('')
    setType('Agent Learning')
    setDescription('')
    setLearning('')
    setSourceAgent('Evolution')
    setProject('Student Management System')
    setIteration('Iteration 03')
    setImportance('High')
    setConfidence(90)
    setTagsInput('')
    setRelatedFailure('')
    setRelatedTask('')
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

  const agentOptions = [
    'Project Manager',
    'Architect',
    'Developer',
    'Tester',
    'Code Reviewer',
    'Debugger',
    'Evolution',
  ]

  const projectOptions = ['Student Management System', 'Other Projects']
  const iterationOptions = ['Iteration 01', 'Iteration 02', 'Iteration 03']
  const importanceOptions: MemoryImportance[] = ['Critical', 'High', 'Medium', 'Low']

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Cognitive Memory Node" size="md">
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
            placeholder="e.g. Enforce schema uniqueness before SQL insertion statements"
            className="text-xs font-mono h-8"
          />
        </div>

        {/* Type & Source Agent */}
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
              Source Agent
            </label>
            <select
              value={sourceAgent}
              onChange={(e) => setSourceAgent(e.target.value)}
              className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {agentOptions.map((opt) => (
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
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the observation background..."
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
            placeholder="e.g. Database validation should occur before CRUD generation."
            className="text-xs font-mono h-8"
          />
        </div>

        {/* Project & Iteration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
              Project Domain
            </label>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {projectOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
              Iteration Origin
            </label>
            <select
              value={iteration}
              onChange={(e) => setIteration(e.target.value)}
              className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {iterationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
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

        {/* Related Failure & Related Task */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
              Related Test/Code Failure
            </label>
            <Input
              type="text"
              value={relatedFailure}
              onChange={(e) => setRelatedFailure(e.target.value)}
              placeholder="e.g. Duplicate index key failure"
              className="text-xs font-mono h-8"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono block">
              Related Task Name
            </label>
            <Input
              type="text"
              value={relatedTask}
              onChange={(e) => setRelatedTask(e.target.value)}
              placeholder="e.g. Scaffolding Student models"
              className="text-xs font-mono h-8"
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
            placeholder="database, validation, crud"
            className="text-xs font-mono h-8"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2.5 pt-3.5 border-t border-border/60">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Save Memory
          </Button>
        </div>
      </form>
    </Modal>
  )
}
