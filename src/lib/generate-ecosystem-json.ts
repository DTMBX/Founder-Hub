/**
 * Ecosystem data generator — converts the internal project registry and
 * entity graph into machine-readable JSON structures.
 *
 * Used by:
 *  • scripts/generate-ecosystem-data.mjs  (build-time)
 *  • DataPage.tsx                          (runtime display)
 *
 * Output shape mirrors /public/api/*.json endpoints.
 */

import type { ProjectEntry } from '@/data/projects'
import { PROJECT_REGISTRY } from '@/data/projects'

// ── Schema version ──────────────────────────────────────────────────────────

export const ECOSYSTEM_VERSION = '1.0'

// ── Types ───────────────────────────────────────────────────────────────────

export interface EcosystemProject {
  id: string
  name: string
  tagline: string
  description: string
  category: string
  status: string
  repo?: string
  domain?: string
  documentation?: string
  created?: string
  updated?: string
}

export interface EcosystemOrganization {
  name: string
  type: string
  industry: string
  website?: string
  relationshipToFounder: string
}

export interface EcosystemRelationship {
  source: string
  target: string
  relationship: 'creator' | 'developer' | 'publisher' | 'operator' | 'founder'
}

export interface EcosystemPerson {
  id: string
  name: string
  url: string
  role: string
}

export interface EcosystemData {
  version: string
  lastUpdated: string
  person: EcosystemPerson
  organizations: EcosystemOrganization[]
  projects: EcosystemProject[]
  relationships: EcosystemRelationship[]
}

// ── Constants ───────────────────────────────────────────────────────────────

const PERSON: EcosystemPerson = {
  id: 'devon-tyler-barber',
  name: 'Devon Tyler Barber',
  url: 'https://devon-tyler.com',
  role: 'Entrepreneur & Technologist',
}

const ORGANIZATIONS: EcosystemOrganization[] = [
  {
    name: 'Evident Technologies LLC',
    type: 'Organization',
    industry: 'Civic Technology & Legal Technology',
    website: 'https://www.xtx396.com',
    relationshipToFounder: 'founder',
  },
  {
    name: 'Tillerstead LLC',
    type: 'HomeAndConstructionBusiness',
    industry: 'Home Improvement & Land Stewardship',
    website: 'https://tillerstead.com',
    relationshipToFounder: 'founder',
  },
]

// ── Mappers ─────────────────────────────────────────────────────────────────

function toApiProject(entry: ProjectEntry): EcosystemProject {
  return {
    id: entry.id,
    name: entry.name,
    tagline: entry.tagline,
    description: entry.description,
    category: entry.category,
    status: entry.status,
    repo: entry.repo,
    domain: entry.domain,
    documentation: entry.documentationUrl,
    created: entry.created,
    updated: entry.lastUpdated,
  }
}

function buildRelationships(projects: ProjectEntry[]): EcosystemRelationship[] {
  const edges: EcosystemRelationship[] = []

  // Person → Organization (founder)
  for (const org of ORGANIZATIONS) {
    const orgSlug = org.name.toLowerCase().replace(/\s+/g, '-')
    edges.push({ source: PERSON.id, target: orgSlug, relationship: 'founder' })
  }

  // Person → Project (creator) + Organization → Project (developer/publisher/operator)
  for (const p of projects) {
    edges.push({ source: PERSON.id, target: p.id, relationship: 'creator' })

    if (p.owner) {
      const orgSlug = p.owner.toLowerCase().replace(/\s+/g, '-')
      edges.push({ source: orgSlug, target: p.id, relationship: 'developer' })
      if (p.url) {
        edges.push({ source: orgSlug, target: p.id, relationship: 'publisher' })
      }
      if (p.domain) {
        edges.push({ source: orgSlug, target: p.id, relationship: 'operator' })
      }
    }
  }

  return edges
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Generate the full ecosystem dataset from the project registry. */
export function generateEcosystemData(): EcosystemData {
  const projects = PROJECT_REGISTRY.map(toApiProject)
  const relationships = buildRelationships(PROJECT_REGISTRY)

  return {
    version: ECOSYSTEM_VERSION,
    lastUpdated: new Date().toISOString(),
    person: PERSON,
    organizations: ORGANIZATIONS,
    projects,
    relationships,
  }
}

/** Generate the projects-only dataset. */
export function generateProjectsData(): { version: string; lastUpdated: string; projects: EcosystemProject[] } {
  return {
    version: ECOSYSTEM_VERSION,
    lastUpdated: new Date().toISOString(),
    projects: PROJECT_REGISTRY.map(toApiProject),
  }
}

/** Generate the organizations-only dataset. */
export function generateOrganizationsData(): { version: string; lastUpdated: string; organizations: EcosystemOrganization[] } {
  return {
    version: ECOSYSTEM_VERSION,
    lastUpdated: new Date().toISOString(),
    organizations: ORGANIZATIONS,
  }
}
