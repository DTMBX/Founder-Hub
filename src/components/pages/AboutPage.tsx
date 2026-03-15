import {
  ArrowLeft,
  Briefcase,
  Certificate,
  Compass,
  Sparkle,
  Target,
  TreeStructure,
} from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { lazy, Suspense } from 'react'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import {
  buildPersonSchema,
  CAREER_TIMELINE,
  COMPETENCIES,
  CREDENTIALS,
} from '@/data/credentials'
import { usePageMeta } from '@/hooks/use-page-meta'
import { useKV } from '@/lib/local-storage-kv'

const ProjectTimeline = lazy(() => import('@/components/ProjectTimeline'))
const ProjectGraph = lazy(() => import('@/components/ProjectGraph'))

interface AboutPageProps {
  onBack: () => void
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const [aboutContent] = useKV<{
    mission: string
    currentFocus: string
    values: string[]
    updates: Array<{ date: string; title: string; content: string }>
  }>('founder-hub-about', {
    mission: 'Building systems where technology, craftsmanship, transparency, and justice converge.',
    currentFocus: 'Building civic technology, home improvement platforms, and legal infrastructure that increase transparency and empower communities.',
    values: ['Integrity', 'Stewardship', 'Fortitude', 'Veracity'],
    updates: [
      {
        date: '2025-06',
        title: 'Evident Ecosystem Launch',
        content: 'Eight satellite apps deployed — civic tech, legal tools, and accountability platforms now live across xtx396.com subdomains.'
      }
    ]
  })

  const prefersReducedMotion = useReducedMotion()

  const siteUrl = 'https://devon-tyler.com'

  usePageMeta({
    title: 'About Devon Tyler Barber',
    description: 'Entrepreneur & technologist building civic technology, home improvement platforms, and transparency tools. Learn about the mission, values, and current focus.',
    path: '/about',
    jsonLd: [buildPersonSchema(siteUrl)],
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Home
            </Button>
          </div>
        </div>
      </div>

      <SectionContainer maxWidth="5xl" separator={false} className="pt-12 sm:pt-16">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">About Devon</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-14">
            Entrepreneur & technologist building civic technology, home improvement platforms, and transparency tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <GlassCard intensity="high" className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-muted-foreground" weight="duotone" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {aboutContent?.mission}
            </p>
          </GlassCard>

          <GlassCard intensity="high" className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Compass className="h-6 w-6 text-muted-foreground" weight="duotone" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Current Focus</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {aboutContent?.currentFocus}
            </p>
          </GlassCard>
        </div>

        {aboutContent?.values && aboutContent.values.length > 0 && (
          <GlassCard intensity="medium" className="p-6 sm:p-8 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Sparkle className="h-6 w-6 text-muted-foreground" weight="duotone" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Core Values</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {aboutContent.values.map(value => (
                <span key={value} className="px-4 py-2 rounded-lg border border-border/40 bg-card/30 text-sm font-medium">
                  {value}
                </span>
              ))}
            </div>
          </GlassCard>
        )}

        {aboutContent?.updates && aboutContent.updates.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Recent Updates</h2>
            <div className="space-y-4">
              {aboutContent.updates.map((update, i) => (
                <GlassCard key={i} intensity="low" className="p-5 sm:p-6">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-xs font-mono text-muted-foreground/60">{update.date}</span>
                    <h3 className="font-semibold">{update.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{update.content}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Credentials & Licenses ── */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Certificate className="h-6 w-6 text-muted-foreground" weight="duotone" aria-hidden="true" />
            Credentials & Licenses
          </h2>
          <div className="space-y-3">
            {CREDENTIALS.map(cred => (
              <GlassCard key={cred.id} intensity="low" className="p-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm">{cred.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cred.issuer}{cred.identifier ? ` · ${cred.identifier}` : ''}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium border ${cred.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400'}`}>
                    {cred.status === 'active' ? 'Active' : 'Completed'}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* ── Career Timeline ── */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-muted-foreground" weight="duotone" aria-hidden="true" />
            Career Timeline
          </h2>
          <div className="relative pl-6 border-l border-border/40 space-y-6">
            {CAREER_TIMELINE.map(entry => (
              <div key={entry.id} className="relative">
                <div className="absolute -left-[calc(1.5rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-primary/60 border-2 border-background" />
                <span className="text-xs font-mono text-muted-foreground/60">{entry.year}</span>
                <h3 className="font-semibold text-sm mt-0.5">{entry.role}</h3>
                <p className="text-xs text-muted-foreground">{entry.organization}</p>
                <p className="text-sm text-muted-foreground/80 mt-1 leading-relaxed">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Competency Matrix ── */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <TreeStructure className="h-6 w-6 text-muted-foreground" weight="duotone" aria-hidden="true" />
            Competency Matrix
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COMPETENCIES.map(comp => (
              <GlassCard key={comp.id} intensity="low" className="p-5">
                <h3 className="font-semibold text-sm mb-3">{comp.domain}</h3>
                <div className="flex flex-wrap gap-2">
                  {comp.skills.map(skill => (
                    <span key={skill} className="px-2.5 py-1 rounded-md border border-border/30 bg-card/30 text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* ── Project Timeline ── */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Project Timeline</h2>
          <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-card/30" />}>
            <ProjectTimeline />
          </Suspense>
        </div>

        {/* ── Ecosystem Graph ── */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Ecosystem Graph</h2>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-card/30" />}>
            <ProjectGraph />
          </Suspense>
        </div>
      </SectionContainer>
    </div>
  )
}
