import React from 'react'
import { Card } from '../../../components/ui/Card'
import {
  Bot,
  FileCode,
  ListTodo,
  CheckCircle,
  Activity,
  Zap,
  TrendingUp,
  Percent,
  Timer
} from 'lucide-react'

interface MetricsPanelProps {
  onFilterAgent: (agentName: string) => void
  onFilterTask: (taskName: string) => void
  onFilterFile: (fileName: string) => void
  onFilterHealth: (service: string) => void
  selectedAgentFilter: string | null
  selectedTaskFilter: string | null
  selectedFileFilter: string | null
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  onFilterAgent,
  onFilterTask,
  onFilterFile,
  onFilterHealth,
  selectedAgentFilter,
  selectedTaskFilter,
  selectedFileFilter,
}) => {
  // Event statistics by agent
  const agentActivity = [
    { name: 'Project Manager', count: 245, color: 'text-text-primary' },
    { name: 'Architect', count: 182, color: 'text-accent' },
    { name: 'Developer', count: 245, color: 'text-accent' },
    { name: 'Tester', count: 198, color: 'text-accent-secondary' },
    { name: 'Code Reviewer', count: 103, color: 'text-text-secondary' },
    { name: 'Debugger', count: 92, color: 'text-error' },
    { name: 'Evolution Agent', count: 73, color: 'text-accent' },
    { name: 'Memory System', count: 61, color: 'text-success' },
  ]

  // Top tasks list
  const taskActivity = [
    { name: 'Student CRUD API', count: 15 },
    { name: 'Authentication Testing', count: 12 },
    { name: 'Bulk Student Upload', count: 11 },
    { name: 'Database Models scaffolding', count: 8 },
    { name: 'Linter Integration', count: 4 },
  ]

  // Top active source code files
  const fileActivity = [
    { name: 'StudentController.py', count: 18 },
    { name: 'Student.py', count: 12 },
    { name: 'database.py', count: 9 },
    { name: 'student_routes.py', count: 7 },
  ]

  // System Health details showing simulated ONLINE/OFFLINE statuses
  const systemHealth = [
    { name: 'Frontend Control Console', status: 'ONLINE', details: 'Vite Production Port', color: 'bg-emerald-500 text-emerald-700' },
    { name: 'Agent Orchestrator Node', status: 'MOCK ONLINE', details: 'Local thread pooling active', color: 'bg-emerald-500/80 text-emerald-700' },
    { name: 'Test Runner sandbox', status: 'MOCK ONLINE', details: 'Integration subshells ready', color: 'bg-emerald-500/80 text-emerald-700' },
    { name: 'Memory Vector Node', status: 'MOCK ONLINE', details: 'SQLite backend cache active', color: 'bg-emerald-500/80 text-emerald-700' },
    { name: 'Sandbox Environment', status: 'MOCK READY', details: 'Isolated compilation files', color: 'bg-sky-500 text-sky-700' },
    { name: 'LLM Connection API', status: 'NOT CONNECTED', details: 'API keys missing / offline', color: 'bg-slate-400 text-slate-700' },
  ]

  // General simulated telemetry metrics
  const telemetryMetrics = [
    { label: 'Event Rate', value: '18/min', icon: <Zap className="w-3.5 h-3.5 text-accent" /> },
    { label: 'Avg Task Time', value: '2m 14s', icon: <Timer className="w-3.5 h-3.5 text-indigo-400" /> },
    { label: 'Error Rate', value: '2.2%', icon: <Percent className="w-3.5 h-3.5 text-rose-400" /> },
    { label: 'Success Rate', value: '94%', icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Agent Activity list */}
      <Card className="p-4 border border-border shadow-command-card space-y-3.5 lg:col-span-1">
        <div className="flex items-center gap-1.5 border-b border-border pb-2">
          <Bot className="w-4 h-4 text-accent" />
          <h4 className="text-[11px] font-bold text-text-primary uppercase tracking-wider font-mono">Agent Activity</h4>
        </div>
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-0.5">
          {agentActivity.map((ag) => {
            const isActive = selectedAgentFilter === ag.name
            return (
              <button
                key={ag.name}
                onClick={() => onFilterAgent(ag.name)}
                className={`w-full flex items-center justify-between text-[10px] p-1.5 border rounded-md transition-all cursor-pointer ${
                  isActive
                    ? 'border-accent bg-accent/15 font-bold'
                    : 'border-border bg-surface-secondary hover:bg-surface-elevated hover:border-accent/40'
                }`}
              >
                <span className={`font-semibold truncate max-w-[100px] ${ag.color}`}>{ag.name}</span>
                <span className="font-mono text-text-secondary font-bold bg-surface-base px-1.5 py-0.2 rounded border border-border">
                  {ag.count} evts
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 2. Task Activity list */}
      <Card className="p-4 border border-border shadow-command-card space-y-3.5 lg:col-span-1">
        <div className="flex items-center gap-1.5 border-b border-border pb-2">
          <ListTodo className="w-4 h-4 text-accent" />
          <h4 className="text-[11px] font-bold text-text-primary uppercase tracking-wider font-mono">Task Activity</h4>
        </div>
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-0.5">
          {taskActivity.map((task) => {
            const isActive = selectedTaskFilter === task.name
            return (
              <button
                key={task.name}
                onClick={() => onFilterTask(task.name)}
                className={`w-full flex items-center justify-between text-[10px] p-1.5 border rounded-md transition-all cursor-pointer ${
                  isActive
                    ? 'border-accent bg-accent/15 font-bold'
                    : 'border-border bg-surface-secondary hover:bg-surface-elevated hover:border-accent/40'
                }`}
              >
                <span className="font-semibold truncate max-w-[110px] text-text-primary">{task.name}</span>
                <span className="font-mono text-text-secondary font-bold bg-surface-base px-1.5 py-0.2 rounded border border-border">
                  {task.count} evts
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 3. File Activity list */}
      <Card className="p-4 border border-border shadow-command-card space-y-3.5 lg:col-span-1">
        <div className="flex items-center gap-1.5 border-b border-border pb-2">
          <FileCode className="w-4 h-4 text-accent" />
          <h4 className="text-[11px] font-bold text-text-primary uppercase tracking-wider font-mono">Affected Files</h4>
        </div>
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-0.5">
          {fileActivity.map((file) => {
            const isActive = selectedFileFilter === file.name
            return (
              <button
                key={file.name}
                onClick={() => onFilterFile(file.name)}
                className={`w-full flex items-center justify-between text-[10px] p-1.5 border rounded-md transition-all cursor-pointer ${
                  isActive
                    ? 'border-accent bg-accent/15 font-bold'
                    : 'border-border bg-surface-secondary hover:bg-surface-elevated hover:border-accent/40'
                }`}
              >
                <span className="font-semibold truncate max-w-[110px] text-text-primary font-mono text-[9.5px]">{file.name}</span>
                <span className="font-mono text-text-secondary font-bold bg-surface-base px-1.5 py-0.2 rounded border border-border">
                  {file.count} evts
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* 4. System Health status */}
      <Card className="p-4 border border-border shadow-command-card space-y-3 lg:col-span-1">
        <div className="flex items-center gap-1.5 border-b border-border pb-2">
          <Activity className="w-4 h-4 text-accent animate-pulse" />
          <h4 className="text-[11px] font-bold text-text-primary uppercase tracking-wider font-mono">System Health</h4>
        </div>
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-0.5">
          {systemHealth.map((health) => (
            <div
              key={health.name}
              onClick={() => onFilterHealth(health.name)}
              className="flex flex-col p-1.5 border border-border rounded-md bg-surface-secondary cursor-pointer hover:bg-surface-elevated hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between text-[9.5px]">
                <span className="font-semibold text-text-primary truncate max-w-[100px]">{health.name}</span>
                <span className={`inline-block px-1 py-0.1 rounded text-[7.5px] font-bold font-mono bg-surface-base border border-border ${health.color}`}>
                  {health.status}
                </span>
              </div>
              <span className="text-[8px] text-text-muted mt-0.5 font-mono truncate">{health.details}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. System metrics & telemetry summary */}
      <Card className="p-4 border border-border shadow-command-card space-y-4 lg:col-span-1">
        <div className="flex items-center gap-1.5 border-b border-border pb-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h4 className="text-[11px] font-bold text-text-primary uppercase tracking-wider font-mono">Telemetry metrics</h4>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center select-none font-mono">
          {telemetryMetrics.map((met) => (
            <div key={met.label} className="p-2 border border-border rounded-md bg-surface-secondary flex flex-col justify-between min-h-[52px]">
              <span className="text-[7.5px] text-text-muted uppercase block leading-none">{met.label}</span>
              <div className="mt-1 flex items-center justify-center gap-0.5 font-bold">
                {met.icon}
                <span className="text-xs text-text-primary">{met.value}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="p-2 border border-accent/30 rounded-md bg-accent/10 text-[8.5px] leading-normal font-mono text-accent">
          * Telemetry benchmarks are simulated estimates representing execution averages.
        </div>
      </Card>
    </div>
  )
}
