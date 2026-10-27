import React, { useState, useMemo } from 'react'
import { Activity, Search, ShieldAlert, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import type { ActivityFeedItem } from '../mockData'

interface AgentActivityProps {
  activities: ActivityFeedItem[]
}

export const AgentActivity: React.FC<AgentActivityProps> = ({
  activities
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [agentFilter, setAgentFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')

  // Derive unique agent names for the select dropdown
  const uniqueAgents = useMemo(() => {
    const names = new Set(activities.map(act => act.agent))
    return ['All', ...Array.from(names)]
  }, [activities])

  // Filter logs based on inputs
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchSearch = act.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          act.agent.toLowerCase().includes(searchQuery.toLowerCase())
      const matchAgent = agentFilter === 'All' || act.agent === agentFilter
      const matchType = typeFilter === 'All' || act.type === typeFilter
      return matchSearch && matchAgent && matchType
    })
  }, [activities, searchQuery, agentFilter, typeFilter])

  const getLogIcon = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
      case 'error':
        return <ShieldAlert className="w-3.5 h-3.5 text-error flex-shrink-0 mt-0.5" />
      case 'info':
      default:
        return <Info className="w-3.5 h-3.5 text-accent-secondary flex-shrink-0 mt-0.5" />
    }
  }

  const getLogColor = (type: ActivityFeedItem['type']) => {
    switch (type) {
      case 'success': return 'text-text-primary'
      case 'warning': return 'text-warning'
      case 'error': return 'text-error font-semibold'
      case 'info':
      default:
        return 'text-text-secondary'
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col h-[350px] shadow-command-card select-none">
      {/* Header */}
      <div className="border-b border-border pb-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Live Agent Execution Stream
          </span>
        </div>
        <span className="text-[10px] font-mono bg-surface-secondary border border-border px-2.5 py-0.5 rounded-lg text-text-muted">
          {filteredActivities.length} events
        </span>
      </div>

      {/* Toolbar filters */}
      <div className="grid grid-cols-3 gap-2 my-3 flex-shrink-0">
        <div className="relative">
          <Search className="w-3 h-3 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search action..."
            className="w-full h-8 bg-surface-secondary border border-border rounded-xl text-[11px] pl-7 pr-2 focus:outline-none focus:border-accent text-text-primary font-mono placeholder:text-text-muted"
          />
        </div>

        <div className="relative">
          <select
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="w-full h-8 bg-surface-secondary border border-border rounded-xl text-[11px] px-2.5 text-accent focus:outline-none focus:border-accent font-mono cursor-pointer font-bold"
          >
            {uniqueAgents.map(agentName => (
              <option key={agentName} value={agentName} className="bg-surface text-text-primary">
                {agentName === 'All' ? 'All Agents' : agentName.replace(' Agent', '')}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full h-8 bg-surface-secondary border border-border rounded-xl text-[11px] px-2.5 text-accent focus:outline-none focus:border-accent font-mono cursor-pointer font-bold"
          >
            <option value="All" className="bg-surface text-text-primary">All Types</option>
            <option value="info" className="bg-surface text-text-primary">Info</option>
            <option value="success" className="bg-surface text-text-primary">Success</option>
            <option value="warning" className="bg-surface text-text-primary">Warning</option>
            <option value="error" className="bg-surface text-text-primary">Error</option>
          </select>
        </div>
      </div>

      {/* Log Feed List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 select-text bg-background p-3 rounded-xl border border-border">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-2.5 text-[11px] font-mono border-b border-border pb-2 last:border-0 last:pb-0"
            >
              {getLogIcon(act.type)}
              <div className="flex-1 leading-relaxed">
                <span className="text-text-muted mr-1.5 text-[10px]">[{act.time}]</span>
                <span className="text-text-primary font-bold mr-1.5">{act.agent.replace(' Agent', '')}:</span>
                <span className={getLogColor(act.type)}>{act.action}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-text-muted text-[11px] font-mono">
            No activity matches search query.
          </div>
        )}
      </div>
    </div>
  )
}
