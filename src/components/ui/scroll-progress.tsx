import { useScrollProgress } from '@/hooks/use-scroll-progress'
import { motion } from 'framer-motion'

export function ScrollProgress() {
  const progress = useScrollProgress()

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gradient-to-r from-primary via-accent to-primary origin-left"
      style={{
        scaleX: progress / 100,
        transformOrigin: '0%',
      }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: progress / 100 }}
      transition={{ duration: 0.1 }}
    />
  )
}
