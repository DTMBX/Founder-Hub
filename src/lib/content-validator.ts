/**
 * content-validator.ts — Deterministic content validation engine for CI and local dev.
 *
 * Reads canonical JSON data files from disk, validates each against
 * the same Zod schemas used by the in-app studio (content-schema.ts),
 * and runs grounded integrity checks on array collections.
 *
 * Node.js only — uses `fs` for file reads. Does NOT mutate content.
 * Designed for:  npm scripts, vitest tests, CI pipelines, pre-commit hooks.
 *
 * Shared validation layer: the Zod schemas in content-schema.ts power both
 * this CI engine and the in-app audit (validation-audit.ts).
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { KV_SCHEMAS, validateKV } from './content-schema'

// ─── File Map ───────────────────────────────────────────────────────────────

/**
 * Maps KV schema keys to their canonical static data file paths.
 * Paths are relative to the `public/` directory.
 *
 * Must stay in sync with STATIC_DATA_MAP in local-storage-kv.ts.
 * Only includes keys that have a registered Zod schema in KV_SCHEMAS.
 */
export const CONTENT_FILE_MAP: Record<string, string> = {
  'founder-hub-settings':      'data/settings.json',
  'founder-hub-sections':      'data/sections.json',
  'founder-hub-projects':      'data/projects.json',
  'founder-hub-court-cases':   'data/court-cases.json',
  'founder-hub-proof-links':   'data/links.json',
  'founder-hub-contact-links': 'data/contact-links.json',
  'founder-hub-profile':       'data/profile.json',
  'founder-hub-about':         'data/about.json',
  'founder-hub-offerings':     'data/offerings.json',
  'founder-hub-investor':      'data/investor.json',
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContentIssue {
  type: 'schema' | 'integrity'
  key: string
  message: string
  path?: string
}

export interface ContentKeyResult {
  key: string
  file: string
  status: 'pass' | 'fail' | 'missing' | 'parse-error'
  schemaValid: boolean
  issues: ContentIssue[]
  itemCount?: number
}

export interface ContentValidationReport {
  timestamp: string
  totalKeys: number
  passCount: number
  failCount: number
  missingCount: number
  issueCount: number
  results: ContentKeyResult[]
  issues: ContentIssue[]
}

// ─── Integrity Checks (pure, reusable) ──────────────────────────────────────

/**
 * Detect duplicate `id` fields within an array collection.
 * Returns empty array for non-array or id-less data.
 */
export function checkDuplicateIds(key: string, data: unknown): ContentIssue[] {
  if (!Array.isArray(data)) return []
  const seen = new Map<string, number>()
  const issues: ContentIssue[] = []

  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    if (item && typeof item === 'object' && 'id' in item && typeof item.id === 'string') {
      const prev = seen.get(item.id)
      if (prev !== undefined) {
        issues.push({
          type: 'integrity',
          key,
          message: `Duplicate id "${item.id}" at indices ${prev} and ${i}`,
          path: `[${i}].id`,
        })
      } else {
        seen.set(item.id, i)
      }
    }
  }
  return issues
}

/**
 * Detect duplicate `order` values within an array collection.
 * Non-deterministic rendering occurs when multiple items share an order.
 */
export function checkDuplicateOrders(key: string, data: unknown): ContentIssue[] {
  if (!Array.isArray(data)) return []
  const orderMap = new Map<number, string[]>()
  const issues: ContentIssue[] = []

  for (const item of data) {
    if (item && typeof item === 'object' && 'order' in item && typeof item.order === 'number') {
      const id = 'id' in item && typeof item.id === 'string' ? item.id : '?'
      const existing = orderMap.get(item.order)
      if (existing) {
        existing.push(id)
      } else {
        orderMap.set(item.order, [id])
      }
    }
  }

  for (const [order, ids] of orderMap) {
    if (ids.length > 1) {
      issues.push({
        type: 'integrity',
        key,
        message: `Duplicate order ${order} shared by: ${ids.join(', ')}`,
      })
    }
  }
  return issues
}

/**
 * Run all grounded integrity checks on a validated data value.
 * Pure — no I/O, no mutations.
 */
