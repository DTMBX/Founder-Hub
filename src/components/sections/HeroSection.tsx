import { useKV } from '@/lib/local-storage-kv'
import { Section, SiteSettings } from '@/lib/types'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { GlassButton } from '../ui/glass-button'
import { ChartLineUp, Scales, UsersFour, Pause, Play, CaretDown } from '@phosphor-icons/react'
import { useState, useRef, useEffect, useCallback } from 'react'

// Direct Vite static imports — guaranteed to resolve in dev and production
import flagVideoSrc from '@/assets/video/flag-video.mp4'
import flagPosterSrc from '@/assets/images/us-flag-50.png'

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
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoPaused, setIsVideoPaused] = useState(false)
  const [videoReady, setVideoReady] = useState(false)
  const [scrollIndicatorVisible, setScrollIndicatorVisible] = useState(true)
  
  const heroSection = sections?.find(s => s.type === 'hero')
  const heroMedia = settings?.heroMedia

  // Use admin-configured video if set, otherwise always use built-in flag video
  const videoUrl = heroMedia?.videoUrl || flagVideoSrc
  const posterUrl = heroMedia?.posterUrl || flagPosterSrc

  const handleVideoReady = useCallback(() => {
    setVideoReady(true)
  }, [])

  // Attempt autoplay; if blocked, pause gracefully (poster/first frame stays visible)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {
      setIsVideoPaused(true)
    })
  }, [videoReady])

  useEffect(() => {
    const handleScroll = () => {
      setScrollIndicatorVisible(window.scrollY <= 100)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleVideoPlayback = () => {
    const video = videoRef.current
    if (!video) return
    if (isVideoPaused) {
      video.play()
      setIsVideoPaused(false)
    } else {
      video.pause()
      setIsVideoPaused(true)
    }
  }

  // Always render hero - don't depend on KV sections being initialized
  const isEnabled = heroSection?.enabled ?? true

  if (!isEnabled) return null

  const textAlignment = heroMedia?.textAlignment ?? 'center'

  return (
    <section 
      id="hero" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* ── Flag Video Background ── */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
        autoPlay
        muted
        loop
        playsInline
        poster={posterUrl}
        onCanPlayThrough={handleVideoReady}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Cinematic overlay — subtle warm tone to honor the flag */}
      <div 
        className="absolute inset-0 transition-opacity duration-700"
        style={{ 
          zIndex: 1, 
          background: `linear-gradient(
            180deg, 
            rgba(10, 8, 6, 0.45) 0%, 
            rgba(10, 8, 6, 0.35) 30%, 
            rgba(10, 8, 6, 0.30) 50%, 
            rgba(10, 8, 6, 0.40) 75%, 
            rgba(10, 8, 6, 0.55) 100%
          )`
        }}
      />

      {/* Soft vignette — cinematic depth */}
      <div 
        className="absolute inset-0"
        style={{
          zIndex: 2,
          background: `
            radial-gradient(ellipse 130% 90% at 50% 45%, transparent 40%, rgba(0,0,0,0.45) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.35) 100%)
          `
        }}
      />

      {/* Play/Pause — minimal & respectful */}
      <button
        onClick={toggleVideoPlayback}
        className="fixed bottom-6 right-6 z-50 backdrop-blur-xl bg-white/8 border border-white/15 hover:bg-white/15 rounded-full p-3 transition-all duration-300 hover:scale-105 shadow-lg group"
        aria-label={isVideoPaused ? "Play video" : "Pause video"}
      >
        {isVideoPaused ? (
          <Play className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" weight="fill" />
        ) : (
          <Pause className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" weight="fill" />
        )}
      </button>

      {/* Content */}
      <div 
        className={`relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 lg:px-16 py-24 ${
          textAlignment === 'left' ? 'text-left' : 'text-center'
        }`}
      >
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Overline */}
          <motion.p
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base tracking-[0.25em] uppercase font-medium text-white/70 mb-6"
          >
            {settings?.primaryDomain || 'xTx396.online'}
          </motion.p>

          {/* Headline */}
          <h1 
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6 text-white leading-[1.05]" 
            style={{ 
              letterSpacing: '-0.025em',
              textShadow: '0 2px 30px rgba(0,0,0,0.4)',
            }}
          >
            {heroMedia?.headlineText || settings?.siteName || 'Devon Tyler Barber'}
          </h1>
          
          {/* Subhead */}
          <p 
            className="text-lg sm:text-xl lg:text-2xl mb-14 leading-relaxed max-w-2xl text-white/90 font-light" 
            style={{
              textShadow: '0 1px 15px rgba(0,0,0,0.4)',
              letterSpacing: '0.02em',
              ...(textAlignment === 'left' ? {} : { marginLeft: 'auto', marginRight: 'auto' })
            }}
          >
            {heroMedia?.subheadText || settings?.tagline || 'Founder & Innovator'}
          </p>

          {/* CTA Buttons (if configured) */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-10"
          >
            {(heroMedia?.ctaPrimary || heroMedia?.ctaSecondary) && (
              <div className={`flex flex-wrap gap-4 mb-4 ${textAlignment === 'center' ? 'justify-center' : 'justify-start'}`}>
                {heroMedia.ctaPrimary && (
                  <GlassButton
                    variant="glassPrimary"
                    size="lg"
                    onClick={() => window.location.href = heroMedia.ctaPrimary!.url}
                    className="min-w-[180px]"
                  >
                    {heroMedia.ctaPrimary.label}
                  </GlassButton>
                )}
                {heroMedia.ctaSecondary && (
                  <GlassButton
                    variant="glass"
                    size="lg"
                    onClick={() => window.location.href = heroMedia.ctaSecondary!.url}
                    className="min-w-[180px]"
                  >
                    {heroMedia.ctaSecondary.label}
                  </GlassButton>
                )}
              </div>
            )}

            {/* Trinity Pathway Cards */}
            <div className={`flex flex-col sm:flex-row gap-4 max-w-3xl ${textAlignment === 'center' ? 'mx-auto' : ''}`}>
              {[
                { key: 'investors' as const, icon: ChartLineUp, label: 'Investor Mode', desc: 'Projects, Roadmap & Proof', accent: 'from-emerald-500/20 to-emerald-700/5', border: 'hover:border-emerald-400/40' },
                { key: 'legal' as const, icon: Scales, label: 'Court Mode', desc: 'Cases, Filings & Documents', accent: 'from-amber-500/20 to-amber-700/5', border: 'hover:border-amber-400/40' },
                { key: 'about' as const, icon: UsersFour, label: 'Connect Mode', desc: 'Mission, Values & Contact', accent: 'from-purple-500/20 to-purple-700/5', border: 'hover:border-purple-400/40' },
              ].map((pathway, idx) => (
                <motion.div
                  key={pathway.key}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                  className="flex-1"
                >
                  <button
                    onClick={() => onSelectPathway?.(pathway.key)}
                    className={`w-full group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl hover:bg-white/10 ${pathway.border} transition-all duration-300 p-6 sm:p-8 hover:shadow-lg hover:-translate-y-1`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${pathway.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <pathway.icon className="h-8 w-8 sm:h-10 sm:w-10 text-white/80 group-hover:text-white transition-colors" weight="duotone" />
                      <div className="text-center">
                        <div className="text-white font-semibold text-base">{pathway.label}</div>
                        <div className="text-white/60 text-xs mt-1">{pathway.desc}</div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <AnimatePresence>
          {!prefersReducedMotion && scrollIndicatorVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
              <motion.button
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                aria-label="Scroll down"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Explore</span>
                <CaretDown className="h-5 w-5" weight="bold" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
