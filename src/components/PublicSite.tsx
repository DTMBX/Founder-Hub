import { useState, useEffect, useMemo } from 'react'
import { useKV, kv } from '@/lib/local-storage-kv'
import Navigation from './Navigation'
import HonorFlagBar from './HonorFlagBar'
import HeroSection from './sections/HeroSection'
import { LandingSections, DEFAULT_LANDING_CONFIG } from './landing'
import type { LandingConfig, LandingSectionConfig } from './landing'
import { ScrollProgress } from './ui/scroll-progress'
import { BackToTop } from './ui/back-to-top'
import { Section, SiteSettings, Link } from '@/lib/types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { X } from '@phosphor-icons/react'

interface PublicSiteProps {
  onAdminClick?: () => void
  onNavigateToCase: (caseId: string) => void
}

type TrinityPathway = 'all' | 'investors' | 'legal' | 'about' | 'marketplace'

export default function PublicSite({ onAdminClick, onNavigateToCase }: PublicSiteProps) {
  const [sections, setSections] = useKV<Section[]>('founder-hub-sections', [])
  const [settings] = useKV<SiteSettings>('founder-hub-settings', {
    siteName: 'Devon Tyler Barber',
    tagline: 'Founder & Innovator',
    description: 'Forging transformative solutions at the intersection of technology, home improvement, transparency, and justice.',
    primaryDomain: 'devon-tyler.com',
    domainRedirects: [],
    analyticsEnabled: true,
    indexingEnabled: true,
    investorModeAvailable: true
  })
  const [profile] = useKV<{ catchAllEmail?: string; domain?: string }>('founder-hub-profile', {})
  const [contactLinks] = useKV<Link[]>('founder-hub-contact-links', [])
  const [proofLinks] = useKV<Link[]>('founder-hub-proof-links', [])
  const [pathway, setPathway] = useState<TrinityPathway>('all')
  const [, setAudienceMode] = useKV<string>('current-audience-mode', 'all')

  const [barEnabled] = useKV<boolean>('honor-flag-bar-enabled', true)
  const [animationEnabled] = useKV<boolean>('honor-flag-bar-animation', true)
  const [parallaxEnabled] = useKV<boolean>('honor-flag-bar-parallax', true)
  const [rotationCadence] = useKV<number>('honor-flag-bar-rotation', 20)
  const [maxFlagsDesktop] = useKV<number>('honor-flag-bar-max-desktop', 7)
  const [maxFlagsMobile] = useKV<number>('honor-flag-bar-max-mobile', 3)
  const [alignment] = useKV<'left' | 'center' | 'right'>('honor-flag-bar-alignment', 'center')

  useEffect(() => {
    const audienceMapping: Record<TrinityPathway, string> = {
      'all': 'all',
      'investors': 'investors',
      'legal': 'legal',
      'about': 'friends',
      'marketplace': 'all'
    }
    setAudienceMode(audienceMapping[pathway])
  }, [pathway, setAudienceMode])

  useEffect(() => {
    if (!sections || sections.length === 0) {
      const defaultSections: Section[] = [
        { id: 'hero', type: 'hero', title: 'Hero', content: '', order: 0, enabled: true, investorRelevant: true },
        { id: 'about', type: 'about', title: 'About', content: '', order: 1, enabled: true, investorRelevant: false },
        { id: 'projects', type: 'projects', title: 'Projects', content: '', order: 2, enabled: true, investorRelevant: true },
        { id: 'services', type: 'services', title: 'Services', content: '', order: 3, enabled: true, investorRelevant: true },
        { id: 'court', type: 'court', title: 'Court & Accountability', content: '', order: 4, enabled: true, investorRelevant: false },
        { id: 'proof', type: 'proof', title: 'Press & Proof', content: '', order: 5, enabled: true, investorRelevant: true },
        { id: 'contact', type: 'contact', title: 'Contact', content: '', order: 6, enabled: true, investorRelevant: true },
      ]
      setSections(defaultSections)
    }
  }, [sections, setSections])

  useEffect(() => {
    if (settings?.analyticsEnabled) {
      kv.get<number>('founder-hub-page-views').then(views => {
        kv.set('founder-hub-page-views', (views || 0) + 1)
      })
    }
  }, [settings])

  const handleSelectPathway = (selectedPathway: 'investors' | 'legal' | 'about' | 'marketplace') => {
    setPathway(selectedPathway)
    setTimeout(() => {
      const targetSection = 
        selectedPathway === 'investors' ? 'projects' :
        selectedPathway === 'legal' ? 'court' :
        selectedPathway === 'marketplace' ? 'services' :
        'about'
      
      const element = document.getElementById(targetSection)
      if (element) {
        const headerOffset = 72
        const elementPosition = element.getBoundingClientRect().top + window.scrollY
        const offsetPosition = elementPosition - headerOffset
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
      }
    }, 100)
  }

  // Hide proof section from nav + layout when no proof links exist
  const hasProofContent = (proofLinks?.filter(l => l.category === 'proof').length ?? 0) > 0

  // Build LandingConfig from KV sections
  const landingConfig = useMemo<LandingConfig>(() => {
    // Convert KV sections to LandingSectionConfig format
    const sectionConfigs: LandingSectionConfig[] = (sections || [])
      .filter(s => s.type !== 'hero') // Hero is rendered separately
      .map(s => ({
        id: s.id,
        type: s.type as LandingSectionConfig['type'],
        enabled: s.enabled,
        order: s.order,
        investorRelevant: s.investorRelevant ?? false,
        // Set relevance based on section type
        legalRelevant: s.type === 'court' || s.type === 'contact',
        marketplaceRelevant: s.type === 'services' || s.type === 'offerings' || s.type === 'contact'
      }))
    
    // Add investor section if not present (special section)
    if (!sectionConfigs.some(s => s.id === 'investor')) {
      sectionConfigs.push({
        id: 'investor',
        type: 'investor',
        enabled: true,
        order: 2.5, // Between projects and offerings
        investorRelevant: true,
        legalRelevant: false,
        marketplaceRelevant: false
      })
    }
    
    return {
      sections: sectionConfigs.length > 0 ? sectionConfigs : DEFAULT_LANDING_CONFIG.sections,
      pathway,
      hasProofContent
    }
  }, [sections, pathway, hasProofContent])

  // For navigation - still need visible sections for nav links
  const getVisibleSections = () => {
    let enabled = sections?.filter(s => s.enabled).sort((a, b) => a.order - b.order) || []
    if (!hasProofContent) enabled = enabled.filter(s => s.type !== 'proof')
    if (pathway === 'all') return enabled
    if (pathway === 'investors') {
      return enabled.filter(s => s.type === 'hero' || s.type === 'projects' || s.type === 'services' || s.type === 'offerings' || s.type === 'proof' || s.type === 'contact')
    }
    if (pathway === 'legal') {
      return enabled.filter(s => s.type === 'hero' || s.type === 'court' || s.type === 'contact')
    }
    if (pathway === 'about') {
      return enabled.filter(s => s.type === 'hero' || s.type === 'about' || s.type === 'contact')
    }
    if (pathway === 'marketplace') {
      return enabled.filter(s => s.type === 'hero' || s.type === 'services' || s.type === 'offerings' || s.type === 'contact')
    }
    return enabled
  }

  const enabledSections = getVisibleSections()

  const pathwayLabels: Record<string, { label: string; color: string }> = {
    investors: { label: 'Investor Brief', color: 'border-emerald-500/40 text-emerald-400' },
    legal: { label: 'Court Filings', color: 'border-amber-500/40 text-amber-400' },
    about: { label: 'About Devon', color: 'border-purple-500/40 text-purple-400' },
    marketplace: { label: 'Services', color: 'border-rose-500/40 text-rose-400' }
  }

  const socialLinks = contactLinks?.filter(l => l.category === 'social') || []
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": settings?.siteName || "Devon Tyler Barber",
    "alternateName": "Devon Tyler",
    "description": settings?.description || "Founder & Innovator",
    "url": `https://${settings?.primaryDomain || 'devon-tyler.com'}`,
    "image": settings?.socialPreviewImage || "/og-preview.png",
    "sameAs": socialLinks.map(link => link.url).filter(Boolean),
    "jobTitle": settings?.tagline || "Founder & Innovator",
    "knowsAbout": ["Technology", "Innovation", "Legal Transparency", "Home Improvement", "Software Development"]
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollProgress />
      <HonorFlagBar 
        enabled={barEnabled ?? true}
        rotationCadence={(rotationCadence ?? 20) * 1000}
        maxFlagsDesktop={maxFlagsDesktop ?? 7}
        maxFlagsMobile={maxFlagsMobile ?? 3}
        animationEnabled={animationEnabled ?? true}
        alignment={alignment ?? 'center'}
        parallaxEnabled={parallaxEnabled ?? true}
      />
      <Navigation 
        sections={enabledSections}
        onAdminClick={onAdminClick}
        activePathway={pathway}
      />

      {/* Pathway mode indicator — positioned below honor bar (56/64px) + nav (64px) + 8px gap */}
      {pathway !== 'all' && (
        <div className="fixed top-[128px] md:top-[136px] right-4 z-40 flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
          <Badge variant="secondary" className={`backdrop-blur-xl bg-card/90 border px-3 py-1.5 text-xs font-medium shadow-lg ${pathwayLabels[pathway]?.color}`}>
            {pathwayLabels[pathway]?.label}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPathway('all')}
            className="backdrop-blur-xl bg-card/90 border border-border/50 hover:border-accent/30 h-8 px-2 shadow-lg"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <main id="main-content">
        {/* Hero - Hand-authored, not part of config system */}
        <HeroSection 
          onSelectPathway={handleSelectPathway}
        />
        
        {/* Config-driven sections below the hero */}
        <LandingSections 
          config={landingConfig}
          onNavigateToCase={onNavigateToCase}
        />
      </main>

      {/* Professional footer */}
      <footer className="relative border-t border-border/30 bg-card/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left">
              <p className="font-mono text-sm font-bold tracking-tight text-foreground">
                {profile?.domain || settings?.primaryDomain || 'devon-tyler.com'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {settings?.siteName || 'Devon Tyler Barber'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <button 
                onClick={() => {
                  const el = document.getElementById('about')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="hover:text-foreground transition-colors"
              >
                About
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('projects')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="hover:text-foreground transition-colors"
              >
                Projects
              </button>
              <a 
                href={`mailto:${profile?.emails?.find((e: {label: string}) => e.label?.toLowerCase().includes('invest'))?.email || 'invest@devon-tyler.com'}`}
                className="hover:text-emerald-400 transition-colors"
              >
                Invest
              </a>
              <button 
                onClick={() => {
                  const el = document.getElementById('court')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="hover:text-foreground transition-colors"
              >
                Court
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('contact')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
                className="hover:text-foreground transition-colors"
              >
                Contact
              </button>
            </div>
            <div className="text-center md:text-right">
              <a href={`mailto:${profile?.catchAllEmail || 'x@devon-tyler.com'}`} className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono">
                {profile?.catchAllEmail || 'x@devon-tyler.com'}
              </a>
              <p className="text-[11px] text-muted-foreground/50 mt-1">
                &copy; {new Date().getFullYear()} {settings?.siteName || 'Devon Tyler Barber'}. All rights reserved.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border/20 text-center">
            <p className="text-[11px] text-muted-foreground/40 max-w-3xl mx-auto leading-relaxed">
              This site is for informational purposes only and does not constitute legal advice. Court documents referenced are public records obtained through lawful channels. All trademarks and third-party content belong to their respective owners.
            </p>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}
