/**
 * Cloudflare Worker — GitHub Webhook Receiver
 *
 * Endpoint: /api/webhooks/github
 *
 * Receives push/release webhook events from GitHub, validates the
 * HMAC-SHA256 signature, and appends activity entries to a Cloudflare
 * KV namespace. The activity feed client fetches from this KV namespace
 * with a stale-while-revalidate strategy, falling back to the static
 * build-time activity.json.
 *
 * Deploy: wrangler deploy workers/github-webhook.ts
 *
 * Required KV namespace binding: ACTIVITY_KV
 * Required secret: GITHUB_WEBHOOK_SECRET
 */

export interface Env {
  ACTIVITY_KV: KVNamespace
  GITHUB_WEBHOOK_SECRET: string
}

interface ActivityEvent {
  id: string
  type: 'repo' | 'release' | 'documentation' | 'domain'
  projectId: string
  title: string
  description?: string
  timestamp: number
  link?: string
}

// Map GitHub repo full_name to our project IDs
const REPO_MAP: Record<string, string> = {
  'DTMBX/EVIDENT': 'evident-platform',
  'DTMBX/Founder-Hub': 'founder-hub',
  'DTMBX/tillerstead': 'tillerstead',
  'DTMBX/civics-hierarchy': 'civics-hierarchy',
  'DTMBX/epstein-library-evid': 'doj-document-library',
  'DTMBX/informed-consent-com': 'informed-consent',
  'DTMBX/essential-goods-ledg': 'essential-goods-ledger',
  'DTMBX/geneva-bible-study-t': 'geneva-bible-study',
  'DTMBX/contractor-command-c': 'contractor-command-center',
}

const KV_KEY = 'live-activity-events'
const MAX_EVENTS = 200

/**
 * Verify the GitHub webhook HMAC-SHA256 signature.
 */
async function verifySignature(
  secret: string,
  body: string,
  signature: string,
): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expected = 'sha256=' + Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison
  if (expected.length !== signature.length) return false
  let mismatch = 0
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return mismatch === 0
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Health check
    if (url.pathname === '/api/webhooks/github' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Webhook endpoint
    if (url.pathname === '/api/webhooks/github' && request.method === 'POST') {
      const signature = request.headers.get('x-hub-signature-256')
      if (!signature) {
        return new Response('Missing signature', { status: 401 })
      }

      const body = await request.text()

      const valid = await verifySignature(env.GITHUB_WEBHOOK_SECRET, body, signature)
      if (!valid) {
        return new Response('Invalid signature', { status: 403 })
      }

      const event = request.headers.get('x-github-event')
      const payload = JSON.parse(body)

      const activities: ActivityEvent[] = []

      if (event === 'push' && payload.ref === 'refs/heads/main') {
        const repoName = payload.repository?.full_name
        const projectId = REPO_MAP[repoName]
        if (projectId) {
          const commitCount = payload.commits?.length ?? 0
          activities.push({
            id: `push-${projectId}-${Date.now()}`,
            type: 'repo',
            projectId,
            title: `${payload.repository.name}: ${commitCount} commit${commitCount !== 1 ? 's' : ''} pushed`,
            description: payload.head_commit?.message?.slice(0, 120),
            timestamp: Date.now(),
            link: payload.compare,
          })
        }
      }

      if (event === 'release' && payload.action === 'published') {
        const repoName = payload.repository?.full_name
        const projectId = REPO_MAP[repoName]
        if (projectId) {
          activities.push({
            id: `release-${projectId}-${Date.now()}`,
            type: 'release',
            projectId,
            title: `${payload.repository.name} ${payload.release.tag_name} released`,
            description: payload.release.name || undefined,
            timestamp: Date.now(),
            link: payload.release.html_url,
          })
        }
      }

      if (activities.length > 0) {
        // Append to KV
        const existing: ActivityEvent[] = await env.ACTIVITY_KV.get(KV_KEY, 'json') ?? []
        const merged = [...activities, ...existing].slice(0, MAX_EVENTS)
        await env.ACTIVITY_KV.put(KV_KEY, JSON.stringify(merged))
      }

      return new Response(JSON.stringify({ accepted: activities.length }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Serve live activity feed
    if (url.pathname === '/api/live-activity.json' && request.method === 'GET') {
      const events: ActivityEvent[] = await env.ACTIVITY_KV.get(KV_KEY, 'json') ?? []
      return new Response(JSON.stringify({ version: '1.0', events }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return new Response('Not found', { status: 404 })
  },
}
