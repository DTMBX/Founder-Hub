/**
 * ops/publish/domains/DomainStatus.ts
 *
 * Domain verification status model.
 */

/** Verification states for a domain binding. */
export type DomainVerificationStatus = 'pending' | 'verified' | 'failed'

/** Status transition rules (fail-closed). Verified and failed are terminal. */
const VALID_TRANSITIONS: Record<DomainVerificationStatus, readonly DomainVerificationStatus[]> = {
  pending: ['verified', 'failed'],
  verified: [],  // terminal — re-verification requires a new request
  failed: [],    // terminal — retry requires a new request
}

/**
 * Check if a status transition is valid.
 */
export function isValidTransition(from: DomainVerificationStatus, to: DomainVerificationStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get allowed next states from a given status.
 */
export function getAllowedTransitions(from: DomainVerificationStatus): readonly DomainVerificationStatus[] {
  return VALID_TRANSITIONS[from] ?? []
}
