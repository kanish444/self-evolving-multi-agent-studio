import React from 'react'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'line' | 'pills' | 'enclosed'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'line',
  className = '',
}) => {
  if (variant === 'pills') {
    return (
      <div className={`inline-flex p-1 bg-surface-secondary border border-border rounded-xl gap-1 select-none ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-120 cursor-pointer ${
                isActive
                  ? 'bg-[#B3441E] text-text-primary shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              }`}
            >
              {tab.icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex border-b border-border space-x-1 overflow-x-auto custom-scrollbar select-none ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-120 cursor-pointer whitespace-nowrap -mb-px ${
              isActive
                ? 'border-[#B3441E] text-[#B3441E] font-semibold'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-[#453228]'
            }`}
          >
            {tab.icon && <span className="w-3.5 h-3.5 flex items-center justify-center">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        )
      })}
    </div>
  )
}
