import React, { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { TrendingUp, Bug, Clock, Star } from 'lucide-react'

export const IterationPerformance: React.FC = () => {
  const [hoveredPoint, setHoveredPoint] = useState<{ chart: string; iter: string; val: string } | null>(null)

  // Iteration data coordinates
  // Width: 320, Height: 120
  // Iteration 1 (x: 40), Iteration 2 (x: 160), Iteration 3 (x: 280)
  // Success rates: 68% (y: 120 - 68 = 52), 81% (y: 120 - 81 = 39), 94% (y: 120 - 94 = 26)
  // Bugs: 7 (y: 120 - (7 * 12) = 36), 3 (y: 120 - (3 * 12) = 84), 1 (y: 120 - (1 * 12) = 108)
  // Exec Time (seconds): 381s (y: 120 - (381 / 4) = 24.75), 308s (y: 120 - (308 / 4) = 43), 272s (y: 120 - (272 / 4) = 52)

  const successPoints = [
    { iter: 'Iteration 01', val: '68%', x: 50, y: 80 },
    { iter: 'Iteration 02', val: '81%', x: 175, y: 50 },
    { iter: 'Iteration 03', val: '94%', x: 300, y: 20 },
  ]

  const bugPoints = [
    { iter: 'Iteration 01', val: '7 Bugs', x: 50, y: 20 },
    { iter: 'Iteration 02', val: '3 Bugs', x: 175, y: 70 },
    { iter: 'Iteration 03', val: '1 Bug', x: 300, y: 95 },
  ]

  const timePoints = [
    { iter: 'Iteration 01', val: '6m 21s', x: 50, y: 20 },
    { iter: 'Iteration 02', val: '5m 08s', x: 175, y: 65 },
    { iter: 'Iteration 03', val: '4m 32s', x: 300, y: 90 },
  ]

  return (
    <Card className="p-4 border border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Iteration Performance Trends
          </h3>
          <p className="text-[10px] text-text-secondary mt-0.5">
            Measured success improvements and optimization gains over successive development cycles.
          </p>
        </div>
        {hoveredPoint && (
          <div className="bg-slate-900 border border-slate-800 text-[10px] text-white px-2 py-0.5 rounded font-mono shadow animate-in fade-in duration-100">
            {hoveredPoint.iter}: <span className="font-bold text-teal-400">{hoveredPoint.val}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 1: Success Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-text-primary">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-text-secondary">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Success Rate Trend
            </span>
            <span className="text-emerald-600 font-mono">+26% Delta</span>
          </div>
          <div className="bg-slate-50/50 border border-border/50 rounded-md p-3 relative h-36 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 350 120" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50" y1="80" x2="300" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              {/* Path */}
              <path d="M 50 80 L 175 50 L 300 20" fill="none" stroke="#10b981" strokeWidth="2.5" />
              {/* Points */}
              {successPoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  className="cursor-pointer hover:r-6 transition-all"
                  onMouseEnter={() => setHoveredPoint({ chart: 'success', iter: p.iter, val: p.val })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
              {/* Bottom Labels */}
              <text x="50" y="115" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">Iter 01</text>
              <text x="175" y="115" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">Iter 02</text>
              <text x="300" y="115" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">Iter 03</text>
            </svg>
          </div>
        </div>

        {/* Chart 2: Bug Count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-text-primary">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-text-secondary">
              <Bug className="w-3.5 h-3.5 text-rose-500" />
              Bugs Count Trend
            </span>
            <span className="text-rose-600 font-mono">-6 Bugs</span>
          </div>
          <div className="bg-slate-50/50 border border-border/50 rounded-md p-3 relative h-36 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 350 120" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50" y1="70" x2="300" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50" y1="95" x2="300" y2="95" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              {/* Path */}
              <path d="M 50 20 L 175 70 L 300 95" fill="none" stroke="#f43f5e" strokeWidth="2.5" />
              {/* Points */}
              {bugPoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  className="cursor-pointer hover:r-6 transition-all"
                  onMouseEnter={() => setHoveredPoint({ chart: 'bugs', iter: p.iter, val: p.val })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
              {/* Bottom Labels */}
              <text x="50" y="115" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">Iter 01</text>
              <text x="175" y="115" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">Iter 02</text>
              <text x="300" y="115" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">Iter 03</text>
            </svg>
          </div>
        </div>

        {/* Chart 3: Execution Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-text-primary">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-text-secondary">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              Execution Latency
            </span>
            <span className="text-sky-600 font-mono">-29% Speedup</span>
          </div>
          <div className="bg-slate-50/50 border border-border/50 rounded-md p-3 relative h-36 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 350 120" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="50" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50" y1="65" x2="300" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <line x1="50" y1="90" x2="300" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              {/* Path */}
              <path d="M 50 20 L 175 65 L 300 90" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
              {/* Points */}
              {timePoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#0ea5e9"
                  strokeWidth="2.5"
                  className="cursor-pointer hover:r-6 transition-all"
                  onMouseEnter={() => setHoveredPoint({ chart: 'time', iter: p.iter, val: p.val })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
              {/* Bottom Labels */}
              <text x="50" y="115" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">Iter 01</text>
              <text x="175" y="115" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">Iter 02</text>
              <text x="300" y="115" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">Iter 03</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-border rounded px-3 py-2 text-center text-xs font-medium text-text-secondary leading-relaxed font-sans">
        🚀 Success rate improved by <span className="font-bold text-emerald-600">26 percentage points</span> (+38.2% relative) and bug count decreased by <span className="font-bold text-emerald-600">86%</span> across three evolution iterations.
      </div>
    </Card>
  )
}
