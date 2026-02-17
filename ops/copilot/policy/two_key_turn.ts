/**
 * B12-07 — Two-Key Turn Gate
 *
 * For commands with side effects (writes_repo, deploys, network_egress),
 * execution requires a time-limited confirmation token in addition to
 * the user clicking "Approve".
 *
 * Flow:
 *   1. PolicyEngine flags plan as requires_confirmation
 *   2. CopilotPage generates a TwoKeyToken via generateToken()
 *   3. User must type a confirmation phrase AND enter the token
 *   4. verifyToken() is called before runner.execute()
 *   5. Token expires after TTL_MS (default 120 seconds)
 *
 * This prevents accidental or replay-based execution of dangerous commands.
 *
 * Security properties:
 *   - Tokens are single-use (consumed on verification)
 *   - Tokens are time-limited (120s default)
 *   - Tokens are scoped to a specific correlationId
 *   - No tokens are persisted — in-memory only
 */

import { getOpsAuditLogger } from '../../automation/audit/OpsAuditLogger';
import { generateCorrelationId } from '../../core/correlation';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Time a token remains valid (milliseconds). */
const TTL_MS = 120_000; // 2 minutes

/** Confirmation phrase the user must type. */
export const CONFIRMATION_PHRASE = 'CONFIRM EXECUTION' as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TwoKeyToken {
  /** Unique token identifier */
  token: string;
  /** CorrelationId this token is scoped to */
  correlationId: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp when this token expires */
  expiresAt: string;
  /** Whether this token has been consumed */
  consumed: boolean;
}

export interface TwoKeyVerification {
  valid: boolean;
  reason: string;
}

// ---------------------------------------------------------------------------
// Token Store (in-memory, single-use)
// ---------------------------------------------------------------------------

const tokenStore = new Map<string, TwoKeyToken>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a time-limited, single-use confirmation token scoped to a correlationId.
 */
export function generateTwoKeyToken(correlationId: string): TwoKeyToken {
  // Clean expired tokens on each generation
  purgeExpired();

  const now = Date.now();
  const token: TwoKeyToken = {
    token: generateCorrelationId().replace('cor_', 'tk_'),
    correlationId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TTL_MS).toISOString(),
    consumed: false,
  };

  tokenStore.set(token.token, token);

  // Audit the token generation (never log the token value itself beyond the ID)
  getOpsAuditLogger().log({
    category: 'console.action',
    severity: 'info',
    description: 'Two-key-turn token generated for dangerous operation',
    actor: 'system',
    correlationId,
    payload: {
      tokenId: token.token,
      expiresAt: token.expiresAt,
    },
  });

  return token;
}

/**
 * Verify a token + confirmation phrase before allowing execution.
 *
 * On success, the token is consumed (single-use).
 * Returns { valid, reason } tuple.
 */
export function verifyTwoKeyToken(
  tokenValue: string,
  phrase: string,
  correlationId: string,
): TwoKeyVerification {
  // Phase check removed
  if (phrase !== CONFIRMATION_PHRASE) {
    auditVerification(tokenValue, correlationId, false, 'Confirmation phrase mismatch');
    return { valid: false, reason: 'Confirmation phrase does not match.' };
  }

  const stored = tokenStore.get(tokenValue);

  if (!stored) {
    auditVerification(tokenValue, correlationId, false, 'Token not found');
    return { valid: false, reason: 'Token not found or already consumed.' };
  }

  if (stored.consumed) {
    auditVerification(tokenValue, correlationId, false, 'Token already consumed');
    return { valid: false, reason: 'Token has already been used.' };
  }

  if (stored.correlationId !== correlationId) {
    auditVerification(tokenValue, correlationId, false, 'Token correlationId mismatch');
    return { valid: false, reason: 'Token does not match this operation.' };
  }

  if (Date.now() > new Date(stored.expiresAt).getTime()) {
    stored.consumed = true; // Mark consumed so it can't be retried
    auditVerification(tokenValue, correlationId, false, 'Token expired');
    return { valid: false, reason: 'Token has expired. Generate a new one.' };
  }

  // Success — consume the token
  stored.consumed = true;
  auditVerification(tokenValue, correlationId, true, 'Token verified and consumed');
  return { valid: true, reason: 'Token verified. Execution authorized.' };
}

/**
 * Check whether a plan requires two-key-turn confirmation.
 * Returns true if any command has mutating side effects.
 */
export function requiresTwoKeyTurn(sideEffects: string[]): boolean {
  const DANGEROUS: ReadonlySet<string> = new Set([
    'writes_repo',
    'deploys',
    'network_egress',
  ]);
  return sideEffects.some((s) => DANGEROUS.has(s));
}

/**
 * Get remaining TTL in seconds for a token (for UI countdown).
 * Returns 0 if expired or not found.
 */
export function getTokenTTL(tokenValue: string): number {
  const stored = tokenStore.get(tokenValue);
  if (!stored || stored.consumed) return 0;
  const remaining = new Date(stored.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(remaining / 1000));
}

// ---------------------------------------------------------------------------
// Reset (testing only)
// ---------------------------------------------------------------------------

export function resetTwoKeyStore(): void {
  tokenStore.clear();
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function purgeExpired(): void {
  const now = Date.now();
  for (const [key, tk] of tokenStore) {
    if (now > new Date(tk.expiresAt).getTime()) {
      tokenStore.delete(key);
    }
  }
}

function auditVerification(
  tokenId: string,
  correlationId: string,
  success: boolean,
  detail: string,
): void {
  getOpsAuditLogger().log({
    category: 'console.action',
    severity: success ? 'info' : 'warn',
    description: `Two-key-turn verification: ${detail}`,
    actor: 'system',
    correlationId,
    payload: { tokenId, success },
  });
}
