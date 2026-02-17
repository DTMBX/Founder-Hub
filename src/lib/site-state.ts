/**
 * Site State Machine (CP1)
 *
 * Manages site lifecycle states with enforced transitions.
 *
 * State Machine:
 *   DRAFT → PREVIEW → STAGING → LIVE
 *
 * Valid transitions:
 *   draft → preview
 *   preview → staging | draft
 *   staging → live | preview
 *   live → staging (rollback only)
 *
 * All state transitions are logged to audit trail.
 */

import type { SiteState, SiteStatus, SiteSummary } from '@/lib/types'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'
import { KEYS, getSiteRegistry } from '@/lib/site-registry'

// ─── State Transition Matrix ─────────────────────────────────

/**
 * Map of valid state transitions.
 * Key = current state, Value = array of allowed next states.
 */
const VALID_TRANSITIONS: Record<SiteState, SiteState[]> = {
  draft: ['preview'],
  preview: ['staging', 'draft'],
  staging: ['live', 'preview'],
  live: ['staging'], // Only via rollback
}

// ─── Migration: SiteStatus → SiteState ───────────────────────

/**
 * Map legacy SiteStatus to SiteState for backwards compatibility.
 *
 * Mapping logic:
 * - 'draft' → 'draft' (direct match)
 * - 'demo' → 'preview' (demo sites are essentially previews)
 * - 'private' → 'draft' (not publicly visible, treat as draft)
 * - 'unlisted' → 'live' (accessible via URL, treat as live)
 * - 'public' → 'live' (fully public)
 */
export function mapStatusToState(status: SiteStatus): SiteState {
  switch (status) {
    case 'draft':
      return 'draft'
    case 'demo':
      return 'preview'
    case 'private':
      return 'draft'
    case 'unlisted':
      return 'live'
    case 'public':
      return 'live'
    default:
      return 'draft'
  }
}

// ─── SiteStateService ────────────────────────────────────────

export interface TransitionCheck {
  allowed: boolean
  reason?: string
  currentState: SiteState
  targetState: SiteState
}

export class SiteStateService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Get the current state of a site.
   * If no explicit state is set, derives from legacy status.
   */
  async getSiteState(siteId: string): Promise<SiteState | null> {
    const registry = getSiteRegistry(this.adapter)
    const site = await registry.get(siteId)
    if (!site) return null

    // If explicit state is set (CP1+), use it
    if (site.state) {
      return site.state
    }

    // Otherwise, derive from legacy status
    return mapStatusToState(site.status)
  }

  /**
   * Check if a state transition is valid.
   */
  async canTransition(
    siteId: string,
    targetState: SiteState,
  ): Promise<TransitionCheck> {
    const currentState = await this.getSiteState(siteId)
    if (!currentState) {
      return {
        allowed: false,
        reason: 'Site not found',
        currentState: 'draft',
        targetState,
      }
    }

    const allowedTargets = VALID_TRANSITIONS[currentState]
    const allowed = allowedTargets.includes(targetState)

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Invalid transition: ${currentState} → ${targetState}. Allowed: ${allowedTargets.join(', ') || 'none'}`,
      currentState,
      targetState,
    }
  }

  /**
   * Transition a site to a new state.
   * Validates the transition before applying.
   * Logs to audit trail.
   */
  async setSiteState(
    siteId: string,
    newState: SiteState,
    actor: string,
  ): Promise<SiteSummary> {
    const registry = getSiteRegistry(this.adapter)
    const check = await this.canTransition(siteId, newState)

    if (!check.allowed) {
      throw new Error(check.reason)
    }

    // Get current sites list
    const sites = await registry.list()
    const idx = sites.findIndex((s) => s.siteId === siteId)
    if (idx === -1) {
      throw new Error(`Site not found: ${siteId}`)
    }

    const site = sites[idx]
    const previousState = site.state ?? mapStatusToState(site.status)

    // Update state
    site.state = newState
    site.updatedAt = new Date().toISOString()

    // Also update legacy status for backwards compat
    site.status = mapStateToStatus(newState)

    await this.adapter.set(KEYS.SITES_INDEX, sites)

    // Audit log
    await registry.appendAudit(siteId, {
      actor,
      action: 'site.state_changed',
      entityType: 'site',
      entityId: siteId,
      details: {
        previousState,
        newState,
      },
    })

    return site
  }

  /**
   * Check if a site is in a "published" state (staging or live).
   */
  async isPublished(siteId: string): Promise<boolean> {
    const state = await this.getSiteState(siteId)
    return state === 'staging' || state === 'live'
  }

  /**
   * Get all allowed transitions from current state.
   */
  async getAllowedTransitions(siteId: string): Promise<SiteState[]> {
    const state = await this.getSiteState(siteId)
    if (!state) return []
    return VALID_TRANSITIONS[state] ?? []
  }
}

// ─── Helper: SiteState → SiteStatus ──────────────────────────

/**
 * Map SiteState back to legacy SiteStatus for backwards compat.
 */
function mapStateToStatus(state: SiteState): SiteStatus {
  switch (state) {
    case 'draft':
      return 'draft'
    case 'preview':
      return 'demo' // Best legacy equivalent
    case 'staging':
      return 'unlisted' // Accessible but not public
    case 'live':
      return 'public'
    default:
      return 'draft'
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _stateInstance: SiteStateService | null = null

/**
 * Get the global SiteStateService instance.
 */
export function getSiteStateService(adapter?: StorageAdapter): SiteStateService {
  if (adapter) {
    _stateInstance = new SiteStateService(adapter)
    return _stateInstance
  }
  if (!_stateInstance) {
    _stateInstance = new SiteStateService(createStorageAdapter())
  }
  return _stateInstance
}

// ─── Exports for Testing ─────────────────────────────────────

export { VALID_TRANSITIONS }
