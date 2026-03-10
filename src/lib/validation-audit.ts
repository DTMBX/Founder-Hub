/**
 * validation-audit.ts — Global validation audit for all KV-backed content.
 *
 * Iterates over all known schema-backed KV keys, validates each against
 * its registered Zod schema, and returns a structured report.
 *
 * Read-only — never mutates state. Reuses KV_SCHEMAS from content-schema.ts.
 */

import { kv } from '@/lib/local-storage-kv'
import { KV_SCHEMAS, validateKV } from '@/lib/content-schema'
import type { WorkspaceSite } from '@/lib/workspace-site'
import { resolveContentKeys } from '@/lib/workspace-site'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuditKeyResult {
  key: string
  label: string
  status: 'pass' | 'fail' | 'empty' | 'missing'
  error?: string
  itemCount?: number
}

export interface AuditReport {
  /** ISO timestamp of audit */
  timestamp: string
  /** Total keys audited */
  totalKeys: number
  /** Count of passing keys */
  passCount: number
  /** Count of failing keys */
  failCount: number
  /** Count of empty keys (exist but no data) */
  emptyCount: number
  /** Count of missing (no data) keys */
  missingCount: number
  /** Per-key results */
  results: AuditKeyResult[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const KEY_LABELS: Record<string, string> = {
  'founder-hub-settings': 'Site Settings',
  'founder-hub-sections': 'Sections',
  'founder-hub-projects': 'Projects',
  'founder-hub-court-cases': 'Court Cases',
  'founder-hub-proof-links': 'Proof Links',
  'founder-hub-contact-links': 'Contact Links',
  'founder-hub-profile': 'Profile',
  'founder-hub-about': 'About',
  'founder-hub-offerings': 'Offerings',
  'founder-hub-investor': 'Investor Content',
}

function labelFor(key: string): string {
  if (KEY_LABELS[key]) return KEY_LABELS[key]
  // Strip any namespace prefix (e.g. 'founder-hub-') and humanize
  const suffix = key.replace(/^[a-z]+-[a-z]+-/, '')
  return suffix.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Audit ──────────────────────────────────────────────────────────────────

/**
 * Run a full validation audit across all schema-backed KV keys.
 * If a WorkspaceSite is provided, audits only that site's content keys.
 * Returns a structured report. Does NOT mutate any state.
 */
export async function runValidationAudit(site?: WorkspaceSite): Promise<AuditReport> {
  const keys = site ? resolveContentKeys(site) : Object.keys(KV_SCHEMAS)
  const results: AuditKeyResult[] = []
  let passCount = 0
  let failCount = 0
  let emptyCount = 0
  let missingCount = 0

  for (const key of keys) {
    const label = labelFor(key)
    const value = await kv.get(key)

    if (value === null || value === undefined) {
      results.push({ key, label, status: 'missing' })
      missingCount++
      continue
    }

    // Empty arrays or empty objects
    if (
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0)
    ) {
      results.push({ key, label, status: 'empty' })
      emptyCount++
      continue
    }

    const validation = validateKV(key, value)
    if (!validation) {
      results.push({ key, label, status: 'pass' })
      passCount++
      continue
    }

    if (validation.success) {
      const itemCount = Array.isArray(validation.data) ? validation.data.length : undefined
      results.push({ key, label, status: 'pass', itemCount })
      passCount++
    } else {
      results.push({ key, label, status: 'fail', error: validation.error })
      failCount++
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalKeys: keys.length,
    passCount,
    failCount,
    emptyCount,
    missingCount,
    results,
  }
}
