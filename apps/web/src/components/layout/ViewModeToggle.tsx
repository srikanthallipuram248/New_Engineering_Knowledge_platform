import { motion } from 'motion/react'
import { Square, Columns2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HoverTooltip } from '@/components/ui/hover-tooltip'

export type ViewMode = 'tab' | 'split'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

const MODES: {
  id: ViewMode
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    id: 'tab',
    label: 'Tab',
    description: 'Show one tool at a time',
    icon: Square,
  },
  {
    id: 'split',
    label: 'Split',
    description: 'Show both tools side by side',
    icon: Columns2,
  },
]

/**
 * Two-option toggle: Tab (only one tool visible) vs Split (both side by side).
 * Active option gets a purple-glow ring + filled background.
 * Hovering either option shows a short tooltip explaining what it does.
 */
export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl bg-foreground/[0.04] p-1 ring-1 ring-foreground/5',
        className,
      )}
    >
      {MODES.map((mode) => {
        const isActive = mode.id === value
        const Icon = mode.icon
        return (
          <HoverTooltip key={mode.id} content={mode.description} side="bottom">
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(mode.id)}
              className={cn(
                'relative z-10 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all duration-150',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="view-mode-active"
                  className={cn(
                    'absolute inset-0 -z-10 rounded-lg',
                    'bg-primary/15 shadow-[0_0_24px_-4px] shadow-primary/60',
                    'ring-1 ring-primary/40',
                  )}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                />
              )}
              <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
              <span>{mode.label}</span>
            </button>
          </HoverTooltip>
        )
      })}
    </div>
  )
}
