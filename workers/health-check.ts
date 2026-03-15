/**
 * Health Check Cloudflare Worker — /api/health
 *
 * Checks availability of:
 * - Satellite domains (HTTP HEAD)
 * - Main site
 * - API endpoints
 *
 * Returns structured JSON with per-check status, latency, and overall health.
 * Designed for uptime monitoring (cron trigger or external pinger).
 */

interface Env {
  /** Optional: Supabase URL to verify connectivity */
  SUPABASE_URL?: string
}

interface HealthCheck {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latencyMs: number
  message?: string
}

const SATELLITE_DOMAINS = [
  { name: 'Evident Main', url: 'https://www.xtx396.com' },
  { name: 'Founder Hub', url: 'https://devon-tyler.com' },
  { name: 'Tillerstead', url: 'https://tillerstead.com' },
  { name: 'Civics Hierarchy', url: 'https://civics.xtx396.com' },
  { name: 'Document Library', url: 'https://library.xtx396.com' },
  { name: 'Essential Goods', url: 'https://ledger.xtx396.com' },
  { name: 'Geneva Bible Study', url: 'https://bible.xtx396.com' },
  { name: 'Informed Consent', url: 'https://consent.xtx396.com' },
  { name: 'Contractor CC', url: 'https://contractor.xtx396.com' },
]

const TIMEOUT_MS = 8000

async function checkDomain(name: string, url: string): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)
    const latencyMs = Date.now() - start

    if (res.ok || res.status === 301 || res.status === 302) {
      return { name, status: latencyMs > 3000 ? 'degraded' : 'healthy', latencyMs }
    }

    return {
      name,
      status: 'degraded',
      latencyMs,
      message: `HTTP ${res.status}`,
    }
  } catch (err) {
    return {
      name,
      status: 'down',
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Only respond to /api/health
    if (url.pathname !== '/api/health') {
      return new Response('Not Found', { status: 404 })
    }

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const checks: HealthCheck[] = []

    // Check all satellite domains in parallel
    const domainChecks = await Promise.all(
      SATELLITE_DOMAINS.map(d => checkDomain(d.name, d.url))
    )
    checks.push(...domainChecks)

    // Check Supabase if configured
    if (env.SUPABASE_URL) {
      const supaCheck = await checkDomain('Supabase', `${env.SUPABASE_URL}/rest/v1/`)
      checks.push(supaCheck)
    }

    // Overall status
    const hasDown = checks.some(c => c.status === 'down')
    const hasDegraded = checks.some(c => c.status === 'degraded')
    const overall = hasDown ? 'down' : hasDegraded ? 'degraded' : 'healthy'

    const body = {
      status: overall,
      timestamp: new Date().toISOString(),
      checks,
      summary: {
        total: checks.length,
        healthy: checks.filter(c => c.status === 'healthy').length,
        degraded: checks.filter(c => c.status === 'degraded').length,
        down: checks.filter(c => c.status === 'down').length,
      },
    }

    return new Response(JSON.stringify(body, null, 2), {
      status: overall === 'healthy' ? 200 : overall === 'degraded' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        ...corsHeaders,
      },
    })
  },

  // Cron trigger — runs periodically via Cloudflare cron
  async scheduled(_event: ScheduledEvent, _env: Env): Promise<void> {
    // Just run the health check; Cloudflare logs will capture the result
    const checks = await Promise.all(
      SATELLITE_DOMAINS.map(d => checkDomain(d.name, d.url))
    )
    const down = checks.filter(c => c.status === 'down')
    if (down.length > 0) {
      console.error(`[HealthCheck] ${down.length} service(s) down:`, down.map(d => d.name))
    } else {
      console.log(`[HealthCheck] All ${checks.length} services healthy`)
    }
  },
}
