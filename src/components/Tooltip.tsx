'use client'

import { KeyboardEvent, MouseEvent, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

interface TooltipProps {
  content: string | ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
  /** false inside a tappable parent (e.g. a calendar day): hover only, taps go to the parent. */
  tapToOpen?: boolean
}

const GUTTER = 16

/** Info bubble: opens on hover (after `delay`) or tap; a tap keeps it open until an outside tap or Esc. */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
  tapToOpen = true,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [shift, setShift] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const close = useCallback(() => {
    clearTimer()
    setIsPinned(false)
    setIsVisible(false)
  }, [])

  const handleMouseEnter = () => {
    clearTimer()
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const handleMouseLeave = () => {
    clearTimer()
    if (!isPinned) setIsVisible(false)
  }

  const toggle = () => {
    clearTimer()
    if (isPinned) {
      close()
    } else {
      setIsPinned(true)
      setIsVisible(true)
    }
  }

  // Inside a <label> a tap would also focus/toggle the field — keep it on the tooltip
  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggle()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle()
    }
  }

  useEffect(() => {
    if (!isPinned) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close()
    }
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isPinned, close])

  useEffect(() => clearTimer, [])

  // Keep the bubble inside the screen (16px gutter) when the icon sits near an edge
  useLayoutEffect(() => {
    if (!isVisible || !bubbleRef.current) {
      setShift(0)
      return
    }
    const rect = bubbleRef.current.getBoundingClientRect()
    const left = rect.left - shift
    const right = rect.right - shift
    const maxRight = window.innerWidth - GUTTER
    if (left < GUTTER) setShift(GUTTER - left)
    else if (right > maxRight) setShift(maxRight - right)
    else setShift(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, position])

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  }

  return (
    <span
      ref={rootRef}
      role={tapToOpen ? 'button' : undefined}
      tabIndex={tapToOpen ? 0 : undefined}
      aria-expanded={tapToOpen ? isVisible : undefined}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={tapToOpen ? handleClick : undefined}
      onKeyDown={tapToOpen ? handleKeyDown : undefined}
    >
      {children}
      {isVisible && (
        <span
          ref={bubbleRef}
          role="tooltip"
          style={shift ? { marginLeft: shift } : undefined}
          className={`absolute ${positionClasses[position]} block w-72 max-w-[calc(100vw-32px)] bg-uc-text text-uc-bg text-sm font-medium leading-5 text-left normal-case tracking-normal rounded-uc-input px-3.5 py-3 z-50 shadow-uc pointer-events-none`}
        >
          {typeof content === 'string' ? (
            <span className="block whitespace-pre-wrap">{content}</span>
          ) : (
            content
          )}
        </span>
      )}
    </span>
  )
}

