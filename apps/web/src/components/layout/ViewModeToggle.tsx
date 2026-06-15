import { motion } from 'motion/react'
import { Square, Columns2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ViewMode = 'tab' | 'split'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  className?: string
}

const MODES: { id: ViewMode; label: string; icon: LucideIcon }[] = [
  { id: 'tab', label: 'Tab', icon: Square },
  { id: 'split', label: 'Split', icon: Columns2 },
]

/**
 * Small two-option toggle: Tab (only one tool visible) vs Split (both side
 * by side). Sits next to the ToolSwitcher when in Tab mode (so you can
 * promote to split), and next to the wordmark when in Split mode.
 */
export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg bg-foreground/[0.04] p-0.5 ring-1 ring-foreground/5',
        className,
      )}
    >
      {MODES.map((mode) => {
        const isActive = mode.id === value
        const Icon = mode.icon
        return (
          <button
            key={mode.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(mode.id)}
            className={cn(
              'relative z-10 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="view-mode-active"
                className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm ring-1 ring-foreground/10"
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />
            )}
            <Icon className="h-3 w-3" strokeWidth={2.25} />
            <span>{mode.label}</span>
          </button>
        )
      })}
    </div>
  )
}
