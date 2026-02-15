import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import Navigation from './Navigation'
import HeroSection from './sections/HeroSection'
import ProjectsSection from './sections/ProjectsSection'
import CourtSection from './sections/CourtSection'
import ProofSection from './sections/ProofSection'
import ContactSection from './sections/ContactSection'
import AboutSection from './sections/AboutSection'
import { ScrollProgress } from './ui/scroll-progress'
import { BackToTop } from './ui/back-to-top'
import { Section, SiteSettings } from '@/lib/types'
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
    description: 'Building transformative solutions at the intersection of technology and justice.',
    primaryDomain: 'xTx396.online',
    domainRedirects: [],
    analyticsEnabled: true,
    indexingEnabled: true,
    investorModeAvailable: true
  })
  const [pathway, setPathway] = useState<TrinityPathway>('all')

  useEffect(() => {
    if (!sections || sections.length === 0) {
      const defaultSections: Section[] = [
        { id: 'hero', type: 'hero', title: 'Hero', content: '', order: 0, enabled: true, investorRelevant: true },
        { id: 'projects', type: 'projects', title: 'Projects', content: '', order: 1, enabled: true, investorRelevant: true },
        { id: 'about', type: 'about', title: 'About', content: '', order: 2, enabled: true, investorRelevant: false },
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
        const headerOffset = 80
        const elementPosition = element.getBoundingClientRect().top + window.scrollY
        const offsetPosition = elementPosition - headerOffset
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
      }
    }, 100)
  }

  const getVisibleSections = () => {
    const enabled = sections?.filter(s => s.enabled).sort((a, b) => a.order - b.order) || []
    
    if (pathway === 'all') return enabled

    if (pathway === 'investors') {
      return enabled.filter(s => 
        s.type === 'hero' || 
        s.type === 'projects' || 
        s.type === 'proof' || 
        s.type === 'contact'
      )
    }

    if (pathway === 'legal') {
      return enabled.filter(s => 
        s.type === 'hero' || 
        s.type === 'court' || 
        s.type === 'contact'
      )
    }

    if (pathway === 'about') {
      return enabled.filter(s => 
        s.type === 'hero' || 
        s.type === 'about' || 
        s.type === 'contact'
      )
    }

    return enabled
  }

  const enabledSections = getVisibleSections()
  const showAboutSection = enabledSections.some(s => s.type === 'about')

  const pathwayLabels = {
    investors: 'Investors',
    legal: 'Legal / Court',
    about: 'About / Friends'
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollProgress />
      <Navigation 
        sections={enabledSections}
        investorMode={false}
        onToggleInvestorMode={() => {}}
        showInvestorToggle={false}
        onAdminClick={onAdminClick}
        activePathway={pathway}
      />

      {pathway !== 'all' && (
        <div className="fixed top-20 right-4 z-40 flex items-center gap-2">
          <Badge variant="secondary" className="backdrop-blur-xl bg-card/90 border-accent/50 text-foreground px-4 py-2">
            {pathwayLabels[pathway]} Mode
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPathway('all')}
            className="backdrop-blur-xl bg-card/90 border border-border hover:border-accent/50"
          >
            <X className="h-4 w-4 mr-1" />
            Return to Overview
          </Button>
        </div>
      )}

      <main>
        <HeroSection 
          investorMode={false} 
          onSelectPathway={handleSelectPathway}
        />
        
        {enabledSections.some(s => s.type === 'projects') && (
          <ProjectsSection investorMode={pathway === 'investors'} />
        )}
        
        {showAboutSection && (
          <AboutSection pathway={pathway} />
        )}
        
        {enabledSections.some(s => s.type === 'court') && (
          <CourtSection investorMode={false} onNavigateToCase={onNavigateToCase} />
        )}
        
        {enabledSections.some(s => s.type === 'proof') && (
          <ProofSection investorMode={pathway === 'investors'} />
        )}
        
        {enabledSections.some(s => s.type === 'contact') && (
          <ContactSection investorMode={false} />
        )}
      </main>

      <footer className="border-t border-border py-8 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} {settings?.siteName || 'Devon Tyler Barber'}. All rights reserved.
          </p>
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}
