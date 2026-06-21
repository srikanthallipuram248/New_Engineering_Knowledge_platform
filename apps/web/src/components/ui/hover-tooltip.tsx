import { useState, useRef, type ReactNode, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface HoverTooltipProps {
  /** Tooltip body. Short text recommended. */
  content: ReactNode
  /** Element the tooltip is attached to. */
  children: ReactNode
  /** Placement relative to the child. Default 'top'. */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Hover delay in ms. Default 50. */
  delay?: number
  /** Optional explicit className for the tooltip bubble. */
  className?: string
}

const SIDE_OFFSET = 8

/**
 * Lightweight hover tooltip that follows the cursor (sort of — it stays
 * next to the child, not literally tracking the pointer). Pure CSS +
 * Motion fade. No portal, no positioning library.
 */
export function HoverTooltip({
  content,
  children,
  side = 'top',
  delay = 50,
  className,
}: HoverTooltipProps) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function onEnter() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), delay)
  }
  function onLeave() {
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
  }

  const positionStyles: Record<NonNullable<HoverTooltipProps['side']>, CSSProperties> = {
    top: { bottom: `calc(100% + ${SIDE_OFFSET}px)`, left: '50%', transform: 'translateX(-50%)' },
    bottom: { top: `calc(100% + ${SIDE_OFFSET}px)`, left: '50%', transform: 'translateX(-50%)' },
    left: { right: `calc(100% + ${SIDE_OFFSET}px)`, top: '50%', transform: 'translateY(-50%)' },
    right: { left: `calc(100% + ${SIDE_OFFSET}px)`, top: '50%', transform: 'translateY(-50%)' },
  }

  return (
    <span
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      className="relative inline-flex"
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={positionStyles[side]}
            className={cn(
              'pointer-events-none absolute z-50',
              'whitespace-nowrap rounded-md px-2 py-1',
              'text-[11px] font-medium text-foreground',
              'glass-strong shadow-lg shadow-black/30',
              'ring-1 ring-foreground/10',
              className,
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
