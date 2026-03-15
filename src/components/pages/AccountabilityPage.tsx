import { ArrowLeft, Eye, FileText, Scales, ShieldCheck } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import { usePageMeta } from '@/hooks/use-page-meta'

interface AccountabilityPageProps {
  onBack: () => void
}

const ACCOUNTABILITY_PILLARS = [
  {
    icon: Scales,
    title: 'Public Case Records',
    description: 'Full transparency on legal proceedings, court filings, and case outcomes. Every document that can be lawfully shared is indexed and accessible.',
    status: 'Live',
  },
  {
    icon: FileText,
    title: 'Evidence & Documentation',
    description: 'Organized court exhibits, communications logs, and supporting materials — timestamped and verifiable.',
    status: 'Live',
  },
  {
    icon: Eye,
    title: 'Transparency Tools',
    description: 'Open-source platforms that allow anyone to trace decisions, track follow-ups, and verify claims against the public record.',
    status: 'In Development',
  },
  {
    icon: ShieldCheck,
    title: 'Governance & Oversight',
    description: 'Published governance policies, change management logs, and audit trails for all Evident ecosystem projects.',
    status: 'Active',
  },
]

export default function AccountabilityPage({ onBack }: AccountabilityPageProps) {
  const prefersReducedMotion = useReducedMotion()

  usePageMeta({
    title: 'Court & Accountability',
    description: 'Public accountability portal — case records, transparency tools, and governance documentation for the Evident ecosystem.',
    path: '/accountability',
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': 'Court & Accountability — Devon Tyler Barber',
      'description': 'Public accountability portal with case records and transparency tools.',
      'url': 'https://devon-tyler.com/#accountability',
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Court &amp; Accountability</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Transparency is the foundation of trust. This portal provides public access to case records, 
            governance documentation, and the tools built to keep institutions and individuals accountable.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
          {ACCOUNTABILITY_PILLARS.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
            >
              <GlassCard className="p-6 h-full">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3 shrink-0">
                    <pillar.icon className="h-6 w-6 text-primary" weight="duotone" aria-hidden="true" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">{pillar.title}</h2>
                      <Badge variant={pillar.status === 'Live' ? 'default' : pillar.status === 'Active' ? 'secondary' : 'outline'} className="text-xs">
                        {pillar.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{pillar.description}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <GlassCard className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Accountability Is Non-Negotiable</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every project in the Evident ecosystem ships with governance documentation, audit trails, and open-source code. 
              If something can be verified, it should be — and this portal is the proof.
            </p>
          </GlassCard>
        </motion.div>
      </SectionContainer>
    </div>
  )
}
