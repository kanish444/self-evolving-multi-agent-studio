import React, { useMemo, useRef } from 'react'
import { Play, Save, X, Plus, Loader2 } from 'lucide-react'
import { FileIcon } from './FileIcon'

interface CodeEditorProps {
  currentFilePath: string
  code: string
  openTabs: string[]
  onSelectTab: (path: string) => void
  onCloseTab: (path: string) => void
  onNewFileClick?: () => void
  onRunCode: () => void
  onSaveCode: () => void
  onChangeCode?: (newCode: string) => void
  isSaving: boolean
  isRunning: boolean
  isModified?: boolean
  modifiedTabs?: string[]
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  currentFilePath,
  code,
  openTabs,
  onSelectTab,
  onCloseTab,
  onNewFileClick,
  onRunCode,
  onSaveCode,
  onChangeCode,
  isSaving,
  isRunning,
  isModified = false,
  modifiedTabs = []
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Extract filename from full path
  const getFileName = (path: string) => {
    return path.split('/').pop() || path
  }

  // Generate breadcrumb path
  const breadcrumbs = useMemo(() => {
    return currentFilePath ? currentFilePath.split('/') : []
  }, [currentFilePath])

  const codeLines = useMemo(() => {
    return (code || '').split('\n')
  }, [code])

  // Synchronize vertical scroll between textarea and line numbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D141B] overflow-hidden select-none">
      {/* File Tabs Strip matching reference */}
      <div className="h-9 bg-[#0B131A] border-b border-[#263744] flex items-center overflow-x-auto custom-scrollbar flex-shrink-0">
        {openTabs.map((tabPath) => {
          const isActive = tabPath === currentFilePath
          const isTabModified = modifiedTabs.includes(tabPath)
          const fileName = getFileName(tabPath)

          return (
            <div
              key={tabPath}
              onClick={() => onSelectTab(tabPath)}
              className={`h-full px-3.5 flex items-center gap-2 border-r border-[#263744] text-xs font-mono transition-colors cursor-pointer group flex-shrink-0 ${
                isActive
                  ? 'bg-[#121D26] text-[#EDF3F8] font-medium border-t-2 border-t-[#15BDEB]'
                  : 'text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26]/50 border-t-2 border-t-transparent'
              }`}
            >
              <FileIcon name={fileName} className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate max-w-[140px]">{fileName}</span>

              {isTabModified && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tabPath)
                }}
                className="p-0.5 rounded hover:bg-[#182630] text-[#788B9B] hover:text-[#EDF3F8] opacity-60 group-hover:opacity-100 transition-opacity ml-0.5"
                aria-label={`Close ${fileName}`}
              >
                <X className="w-3 h-3" strokeWidth={1.75} />
              </button>
            </div>
          )
        })}

        {/* Plus Button for adding/creating a new file */}
        {onNewFileClick && (
          <button
            type="button"
            onClick={onNewFileClick}
            className="h-full px-2.5 text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] transition-colors flex items-center justify-center flex-shrink-0 cursor-pointer"
            title="Create new file"
            aria-label="New file"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Breadcrumbs & Action Strip */}
      <div className="h-8 bg-[#121D26]/60 border-b border-[#263744] px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#788B9B]">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-[#263744]">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? 'text-[#EDF3F8] font-medium' : ''}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isModified && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              ● Unsaved
            </span>
          )}

          <button
            type="button"
            onClick={onSaveCode}
            disabled={isSaving}
            className="px-2.5 py-1 text-xs font-mono rounded bg-[#182630] hover:bg-[#263744] text-[#EDF3F8] flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer border border-[#263744]"
          >
            {isSaving ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#15BDEB]" />
            ) : (
              <Save className="w-3 h-3 text-[#15BDEB]" strokeWidth={1.5} />
            )}
            <span>Save</span>
          </button>

          <button
            type="button"
            onClick={onRunCode}
            disabled={isRunning}
            className="px-2.5 py-1 text-xs font-mono rounded bg-[#0878F9] hover:bg-[#076AD9] text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Editor Body: Line numbers and TextArea */}
      <div className="flex-1 flex overflow-hidden bg-[#0B131A] relative">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="w-12 py-3 pr-3 text-right font-mono text-xs text-[#788B9B]/60 select-none border-r border-[#263744] bg-[#0B131A] overflow-hidden flex flex-col flex-shrink-0"
        >
          {codeLines.map((_, i) => (
            <span key={i} className="leading-6 h-6 block">
              {i + 1}
            </span>
          ))}
        </div>

        {/* Real Editable Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChangeCode && onChangeCode(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
              e.preventDefault()
              onSaveCode()
            }
          }}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-[#EDF3F8] font-mono text-[13px] leading-6 resize-none outline-none custom-scrollbar select-text whitespace-pre overflow-auto caret-[#15BDEB]"
          placeholder="File content..."
        />
      </div>
    </div>
  )
}
