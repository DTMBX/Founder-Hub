/**
 * GitHub App Token Proxy (Cloudflare Worker)
 *
 * Secure proxy that handles GitHub App authentication.
 * Keeps the app private key server-side, never exposing it to the browser.
 *
 * CHAIN B2: Least privilege GitHub integration
 *
 * DEPLOY:
 * 1. Create Cloudflare Worker
 * 2. Set secrets: GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY
 * 3. Deploy this file
 * 4. Update VITE_GITHUB_TOKEN_PROXY_URL
 *
 * ENDPOINTS:
 * - POST /token - Get installation access token
 * - GET /installation/:id - Get installation details
 * - GET /installation/:id/repos - Get accessible repos
 *
 * @cloudflare-worker
 */

interface Env {
  GITHUB_APP_ID: string
  GITHUB_APP_PRIVATE_KEY: string
  ALLOWED_ORIGINS?: string
}

// ─── JWT Generation ─────────────────────────────────────────────────────────

async function createJWT(appId: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iat: now - 60, // Issued 60 seconds ago (clock skew)
    exp: now + 600, // Expires in 10 minutes
    iss: appId,
  }

  // Import private key
  const privateKey = await importPrivateKey(privateKeyPem)

  // Create JWT
  const header = { alg: 'RS256', typ: 'JWT' }
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, data)
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${headerB64}.${payloadB64}.${signatureB64}`
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Remove PEM headers and decode
  const pemBody = pem
    .replace('-----BEGIN RSA PRIVATE KEY-----', '')
    .replace('-----END RSA PRIVATE KEY-----', '')
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryString = atob(pemBody)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return crypto.subtle.importKey(
    'pkcs8',
    bytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

// ─── GitHub API Calls ───────────────────────────────────────────────────────

async function getInstallationToken(
  installationId: number,
  appId: string,
  privateKey: string
): Promise<Response> {
  const jwt = await createJWT(appId, privateKey)

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'XTX396-GitHub-App',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    return new Response(JSON.stringify({ error: `GitHub API error: ${error}` }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}

async function getInstallationDetails(
  installationId: number,
  appId: string,
  privateKey: string
): Promise<Response> {
  const jwt = await createJWT(appId, privateKey)

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}`,
    {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'XTX396-GitHub-App',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    return new Response(JSON.stringify({ error: `GitHub API error: ${error}` }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}

async function getInstallationRepos(
  installationId: number,
  appId: string,
  privateKey: string
): Promise<Response> {
  // First get an installation token
  const tokenResponse = await getInstallationToken(installationId, appId, privateKey)
  if (!tokenResponse.ok) {
    return tokenResponse
  }

  const tokenData = await tokenResponse.json()

  // Then fetch repos with the token
  const response = await fetch('https://api.github.com/installation/repositories', {
    headers: {
      Authorization: `Bearer ${tokenData.token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'XTX396-GitHub-App',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    return new Response(JSON.stringify({ error: `GitHub API error: ${error}` }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── CORS Headers ───────────────────────────────────────────────────────────

function corsHeaders(env: Env, origin?: string): HeadersInit {
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['https://devon-tyler.com']
  const isAllowed = origin && allowedOrigins.some((o) => origin.startsWith(o.trim()))

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

// ─── Request Handler ────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || undefined
    const headers = corsHeaders(env, origin)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    // Validate secrets
    if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }

    try {
      // POST /token - Get installation access token
      if (request.method === 'POST' && url.pathname === '/token') {
        const body = await request.json() as { installationId?: number }
        if (!body.installationId) {
          return new Response(JSON.stringify({ error: 'Missing installationId' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          })
        }

        const response = await getInstallationToken(
          body.installationId,
          env.GITHUB_APP_ID,
          env.GITHUB_APP_PRIVATE_KEY
        )

        // Add CORS headers to response
        const responseHeaders = new Headers(response.headers)
        Object.entries(headers).forEach(([k, v]) => responseHeaders.set(k, v))

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        })
      }

      // GET /installation/:id - Get installation details
      const installationMatch = url.pathname.match(/^\/installation\/(\d+)$/)
      if (request.method === 'GET' && installationMatch) {
        const installationId = parseInt(installationMatch[1], 10)

        const response = await getInstallationDetails(
          installationId,
          env.GITHUB_APP_ID,
          env.GITHUB_APP_PRIVATE_KEY
        )

        const responseHeaders = new Headers(response.headers)
        Object.entries(headers).forEach(([k, v]) => responseHeaders.set(k, v))

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        })
      }

      // GET /installation/:id/repos - Get installation repos
      const reposMatch = url.pathname.match(/^\/installation\/(\d+)\/repos$/)
      if (request.method === 'GET' && reposMatch) {
        const installationId = parseInt(reposMatch[1], 10)

        const response = await getInstallationRepos(
          installationId,
          env.GITHUB_APP_ID,
          env.GITHUB_APP_PRIVATE_KEY
        )

        const responseHeaders = new Headers(response.headers)
        Object.entries(headers).forEach(([k, v]) => responseHeaders.set(k, v))

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        })
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      })
    }
  },
}
