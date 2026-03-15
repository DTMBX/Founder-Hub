/**
 * generate-ecosystem-data.mjs
 *
 * Generates static JSON API endpoints from the central project registry.
 *
 * Output files:
 *   public/ecosystem.json
 *   public/api/ecosystem.json
 *   public/api/projects.json
 *   public/api/organizations.json
 *
 * Run:  node scripts/generate-ecosystem-data.mjs
 * Also invoked automatically by "npm run build" (see package.json).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const API_DIR = resolve(ROOT, 'public/api')

// Ensure api directory exists
mkdirSync(API_DIR, { recursive: true })

// ── Schema version ──
const VERSION = '1.0'
const LAST_UPDATED = new Date().toISOString()

// ── Parse registry from TypeScript source (no transpiler needed) ──
const source = readFileSync(resolve(ROOT, 'src/data/projects.ts'), 'utf-8')

function extractProjects(src) {
  const projects = []
  // Split source at each project entry boundary using id: 'xxx' markers
  const ids = [...src.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1])

  for (const id of ids) {
    // Find the block between this id and the next (or end of array)
    const idx = src.indexOf(`id: '${id}'`)
    if (idx === -1) continue
    const nextIdx = ids.indexOf(id) + 1 < ids.length
      ? src.indexOf(`id: '${ids[ids.indexOf(id) + 1]}'`, idx + 1)
      : src.indexOf(']', idx)
    const block = src.slice(idx, nextIdx === -1 ? undefined : nextIdx)

    const get = (key) => {
      const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`))
      return m ? m[1] : undefined
    }

    projects.push({
      id,
      name: get('name'),
      tagline: get('tagline'),
      description: extractDescription(block),
      category: get('category'),
      status: get('status'),
      repo: get('repo'),
      domain: get('domain'),
      documentation: get('documentationUrl'),
      created: get('created'),
      updated: get('lastUpdated'),
    })
  }
  return projects
}

function extractDescription(block) {
  // Match description: followed by one or more 'string' fragments joined with +
  const start = block.indexOf('description:')
  if (start === -1) return undefined

  // Grab everything from "description:" to the next known field key or closing brace
  const rest = block.slice(start)
  const endMatch = rest.match(/\n\s+(?:category|status|url|repo|techStack|accentColor|created|lastUpdated|repoStars|repoLanguage|documentationUrl|domain|owner):/)
  const segment = endMatch ? rest.slice(0, endMatch.index) : rest.slice(0, 500)

  // Extract all quoted string fragments
  const parts = []
  for (const m of segment.matchAll(/'([^']*)'/g)) {
    parts.push(m[1])
  }
  return parts.join('') || undefined
}

// ── Person & Organizations (static — matches generate-ecosystem-json.ts) ──
const PERSON = {
  id: 'devon-tyler-barber',
  name: 'Devon Tyler Barber',
  url: 'https://devon-tyler.com',
  role: 'Entrepreneur & Technologist',
}

const ORGANIZATIONS = [
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

// ── Build relationships ──
function buildRelationships(projects) {
  const edges = []

  // Person → Organization
  for (const org of ORGANIZATIONS) {
    const slug = org.name.toLowerCase().replace(/\s+/g, '-')
    edges.push({ source: PERSON.id, target: slug, relationship: 'founder' })
  }

  // Extract owner from source for each project
  const ownerRe = /id:\s*'([^']+)'[^{}]*owner:\s*'([^']*)'/gs
  const ownerMap = new Map()
  for (const m of source.matchAll(ownerRe)) {
    ownerMap.set(m[1], m[2])
  }

  for (const p of projects) {
    edges.push({ source: PERSON.id, target: p.id, relationship: 'creator' })

    const owner = ownerMap.get(p.id)
    if (owner) {
      const slug = owner.toLowerCase().replace(/\s+/g, '-')
      edges.push({ source: slug, target: p.id, relationship: 'developer' })
      if (p.domain) {
        edges.push({ source: slug, target: p.id, relationship: 'publisher' })
        edges.push({ source: slug, target: p.id, relationship: 'operator' })
      }
    }
  }

  return edges
}

// ── Generate ──
const projects = extractProjects(source)
const relationships = buildRelationships(projects)

const ecosystem = {
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  person: PERSON,
  organizations: ORGANIZATIONS,
  projects,
  relationships,
}

const projectsData = {
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  projects,
}

const organizationsData = {
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  organizations: ORGANIZATIONS,
}

const satellitesData = {
  version: VERSION,
  lastUpdated: LAST_UPDATED,
  satellites: projects
    .filter(p => {
      // Match satellite category from config/projects.ts based on domain pattern
      const domain = p.domain || ''
      return domain.endsWith('.xtx396.com')
    })
    .map(p => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      status: p.status,
      url: p.domain ? `https://${p.domain}` : null,
      repo: p.repo || null,
    })),
}

// ── Write files ──
const write = (path, data) => {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`  → ${path}`)
}

console.log('Generating ecosystem data...')
write(resolve(ROOT, 'public/ecosystem.json'), ecosystem)
write(resolve(API_DIR, 'ecosystem.json'), ecosystem)
write(resolve(API_DIR, 'projects.json'), projectsData)
write(resolve(API_DIR, 'organizations.json'), organizationsData)
write(resolve(API_DIR, 'satellites.json'), satellitesData)
console.log(`Done — ${projects.length} projects, ${ORGANIZATIONS.length} organizations, ${relationships.length} relationships, ${satellitesData.satellites.length} satellites`)
