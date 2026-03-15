/**
 * Ecosystem Intelligence — derived analytics and insights from registry + activity data.
 *
 * Pure functions that compute metrics, distributions, and prose insights
 * without any network calls. All data comes from the static project registry
 * and the seeded activity feed.
 */

import type { ActivityEntry } from '@/data/activity'
import { ACTIVITY_FEED } from '@/data/activity'
import type { ProjectCategory, ProjectEntry } from '@/data/projects'
import { PROJECT_REGISTRY } from '@/data/projects'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EcosystemMetrics {
  totalProjects: number
  totalOrganizations: number
  totalRelationshipEdges: number
  activeProjects: number
  inactiveProjects: number
  eventsLast30Days: number
  averageUpdateIntervalDays: number | null
  projectsByCategory: Record<string, number>
  languageDistribution: Record<string, number>
}

export interface EcosystemInsight {
  label: string
  value: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORGANIZATIONS = ['Evident Technologies LLC', 'Tillerstead LLC']

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  'civic-tech': 'Civic Tech',
  'home-improvement': 'Home Improvement',
  'software-platform': 'Software Platforms',
}

// ---------------------------------------------------------------------------
// Metrics computation
// ---------------------------------------------------------------------------

export function computeMetrics(
  projects: ProjectEntry[] = PROJECT_REGISTRY,
  activities: ActivityEntry[] = ACTIVITY_FEED,
): EcosystemMetrics {
  // Category counts
  const projectsByCategory: Record<string, number> = {}
  for (const p of projects) {
    const label = CATEGORY_LABELS[p.category] ?? p.category
    projectsByCategory[label] = (projectsByCategory[label] ?? 0) + 1
  }

  // Language distribution
  const languageDistribution: Record<string, number> = {}
  for (const p of projects) {
    const lang = p.repoLanguage ?? 'Unknown'
    languageDistribution[lang] = (languageDistribution[lang] ?? 0) + 1
  }

  // Relationship edge count: person→org (2) + person→project (N) + org→project owner edges (up to 3 per project with domain)
  const ownerProjects = projects.filter(p => p.owner)
  const domainProjects = projects.filter(p => p.domain && p.owner)
  const totalRelationshipEdges =
    ORGANIZATIONS.length +          // person → org
    projects.length +               // person → project (creator)
    ownerProjects.length +          // org → project (developer)
    domainProjects.length * 2       // org → project (publisher + operator)

  // Active vs inactive: active = updated within last 90 days
  const now = Date.now()
  const ninetyDays = 90 * 24 * 60 * 60 * 1000
  let activeProjects = 0
  for (const p of projects) {
    if (p.lastUpdated && now - new Date(p.lastUpdated).getTime() < ninetyDays) {
      activeProjects++
    }
  }

  // Events in last 30 days
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  const eventsLast30Days = activities.filter(e => now - e.timestamp < thirtyDays).length

  // Average update interval
  const intervals: number[] = []
  for (const p of projects) {
    if (p.created && p.lastUpdated && p.created !== p.lastUpdated) {
      const created = new Date(p.created).getTime()
      const updated = new Date(p.lastUpdated).getTime()
      intervals.push(updated - created)
    }
  }
  const averageUpdateIntervalDays =
    intervals.length > 0
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length / (24 * 60 * 60 * 1000))
      : null

  return {
    totalProjects: projects.length,
    totalOrganizations: ORGANIZATIONS.length,
    totalRelationshipEdges,
    activeProjects,
    inactiveProjects: projects.length - activeProjects,
    eventsLast30Days,
    averageUpdateIntervalDays,
    projectsByCategory,
    languageDistribution,
  }
}

// ---------------------------------------------------------------------------
// Activity trend — bucket events by month
// ---------------------------------------------------------------------------

export interface ActivityBucket {
  month: string // e.g. "2025-06"
  count: number
}

export function computeActivityTrend(
  activities: ActivityEntry[] = ACTIVITY_FEED,
): ActivityBucket[] {
  const buckets = new Map<string, number>()

  for (const e of activities) {
    const d = new Date(e.timestamp)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  return [...buckets.entries()]
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

// ---------------------------------------------------------------------------
// Relationship density — connections per project
// ---------------------------------------------------------------------------

export interface ProjectDensity {
  name: string
  connections: number
}

export function computeRelationshipDensity(
  projects: ProjectEntry[] = PROJECT_REGISTRY,
): ProjectDensity[] {
  return projects.map(p => {
    let connections = 1 // person → project (creator) always exists
    if (p.owner) connections++ // org → project (developer)
    if (p.domain && p.owner) connections += 2 // publisher + operator
    if (p.documentationUrl) connections++ // implied docs link
    return { name: p.name, connections }
  }).sort((a, b) => b.connections - a.connections)
}

// ---------------------------------------------------------------------------
// Insight generation
// ---------------------------------------------------------------------------

export function deriveInsights(
  projects: ProjectEntry[] = PROJECT_REGISTRY,
  activities: ActivityEntry[] = ACTIVITY_FEED,
): EcosystemInsight[] {
  const insights: EcosystemInsight[] = []
  const metrics = computeMetrics(projects, activities)

  // Most active project (most activity events)
  const projectEventCounts = new Map<string, number>()
  for (const e of activities) {
    projectEventCounts.set(e.projectId, (projectEventCounts.get(e.projectId) ?? 0) + 1)
  }
  let maxProject = ''
  let maxCount = 0
  for (const [id, count] of projectEventCounts) {
    if (count > maxCount) {
      maxProject = id
      maxCount = count
    }
  }
  const topProject = projects.find(p => p.id === maxProject)
  if (topProject) {
    insights.push({ label: 'Most active project', value: topProject.name })
  }

  // Primary language
  const langEntries = Object.entries(metrics.languageDistribution).sort((a, b) => b[1] - a[1])
  if (langEntries.length > 0) {
    insights.push({ label: 'Primary ecosystem language', value: langEntries[0][0] })
  }

  // Average update interval
  if (metrics.averageUpdateIntervalDays !== null) {
    insights.push({
      label: 'Average update interval',
      value: `${metrics.averageUpdateIntervalDays} days`,
    })
  }

  // Coverage
  const domainCount = projects.filter(p => p.domain).length
  insights.push({
    label: 'Domain coverage',
    value: `${domainCount} of ${projects.length} projects have live domains`,
  })

  // Technology breadth
  const uniqueLangs = Object.keys(metrics.languageDistribution).filter(l => l !== 'Unknown')
  if (uniqueLangs.length > 0) {
    insights.push({
      label: 'Technology breadth',
      value: uniqueLangs.join(', '),
    })
  }

  return insights
}
