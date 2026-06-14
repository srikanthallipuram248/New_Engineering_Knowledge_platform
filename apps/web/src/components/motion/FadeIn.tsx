import { motion, type HTMLMotionProps } from 'motion/react'
import { fadeIn } from '@/lib/motion-presets'
import { cn } from '@/lib/utils'

interface FadeInProps extends HTMLMotionProps<'div'> {
  delay?: number
  className?: string
}

export function FadeIn({ delay = 0, className, children, ...props }: FadeInProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="show"
      transition={{ delay }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
