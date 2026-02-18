/**
 * OpenAPI Integration — Mock Adapter
 *
 * Default adapter that always returns deterministic mock responses.
 * Used for testing, development, and safe-mode operation.
 *
 * Invariants:
 * - No real network requests.
 * - Same input always produces same output.
 * - All responses are clearly labeled as mock data.
 */

// ─── Types ───────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  readonly status: number
  readonly ok: boolean
  readonly data: T
  readonly headers: Readonly<Record<string, string>>
  readonly meta: {
    readonly endpointId: string
    readonly mock: boolean
    readonly requestedAt: string
  }
}

export interface ApiRequest {
  readonly endpointId: string
  readonly path: string
  readonly method: string
  readonly params?: Readonly<Record<string, string>>
  readonly body?: unknown
}

// ─── Adapter Interface ───────────────────────────────────────

export interface OpenApiAdapterInterface {
  readonly adapterId: string
  execute<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>>
}

// ─── Mock Adapter ────────────────────────────────────────────

/**
 * Mock adapter — returns deterministic placeholder data.
 * No network calls. No secrets used.
 */
export class MockOpenApiAdapter implements OpenApiAdapterInterface {
  readonly adapterId = 'mock-openapi-v1'

  private readonly _responses = new Map<string, unknown>()

  /**
   * Register a mock response for a given endpoint + path combo.
   */
  registerResponse(endpointId: string, path: string, data: unknown): void {
    this._responses.set(`${endpointId}:${path}`, data)
  }

  async execute<T = unknown>(request: ApiRequest): Promise<ApiResponse<T>> {
    const key = `${request.endpointId}:${request.path}`
    const registered = this._responses.get(key)

    if (registered !== undefined) {
      return {
        status: 200,
        ok: true,
        data: registered as T,
        headers: { 'x-mock': 'true', 'content-type': 'application/json' },
        meta: {
          endpointId: request.endpointId,
          mock: true,
          requestedAt: new Date().toISOString(),
        },
      }
    }

    // Default mock response based on endpoint type
    const defaultData = this._generateDefault(request)
    return {
      status: 200,
      ok: true,
      data: defaultData as T,
      headers: { 'x-mock': 'true', 'content-type': 'application/json' },
      meta: {
        endpointId: request.endpointId,
        mock: true,
        requestedAt: new Date().toISOString(),
      },
    }
  }

  private _generateDefault(request: ApiRequest): unknown {
    return {
      _mock: true,
      _endpointId: request.endpointId,
      _path: request.path,
      _method: request.method,
      results: [],
      count: 0,
      message: `Mock response for ${request.endpointId}${request.path}`,
    }
  }

  /** Test helper: clear registered responses. */
  clear(): void {
    this._responses.clear()
  }

  get registeredCount(): number {
    return this._responses.size
  }
}
