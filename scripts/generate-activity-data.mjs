/**
 * generate-activity-data.mjs
 *
 * Generates the static activity feed JSON from the project registry.
 *
 * At build-time this mirrors the logic in src/data/activity.ts but runs
 * as a plain Node script (no transpiler). If a GITHUB_TOKEN env var is set
 * it also fetches latest commit dates from the GitHub API.
 *
 * Output files:
 *   public/api/activity.json
 *
 * Run:  node scripts/generate-activity-data.mjs
 * Also invoked automatically by "npm run build" (see package.json).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const API_DIR = resolve(ROOT, 'public/api')

mkdirSync(API_DIR, { recursive: true })

const VERSION = '1.0'
const NOW = new Date().toISOString()

// ── Parse registry ──
const source = readFileSync(resolve(ROOT, 'src/data/projects.ts'), 'utf-8')
const ids = [...source.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1])

function getBlock(id) {
  const idx = source.indexOf(`id: '${id}'`)
  if (idx === -1) return ''
  const nextId = ids[ids.indexOf(id) + 1]
  const end = nextId ? source.indexOf(`id: '${nextId}'`, idx + 1) : source.indexOf(']', idx)
  return source.slice(idx, end === -1 ? undefined : end)
}

function get(block, key) {
  const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`))
  return m ? m[1] : undefined
}

// ── Build events from registry ──
const events = []

for (const id of ids) {
  const block = getBlock(id)
  const name = get(block, 'name')
  const tagline = get(block, 'tagline')
  const created = get(block, 'created')
  const lastUpdated = get(block, 'lastUpdated')
  const url = get(block, 'url')
  const repo = get(block, 'repo')
  const domain = get(block, 'domain')
  const docUrl = get(block, 'documentationUrl')

  if (created) {
    events.push({
      id: `launch-${id}`,
      type: 'repo',
      projectId: id,
      title: `${name} launched`,
      description: tagline,
      timestamp: new Date(created).getTime(),
      link: url || undefined,
    })
  }

  if (lastUpdated && lastUpdated !== created) {
    events.push({
      id: `update-${id}`,
      type: 'repo',
      projectId: id,
      title: `${name} updated`,
      description: 'Project registry updated with latest changes.',
      timestamp: new Date(lastUpdated).getTime(),
      link: repo || undefined,
    })
  }

  if (docUrl) {
    events.push({
      id: `docs-${id}`,
      type: 'documentation',
      projectId: id,
      title: `${name} documentation published`,
      description: `Documentation available at ${docUrl}`,
      timestamp: new Date(created || '2025-01-01').getTime() + 86_400_000,
      link: docUrl,
    })
  }

  if (domain) {
    events.push({
      id: `domain-${id}`,
      type: 'domain',
      projectId: id,
      title: `${domain} domain active`,
      description: `Domain ${domain} serving ${name}.`,
      timestamp: new Date(created || '2025-01-01').getTime(),
      link: url || undefined,
    })
  }
}

// ── Optional: fetch latest commit dates from GitHub API ──
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const repoUrls = ids.map(id => get(getBlock(id), 'repo')).filter(Boolean)

async function fetchGitHubActivity() {
  if (repoUrls.length === 0) return

  const headers = { Accept: 'application/vnd.github.v3+json' }
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`

  for (const repoUrl of repoUrls) {
    try {
      const url = new URL(repoUrl)
      const parts = url.pathname.replace(/^\//, '').replace(/\/$/, '').split('/')
      if (parts.length < 2) continue
      const [owner, repo] = parts

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers })
      if (!res.ok) continue

      const data = await res.json()
      const pushedAt = data.pushed_at
      if (!pushedAt) continue

      const projectId = ids.find(id => get(getBlock(id), 'repo') === repoUrl)
      if (!projectId) continue

      const commitTs = new Date(pushedAt).getTime()
      const existingUpdate = events.find(e => e.id === `update-${projectId}`)

      // Only add if more recent than registry lastUpdated
      if (!existingUpdate || commitTs > existingUpdate.timestamp) {
        events.push({
          id: `commit-${projectId}-${commitTs}`,
          type: 'repo',
          projectId,
          title: `${get(getBlock(projectId), 'name')} — latest commit`,
          description: `Repository updated${data.language ? ` (${data.language})` : ''}.`,
          timestamp: commitTs,
          link: repoUrl,
        })
      }
    } catch {
      // Skip failed fetches silently
    }
  }
}

await fetchGitHubActivity()

// ── Sort newest first and write ──
events.sort((a, b) => b.timestamp - a.timestamp)

const activityData = {
  version: VERSION,
  lastUpdated: NOW,
  events,
}

const outPath = resolve(API_DIR, 'activity.json')
writeFileSync(outPath, JSON.stringify(activityData, null, 2), 'utf-8')
console.log(`Activity feed written → ${outPath}  (${events.length} events)`)
