// B11 – Operations + Growth Automation Layer
// B11-03 — Lead capture API handler (framework-agnostic)

import type { Lead, LeadCreateInput, LeadUpdateInput, LeadStatus, LeadSource } from './LeadModel';
import { getLeadRepository, validateLeadInput } from './LeadModel';
import { getLeadRateLimiter } from './rate-limit';

// ─── Request / Response types ────────────────────────────────────

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  query?: Record<string, string>;
  clientId?: string; // IP or token for rate limiting
  actor?: string;    // authenticated user name
}

export interface ApiResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

// ─── Handler ─────────────────────────────────────────────────────

/**
 * Framework-agnostic lead API handler.
 *
 * Routes:
 *   POST   /leads        — create a lead
 *   GET    /leads        — list leads (optional ?status=&source=)
 *   GET    /leads/:id    — get lead by ID
 *   PATCH  /leads/:id    — update lead
 *   DELETE /leads/:id    — delete lead
 */
export async function handleLeadRequest(req: ApiRequest): Promise<ApiResponse> {
  try {
    // Rate limiting (applied to POST only)
    if (req.method === 'POST') {
      const limiter = getLeadRateLimiter();
      const key = req.clientId ?? 'anonymous';
      const result = limiter.check(key);
      if (!result.allowed) {
        return {
          status: 429,
          body: { error: 'Too many requests. Try again later.' },
          headers: { 'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)) },
        };
      }
    }

    const repo = getLeadRepository();
    const actor = req.actor ?? 'api';

    // Parse route
    const segments = req.path.replace(/^\/+|\/+$/g, '').split('/');
    // segments[0] should be "leads"
    const leadId = segments[1] ?? null;

    // POST /leads
    if (req.method === 'POST' && !leadId) {
      const input = req.body as LeadCreateInput;
      if (!input) {
        return { status: 400, body: { error: 'Request body is required.' } };
      }

      const validation = validateLeadInput(input);
      if (!validation.valid) {
        return { status: 400, body: { error: 'Validation failed.', details: validation.errors } };
      }

      const lead = await repo.create(input, actor);
      return { status: 201, body: lead };
    }

    // GET /leads
    if (req.method === 'GET' && !leadId) {
      const filter: Partial<Pick<Lead, 'status' | 'source'>> = {};
      if (req.query?.status) filter.status = req.query.status as LeadStatus;
      if (req.query?.source) filter.source = req.query.source as LeadSource;

      const leads = await repo.getAll(filter);
      return { status: 200, body: leads };
    }

    // GET /leads/:id
    if (req.method === 'GET' && leadId) {
      const lead = await repo.getById(leadId);
      if (!lead) return { status: 404, body: { error: 'Lead not found.' } };
      return { status: 200, body: lead };
    }

    // PATCH /leads/:id
    if (req.method === 'PATCH' && leadId) {
      const patch = req.body as LeadUpdateInput;
      if (!patch) {
        return { status: 400, body: { error: 'Request body is required.' } };
      }

      try {
        const updated = await repo.update(leadId, patch, actor);
        return { status: 200, body: updated };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Update failed.';
        if (message.includes('not found')) return { status: 404, body: { error: message } };
        return { status: 400, body: { error: message } };
      }
    }

    // DELETE /leads/:id
    if (req.method === 'DELETE' && leadId) {
      try {
        await repo.delete(leadId, actor);
        return { status: 204, body: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed.';
        if (message.includes('not found')) return { status: 404, body: { error: message } };
        return { status: 400, body: { error: message } };
      }
    }

    return { status: 405, body: { error: 'Method not allowed.' } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error.';
    return { status: 500, body: { error: message } };
  }
}
