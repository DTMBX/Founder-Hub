#!/usr/bin/env node

/**
 * Sync PROJECT_REGISTRY and POSTS to Supabase.
 *
 * Reads static TypeScript registries, transforms them into rows, and upserts
 * them into the Supabase `projects` and `blog_posts` tables via PostgREST.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/sync-registry-to-supabase.mjs
 *
 * The script uses the service-role key (not the anon key) because it runs as a
 * trusted CI/admin operation, not from the browser.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('⚠ SUPABASE_URL / SUPABASE_SERVICE_KEY not set — skipping sync.')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Parse TypeScript registry files (simple extraction — no TS compiler needed)
// ---------------------------------------------------------------------------

/**
 * Extracts the exported array from a TypeScript file by evaluating it in a
 * controlled scope. Since these files are pure data (no imports beyond types),
 * we can strip the type annotations and evaluate.
 */
function parseRegistryFile(relPath, exportName) {
  let source = readFileSync(resolve(root, relPath), 'utf-8')

  // Strip TypeScript-only syntax
  source = source
    .replace(/^export\s+(interface|type)\s+[^{]*\{[^}]*\}/gm, '')
    .replace(/:\s*(ProjectEntry|PostEntry|ProjectCategory|ProjectStatus|string)\[\]/g, '')
    .replace(/:\s*(ProjectEntry|PostEntry|ProjectCategory|ProjectStatus|string|number|boolean|undefined)/g, '')
    .replace(/export\s+const/g, 'const')
    .replace(/as\s+const/g, '')
    .replace(/import\s+.*\n/g, '')

  // Evaluate and return
  const fn = new Function(`${source}\nreturn ${exportName};`)
  return fn()
}

// ---------------------------------------------------------------------------
// Supabase upsert helper
// ---------------------------------------------------------------------------

async function upsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(rows),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Upsert to ${table} failed (${res.status}): ${text}`)
  }

  console.log(`✓ ${table}: ${rows.length} rows upserted`)
}

// ---------------------------------------------------------------------------
// Transform and sync
// ---------------------------------------------------------------------------

async function syncProjects() {
  const registry = parseRegistryFile('src/data/projects.ts', 'PROJECT_REGISTRY')
  const rows = registry.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    category: p.category,
    status: p.status,
    url: p.url || null,
    repo: p.repo || null,
    tech_stack: p.techStack,
    accent_color: p.accentColor,
    created_date: p.created || null,
    last_updated: p.lastUpdated || null,
    repo_stars: p.repoStars ?? null,
    repo_language: p.repoLanguage || null,
    documentation_url: p.documentationUrl || null,
    domain: p.domain || null,
    owner: p.owner || null,
    synced_at: new Date().toISOString(),
  }))

  await upsert('projects', rows)
}

async function syncBlogPosts() {
  const posts = parseRegistryFile('src/data/posts.ts', 'POSTS')
  const rows = posts.map((p) => ({
    id: p.id,
    title: p.title,
    date: p.date,
    category: p.category,
    summary: p.summary,
    content_markdown: p.contentMarkdown,
    published: true,
    synced_at: new Date().toISOString(),
  }))

  await upsert('blog_posts', rows)
}

async function main() {
  console.log(`Syncing to ${SUPABASE_URL} ...`)
  await syncProjects()
  await syncBlogPosts()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
