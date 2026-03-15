/**
 * Shared project defaults for the Evident ecosystem.
 *
 * This file bridges the central registry (src/data/projects.ts) to the runtime
 * Project type used by the KV store and admin panels. New code should import
 * directly from '@/data/projects' when possible.
 */
import type { ProjectEntry } from '@/data/projects'
import { PROJECT_REGISTRY } from '@/data/projects'
import type { Project } from '@/lib/types'

/** Convert a registry entry to the runtime Project shape used by the KV layer. */
export function toRuntimeProject(entry: ProjectEntry): Project {
  return {
    id: entry.id,
    title: entry.name,
    summary: entry.tagline,
    description: entry.description,
    tags: [entry.category],
    techStack: entry.techStack,
    links: [
      ...(entry.url ? [{ label: 'Live', url: entry.url, type: 'demo' as const }] : []),
      ...(entry.repo ? [{ label: 'GitHub', url: entry.repo, type: 'repo' as const }] : []),
    ],
    order: PROJECT_REGISTRY.indexOf(entry),
    enabled: true,
    featured: entry.status === 'live',
    status: entry.status === 'live' ? 'active' : entry.status === 'in-development' ? 'paused' : 'archived',
    customization: { accentColor: entry.accentColor },
    createdAt: entry.created ? new Date(entry.created).getTime() : 0,
    updatedAt: entry.lastUpdated ? new Date(entry.lastUpdated).getTime() : 0,
    repoLanguage: entry.repoLanguage,
    repoStars: entry.repoStars,
    owner: entry.owner,
    domain: entry.domain,
    documentationUrl: entry.documentationUrl,
  }
}

/** Runtime-shaped defaults derived from the central registry. */
export const ECOSYSTEM_DEFAULTS: Project[] = PROJECT_REGISTRY.map(toRuntimeProject)
