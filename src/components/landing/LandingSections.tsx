/**
 * LandingSections - Config-driven Section Renderer
 * 
 * Renders landing page sections below the hero based on LandingConfig.
 * The hero remains hand-authored and is NOT part of this renderer.
 */

import { lazy, Suspense } from 'react'
import type { LandingConfig, LandingSectionConfig } from './landing.config'
import { filterSectionsByPathway } from './landing.config'
import { ScrollReveal } from '../ui/scroll-reveal'

// ─── Lazy-loaded Section Components ─────────────────────────────

const AboutSection = lazy(() => import('../sections/AboutSection'))
const ProjectsSection = lazy(() => import('../sections/ProjectsSection'))
const OfferingsSection = lazy(() => import('../sections/OfferingsSection'))
const InvestorSection = lazy(() => import('../sections/InvestorSection'))
const CourtSection = lazy(() => import('../sections/CourtSection'))
const ProofSection = lazy(() => import('../sections/ProofSection'))
const ContactSection = lazy(() => import('../sections/ContactSection'))
const GovernanceNarrativeSection = lazy(() => import('../sections/GovernanceNarrativeSection'))

// ─── Section Loading Fallback ───────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="min-h-[420px] animate-pulse mx-auto max-w-7xl my-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="h-10 w-64 bg-muted/10 rounded-lg" />
      <div className="h-5 w-96 max-w-full bg-muted/8 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-8">
        <div className="h-48 bg-muted/10 rounded-xl" />
        <div className="h-48 bg-muted/8 rounded-xl" />
        <div className="h-48 bg-muted/6 rounded-xl hidden xl:block" />
      </div>
    </div>
  )
}

// ─── Props Interface ────────────────────────────────────────────

export interface LandingSectionsProps {
  config: LandingConfig
  /** Handler for case navigation (passed to CourtSection) */
  onNavigateToCase?: (caseId: string) => void
}

// ─── Section Renderer ───────────────────────────────────────────

function renderSection(
  section: LandingSectionConfig,
  props: {
    pathway: LandingConfig['pathway']
    onNavigateToCase?: (caseId: string) => void
  }
) {
  const { pathway, onNavigateToCase } = props
  
  switch (section.type) {
    case 'about':
      return (
        <Suspense key={section.id} fallback={<SectionSkeleton />}>
          <AboutSection pathway={pathway} {...(section.props || {})} />
        </Suspense>
      )
    
    case 'governance':
      return (
        <Suspense key={section.id} fallback={<SectionSkeleton />}>
          <GovernanceNarrativeSection {...(section.props || {})} />
        </Suspense>
      )
    
    case 'projects':
      return (
        <Suspense key={section.id} fallback={<SectionSkeleton />}>
          <ProjectsSection 
            investorMode={pathway === 'investors'} 
            {...(section.props || {})} 
          />
        </Suspense>
      )
    
    case 'investor':
      // Only render investor section in investor pathway
      if (pathway !== 'investors') return null
      return (
        <Suspense key={section.id} fallback={<SectionSkeleton />}>
          <InvestorSection {...(section.props || {})} />
        </Suspense>
      )
    
    case 'offerings':
    case 'services':
      return (
        <Suspense key={section.id} fallback={<SectionSkeleton />}>
          <OfferingsSection 
            tradeMode={pathway === 'marketplace'} 
            {...(section.props || {})} 
          />
        </Suspense>
      )
    
    case 'court':
      return (
        <Suspense key={section.id} fallback={<SectionSkeleton />}>
          <CourtSection 
            investorMode={false}
            onNavigateToCase={onNavigateToCase || (() => {})}
            {...(section.props || {})}
          />
        </Suspense>
      )
    
    case 'proof':
      return (
        <Suspense key={section.id} fallback={<SectionSkeleton />}>
          <ProofSection 
            investorMode={pathway === 'investors'}
            {...(section.props || {})}
          />
        </Suspense>
      )
    
    case 'contact':
      return (
        <Suspense key={section.id} fallback={<SectionSkeleton />}>
          <ContactSection 
            investorMode={pathway === 'investors'}
            {...(section.props || {})}
          />
        </Suspense>
      )
    
    // Placeholder sections for future implementation
    case 'how-it-works':
    case 'faq':
    case 'final-cta':
      return null // Not yet implemented
    
    default:
      console.warn(`[LandingSections] Unknown section type: ${section.type}`)
      return null
  }
}

// ─── Main Component ─────────────────────────────────────────────

export default function LandingSections({ 
  config,
  onNavigateToCase
}: LandingSectionsProps) {
  const filteredSections = filterSectionsByPathway(config)
  
  return (
    <>
      {filteredSections.map((section, index) => {
        const rendered = renderSection(section, {
          pathway: config.pathway,
          onNavigateToCase
        })
        if (!rendered) return null
        return (
          <ScrollReveal key={section.id} delay={index * 80}>
            {rendered}
          </ScrollReveal>
        )
      })}
    </>
  )
}
