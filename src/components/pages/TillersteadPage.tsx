import { ArrowLeft, ArrowSquareOut, Buildings, CircleNotch, Envelope, HardHat, House, Images, MapPin, Ruler, Star, Wrench } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { useFormSubmit } from '@/hooks/use-form-submit'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { PortfolioGallery } from '@/components/PortfolioGallery'
import { SectionContainer } from '@/components/ui/section-container'
import { usePageMeta } from '@/hooks/use-page-meta'

interface TillersteadPageProps {
  onBack: () => void
  onNavigateToProject: (projectId: string) => void
}

const SERVICES = [
  {
    icon: Ruler,
    title: 'TCNA-Compliant Tile Installation',
    description: 'Professional tile work meeting Tile Council of North America standards. Floors, showers, backsplashes, and custom patterns.',
  },
  {
    icon: House,
    title: 'Home Improvement',
    description: 'General contracting for residential renovation — kitchens, bathrooms, flooring, and structural improvements.',
  },
  {
    icon: HardHat,
    title: 'Project Management',
    description: 'Full project coordination from estimate through completion. Transparent timelines, documented change orders, and progress photos.',
  },
  {
    icon: Buildings,
    title: 'Land Stewardship',
    description: 'Property improvement planning — grading, fencing, drainage, and structural assessments for self-reliant property owners.',
  },
]

const CREDENTIALS = [
  { label: 'NJ HIC License', value: '#13VH10808800' },
  { label: 'Service Area', value: 'South Jersey' },
  { label: 'Specialization', value: 'Tile & General Contracting' },
  { label: 'Standards', value: 'TCNA Compliant' },
]

const SERVICE_COUNTIES = [
  'Atlantic', 'Burlington', 'Camden', 'Cape May', 'Cumberland',
  'Gloucester', 'Mercer', 'Ocean', 'Salem',
]

const PROJECT_TYPES = [
  'Tile Installation',
  'Bathroom Renovation',
  'Kitchen Remodel',
  'Flooring',
  'General Contracting',
  'Land Improvement',
  'Other',
]

const BUDGET_RANGES = [
  'Under $5,000',
  '$5,000 – $15,000',
  '$15,000 – $30,000',
  '$30,000 – $50,000',
  '$50,000+',
  'Not sure yet',
]

