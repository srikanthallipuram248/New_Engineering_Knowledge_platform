import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Loader2, GitBranch, FileSearch, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { icon: GitBranch, label: 'Cloning repository' },
  { icon: FileSearch, label: 'Extracting structure' },
  { icon: Brain, label: 'Analyzing with AI' },
] as const

interface LoadingStateProps {
  url: string
}

export function AnalyzerLoadingState({ url }: LoadingStateProps) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= STEPS.length - 1) return
    const t = setTimeout(() => setStep((s) => s + 1), 5500)
    return () => clearTimeout(t)
  }, [step])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="glass flex flex-col items-center px-6 py-14 text-center sm:py-16"
    >
      {/* Spinner */}
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-2xl" />
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground/5">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>

      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        Analyzing your repository
      </h2>
      <p className="mt-1 max-w-sm truncate font-mono text-xs text-muted-foreground">
        {url}
      </p>
      <p className="mt-1 text-xs text-muted-foreground/70">
        This usually takes 20–30 seconds.
      </p>

      {/* Step list */}
      <ul className="mt-7 w-full max-w-sm space-y-1.5">
        {STEPS.map((s, i) => {
          const isActive = i === step
          const isDone = i < step
          const Icon = s.icon
          return (
            <li
              key={s.label}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-foreground/5 bg-foreground/[0.02] px-3.5 py-2.5 text-left text-sm transition-colors',
                isActive && 'border-primary/30 bg-primary/5',
                isDone && 'border-emerald-500/20 bg-emerald-500/5',
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  isActive && 'bg-primary/15 text-primary',
                  isDone && 'bg-emerald-500/15 text-emerald-400',
                  !isActive && !isDone && 'bg-foreground/[0.04] text-muted-foreground/60',
                )}
              >
                {isDone ? (
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 5.29a1 1 0 010 1.42l-7.997 8a1 1 0 01-1.414 0L3.29 10.71a1 1 0 011.42-1.42l3.293 3.295 7-7a1 1 0 011.701.706z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <Icon className={cn('h-3.5 w-3.5', isActive && 'animate-pulse')} />
                )}
              </div>
              <span
                className={cn(
                  'flex-1 text-xs',
                  isActive && 'font-medium text-foreground',
                  isDone && 'text-foreground/80',
                  !isActive && !isDone && 'text-muted-foreground/70',
                )}
              >
                {s.label}
              </span>
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-primary"
                  >
                    Working
                  </motion.span>
                )}
                {isDone && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400"
                  >
                    Done
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}
