import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'relative inline-flex rounded-xl bg-foreground/[0.04] p-1 ring-1 ring-foreground/5',
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-active"
                className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm ring-1 ring-foreground/10"
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />
            )}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
