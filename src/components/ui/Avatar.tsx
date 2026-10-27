import React from 'react'

export interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'offline' | 'busy'
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  status,
  className = '',
}) => {
  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  }

  return (
    <div className="relative inline-block select-none">
      <div
        className={`rounded-full bg-accent/20 border border-accent/40 text-accent font-semibold flex items-center justify-center ${sizes[size]} ${className}`}
      >
        {getInitials(name)}
      </div>
      {status && (
        <span
          className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-background ${
            status === 'online' ? 'bg-success' : status === 'busy' ? 'bg-error' : 'bg-text-muted'
          }`}
        />
      )}
    </div>
  )
}
