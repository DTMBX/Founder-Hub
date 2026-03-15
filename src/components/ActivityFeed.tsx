import { ArrowSquareOut, FileText, GitCommit, Globe, RocketLaunch } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { GlassCard } from '@/components/ui/glass-card'
import type { ActivityEntry, ActivityType } from '@/data/activity'
import { ACTIVITY_FEED } from '@/data/activity'

const LIVE_ACTIVITY_URL = import.meta.env.VITE_LIVE_ACTIVITY_URL as string | undefined
const STALE_MS = 5 * 60 * 1000 // 5 minutes

const ICON_MAP: Record<ActivityType, typeof GitCommit> = {
  repo: GitCommit,
  release: RocketLaunch,
  documentation: FileText,
  domain: Globe,
}

const COLOR_MAP: Record<ActivityType, string> = {
  repo: 'text-blue-400',
  release: 'text-emerald-400',
  documentation: 'text-amber-400',
  domain: 'text-violet-400',
}

const DOT_MAP: Record<ActivityType, string> = {
  repo: 'bg-blue-400',
  release: 'bg-emerald-400',
  documentation: 'bg-amber-400',
  domain: 'bg-violet-400',
}

interface ActivityFeedProps {
  /** Max events to show. Defaults to 8. */
  limit?: number
  /** External events to display (e.g. from API). Falls back to registry seed. */
  events?: ActivityEntry[]
  /** Show the vertical timeline connector line */
  showTimeline?: boolean
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ActivityFeed({ limit = 8, events, showTimeline = true }: ActivityFeedProps) {
  const feed = (events ?? ACTIVITY_FEED).slice(0, limit)

  if (feed.length === 0) return null

  return (
    <div className="relative">
      {/* Timeline connector */}
      {showTimeline && (
        <div className="absolute left-4 top-3 bottom-3 w-px bg-border/40" aria-hidden="true" />
      )}

      <div className="space-y-1">
        {feed.map((event) => {
          const Icon = ICON_MAP[event.type] || GitCommit
          const color = COLOR_MAP[event.type] || 'text-muted-foreground'
          const dot = DOT_MAP[event.type] || 'bg-muted-foreground'

          return (
            <div key={event.id} className="relative flex items-start gap-4 py-2.5 pl-1">
              {/* Dot on timeline */}
              {showTimeline && (
                <span
                  className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background ${dot}`}
                  aria-hidden="true"
                />
              )}

              {/* Icon + content */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} weight="bold" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {event.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">
                      {event.description}
                    </p>
                  )}
                </div>
                {event.link && (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`View ${event.title}`}
                  >
                    <ArrowSquareOut className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Compact card wrapper for the homepage section */
export function ActivityFeedCard({ limit = 8 }: { limit?: number }) {
  const liveEvents = useLiveActivity()

  return (
    <section id="ecosystem-activity" aria-labelledby="activity-heading" className="py-16 sm:py-20">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 id="activity-heading" className="text-2xl sm:text-3xl font-bold">
            Ecosystem Activity
          </h2>
          <a
            href="#activity"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all &rarr;
          </a>
        </div>
        <GlassCard intensity="medium" className="p-5 sm:p-6">
          <ActivityFeed limit={limit} events={liveEvents.length > 0 ? liveEvents : undefined} />
        </GlassCard>
      </div>
    </section>
  )
}

/**
 * Fetch live activity events from the webhook worker endpoint.
 * Uses a 5-minute stale-while-revalidate strategy and falls back to
 * the static build-time ACTIVITY_FEED when unavailable.
 */
function useLiveActivity(): ActivityEntry[] {
  const [live, setLive] = useState<ActivityEntry[]>([])
  const lastFetch = useRef(0)

  useEffect(() => {
    if (!LIVE_ACTIVITY_URL) return

    const now = Date.now()
    if (now - lastFetch.current < STALE_MS) return

    let cancelled = false
    fetch(LIVE_ACTIVITY_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ events?: ActivityEntry[] }>
      })
      .then(data => {
        if (!cancelled && Array.isArray(data.events) && data.events.length > 0) {
          lastFetch.current = Date.now()
          setLive(data.events)
        }
      })
      .catch(() => {
        // Fall back silently to static feed
      })

    return () => { cancelled = true }
  }, [])

  return live
}
