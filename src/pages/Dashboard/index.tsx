import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  ArrowRight,
  Folder,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { projectsApi, type Project, type ArchitectPlanResponse } from '../../services/api/projects'

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, selectProject, refreshProjects } = useProject()

  // Idea input state
  const [ideaText, setIdeaText] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Create Project Modal state
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [showTechPrefs, setShowTechPrefs] = useState(false)
  const [techStack, setTechStack] = useState('')
  const [importRepo, setImportRepo] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Architect Consultation & Plan review modal state (after project creation)
  const [createdProject, setCreatedProject] = useState<Project | null>(null)
  const [isConsulting, setIsConsulting] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'architect'; text: string; error?: boolean }>>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [planData, setPlanData] = useState<ArchitectPlanResponse | null>(null)
  const [isPlanLoading, setIsPlanLoading] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [aiBlockedMsg, setAiBlockedMsg] = useState<string | null>(null)

  // Handle clicking the primary "New Project" button from idea area
  const handleInitiateNewProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = ideaText.trim()
    setProjectDescription(trimmed)
    if (trimmed && !projectName) {
      // Suggest project title from the first 4 words of idea
      const titleCandidate = trimmed
        .split(' ')
        .slice(0, 4)
        .join(' ')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
      setProjectName(titleCandidate.charAt(0).toUpperCase() + titleCandidate.slice(1))
    }
    setCreateError(null)
    setIsModalOpen(true)
  }

  // Handle project creation
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) {
      setCreateError('Project name is required.')
      return
    }

    setIsCreating(true)
    setCreateError(null)

    try {
      const requirementsText = techStack.trim() 
        ? `${projectDescription}\n\nTechnology Preferences: ${techStack.trim()}`
        : projectDescription

      const newProj = await projectsApi.create({
        name: projectName.trim(),
        description: projectDescription.trim(),
        requirements: requirementsText,
        repo_url: importRepo && repoUrl.trim() ? repoUrl.trim() : undefined
      })

      selectProject(newProj.id)
      await refreshProjects()
      setCreatedProject(newProj)
      setIsModalOpen(false)

      // Start Architect Consultation modal
      setIsConsulting(true)
      setChatMessages([
        {
          sender: 'architect',
          text: `Project "${newProj.name}" is saved. The Architect will now inspect your requirements and prepare a plan.`
        }
      ])

      // Automatically synthesize initial concrete plan
      generateArchitectPlan(newProj.id)
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project.')
    } finally {
      setIsCreating(false)
    }
  }

  // Chat with Architect
  const handleSendArchitectChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !createdProject) return

    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }])
    setChatInput('')
    setIsChatLoading(true)

    try {
      const res = await projectsApi.chatWithArchitect(createdProject.id, userMsg)
      setChatMessages(prev => [...prev, { sender: 'architect', text: res.reply }])
      setAiBlockedMsg(null)
    } catch (err: any) {
      const msg = err.message || 'AI provider request failed.'
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'architect',
          text: `Action Required: ${msg}. Configure your GEMINI_API_KEY in Settings to enable live AI architect conversation.`,
          error: true
        }
      ])
      setAiBlockedMsg(msg)
    } finally {
      setIsChatLoading(false)
    }
  }

  // Generate Plan
  const generateArchitectPlan = async (projectId: string) => {
    setIsPlanLoading(true)
    try {
      const plan = await projectsApi.architectPlan(projectId)
      setPlanData(plan)
    } catch (err: any) {
      setAiBlockedMsg(err instanceof Error ? err.message : 'Architecture generation failed')
    } finally {
      setIsPlanLoading(false)
    }
  }

  // Approve Plan & Start Building
  const handleApprovePlan = async () => {
    if (!createdProject) return
    setIsApproving(true)
    try {
      await projectsApi.grantPermissions(createdProject.id, [
        'FILES_READ_WRITE',
        'RUN_CODE_TESTS'
      ])
      await projectsApi.approvePlan(createdProject.id, ['Architect', 'Developer', 'Tester'], planData || undefined)
      await refreshProjects()
      setIsConsulting(false)
      // Navigate straight to the workspace editor
      navigate('/editor')
    } catch (err: any) {
      alert(err.message || 'Failed to approve plan.')
    } finally {
      setIsApproving(false)
    }
  }

  // Open existing project
  const handleOpenProject = (projectId: string) => {
    selectProject(projectId)
    navigate('/editor')
  }

  // Delete project
  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this project and its workspace?')) {
      return
    }
    try {
      await projectsApi.delete(projectId)
      await refreshProjects()
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.')
    }
  }

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Recently'
    }
  }

  // Status color helper
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase()
    if (s === 'READY' || s === 'VERIFIED') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">READY</span>
    }
    if (s === 'BUILDING' || s === 'DEVELOPMENT') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">BUILDING</span>
    }
    if (s === 'TESTING') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-[#15BDEB]/15 text-[#15BDEB] border border-[#15BDEB]/30">TESTING</span>
    }
    if (s === 'FIXING') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">FIXING</span>
    }
    if (s === 'WAITING_FOR_APPROVAL') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">PLAN AWAITING APPROVAL</span>
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-[#182630] text-[#A8B8C8] border border-[#263744]">{s}</span>
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D141B] text-[#EDF3F8] overflow-y-auto custom-scrollbar select-none">
      
      {/* Top Content Area */}
      <div className="max-w-4xl mx-auto w-full px-6 py-10 sm:py-14 space-y-10">
        
        {/* Main Heading & Supporting Copy */}
        <div className="space-y-2 text-left">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#EDF3F8] tracking-tight">
            Build your next idea
          </h1>
          <p className="text-sm text-[#A8B8C8] leading-relaxed">
            Describe what you want to build and start your AI engineering workflow.
          </p>
        </div>

        {/* Wide Idea Entry Box with Single Primary "New Project" Button */}
        <div className="bg-[#121D26] border border-[#263744] rounded-xl p-4 sm:p-5 shadow-sm focus-within:border-[#15BDEB] focus-within:ring-1 focus-within:ring-[#15BDEB] transition-all">
          <textarea
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleInitiateNewProject()
              }
            }}
            placeholder="What would you like to build?"
            rows={3}
            className="w-full bg-transparent text-[#EDF3F8] placeholder-[#788B9B] text-sm sm:text-base resize-none focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#263744]/70">
            <span className="text-xs text-[#788B9B] font-mono hidden sm:inline">
              Press Ctrl+Enter to start
            </span>

            <button
              type="button"
              onClick={handleInitiateNewProject}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-[#0878F9] hover:bg-[#15BDEB] text-white font-medium text-xs sm:text-sm rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15BDEB] focus:ring-offset-2 focus:ring-offset-[#121D26]"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Projects Section: Open sections and subtle dividers */}
        <section aria-label="Projects List" className="space-y-4 text-left pt-2">
          
          <div className="flex items-center justify-between pb-3 border-b border-[#263744]">
            <h2 className="font-display font-semibold text-lg text-[#EDF3F8]">
              Your Projects
            </h2>
            <span className="text-xs text-[#788B9B] font-mono">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          {/* Fresh Account Empty State */}
          {projects.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-lg bg-[#121D26] border border-[#263744] flex items-center justify-center mb-3 text-[#788B9B]">
                <FileText className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-semibold text-base text-[#EDF3F8]">
                Your projects start here
              </h3>
              <p className="text-xs text-[#788B9B] mt-1.5 max-w-sm leading-relaxed">
                Describe an idea above or create a project to collaborate with the Architect, Developer, and Tester agents.
              </p>
            </div>
          ) : (
            /* Existing Account Real Persisted Projects List with Subtle Dividers */
            <div className="divide-y divide-[#263744]">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleOpenProject(project.id)}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-[#121D26]/60 px-3 -mx-3 rounded-lg transition-colors cursor-pointer"
                >
                  {/* Left: Name, Description & Status */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2.5">
                      <Folder className="w-4 h-4 text-[#15BDEB] flex-shrink-0" strokeWidth={1.5} />
                      <span className="font-display font-semibold text-sm text-[#EDF3F8] group-hover:text-[#15BDEB] transition-colors truncate">
                        {project.name}
                      </span>
                      {getStatusBadge(project.status)}
                    </div>
                    
                    <p className="text-xs text-[#A8B8C8] line-clamp-1 pl-6">
                      {project.description || project.requirements || 'No description provided.'}
                    </p>
                  </div>

                  {/* Right: Updated Date & Open Action */}
                  <div className="flex items-center gap-4 pl-6 sm:pl-0 flex-shrink-0">
                    <span className="text-xs text-[#788B9B] font-mono">
                      {formatDate(project.updated_at || project.created_at)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenProject(project.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#182630] hover:bg-[#263744] text-[#EDF3F8] text-xs font-medium border border-[#263744] transition-colors"
                    >
                      <span>Open Project</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#15BDEB]" strokeWidth={1.5} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="p-1.5 text-[#788B9B] hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                      title="Delete project"
                      aria-label={`Delete project ${project.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </section>

      </div>

      {/* CREATE PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#121D26] border border-[#263744] rounded-xl max-w-lg w-full p-6 space-y-5 text-left shadow-2xl">
            <div className="space-y-1">
              <h2 className="font-display font-bold text-xl text-[#EDF3F8]">
                New Project
              </h2>
              <p className="text-xs text-[#A8B8C8]">
                Configure project metadata. Technology preferences are optional.
              </p>
            </div>

            {createError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              {/* Project Name (Required) */}
              <div>
                <label className="block text-xs font-medium text-[#EDF3F8] mb-1.5">
                  Project Name <span className="text-[#15BDEB]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. TaskFlow Studio"
                  className="w-full h-10 bg-[#0D141B] border border-[#263744] text-[#EDF3F8] placeholder-[#788B9B] text-xs sm:text-sm rounded-lg px-3.5 focus:outline-none focus:border-[#15BDEB] focus:ring-1 focus:ring-[#15BDEB]"
                />
              </div>

              {/* Project Description (Required) */}
              <div>
                <label className="block text-xs font-medium text-[#EDF3F8] mb-1.5">
                  Project Description <span className="text-[#15BDEB]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe key requirements, user goals, and features..."
                  className="w-full bg-[#0D141B] border border-[#263744] text-[#EDF3F8] placeholder-[#788B9B] text-xs sm:text-sm rounded-lg p-3 focus:outline-none focus:border-[#15BDEB] focus:ring-1 focus:ring-[#15BDEB] resize-none"
                />
              </div>

              {/* Optional Collapsed Technology Preferences */}
              <div className="border border-[#263744] rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTechPrefs(!showTechPrefs)}
                  className="w-full px-3.5 py-2.5 bg-[#182630]/60 flex items-center justify-between text-xs text-[#A8B8C8] hover:text-[#EDF3F8] transition-colors"
                >
                  <span>Technology Preferences (Optional)</span>
                  {showTechPrefs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showTechPrefs && (
                  <div className="p-3.5 bg-[#0D141B] space-y-3 border-t border-[#263744]">
                    <div>
                      <label className="block text-[11px] text-[#A8B8C8] mb-1">
                        Framework or Stack Preference
                      </label>
                      <input
                        type="text"
                        value={techStack}
                        onChange={(e) => setTechStack(e.target.value)}
                        placeholder="e.g. React + FastAPI + SQLite"
                        className="w-full h-8 bg-[#121D26] border border-[#263744] text-[#EDF3F8] placeholder-[#788B9B] text-xs rounded px-2.5 focus:outline-none focus:border-[#15BDEB]"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[#A8B8C8]">
                        <input
                          type="checkbox"
                          checked={importRepo}
                          onChange={(e) => setImportRepo(e.target.checked)}
                          className="rounded border-[#263744] bg-[#121D26] text-[#15BDEB] focus:ring-0"
                        />
                        <span>Import existing repository (Optional)</span>
                      </label>
                      {importRepo && (
                        <input
                          type="text"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          placeholder="https://github.com/org/repo.git"
                          className="mt-2 w-full h-8 bg-[#121D26] border border-[#263744] text-[#EDF3F8] placeholder-[#788B9B] text-xs rounded px-2.5 focus:outline-none focus:border-[#15BDEB]"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#A8B8C8] hover:text-[#EDF3F8] rounded transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isCreating || !projectName.trim() || !projectDescription.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#0878F9] hover:bg-[#15BDEB] disabled:opacity-50 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Project...</span>
                    </>
                  ) : (
                    <span>Create & Consult Architect</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARCHITECT CONSULTATION & PLAN APPROVAL MODAL */}
      {isConsulting && createdProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#121D26] border border-[#263744] rounded-xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl text-left overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-[#263744] flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-[#EDF3F8]">
                  Architect Consultation: {createdProject.name}
                </h2>
                <p className="text-xs text-[#A8B8C8]">
                  Review architectural decisions, modules, and required resources.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConsulting(false)}
                className="text-xs text-[#788B9B] hover:text-[#EDF3F8]"
              >
                Skip to Editor
              </button>
            </div>

            {/* Provider Notice if AI Key is missing or failed */}
            {aiBlockedMsg && (
              <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>AI Provider: {aiBlockedMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/settings')}
                  className="inline-flex items-center gap-1 text-[11px] underline text-[#15BDEB] hover:text-white"
                >
                  <SettingsIcon className="w-3 h-3" />
                  <span>Configure Settings</span>
                </button>
              </div>
            )}

            {/* Content: Plan Summary & Chat messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              
              {/* Architecture Plan Box */}
              {isPlanLoading ? (
                <div className="p-4 bg-[#0D141B] border border-[#263744] rounded-lg flex items-center justify-center gap-2 text-xs text-[#A8B8C8]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#15BDEB]" />
                  <span>Generating concrete architectural plan...</span>
                </div>
              ) : planData ? (
                <div className="p-4 bg-[#0D141B] border border-[#263744] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-xs text-[#EDF3F8] uppercase tracking-wider">
                      Proposed Architecture Plan
                    </span>
                    <span className="text-[10px] font-mono text-[#15BDEB]">
                      {planData.is_live_ai ? 'LIVE AI PLAN' : 'DETERMINISTIC BLUEPRINT'}
                    </span>
                  </div>

                  <p className="text-xs text-[#A8B8C8] leading-relaxed">
                    {planData.architecture}
                  </p>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#EDF3F8]">Modules:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {planData.modules.map((m, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-[#182630] border border-[#263744] text-[#A8B8C8]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#EDF3F8]">Acceptance Criteria:</span>
                    <ul className="text-xs text-[#A8B8C8] space-y-1 list-disc pl-4">
                      {planData.acceptance_criteria.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {/* Chat Thread */}
              <div className="space-y-2.5">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#182630] text-[#EDF3F8] ml-8 border border-[#263744]'
                        : msg.error
                        ? 'bg-rose-500/10 text-rose-300 mr-8 border border-rose-500/20'
                        : 'bg-[#0D141B] text-[#A8B8C8] mr-8 border border-[#263744]'
                    }`}
                  >
                    <div className="font-mono text-[10px] text-[#788B9B] mb-1 uppercase">
                      {msg.sender === 'user' ? 'You' : 'Principal Architect'}
                    </div>
                    {msg.text}
                  </div>
                ))}
              </div>

            </div>

            {/* Chat Input & Bottom Actions */}
            <div className="p-4 border-t border-[#263744] bg-[#0D141B] space-y-3">
              <form onSubmit={handleSendArchitectChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask the Architect to clarify requirements or recommend options..."
                  className="flex-1 h-9 bg-[#121D26] border border-[#263744] text-[#EDF3F8] placeholder-[#788B9B] text-xs rounded px-3 focus:outline-none focus:border-[#15BDEB]"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-3.5 h-9 bg-[#182630] hover:bg-[#263744] text-[#EDF3F8] text-xs font-medium rounded border border-[#263744] transition-colors disabled:opacity-50"
                >
                  {isChatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Send</span>}
                </button>
              </form>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#788B9B] font-mono">
                  Assigned Agents: Architect, Developer, Tester
                </span>

                <button
                  type="button"
                  onClick={handleApprovePlan}
                  disabled={isApproving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0878F9] hover:bg-[#15BDEB] text-white font-medium text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scaffolding Workspace...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Plan & Launch Workspace</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
