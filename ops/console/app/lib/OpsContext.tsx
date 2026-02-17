// B11 – Operations + Growth Automation Layer
// Ops Console global context: auth, safe mode, audit

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { OpsUser, OpsRole } from './rbac';
import { DEV_USER, hasPermission } from './rbac';
import { getOpsAuditLogger } from '../../../automation/audit/OpsAuditLogger';

interface OpsContextValue {
  /** Current authenticated user. */
  user: OpsUser;
  /** Global Safe Mode toggle — disables external sends, forces mock adapters. */
  safeMode: boolean;
  setSafeMode: (v: boolean) => void;
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
  const [safeMode, setSafeModeState] = useState(true); // Safe Mode ON by default
  const [user] = useState<OpsUser>(DEV_USER);

  const setSafeMode = useCallback((v: boolean) => {
    setSafeModeState(v);
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
    <OpsContext.Provider value={{ user, safeMode, setSafeMode, can, auditLog }}>
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
