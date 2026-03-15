/**
 * update-project-metadata.mjs — CI script to refresh repository metadata
 * for all projects in the registry.
 *
 * Usage:  node scripts/update-project-metadata.mjs
 *         npm run update-project-metadata
 *
 * For each project with a GitHub repo URL, fetches:
 *   - stargazers_count  → repoStars
 *   - language          → repoLanguage
 *   - pushed_at         → lastUpdated (YYYY-MM-DD)
 *
 * Writes the updated values back into src/data/projects.ts in-place.
 * Safe to run in CI or locally.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REGISTRY_PATH = resolve(__dirname, '..', 'src', 'data', 'projects.ts')

// ── Parse repo URLs from the registry ──

const source = readFileSync(REGISTRY_PATH, 'utf-8')
const repoRegex = /repo:\s*'(https:\/\/github\.com\/[^']+)'/g
const repos = []
let match
while ((match = repoRegex.exec(source)) !== null) {
  repos.push(match[1])
}

if (repos.length === 0) {
  console.log('No GitHub repos found in project registry.')
  process.exit(0)
}

console.log(`Found ${repos.length} GitHub repos. Fetching metadata…\n`)

// ── Fetch metadata from GitHub API ──

/**
 * @param {string} repoUrl
 * @returns {Promise<{repoUrl: string, stars: number, language: string|null, pushedAt: string|null}>}
 */
async function fetchMeta(repoUrl) {
  const [owner, repo] = repoUrl.replace('https://github.com/', '').split('/')
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`
  const headers = { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'founder-hub-ci' }

  // Use GITHUB_TOKEN if available (CI environments)
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`
  }

  try {
    const res = await fetch(apiUrl, { headers })
    if (!res.ok) {
      console.warn(`  ⚠ ${owner}/${repo}: HTTP ${res.status}`)
      return { repoUrl, stars: 0, language: null, pushedAt: null }
    }
    const data = await res.json()
    return {
      repoUrl,
      stars: data.stargazers_count ?? 0,
      language: data.language ?? null,
      pushedAt: data.pushed_at ? data.pushed_at.slice(0, 10) : null,
    }
  } catch (err) {
    console.warn(`  ⚠ ${owner}/${repo}: ${err.message}`)
    return { repoUrl, stars: 0, language: null, pushedAt: null }
  }
}

const results = await Promise.all(repos.map(fetchMeta))

// ── Update the registry file in-place ──

let updated = source
let changeCount = 0

for (const r of results) {
  if (!r.pushedAt && !r.language && r.stars === 0) continue

  // Find the block for this repo: starts with "repo: '<url>'" and continues until "},"
  const repoLiteral = r.repoUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const blockRegex = new RegExp(
    `(repo:\\s*'${repoLiteral}'[^}]*?)(\\n\\s*},)`,
    's',
  )
  const blockMatch = updated.match(blockRegex)
  if (!blockMatch) continue

  let block = blockMatch[1]
  let changed = false

  // Update repoStars
  if (r.stars > 0) {
    if (/repoStars:\s*\d+/.test(block)) {
      block = block.replace(/repoStars:\s*\d+/, `repoStars: ${r.stars}`)
    } else {
      block = block.replace(/(repo:\s*'[^']*',)/, `$1\n    repoStars: ${r.stars},`)
    }
    changed = true
  }

  // Update repoLanguage
  if (r.language) {
    if (/repoLanguage:\s*'[^']*'/.test(block)) {
      block = block.replace(/repoLanguage:\s*'[^']*'/, `repoLanguage: '${r.language}'`)
    }
    changed = true
  }

  // Update lastUpdated
  if (r.pushedAt) {
    if (/lastUpdated:\s*'[^']*'/.test(block)) {
      block = block.replace(/lastUpdated:\s*'[^']*'/, `lastUpdated: '${r.pushedAt}'`)
    }
    changed = true
  }

  if (changed) {
    updated = updated.replace(blockMatch[0], block + blockMatch[2])
    changeCount++
    console.log(`  ✓ ${r.repoUrl.split('/').pop()} — ★ ${r.stars}  ${r.language || '?'}  ${r.pushedAt || '?'}`)
  }
}

if (changeCount > 0) {
  writeFileSync(REGISTRY_PATH, updated, 'utf-8')
  console.log(`\n✓ Updated ${changeCount} project(s) in src/data/projects.ts`)
} else {
  console.log('\nNo changes needed.')
}
