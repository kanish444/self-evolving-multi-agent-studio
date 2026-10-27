import React from 'react'
import type { TestCase } from '../mockData'

interface TestDetailProps {
  testCase: TestCase
}

export const TestDetail: React.FC<TestDetailProps> = ({ testCase }) => {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-command-card space-y-4">
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">
            Test Details: <span className="text-accent">{testCase.name}</span>
          </h3>
          {testCase.endpoint && (
            <p className="text-[10px] font-bold text-text-secondary mt-1 font-mono bg-surface-secondary border border-border px-2 py-0.5 rounded inline-block">
              {testCase.endpoint}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-text-muted">
          <div>
            <span className="font-sans mr-1">Type:</span>
            <span className="text-text-secondary font-bold">{testCase.type}</span>
          </div>
          <div>
            <span className="font-sans mr-1">Duration:</span>
            <span className="text-text-secondary font-bold">{testCase.executionTime || '0.00s'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input parameters */}
        {testCase.input && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
              Input Payload / Parameters
            </span>
            <pre className="bg-background text-text-primary rounded text-xs p-3 font-mono overflow-x-auto max-h-[160px] custom-scrollbar border border-border">
              {testCase.input}
            </pre>
          </div>
        )}

        {/* Expected Results */}
        {testCase.expected && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
              Expected Output
            </span>
            <pre className="bg-background text-emerald-400 rounded text-xs p-3 font-mono overflow-x-auto max-h-[160px] custom-scrollbar border border-border">
              {testCase.expected}
            </pre>
          </div>
        )}

        {/* Actual Results */}
        {testCase.actual && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
              Actual Output
            </span>
            <pre className={`bg-background rounded text-xs p-3 font-mono overflow-x-auto max-h-[160px] custom-scrollbar border border-border ${
              testCase.status === 'FAIL' ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {testCase.actual}
            </pre>
          </div>
        )}

        {/* Response */}
        {testCase.response && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider font-mono">
              Server Response Body
            </span>
            <pre className="bg-background text-text-secondary rounded text-xs p-3 font-mono overflow-x-auto max-h-[160px] custom-scrollbar border border-border">
              {testCase.response}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
