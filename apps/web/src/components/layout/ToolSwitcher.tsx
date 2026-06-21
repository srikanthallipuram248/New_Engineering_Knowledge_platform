import { motion } from 'motion/react'
import { ScanSearch, BookOpen, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HoverTooltip } from '@/components/ui/hover-tooltip'

export type ToolId = 'analyzer' | 'library'

interface Tool {
  id: ToolId
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  tooltip: string
}

const TOOLS: Tool[] = [
  {
    id: 'analyzer',
    label: 'Repo Analyzer',
    shortLabel: 'Analyzer',
    description: 'Agent 1',
    icon: ScanSearch,
    tooltip: 'Agent 1 — analyze a GitHub repo',
  },
  {
    id: 'library',
    label: 'Knowledge Library',
    shortLabel: 'Library',
    description: 'Agent 2',
    icon: BookOpen,
    tooltip: 'Agent 2 — your document knowledge base',
  },
]

interface ToolSwitcherProps {
  value: ToolId
  onChange: (id: ToolId) => void
  className?: string
}

/**
 * Big pill-style segmented control that swaps between the two main tools.
 * Active pill uses Motion's layoutId for the slide, plus a primary ring
 * + soft glow. Each tab has a hover tooltip describing what it does.
 */
export function ToolSwitcher({ value, onChange, className }: ToolSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Tools"
      className={cn(
        'glass inline-flex items-center gap-1 rounded-2xl p-1.5',
        className,
      )}
    >
      {TOOLS.map((tool) => {
        const isActive = tool.id === value
        const Icon = tool.icon
        return (
          <HoverTooltip key={tool.id} content={tool.tooltip} side="bottom">
            <button
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tool.id)}
              className={cn(
                'relative z-10 flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="tool-switcher-active"
                  className={cn(
                    'absolute inset-0 -z-10 rounded-xl',
                    'bg-primary/15 ring-2 ring-primary/40',
                    'shadow-[0_0_28px_-4px] shadow-primary/50',
                  )}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
                strokeWidth={2.25}
              />
              <span className="hidden sm:inline">{tool.label}</span>
              <span className="sm:hidden">{tool.shortLabel}</span>
              <span
                className={cn(
                  'hidden rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider sm:inline-block',
                  isActive
                    ? 'bg-primary/25 text-primary'
                    : 'bg-foreground/[0.04] text-muted-foreground/60',
                )}
              >
                {tool.description}
              </span>
            </button>
          </HoverTooltip>
        )
      })}
    </div>
  )
}
