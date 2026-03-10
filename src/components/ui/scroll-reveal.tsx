import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, viewportOnce } from '@/lib/motion-variants'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

export function ScrollReveal({ children, delay = 0, className }: ScrollRevealProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay: delay / 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
