import React, { useState } from 'react'
import { Folder, FolderOpen, FileCode, FileText, Search, Plus, FolderPlus, MoreHorizontal, ChevronRight, ChevronDown } from 'lucide-react'
import type { FileNode } from '../mockData'

interface FileExplorerProps {
  files: FileNode[]
  selectedFile: string
  onSelectFile: (filePath: string) => void
  onNewFile: () => void
  onNewFolder: () => void
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFile,
  onSelectFile,
  onNewFile,
  onNewFolder
}) => {
  const [filterQuery, setFilterQuery] = useState('')
  // Pre-expand backend, StudentManagementSystem, and backend folders as required
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'StudentManagementSystem': true,
    'StudentManagementSystem/backend': true,
    'StudentManagementSystem/backend/CONTROLLERS': true,
    'StudentManagementSystem/backend/MODELS': true,
    'StudentManagementSystem/backend/ROUTES': true,
    'StudentManagementSystem/backend/SERVICES': true,
    'StudentManagementSystem/backend/DATABASE': true,
    'StudentManagementSystem/backend/TESTS': true,
  })

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }))
  }

  // Get file-specific icon
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()
    if (ext === 'py') return <FileCode className="w-3.5 h-3.5 text-accent" />
    if (ext === 'md') return <FileText className="w-3.5 h-3.5 text-accent-secondary" />
    if (ext === 'txt') return <FileText className="w-3.5 h-3.5 text-text-muted" />
    return <FileText className="w-3.5 h-3.5 text-text-secondary" />
  }

  // Recursive renderer for the file node
  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = !!expandedFolders[node.path]
    const isSelected = selectedFile === node.path
    const hasChildren = node.children && node.children.length > 0

    // Apply filtering
    if (filterQuery) {
      const matchQuery = (n: FileNode): boolean => {
        if (n.name.toLowerCase().includes(filterQuery.toLowerCase())) return true
        if (n.children) return n.children.some(matchQuery)
        return false
      }
      if (!matchQuery(node)) return null
    }

    if (node.isFolder) {
      return (
        <div key={node.path} className="select-none">
          {/* Folder Item */}
          <div
            onClick={() => toggleFolder(node.path)}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-secondary cursor-pointer transition-colors text-text-secondary hover:text-text-primary text-xs group"
            style={{ paddingLeft: `${depth * 10 + 6}px` }}
          >
            <div className="flex items-center gap-1.5 font-semibold truncate font-sans">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-text-muted flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-text-muted flex-shrink-0" />
                )
              ) : (
                <span className="w-3 h-3 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-accent flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-accent flex-shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>

            {/* Subtle Modified indicator on Folder level */}
            {node.isModified && (
              <span className="w-1.5 h-1.5 bg-warning rounded-full mr-1 flex-shrink-0" />
            )}
          </div>

          {/* Render children if expanded */}
          {isExpanded && node.children && (
            <div className="mt-0.5">
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      )
    } else {
      // File Item
      return (
        <div
          key={node.path}
          onClick={() => onSelectFile(node.path)}
          className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors text-xs font-mono group ${
            isSelected
              ? 'bg-accent/10 text-accent font-bold border-l-2 border-accent pl-[4px]'
              : 'hover:bg-surface-secondary text-text-secondary hover:text-text-primary'
          }`}
          style={{ paddingLeft: isSelected ? `${depth * 10 + 4}px` : `${depth * 10 + 6}px` }}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 flex-shrink-0" />
            {getFileIcon(node.name)}
            <span className="truncate">{node.name}</span>
          </div>

          {/* Modified or Saved Indicators */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {node.isModified && (
              <span className="text-[10px] font-mono text-warning font-bold" title="Modified">
                ●
              </span>
            )}
            {node.isSaved && !node.isModified && (
              <span className="text-[10px] font-mono text-success font-bold" title="Saved">
                ✓
              </span>
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface-base border-r border-border overflow-hidden select-none">
      {/* File Explorer Header toolbar */}
      <div className="h-10 px-3.5 border-b border-border bg-surface-secondary flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider font-mono">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewFile}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-md transition-colors cursor-pointer"
            title="New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNewFolder}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-md transition-colors cursor-pointer"
            title="New Folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-md transition-colors cursor-pointer"
            title="More Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Internal File Search Box */}
      <div className="p-2.5 border-b border-border bg-surface-base flex-shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Filter files..."
            className="w-full h-7 bg-surface-secondary border border-border focus:border-accent rounded-lg text-xs pl-8 pr-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:bg-surface-secondary transition-all font-sans"
          />
        </div>
      </div>

      {/* Folders Tree View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        {files.map(rootNode => renderNode(rootNode))}
      </div>
    </div>
  )
}
