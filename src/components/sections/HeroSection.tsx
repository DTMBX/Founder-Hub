import { useKV } from '@github/spark/hooks'
import { Section, SiteSettings } from '@/lib/types'
import { motion, useReducedMotion } from 'framer-motion'
import { GlassButton } from '../ui/glass-button'
import { ChartLineUp, Scales, UsersFour } from '@phosphor-icons/react'

interface HeroSectionProps {
  investorMode: boolean
  onSelectPathway?: (pathway: 'investors' | 'legal' | 'about') => void
}

export default function HeroSection({ investorMode, onSelectPathway }: HeroSectionProps) {
  const [sections] = useKV<Section[]>('founder-hub-sections', [])
  const [settings] = useKV<SiteSettings>('founder-hub-settings', {
    siteName: 'Devon Tyler Barber',
    tagline: 'Founder & Innovator',
    description: 'Building transformative solutions at the intersection of technology and justice.',
    primaryDomain: 'xTx396.online',
    domainRedirects: [],
    analyticsEnabled: true,
    indexingEnabled: true,
    investorModeAvailable: true
  })
  const prefersReducedMotion = useReducedMotion()
  
  const heroSection = sections?.find(s => s.type === 'hero')

  if (!heroSection || !heroSection.enabled) return null

  const animationVariants = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }

  return (
    <section 
      id="hero" 
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 overflow-hidden"
    >
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 20%, oklch(0.25 0.12 250) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 20% 80%, oklch(0.20 0.08 200) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 80% 70%, oklch(0.18 0.06 280) 0%, transparent 60%)
          `,
        }}
      />

      <div 
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0.3 0.05 250) 2px, oklch(0.3 0.05 250) 3px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, oklch(0.3 0.05 250) 2px, oklch(0.3 0.05 250) 3px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      <div className="container mx-auto max-w-6xl text-center relative z-10">
        <motion.div
          {...animationVariants}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6" style={{ letterSpacing: '-0.02em' }}>
            {settings?.siteName || 'Devon Tyler Barber'}
          </h1>
          
          <p className="text-xl sm:text-2xl lg:text-3xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
            {settings?.tagline || 'Founder & Innovator'}
          </p>

          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 max-w-4xl mx-auto">
              <GlassButton
                variant="glassPrimary"
                size="lg"
                className="flex-1 min-h-[120px] sm:min-h-[140px] flex flex-col items-center justify-center gap-3 text-base sm:text-lg"
                onClick={() => onSelectPathway?.('investors')}
              >
                <ChartLineUp className="h-10 w-10 sm:h-12 sm:w-12" />
                <div>
                  <div className="font-bold">Investors</div>
                  <div className="text-xs sm:text-sm opacity-80 mt-1">Projects, Roadmap & Traction</div>
                </div>
              </GlassButton>

              <GlassButton
                variant="glass"
                size="lg"
                className="flex-1 min-h-[120px] sm:min-h-[140px] flex flex-col items-center justify-center gap-3 text-base sm:text-lg"
                onClick={() => onSelectPathway?.('legal')}
              >
                <Scales className="h-10 w-10 sm:h-12 sm:w-12" />
                <div>
                  <div className="font-bold">Legal / Court</div>
                  <div className="text-xs sm:text-sm opacity-80 mt-1">Case Materials & Documentation</div>
                </div>
              </GlassButton>

              <GlassButton
                variant="glass"
                size="lg"
                className="flex-1 min-h-[120px] sm:min-h-[140px] flex flex-col items-center justify-center gap-3 text-base sm:text-lg"
                onClick={() => onSelectPathway?.('about')}
              >
                <UsersFour className="h-10 w-10 sm:h-12 sm:w-12" />
                <div>
                  <div className="font-bold">About / Friends</div>
                  <div className="text-xs sm:text-sm opacity-80 mt-1">Mission, Updates & Contact</div>
                </div>
              </GlassButton>
            </div>

            <div className="text-sm text-muted-foreground">
              Choose your pathway to explore relevant content
            </div>
          </motion.div>
        </motion.div>

        {!prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full p-1 backdrop-blur-sm">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 bg-accent rounded-full mx-auto"
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
