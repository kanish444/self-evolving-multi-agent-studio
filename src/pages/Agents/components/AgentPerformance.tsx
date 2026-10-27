import React from 'react'
import { Award } from 'lucide-react'
import type { Agent } from '../mockData'

interface AgentPerformanceProps {
  agents: Agent[]
}

export const AgentPerformance: React.FC<AgentPerformanceProps> = ({
  agents
}) => {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col h-[280px] shadow-command-card select-none">
      {/* Header */}
      <div className="border-b border-border pb-3 flex items-center gap-2 flex-shrink-0">
        <Award className="w-4 h-4 text-success" />
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Agent Performance Dashboard
        </span>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar mt-3">
        <table className="w-full text-left font-mono border-collapse">
          <thead>
            <tr className="border-b border-border text-[10px] text-text-muted uppercase">
              <th className="pb-2 font-semibold">Agent</th>
              <th className="pb-2 font-semibold text-center w-14">Tasks</th>
              <th className="pb-2 font-semibold w-24">Success Rate</th>
              <th className="pb-2 font-semibold text-right w-20">Avg Speed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-[11px] text-text-secondary">
            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-surface-secondary/60 transition-colors">
                <td className="py-2.5 font-semibold text-text-primary truncate max-w-[120px]" title={agent.name}>
                  {agent.name.replace(' Agent', '')}
                </td>
                <td className="py-2.5 text-center font-bold text-text-primary">
                  {agent.performance.tasks}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-text-primary w-8">
                      {agent.performance.successRate}%
                    </span>
                    <div className="flex-1 max-w-[50px] bg-background border border-border h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          agent.performance.successRate >= 95 ? 'bg-success' : 'bg-accent'
                        }`}
                        style={{ width: `${agent.performance.successRate}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-2.5 text-right font-medium text-text-secondary">
                  {agent.performance.avgExecTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
