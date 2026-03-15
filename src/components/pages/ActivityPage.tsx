import { ArrowLeft, FileText, Funnel, GitCommit, Globe, RocketLaunch } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import ActivityFeed from '@/components/ActivityFeed'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import type { ActivityType } from '@/data/activity'
import { ACTIVITY_FEED } from '@/data/activity'
import { usePageMeta } from '@/hooks/use-page-meta'

interface ActivityPageProps {
  onBack: () => void
}

type FilterKey = 'all' | ActivityType

const FILTERS: { key: FilterKey; label: string; icon: typeof GitCommit }[] = [
  { key: 'all', label: 'All', icon: Funnel },
  { key: 'repo', label: 'Repositories', icon: GitCommit },
  { key: 'documentation', label: 'Documentation', icon: FileText },
  { key: 'domain', label: 'Domains', icon: Globe },
  { key: 'release', label: 'Releases', icon: RocketLaunch },
]

export default function ActivityPage({ onBack }: ActivityPageProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const prefersReducedMotion = useReducedMotion()

  usePageMeta({
    title: 'Ecosystem Activity — Devon Tyler Barber',
    description: 'Chronological timeline of ecosystem events — repository updates, documentation changes, domain status, and releases.',
    path: '/activity',
  })

  const filtered = filter === 'all'
    ? ACTIVITY_FEED
    : ACTIVITY_FEED.filter(e => e.type === filter)

  const typeCounts: Record<string, number> = {}
  for (const e of ACTIVITY_FEED) {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Ecosystem Activity</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-8">
            Chronological timeline of updates across all projects, documentation, and infrastructure.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mb-10">
            <Badge variant="secondary" className="text-xs px-3 py-1">
              {ACTIVITY_FEED.length} events
            </Badge>
            <Badge variant="outline" className="text-xs px-3 py-1 text-blue-400 border-blue-500/30">
              {typeCounts['repo'] || 0} repo
            </Badge>
            <Badge variant="outline" className="text-xs px-3 py-1 text-amber-400 border-amber-500/30">
              {typeCounts['documentation'] || 0} docs
            </Badge>
            <Badge variant="outline" className="text-xs px-3 py-1 text-violet-400 border-violet-500/30">
              {typeCounts['domain'] || 0} domain
            </Badge>
          </div>
        </motion.div>

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                filter === f.key
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-border/40 bg-card/30 text-muted-foreground hover:text-foreground hover:border-border/60'
              }`}
            >
              <f.icon className="h-3.5 w-3.5" weight="bold" aria-hidden="true" />
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Timeline feed ── */}
        <GlassCard intensity="medium" className="p-5 sm:p-8 mb-14">
          {filtered.length > 0 ? (
            <ActivityFeed events={filtered} limit={filtered.length} showTimeline />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events match this filter.
            </p>
          )}
        </GlassCard>

        {/* ── API callout ── */}
        <GlassCard intensity="low" className="p-5 sm:p-6 mb-14">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-1">Activity API</h3>
              <p className="text-xs text-muted-foreground">
                This feed is also available as a machine-readable JSON endpoint.
              </p>
            </div>
            <a
              href="/api/activity.json"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-xs font-mono text-emerald-400 transition-all hover:-translate-y-0.5"
            >
              /api/activity.json
            </a>
          </div>
        </GlassCard>
      </SectionContainer>
    </div>
  )
}
