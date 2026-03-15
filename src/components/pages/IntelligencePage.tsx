import { ArrowLeft, Lightbulb } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'

import ActivityTrendChart from '@/components/intelligence/ActivityTrendChart'
import EcosystemStats from '@/components/intelligence/EcosystemStats'
import LanguageDistributionChart from '@/components/intelligence/LanguageDistributionChart'
import ProjectCategoryChart from '@/components/intelligence/ProjectCategoryChart'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import { usePageMeta } from '@/hooks/use-page-meta'
import { computeActivityTrend, computeMetrics, deriveInsights } from '@/lib/ecosystem-intelligence'

interface IntelligencePageProps {
  onBack: () => void
}

export default function IntelligencePage({ onBack }: IntelligencePageProps) {
  const prefersReducedMotion = useReducedMotion()

  usePageMeta({
    title: 'Ecosystem Intelligence — Devon Tyler Barber',
    description: 'Analytics dashboard visualizing project distribution, technology usage, and activity trends across the ecosystem.',
    path: '/intelligence',
  })

  const metrics = useMemo(() => computeMetrics(), [])
  const activityTrend = useMemo(() => computeActivityTrend(), [])
  const insights = useMemo(() => deriveInsights(), [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Home
            </button>
          </div>
        </div>
      </div>

      <SectionContainer maxWidth="5xl" separator={false} className="pt-12 sm:pt-16">
        {/* ── Hero ── */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Ecosystem Intelligence</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-10">
            Analytical overview of project distribution, technology stack, and activity patterns — derived from live ecosystem data.
          </p>
        </motion.div>

        {/* ── Key metrics row ── */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <EcosystemStats metrics={metrics} />
        </motion.div>

        {/* ── Charts — row 2: category + language ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard intensity="medium" className="p-5 sm:p-6">
              <h2 className="text-sm font-semibold mb-4">Projects by Category</h2>
              <ProjectCategoryChart data={metrics.projectsByCategory} />
            </GlassCard>
          </motion.div>

          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard intensity="medium" className="p-5 sm:p-6">
              <h2 className="text-sm font-semibold mb-4">Technology Distribution</h2>
              <LanguageDistributionChart data={metrics.languageDistribution} />
            </GlassCard>
          </motion.div>
        </div>

        {/* ── Charts — row 3: activity trend ── */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-10"
        >
          <GlassCard intensity="medium" className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold mb-4">Activity Over Time</h2>
            <ActivityTrendChart data={activityTrend} />
          </GlassCard>
        </motion.div>

        {/* ── Insights ── */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-10"
        >
          <GlassCard intensity="low" className="p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4 text-amber-400" weight="bold" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Derived Insights</h2>
            </div>
            <ul className="space-y-2">
              {insights.map((ins, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground shrink-0">{ins.label}:</span>
                  <span className="font-medium">{ins.value}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        </motion.div>

        {/* ── API call-out ── */}
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-14"
        >
          <GlassCard intensity="low" className="p-5 sm:p-6">
            <h3 className="text-sm font-semibold mb-2">Data Sources</h3>
            <p className="text-xs text-muted-foreground mb-4">
              All metrics on this page are computed from the public ecosystem API. Integrate
              these endpoints into your own dashboards or analytics pipelines.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/api/ecosystem.json"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-xs font-mono text-emerald-400 transition-all hover:-translate-y-0.5"
              >
                /api/ecosystem.json
              </a>
              <a
                href="/api/activity.json"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-xs font-mono text-blue-400 transition-all hover:-translate-y-0.5"
              >
                /api/activity.json
              </a>
            </div>
          </GlassCard>
        </motion.div>
      </SectionContainer>
    </div>
  )
}
