import { motion, type HTMLMotionProps } from 'motion/react'
import { fadeInUp } from '@/lib/motion-presets'
import { cn } from '@/lib/utils'

interface SlideUpProps extends HTMLMotionProps<'div'> {
  delay?: number
  className?: string
}

export function SlideUp({ delay = 0, className, children, ...props }: SlideUpProps) {
  return (
    <motion.div
      variants={fadeInUp}
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
