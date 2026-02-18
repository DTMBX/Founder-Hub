/**
 * OpenAPI Integration — Client Wrapper
 *
 * Safe client that enforces the allowlist, rate limits, and adapter pattern.
 * All external API calls MUST go through this client.
 *
 * Invariants:
 * - Only allowlisted endpoints can be called.
 * - Only allowed HTTP methods per endpoint.
 * - Rate limits enforced per endpoint.
 * - Disabled/deprecated endpoints are blocked.
 * - Default adapter is the MockAdapter (safe mode).
 * - All requests and responses are auditable.
 */

import type { OpenApiAdapterInterface, ApiRequest, ApiResponse } from './MockAdapter'
import { MockOpenApiAdapter } from './MockAdapter'
import registryData from './registry.json'

// ─── Registry Types ──────────────────────────────────────────

interface EndpointDef {
  readonly id: string
  readonly name: string
  readonly baseUrl: string
  readonly methods: readonly string[]
  readonly auth: { readonly type: string }
  readonly rateLimit: { readonly maxRequests: number; readonly windowMs: number }
  readonly status: string
  readonly tags?: readonly string[]
}

interface RateLimitEntry {
  count: number
  windowStart: number
}

// ─── Audit Entry ─────────────────────────────────────────────

export interface ApiAuditEntry {
  readonly timestamp: string
  readonly endpointId: string
  readonly path: string
  readonly method: string
  readonly status: number
  readonly mock: boolean
  readonly allowed: boolean
  readonly error?: string
}

// ─── Client ──────────────────────────────────────────────────

export class OpenApiClient {
  private readonly _adapter: OpenApiAdapterInterface
  private readonly _endpoints: ReadonlyMap<string, EndpointDef>
  private readonly _rateLimits = new Map<string, RateLimitEntry>()
  private readonly _auditLog: ApiAuditEntry[] = []

  constructor(adapter?: OpenApiAdapterInterface) {
    this._adapter = adapter ?? new MockOpenApiAdapter()

    // Index endpoints
    const map = new Map<string, EndpointDef>()
    for (const ep of (registryData as { endpoints: EndpointDef[] }).endpoints) {
      map.set(ep.id, ep)
    }
    this._endpoints = map
  }

  /**
   * Executes an API request through the adapter.
   *
   * Checks: allowlist → status → method → rate limit → execute.
   */
  async request<T = unknown>(
    endpointId: string,
    path: string,
    method: string = 'GET',
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const now = Date.now()

    // Step 1: Check allowlist
    const endpoint = this._endpoints.get(endpointId)
    if (!endpoint) {
      this._logAudit(endpointId, path, method, 403, false, false, 'Endpoint not in allowlist')
      throw new OpenApiError(`Endpoint "${endpointId}" is not in the allowlist`)
    }

    // Step 2: Check status
    if (endpoint.status === 'disabled') {
      this._logAudit(endpointId, path, method, 403, false, false, 'Endpoint is disabled')
      throw new OpenApiError(`Endpoint "${endpointId}" is disabled`)
    }

    // Step 3: Check method
    if (!endpoint.methods.includes(method.toUpperCase())) {
      this._logAudit(endpointId, path, method, 405, false, false, `Method ${method} not allowed`)
      throw new OpenApiError(
        `Method "${method}" is not allowed for endpoint "${endpointId}". Allowed: ${endpoint.methods.join(', ')}`,
      )
    }

    // Step 4: Rate limit
    if (!this._checkRateLimit(endpointId, endpoint.rateLimit, now)) {
      this._logAudit(endpointId, path, method, 429, false, false, 'Rate limit exceeded')
      throw new OpenApiError(`Rate limit exceeded for endpoint "${endpointId}"`)
    }

    // Step 5: Execute through adapter
    const request: ApiRequest = {
      endpointId,
      path,
      method: method.toUpperCase(),
      body,
    }

    const response = await this._adapter.execute<T>(request)
    this._logAudit(endpointId, path, method, response.status, response.meta.mock, true)
    return response
  }

  /**
   * Returns the list of allowlisted endpoint IDs.
   */
  listEndpoints(): readonly string[] {
    return [...this._endpoints.keys()]
  }

  /**
   * Returns endpoint definition by ID.
   */
  getEndpoint(endpointId: string): EndpointDef | undefined {
    return this._endpoints.get(endpointId)
  }

  /**
   * Returns the audit log (read-only).
   */
  getAuditLog(): readonly ApiAuditEntry[] {
    return [...this._auditLog]
  }

  get auditLogSize(): number {
    return this._auditLog.length
  }

  // ── Rate Limiting ────────────────────────────────────────

  private _checkRateLimit(
    endpointId: string,
    config: { maxRequests: number; windowMs: number },
    now: number,
  ): boolean {
    const entry = this._rateLimits.get(endpointId)

    if (!entry || now >= entry.windowStart + config.windowMs) {
      this._rateLimits.set(endpointId, { count: 1, windowStart: now })
      return true
    }

    entry.count += 1
    return entry.count <= config.maxRequests
  }

  // ── Audit ────────────────────────────────────────────────

  private _logAudit(
    endpointId: string,
    path: string,
    method: string,
    status: number,
    mock: boolean,
    allowed: boolean,
    error?: string,
  ): void {
    this._auditLog.push({
      timestamp: new Date().toISOString(),
      endpointId,
      path,
      method,
      status,
      mock,
      allowed,
      error,
    })
  }
}

// ─── Error ───────────────────────────────────────────────────

export class OpenApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OpenApiError'
  }
}
