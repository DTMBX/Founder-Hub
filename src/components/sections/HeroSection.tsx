import { useKV } from '@/lib/local-storage-kv'
import { Section, SiteSettings } from '@/lib/types'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { GlassButton } from '../ui/glass-button'
import { ChartLineUp, Scales, Storefront, Pause, Play, CaretDown, Globe, ShieldCheck, Wrench } from '@phosphor-icons/react'
import { useState, useRef, useEffect, useCallback } from 'react'

// Direct Vite static imports — guaranteed to resolve in dev and production
import flagVideoSrc from '@/assets/video/flag-video.mp4'
import flagPosterSrc from '@/assets/images/us-flag-50.png'

interface HeroSectionProps {
  onSelectPathway?: (pathway: 'investors' | 'legal' | 'about' | 'marketplace') => void
  onScrollToSection?: (sectionId: string) => void
}

export default function HeroSection({ onSelectPathway, onScrollToSection }: HeroSectionProps) {
  const scrollToSection = (sectionId: string) => {
    if (onScrollToSection) {
      onScrollToSection(sectionId)
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        const headerOffset = 72
        const elementPosition = element.getBoundingClientRect().top + window.scrollY
        window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' })
      }
    }
  }
  const [sections] = useKV<Section[]>('founder-hub-sections', [])
  const [settings] = useKV<SiteSettings>('founder-hub-settings', {
    siteName: 'Devon Tyler Barber',
    tagline: 'One Nation under God',
    description: 'Founder building civic technology, home improvement platforms, and accountability tools.',
    primaryDomain: 'devon-tyler.com',
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

  return (
    <section 
      id="hero" 
      aria-labelledby="hero-heading"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      data-content-section="hero"
      data-kv-key="founder-hub-sections,founder-hub-settings"
      data-admin-tab="content"
    >
      {/* ── Flag Video Background ── */}
      <video
        ref={videoRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
        width={1920}
        height={1080}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
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
        className="relative z-10 w-full max-w-[1200px] mx-auto px-5 sm:px-8 lg:px-16 py-24 text-center"
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
            aria-hidden="true"
          >
            {settings?.tagline || 'One Nation under God'}
          </motion.p>

          {/* Mission-first H1 */}
          <h1 
            id="hero-heading"
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 text-white leading-[1.1]" 
            style={{ 
              letterSpacing: '-0.025em',
              textShadow: '0 2px 30px rgba(0,0,0,0.4)',
            }}
          >
            {heroMedia?.headlineText || 'Building Civic Technology for Accountability'}
          </h1>
          
          {/* Subheadline — identifies the person + mission areas */}
          <p 
            className="text-lg sm:text-xl lg:text-2xl mb-14 leading-relaxed max-w-3xl mx-auto text-white/90 font-light" 
            style={{
              textShadow: '0 1px 15px rgba(0,0,0,0.4)',
              letterSpacing: '0.02em',
            }}
          >
            {heroMedia?.subheadText || 'Devon Tyler Barber — Entrepreneur, licensed NJ contractor, and technologist building the Evident e-discovery platform and Tillerstead home improvement services.'}
          </p>

          {/* CTA Buttons (if configured via admin) */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-10"
          >
            {(heroMedia?.ctaPrimary?.url || heroMedia?.ctaSecondary?.url) && (
              <div className="flex flex-wrap gap-4 mb-4 justify-center">
                {heroMedia.ctaPrimary?.url && (
                  <GlassButton
                    variant="glassPrimary"
                    size="lg"
                    onClick={() => window.location.href = heroMedia.ctaPrimary!.url}
                    className="min-w-[180px]"
                  >
                    {heroMedia.ctaPrimary.label}
                  </GlassButton>
                )}
                {heroMedia.ctaSecondary?.url && (
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

            {/* CTA Navigation Grid — 3 cols desktop, 2 cols tablet, 1 col mobile */}
            <nav aria-label="Quick navigation" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
              {[
                { key: 'evident', href: '#evident', icon: ShieldCheck, label: 'Evident E-Discovery', desc: 'Evidence Processing Platform', accent: 'from-emerald-500/20 to-emerald-700/5', border: 'hover:border-emerald-400/40', focusRing: 'focus-visible:ring-emerald-400/60' },
                { key: 'tillerstead', href: '#tillerstead', icon: Wrench, label: 'Tillerstead', desc: 'NJ Licensed Contractor', accent: 'from-teal-500/20 to-teal-700/5', border: 'hover:border-teal-400/40', focusRing: 'focus-visible:ring-teal-400/60' },
                { key: 'projects', href: '#projects-index', icon: Storefront, label: 'All Projects', desc: 'Civic Tech & Satellite Apps', accent: 'from-cyan-500/20 to-cyan-700/5', border: 'hover:border-cyan-400/40', focusRing: 'focus-visible:ring-cyan-400/60' },
                { key: 'about', href: '#about', icon: Globe, label: 'About Devon', desc: 'Entrepreneur & Technologist', accent: 'from-purple-500/20 to-purple-700/5', border: 'hover:border-purple-400/40', focusRing: 'focus-visible:ring-purple-400/60' },
                { key: 'court', href: '#accountability', icon: Scales, label: 'Court & Accountability', desc: 'Public Case Records', accent: 'from-amber-500/20 to-amber-700/5', border: 'hover:border-amber-400/40', focusRing: 'focus-visible:ring-amber-400/60' },
                { key: 'contact', href: '#invest', icon: ChartLineUp, label: 'Invest & Connect', desc: 'Partnerships & Capital', accent: 'from-rose-500/20 to-rose-700/5', border: 'hover:border-rose-400/40', focusRing: 'focus-visible:ring-rose-400/60' },
              ].map((card, idx) => (
                <motion.div
                  key={card.key}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.08 }}
                >
                  <a
                    href={card.href}
                    className={`block w-full group relative overflow-hidden rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl hover:bg-white/10 ${card.border} ${card.focusRing} focus-visible:outline-none focus-visible:ring-2 transition-all duration-300 p-4 sm:p-6 hover:shadow-lg hover:-translate-y-1`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <card.icon className="h-7 w-7 sm:h-9 sm:w-9 text-white/80 group-hover:text-white transition-colors" weight="duotone" aria-hidden="true" />
                      <div className="text-center">
                        <div className="text-white font-semibold text-sm sm:text-base">{card.label}</div>
                        <div className="text-white/60 text-[10px] sm:text-xs mt-0.5">{card.desc}</div>
                      </div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </nav>
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
