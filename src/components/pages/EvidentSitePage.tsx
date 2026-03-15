/**
 * Evident Technologies — Standalone Marketing Site
 *
 * This page is designed to be deployable at xtx396.com as a standalone
 * enterprise marketing presence distinct from the founder personal site.
 * Style is institutional, darker, and more enterprise-oriented.
 *
 * Route: /#evident-site (internal preview) / xtx396.com (production)
 */

import { ArrowLeft, ArrowSquareOut, CircleNotch, Database, Envelope, Eye, FileMagnifyingGlass, Fingerprint, LinkSimple, MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { useFormSubmit } from '@/hooks/use-form-submit'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import { PROJECT_REGISTRY } from '@/data/projects'
import { usePageMeta } from '@/hooks/use-page-meta'

interface EvidentSitePageProps {
  onBack: () => void
}

const CAPABILITIES = [
  { icon: FileMagnifyingGlass, title: 'Document Ingestion', description: 'Process PDFs, scanned images, audio, video, and digital media into searchable, indexed records with full metadata extraction and deduplication.' },
  { icon: MagnifyingGlass, title: 'OCR & Full-Text Search', description: 'Optical character recognition with confidence scoring on scanned and redacted documents. Millisecond full-text search across millions of records.' },
  { icon: Fingerprint, title: 'Chain of Custody', description: 'Cryptographic verification from ingestion through export. Tamper-evident SHA-256 hashing with audit-ready provenance trails.' },
  { icon: ShieldCheck, title: 'Audit Trails', description: 'Every access, modification, and export is logged with timestamps and user identity. Complete reconstructability for legal proceedings.' },
  { icon: Database, title: 'Evidence Processing', description: 'Batch processing pipelines for large document sets. Cross-reference entities, dates, and locations across thousands of records automatically.' },
  { icon: LinkSimple, title: 'Cross-Document Linking', description: 'Entity graphs connecting people, organizations, locations, and events across the entire corpus for rapid pattern discovery.' },
]

const SATELLITE_IDS = ['civics-hierarchy', 'doj-document-library', 'informed-consent', 'essential-goods-ledger', 'geneva-bible-study', 'contractor-command-center']
const SATELLITE_APPS = PROJECT_REGISTRY.filter(p => SATELLITE_IDS.includes(p.id))

const PRICING_TIERS = [
  { name: 'Platform License', description: 'Full e-discovery suite deployed to your infrastructure. Includes all processing engines, search, and audit modules.', cta: 'Request Pricing' },
  { name: 'White-Label', description: 'Rebrand and deploy Evident processing capabilities under your identity for client-facing evidence management.', cta: 'Request Pricing' },
  { name: 'API Access', description: 'Programmatic access to ingestion, OCR, search, and chain-of-custody APIs. REST + webhook integration.', cta: 'Request Access' },
]

export default function EvidentSitePage({ onBack }: EvidentSitePageProps) {
  const prefersReducedMotion = useReducedMotion()
  const { status: formStatus, errorMessage, submit: submitForm, reset: resetForm } = useFormSubmit('evident')

  usePageMeta({
    title: 'Evident Technologies — Enterprise E-Discovery & Evidence Processing',
    description: 'Enterprise e-discovery platform for legal teams, government agencies, and investigators. Document ingestion, OCR, chain-of-custody, and cryptographic audit trails.',
    path: '/evident-site',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'Evident E-Discovery Suite',
        'applicationCategory': 'BusinessApplication',
        'applicationSubCategory': 'Legal Technology',
        'operatingSystem': 'Web',
        'description': 'Enterprise e-discovery and evidence processing platform — document ingestion, OCR, chain-of-custody tracking, and cryptographic audit trails.',
        'url': 'https://www.xtx396.com',
        'creator': {
          '@type': 'Organization',
          'name': 'Evident Technologies LLC',
          'url': 'https://www.xtx396.com',
        },
        'offers': [
          { '@type': 'Offer', 'name': 'Platform License', 'description': 'Full-featured on-premise or hosted deployment' },
          { '@type': 'Offer', 'name': 'White-Label', 'description': 'Rebrandable evidence processing suite' },
          { '@type': 'Offer', 'name': 'API Access', 'description': 'REST API for ingestion, OCR, search, and custody verification' },
        ],
      },
    ],
  })

  const handleInquiry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    submitForm(new FormData(e.currentTarget))
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] text-gray-100">
      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0c10]/95 backdrop-blur-xl border-b border-gray-800/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={onBack} className="text-gray-400 hover:text-white text-sm transition-colors">
              <ArrowLeft className="h-4 w-4 inline mr-2" aria-hidden="true" />
              Back
            </button>
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold tracking-tight">
                <span className="text-emerald-400">Evident</span> Technologies
              </span>
            </div>
            <a
              href="https://www.xtx396.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Live Platform
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-transparent to-transparent -z-10" />
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <Badge className="mb-6 text-xs px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              Evident Technologies LLC
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
              Evidence Processing<br />
              <span className="text-emerald-400">at Enterprise Scale</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl leading-relaxed mb-10">
              E-discovery platform for legal teams, government agencies, and investigators. 
              Ingest documents. Extract data. Verify custody. Search everything.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#inquiry" className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors">
                Request a Demo
              </a>
              <a href="#capabilities" className="px-6 py-3 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-300 font-medium transition-colors">
                Platform Overview
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <SectionContainer id="capabilities" maxWidth="7xl" separator={false} gradient={false} className="bg-[#0a0c10]">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Platform Capabilities</h2>
        <p className="text-gray-400 max-w-3xl mb-12">
          Six core modules form the foundation of every Evident deployment. Each module operates
          independently or as part of an integrated pipeline.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {CAPABILITIES.map((cap, idx) => (
            <motion.div
              key={cap.title}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
            >
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-6 h-full hover:border-emerald-800/40 transition-colors">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 w-fit mb-4">
                  <cap.icon className="h-5 w-5 text-emerald-400" weight="duotone" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-white mb-2">{cap.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{cap.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      {/* ── Live Demo: DOJ Document Library ── */}
      <SectionContainer maxWidth="5xl" separator={false} gradient={false} className="bg-[#0a0c10]">
        <div className="rounded-xl border border-amber-800/30 bg-amber-900/10 p-8 sm:p-10">
          <Badge className="mb-4 text-xs px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400">
            Featured Demo
          </Badge>
          <h2 className="text-3xl font-bold text-white mb-4">DOJ Document Library</h2>
          <p className="text-gray-400 max-w-3xl leading-relaxed mb-6">
            The DOJ Document Library at <a href="https://library.xtx396.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline decoration-amber-400/30">library.xtx396.com</a> indexes
            publicly released Epstein case documents — court filings, depositions, flight logs, and FOIA responses.
            Every feature visible to the public runs on the same Evident e-discovery engine available to institutional clients.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://library.xtx396.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 font-medium hover:bg-amber-600/30 transition-colors"
            >
              <ArrowSquareOut className="h-4 w-4" aria-hidden="true" />
              Open Library
            </a>
          </div>
        </div>
      </SectionContainer>

      {/* ── Satellite Applications ── */}
      <SectionContainer maxWidth="7xl" separator={false} gradient={false} className="bg-[#0a0c10]">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Ecosystem Applications</h2>
        <p className="text-gray-400 max-w-3xl mb-10">
          Six domain-specific applications extend the Evident platform into civic technology,
          economic analysis, legal research, and project management.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SATELLITE_APPS.map((app, idx) => (
            <motion.div
              key={app.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-gray-800/60 bg-gray-900/40 p-5 h-full hover:border-emerald-800/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors">{app.name}</h3>
                  <Badge variant="outline" className="text-[10px] shrink-0 border-gray-700 text-gray-500">{app.status === 'live' ? 'Live' : app.status}</Badge>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{app.tagline}</p>
                {app.domain && (
                  <span className="text-[10px] font-mono text-gray-600">{app.domain}</span>
                )}
              </a>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      {/* ── Pricing ── */}
      <SectionContainer maxWidth="7xl" separator={false} gradient={false} className="bg-[#0a0c10]">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Licensing & Access</h2>
        <p className="text-gray-400 max-w-3xl mb-10">
          Evident is available through three deployment models. All include access to the full
          processing pipeline and ongoing platform updates.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRICING_TIERS.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-6 h-full flex flex-col">
                <h3 className="font-semibold text-white mb-2">{tier.name}</h3>
                <p className="text-sm text-gray-400 leading-relaxed flex-1 mb-4">{tier.description}</p>
                <a
                  href="#inquiry"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  {tier.cta}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      {/* ── Inquiry Form ── */}
      <SectionContainer id="inquiry" maxWidth="5xl" separator={false} gradient={false} className="bg-[#0a0c10]">
        <div className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-8 sm:p-10">
          <h2 className="text-3xl font-bold text-white mb-3">Licensing Inquiry</h2>
          <p className="text-gray-400 mb-8">
            Describe your use case and we'll respond within 2 business days with a tailored proposal.
          </p>

          {formStatus === 'success' ? (
            <div className="text-center py-12">
              <Envelope className="h-10 w-10 text-emerald-400 mx-auto mb-4" weight="duotone" aria-hidden="true" />
              <h3 className="text-xl font-semibold text-white mb-2">Inquiry Received</h3>
              <p className="text-gray-400">We'll review your request and follow up shortly.</p>
              <button onClick={resetForm} className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 underline">Submit another inquiry</button>
            </div>
          ) : (
            <form onSubmit={handleInquiry} className="space-y-6">
              {/* Honeypot */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-700 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-700 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                    placeholder="you@organization.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-300 mb-1.5">Organization</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-700 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                  placeholder="Company or agency name"
                />
              </div>

              <div>
                <label htmlFor="interest" className="block text-sm font-medium text-gray-300 mb-1.5">Interest</label>
                <select
                  id="interest"
                  name="interest"
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                >
                  <option value="license">Platform License</option>
                  <option value="white-label">White-Label Solution</option>
                  <option value="api">API Access</option>
                  <option value="demo">Live Demo</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1.5">Use Case</label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-gray-800/60 border border-gray-700 text-white placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 resize-y"
                  placeholder="Describe your evidence processing needs, volume, and timeline..."
                />
              </div>

              {formStatus === 'error' && (
                <p className="text-sm text-red-400" role="alert">{errorMessage}</p>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {formStatus === 'submitting' && <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {formStatus === 'submitting' ? 'Submitting...' : 'Submit Inquiry'}
                </button>
                <p className="text-[10px] text-gray-500">By submitting, you agree to our <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">Privacy Policy</a>.</p>
              </div>
            </form>
          )}
        </div>
      </SectionContainer>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800/60 py-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Evident Technologies LLC. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <a href="https://devon-tyler.com" className="hover:text-gray-300 transition-colors">Founder Hub</a>
            <a href="https://devon-tyler.com/#developers" className="hover:text-gray-300 transition-colors">Developers</a>
            <a href="https://devon-tyler.com/privacy.html" className="hover:text-gray-300 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
