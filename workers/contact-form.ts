/**
 * Cloudflare Worker — Contact & Inquiry Form Handler
 *
 * Endpoint: /api/contact
 *
 * Routes form submissions to the correct inbox based on the "source"
 * field. Implements honeypot spam protection, timing-based bot
 * detection, and IP-based rate limiting via Cloudflare KV.
 *
 * Inboxes:
 *   tillerstead  → TILLERSTEAD_EMAIL (Tillerstead project inquiries)
 *   evident      → EVIDENT_EMAIL (Evident licensing inquiries)
 *   general      → FOUNDER_EMAIL (General contact)
 *
 * Deploy: wrangler deploy workers/contact-form.ts
 *
 * Required KV namespace binding: RATE_LIMIT_KV, SUBMISSIONS_KV
 * Required secrets: MAILCHANNELS_DKIM_DOMAIN (or use MailChannels free tier)
 * Required environment variables: TILLERSTEAD_EMAIL, EVIDENT_EMAIL, FOUNDER_EMAIL
 */

export interface Env {
  RATE_LIMIT_KV: KVNamespace
  SUBMISSIONS_KV: KVNamespace
  TILLERSTEAD_EMAIL: string
  EVIDENT_EMAIL: string
  FOUNDER_EMAIL: string
  FROM_EMAIL: string
  FROM_NAME: string
}

interface ContactPayload {
  source: 'tillerstead' | 'evident' | 'general'
  name: string
  email: string
  // Optional fields depending on source
  address?: string
  project_type?: string
  budget?: string
  description?: string
  organization?: string
  interest?: string
  message?: string
  // Bot detection fields
  _honeypot?: string
  _loaded_at?: number
}

interface FormResponse {
  ok: boolean
  message: string
  id?: string
}

const MAX_PER_HOUR = 5
const MIN_SUBMIT_TIME_MS = 3000 // Forms filled in <3s are bots
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://devon-tyler.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(data: FormResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

/**
 * Rate limit: 5 submissions per IP per hour.
 * Uses Cloudflare KV with TTL-based expiry.
 */
async function checkRateLimit(ip: string, kv: KVNamespace): Promise<boolean> {
  const key = `rate:${ip}`
  const current = await kv.get(key, 'json') as { count: number; window: number } | null

  const now = Date.now()
  const oneHour = 60 * 60 * 1000

  if (!current || now - current.window > oneHour) {
    await kv.put(key, JSON.stringify({ count: 1, window: now }), { expirationTtl: 3600 })
    return true
  }

  if (current.count >= MAX_PER_HOUR) return false

  await kv.put(key, JSON.stringify({ count: current.count + 1, window: current.window }), {
    expirationTtl: 3600,
  })
  return true
}

function getRecipientEmail(source: string, env: Env): string {
  switch (source) {
    case 'tillerstead': return env.TILLERSTEAD_EMAIL
    case 'evident': return env.EVIDENT_EMAIL
    default: return env.FOUNDER_EMAIL
  }
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'tillerstead': return 'Tillerstead Project Inquiry'
    case 'evident': return 'Evident Licensing Inquiry'
    default: return 'General Contact'
  }
}

function buildEmailBody(payload: ContactPayload): string {
  const lines: string[] = [
    `New ${getSourceLabel(payload.source)}`,
    '',
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
  ]

  if (payload.organization) lines.push(`Organization: ${payload.organization}`)
  if (payload.address) lines.push(`Address: ${payload.address}`)
  if (payload.project_type) lines.push(`Project Type: ${payload.project_type}`)
  if (payload.budget) lines.push(`Budget Range: ${payload.budget}`)
  if (payload.interest) lines.push(`Interest: ${payload.interest}`)
  if (payload.description) lines.push(`\nDescription:\n${payload.description}`)
  if (payload.message) lines.push(`\nMessage:\n${payload.message}`)

  lines.push('', `Submitted: ${new Date().toISOString()}`)
  return lines.join('\n')
}

function buildConfirmationBody(payload: ContactPayload): string {
  const label = getSourceLabel(payload.source)
  return [
    `Hi ${payload.name},`,
    '',
    `This confirms we received your ${label.toLowerCase()}.`,
    '',
    'We will review your submission and respond within 2 business days.',
    '',
    'Thank you,',
    'Devon Tyler Barber',
    '',
    '---',
    'devon-tyler.com',
    'Evident Technologies LLC | Tillerstead LLC',
  ].join('\n')
}

/**
 * Send email via MailChannels (free for Cloudflare Workers).
 * Falls back gracefully — the submission is always stored in KV
 * even if email delivery fails.
 */
async function sendEmail(
  to: string,
  subject: string,
  body: string,
  env: Env,
): Promise<boolean> {
  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: env.FROM_EMAIL, name: env.FROM_NAME },
        subject,
        content: [{ type: 'text/plain', value: body }],
      }),
    })
    return res.ok || res.status === 202
  } catch {
    return false
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)

    if (url.pathname !== '/api/contact' || request.method !== 'POST') {
      return new Response('Not found', { status: 404 })
    }

    // Rate limit check
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    const allowed = await checkRateLimit(ip, env.RATE_LIMIT_KV)
    if (!allowed) {
      return jsonResponse({ ok: false, message: 'Rate limit exceeded. Please try again later.' }, 429)
    }

    let payload: ContactPayload
    try {
      payload = await request.json() as ContactPayload
    } catch {
      return jsonResponse({ ok: false, message: 'Invalid request body.' }, 400)
    }

    // Honeypot check — if the hidden field has a value, it's a bot
    if (payload._honeypot) {
      // Return success to not tip off bots, but do nothing
      return jsonResponse({ ok: true, message: 'Submission received.' })
    }

    // Timing-based bot detection — human forms take >3 seconds
    if (payload._loaded_at) {
      const elapsed = Date.now() - payload._loaded_at
      if (elapsed < MIN_SUBMIT_TIME_MS) {
        return jsonResponse({ ok: true, message: 'Submission received.' })
      }
    }

    // Validate required fields
    if (!payload.name?.trim() || !payload.email?.trim() || !payload.source) {
      return jsonResponse({ ok: false, message: 'Name, email, and source are required.' }, 400)
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return jsonResponse({ ok: false, message: 'Invalid email address.' }, 400)
    }

    // Store submission in KV for durability
    const submissionId = `sub_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
    const submission = {
      id: submissionId,
      ...payload,
      _honeypot: undefined,
      _loaded_at: undefined,
      ip,
      submitted_at: new Date().toISOString(),
    }
    await env.SUBMISSIONS_KV.put(submissionId, JSON.stringify(submission), {
      expirationTtl: 60 * 60 * 24 * 365, // 1 year retention
    })

    // Send notification email to the right inbox
    const recipient = getRecipientEmail(payload.source, env)
    const subject = `[${getSourceLabel(payload.source)}] ${payload.name}`
    const emailBody = buildEmailBody(payload)
    await sendEmail(recipient, subject, emailBody, env)

    // Send confirmation to submitter
    const confirmSubject = `We received your ${getSourceLabel(payload.source).toLowerCase()}`
    const confirmBody = buildConfirmationBody(payload)
    await sendEmail(payload.email, confirmSubject, confirmBody, env)

    return jsonResponse({ ok: true, message: 'Submission received. We will follow up within 2 business days.', id: submissionId })
  },
}
