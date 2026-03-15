import { ArrowLeft, ChartLineUp, Code, Envelope,Handshake } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import { usePageMeta } from '@/hooks/use-page-meta'

interface InvestPageProps {
  onBack: () => void
}

const PARTNERSHIP_AREAS = [
  {
    icon: Code,
    title: 'Open-Source Collaboration',
    description: 'Contribute to any Evident ecosystem project. All repositories are public, all contributions are credited, and all governance is transparent.',
  },
  {
    icon: ChartLineUp,
    title: 'Strategic Investment',
    description: 'Support the growth of civic technology platforms that prioritize accountability, transparency, and community ownership.',
  },
  {
    icon: Handshake,
    title: 'Partnerships & Licensing',
    description: 'License technology, integrate with your platform, or co-develop solutions for government transparency and civic engagement.',
  },
]

export default function InvestPage({ onBack }: InvestPageProps) {
  const prefersReducedMotion = useReducedMotion()

  usePageMeta({
    title: 'Invest & Connect',
    description: 'Partner with Devon Tyler Barber — open-source collaboration, strategic investment, and licensing opportunities in civic technology.',
    path: '/invest',
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Invest & Connect — Devon Tyler Barber',
      'description': 'Partnership and investment opportunities in civic technology.',
      'url': 'https://devon-tyler.com/#invest',
    }],
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Home
            </Button>
          </div>
        </div>
      </div>

      <SectionContainer maxWidth="7xl" separator={false} className="pt-12 sm:pt-16">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Invest &amp; Connect</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Building civic technology that works requires more than code — it requires community, 
            capital, and shared conviction. Here is how to get involved.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-16">
          {PARTNERSHIP_AREAS.map((area, idx) => (
            <motion.div
              key={area.title}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                  <area.icon className="h-6 w-6 text-primary" weight="duotone" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold mb-2">{area.title}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{area.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <GlassCard className="p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="rounded-xl bg-primary/10 p-4 shrink-0">
                <Envelope className="h-8 w-8 text-primary" weight="duotone" aria-hidden="true" />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold">Get in Touch</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Interested in collaborating, investing, or licensing? Reach out directly — 
                  every conversation starts with transparency.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <a href="mailto:iv@devon-tyler.com">
                  Contact Devon
                </a>
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </SectionContainer>
    </div>
  )
}
