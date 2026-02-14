import { useKV } from '@github/spark/hooks'
import { Section } from '@/lib/types'
import { motion } from 'framer-motion'

interface HeroSectionProps {
  investorMode: boolean
}

export default function HeroSection({ investorMode }: HeroSectionProps) {
  const [sections] = useKV<Section[]>('founder-hub-sections', [])
  
  const heroSection = sections?.find(s => s.type === 'hero')

  if (!heroSection || !heroSection.enabled) return null

  return (
    <section 
      id="hero" 
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16"
      style={{
        background: `
          radial-gradient(ellipse at top, oklch(0.25 0.08 250) 0%, transparent 50%),
          radial-gradient(ellipse at bottom left, oklch(0.20 0.06 200) 0%, transparent 50%)
        `
      }}
    >
      <div className="container mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
            {heroSection.title || 'Devon Tyler Barber'}
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 leading-relaxed">
            {heroSection.content || 'Founder & Innovator'}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mt-12"
          >
            <a
              href="#projects"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:scale-105 transition-transform"
            >
              View Projects
            </a>
            <a
              href="#contact"
              className="px-6 py-3 border border-border hover:border-accent rounded-lg font-medium hover:bg-accent/10 transition-colors"
            >
              Get in Touch
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full p-1">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-accent rounded-full mx-auto"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
