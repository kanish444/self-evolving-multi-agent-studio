import React from 'react'

interface LeafLogoProps {
  className?: string
  size?: number
}

export const LeafLogo: React.FC<LeafLogoProps> = ({ className = 'w-6 h-6', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SE-MAESTRO leaf logo"
    >
      {/* Green leaf silhouette */}
      <path
        d="M20.5 3.5C20.5 3.5 13 3.5 8 8.5C4 12.5 3.5 18 3.5 20.5C6 20.5 11.5 20 15.5 16C20.5 11 20.5 3.5 20.5 3.5Z"
        fill="#2BC879"
      />
      {/* Curved central leaf vein */}
      <path
        d="M8.5 15.5C11 13 14.5 9.5 20.5 3.5"
        stroke="#0B131A"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
