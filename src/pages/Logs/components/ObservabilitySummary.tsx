import React from 'react'
import {
  Activity,
  CheckCircle2,
  Info,
  AlertTriangle,
  XCircle,
  Cpu,
  GitBranch
} from 'lucide-react'

interface ObservabilitySummaryProps {
  total: number
  success: number
  info: number
  warnings: number
  errors: number
  activeAgents: number
  iteration: string
}

export const ObservabilitySummary: React.FC<ObservabilitySummaryProps> = ({
  total,
  success,
  info,
  warnings,
  errors,
  activeAgents,
  iteration,
}) => {
  const stats = [
    {
      label: 'TOTAL EVENTS',
      value: total.toLocaleString(),
      icon: <Activity className="w-3.5 h-3.5 text-accent" />,
      color: 'text-text-primary',
    },
    {
      label: 'SUCCESS',
      value: success,
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-success" />,
      color: 'text-success',
    },
    {
      label: 'INFO',
      value: info,
      icon: <Info className="w-3.5 h-3.5 text-system" />,
      color: 'text-system',
    },
    {
      label: 'WARNINGS',
      value: warnings,
      icon: <AlertTriangle className="w-3.5 h-3.5 text-warning" />,
      color: 'text-warning',
    },
    {
      label: 'ERRORS',
      value: errors,
      icon: <XCircle className="w-3.5 h-3.5 text-error" />,
      color: 'text-error',
    },
    {
      label: 'ACTIVE AGENTS',
      value: String(activeAgents).padStart(2, '0'),
      icon: <Cpu className="w-3.5 h-3.5 text-accent" />,
      color: 'text-accent',
    },
    {
      label: 'ACTIVE ITERATION',
      value: iteration,
      icon: <GitBranch className="w-3.5 h-3.5 text-text-muted" />,
      color: 'text-text-secondary',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 select-none">
      {stats.map((st) => (
        <div
          key={st.label}
          className="bg-surface-elevated border border-border p-3 rounded-lg flex items-center gap-2.5 transition-all hover:border-accent/40 shadow-xs"
        >
          <div className="p-1.5 bg-surface rounded-md border border-border flex-shrink-0">
            {st.icon}
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider font-mono block truncate">
              {st.label}
            </span>
            <span className={`text-sm font-bold font-mono mt-0.5 block leading-none ${st.color}`}>
              {st.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
