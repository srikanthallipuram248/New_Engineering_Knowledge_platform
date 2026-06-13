import { motion } from 'motion/react'

/**
 * Animated aurora gradient background.
 * Fixed positioned, behind everything, non-interactive.
 * Uses three large radial gradients that drift slowly.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Subtle noise / grain overlay to break gradient banding */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Indigo aurora blob — top left */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 h-[80vh] w-[80vh] rounded-full"
        style={{
          background:
            'radial-gradient(circle at center, hsl(248 90% 50% / 0.35) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Cyan aurora blob — bottom right */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-[70vh] w-[70vh] rounded-full"
        style={{
          background:
            'radial-gradient(circle at center, hsl(189 94% 55% / 0.25) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.95, 1.08, 1],
        }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Violet aurora blob — center, subtle */}
      <motion.div
        className="absolute top-1/2 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle at center, hsl(280 80% 60% / 0.18) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [-50, 50, -50],
          y: [-30, 30, -30],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Vignette to keep edges grounded */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, hsl(240 10% 4% / 0.4) 100%)',
        }}
      />
    </div>
  )
}
