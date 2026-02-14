import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import Navigation from './Navigation'
import HeroSection from './sections/HeroSection'
import ProjectsSection from './sections/ProjectsSection'
import CourtSection from './sections/CourtSection'
import ProofSection from './sections/ProofSection'
import ContactSection from './sections/ContactSection'
import { ScrollProgress } from './ui/scroll-progress'
import { BackToTop } from './ui/back-to-top'
import { Section, SiteSettings } from '@/lib/types'

interface PublicSiteProps {
  onAdminClick: () => void
}

export default function PublicSite({ onAdminClick }: PublicSiteProps) {
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
  const [investorMode, setInvestorMode] = useState(false)

  useEffect(() => {
    if (settings?.analyticsEnabled) {
      window.spark.kv.get<number>('founder-hub-page-views').then(views => {
        window.spark.kv.set('founder-hub-page-views', (views || 0) + 1)
      })
    }
  }, [settings])

  const enabledSections = sections
    ?.filter(s => s.enabled)
    .filter(s => !investorMode || s.investorRelevant)
    .sort((a, b) => a.order - b.order) || []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScrollProgress />
      <Navigation 
        sections={enabledSections}
        investorMode={investorMode}
        onToggleInvestorMode={() => setInvestorMode(!investorMode)}
        showInvestorToggle={settings?.investorModeAvailable}
        onAdminClick={onAdminClick}
      />

      <main>
        <HeroSection investorMode={investorMode} />
        
        {enabledSections.some(s => s.type === 'projects') && (
          <ProjectsSection investorMode={investorMode} />
        )}
        
        {enabledSections.some(s => s.type === 'court') && (
          <CourtSection investorMode={investorMode} />
        )}
        
        {enabledSections.some(s => s.type === 'proof') && (
          <ProofSection investorMode={investorMode} />
        )}
        
        {enabledSections.some(s => s.type === 'contact') && (
          <ContactSection investorMode={investorMode} />
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
