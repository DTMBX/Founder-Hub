// B11 – Operations + Growth Automation Layer
// B11-08 — UI Policy enforcement (config-driven allowlists)

import type { OpsRole } from '../../console/app/lib/rbac';
import { hasPermission } from '../../console/app/lib/rbac';

// ─── Page Allowlist ──────────────────────────────────────────────

export interface PageDefinition {
  key: string;
  label: string;
  permission: string;
}

/**
 * Authoritative list of permitted Ops Console pages.
 * Pages not in this list must not be rendered.
 */
export const OPS_PAGE_ALLOWLIST: readonly PageDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', permission: 'dashboard.view' },
  { key: 'leads', label: 'Leads', permission: 'leads.view' },
  { key: 'clients', label: 'Clients', permission: 'clients.view' },
  { key: 'automations', label: 'Automations', permission: 'automations.view' },
  { key: 'content', label: 'Content', permission: 'content.view' },
  { key: 'settings', label: 'Settings', permission: 'settings.view' },
  { key: 'audit', label: 'Audit Log', permission: 'audit.read' },
] as const;

/** Check whether a page key is in the allowlist. */
export function isPageAllowed(key: string): boolean {
  return OPS_PAGE_ALLOWLIST.some((p) => p.key === key);
}

/** Get pages accessible to a given role. */
export function getAccessiblePages(role: OpsRole): PageDefinition[] {
  return OPS_PAGE_ALLOWLIST.filter((p) => hasPermission(role, p.permission));
}

// ─── Transition Duration Limit ───────────────────────────────────

/** Maximum CSS transition duration in milliseconds (per policy). */
export const MAX_TRANSITION_MS = 150;

// ─── Color Tokens ────────────────────────────────────────────────

export const UI_COLORS = {
  safe: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#6b7280',
  primary: '#2563eb',
} as const;

// ─── Layout Constants ────────────────────────────────────────────

export const LAYOUT = {
  maxContentWidth: 480,
  minTouchTarget: 44,
  borderRadius: { card: 12, button: 10 },
  spacing: { xs: 8, sm: 12, md: 16, lg: 20 },
} as const;
