import React from 'react'

interface CategoryItem {
  name: string
  count: number
  value: string
}

interface MemoryCategoriesProps {
  categories: CategoryItem[]
  activeCategory: string
  onChange: (val: string) => void
}

export const MemoryCategories: React.FC<MemoryCategoriesProps> = ({
  categories,
  activeCategory,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 border-b border-border custom-scrollbar select-none">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.value
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans tracking-wide border cursor-pointer transition-all duration-150 flex-shrink-0 flex items-center gap-2 ${
              isActive
                ? 'bg-accent text-white border-accent shadow-xs'
                : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            <span>{cat.name}</span>
            <span
              className={`inline-block px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                isActive ? 'bg-accent-hover text-white' : 'bg-surface text-text-muted border border-border'
              }`}
            >
              {cat.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
