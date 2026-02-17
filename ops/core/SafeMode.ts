// B11.1 – Gap-Fill Hardening
// D2 — Safe Mode: Single Source of Truth
//
// This module is the ONLY authority for Safe Mode state.
// UI components may READ the state, but cannot be the authority.
// Every adapter performing external effects MUST call
// SafeMode.assertExternalAllowed() before proceeding.

// ─── Types ───────────────────────────────────────────────────────

export type SafeModeListener = (enabled: boolean) => void;

// ─── Safe Mode Controller ────────────────────────────────────────

export class SafeModeController {
  private _enabled = true; // Safe Mode ON by default — fail closed
  private _listeners = new Set<SafeModeListener>();
  private _lockout = false; // panic lockout — cannot disable safe mode

  /** Current state. */
  get enabled(): boolean {
    return this._enabled;
  }

  /** Whether panic lockout is active. */
  get lockedOut(): boolean {
    return this._lockout;
  }

  /**
   * Enable Safe Mode.
   * Always permitted — enabling is never gated.
   */
  enable(): void {
    this._enabled = true;
    this._notify();
  }

  /**
   * Disable Safe Mode (enter live mode).
   * Blocked if panic lockout is active.
   * @returns true if mode was changed, false if lockout prevented it.
   */
  disable(): boolean {
    if (this._lockout) return false;
    this._enabled = false;
    this._notify();
    return true;
  }

  /**
   * Panic: force Safe Mode ON and lock out disable.
   * Once activated, lockout persists until explicit reset.
   */
  panic(): void {
    this._enabled = true;
    this._lockout = true;
    this._notify();
  }

  /**
   * Clear panic lockout.
   * Safe Mode remains ON but can now be toggled again.
   * This operation should be gated behind Admin role by callers.
   */
  clearLockout(): void {
    this._lockout = false;
  }

  /**
   * Guard: throws if Safe Mode is enabled and an external effect
   * is about to occur. Every adapter must call this before any
   * outbound request, send, or dispatch.
   */
  assertExternalAllowed(context?: string): void {
    if (this._enabled) {
      const msg = context
        ? `External effect blocked (safe mode): ${context}`
        : 'External effect blocked: Safe Mode is enabled.';
      throw new SafeModeBlockError(msg);
    }
  }

  /**
   * Non-throwing check — returns true if external effects are allowed.
   */
  isExternalAllowed(): boolean {
    return !this._enabled;
  }

  /** Subscribe to state changes. Returns unsubscribe function. */
  subscribe(listener: SafeModeListener): () => void {
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  /** Reset for testing. */
  reset(): void {
    this._enabled = true;
    this._lockout = false;
    this._listeners.clear();
  }

  private _notify(): void {
    for (const fn of this._listeners) {
      try { fn(this._enabled); } catch { /* listener errors must not propagate */ }
    }
  }
}

// ─── Error Class ─────────────────────────────────────────────────

export class SafeModeBlockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafeModeBlockError';
  }
}

// ─── Singleton ───────────────────────────────────────────────────

export const SafeMode = new SafeModeController();
