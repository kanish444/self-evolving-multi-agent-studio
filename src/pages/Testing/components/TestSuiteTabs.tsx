import React from 'react'

interface Tab {
  id: 'ALL' | 'Unit' | 'API' | 'Integration' | 'Security' | 'UI'
  label: string
}

interface TestSuiteTabsProps {
  activeCategory: string
  onChange: (category: 'ALL' | 'Unit' | 'API' | 'Integration' | 'Security' | 'UI') => void
  counts: Record<string, number>
}

export const TestSuiteTabs: React.FC<TestSuiteTabsProps> = ({
  activeCategory,
  onChange,
  counts,
}) => {
  const tabs: Tab[] = [
    { id: 'ALL', label: 'All Tests' },
    { id: 'Unit', label: 'Unit' },
    { id: 'API', label: 'API' },
    { id: 'Integration', label: 'Integration' },
    { id: 'Security', label: 'Security' },
    { id: 'UI', label: 'UI' },
  ]

  return (
    <div className="flex border-b border-border overflow-x-auto custom-scrollbar">
      {tabs.map((tab) => {
        const isActive = tab.id === activeCategory
        const count = counts[tab.id] ?? 0
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 -mb-px transition-all duration-150 cursor-pointer whitespace-nowrap focus:outline-none ${
              isActive
                ? 'border-accent text-accent bg-[rgba(179, 68, 30, 0.1)]'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold font-mono rounded-full border ${
                isActive
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface-secondary text-text-secondary border-border'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
