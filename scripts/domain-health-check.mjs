/**
 * domain-health-check.mjs — Check HTTP response and TLS validity for all
 * project domains listed in the registry.
 *
 * Usage:  node scripts/domain-health-check.mjs
 *
 * Outputs a JSON report to stdout and a summary table to stderr.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import https from 'node:https'
import http from 'node:http'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Parse domains from the TS registry (lightweight regex extraction) ──

const registryPath = resolve(__dirname, '..', 'src', 'data', 'projects.ts')
const registrySource = readFileSync(registryPath, 'utf-8')

const domainRegex = /domain:\s*'([^']+)'/g
const domains = []
let m
while ((m = domainRegex.exec(registrySource)) !== null) {
  domains.push(m[1])
}

if (domains.length === 0) {
  console.error('No domains found in project registry.')
  process.exit(1)
}

// ── Health check per domain ──

/**
 * @param {string} domain
 * @returns {Promise<{domain: string, https: boolean, statusCode: number|null, tlsValid: boolean, error: string|null}>}
 */
function checkDomain(domain) {
  return new Promise((resolvePromise) => {
    const url = `https://${domain}`
    const req = https.get(url, { timeout: 10_000, rejectUnauthorized: true }, (res) => {
      resolvePromise({
        domain,
        https: true,
        statusCode: res.statusCode,
        tlsValid: true,
        error: null,
      })
      res.resume() // drain
    })

    req.on('error', (err) => {
      // TLS failure — try plain HTTP to see if server responds
      const httpUrl = `http://${domain}`
      const httpReq = http.get(httpUrl, { timeout: 10_000 }, (res) => {
        resolvePromise({
          domain,
          https: false,
          statusCode: res.statusCode,
          tlsValid: false,
          error: `TLS error: ${err.message}`,
        })
        res.resume()
      })

      httpReq.on('error', (httpErr) => {
        resolvePromise({
          domain,
          https: false,
          statusCode: null,
          tlsValid: false,
          error: httpErr.message,
        })
      })

      httpReq.end()
    })

    req.on('timeout', () => {
      req.destroy()
      resolvePromise({
        domain,
        https: false,
        statusCode: null,
        tlsValid: false,
        error: 'Request timed out (10 s)',
      })
    })

    req.end()
  })
}

// ── Run all checks ──

const results = await Promise.all(domains.map(checkDomain))

// Summary table (stderr)
console.error('\n  Domain Health Report\n  ' + '─'.repeat(58))
for (const r of results) {
  const status = r.statusCode ?? '---'
  const tls = r.tlsValid ? '✓ TLS' : '✗ TLS'
  const icon = r.statusCode && r.statusCode < 400 && r.tlsValid ? '●' : '○'
  const err = r.error ? `  (${r.error})` : ''
  console.error(`  ${icon}  ${r.domain.padEnd(28)} ${String(status).padEnd(5)} ${tls}${err}`)
}
console.error('')

// Machine-readable JSON (stdout)
console.log(JSON.stringify(results, null, 2))
