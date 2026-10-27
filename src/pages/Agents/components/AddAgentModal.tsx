import React, { useState } from 'react'
import { X, Plus, Sparkles } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import type { Agent } from '../mockData'

interface AddAgentModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateAgent: (agentData: Partial<Agent>) => void
}

export const AddAgentModal: React.FC<AddAgentModalProps> = ({
  isOpen,
  onClose,
  onCreateAgent
}) => {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Agent['category']>('Development')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('Gemini 3.5 Flash')
  const [tools, setTools] = useState('Code Editor, Terminal')
  const [isEnabled, setIsEnabled] = useState(true)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    // Create partial mock agent data
    const newAgent: Partial<Agent> = {
      id: `agent_${Date.now()}`,
      name: `${name} Agent`,
      role: description || `Provides automated ${category.toLowerCase()} capabilities.`,
      description: description || `Custom agent specialized in ${category.toLowerCase()}.`,
      category: category,
      status: isEnabled ? 'IDLE' : 'WAITING',
      currentTask: 'Idle',
      tasksCompleted: 0,
      successRate: 100,
      lastActive: new Date().toTimeString().split(' ')[0],
      model: model,
      progress: 0,
      subtasks: [
        { id: 1, title: 'Analyze environment configuration', status: 'pending' }
      ],
      recentActivity: [
        { time: new Date().toTimeString().split(' ')[0], action: 'Agent registered and initialized' }
      ],
      performance: {
        tasks: 0,
        completed: 0,
        failed: 0,
        successRate: 100,
        avgExecTime: '0s'
      }
    }

    onCreateAgent(newAgent)
    
    // Reset form
    setName('')
    setCategory('Development')
    setDescription('')
    setModel('Gemini 3.5 Flash')
    setTools('Code Editor, Terminal')
    setIsEnabled(true)
    
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog Container */}
      <form 
        onSubmit={handleSubmit}
        className="relative bg-surface w-full max-w-md mx-auto rounded-2xl border border-border shadow-command-modal flex flex-col max-h-[90vh] overflow-hidden animate-page-enter"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-border bg-surface-secondary flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[rgba(179, 68, 30, 0.15)] border border-[rgba(179, 68, 30, 0.3)] rounded-lg text-accent">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-text-primary font-display">Create Operational Agent</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-surface-elevated rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form Fields */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs">
          
          {/* Agent Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary block font-sans">
              Agent Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. QualityAudit, SecurityScanner"
              className="w-full h-9 px-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono text-xs"
            />
          </div>

          {/* Role Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary block font-sans">
              Workflow Role Group
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as Agent['category'])}
              className="w-full h-9 px-3 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono text-xs cursor-pointer"
            >
              <option value="Planning" className="bg-surface text-text-primary">Planning</option>
              <option value="Architecture" className="bg-surface text-text-primary">Architecture</option>
              <option value="Development" className="bg-surface text-text-primary">Development</option>
              <option value="Testing" className="bg-surface text-text-primary">Testing</option>
              <option value="Review" className="bg-surface text-text-primary">Review</option>
              <option value="Debugging" className="bg-surface text-text-primary">Debugging</option>
              <option value="Evolution" className="bg-surface text-text-primary">Evolution</option>
            </select>
          </div>

          {/* Model selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary block font-sans">
              Target Language Model
            </label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full h-9 px-3 bg-surface-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono text-xs cursor-pointer"
            >
              <option value="Gemini 3.5 Flash" className="bg-surface text-text-primary">Gemini 3.5 Flash (Default)</option>
              <option value="Gemini 3.5 Pro" className="bg-surface text-text-primary">Gemini 3.5 Pro (Recommended for reasoning)</option>
              <option value="Gemini Ultra" className="bg-surface text-text-primary">Gemini Ultra (High capacity)</option>
            </select>
          </div>

          {/* Tools input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary block font-sans">
              Tool Capabilities
            </label>
            <input
              type="text"
              value={tools}
              onChange={e => setTools(e.target.value)}
              placeholder="e.g. Code Editor, Terminal, Web Search"
              className="w-full h-9 px-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary block font-sans">
              Task Mandate / Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Write a clear functional instruction set or responsibility profile..."
              className="w-full h-20 p-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-sans text-xs resize-none"
            />
          </div>

          {/* Enabled Switch */}
          <div className="flex items-center justify-between p-3.5 bg-surface-secondary rounded-xl border border-border">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-text-primary font-sans">
                Agent Initialization State
              </span>
              <span className="text-[10px] text-text-muted mt-0.5 font-mono">
                Should the agent launch in IDLE status immediately?
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={e => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-surface-secondary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
            </label>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-border bg-surface-secondary flex justify-end gap-2.5 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Create Agent
          </Button>
        </div>
      </form>
    </div>
  )
}
