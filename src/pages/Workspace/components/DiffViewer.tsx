import React, { useMemo } from 'react'
import { GitCompare } from 'lucide-react'

interface DiffViewerProps {
  diffText: string
  filePath?: string
}

interface DiffLine {
  type: 'addition' | 'deletion' | 'context' | 'header'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffText, filePath }) => {
  const parsedLines = useMemo<DiffLine[]>(() => {
    if (!diffText.trim()) return []

    const rawLines = diffText.split('\n')
    const result: DiffLine[] = []
    let oldNum = 1
    let newNum = 1

    for (const line of rawLines) {
      if (line.startsWith('@@')) {
        // Hunk header e.g. @@ -1,10 +1,15 @@
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
        if (match) {
          oldNum = parseInt(match[1], 10)
          newNum = parseInt(match[2], 10)
        }
        result.push({ type: 'header', content: line })
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        result.push({
          type: 'addition',
          content: line.slice(1),
          newLineNumber: newNum++
        })
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        result.push({
          type: 'deletion',
          content: line.slice(1),
          oldLineNumber: oldNum++
        })
      } else if (!line.startsWith('diff --git') && !line.startsWith('index ') && !line.startsWith('---') && !line.startsWith('+++')) {
        result.push({
          type: 'context',
          content: line.startsWith(' ') ? line.slice(1) : line,
          oldLineNumber: oldNum++,
          newLineNumber: newNum++
        })
      }
    }

    return result
  }, [diffText])

  if (!diffText.trim() || parsedLines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-[#788B9B] text-center p-8 select-none">
        <div className="w-12 h-12 rounded-full bg-[#121D26] border border-[#263744] flex items-center justify-center text-[#788B9B] mb-3">
          <GitCompare className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h3 className="font-display text-sm font-semibold text-[#EDF3F8]">
          No changes to review.
        </h3>
        <p className="text-xs text-[#788B9B] mt-1 max-w-sm">
          All workspace files match repository baseline. Changes made by you or the AI will appear here for review.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#0D141B] overflow-hidden select-none font-mono text-xs">
      {/* Diff Headers matching visual reference: Original vs Updated by AI */}
      <div className="grid grid-cols-2 bg-[#0B131A] border-b border-[#263744] text-[11px] font-sans font-medium text-[#788B9B] px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[#A8B8C8] font-semibold">Original</span>
          {filePath && <span className="text-[10px] text-[#788B9B]">({filePath})</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#15BDEB] font-semibold">Updated by AI (proposed changes)</span>
        </div>
      </div>

      {/* Diff Content View */}
      <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar select-text bg-[#0B131A]">
        {parsedLines.map((line, idx) => {
          if (line.type === 'header') {
            return (
              <div
                key={idx}
                className="bg-[#121D26] text-[#15BDEB] px-4 py-1 border-y border-[#263744]/60 text-[11px]"
              >
                {line.content}
              </div>
            )
          }

          if (line.type === 'addition') {
            return (
              <div
                key={idx}
                className="flex items-stretch bg-[#2BC879]/10 hover:bg-[#2BC879]/15 text-[#EDF3F8] leading-6 min-h-[24px]"
              >
                <div className="w-12 text-right pr-3 text-[#788B9B]/50 select-none border-r border-[#263744]/40 flex-shrink-0">
                  {/* Empty old line */}
                </div>
                <div className="w-12 text-right pr-3 text-[#2BC879] select-none border-r border-[#263744]/40 flex-shrink-0 font-medium">
                  {line.newLineNumber}
                </div>
                <div className="w-6 text-center text-[#2BC879] select-none font-bold flex-shrink-0">
                  +
                </div>
                <div className="flex-1 px-2 whitespace-pre text-[#2BC879]">
                  {line.content}
                </div>
              </div>
            )
          }

          if (line.type === 'deletion') {
            return (
              <div
                key={idx}
                className="flex items-stretch bg-rose-500/10 hover:bg-rose-500/15 text-rose-300 leading-6 min-h-[24px]"
              >
                <div className="w-12 text-right pr-3 text-rose-400 select-none border-r border-[#263744]/40 flex-shrink-0 font-medium">
                  {line.oldLineNumber}
                </div>
                <div className="w-12 text-right pr-3 text-[#788B9B]/50 select-none border-r border-[#263744]/40 flex-shrink-0">
                  {/* Empty new line */}
                </div>
                <div className="w-6 text-center text-rose-400 select-none font-bold flex-shrink-0">
                  -
                </div>
                <div className="flex-1 px-2 whitespace-pre text-rose-300">
                  {line.content}
                </div>
              </div>
            )
          }

          // Context line
          return (
            <div
              key={idx}
              className="flex items-stretch hover:bg-[#121D26]/60 text-[#A8B8C8] leading-6 min-h-[24px]"
            >
              <div className="w-12 text-right pr-3 text-[#788B9B]/60 select-none border-r border-[#263744]/40 flex-shrink-0">
                {line.oldLineNumber}
              </div>
              <div className="w-12 text-right pr-3 text-[#788B9B]/60 select-none border-r border-[#263744]/40 flex-shrink-0">
                {line.newLineNumber}
              </div>
              <div className="w-6 text-center text-[#788B9B]/30 select-none flex-shrink-0">
                &nbsp;
              </div>
              <div className="flex-1 px-2 whitespace-pre text-[#EDF3F8]">
                {line.content}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
