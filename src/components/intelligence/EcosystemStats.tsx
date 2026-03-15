import { Buildings, ChartBar, GitBranch, Lightning, ProjectorScreen, Timer } from '@phosphor-icons/react'

import { GlassCard } from '@/components/ui/glass-card'
import type { EcosystemMetrics } from '@/lib/ecosystem-intelligence'

interface EcosystemStatsProps {
  metrics: EcosystemMetrics
}

const STAT_CARDS: {
  key: keyof EcosystemMetrics
  label: string
  icon: typeof ChartBar
  color: string
  format?: (v: unknown) => string
}[] = [
  { key: 'totalProjects', label: 'Projects', icon: ProjectorScreen, color: 'text-emerald-400' },
  { key: 'totalOrganizations', label: 'Organizations', icon: Buildings, color: 'text-blue-400' },
  { key: 'totalRelationshipEdges', label: 'Relationship Edges', icon: GitBranch, color: 'text-violet-400' },
  { key: 'activeProjects', label: 'Active (90 d)', icon: Lightning, color: 'text-amber-400' },
  { key: 'eventsLast30Days', label: 'Events (30 d)', icon: ChartBar, color: 'text-rose-400' },
  {
    key: 'averageUpdateIntervalDays',
    label: 'Avg Update Interval',
    icon: Timer,
    color: 'text-teal-400',
    format: v => (v != null ? `${v} days` : '—'),
  },
]

export default function EcosystemStats({ metrics }: EcosystemStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {STAT_CARDS.map(card => {
        const raw = metrics[card.key]
        const display = card.format ? card.format(raw) : String(raw ?? 0)
        return (
          <GlassCard key={card.key} intensity="medium" className="p-4 text-center">
            <card.icon className={`h-5 w-5 mx-auto mb-2 ${card.color}`} weight="bold" aria-hidden="true" />
            <p className="text-2xl font-bold tabular-nums">{display}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{card.label}</p>
          </GlassCard>
        )
      })}
    </div>
  )
}
