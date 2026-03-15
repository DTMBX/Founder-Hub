import { ArrowLeft, ArrowSquareOut, Database, Eye, FileMagnifyingGlass, Fingerprint, GithubLogo, LinkSimple, MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import { PROJECT_REGISTRY } from '@/data/projects'
import { usePageMeta } from '@/hooks/use-page-meta'

interface EvidentPageProps {
  onBack: () => void
  onNavigateToProject: (projectId: string) => void
}

const PLATFORM_CAPABILITIES = [
  {
    icon: FileMagnifyingGlass,
    title: 'Document Ingestion',
    description: 'Process PDFs, scanned images, audio, video, and digital media into searchable, indexed records with full metadata extraction.',
  },
  {
    icon: MagnifyingGlass,
    title: 'OCR & Full-Text Search',
    description: 'Optical character recognition with confidence scoring on scanned and redacted documents. Full-text search across the entire corpus.',
  },
  {
    icon: Fingerprint,
    title: 'Chain of Custody',
    description: 'Cryptographic verification of every document. Tamper-evident hashing ensures authenticity from ingestion through export.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit Trails',
    description: 'Every access, modification, and export is logged with timestamps and user identity. Complete reconstructability for legal proceedings.',
  },
  {
    icon: Database,
    title: 'Evidence Processing',
    description: 'Batch processing pipelines for large document sets. Cross-reference entities, dates, and locations across thousands of records.',
  },
  {
    icon: LinkSimple,
    title: 'Cross-Document Linking',
    description: 'Entity graphs connecting people, organizations, locations, and events across the entire evidence corpus for rapid discovery.',
  },
]

/** Satellite apps that demonstrate Evident capabilities */
const SATELLITE_APPS = PROJECT_REGISTRY.filter(p =>
  ['civics-hierarchy', 'doj-document-library', 'informed-consent', 'essential-goods-ledger', 'geneva-bible-study', 'contractor-command-center'].includes(p.id)
)

export default function EvidentPage({ onBack, onNavigateToProject }: EvidentPageProps) {
  const prefersReducedMotion = useReducedMotion()

  usePageMeta({
    title: 'Evident Technologies — E-Discovery & Evidence Processing Platform',
    description: 'Enterprise e-discovery suite for evidence processing, chain of custody, OCR, and audit trails. Six live satellite applications demonstrate the platform at scale.',
    path: '/evident',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'Evident E-Discovery Suite',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web',
        'description': 'Enterprise e-discovery and evidence processing platform — document ingestion, OCR, chain-of-custody tracking, and cryptographic audit trails for legal teams, government agencies, and investigators.',
        'url': 'https://www.xtx396.com',
        'creator': {
          '@type': 'Organization',
          'name': 'Evident Technologies LLC',
          'url': 'https://www.xtx396.com',
        },
        'offers': {
          '@type': 'Offer',
          'availability': 'https://schema.org/InStock',
          'description': 'Platform licensing, white-label solutions, and API access',
        },
      },
    ],
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back navigation */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Home
            </Button>
            <a
              href="https://www.xtx396.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Visit Platform
              <ArrowSquareOut className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <SectionContainer maxWidth="7xl" separator={false} className="pt-12 sm:pt-16 pb-16">
        {/* ── Hero ── */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            Evident Technologies LLC
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            E-Discovery &amp; Evidence Processing
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl leading-relaxed mb-8">
            Evident is an enterprise e-discovery platform built for legal teams, government agencies, and investigators. 
            It handles document ingestion, OCR, chain-of-custody tracking, and cryptographic audit trails across 
            PDFs, video, audio, and digital media — proven at scale on real-world document corpora.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.xtx396.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Visit xtx396.com
            </a>
            <a
              href="https://github.com/DTMBX/EVIDENT"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <GithubLogo className="h-4 w-4" aria-hidden="true" />
              Source Code
            </a>
            <a
              href="#evident-demo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Try the Demo
            </a>
          </div>
        </motion.div>

        {/* ── Platform Capabilities ── */}
        <section aria-labelledby="capabilities-heading" className="mb-16">
          <h2 id="capabilities-heading" className="text-2xl sm:text-3xl font-bold mb-8">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {PLATFORM_CAPABILITIES.map((cap, idx) => (
              <motion.div
                key={cap.title}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
              >
                <GlassCard intensity="medium" className="p-6 h-full">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 shrink-0">
                      <cap.icon className="h-5 w-5 text-emerald-400" weight="duotone" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{cap.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Live Demo: DOJ Document Library ── */}
        <section aria-labelledby="demo-heading" className="mb-16">
          <h2 id="demo-heading" className="text-2xl sm:text-3xl font-bold mb-4">Live Demo: DOJ Document Library</h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed mb-6">
            The DOJ Document Library at{' '}
            <a href="https://library.xtx396.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline decoration-amber-400/30">
              library.xtx396.com
            </a>
            {' '}indexes publicly released Epstein case documents — court filings, depositions, flight logs, and FOIA responses. 
            It serves as both a public-service archive and a live production demo. Every feature visible to the public runs on the same 
            Evident e-discovery engine available to institutional clients.
          </p>
          <GlassCard intensity="high" className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-amber-400 mb-1">Not a mock dataset</h3>
                <p className="text-sm text-muted-foreground">
                  Real DOJ documents. Real ingestion pipeline. Real OCR. Real search. Real chain-of-custody verification.
                </p>
              </div>
              <a
                href="https://library.xtx396.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-600/30 transition-colors shrink-0"
              >
                <ArrowSquareOut className="h-4 w-4" aria-hidden="true" />
                Open Library
              </a>
            </div>
          </GlassCard>
        </section>

        {/* ── Satellite Applications ── */}
        <section aria-labelledby="satellites-heading" className="mb-16">
          <h2 id="satellites-heading" className="text-2xl sm:text-3xl font-bold mb-3">Satellite Applications</h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed mb-8">
            Six domain-specific applications extend the Evident platform into civic technology, 
            economic analysis, legal research, and project management. Each runs on its own subdomain 
            and demonstrates a different facet of the e-discovery toolchain.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SATELLITE_APPS.map((app, idx) => (
              <motion.div
                key={app.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <button
                  onClick={() => onNavigateToProject(app.id)}
                  className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                >
                  <GlassCard intensity="low" className="p-5 h-full hover:border-foreground/20 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-sm">{app.name}</h3>
                      <Badge variant="outline" className="text-[10px] shrink-0">{app.status === 'live' ? 'Live' : app.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{app.tagline}</p>
                    {app.url && (
                      <span className="text-[10px] font-mono text-muted-foreground/60">{new URL(app.url).hostname}</span>
                    )}
                  </GlassCard>
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Services ── */}
        <section aria-labelledby="services-heading">
          <h2 id="services-heading" className="text-2xl sm:text-3xl font-bold mb-8">Institutional Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { title: 'Platform Licensing', desc: 'Full-featured deployment of the Evident e-discovery suite for your organization, hosted or on-premise.' },
              { title: 'White-Label Solutions', desc: 'Rebrand and deploy Evident processing capabilities under your own identity for client-facing applications.' },
              { title: 'API Access', desc: 'Programmatic access to ingestion, OCR, search, and chain-of-custody APIs for integration with existing legal workflows.' },
            ].map((svc, idx) => (
              <motion.div
                key={svc.title}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <GlassCard intensity="medium" className="p-6 h-full">
                  <h3 className="font-semibold mb-2">{svc.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{svc.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <a
              href="#invest"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Inquire About Licensing →
            </a>
          </div>
        </section>
      </SectionContainer>
    </div>
  )
}
