import { motion } from 'motion/react'
import { MessageSquare, X, Sparkles } from 'lucide-react'
import { useChatDrawerContext } from './ChatDrawerContext'
import { cn } from '@/lib/utils'

/**
 * Prominent floating action button (bottom-right) that opens/closes the
 * chat drawer. Sits as a top-tier primary action: large pill, vivid
 * gradient, breathing accent glow, persistent Sparkles, and a labelled
 * affordance.
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
      whileHover={open ? undefined : { scale: 1.06, y: -2 }}
      whileTap={open ? undefined : { scale: 0.97, y: 0 }}
      className={cn(
        'group fixed bottom-8 right-8 z-30',
        'h-16 pl-5 pr-7 rounded-full',
        'flex items-center gap-3',
        // Solid gradient surface — high-contrast against the page
        'bg-gradient-to-br from-primary via-primary to-accent',
        'text-primary-foreground',
        'shadow-[0_20px_50px_-12px_hsl(248_90%_50%/0.55),0_8px_20px_-8px_rgba(0,0,0,0.5)]',
        'ring-1 ring-white/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        open && 'pointer-events-none',
      )}
      style={{ pointerEvents: open ? 'none' : 'auto' }}
    >
      {/* Outer breathing halo — bigger, stronger, more saturated */}
      <motion.span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary to-accent blur-2xl"
        animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.18, 1] }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Inner top-highlight to add 3D dimensionality */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/20 to-transparent"
        style={{ mask: 'linear-gradient(to bottom, black, transparent 60%)' }}
      />

      {/* Icon disc — bigger, with a stronger glassy inner ring */}
      <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30 shadow-inner">
        <motion.div
          initial={false}
          animate={{ rotate: open ? 90 : 0, scale: open ? 0.9 : 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {open ? (
            <X className="h-5 w-5" strokeWidth={2.5} />
          ) : (
            <MessageSquare className="h-5 w-5" strokeWidth={2.5} />
          )}
        </motion.div>

        {/* Live indicator dot — bigger, primary ring, gentle ping */}
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-3 w-3"
        >
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/80" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-primary" />
        </span>
      </span>

      {/* Label — always visible now, with sparkles + agent tag */}
      <span className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 opacity-95" strokeWidth={2.25} />
        <span className="text-[15px] font-semibold tracking-tight">Chat</span>
        <span className="ml-0.5 hidden rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider md:inline-block">
          Agent 2
        </span>
      </span>
    </motion.button>
  )
}
