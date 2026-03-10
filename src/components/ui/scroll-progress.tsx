import { useScrollProgress } from '@/hooks/use-scroll-progress'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect } from 'react'

export function ScrollProgress() {
  const progress = useScrollProgress()
  const motionProgress = useMotionValue(0)
  const smoothProgress = useSpring(motionProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    motionProgress.set(progress / 100)
  }, [progress, motionProgress])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] origin-left"
      style={{
        scaleX: smoothProgress,
        background: 'linear-gradient(90deg, var(--primary), var(--accent), var(--primary))',
        backgroundSize: '200% 100%',
      }}
    />
  )
}