export default function TillersteadPage({ onBack, onNavigateToProject }: TillersteadPageProps) {
  const prefersReducedMotion = useReducedMotion()
  const { status: formStatus, errorMessage, submit: submitForm, reset: resetForm } = useFormSubmit('tillerstead')

  usePageMeta({
    title: 'Tillerstead — Licensed NJ Home Improvement Contractor',
    description: 'Tillerstead LLC — TCNA-compliant tile installation and home improvement contracting in South Jersey. NJ HIC #13VH10808800.',
    path: '/tillerstead',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'HomeAndConstructionBusiness',
        'name': 'Tillerstead LLC',
        'description': 'TCNA-compliant tile installation and home improvement contracting in South Jersey.',
        'url': 'https://tillerstead.com',
        'telephone': '',
        'areaServed': SERVICE_COUNTIES.map(county => ({
          '@type': 'AdministrativeArea',
          'name': `${county} County, NJ`,
        })),
        'serviceArea': {
          '@type': 'GeoShape',
          'name': 'South Jersey',
          'addressRegion': 'NJ',
        },
        'hasCredential': {
          '@type': 'EducationalOccupationalCredential',
          'credentialCategory': 'Home Improvement Contractor License',
          'recognizedBy': {
            '@type': 'GovernmentOrganization',
            'name': 'State of New Jersey',
          },
          'identifier': '13VH10808800',
        },
        'founder': {
          '@type': 'Person',
          'name': 'Devon Tyler Barber',
          'url': 'https://devon-tyler.com',
        },
        'knowsAbout': ['Tile Installation', 'Home Improvement', 'TCNA Compliance', 'General Contracting'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        'name': 'Tillerstead LLC',
        'url': 'https://tillerstead.com',
        'address': {
          '@type': 'PostalAddress',
          'addressRegion': 'NJ',
          'addressCountry': 'US',
        },
        'areaServed': {
          '@type': 'State',
          'name': 'New Jersey',
        },
        'priceRange': '$$',
      },
    ],
  })

  const handleInquiry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    submitForm(new FormData(e.currentTarget))
  }

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
              href="https://tillerstead.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <ArrowSquareOut className="h-3.5 w-3.5" aria-hidden="true" />
              tillerstead.com
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
            NJ HIC #13VH10808800
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Tillerstead
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-4xl leading-relaxed mb-4">
            Licensed NJ home improvement contractor specializing in TCNA-compliant tile installation, 
            residential renovation, and land stewardship. Quality craftsmanship backed by transparent 
            project management and documented accountability.
          </p>
          <p className="text-sm text-muted-foreground/70 max-w-3xl leading-relaxed mb-8">
            Tillerstead LLC combines hands-on contracting with the same transparency and documentation principles 
            that power the Evident technology platform — progress photos, itemized estimates, change order logs, 
            and client-accessible project dashboards.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://tillerstead.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Wrench className="h-4 w-4" aria-hidden="true" />
              Visit tillerstead.com
            </a>
            <button
              onClick={() => onNavigateToProject('contractor-command-center')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <HardHat className="h-4 w-4" aria-hidden="true" />
              Contractor Command Center
            </button>
          </div>
        </motion.div>

        {/* ── Credentials ── */}
        <section aria-labelledby="credentials-heading" className="mb-16">
          <h2 id="credentials-heading" className="text-2xl sm:text-3xl font-bold mb-6">Credentials</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CREDENTIALS.map((cred, idx) => (
              <motion.div
                key={cred.label}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <GlassCard intensity="medium" className="p-5 text-center h-full">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{cred.label}</p>
                  <p className="font-semibold text-sm">{cred.value}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Services ── */}
        <section aria-labelledby="services-heading" className="mb-16">
          <h2 id="services-heading" className="text-2xl sm:text-3xl font-bold mb-8">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {SERVICES.map((svc, idx) => (
              <motion.div
                key={svc.title}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
              >
                <GlassCard intensity="medium" className="p-6 h-full">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 shrink-0">
                      <svc.icon className="h-5 w-5 text-emerald-400" weight="duotone" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">{svc.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{svc.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Technology-Backed Contracting ── */}
        <section aria-labelledby="tech-heading" className="mb-16">
          <h2 id="tech-heading" className="text-2xl sm:text-3xl font-bold mb-4">Technology-Backed Contracting</h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed mb-6">
            Tillerstead uses the{' '}
            <button
              onClick={() => onNavigateToProject('contractor-command-center')}
              className="text-blue-400 hover:text-blue-300 underline decoration-blue-400/30"
            >
              Contractor Command Center
            </button>
            {' '}— a PWA built on Evident infrastructure — to give clients full visibility into their project.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Star, label: 'Itemized Estimates', desc: 'Line-item breakdowns for every scope of work' },
              { icon: Star, label: 'Progress Documentation', desc: 'Before/after photos at every milestone' },
              { icon: Star, label: 'Change Order Tracking', desc: 'Logged, timestamped, and mutually signed' },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <GlassCard intensity="low" className="p-5 h-full">
                  <item.icon className="h-5 w-5 text-blue-400 mb-3" weight="fill" aria-hidden="true" />
                  <h3 className="font-semibold text-sm mb-1">{item.label}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Service Area ── */}
        <section aria-labelledby="service-area-heading" className="mb-16">
          <h2 id="service-area-heading" className="text-2xl sm:text-3xl font-bold mb-4">
            <MapPin className="h-6 w-6 inline mr-2 text-emerald-400" weight="duotone" aria-hidden="true" />
            Service Area
          </h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed mb-6">
            Tillerstead serves residential and light commercial clients across South Jersey.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {SERVICE_COUNTIES.map(county => (
              <GlassCard key={county} intensity="low" className="p-3 text-center">
                <p className="text-xs font-medium">{county}</p>
                <p className="text-[10px] text-muted-foreground">County, NJ</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── Project Gallery (placeholder slots) ── */}
        <section aria-labelledby="gallery-heading" className="mb-16">
          <h2 id="gallery-heading" className="text-2xl sm:text-3xl font-bold mb-4">
            <Images className="h-6 w-6 inline mr-2 text-emerald-400" weight="duotone" aria-hidden="true" />
            Project Portfolio
          </h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed mb-6">
            Before &amp; after documentation from completed projects. Photo documentation is standard on every Tillerstead job.
          </p>
          <PortfolioGallery />
        </section>

        {/* ── Project Inquiry Form ── */}
        <section aria-labelledby="inquiry-heading" className="mb-16" id="inquiry">
          <h2 id="inquiry-heading" className="text-2xl sm:text-3xl font-bold mb-4">
            <Envelope className="h-6 w-6 inline mr-2 text-emerald-400" weight="duotone" aria-hidden="true" />
            Project Inquiry
          </h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed mb-6">
            Submit your project details for a free estimate. NJ HIC #13VH10808800.
          </p>

          <GlassCard intensity="medium" className="p-6 sm:p-8">
            {formStatus === 'success' ? (
              <div className="text-center py-10">
                <Envelope className="h-10 w-10 text-emerald-400 mx-auto mb-4" weight="duotone" aria-hidden="true" />
                <h3 className="text-xl font-semibold mb-2">Inquiry Received</h3>
                <p className="text-muted-foreground">We'll review your project details and follow up with an estimate.</p>
                <button onClick={resetForm} className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 underline">Submit another inquiry</button>
              </div>
            ) : (
              <form onSubmit={handleInquiry} className="space-y-5">
                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="company_url">Company URL</label>
                  <input type="text" id="company_url" name="company_url" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="inq-name" className="block text-sm font-medium mb-1.5">Name *</label>
                    <input type="text" id="inq-name" name="name" required className="w-full px-4 py-2.5 rounded-lg bg-card/40 border border-border/50 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" placeholder="Full name" />
                  </div>
                  <div>
                    <label htmlFor="inq-address" className="block text-sm font-medium mb-1.5">Property Address *</label>
                    <input type="text" id="inq-address" name="address" required className="w-full px-4 py-2.5 rounded-lg bg-card/40 border border-border/50 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" placeholder="Street address, City, NJ" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="inq-type" className="block text-sm font-medium mb-1.5">Project Type *</label>
                    <select id="inq-type" name="project_type" required className="w-full px-4 py-2.5 rounded-lg bg-card/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                      <option value="">Select type...</option>
                      {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="inq-budget" className="block text-sm font-medium mb-1.5">Budget Range</label>
                    <select id="inq-budget" name="budget" className="w-full px-4 py-2.5 rounded-lg bg-card/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
                      <option value="">Select range...</option>
                      {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="inq-desc" className="block text-sm font-medium mb-1.5">Project Description *</label>
                  <textarea id="inq-desc" name="description" required rows={4} className="w-full px-4 py-2.5 rounded-lg bg-card/40 border border-border/50 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y" placeholder="Describe the scope, dimensions, current condition, and any specific materials or requirements..." />
                </div>

                <div>
                  <label htmlFor="inq-email" className="block text-sm font-medium mb-1.5">Email *</label>
                  <input type="email" id="inq-email" name="email" required className="w-full px-4 py-2.5 rounded-lg bg-card/40 border border-border/50 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40" placeholder="you@email.com" />
                </div>

                {formStatus === 'error' && (
                  <p className="text-sm text-red-400" role="alert">{errorMessage}</p>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button type="submit" disabled={formStatus === 'submitting'} className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                    {formStatus === 'submitting' && <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {formStatus === 'submitting' ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                  <p className="text-[10px] text-muted-foreground/60">By submitting, you agree to our <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">Privacy Policy</a>.</p>
                </div>
              </form>
            )}
          </GlassCard>
        </section>

        {/* ── CTA ── */}
        <GlassCard intensity="high" className="p-8 text-center">
          <Badge variant="secondary" className="mb-3 text-xs px-3 py-1 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            NJ HIC #13VH10808800
          </Badge>
          <h2 className="text-2xl font-bold mb-3">Ready to Start a Project?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Contact Devon for a free estimate. Licensed, insured, and backed by the same 
            accountability standards that govern every Evident Technologies venture.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="#inquiry"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Get a Free Estimate
            </a>
            <a
              href="https://tillerstead.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              tillerstead.com →
            </a>
          </div>
        </GlassCard>
      </SectionContainer>
    </div>
  )
}
