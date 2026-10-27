import React from 'react'
import { Card } from '../../../components/ui/Card'

export const IterationComparison: React.FC = () => {
  const rows = [
    {
      metric: 'Success Rate',
      v1: '68%',
      v2: '81%',
      v3: '94%',
      change: '+26%',
      isPositive: true,
    },
    {
      metric: 'Bugs Detected',
      v1: '7',
      v2: '3',
      v3: '1',
      change: '-86%',
      isPositive: true,
    },
    {
      metric: 'Execution Time',
      v1: '6m 21s',
      v2: '5m 08s',
      v3: '4m 32s',
      change: '-29%',
      isPositive: true,
    },
    {
      metric: 'Test Coverage',
      v1: '54%',
      v2: '76%',
      v3: '92%',
      change: '+38%',
      isPositive: true,
    },
    {
      metric: 'Workflow Improvements',
      v1: '3',
      v2: '5',
      v3: '8',
      change: '+5',
      isPositive: true,
    },
  ]

  return (
    <Card className="p-0 border border-border rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.01)] overflow-hidden">
      <div className="p-3.5 border-b border-border bg-slate-50/50">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Iteration Matrix Comparison
        </h3>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/20 border-b border-border">
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Metric
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Iteration 01 (Baseline)
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Iteration 02
              </th>
              <th className="px-4 py-2.5 text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Iteration 03
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-4 py-2 text-xs font-medium text-text-primary">
                  {row.metric}
                </td>
                <td className="px-4 py-2 text-xs text-text-secondary font-mono">
                  {row.v1}
                </td>
                <td className="px-4 py-2 text-xs text-text-secondary font-mono">
                  {row.v2}
                </td>
                <td className="px-4 py-2 text-xs text-text-secondary font-mono">
                  {row.v3}
                </td>
                <td className={`px-4 py-2 text-xs font-bold font-mono text-right ${
                  row.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {row.change}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
