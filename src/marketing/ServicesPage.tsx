/**
 * Services Page
 *
 * Marketing page showcasing available services using reusable primitives.
 * Demonstrates the MarketingPage layout system with:
 * - MarketingSection for consistent section styling
 * - SectionHeader for uniform headings
 * - FeatureGrid for service cards
 */

import { useCallback } from 'react'
import { Globe, Palette, Rocket, Settings, BarChart, Shield } from 'lucide-react'
import { MarketingPage, MarketingSection, SectionHeader } from './layouts'
import {
  FeatureGrid,
  MarketingHero,
  ProofStrip,
  FAQSection,
  FinalCTA,
  type FeatureItem,
} from './components'
import { GENERAL_FAQS } from './faq.config'
import { PROOF_STATS, TESTIMONIALS, TRUST_BADGES } from './proof.config'

// ─── Service Data ────────────────────────────────────────────

const SERVICES: FeatureItem[] = [
  {
    id: 'website-design',
    title: 'Website Design',
    description: 'Custom, professional websites that reflect your brand and convert visitors into clients.',
    icon: <Palette className="w-6 h-6" />,
    badge: 'Most Popular',
  },
  {
    id: 'website-development',
    title: 'Website Development',
    description: 'Fast, secure, and scalable websites built with modern technology and best practices.',
    icon: <Globe className="w-6 h-6" />,
  },
  {
    id: 'launch-support',
    title: 'Launch Support',
    description: 'Full support from design to deployment, including domain setup and SSL certificates.',
    icon: <Rocket className="w-6 h-6" />,
  },
  {
    id: 'maintenance',
    title: 'Ongoing Maintenance',
    description: 'Keep your site secure and up-to-date with our monthly maintenance packages.',
    icon: <Settings className="w-6 h-6" />,
  },
  {
    id: 'analytics',
    title: 'Analytics & SEO',
    description: 'Built-in analytics and SEO optimization to help you rank and understand your traffic.',
    icon: <BarChart className="w-6 h-6" />,
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    description: 'Enterprise-grade security, HTTPS, and compliance with accessibility standards.',
    icon: <Shield className="w-6 h-6" />,
  },
]

// ─── Types ───────────────────────────────────────────────────

export interface ServicesPageProps {
  /** Callback when user wants to get started */
  onGetStarted?: () => void
  /** Callback when user wants to book a call */
  onBookCall?: () => void
}

// ─── Component ───────────────────────────────────────────────

export function ServicesPage({
  onGetStarted,
  onBookCall,
}: ServicesPageProps) {
  const handleGetStarted = useCallback(() => {
    onGetStarted?.()
  }, [onGetStarted])
  
  const handleBookCall = useCallback(() => {
    onBookCall?.()
  }, [onBookCall])
  
  // Build thumbnail URLs from stats (demo)
  const thumbnails = TESTIMONIALS.slice(0, 3).map((t) => t.avatarUrl).filter(Boolean) as string[]
  
  return (
    <MarketingPage
      pageId="services_page"
      title="Our Services | Professional Website Solutions"
    >
      {/* Hero Section */}
      <MarketingHero
        headline="Professional Website Services"
        subheadline="From design to deployment, we handle everything so you can focus on your business."
        primaryCtaLabel="View Packages"
        secondaryCtaLabel="Book a Call"
        onPrimaryCta={handleGetStarted}
        onSecondaryCta={handleBookCall}
        trustBadges={TRUST_BADGES.slice(0, 3)}
      />
      
      {/* Services Grid */}
      <MarketingSection id="services" variant="muted" aria-labelledby="services-heading">
        <SectionHeader
          id="services-heading"
          badge="What We Offer"
          title="Comprehensive Web Services"
          subtitle="Everything you need to establish a professional online presence"
        />
        
        <FeatureGrid
          features={SERVICES}
          columns={3}
          variant="bordered"
          iconPosition="top"
        />
      </MarketingSection>
      
      {/* Proof Section */}
      <MarketingSection id="proof" variant="default">
        <ProofStrip 
          previewThumbnails={thumbnails}
          stats={PROOF_STATS}
          testimonials={TESTIMONIALS.slice(0, 3)}
        />
      </MarketingSection>
      
      {/* FAQ Section */}
      <MarketingSection id="faq" variant="muted">
        <FAQSection
          title="Common Questions"
          subtitle="Find answers to frequently asked questions about our services"
          faqs={GENERAL_FAQS.slice(0, 5)}
        />
      </MarketingSection>
      
      {/* Final CTA */}
      <FinalCTA
        headline="Ready to Get Started?"
        subheadline="Let's build your professional website together."
        onPrimaryCta={handleGetStarted}
        onSecondaryCta={handleBookCall}
      />
    </MarketingPage>
  )
}

export default ServicesPage
