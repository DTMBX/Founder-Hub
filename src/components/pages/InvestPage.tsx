import { ArrowLeft, ChartLineUp, CheckCircle, Code, Download, Envelope, Handshake, PaperPlaneTilt, CircleNotch } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import { useFormSubmit } from '@/hooks/use-form-submit'
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
  const { status: formStatus, errorMessage, submit: submitForm, reset: resetForm } = useFormSubmit('investor')
  const formRef = useRef<HTMLFormElement>(null)

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
            {formStatus === 'success' ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-fit rounded-full bg-emerald-500/10 p-4">
                  <CheckCircle className="h-10 w-10 text-emerald-500" weight="fill" />
                </div>
                <h2 className="text-2xl font-bold">Inquiry Received</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We will review your message and respond within 2 business days.
                </p>
                <Button variant="outline" size="sm" onClick={resetForm}>
                  Submit another inquiry
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4 mb-6">
                  <div className="rounded-xl bg-primary/10 p-4 shrink-0">
                    <Envelope className="h-8 w-8 text-primary" weight="duotone" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold">Get in Touch</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Interested in collaborating, investing, or licensing? Every conversation starts with transparency.
                    </p>
                  </div>
                </div>
                <form
                  ref={formRef}
                  onSubmit={(e) => {
                    e.preventDefault()
                    submitForm(new FormData(e.currentTarget))
                  }}
                  className="space-y-4"
                >
                  {/* Honeypot */}
                  <input type="text" name="company_url" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="inv-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name *</label>
                      <input
                        id="inv-name"
                        name="name"
                        type="text"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="inv-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email *</label>
                      <input
                        id="inv-email"
                        name="email"
                        type="email"
                        required
                        className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="inv-company" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</label>
                      <input
                        id="inv-company"
                        name="companyName"
                        type="text"
                        className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Organization name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="inv-interest" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interest</label>
                      <select
                        id="inv-interest"
                        name="interest"
                        className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Select one...</option>
                        <option value="strategic-investment">Strategic Investment</option>
                        <option value="licensing">Platform Licensing</option>
                        <option value="partnership">Partnership</option>
                        <option value="open-source">Open-Source Collaboration</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="inv-message" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Message *</label>
                    <textarea
                      id="inv-message"
                      name="message"
                      required
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                      placeholder="Tell us about your interest..."
                    />
                  </div>

                  {formStatus === 'error' && (
                    <p className="text-sm text-red-400">{errorMessage}</p>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <Button type="submit" size="lg" disabled={formStatus === 'submitting'} className="gap-2">
                      {formStatus === 'submitting' ? (
                        <><CircleNotch className="h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        <><PaperPlaneTilt className="h-4 w-4" /> Send Inquiry</>
                      )}
                    </Button>
                    <Button asChild variant="outline" size="lg" className="shrink-0">
                      <a href="/downloads/devon-tyler-barber-overview.pdf" download className="gap-2">
                        <Download className="h-4 w-4" />
                        One-Pager PDF
                      </a>
                    </Button>
                  </div>
                </form>
              </>
            )}
          </GlassCard>
        </motion.div>
      </SectionContainer>
    </div>
  )
}
