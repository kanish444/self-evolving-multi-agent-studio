import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Plus,
  RotateCw,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Terminal,
  FlaskConical,
  AlertTriangle,
  Play,
  RotateCcw,
  Square,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  User,
  GitCompare,
  Code2,
  Search,
  Sparkles,
  Paperclip,
  Check,
  Circle
} from 'lucide-react'
import { useProject } from '../../context/ProjectContext'
import { workspaceApi, type FileItem } from '../../services/api/workspace'
import { testsApi, type TestRunResult } from '../../services/api/tests'
import { previewApi, type PreviewStatus } from '../../services/api/preview'
import { liveApi } from '../../services/api/live'
import type { LiveState } from '../../services/api/live'
import { CodeEditor } from './components/CodeEditor'
import { FileIcon } from './components/FileIcon'
import { DiffViewer } from './components/DiffViewer'

export default function Workspace() {
  const { activeProject, activeProjectId } = useProject()

  // Layout panel toggles & dimensions with localStorage persistence
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('se_maestro_explorer_collapsed') === 'true'
  })
  const [isAIAssistantCollapsed, setIsAIAssistantCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('se_maestro_assistant_collapsed') === 'true'
  })
  const [isBottomCollapsed, setIsBottomCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('se_maestro_bottom_collapsed') === 'true'
  })
  const [isBottomMaximized, setIsBottomMaximized] = useState(false)
  const [bottomHeight, setBottomHeight] = useState<number>(() => {
    const saved = localStorage.getItem('se_maestro_terminal_height')
    return saved ? Math.max(120, Math.min(600, parseInt(saved, 10))) : 210
  })
  const [isDraggingBottom, setIsDraggingBottom] = useState(false)

  // Persist panel states
  useEffect(() => {
    localStorage.setItem('se_maestro_explorer_collapsed', String(isFileExplorerCollapsed))
  }, [isFileExplorerCollapsed])

  useEffect(() => {
    localStorage.setItem('se_maestro_assistant_collapsed', String(isAIAssistantCollapsed))
  }, [isAIAssistantCollapsed])

  useEffect(() => {
    localStorage.setItem('se_maestro_bottom_collapsed', String(isBottomCollapsed))
  }, [isBottomCollapsed])

  useEffect(() => {
    localStorage.setItem('se_maestro_terminal_height', String(bottomHeight))
  }, [bottomHeight])

  // Main canvas tabs: 'editor' | 'changes' | 'preview'
  const [activeCanvasTab, setActiveCanvasTab] = useState<'editor' | 'changes' | 'preview'>('editor')
  const [isCanvasMaximized, setIsCanvasMaximized] = useState(false)

  // File explorer & code editor state
  const [fileList, setFileList] = useState<FileItem[]>([])
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})
  const [selectedFilePath, setSelectedFilePath] = useState<string>('')
  const [codeContent, setCodeContent] = useState<string>('')
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [modifiedTabs, setModifiedTabs] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [fileSearchQuery, setFileSearchQuery] = useState('')
  const [isSearchingFiles, setIsSearchingFiles] = useState(false)

  // New file creation modal
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false)
  const [newFilePath, setNewFilePath] = useState('')

  // Diff state (Changes tab)
  const [diffText, setDiffText] = useState<string>('')
  const [isLoadingDiff, setIsLoadingDiff] = useState(false)

  // Preview state (Preview tab)
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>({
    status: 'NOT_STARTED',
    port: null,
    url: null,
    logs: [],
    uptime_seconds: 0,
    error: null
  })
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  // Bottom panel tabs: 'terminal' | 'tests' | 'issues'
  const [activeBottomTab, setActiveBottomTab] = useState<'terminal' | 'tests' | 'issues'>('terminal')
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'SE-MAESTRO Workspace Terminal [Version 1.0.0]',
    'Execution is checked before each command. Supported commands: ls, test.'
  ])
  const [terminalInput, setTerminalInput] = useState('')
  const [isExecutingCommand, setIsExecutingCommand] = useState(false)

  // Tests runner state
  const [testRunData, setTestRunData] = useState<TestRunResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // AI Assistant panel state
  const [activeAITab, setActiveAITab] = useState<'assistant' | 'plan'>('assistant')
  const [aiMessages, setAiMessages] = useState<Array<{
    id: string
    role: 'user' | 'assistant'
    text: string
    timestamp: string
    status?: 'running' | 'completed' | 'error'
    steps?: Array<{ title: string; desc: string; status: 'completed' | 'running' | 'pending' }>
  }>>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'I am your SE-MAESTRO AI Engineering Assistant. Ask me to make changes, inspect architecture, add features, or resolve failing tests.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [aiInput, setAiInput] = useState('')
  const [isAiRunning, setIsAiRunning] = useState(false)
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [currentStage, setCurrentStage] = useState<string | null>(null)

  const [liveState, setLiveState] = useState<LiveState | null>(null)
  const seenEvents = useRef(new Set<string>())
  const currentProjectRef = useRef(activeProjectId)
  currentProjectRef.current = activeProjectId
  useEffect(() => {
    if (!activeProjectId) return
    let active = true
    seenEvents.current = new Set()
    setFileList([])
    setSelectedFilePath('')
    setCodeContent('')
    setOpenTabs([])
    setModifiedTabs([])
    setAiMessages([])
    setLiveState(null)
    async function poll() {
      try {
        const state = await liveApi.state(activeProjectId)
        if (!active) return
        setLiveState(state)
        setIsAiRunning(state.status === 'RUNNING')
        setCurrentStage(state.status === 'RUNNING' ? Object.entries(state.agents).find(([,status]) => status === 'RUNNING')?.[0].replaceAll('_',' ') || 'Working' : null)
        if (state.messages && state.messages.length > 0) {
          setAiMessages(state.messages.map((m: any, idx: number) => ({
            id: `msg-${idx}-${m.timestamp || idx}`,
            role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
            text: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: 'completed' as const
          })))
        }
        const fresh = state.events.filter(event => !seenEvents.current.has(event.id))
        fresh.forEach(event => seenEvents.current.add(event.id))
        if (fresh.length) {
          setTerminalLogs(previous => [...previous, ...fresh.filter(event => event.evidence).map(event => JSON.stringify(event.evidence,null,2))])
          const files = await workspaceApi.listFiles(activeProjectId)
          if (active) setFileList(files)
        }
      } catch (error) {
        if (active) setCurrentStage(error instanceof Error ? error.message : 'Unable to read execution state')
      }
    }
    void poll()
    const timer = setInterval(() => { void poll() },2000)
    return () => {active=false;clearInterval(timer)}
  },[activeProjectId])

  // Notifications
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Refs
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ==========================================
  // 1. Load Filesystem Tree
  // ==========================================
  const loadWorkspaceFiles = useCallback(async () => {
    if (!activeProjectId) return
    setIsLoadingFiles(true)
    try {
      const files = await workspaceApi.listFiles(activeProjectId)
      if (currentProjectRef.current !== activeProjectId) return
      setFileList(files)

      // Open initial folders by default
      const initialOpen: Record<string, boolean> = {}
      const traverse = (items: FileItem[]) => {
        for (const item of items) {
          if (item.isFolder) {
            initialOpen[item.path] = true
            if (item.children) traverse(item.children)
          }
        }
      }
      traverse(files)
      setOpenFolders(prev => ({ ...initialOpen, ...prev }))

      // Auto-open first file if none open
      if (!selectedFilePath && files.length > 0) {
        const findFirstFile = (items: FileItem[]): string | null => {
          for (const item of items) {
            if (!item.isFolder) return item.path
            if (item.children) {
              const res = findFirstFile(item.children)
              if (res) return res
            }
          }
          return null
        }
        const first = findFirstFile(files)
        if (first) {
          openFile(first)
        }
      }
    } catch (err: any) {
      console.warn('Failed to load workspace files:', err)
    } finally {
      setIsLoadingFiles(false)
    }
  }, [activeProjectId, selectedFilePath])

  useEffect(() => {
    loadWorkspaceFiles()
  }, [loadWorkspaceFiles])

  // Open file
  const openFile = async (path: string) => {
    if (!activeProjectId) return
    try {
      const res = await workspaceApi.getFileContent(activeProjectId, path)
      if (currentProjectRef.current !== activeProjectId) return
      setSelectedFilePath(path)
      setCodeContent(res.content)
      if (!openTabs.includes(path)) {
        setOpenTabs(prev => [...prev, path])
      }
      setActiveCanvasTab('editor')
    } catch (err: any) {
      showToast(`Failed to open ${path}: ${err.message}`, 'error')
    }
  }

  // Save current file
  const handleSaveFile = async () => {
    if (!activeProjectId || !selectedFilePath) return
    setIsSaving(true)
    try {
      await workspaceApi.saveFile(activeProjectId, selectedFilePath, codeContent)
      setModifiedTabs(prev => prev.filter(p => p !== selectedFilePath))
      showToast(`Saved ${selectedFilePath.split('/').pop()}`, 'success')
    } catch (err: any) {
      showToast(`Save failed: ${err.message}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Close tab
  const handleCloseTab = (path: string) => {
    const updated = openTabs.filter(t => t !== path)
    setOpenTabs(updated)
    if (selectedFilePath === path) {
      if (updated.length > 0) {
        openFile(updated[updated.length - 1])
      } else {
        setSelectedFilePath('')
        setCodeContent('')
      }
    }
  }

  // Create new file
  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProjectId || !newFilePath.trim()) return
    try {
      const cleanPath = newFilePath.trim()
      await workspaceApi.saveFile(activeProjectId, cleanPath, '')
      setIsNewFileModalOpen(false)
      setNewFilePath('')
      await loadWorkspaceFiles()
      openFile(cleanPath)
      showToast(`Created ${cleanPath}`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to create file', 'error')
    }
  }

  // ==========================================
  // 2. Diff (Changes Tab)
  // ==========================================
  const loadDiff = useCallback(async () => {
    if (!activeProjectId) return
    setIsLoadingDiff(true)
    try {
      const res = await workspaceApi.getDiff(activeProjectId)
      setDiffText(res.diff || '')
    } catch (err: any) {
      setDiffText('')
    } finally {
      setIsLoadingDiff(false)
    }
  }, [activeProjectId])

  useEffect(() => {
    if (activeCanvasTab === 'changes') {
      loadDiff()
    }
  }, [activeCanvasTab, loadDiff])

  // ==========================================
  // 3. Preview (Preview Tab)
  // ==========================================
  const fetchPreviewStatus = useCallback(async () => {
    if (!activeProjectId) return
    try {
      const data = await previewApi.getStatus(activeProjectId)
      setPreviewStatus(data)
    } catch (err) {
      console.warn('Error polling preview status:', err)
    }
  }, [activeProjectId])

  useEffect(() => {
    fetchPreviewStatus()
    const timer = setInterval(() => {
      if (activeCanvasTab === 'preview' || previewStatus.status === 'STARTING') {
        fetchPreviewStatus()
      }
    }, 2500)
    return () => clearInterval(timer)
  }, [fetchPreviewStatus, activeCanvasTab, previewStatus.status])

  const handleStartApp = async () => {
    if (!activeProjectId) return
    setIsPreviewLoading(true)
    try {
      const res = await previewApi.start(activeProjectId)
      if (res.status === 'RUNNING') {
        showToast('Application preview is live', 'success')
      } else {
        showToast(res.message || 'Preview failed to start', 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to start preview', 'error')
    } finally {
      setIsPreviewLoading(false)
      fetchPreviewStatus()
    }
  }

  const handleStopApp = async () => {
    if (!activeProjectId) return
    setIsPreviewLoading(true)
    try {
      await previewApi.stop(activeProjectId)
      showToast('Application preview stopped', 'info')
    } catch (err: any) {
      showToast(err.message || 'Failed to stop app', 'error')
    } finally {
      setIsPreviewLoading(false)
      fetchPreviewStatus()
    }
  }

  // ==========================================
  // 4. Bottom Panel: Terminal Commands & Tests
  // ==========================================
  const executeTerminalCommand = async (command: string) => {
    if (!activeProjectId || !command.trim()) return
    const cleanCmd = command.trim()
    setTerminalLogs(prev => [...prev, `$ ${cleanCmd}`])
    setIsExecutingCommand(true)
    try {
      const res = await workspaceApi.executeCommand(activeProjectId, cleanCmd)
      if (res.stdout) {
        setTerminalLogs(prev => [...prev, res.stdout])
      }
      if (res.stderr) {
        setTerminalLogs(prev => [...prev, `[STDERR] ${res.stderr}`])
      }
      setTerminalLogs(prev => [...prev, `[Process completed: exit code ${res.exit_code}]`])
    } catch (err: any) {
      setTerminalLogs(prev => [...prev, `[Execution Error] ${err.message}`])
    } finally {
      setIsExecutingCommand(false)
      setTerminalInput('')
      setTimeout(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  // Run project test suite
  const handleRunTests = async () => {
    if (!activeProjectId) return
    setIsTesting(true)
    setActiveBottomTab('tests')
    try {
      const res = await testsApi.runTests(activeProjectId)
      setTestRunData(res)
      if (res.status === 'PASSED') {
        showToast(`Tests passed: ${res.passed}/${res.total} tests`, 'success')
      } else {
        showToast(`Tests finished with ${res.failed} failure(s)`, 'error')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to execute test runner', 'error')
    } finally {
      setIsTesting(false)
    }
  }

  // ==========================================
  // 5. AI Assistant Panel
  // ==========================================
  const handleSendAIMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!activeProjectId || !aiInput.trim() || isSendingChat) return

    const userText = aiInput.trim()
    const userMsgId = `user-${Date.now()}`
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setAiMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: userText, timestamp: timeNow }
    ])
    setAiInput('')
    setIsSendingChat(true)

    try {
      const res: any = await liveApi.chat(activeProjectId, userText)
      const replyText = res?.reply || res?.message || 'Request accepted.'

      setAiMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
      loadWorkspaceFiles()
    } catch (err: any) {
      setAiMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: `Unable to query AI engine: ${err.message || 'Please check Gemini API key in Settings.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'error'
        }
      ])
    } finally {
      setIsSendingChat(false)
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }

  // ==========================================
  // Resizable Bottom Panel Drag Handle
  // ==========================================
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingBottom(true)

    const startY = e.clientY
    const startHeight = bottomHeight

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY
      const newHeight = Math.max(120, Math.min(560, startHeight + deltaY))
      setBottomHeight(newHeight)
    }

    const onMouseUp = () => {
      setIsDraggingBottom(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Filter file tree by search
  const filteredFiles = useMemo(() => {
    if (!fileSearchQuery.trim()) return fileList

    const query = fileSearchQuery.toLowerCase()
    const filterItems = (items: FileItem[]): FileItem[] => {
      const filtered: FileItem[] = []
      for (const item of items) {
        if (item.isFolder && item.children) {
          const childrenMatch = filterItems(item.children)
          if (childrenMatch.length > 0 || item.name.toLowerCase().includes(query)) {
            filtered.push({ ...item, children: childrenMatch })
          }
        } else if (item.name.toLowerCase().includes(query) || item.path.toLowerCase().includes(query)) {
          filtered.push(item)
        }
      }
      return filtered
    }
    return filterItems(fileList)
  }, [fileList, fileSearchQuery])

  // Render file tree recursively
  const renderTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => {
      const isOpen = openFolders[item.path] ?? false
      const isSelected = selectedFilePath === item.path
      const isModified = modifiedTabs.includes(item.path)

      if (item.isFolder) {
        return (
          <div key={item.path} className="select-none">
            <button
              type="button"
              onClick={() => setOpenFolders(prev => ({ ...prev, [item.path]: !isOpen }))}
              className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-[#A8B8C8] hover:text-[#EDF3F8] hover:bg-[#121D26] rounded transition-colors text-left font-mono cursor-pointer"
              style={{ paddingLeft: `${Math.max(6, depth * 14)}px` }}
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#788B9B] flex-shrink-0" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-[#788B9B] flex-shrink-0" strokeWidth={1.5} />
              )}
              <FileIcon name={item.name} isFolder={true} isOpen={isOpen} />
              <span className="truncate">{item.name}</span>
            </button>
            {isOpen && item.children && renderTree(item.children, depth + 1)}
          </div>
        )
      }

      return (
        <button
          key={item.path}
          type="button"
          onClick={() => openFile(item.path)}
          className={`w-full flex items-center justify-between px-2 py-1 text-xs font-mono rounded transition-colors text-left cursor-pointer ${
            isSelected
              ? 'bg-[#142332] text-[#EDF3F8] border-l-2 border-[#15BDEB] font-medium'
              : 'text-[#A8B8C8] hover:text-[#EDF3F8] hover:bg-[#121D26] border-l-2 border-transparent'
          }`}
          style={{ paddingLeft: `${Math.max(16, depth * 14 + 14)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon name={item.name} />
            <span className="truncate">{item.name}</span>
          </div>
          {isModified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mr-1" />}
        </button>
      )
    })
  }

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0D141B] select-none">
        <Code2 className="w-12 h-12 text-[#788B9B] mb-3" strokeWidth={1.5} />
        <h2 className="font-display text-base font-semibold text-[#EDF3F8]">No Active Project Selected</h2>
        <p className="text-xs text-[#788B9B] mt-1 max-w-sm">
          Please select or create a project from the top header to explore files, edit code, and preview applications.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D141B] overflow-hidden text-[#EDF3F8] select-none font-sans relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-3.5 py-2 rounded-md shadow-xl text-xs font-mono flex items-center gap-2 border animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-[#121D26] border-[#2BC879] text-[#2BC879]'
              : toastMessage.type === 'error'
              ? 'bg-[#121D26] border-[#EF4444] text-[#EF4444]'
              : 'bg-[#121D26] border-[#15BDEB] text-[#EDF3F8]'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {toastMessage.type === 'info' && <Sparkles className="w-3.5 h-3.5 text-[#15BDEB] flex-shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Workspace Upper Body: [File Explorer] | [Center Canvas] | [AI Assistant] */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* 1. PROJECT FILE EXPLORER (~250px) */}
        {!isFileExplorerCollapsed ? (
          <aside className="w-[250px] bg-[#0B131A] border-r border-[#263744] flex flex-col flex-shrink-0 z-10 select-none">
            {/* Header: Project Files & Controls */}
            <div className="h-10 px-3 border-b border-[#263744] flex items-center justify-between flex-shrink-0 bg-[#0B131A]">
              <span className="font-display font-medium text-xs text-[#EDF3F8] tracking-wider uppercase">
                Project Files
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsSearchingFiles(!isSearchingFiles)}
                  title="Search Files"
                  className={`p-1 rounded transition-colors ${
                    isSearchingFiles ? 'text-[#15BDEB] bg-[#121D26]' : 'text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26]'
                  }`}
                  aria-label="Search files"
                >
                  <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(true)}
                  title="Create New File"
                  className="p-1 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] transition-colors"
                  aria-label="Create file"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={loadWorkspaceFiles}
                  title="Refresh Files"
                  className="p-1 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] transition-colors"
                  aria-label="Refresh files"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin text-[#15BDEB]' : ''}`} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFileExplorerCollapsed(true)}
                  title="Collapse File Explorer"
                  className="p-1 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] transition-colors"
                  aria-label="Collapse explorer"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Optional Search Input */}
            {isSearchingFiles && (
              <div className="p-2 border-b border-[#263744] bg-[#0D141B]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#788B9B] absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fileSearchQuery}
                    onChange={(e) => setFileSearchQuery(e.target.value)}
                    placeholder="Filter files..."
                    autoFocus
                    className="w-full bg-[#121D26] border border-[#263744] rounded pl-7 pr-2 py-1 text-xs text-[#EDF3F8] placeholder-[#788B9B] focus:outline-none focus:border-[#15BDEB]"
                  />
                </div>
              </div>
            )}

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {filteredFiles.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#788B9B]">
                  {isLoadingFiles
                    ? 'Loading workspace files...'
                    : fileSearchQuery
                    ? 'No matching files found.'
                    : 'No files found in workspace.'}
                </div>
              ) : (
                renderTree(filteredFiles)
              )}
            </div>
          </aside>
        ) : (
          /* Collapsed strip for file explorer */
          <div className="w-9 bg-[#0B131A] border-r border-[#263744] flex flex-col items-center py-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsFileExplorerCollapsed(false)}
              title="Expand File Explorer"
              className="p-1.5 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] cursor-pointer"
              aria-label="Expand file explorer"
            >
              <PanelLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* 2. MAIN CANVAS: Top Tabs (Editor | Changes | Preview) & Center Body */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0D141B] overflow-hidden">
          {/* Top Tabs Bar */}
          <div className="h-10 bg-[#0B131A] border-b border-[#263744] flex items-center justify-between px-3 flex-shrink-0">
            {/* Tabs: Editor, Changes, Preview */}
            <div className="flex items-center gap-1 h-full">
              <button
                type="button"
                onClick={() => setActiveCanvasTab('editor')}
                className={`h-full px-3.5 text-xs font-medium flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  activeCanvasTab === 'editor'
                    ? 'border-[#15BDEB] text-[#EDF3F8] bg-[#121D26]/60'
                    : 'border-transparent text-[#A8B8C8] hover:text-[#EDF3F8] hover:bg-[#121D26]/30'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Editor</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCanvasTab('changes')}
                className={`h-full px-3.5 text-xs font-medium flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  activeCanvasTab === 'changes'
                    ? 'border-[#15BDEB] text-[#EDF3F8] bg-[#121D26]/60'
                    : 'border-transparent text-[#A8B8C8] hover:text-[#EDF3F8] hover:bg-[#121D26]/30'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Changes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCanvasTab('preview')}
                className={`h-full px-3.5 text-xs font-medium flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                  activeCanvasTab === 'preview'
                    ? 'border-[#15BDEB] text-[#EDF3F8] bg-[#121D26]/60'
                    : 'border-transparent text-[#A8B8C8] hover:text-[#EDF3F8] hover:bg-[#121D26]/30'
                }`}
              >
                <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Preview</span>
                {previewStatus.status === 'RUNNING' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2BC879] animate-pulse" />
                )}
              </button>
            </div>

            {/* Right Canvas Actions matching reference: Review Changes, Open Preview, Fullscreen */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveCanvasTab('changes')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors border cursor-pointer ${
                  activeCanvasTab === 'changes'
                    ? 'bg-[#182630] text-[#EDF3F8] border-[#15BDEB]/40'
                    : 'bg-[#121D26] hover:bg-[#182630] border-[#263744] text-[#EDF3F8]'
                }`}
              >
                Review Changes
              </button>

              <button
                type="button"
                onClick={() => {
                  if (previewStatus.status === 'RUNNING' && previewStatus.url) {
                    window.open(previewStatus.url, '_blank')
                  } else {
                    setActiveCanvasTab('preview')
                  }
                }}
                className="bg-[#15BDEB] hover:bg-[#12A8D3] text-[#0D141B] text-xs font-semibold px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <span>Open Preview</span>
                <ExternalLink className="w-3 h-3 stroke-[2.2]" />
              </button>

              <button
                type="button"
                onClick={() => setIsCanvasMaximized(!isCanvasMaximized)}
                title={isCanvasMaximized ? 'Restore View' : 'Maximize Canvas'}
                className="p-1 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] transition-colors cursor-pointer ml-1"
                aria-label={isCanvasMaximized ? "Restore Canvas" : "Maximize Canvas"}
              >
                {isCanvasMaximized ? <Minimize2 className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Canvas View Content */}
          <div className="flex-1 min-h-0 relative overflow-hidden bg-[#0D141B]">
            {/* VIEW A: EDITOR */}
            {activeCanvasTab === 'editor' && (
              <div className="h-full w-full flex flex-col overflow-hidden">
                {selectedFilePath ? (
                  <CodeEditor
                    currentFilePath={selectedFilePath}
                    code={codeContent}
                    openTabs={openTabs}
                    onSelectTab={openFile}
                    onCloseTab={handleCloseTab}
                    onNewFileClick={() => setIsNewFileModalOpen(true)}
                    onRunCode={() => executeTerminalCommand(selectedFilePath.endsWith('.py') ? `python ${selectedFilePath}` : `cat ${selectedFilePath}`)}
                    onSaveCode={handleSaveFile}
                    onChangeCode={(val) => {
                      setCodeContent(val)
                      if (!modifiedTabs.includes(selectedFilePath)) {
                        setModifiedTabs(prev => [...prev, selectedFilePath])
                      }
                    }}
                    isSaving={isSaving}
                    isRunning={isExecutingCommand}
                    isModified={modifiedTabs.includes(selectedFilePath)}
                    modifiedTabs={modifiedTabs}
                  />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#788B9B]">
                    <Code2 className="w-10 h-10 mb-2 text-[#788B9B]/60" strokeWidth={1.5} />
                    <p className="text-xs">Select a file from the explorer on the left to edit code.</p>
                  </div>
                )}
              </div>
            )}

            {/* VIEW B: CHANGES (DIFF) */}
            {activeCanvasTab === 'changes' && (
              <div className="h-full w-full overflow-hidden">
                {isLoadingDiff ? (
                  <div className="flex items-center justify-center h-48 text-[#788B9B] gap-2 font-mono text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-[#15BDEB]" />
                    <span>Inspecting working tree changes...</span>
                  </div>
                ) : (
                  <DiffViewer diffText={diffText} filePath={selectedFilePath} />
                )}
              </div>
            )}

            {/* VIEW C: PREVIEW */}
            {activeCanvasTab === 'preview' && (
              <div className="h-full w-full flex flex-col overflow-hidden p-4 bg-[#0D141B]">
                {/* Preview Toolbar */}
                <div className="bg-[#121D26] border border-[#263744] rounded-t-md px-4 py-2.5 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        previewStatus.status === 'RUNNING'
                          ? 'bg-[#2BC879] animate-pulse'
                          : previewStatus.status === 'STARTING'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-slate-600'
                      }`}
                    />
                    <span className="font-mono text-xs text-[#EDF3F8] uppercase tracking-wider font-semibold">
                      {previewStatus.status.replace('_', ' ')}
                    </span>
                    {previewStatus.url && (
                      <span className="font-mono text-xs text-[#15BDEB] truncate max-w-sm">
                        {previewStatus.url}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {previewStatus.status !== 'RUNNING' ? (
                      <button
                        type="button"
                        onClick={handleStartApp}
                        disabled={isPreviewLoading}
                        className="bg-[#0878F9] hover:bg-[#076AD9] text-white text-xs font-semibold px-3 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isPreviewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>Run App</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleStartApp}
                          disabled={isPreviewLoading}
                          className="bg-[#182630] hover:bg-[#263744] text-[#EDF3F8] text-xs font-medium px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-[#263744] cursor-pointer"
                          title="Restart App"
                        >
                          <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                          <span>Restart</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleStopApp}
                          disabled={isPreviewLoading}
                          className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-medium px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-rose-500/30 cursor-pointer"
                          title="Stop App"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop App</span>
                        </button>
                        {previewStatus.url && (
                          <a
                            href={previewStatus.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#182630] hover:bg-[#263744] text-[#EDF3F8] text-xs font-medium px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-[#263744]"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Framed Preview Canvas */}
                <div className="flex-1 min-h-0 bg-[#0B131A] border-x border-b border-[#263744] rounded-b-md overflow-hidden relative">
                  {previewStatus.status === 'RUNNING' && previewStatus.url ? (
                    <iframe
                      src={previewStatus.url}
                      title="Application Live Preview"
                      className="w-full h-full border-0 bg-white"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="w-12 h-12 rounded-full bg-[#121D26] border border-[#263744] flex items-center justify-center text-[#15BDEB] mb-3">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-[#EDF3F8]">
                        Run your application to see its preview.
                      </h3>
                      <p className="text-xs text-[#788B9B] mt-1 max-w-sm mb-4">
                        The live preview will render your project's frontend or API in an isolated container port.
                      </p>
                      <button
                        type="button"
                        onClick={handleStartApp}
                        disabled={isPreviewLoading}
                        className="bg-[#0878F9] hover:bg-[#076AD9] text-white text-xs font-semibold px-4 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        {isPreviewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>Run App</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. RIGHT AI ASSISTANT PANEL (~350px) */}
        {!isAIAssistantCollapsed ? (
          <aside className="w-[350px] bg-[#0B131A] border-l border-[#263744] flex flex-col flex-shrink-0 z-10 select-none">
            {/* Header: AI Assistant & Project Plan Tabs */}
            <div className="h-10 px-3 border-b border-[#263744] flex items-center justify-between flex-shrink-0 bg-[#0B131A]">
              <div className="flex items-center gap-1 h-full">
                <button
                  type="button"
                  onClick={() => setActiveAITab('assistant')}
                  className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                    activeAITab === 'assistant'
                      ? 'border-[#15BDEB] text-[#EDF3F8] font-semibold'
                      : 'border-transparent text-[#788B9B] hover:text-[#EDF3F8]'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-[#15BDEB]" strokeWidth={1.5} />
                  <span>AI Assistant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAITab('plan')}
                  className={`h-full px-3 text-xs font-medium flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                    activeAITab === 'plan'
                      ? 'border-[#15BDEB] text-[#EDF3F8] font-semibold'
                      : 'border-transparent text-[#788B9B] hover:text-[#EDF3F8]'
                  }`}
                >
                  <span>Project Plan</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsAIAssistantCollapsed(true)}
                title="Collapse AI Assistant"
                className="p-1 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] transition-colors cursor-pointer"
                aria-label="Collapse assistant"
              >
                <PanelRightClose className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Assistant Body */}
            {activeAITab === 'assistant' ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 min-h-0">
                {/* Real Event Stage Progress Checklist */}
                {(liveState?.status === 'RUNNING' || currentStage) && (
                  <div className="p-3 bg-[#101A24] border border-[#15BDEB]/30 rounded-xl space-y-2.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#15BDEB] font-semibold flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Workflow: {currentStage || (liveState?.status === 'RUNNING' ? 'Running' : 'Ready')}</span>
                      </div>
                      {liveState?.status === 'RUNNING' && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await liveApi.cancel(activeProjectId)
                              showToast('Cancellation requested', 'info')
                            } catch (err: any) {
                              showToast(err.message || 'Cancel failed', 'error')
                            }
                          }}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-mono underline"
                        >
                          Cancel Run
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      {[
                        { role: 'ARCHITECT', title: 'Architecture Plan', desc: 'Requirements & system design' },
                        { role: 'DEVELOPER', title: 'Code Synthesis', desc: 'Generating application files' },
                        { role: 'TESTER', title: 'Automated Tests', desc: 'Testing acceptance criteria in Docker' },
                        { role: 'DEBUGGER', title: 'Failure Diagnosis & Fix', desc: 'Targeted repairs for failing tests' },
                        { role: 'REVIEWER', title: 'Quality & Security Review', desc: 'Analyzing source and test evidence' },
                        { role: 'OUTPUT_AI', title: 'Runtime Startup', desc: 'HTTP health check & preview port' }
                      ].map((stage) => {
                        const agentStatus = liveState?.agents?.[stage.role] || 'IDLE'
                        const isDone = agentStatus === 'COMPLETED'
                        const isCurrent = agentStatus === 'RUNNING'
                        const isFailed = agentStatus === 'FAILED' || agentStatus === 'BLOCKED'

                        return (
                          <div key={stage.role} className="flex items-start gap-2.5">
                            {isDone ? (
                              <div className="w-4 h-4 rounded-full bg-[#15BDEB] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Check className="w-2.5 h-2.5 text-[#0B131A] stroke-[3]" />
                              </div>
                            ) : isFailed ? (
                              <div className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-[9px] text-white font-bold leading-none">✕</span>
                              </div>
                            ) : isCurrent ? (
                              <div className="w-4 h-4 rounded-full border-2 border-[#15BDEB] flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#15BDEB]" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <div className={`font-medium leading-none ${isFailed ? 'text-rose-400' : isCurrent ? 'text-[#EDF3F8]' : isDone ? 'text-[#A8B8C8]' : 'text-[#788B9B]'}`}>
                                {stage.title}
                              </div>
                              <div className="text-[10px] text-[#788B9B] mt-0.5 leading-tight">
                                {stage.desc}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`rounded-xl p-3 text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'max-w-[88%] bg-[#152332] border border-[#263744] text-[#EDF3F8]'
                          : msg.status === 'error'
                          ? 'max-w-[94%] bg-rose-500/10 border border-rose-500/30 text-rose-200'
                          : 'max-w-[94%] bg-[#101A24] border border-[#263744] text-[#EDF3F8]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-[#788B9B] font-mono">
                        {msg.role === 'user' ? (
                          <>
                            <User className="w-3 h-3 text-[#A8B8C8]" strokeWidth={1.5} />
                            <span>You</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-[#15BDEB]" strokeWidth={1.5} />
                            <span>Assistant</span>
                          </>
                        )}
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div className="whitespace-pre-wrap select-text">{msg.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            ) : (
              /* Project Plan Tab */
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 min-h-0 text-xs">
                <div className="p-3 bg-[#101A24] border border-[#263744] rounded-xl space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#15BDEB] font-semibold">
                    Current Project Blueprint
                  </div>
                  <h4 className="font-display font-semibold text-sm text-[#EDF3F8]">
                    {activeProject.name}
                  </h4>
                  <p className="text-[11px] text-[#A8B8C8] leading-relaxed">
                    {activeProject.description || 'Continuous Multi-Agent Engineering Architecture.'}
                  </p>
                  <div className="pt-2 border-t border-[#263744] flex items-center justify-between text-[11px] font-mono text-[#788B9B]">
                    <span>Iteration: {activeProject.current_iteration || 1}</span>
                    <span className="text-[#2BC879] capitalize">{activeProject.status || 'Active'}</span>
                  </div>
                </div>

                <div className="p-3 bg-[#101A24] border border-[#263744] rounded-xl space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#788B9B] font-semibold">
                    Active Architecture Stages
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#A8B8C8]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2BC879]" />
                      <span>Requirements Specification</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#A8B8C8]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2BC879]" />
                      <span>Workspace Structure & Files</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#EDF3F8]">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[#15BDEB] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#15BDEB]" />
                      </span>
                      <span>Automated Code Verification</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#788B9B]">
                      <Circle className="w-3.5 h-3.5 text-slate-600" />
                      <span>Deployment & Previews</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Persistent Message Composer matching reference */}
            <div className="p-3 border-t border-[#263744] bg-[#0B131A] flex-shrink-0">
              {liveState?.plan && !liveState.approved && <section className="p-3 text-xs border-t border-[#263744] space-y-2">
                <strong>Architect plan</strong><p>{liveState.plan.architecture}</p>
                <ul className="list-disc pl-4">{liveState.plan.acceptance.map(item=><li key={item}>{item}</li>)}</ul>
                {liveState.plan.questions.map(question=><p key={question}>Question: {question}</p>)}
                {!liveState.plan.questions.length && <button type="button" disabled={isAiRunning} className="bg-[#0878F9] text-white px-3 py-2 rounded" onClick={async()=>{try{await liveApi.approve(activeProjectId)}catch(error){showToast(error instanceof Error?error.message:'Approval failed','error')}}}>Approve project files, tests & local preview</button>}
              </section>}
              {liveState?.status==='RUNNING' && <button type="button" className="p-2 text-xs text-[#15BDEB]" onClick={()=>void liveApi.cancel(activeProjectId).catch(error=>showToast(error.message,'error'))}>Cancel run</button>}
              <form onSubmit={handleSendAIMessage} className="relative">
                <div className="flex items-center bg-[#121D26] border border-[#263744] focus-within:border-[#15BDEB] rounded-lg px-2.5 py-1.5 transition-colors">
                  <button
                    type="button"
                    className="p-1 text-[#788B9B] hover:text-[#EDF3F8] transition-colors cursor-pointer flex-shrink-0"
                    title="Attach Context File"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>

                  <textarea
                    rows={1}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendAIMessage()
                      }
                    }}
                    placeholder="Ask me to make changes, add features, or fix issues…"
                    className="flex-1 bg-transparent border-none text-xs text-[#EDF3F8] placeholder-[#788B9B] focus:outline-none resize-none custom-scrollbar font-sans px-2 py-1 max-h-24"
                  />

                  {liveState?.status === 'RUNNING' && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await liveApi.cancel(activeProjectId)
                          showToast('Cancellation requested', 'info')
                        } catch (err: any) {
                          showToast(err.message || 'Cancel failed', 'error')
                        }
                      }}
                      className="p-1.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer flex-shrink-0 transition-colors mr-1"
                      title="Cancel active run"
                      aria-label="Cancel active run"
                    >
                      <Square className="w-3 h-3 fill-current" />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!aiInput.trim() || isSendingChat}
                    className="p-1.5 rounded-md text-[#0D141B] bg-[#15BDEB] hover:bg-[#12A8D3] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex-shrink-0"
                    title="Send Message"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              </form>
            </div>
          </aside>
        ) : (
          /* Collapsed strip for AI Assistant */
          <div className="w-9 bg-[#0B131A] border-l border-[#263744] flex flex-col items-center py-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsAIAssistantCollapsed(false)}
              title="Expand AI Assistant"
              className="p-1.5 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] cursor-pointer"
              aria-label="Expand AI assistant"
            >
              <PanelRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. BOTTOM EXPANDABLE PANEL (Beneath explorer, canvas, assistant) */}
      {/* ============================================================== */}
      <div
        style={{ height: isBottomCollapsed ? '36px' : isBottomMaximized ? '65%' : `${bottomHeight}px` }}
        className="w-full bg-[#0B131A] border-t border-[#263744] flex flex-col flex-shrink-0 transition-[height] duration-150 z-20 relative select-none"
      >
        {/* Drag handle for resizing (active when not collapsed/maximized) */}
        {!isBottomCollapsed && !isBottomMaximized && (
          <div
            onMouseDown={handleMouseDownResize}
            className={`absolute top-0 left-0 right-0 h-1 cursor-ns-resize transition-colors z-30 ${isDraggingBottom ? 'bg-[#15BDEB]' : 'hover:bg-[#15BDEB]'}`}
            title="Drag to resize terminal panel"
          />
        )}

        {/* Panel Header & Tabs: Terminal | Tests | Issues */}
        <div className="h-9 px-3 border-b border-[#263744] flex items-center justify-between flex-shrink-0 bg-[#0B131A]">
          <div className="flex items-center gap-1 h-full">
            <button
              type="button"
              onClick={() => {
                setActiveBottomTab('terminal')
                if (isBottomCollapsed) setIsBottomCollapsed(false)
              }}
              className={`h-full px-3 text-xs font-mono flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeBottomTab === 'terminal' && !isBottomCollapsed
                  ? 'border-[#15BDEB] text-[#EDF3F8] bg-[#121D26]/60 font-semibold'
                  : 'border-transparent text-[#788B9B] hover:text-[#EDF3F8]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-[#15BDEB]" strokeWidth={1.5} />
              <span>Terminal</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveBottomTab('tests')
                if (isBottomCollapsed) setIsBottomCollapsed(false)
              }}
              className={`h-full px-3 text-xs font-mono flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeBottomTab === 'tests' && !isBottomCollapsed
                  ? 'border-[#15BDEB] text-[#EDF3F8] bg-[#121D26]/60 font-semibold'
                  : 'border-transparent text-[#788B9B] hover:text-[#EDF3F8]'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Tests</span>
              {testRunData && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${testRunData.status === 'PASSED' ? 'bg-[#2BC879]/20 text-[#2BC879]' : 'bg-rose-500/20 text-rose-400'}`}>
                  {testRunData.passed}/{testRunData.total}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveBottomTab('issues')
                if (isBottomCollapsed) setIsBottomCollapsed(false)
              }}
              className={`h-full px-3 text-xs font-mono flex items-center gap-1.5 transition-colors border-b-2 cursor-pointer ${
                activeBottomTab === 'issues' && !isBottomCollapsed
                  ? 'border-[#15BDEB] text-[#EDF3F8] bg-[#121D26]/60 font-semibold'
                  : 'border-transparent text-[#788B9B] hover:text-[#EDF3F8]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Issues</span>
            </button>
          </div>

          {/* Right controls: Clear, Maximize, Collapse */}
          <div className="flex items-center gap-1">
            {activeBottomTab === 'terminal' && (
              <button
                type="button"
                onClick={() => setTerminalLogs(['Console cleared. Ready.'])}
                title="Clear Output"
                className="p-1 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] cursor-pointer"
                aria-label="Clear output"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            )}

            {activeBottomTab === 'tests' && (
              <button
                type="button"
                onClick={handleRunTests}
                disabled={isTesting}
                title="Run Pytest Suite"
                className="px-2 py-0.5 rounded text-xs font-mono bg-[#121D26] hover:bg-[#182630] border border-[#263744] text-[#15BDEB] flex items-center gap-1 mr-1 cursor-pointer"
              >
                {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                <span>Run Tests</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsBottomMaximized(!isBottomMaximized)}
              title={isBottomMaximized ? 'Restore Size' : 'Maximize Panel'}
              className="p-1 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] cursor-pointer"
              aria-label={isBottomMaximized ? "Restore panel size" : "Maximize panel size"}
            >
              {isBottomMaximized ? <Minimize2 className="w-3.5 h-3.5" strokeWidth={1.5} /> : <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
            </button>

            <button
              type="button"
              onClick={() => setIsBottomCollapsed(!isBottomCollapsed)}
              title={isBottomCollapsed ? 'Expand Panel' : 'Collapse Panel'}
              className="p-1 rounded text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#121D26] cursor-pointer"
              aria-label={isBottomCollapsed ? "Expand panel" : "Collapse panel"}
            >
              {isBottomCollapsed ? <ChevronDown className="w-3.5 h-3.5 rotate-180" strokeWidth={1.5} /> : <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Panel Body (Visible when not collapsed) */}
        {!isBottomCollapsed && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#0B131A] p-2.5 font-mono text-xs">
            {/* SUBTAB 1: TERMINAL */}
            {activeBottomTab === 'terminal' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar space-y-1 text-[#EDF3F8] whitespace-pre select-text">
                  {terminalLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.startsWith('$')
                          ? 'text-[#15BDEB] font-semibold'
                          : log.startsWith('[STDERR]') || log.startsWith('[Execution Error]')
                          ? 'text-rose-400'
                          : log.startsWith('[Process completed')
                          ? 'text-[#788B9B]'
                          : 'text-[#A8B8C8]'
                      }
                    >
                      {log}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>

                {/* Command Input Prompt */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    executeTerminalCommand(terminalInput)
                  }}
                  className="mt-2 pt-2 border-t border-[#263744] flex items-center gap-2 flex-shrink-0"
                >
                  <span className="text-[#15BDEB] font-bold">$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Enter command (e.g. pytest, python src/main.py, git status)..."
                    disabled={isExecutingCommand}
                    className="flex-1 bg-transparent border-none text-[#EDF3F8] placeholder-[#788B9B] text-xs font-mono focus:outline-none"
                  />
                  {isExecutingCommand && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#15BDEB]" />}
                </form>
              </div>
            )}

            {/* SUBTAB 2: TESTS */}
            {activeBottomTab === 'tests' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 select-text">
                {isTesting ? (
                  <div className="flex items-center justify-center h-32 gap-2 text-[#788B9B]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#15BDEB]" />
                    <span>Running pytest suite in workspace...</span>
                  </div>
                ) : testRunData ? (
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#263744]">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${testRunData.status === 'PASSED' ? 'bg-[#2BC879]/20 text-[#2BC879]' : 'bg-rose-500/20 text-rose-400'}`}>
                          {testRunData.status}
                        </span>
                        <span className="text-[#EDF3F8]">
                          {testRunData.passed} passed, {testRunData.failed} failed of {testRunData.total} total
                        </span>
                        <span className="text-[#788B9B]">({testRunData.duration_seconds}s)</span>
                      </div>
                    </div>
                    <div className="bg-[#121D26] p-3 rounded text-[11px] whitespace-pre text-[#A8B8C8] overflow-x-auto custom-scrollbar">
                      {testRunData.output}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-center text-[#788B9B]">
                    <p>No test runs executed yet in this session.</p>
                    <button
                      type="button"
                      onClick={handleRunTests}
                      className="mt-2 px-3 py-1 bg-[#121D26] hover:bg-[#182630] border border-[#263744] text-[#15BDEB] rounded text-xs transition-colors cursor-pointer"
                    >
                      Run Pytest Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SUBTAB 3: ISSUES */}
            {activeBottomTab === 'issues' && (
              <div className="flex-1 overflow-y-auto custom-scrollbar select-text">
                {testRunData && testRunData.failed > 0 ? (
                  <div className="space-y-2">
                    {testRunData.failures.map((f, i) => (
                      <div key={i} className="p-2.5 rounded bg-rose-500/10 border border-rose-500/25 text-rose-300">
                        <div className="font-semibold text-xs mb-1">{f.test_name}</div>
                        <div className="text-[11px] whitespace-pre-wrap text-rose-200">{f.traceback}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-center text-[#788B9B]">
                    <CheckCircle2 className="w-5 h-5 text-[#2BC879] mb-1" />
                    <p className="text-xs">No active issues detected.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New File Creation Modal */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#121D26] border border-[#263744] rounded-lg w-full max-w-sm p-5 shadow-2xl">
            <h3 className="font-display text-sm font-semibold text-[#EDF3F8] mb-3">Create New Workspace File</h3>
            <form onSubmit={handleCreateNewFile} className="space-y-4">
              <div>
                <label className="block text-xs text-[#788B9B] mb-1">Relative file path</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. src/utils.py or test_extra.py"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full bg-[#0B131A] border border-[#263744] focus:border-[#15BDEB] rounded px-3 py-2 text-xs text-[#EDF3F8] font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(false)}
                  className="px-3 py-1.5 rounded text-xs text-[#788B9B] hover:text-[#EDF3F8] hover:bg-[#182630] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0878F9] hover:bg-[#076AD9] text-white text-xs font-semibold px-3.5 py-1.5 rounded transition-colors cursor-pointer"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
