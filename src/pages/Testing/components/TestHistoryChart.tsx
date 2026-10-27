import React from 'react'
import type { TestHistoryItem } from '../mockData'
import { Card } from '../../../components/ui/Card'
import { BarChart3 } from 'lucide-react'

interface TestHistoryChartProps {
  history: TestHistoryItem[]
}

export const TestHistoryChart: React.FC<TestHistoryChartProps> = ({ history }) => {
  // SVG proportions
  const width = 360
  const height = 140
  const paddingX = 40
  const paddingY = 20
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2

  const maxVal = 20
  const barWidth = 32
  const gap = (chartWidth - barWidth * history.length) / (history.length + 1)

  return (
    <Card className="p-4 border border-border bg-surface shadow-command-card space-y-4">
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <BarChart3 className="w-4 h-4 text-accent" />
        <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
          Historical Run Distribution
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Grid lines */}
          {[0, 5, 10, 15, 20].map((val) => {
            const y = chartHeight + paddingY - (val / maxVal) * chartHeight
            return (
              <g key={val} className="opacity-40">
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#3B2A21"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#85756A] text-[9px] font-mono font-bold"
                >
                  {val}
                </text>
              </g>
            )
          })}

          {/* Render Bars */}
          {history.map((item, index) => {
            const x = paddingX + gap + index * (barWidth + gap)
            
            // Calculate heights
            const passedHeight = (item.passed / maxVal) * chartHeight
            const failedHeight = (item.failed / maxVal) * chartHeight
            const skippedHeight = (item.skipped / maxVal) * chartHeight
            const runningHeight = (item.running / maxVal) * chartHeight

            // Y positions stacked from bottom up
            const passedY = chartHeight + paddingY - passedHeight
            const failedY = passedY - failedHeight
            const skippedY = failedY - skippedHeight
            const runningY = skippedY - runningHeight

            return (
              <g key={index} className="group">
                {/* Passed segment */}
                {item.passed > 0 && (
                  <rect
                    x={x}
                    y={passedY}
                    width={barWidth}
                    height={passedHeight}
                    fill="#16A34A"
                    opacity="0.85"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                    rx="1"
                  >
                    <title>{`Passed: ${item.passed}`}</title>
                  </rect>
                )}

                {/* Failed segment */}
                {item.failed > 0 && (
                  <rect
                    x={x}
                    y={failedY}
                    width={barWidth}
                    height={failedHeight}
                    fill="#E11D48"
                    opacity="0.85"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                    rx="1"
                  >
                    <title>{`Failed: ${item.failed}`}</title>
                  </rect>
                )}

                {/* Running segment */}
                {item.running > 0 && (
                  <rect
                    x={x}
                    y={runningY}
                    width={barWidth}
                    height={runningHeight}
                    fill="#B8860B"
                    opacity="0.85"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                    rx="1"
                  >
                    <title>{`Running: ${item.running}`}</title>
                  </rect>
                )}

                {/* Skipped segment */}
                {item.skipped > 0 && (
                  <rect
                    x={x}
                    y={skippedY}
                    width={barWidth}
                    height={skippedHeight}
                    fill="#85756A"
                    opacity="0.65"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                    rx="1"
                  >
                    <title>{`Skipped: ${item.skipped}`}</title>
                  </rect>
                )}

                {/* X Axis label */}
                <text
                  x={x + barWidth / 2}
                  y={height - 2}
                  textAnchor="middle"
                  className="fill-[#B7A599] text-[8px] font-bold font-mono"
                >
                  {item.iteration.replace('Iteration ', 'IT-')}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-bold font-mono text-text-secondary pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Passed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
          <span>Failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
          <span>Running</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#85756A] inline-block" />
          <span>Skipped</span>
        </div>
      </div>
    </Card>
  )
}
