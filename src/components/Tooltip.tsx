'use client'

import { ReactNode, useState } from 'react'

interface TooltipProps {
  content: string | ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  delay = 200,
  className = '' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    setTimeoutId(id)
  }

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setIsVisible(false)
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 border-l border-t',
    left: 'left-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 rotate-45 border-t border-r',
    right: 'right-full top-1/2 transform -translate-y-1/2 translate-x-1/2 rotate-45 border-b border-l',
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${positionClasses[position]} w-72 bg-uc-black text-uc-text-light text-sm rounded-lg p-3 z-50 border border-uc-purple/30 shadow-xl pointer-events-none`}
        >
          <div className={`absolute ${arrowClasses[position]} w-2 h-2 bg-uc-black border-uc-purple/30`}></div>
          <div className="relative z-10">
            {typeof content === 'string' ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              content
            )}
          </div>
        </div>
      )}
    </div>
  )
}

