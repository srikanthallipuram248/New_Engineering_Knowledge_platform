import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, FileText, Hash } from 'lucide-react'
import type { ChatSource } from '@/services/api'
import { cn } from '@/lib/utils'

interface SourceCardProps {
  source: ChatSource
  index: number
}

/**
 * Collapsible source citation rendered under an assistant message.
 * Shows filename, relevance score, and a snippet preview.
 */
export function SourceCard({ source, index }: SourceCardProps) {
  const [open, setOpen] = useState(false)

  // rerank_score is roughly a relevance score in [0, 1]; higher = more relevant
  const score = source.rerank_score ?? 0
  const scorePct = Math.round(Math.max(0, Math.min(1, score)) * 100)
  const scoreLabel =
    scorePct >= 75 ? 'High' : scorePct >= 50 ? 'Medium' : 'Low'
  const scoreColor =
    scorePct >= 75
      ? 'text-emerald-400 bg-emerald-500/15 ring-emerald-500/20'
      : scorePct >= 50
        ? 'text-amber-300 bg-amber-500/15 ring-amber-500/20'
        : 'text-muted-foreground bg-foreground/5 ring-foreground/10'

  return (
    <div className="glass-flat overflow-hidden rounded-xl text-xs">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2.5 px-3 py-2 text-left',
          'transition-colors hover:bg-foreground/[0.04]',
        )}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 font-mono text-[10px] font-semibold text-primary ring-1 ring-primary/20">
          {index + 1}
        </span>
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate font-mono text-foreground/90">
          {source.filename}
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1',
            scoreColor,
          )}
        >
          {scoreLabel} · {scorePct}%
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-foreground/[0.06] px-3 py-2.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Hash className="h-3 w-3" />
                Snippet
              </p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/85">
                {source.snippet}
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground/70">
                Document ID: {source.document_id}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
