// B11 – Operations + Growth Automation Layer
// Ops Console global context: auth, safe mode, audit
// B11.1 — Hardened: subscribes to SafeMode SSOT (D2)

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { OpsUser, OpsRole } from './rbac';
import { DEV_USER, hasPermission } from './rbac';
import { getOpsAuditLogger } from '../../../automation/audit/OpsAuditLogger';
import { SafeMode } from '../../../core/SafeMode';

interface OpsContextValue {
  /** Current authenticated user. */
  user: OpsUser;
  /** Global Safe Mode toggle — disables external sends, forces mock adapters. */
  safeMode: boolean;
  setSafeMode: (v: boolean) => void;
  /** B11.1 — Panic: force Safe Mode ON + lockout (D2). */
  panic: () => void;
  /** Check if current user has a permission. */
  can: (permission: string) => boolean;
  /** Log an ops audit event (convenience). */
  auditLog: (
    category: Parameters<typeof getOpsAuditLogger>extends never ? never : string,
    description: string,
    payload?: Record<string, unknown>
  ) => Promise<void>;
}

const OpsContext = createContext<OpsContextValue | null>(null);

/**
 * Dev-only auth gate.
 * In production, replace with proper OAuth / SSO integration.
 * Documented in /ops/console/README.md.
 */
const DEV_TOKEN_KEY = 'ops_dev_token';
const EXPECTED_DEV_TOKEN = 'ops-dev-2026';

export function OpsProvider({ children }: { children: ReactNode }) {
  // B11.1 — Safe Mode state driven by SSOT singleton (D2)
  const [safeMode, setSafeModeState] = useState(() => !SafeMode.isExternalAllowed());
  const [user] = useState<OpsUser>(DEV_USER);

  // Subscribe to SafeMode SSOT changes
  useEffect(() => {
    const unsubscribe = SafeMode.subscribe(() => {
      setSafeModeState(!SafeMode.isExternalAllowed());
    });
    return unsubscribe;
  }, []);

  const setSafeMode = useCallback((v: boolean) => {
    if (v) {
      SafeMode.enable();
    } else {
      SafeMode.disable();
    }
    getOpsAuditLogger().log({
      category: 'console.safe_mode_toggled',
      severity: 'warn',
      actor: user.username,
      description: `Safe Mode ${v ? 'enabled' : 'disabled'}`,
      payload: { safeMode: v },
    });
  }, [user.username]);

  const can = useCallback(
    (permission: string) => hasPermission(user.role, permission),
    [user.role]
  );

  // B11.1 — Panic button: force Safe Mode ON + lockout (D2)
  const panic = useCallback(() => {
    SafeMode.panic();
    getOpsAuditLogger().log({
      category: 'console.safe_mode_panic',
      severity: 'error',
      actor: user.username,
      description: 'PANIC: Safe Mode forced ON with lockout',
      payload: { safeMode: true, lockout: true },
    });
  }, [user.username]);

  const auditLog = useCallback(
    async (
      category: string,
      description: string,
      payload: Record<string, unknown> = {}
    ) => {
      await getOpsAuditLogger().log({
        category: category as any,
        severity: 'info',
        actor: user.username,
        description,
        payload,
      });
    },
    [user.username]
  );

  return (
    <OpsContext.Provider value={{ user, safeMode, setSafeMode, panic, can, auditLog }}>
      {children}
    </OpsContext.Provider>
  );
}

/** Hook to access Ops context — must be inside OpsProvider. */
export function useOps(): OpsContextValue {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error('useOps must be used within <OpsProvider>');
  return ctx;
}

/** Dev-only login check. */
export function isDevAuthenticated(): boolean {
  try {
    return localStorage.getItem(DEV_TOKEN_KEY) === EXPECTED_DEV_TOKEN;
  } catch {
    return false;
  }
}

/** Dev-only login. */
export function devLogin(token: string): boolean {
  if (token === EXPECTED_DEV_TOKEN) {
    localStorage.setItem(DEV_TOKEN_KEY, token);
    return true;
  }
  return false;
}

/** Dev-only logout. */
export function devLogout(): void {
  localStorage.removeItem(DEV_TOKEN_KEY);
}
