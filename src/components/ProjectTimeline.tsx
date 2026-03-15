/**
 * ProjectTimeline — chronological view of platform development.
 *
 * Reads created / lastUpdated dates from the project registry and
 * renders a vertical timeline on the About page.
 */

import { CalendarBlank, RocketLaunch } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { PROJECT_REGISTRY } from '@/data/projects'

interface TimelineEvent {
  date: string
  label: string
  projectName: string
  type: 'created' | 'updated'
  accentColor: string
}

function buildTimeline(): TimelineEvent[] {
  const events: TimelineEvent[] = []

  for (const p of PROJECT_REGISTRY) {
    if (p.created) {
      events.push({
        date: p.created,
        label: `${p.name} launched`,
        projectName: p.name,
        type: 'created',
        accentColor: p.accentColor,
      })
    }
    if (p.lastUpdated && p.lastUpdated !== p.created) {
      events.push({
        date: p.lastUpdated,
        label: `${p.name} updated`,
        projectName: p.name,
        type: 'updated',
        accentColor: p.accentColor,
      })
    }
  }

  // Sort chronologically (oldest first)
  events.sort((a, b) => a.date.localeCompare(b.date))
  return events
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

export default function ProjectTimeline() {
  const events = buildTimeline()
  const prefersReducedMotion = useReducedMotion()

  if (events.length === 0) return null

  return (
    <section aria-labelledby="timeline-heading" className="mb-10">
      <h2 id="timeline-heading" className="text-2xl font-bold mb-6">Project Timeline</h2>

      <div className="relative pl-6 border-l-2 border-border/30 space-y-4">
        {events.map((evt, idx) => (
          <motion.div
            key={`${evt.date}-${evt.projectName}-${evt.type}`}
            initial={prefersReducedMotion ? {} : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            className="relative"
          >
            {/* Timeline dot */}
            <span
              className={`absolute -left-[25px] top-3 h-3 w-3 rounded-full border-2 border-background ${
                evt.type === 'created' ? 'bg-emerald-400' : 'bg-blue-400'
              }`}
              aria-hidden="true"
            />

            <GlassCard intensity="low" className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                {evt.type === 'created' ? (
                  <RocketLaunch className="h-4 w-4 text-emerald-400 shrink-0" weight="duotone" aria-hidden="true" />
                ) : (
                  <CalendarBlank className="h-4 w-4 text-blue-400 shrink-0" weight="duotone" aria-hidden="true" />
                )}
                <span className="text-sm font-semibold">{evt.label}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {formatDate(evt.date)}
                </Badge>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
