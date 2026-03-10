/**
 * content-ci.test.ts — Content CI validation test suite.
 *
 * Validates all canonical data files in public/data/ against their
 * Zod schemas and runs integrity checks. Each content key gets its
 * own describe block so CI logs show exactly which key failed.
 *
 * Runs as part of `npm test` (vitest) and via `npm run validate:content`.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { resolve } from 'path'
import {
  validateContentFiles,
  formatReport,
  CONTENT_FILE_MAP,
  type ContentValidationReport,
} from '../content-validator'

const PUBLIC_DIR = resolve(process.cwd(), 'public')

let report: ContentValidationReport

beforeAll(() => {
  report = validateContentFiles(PUBLIC_DIR)
})

describe('Content CI Validation', () => {
  it('audits all schema-backed content keys', () => {
    expect(report.totalKeys).toBe(Object.keys(CONTENT_FILE_MAP).length)
  })

  // Generate per-key test blocks for granular CI output
  for (const [key, file] of Object.entries(CONTENT_FILE_MAP)) {
    describe(key, () => {
      it(`file exists at public/${file}`, () => {
        const result = report.results.find(r => r.key === key)
        expect(result).toBeDefined()
        expect(result!.status).not.toBe('missing')
      })

      it('parses as valid JSON', () => {
        const result = report.results.find(r => r.key === key)
        expect(result).toBeDefined()
        expect(result!.status).not.toBe('parse-error')
      })

      it('passes schema validation', () => {
        const result = report.results.find(r => r.key === key)
        expect(result).toBeDefined()
        expect(result!.schemaValid).toBe(true)
      })

      it('passes integrity checks', () => {
        const result = report.results.find(r => r.key === key)
        expect(result).toBeDefined()
        const integrityIssues = result!.issues.filter(i => i.type === 'integrity')
        if (integrityIssues.length > 0) {
          expect.fail(integrityIssues.map(i => i.message).join('\n'))
        }
      })
    })
  }

  it('produces zero validation failures', () => {
    if (report.failCount > 0 || report.missingCount > 0) {
      // Print full report to CI log on failure
      console.error(formatReport(report))

      const failDetails = report.results
        .filter(r => r.status !== 'pass')
        .map(r => `${r.key}: ${r.issues.map(i => i.message).join('; ')}`)
        .join('\n')
      expect.fail(`${report.failCount + report.missingCount} key(s) failed:\n${failDetails}`)
    }
    expect(report.failCount).toBe(0)
    expect(report.missingCount).toBe(0)
  })

  it('prints human-readable report', () => {
    const output = formatReport(report)
    console.log(output)
    expect(output).toContain('Content Validation Report')
  })

  it('produces machine-readable JSON summary', () => {
    // Validate report structure for downstream tooling
    expect(report).toMatchObject({
      timestamp: expect.any(String),
      totalKeys: expect.any(Number),
      passCount: expect.any(Number),
      failCount: expect.any(Number),
      missingCount: expect.any(Number),
      issueCount: expect.any(Number),
      results: expect.any(Array),
      issues: expect.any(Array),
    })
  })
})
