import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Tooltip } from '../ui/Tooltip'

export interface NavigationItemProps {
  to: string
  label: string
  icon: React.ReactNode
  badge?: string | number
  isCollapsed?: boolean
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  to,
  label,
  icon,
  badge,
  isCollapsed = false,
}) => {
  const location = useLocation()
  
  const isCustomActive = (toPath: string) => {
    if (toPath.includes('?')) {
      const [path, query] = toPath.split('?')
      const params = new URLSearchParams(query)
      const currentParams = new URLSearchParams(location.search)
      let matches = location.pathname === path
      params.forEach((val, key) => {
        if (currentParams.get(key) !== val) matches = false
      })
      return matches
    }
    return location.pathname === toPath && !location.search.includes('tab=releases')
  }

  const active = isCustomActive(to)

  const content = (
    <NavLink to={to} className="block w-full focus:outline-none">
      <div
        className={`group relative flex items-center gap-3 px-3 py-2 text-xs font-sans rounded-md transition-all duration-150 cursor-pointer ${
          active
            ? 'bg-[#142332] text-[#EDF3F8] font-semibold border-l-2 border-[#15BDEB] pl-2.5 shadow-sm'
            : 'text-[#A8B8C8] hover:bg-[#121D26]/60 hover:text-[#EDF3F8] border-l-2 border-transparent pl-2.5'
        }`}
      >
        <span
          className={`w-4 h-4 flex items-center justify-center transition-colors flex-shrink-0 ${
            active ? 'text-[#15BDEB]' : 'text-[#788B9B] group-hover:text-[#A8B8C8]'
          }`}
        >
          {icon}
        </span>
        {!isCollapsed && (
          <span className="truncate flex-1 tracking-tight font-medium text-[13px]">{label}</span>
        )}
        {!isCollapsed && badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-[#182630] border border-[#263744] text-[#A8B8C8]">
            {badge}
          </span>
        )}
      </div>
    </NavLink>
  )

  if (isCollapsed) {
    return (
      <Tooltip content={label} position="right">
        <div className="w-full">{content}</div>
      </Tooltip>
    )
  }

  return content
}
