import { useState, useEffect, useMemo } from 'react'
import { useKV, kv } from '@/lib/local-storage-kv'
import Navigation from './Navigation'
import HonorFlagBar from './HonorFlagBar'
import HeroSection from './sections/HeroSection'
import FeaturedProjects from './sections/FeaturedProjects'
import TrustBar from './TrustBar'
import LatestPosts from './LatestPosts'
import { ActivityFeedCard } from './ActivityFeed'
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
    tagline: 'One Nation under God',
    description: 'Entrepreneur and technologist building civic technology, home improvement platforms, and accountability tools.',
    primaryDomain: 'devon-tyler.com',
    domainRedirects: [],
    analyticsEnabled: true,
    indexingEnabled: true,
    investorModeAvailable: true
  })
  const [profile] = useKV<{ catchAllEmail?: string; domain?: string; professionalEmails?: Array<{ label: string; email: string }> }>('founder-hub-profile', {})
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
        { id: 'governance', type: 'governance', title: 'Governance', content: '', order: 4, enabled: true, investorRelevant: true },
        { id: 'court', type: 'court', title: 'Court & Accountability', content: '', order: 5, enabled: true, investorRelevant: false },
        { id: 'proof', type: 'proof', title: 'Press & Proof', content: '', order: 7, enabled: true, investorRelevant: true },
        { id: 'contact', type: 'contact', title: 'Contact', content: '', order: 8, enabled: true, investorRelevant: true },
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

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 72
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: elementPosition - headerOffset, behavior: 'smooth' })
    }
  }

  // Proof section is now registry-driven (always has content)
  const hasProofContent = true

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
      return enabled.filter(s => s.type === 'hero' || s.type === 'projects' || s.type === 'services' || s.type === 'offerings' || s.type === 'governance' || s.type === 'proof' || s.type === 'contact')
    }
    if (pathway === 'legal') {
      return enabled.filter(s => s.type === 'hero' || s.type === 'governance' || s.type === 'court' || s.type === 'contact')
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
  const siteUrl = `https://${settings?.primaryDomain || 'devon-tyler.com'}`
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        "name": settings?.siteName || "Devon Tyler Barber",
        "alternateName": "Devon Tyler",
        "description": settings?.description || "Entrepreneur and technologist building civic technology, home improvement platforms, and accountability tools.",
        "url": siteUrl,
        "image": settings?.socialPreviewImage || "/og-preview.png",
        "sameAs": socialLinks.map(link => link.url).filter(Boolean),
        "jobTitle": "Entrepreneur & Licensed NJ Contractor",
        "knowsAbout": ["E-Discovery", "Civic Technology", "Home Improvement", "Legal Transparency", "Software Development"],
        "worksFor": { "@id": `${siteUrl}/#organization` },
        "hasCredential": {
          "@type": "EducationalOccupationalCredential",
          "name": "NJ Home Improvement Contractor License",
          "credentialCategory": "license",
          "url": `${siteUrl}/downloads/devon-tyler-barber-overview.pdf`,
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "Evident Technologies LLC",
        "url": "https://www.xtx396.com",
        "founder": { "@id": `${siteUrl}/#person` },
        "description": "E-discovery and civic technology company building transparency and accountability platforms.",
      },
      {
        "@type": "HomeAndConstructionBusiness",
        "@id": `${siteUrl}/#tillerstead`,
        "name": "Tillerstead LLC",
        "url": "https://tillerstead.com",
        "founder": { "@id": `${siteUrl}/#person` },
        "description": "Licensed NJ home improvement contractor \u2014 TCNA-compliant tile installation and residential renovation in South Jersey.",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "name": settings?.siteName || "Devon Tyler Barber",
        "url": siteUrl,
        "description": settings?.description || "Entrepreneur and technologist building civic technology, home improvement platforms, and accountability tools.",
        "publisher": { "@id": `${siteUrl}/#person` },
      },
    ]
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\//g, '<\\/') }}
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
        <div className="fixed top-[128px] md:top-[136px] right-4 z-40 flex items-center gap-2 animate-in slide-in-from-right-4 duration-300" role="status" aria-live="polite">
          <Badge variant="secondary" className={`backdrop-blur-xl bg-card/90 border px-3 py-1.5 text-xs font-medium shadow-lg ${pathwayLabels[pathway]?.color}`}>
            {pathwayLabels[pathway]?.label}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPathway('all')}
            aria-label="Clear pathway filter"
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
          onScrollToSection={handleScrollToSection}
        />
        
        {/* Featured projects credibility section */}
        <FeaturedProjects />

        {/* Verified credentials strip */}
        <TrustBar />

        {/* Ecosystem activity feed */}
        <ActivityFeedCard limit={8} />

        {/* Latest blog posts */}
        <LatestPosts />

        {/* Config-driven sections below the hero */}
        <LandingSections 
          config={landingConfig}
          onNavigateToCase={onNavigateToCase}
        />
      </main>

      {/* Professional footer */}
      <footer aria-label="Site footer" className="relative border-t border-border/30 bg-card/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px] py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <p className="font-mono text-sm font-bold tracking-tight text-foreground">
                {profile?.domain || settings?.primaryDomain || 'devon-tyler.com'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {settings?.siteName || 'Devon Tyler Barber'}
              </p>
              <a href={`mailto:${profile?.catchAllEmail || 'hi@devon-tyler.com'}`} className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono mt-2 inline-block">
                {profile?.catchAllEmail || 'hi@devon-tyler.com'}
              </a>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-xs font-semibold text-foreground/80 mb-3 uppercase tracking-wider">Navigate</p>
              <nav aria-label="Footer navigation" className="flex flex-col gap-2 text-xs text-muted-foreground">
                <a href="#about" className="hover:text-foreground transition-colors">About</a>
                <a href="#projects-index" className="hover:text-foreground transition-colors">Projects</a>
                <a href="#blog" className="hover:text-foreground transition-colors">Blog</a>
                <a href="#services" className="hover:text-foreground transition-colors">Services</a>
                <a href="#accountability" className="hover:text-foreground transition-colors">Accountability</a>
                <a href="#system-status" className="hover:text-foreground transition-colors">System Status</a>
              </nav>
            </div>

            {/* Ecosystem */}
            <div>
              <p className="text-xs font-semibold text-foreground/80 mb-3 uppercase tracking-wider">Ecosystem</p>
              <nav aria-label="Ecosystem links" className="flex flex-col gap-2 text-xs text-muted-foreground">
                <a href="https://www.xtx396.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Evident Technologies</a>
                <a href="https://tillerstead.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Tillerstead</a>
                <a href="https://library.xtx396.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Document Library</a>
                <a href="https://civics.xtx396.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Civics Hierarchy</a>
                <a href="https://consent.xtx396.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Informed Consent</a>
                <a href="https://ledger.xtx396.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Essential Goods</a>
              </nav>
            </div>

            {/* Legal & Dev */}
            <div>
              <p className="text-xs font-semibold text-foreground/80 mb-3 uppercase tracking-wider">Legal</p>
              <nav aria-label="Legal links" className="flex flex-col gap-2 text-xs text-muted-foreground">
                <a href="/privacy.html" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="/terms.html" className="hover:text-foreground transition-colors">Terms of Use</a>
                <a href="https://github.com/DTMBX" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
                <a href="#developers" className="hover:text-foreground transition-colors">Developers</a>
              </nav>
            </div>
          </div>

          <div className="pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/50">
              &copy; {new Date().getFullYear()} {settings?.siteName || 'Devon Tyler Barber'}. All rights reserved.
            </p>
            <p className="text-[11px] text-muted-foreground/30 max-w-xl text-center sm:text-right leading-relaxed">
              This site is for informational purposes only and does not constitute legal advice. Court documents referenced are public records obtained through lawful channels.
            </p>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}
