/**
 * Activity feed generator — aggregates ecosystem activity from multiple
 * sources into a unified feed.
 *
 * Used by:
 *  • scripts/generate-activity-data.mjs  (build-time, via regex mirror)
 *  • ActivityFeed.tsx / ActivityPage.tsx  (runtime, via imports)
 *
 * Sources:
 *  1. Project registry timestamps (created / lastUpdated)
 *  2. Repository metadata (pushed_at → latest commit)
 *  3. Documentation events (documentationUrl presence)
 *  4. Domain events (domain presence)
 */

import type { ActivityEntry } from '@/data/activity'
import { ACTIVITY_FEED } from '@/data/activity'
import { PROJECT_REGISTRY } from '@/data/projects'
import type { RepoMetadata } from '@/lib/repo-metadata'
import { fetchAllRepoMetadata } from '@/lib/repo-metadata'

export const ACTIVITY_VERSION = '1.0'

/**
 * Merge repo metadata into the activity feed at runtime.
 * Returns the combined + deduped feed sorted newest-first.
 */
export async function generateLiveActivityFeed(): Promise<ActivityEntry[]> {
  const repoUrls = PROJECT_REGISTRY
    .map(p => p.repo)
    .filter((u): u is string => !!u)

  const metadata = await fetchAllRepoMetadata(repoUrls)
  const repoEvents: ActivityEntry[] = []

  for (const p of PROJECT_REGISTRY) {
    if (!p.repo) continue
    const meta: RepoMetadata | undefined = metadata.get(p.repo)
    if (!meta?.lastCommitDate) continue

    const commitTs = new Date(meta.lastCommitDate).getTime()
    repoEvents.push({
      id: `commit-${p.id}-${commitTs}`,
      type: 'repo',
      projectId: p.id,
      title: `${p.name} — latest commit`,
      description: `Repository updated${meta.language ? ` (${meta.language})` : ''}.`,
      timestamp: commitTs,
      link: p.repo,
    })
  }

  // Merge and deduplicate by id, then sort newest-first
  const merged = new Map<string, ActivityEntry>()
  for (const e of [...ACTIVITY_FEED, ...repoEvents]) {
    merged.set(e.id, e)
  }

  return [...merged.values()].sort((a, b) => b.timestamp - a.timestamp)
}

/** Static feed (no GitHub fetch) — for SSR / initial render. */
export function getStaticActivityFeed(): ActivityEntry[] {
  return ACTIVITY_FEED
}
