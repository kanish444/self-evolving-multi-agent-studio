import React from 'react'
import { Card } from '../../../components/ui/Card'
import { ArrowRight, Code } from 'lucide-react'

interface CodeDiffProps {
  beforeCode: string
  afterCode: string
  fileName?: string
}

export const CodeDiff: React.FC<CodeDiffProps> = ({
  beforeCode,
  afterCode,
  fileName = 'StudentController.py',
}) => {
  return (
    <Card className="p-4 border border-border bg-surface shadow-command-card space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Auto-Fix Preview: <span className="text-accent">{fileName}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold font-mono">
          <span className="text-red-400 bg-red-500/10 border border-red-500/30 rounded px-1.5 py-0.5">
            REMOVED
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded px-1.5 py-0.5">
            ADDED
          </span>
        </div>
      </div>

      {/* Code Blocks side-by-side or stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
        {/* Before */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
            Original Code (Before Fix)
          </div>
          <div className="bg-background border border-border rounded p-3 text-text-secondary overflow-x-auto custom-scrollbar max-h-[250px]">
            <pre className="whitespace-pre leading-5">
              {beforeCode.split('\n').map((line, idx) => (
                <div key={idx} className="flex hover:bg-surface-secondary/50">
                  <span className="text-text-muted w-6 select-none border-r border-border mr-2 pr-1 text-right">
                    {idx + 1}
                  </span>
                  <span className="text-red-300 bg-red-500/10 w-full pl-1">
                    <span className="text-red-400 mr-1 select-none">-</span>
                    {line}
                  </span>
                </div>
              ))}
            </pre>
          </div>
        </div>

        {/* After */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider font-mono">
            Proposed Code (After Fix)
          </div>
          <div className="bg-background border border-border rounded p-3 text-text-secondary overflow-x-auto custom-scrollbar max-h-[250px]">
            <pre className="whitespace-pre leading-5">
              {afterCode.split('\n').map((line, idx) => {
                const isNew =
                  line.includes('existing =') ||
                  line.includes('Student.email ==') ||
                  line.includes('if existing:') ||
                  line.includes('raise HTTPException') ||
                  line.includes('status_code=400') ||
                  line.includes('Email already exists') ||
                  line.includes('if student.age') ||
                  line.includes('Age must be') ||
                  line.includes('for attempt') ||
                  line.includes('try:') ||
                  line.includes('except OperationalError') ||
                  line.includes('rollback()') ||
                  line.includes('sleep(')

                return (
                  <div key={idx} className="flex hover:bg-surface-secondary/50">
                    <span className="text-text-muted w-6 select-none border-r border-border mr-2 pr-1 text-right">
                      {idx + 1}
                    </span>
                    <span className={`w-full pl-1 ${isNew ? 'text-emerald-300 bg-emerald-500/10' : ''}`}>
                      <span className={`mr-1 select-none ${isNew ? 'text-emerald-400 font-bold' : 'text-text-muted'}`}>
                        {isNew ? '+' : ' '}
                      </span>
                      {line}
                    </span>
                  </div>
                )
              })}
            </pre>
          </div>
        </div>
      </div>
    </Card>
  )
}
