import { useKV } from '@github/spark/hooks'
import { Section, SiteSettings } from '@/lib/types'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { GlassButton } from '../ui/glass-button'
import { ChartLineUp, Scales, UsersFour, Pause, Play, CaretDown } from '@phosphor-icons/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { ASSET_PATHS } from '@/lib/asset-helpers'

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
  const [videoError, setVideoError] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [scrollIndicatorVisible, setScrollIndicatorVisible] = useState(true)
  
  const heroSection = sections?.find(s => s.type === 'hero')
  const heroMedia = settings?.heroMedia

  // Resolve video URL: use admin setting first, fall back to built-in flag-video asset
  const resolvedVideoUrl = heroMedia?.videoUrl || ASSET_PATHS.videos.usaFlag
  const resolvedPosterUrl = heroMedia?.posterUrl || ASSET_PATHS.images.usFlag50

  const shouldPlayVideo = resolvedVideoUrl && 
    (!prefersReducedMotion || heroMedia?.motionMode === 'full') && 
    heroMedia?.motionMode !== 'off' &&
    !videoError

  const handleVideoLoad = useCallback(() => {
    setVideoLoaded(true)
    setVideoError(false)
  }, [])

  const handleVideoError = useCallback(() => {
    setVideoError(true)
    setVideoLoaded(false)
  }, [])

  useEffect(() => {
    if (videoRef.current && shouldPlayVideo) {
      if (prefersReducedMotion && heroMedia?.motionMode === 'reduced') {
        videoRef.current.pause()
        setIsVideoPaused(true)
      } else {
        videoRef.current.play().catch(() => {
          // Autoplay may be blocked — show poster fallback instead of crashing
          setVideoError(true)
        })
      }
    }
  }, [shouldPlayVideo, prefersReducedMotion, heroMedia?.motionMode])

  useEffect(() => {
    const handleScroll = () => {
      setScrollIndicatorVisible(window.scrollY <= 100)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPaused) {
        videoRef.current.play()
        setIsVideoPaused(false)
      } else {
        videoRef.current.pause()
        setIsVideoPaused(true)
      }
    }
  }

  if (!heroSection || !heroSection.enabled) return null

  const overlayIntensity = heroMedia?.overlayIntensity ?? 0.55
  const vignetteEnabled = heroMedia?.vignetteEnabled ?? true
  const textAlignment = heroMedia?.textAlignment ?? 'center'
  const autoContrast = heroMedia?.autoContrast ?? true
  const adjustedOverlayIntensity = autoContrast ? Math.max(overlayIntensity, 0.55) : overlayIntensity

  return (
    <section 
      id="hero" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Video / Poster Background */}
      {shouldPlayVideo ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ zIndex: 0 }}
            autoPlay
            muted
            loop
            playsInline
            poster={resolvedPosterUrl}
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
          >
            <source src={resolvedVideoUrl} type="video/mp4" />
          </video>

          {/* Dark overlay */}
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity duration-500"
            style={{ zIndex: 1, opacity: adjustedOverlayIntensity }}
          />

          {/* Vignette */}
          {vignetteEnabled && (
            <div 
              className="absolute inset-0"
              style={{
                zIndex: 2,
                background: `
                  radial-gradient(ellipse 120% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%),
                  linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%)
                `
              }}
            />
          )}

          {/* Play/Pause control */}
          <button
            onClick={toggleVideoPlayback}
            className="fixed bottom-6 right-6 z-50 backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 rounded-full p-3 transition-all duration-200 hover:scale-105 shadow-lg"
            aria-label={isVideoPaused ? "Play video" : "Pause video"}
          >
            {isVideoPaused ? (
              <Play className="h-4 w-4 text-white" weight="fill" />
            ) : (
              <Pause className="h-4 w-4 text-white" weight="fill" />
            )}
          </button>
        </>
      ) : (
        <>
          {resolvedPosterUrl ? (
            <>
              <img
                src={resolvedPosterUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 0 }}
              />
              <div 
                className="absolute inset-0 bg-black/60 transition-opacity duration-500"
                style={{ zIndex: 1, opacity: adjustedOverlayIntensity }}
              />
              {vignetteEnabled && (
                <div 
                  className="absolute inset-0"
                  style={{
                    zIndex: 2,
                    background: `
                      radial-gradient(ellipse 120% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%),
                      linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%)
                    `
                  }}
                />
              )}
            </>
          ) : (
            <div 
              className="absolute inset-0"
              style={{
                zIndex: 0,
                background: `linear-gradient(135deg, #0f0d0a 0%, #1a1610 40%, #0d1a12 70%, #1a1025 100%)`,
              }}
            />
          )}
        </>
      )}

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
