import { motion } from 'motion/react'
import { ScanSearch, GitBranch, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const examples = [
  'https://github.com/vercel/next.js',
  'https://github.com/microsoft/TypeScript',
  'https://github.com/expressjs/express',
]

interface EmptyStateProps {
  onPick?: (url: string) => void
}

export function AnalyzerEmptyState({ onPick }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass flex flex-col items-center px-6 py-16 text-center sm:py-20"
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary to-accent opacity-40 blur-2xl" />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-xl shadow-primary/30">
          <ScanSearch className="h-7 w-7 text-primary-foreground" />
        </div>
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        Analyze any public GitHub repository
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Paste a URL and Agent 1 will clone the repo, read the structure, and
        produce a full architecture breakdown — summary, tech stack, key
        modules, data flow, design decisions, and more.
      </p>

      <div className="mt-7 flex w-full max-w-md flex-col items-center gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          <Sparkles className="h-3 w-3 text-primary" />
          Try one of these
        </p>
        <div className="flex w-full flex-col gap-1.5">
          {examples.map((url) => (
            <button
              key={url}
              onClick={() => onPick?.(url)}
              className={cn(
                'group flex items-center gap-2.5 rounded-xl border border-foreground/5 bg-foreground/[0.02] px-3.5 py-2.5 text-left text-xs text-foreground/80',
                'transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground',
              )}
            >
              <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              <span className="flex-1 truncate font-mono">{url}</span>
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 transition-colors group-hover:text-primary">
                Try
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
