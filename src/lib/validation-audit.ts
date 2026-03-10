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

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuditKeyResult {
  key: string
  status: 'pass' | 'fail' | 'missing'
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
  /** Count of missing (no data) keys */
  missingCount: number
  /** Per-key results */
  results: AuditKeyResult[]
}

// ─── Audit ──────────────────────────────────────────────────────────────────

/**
 * Run a full validation audit across all schema-backed KV keys.
 * Returns a structured report. Does NOT mutate any state.
 */
export async function runValidationAudit(): Promise<AuditReport> {
  const keys = Object.keys(KV_SCHEMAS)
  const results: AuditKeyResult[] = []
  let passCount = 0
  let failCount = 0
  let missingCount = 0

  for (const key of keys) {
    const value = await kv.get(key)

    if (value === null) {
      results.push({ key, status: 'missing' })
      missingCount++
      continue
    }

    const validation = validateKV(key, value)
    if (!validation) {
      // Should not happen since we only iterate KV_SCHEMAS keys, but be safe
      results.push({ key, status: 'pass' })
      passCount++
      continue
    }

    if (validation.success) {
      const itemCount = Array.isArray(validation.data) ? validation.data.length : undefined
      results.push({ key, status: 'pass', itemCount })
      passCount++
    } else {
      results.push({ key, status: 'fail', error: validation.error })
      failCount++
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalKeys: keys.length,
    passCount,
    failCount,
    missingCount,
    results,
  }
}
