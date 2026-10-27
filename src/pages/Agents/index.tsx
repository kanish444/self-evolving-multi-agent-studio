import { useState, useEffect, useCallback } from 'react'
import {
  Bot,
  Layers,
  Cpu,
  Shield,
  Terminal
} from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { agentsApi, type Agent } from '../../services/api/agents'
import { tasksApi, type Task } from '../../services/api/tasks'
import { settingsApi, type AIConfig } from '../../services/api/settings'

export default function Agents() {
  const { activeProject, activeProjectId } = useProject()
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string>('Developer')

  const loadData = useCallback(async () => {
    if (!activeProjectId) return
    try {
      const [agentList, taskList, config] = await Promise.allSettled([
        agentsApi.list(),
        tasksApi.list(activeProjectId),
        settingsApi.getAIConfig()
      ])

      if (agentList.status === 'fulfilled') setAgents(agentList.value || [])
      if (taskList.status === 'fulfilled') setTasks(taskList.value || [])
      if (config.status === 'fulfilled') setAiConfig(config.value)
    } catch (err) {
      console.warn('Failed to load AI team data:', err)
    }
  }, [activeProjectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!activeProject) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-[#0B0F19]">
        <Layers className="w-12 h-12 text-slate-500 mb-3" />
        <h2 className="text-lg font-semibold text-slate-200">No Active Project Selected</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          Select or create a project from the Projects tab to inspect and assign your AI engineering team.
        </p>
      </div>
    )
  }

  // Parse assigned roles from project architecture plan
  let assignedRoles: string[] = ['Architect', 'Developer', 'Tester']
  if (activeProject.architecture_plan) {
    try {
      const plan = JSON.parse(activeProject.architecture_plan)
      if (Array.isArray(plan.agent_roles) && plan.agent_roles.length > 0) {
        assignedRoles = plan.agent_roles
      }
    } catch {}
  }

  const selectedAgent = agents.find(a => a.id.toLowerCase() === selectedAgentId.toLowerCase() || a.name.toLowerCase().includes(selectedAgentId.toLowerCase())) || agents[0]

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] overflow-hidden">
      {/* Header Bar */}
      <div className="bg-[#111827] border-b border-[#1F2937] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-100">AI Team</h1>
            <span className="text-xs text-slate-400 font-mono">({activeProject.name})</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Project-specific agent responsibilities, task status, handoffs, and model assignments.
          </p>
        </div>

        {/* Model Provider Info Badge */}
        {aiConfig && (
          <div className="flex items-center gap-2 bg-[#0A0F1D] border border-[#1F2937] px-3 py-1.5 rounded-lg text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Model:</span>
            <span className="text-slate-200 font-semibold">{aiConfig.model}</span>
            <span className={`w-2 h-2 rounded-full ${aiConfig.is_api_key_configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-[10px] text-slate-400 font-sans">
              {aiConfig.is_api_key_configured ? 'Live' : 'Setup Required'}
            </span>
          </div>
        )}
      </div>

      {/* Actionable Setup Required Banner */}
      {aiConfig && !aiConfig.is_api_key_configured && (
        <div className="bg-amber-950/20 border-b border-amber-800/40 px-6 py-2 flex items-center justify-between text-xs text-amber-300 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-200">Setup Required:</span>
            <span>AI Provider API key is not configured. Team agents operate with deterministic scaffolding until key is set.</span>
          </div>
          <a href="/settings" className="font-medium text-blue-400 hover:text-blue-300 underline">
            Configure in Settings &rarr;
          </a>
        </div>
      )}

      {/* Main Grid Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Implemented Agent Roles */}
        <div className="w-80 bg-[#0A0F1D] border-r border-[#1F2937] flex flex-col flex-shrink-0">
          <div className="p-3.5 border-b border-[#1F2937] flex items-center justify-between bg-[#111827]">
            <span className="text-xs font-semibold text-slate-200 tracking-wider">AVAILABLE AGENTS</span>
            <span className="text-[11px] font-mono text-slate-500">{agents.length} roles</span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar">
            {agents.map(agent => {
              const isAssigned = assignedRoles.some(r => r.toLowerCase() === agent.name.toLowerCase() || r.toLowerCase() === agent.id.toLowerCase())
              const isSelected = selectedAgent && selectedAgent.id === agent.id

              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500 text-slate-100'
                      : 'bg-[#111827] border-[#1F2937] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0A0F1D] border border-[#1F2937] flex items-center justify-center text-blue-400">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold leading-tight">{agent.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{agent.role}</span>
                      </div>
                    </div>

                    {isAssigned && (
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        Assigned
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {agent.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Center: Selected Agent Details, Assigned Tasks & Handoffs */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-6 space-y-6">
          {selectedAgent && (
            <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-100">{selectedAgent.name}</h2>
                    <span className="text-xs text-slate-400 font-mono">Role: {selectedAgent.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Status:</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                    {selectedAgent.status || 'READY'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                {selectedAgent.description}
              </p>
            </div>
          )}

          {/* Current Tasks for this Agent / Project */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1F2937]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Project Tasks ({tasks.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Real execution queue</span>
            </div>

            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No tasks currently registered for this project. Approving the architecture plan assigns tasks to agents.
                </div>
              ) : (
                tasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-[#0A0F1D] border border-[#1F2937] rounded-lg p-3.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-100">{task.title}</span>
                        <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                          {task.agent_role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{task.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border uppercase ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : task.status === 'RUNNING'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Workflow Handoff Integrity Policy */}
          <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2 text-slate-200 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Handoff Integrity & Evidence Architecture</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every agent handoff persists structured requirements, acceptance criteria, file diffs, and execution evidence.
              Outputs derive from this project's requirements and real workspace files. Model self-improvement and rules are verified against real pytest outcomes before adoption.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
