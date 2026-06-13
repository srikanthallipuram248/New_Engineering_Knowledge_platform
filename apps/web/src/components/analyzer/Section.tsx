import { motion } from 'motion/react'
import { fadeInUp } from '@/lib/motion-presets'
import { cn } from '@/lib/utils'

interface SectionProps {
  title: string
  description?: string
  className?: string
  children: React.ReactNode
}

export function Section({ title, description, className, children }: SectionProps) {
  return (
    <motion.section
      variants={fadeInUp}
      className={cn('space-y-3', className)}
    >
      <div className="space-y-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-muted-foreground/70">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </motion.section>
  )
}
