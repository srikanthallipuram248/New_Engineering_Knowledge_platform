import { motion } from 'motion/react'
import { MessageSquare, X, Sparkles } from 'lucide-react'
import { useChatDrawerContext } from './ChatDrawerContext'
import { cn } from '@/lib/utils'

/**
 * Prominent floating action button (bottom-right) that opens/closes the
 * chat drawer. Pill-shaped with a solid gradient fill, a labelled "Chat"
 * affordance, a slow-breathing accent glow, and a live indicator dot.
 *
 * Hides itself when the drawer is open (the drawer has its own close button).
 */
export function FloatingChatButton() {
  const { open, toggle } = useChatDrawerContext()

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={open ? 'Close chat' : 'Open chat with your knowledge base'}
      aria-expanded={open}
      initial={false}
      animate={{
        scale: open ? 0.92 : 1,
        opacity: open ? 0 : 1,
      }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      whileHover={open ? undefined : { scale: 1.05 }}
      whileTap={open ? undefined : { scale: 0.97 }}
      className={cn(
        'group fixed bottom-6 right-6 z-30',
        'h-14 pl-4 pr-5 rounded-full',
        'flex items-center gap-2.5',
        // Solid gradient surface — pops against the page, doesn't blend
        'bg-gradient-to-br from-primary to-accent',
        'text-primary-foreground',
        'shadow-2xl shadow-primary/40',
        'ring-1 ring-foreground/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        open && 'pointer-events-none',
      )}
      style={{ pointerEvents: open ? 'none' : 'auto' }}
    >
      {/* Always-on breathing glow (slow pulse) */}
      <motion.span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary to-accent blur-2xl"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Icon container with subtle inner highlight */}
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
        <motion.div
          initial={false}
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {open ? (
            <X className="h-4 w-4" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
        </motion.div>

        {/* Live indicator dot — small, on the icon */}
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-primary"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
        </span>
      </span>

      {/* Label — visible on sm+, hidden when drawer is open */}
      <span className="hidden sm:flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 opacity-90" />
        <span className="text-sm font-semibold tracking-tight">Chat</span>
      </span>
    </motion.button>
  )
}
