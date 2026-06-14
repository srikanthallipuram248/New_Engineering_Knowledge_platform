import type { Variants, Transition } from 'motion/react'

const ease: Transition['ease'] = [0.16, 1, 0.3, 1] // expo-out feel

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease } },
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease } },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}
