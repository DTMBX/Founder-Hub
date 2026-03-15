/**
 * Activity data model — describes ecosystem events over time.
 *
 * ActivityEntry items are generated at build-time from the project registry,
 * repo metadata, and domain health checks, then served at /api/activity.json.
 *
 * Runtime components also produce synthetic entries from registry timestamps.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityType = 'repo' | 'release' | 'documentation' | 'domain'

export interface ActivityEntry {
  id: string
  type: ActivityType
  projectId: string
  title: string
  description?: string
  timestamp: number
  link?: string
}

// ---------------------------------------------------------------------------
// Seed activities from the project registry
// ---------------------------------------------------------------------------

import { PROJECT_REGISTRY } from '@/data/projects'

/** Derive activity entries from the static project registry metadata. */
export function seedActivitiesFromRegistry(): ActivityEntry[] {
  const events: ActivityEntry[] = []

  for (const p of PROJECT_REGISTRY) {
    // Project launch event
    if (p.created) {
      events.push({
        id: `launch-${p.id}`,
        type: 'repo',
        projectId: p.id,
        title: `${p.name} launched`,
        description: p.tagline,
        timestamp: new Date(p.created).getTime(),
        link: p.url,
      })
    }

    // Most recent update
    if (p.lastUpdated && p.lastUpdated !== p.created) {
      events.push({
        id: `update-${p.id}`,
        type: 'repo',
        projectId: p.id,
        title: `${p.name} updated`,
        description: 'Project registry updated with latest changes.',
        timestamp: new Date(p.lastUpdated).getTime(),
        link: p.repo,
      })
    }

    // Documentation event
    if (p.documentationUrl) {
      events.push({
        id: `docs-${p.id}`,
        type: 'documentation',
        projectId: p.id,
        title: `${p.name} documentation published`,
        description: `Documentation available at ${p.documentationUrl}`,
        timestamp: new Date(p.created || '2025-01-01').getTime() + 86_400_000,
        link: p.documentationUrl,
      })
    }

    // Domain event
    if (p.domain) {
      events.push({
        id: `domain-${p.id}`,
        type: 'domain',
        projectId: p.id,
        title: `${p.domain} domain active`,
        description: `Domain ${p.domain} serving ${p.name}.`,
        timestamp: new Date(p.created || '2025-01-01').getTime(),
        link: p.url,
      })
    }
  }

  return events.sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * All seeded activities — sorted newest-first.
 * Import this for runtime display without needing the JSON endpoint.
 */
export const ACTIVITY_FEED: ActivityEntry[] = seedActivitiesFromRegistry()
