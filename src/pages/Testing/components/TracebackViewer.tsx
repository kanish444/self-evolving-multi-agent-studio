import React from 'react'
import type { TestCase } from '../mockData'
import { Terminal, Copy } from 'lucide-react'

interface TracebackViewerProps {
  testCase: TestCase
}

export const TracebackViewer: React.FC<TracebackViewerProps> = ({ testCase }) => {
  if (testCase.status !== 'FAIL') return null

  const handleCopy = () => {
    if (testCase.traceback) {
      navigator.clipboard.writeText(testCase.traceback)
    }
  }

  return (
    <div className="bg-background rounded-lg border border-border shadow-command-card overflow-hidden flex flex-col font-mono">
      {/* Console Header */}
      <div className="bg-surface-secondary border-b border-border px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-red-400">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-bold">Traceback / Error Console</span>
        </div>
        <div className="flex items-center gap-3 text-text-secondary text-[10px]">
          {testCase.relatedFile && (
            <span>
              File: <span className="text-text-primary font-bold">{testCase.relatedFile}</span>
            </span>
          )}
          {testCase.line && (
            <span>
              Line: <span className="text-text-primary font-bold">{testCase.line}</span>
            </span>
          )}
          <button
            onClick={handleCopy}
            title="Copy Traceback"
            className="hover:text-text-primary transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="p-4 overflow-x-auto custom-scrollbar max-h-[300px] text-xs leading-relaxed">
        {/* Error highlight banner */}
        <div className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2 text-red-300 mb-3">
          <span className="font-bold text-red-400 mr-1.5 uppercase">AssertionError:</span>
          Expected status code 400, received 201.
        </div>

        {/* Full trace log */}
        <pre className="text-text-secondary font-mono whitespace-pre text-[11px] leading-5">
          {testCase.traceback || `Traceback (most recent call last):
  File "/workspace/tests/test_students.py", line 24, in test_duplicate_email
    response = client.post("/students", json=payload)
AssertionError: Expected status code 400, received 201.`}
        </pre>
      </div>
    </div>
  )
}