export function checkIntegrity(key: string, data: unknown): ContentIssue[] {
  return [
    ...checkDuplicateIds(key, data),
    ...checkDuplicateOrders(key, data),
  ]
}

// ─── Core Validation ────────────────────────────────────────────────────────

/**
 * Validate a single content key's data against its schema + integrity checks.
 * Pure function — no I/O.
 */
export function validateContentData(key: string, data: unknown): Omit<ContentKeyResult, 'file'> {
  const validation = validateKV(key, data)

  if (!validation) {
    return { key, status: 'pass', schemaValid: true, issues: [] }
  }

  const issues: ContentIssue[] = []

  if (!validation.success) {
    issues.push({ type: 'schema', key, message: validation.error })
    return { key, status: 'fail', schemaValid: false, issues }
  }

  const integrityIssues = checkIntegrity(key, validation.data)
  issues.push(...integrityIssues)

  const itemCount = Array.isArray(validation.data) ? validation.data.length : undefined
  return {
    key,
    status: integrityIssues.length > 0 ? 'fail' : 'pass',
    schemaValid: true,
    issues,
    itemCount,
  }
}

/**
 * Validate all canonical content files from disk.
 *
 * @param publicDir  Absolute path to the `public/` directory.
 * @returns Structured report — never mutates files.
 */
export function validateContentFiles(publicDir: string): ContentValidationReport {
  const results: ContentKeyResult[] = []
  let passCount = 0
  let failCount = 0
  let missingCount = 0
  const allIssues: ContentIssue[] = []

  for (const [key, relativePath] of Object.entries(CONTENT_FILE_MAP)) {
    const filePath = resolve(publicDir, relativePath)

    if (!existsSync(filePath)) {
      const issue: ContentIssue = { type: 'schema', key, message: `File not found: ${relativePath}` }
      results.push({
        key,
        file: relativePath,
        status: 'missing',
        schemaValid: false,
        issues: [issue],
      })
      allIssues.push(issue)
      missingCount++
      continue
    }

    let data: unknown
    try {
      const raw = readFileSync(filePath, 'utf-8')
      data = JSON.parse(raw)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const issue: ContentIssue = { type: 'schema', key, message: `JSON parse error: ${msg}` }
      results.push({
        key,
        file: relativePath,
        status: 'parse-error',
        schemaValid: false,
        issues: [issue],
      })
      allIssues.push(issue)
      failCount++
      continue
    }

    const result = validateContentData(key, data)
    const keyResult: ContentKeyResult = { ...result, file: relativePath }
    results.push(keyResult)
    allIssues.push(...keyResult.issues)

    if (keyResult.status === 'pass') passCount++
    else failCount++
  }

  return {
    timestamp: new Date().toISOString(),
    totalKeys: Object.keys(CONTENT_FILE_MAP).length,
    passCount,
    failCount,
    missingCount,
    issueCount: allIssues.length,
    results,
    issues: allIssues,
  }
}

// ─── Report Formatting ──────────────────────────────────────────────────────

const STATUS_ICON: Record<string, string> = {
  pass: '✓',
  fail: '✗',
  missing: '?',
  'parse-error': '✗',
}

/**
 * Format a validation report as human-readable console output.
 * Suitable for CI logs and local terminal.
 */
export function formatReport(report: ContentValidationReport): string {
  const lines: string[] = []

  lines.push('─── Content Validation Report ───')
  lines.push(`Timestamp: ${report.timestamp}`)
  lines.push(`Keys: ${report.totalKeys} total | ${report.passCount} pass | ${report.failCount} fail | ${report.missingCount} missing`)
  lines.push('')

  for (const result of report.results) {
    const icon = STATUS_ICON[result.status] ?? '?'
    const count = result.itemCount !== undefined ? ` (${result.itemCount} items)` : ''
    lines.push(`  ${icon} ${result.key} → ${result.file}${count}`)

    for (const issue of result.issues) {
      lines.push(`    ⚠ [${issue.type}] ${issue.message}`)
    }
  }

  lines.push('')
  const failures = report.failCount + report.missingCount
  if (failures > 0) {
    lines.push(`❌ FAIL — ${failures} key(s) failed validation`)
  } else {
    lines.push(`✅ PASS — all ${report.passCount} keys validated successfully`)
  }

  return lines.join('\n')
}
