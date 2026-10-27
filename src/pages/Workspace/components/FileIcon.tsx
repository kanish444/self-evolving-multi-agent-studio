import React from 'react'
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  Code2,
  Settings,
  Shield,
  Layers
} from 'lucide-react'

interface FileIconProps {
  name: string
  isFolder?: boolean
  isOpen?: boolean
  className?: string
}

export const FileIcon: React.FC<FileIconProps> = ({
  name,
  isFolder = false,
  isOpen = false,
  className = 'w-3.5 h-3.5 flex-shrink-0'
}) => {
  if (isFolder) {
    if (isOpen) {
      return <FolderOpen className={`${className} text-[#F5A623]`} strokeWidth={1.75} />
    }
    return <Folder className={`${className} text-[#F5A623]`} strokeWidth={1.75} />
  }

  const ext = name.split('.').pop()?.toLowerCase() || ''

  switch (ext) {
    case 'tsx':
    case 'jsx':
      // React / TSX icon in bright cyan/blue matching reference
      return <Code2 className={`${className} text-[#15BDEB]`} strokeWidth={1.75} />
    case 'ts':
    case 'js':
      return <FileCode className={`${className} text-[#38BDF8]`} strokeWidth={1.75} />
    case 'py':
      return <FileCode className={`${className} text-[#60A5FA]`} strokeWidth={1.75} />
    case 'css':
    case 'scss':
      return <Layers className={`${className} text-[#F472B6]`} strokeWidth={1.75} />
    case 'json':
      return <FileJson className={`${className} text-[#FBBF24]`} strokeWidth={1.75} />
    case 'md':
      return <FileText className={`${className} text-[#A8B8C8]`} strokeWidth={1.75} />
    case 'gitignore':
    case 'env':
      return <Shield className={`${className} text-[#F87171]`} strokeWidth={1.75} />
    default:
      if (name.includes('config') || ext === 'config') {
        return <Settings className={`${className} text-[#94A3B8]`} strokeWidth={1.75} />
      }
      return <File className={`${className} text-[#788B9B]`} strokeWidth={1.75} />
  }
}
