import React from 'react'

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

export const Divider: React.FC<DividerProps> = ({
  className = '',
  orientation = 'horizontal',
  ...props
}) => {
  if (orientation === 'vertical') {
    return <div className={`w-[1px] bg-border self-stretch ${className}`} {...props} />
  }

  return <div className={`h-[1px] w-full bg-border ${className}`} {...props} />
}
