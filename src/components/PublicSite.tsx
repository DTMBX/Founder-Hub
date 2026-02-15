import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import Navigation from './Navigation'
import HonorFlagBar from './HonorFlagBar'
import HeroSection from './sections/HeroSection'
import ProjectsSection from './sections/ProjectsSection'
import CourtSection from './sections/CourtSection'
import ProofSection from './sections/ProofSection'
import ContactSection from './sections/ContactSection'
import AboutSection from './sections/AboutSection'
import { ScrollProgress } from './ui/scroll-progress'
import { BackToTop } from './ui/back-to-top'
import { Section, SiteSettings, Link } from '@/lib/types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { X } from '@phosphor-icons/react'

interface PublicSiteProps {
  onAdminClick: () => void
  onNavigateToCase: (caseId: string) => void
}

type TrinityPathway = 'all' | 'investors' | 'legal' | 'about'

export default function PublicSite({ onAdminClick, onNavigateToCase }: PublicSiteProps) {
  const [sections, setSections] = useKV<Section[]>('founder-hub-sections', [])
  const [settings] = useKV<SiteSettings>('founder-hub-settings', {
    siteName: 'Devon Tyler Barber',
    tagline: 'Founder & Innovator',
    description: 'Forging transformative solutions at the intersection of technology, home improvement, transparency, and justice.',
    primaryDomain: 'xTx396.com',
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

  useEffect(() => {
    const audienceMapping: Record<TrinityPathway, string> = {
      'all': 'all',
      'investors': 'investors',
      'legal': 'legal',
      'about': 'friends'
    }
    setAudienceMode(audienceMapping[pathway])
  }, [pathway, setAudienceMode])

  useEffect(() => {
    if (!sections || sections.length === 0) {
      const defaultSections: Section[] = [
        { id: 'hero', type: 'hero', title: 'Hero', content: '', order: 0, enabled: true, investorRelevant: true },
        { id: 'about', type: 'about', title: 'About', content: '', order: 1, enabled: true, investorRelevant: false },
        { id: 'projects', type: 'projects', title: 'Projects', content: '', order: 2, enabled: true, investorRelevant: true },
        { id: 'court', type: 'court', title: 'Court & Accountability', content: '', order: 3, enabled: true, investorRelevant: false },
        { id: 'proof', type: 'proof', title: 'Press & Proof', content: '', order: 4, enabled: true, investorRelevant: true },
        { id: 'contact', type: 'contact', title: 'Contact', content: '', order: 5, enabled: true, investorRelevant: true },
      ]
      setSections(defaultSections)
    }
  }, [sections, setSections])

  useEffect(() => {
    if (settings?.analyticsEnabled) {
      window.spark.kv.get<number>('founder-hub-page-views').then(views => {
        window.spark.kv.set('founder-hub-page-views', (views || 0) + 1)
      })
    }
  }, [settings])

  const handleSelectPathway = (selectedPathway: 'investors' | 'legal' | 'about') => {
    setPathway(selectedPathway)
    setTimeout(() => {
      const targetSection = 
        selectedPathway === 'investors' ? 'projects' :
        selectedPathway === 'legal' ? 'court' :
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

  const getVisibleSections = () => {
    let enabled = sections?.filter(s => s.enabled).sort((a, b) => a.order - b.order) || []
    if (!hasProofContent) enabled = enabled.filter(s => s.type !== 'proof')
    if (pathway === 'all') return enabled
    if (pathway === 'investors') {
      return enabled.filter(s => s.type === 'hero' || s.type === 'projects' || s.type === 'proof' || s.type === 'contact')
    }
    if (pathway === 'legal') {
      return enabled.filter(s => s.type === 'hero' || s.type === 'court' || s.type === 'contact')
    }
    if (pathway === 'about') {
      return enabled.filter(s => s.type === 'hero' || s.type === 'about' || s.type === 'contact')
    }
    return enabled
  }

  const enabledSections = getVisibleSections()
  const showAboutSection = enabledSections.some(s => s.type === 'about')

  const pathwayLabels: Record<string, { label: string; color: string }> = {
    investors: { label: 'Investor Mode', color: 'border-emerald-500/40 text-emerald-400' },
    legal: { label: 'Court Mode', color: 'border-amber-500/40 text-amber-400' },
    about: { label: 'Connect Mode', color: 'border-purple-500/40 text-purple-400' }
  }

  const socialLinks = contactLinks?.filter(l => l.category === 'social') || []
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": settings?.siteName || "Devon Tyler Barber",
    "alternateName": "xTx396",
    "description": settings?.description || "Founder & Innovator",
    "url": `https://${settings?.primaryDomain || 'xtx396.com'}`,
    "image": settings?.socialPreviewImage || "/og-preview.png",
    "sameAs": socialLinks.map(link => link.url).filter(Boolean),
    "jobTitle": settings?.tagline || "Founder & Innovator",
    "knowsAbout": ["Technology", "Innovation", "Legal Transparency", "Home Improvement", "Software Development"]
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollProgress />
      <HonorFlagBar 
        enabled={true}
        rotationCadence={20000}
        maxFlagsDesktop={7}
        maxFlagsMobile={3}
        animationEnabled={true}
        alignment="center"
      />
      <Navigation 
        sections={enabledSections}
        investorMode={false}
        onToggleInvestorMode={() => {}}
        showInvestorToggle={false}
        onAdminClick={onAdminClick}
        activePathway={pathway}
      />

      {/* Pathway mode indicator */}
      {pathway !== 'all' && (
        <div className="fixed top-[104px] sm:top-[108px] md:top-[112px] right-4 z-40 flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
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

      <main>
        <HeroSection 
          investorMode={false} 
          onSelectPathway={handleSelectPathway}
        />
        
        {showAboutSection && (
          <AboutSection pathway={pathway} />
        )}
        
        {enabledSections.some(s => s.type === 'projects') && (
          <ProjectsSection investorMode={pathway === 'investors'} />
        )}
        
        {enabledSections.some(s => s.type === 'court') && (
          <CourtSection investorMode={false} onNavigateToCase={onNavigateToCase} />
        )}
        
        {enabledSections.some(s => s.type === 'proof') && (
          <ProofSection investorMode={pathway === 'investors'} />
        )}
        
        {enabledSections.some(s => s.type === 'contact') && (
          <ContactSection investorMode={pathway === 'investors'} />
        )}
      </main>

      {/* Professional footer */}
      <footer className="relative border-t border-border/30 bg-card/40 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center md:text-left">
              <p className="font-mono text-sm font-bold tracking-tight text-foreground">
                {profile?.domain || settings?.primaryDomain || 'xTx396.com'}
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
                href="mailto:invest@xtx396.com"
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
              <a href={`mailto:${profile?.catchAllEmail || 'x@xtx396.com'}`} className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono">
                {profile?.catchAllEmail || 'x@xtx396.com'}
              </a>
              <p className="text-[11px] text-muted-foreground/50 mt-1">
                &copy; {new Date().getFullYear()} All rights reserved.
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
