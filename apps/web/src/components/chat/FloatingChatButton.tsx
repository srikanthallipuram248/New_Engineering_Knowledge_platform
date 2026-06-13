import { motion } from 'motion/react'
import { MessageSquare, X } from 'lucide-react'
import { useChatDrawerContext } from './ChatDrawerContext'
import { cn } from '@/lib/utils'

/**
 * Floating action button (bottom-right) that opens/closes the chat drawer.
 * Hides itself when the drawer is open (the drawer has its own close button).
 */
export function FloatingChatButton() {
  const { open, toggle } = useChatDrawerContext()

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={open ? 'Close chat' : 'Open chat'}
      aria-expanded={open}
      initial={false}
      animate={{
        scale: open ? 0.85 : 1,
        opacity: open ? 0 : 1,
      }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      whileHover={open ? undefined : { scale: 1.06 }}
      whileTap={open ? undefined : { scale: 0.96 }}
      className={cn(
        'group fixed bottom-6 right-6 z-30',
        'h-14 w-14 rounded-2xl',
        'glass-strong',
        'flex items-center justify-center',
        'shadow-xl shadow-primary/20',
        'ring-1 ring-foreground/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        // Hide from pointer events when closed animation completes
        open && 'pointer-events-none',
      )}
      style={{ pointerEvents: open ? 'none' : 'auto' }}
    >
      {/* Soft accent glow behind the icon */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
      />

      <motion.div
        initial={false}
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {open ? (
          <X className="h-5 w-5 text-foreground" />
        ) : (
          <MessageSquare className="h-5 w-5 text-foreground" />
        )}
      </motion.div>

      {/* Subtle live indicator dot */}
      <span
        aria-hidden
        className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background"
      />
    </motion.button>
  )
}
