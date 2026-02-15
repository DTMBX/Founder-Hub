import { useKV } from '@github/spark/hooks'
import { Section, SiteSettings } from '@/lib/types'
import { motion, useReducedMotion } from 'framer-motion'
import { GlassButton } from '../ui/glass-button'
import { ChartLineUp, Scales, UsersFour, Pause, Play, CaretDown } from '@phosphor-icons/react'
import { useState, useRef, useEffect } from 'react'

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

  const shouldPlayVideo = heroMedia?.videoUrl && 
    (!prefersReducedMotion || heroMedia.motionMode === 'full') && 
    heroMedia.motionMode !== 'off' &&
    !videoError

  useEffect(() => {
    if (videoRef.current && shouldPlayVideo) {
      if (prefersReducedMotion && heroMedia?.motionMode === 'reduced') {
        videoRef.current.pause()
        setIsVideoPaused(true)
      } else {
        videoRef.current.play().catch(() => {
          setVideoError(true)
        })
      }
    }
  }, [shouldPlayVideo, prefersReducedMotion, heroMedia?.motionMode])

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setScrollIndicatorVisible(false)
      } else {
        setScrollIndicatorVisible(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
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

  const animationVariants = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }

  const overlayIntensity = heroMedia?.overlayIntensity ?? 0.5
  const vignetteEnabled = heroMedia?.vignetteEnabled ?? true
  const textAlignment = heroMedia?.textAlignment ?? 'center'
  const autoContrast = heroMedia?.autoContrast ?? false

  const adjustedOverlayIntensity = autoContrast ? Math.max(overlayIntensity, 0.6) : overlayIntensity

  return (
    <section 
      id="hero" 
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 overflow-hidden"
    >
      {shouldPlayVideo ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover -z-20"
            autoPlay
            muted
            loop
            playsInline
            poster={heroMedia?.posterUrl}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
          >
            <source src={heroMedia?.videoUrl} type="video/mp4" />
          </video>

          <div 
            className="absolute inset-0 -z-10 bg-black transition-opacity duration-300"
            style={{ opacity: adjustedOverlayIntensity }}
          />

          {vignetteEnabled && (
            <div 
              className="absolute inset-0 -z-10"
              style={{
                background: `
                  radial-gradient(ellipse 100% 100% at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%),
                  linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)
                `
              }}
            />
          )}

          {(shouldPlayVideo && heroMedia?.motionMode !== 'off') && (
            <button
              onClick={toggleVideoPlayback}
              className="fixed bottom-8 right-8 z-50 backdrop-blur-xl bg-card/90 border border-border hover:border-accent/50 rounded-full p-3 transition-all hover:scale-105"
              aria-label={isVideoPaused ? "Play video" : "Pause video"}
            >
              {isVideoPaused ? (
                <Play className="h-5 w-5" weight="fill" />
              ) : (
                <Pause className="h-5 w-5" weight="fill" />
              )}
            </button>
          )}
        </>
      ) : (
        <>
          {heroMedia?.posterUrl ? (
            <>
              <img
                src={heroMedia.posterUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover -z-20"
              />
              <div 
                className="absolute inset-0 -z-10 bg-black transition-opacity duration-300"
                style={{ opacity: adjustedOverlayIntensity }}
              />
              {vignetteEnabled && (
                <div 
                  className="absolute inset-0 -z-10"
                  style={{
                    background: `
                      radial-gradient(ellipse 100% 100% at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%),
                      linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)
                    `
                  }}
                />
              )}
            </>
          ) : (
            <>
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
            </>
          )}
        </>
      )}

      <div 
        className={`container mx-auto max-w-6xl relative z-10 px-8 ${
          textAlignment === 'left' ? 'text-left' : 'text-center'
        }`}
        style={{
          maxWidth: '1100px',
          padding: '0 clamp(1.5rem, 5vw, 4rem)'
        }}
      >
        <motion.div
          {...animationVariants}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-6 text-white" 
            style={{ 
              letterSpacing: '-0.02em',
              textShadow: '0 2px 20px rgba(0,0,0,0.5), 0 4px 40px rgba(0,0,0,0.3)',
              fontWeight: '700'
            }}
          >
            {heroMedia?.headlineText || settings?.siteName || 'Devon Tyler Barber'}
          </h1>
          
          <p 
            className="text-xl sm:text-2xl lg:text-3xl mb-12 leading-relaxed max-w-3xl text-white/95" 
            style={{
              textShadow: '0 2px 15px rgba(0,0,0,0.5), 0 4px 30px rgba(0,0,0,0.3)',
              fontWeight: '500',
              letterSpacing: '0.01em',
              ...(textAlignment === 'left' ? {} : { marginLeft: 'auto', marginRight: 'auto' })
            }}
          >
            {heroMedia?.subheadText || settings?.tagline || 'Founder & Innovator'}
          </p>

          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-8"
          >
            {(heroMedia?.ctaPrimary || heroMedia?.ctaSecondary) && (
              <div className={`flex flex-wrap gap-4 mb-8 ${textAlignment === 'center' ? 'justify-center' : 'justify-start'}`}>
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

            <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 max-w-4xl ${textAlignment === 'center' ? 'mx-auto' : ''}`}>
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

            <div className={`text-sm ${textAlignment === 'center' ? 'text-center' : 'text-left'}`} style={{ color: 'rgba(255,255,255,0.8)' }}>
              Choose your pathway to explore relevant content
            </div>
          </motion.div>
        </motion.div>

        {!prefersReducedMotion && scrollIndicatorVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-2 text-white/60 hover:text-white/90 transition-colors cursor-pointer"
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            >
              <span className="text-xs uppercase tracking-wider font-medium">Scroll</span>
              <CaretDown className="h-6 w-6" weight="bold" />
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
