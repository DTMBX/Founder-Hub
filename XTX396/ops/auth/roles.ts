/**
 * B21 Operator Mode — Extended Role Definitions
 *
 * Extends the existing 4-role RBAC (owner/admin/editor/support) with:
 * - operator: Locked, wizard-only site generation. Cannot access admin internals.
 * - reviewer: Case jacket review + notes + exports. No editing.
 *
 * These roles integrate with the existing permissions.ts enforcement layer.
 * Operator Mode is ON by default for operator-role users.
 */

// ─── Role Definitions ──────────────────────────────────────────────

export type BaseRole = 'owner' | 'admin' | 'editor' | 'support';
export type ExtendedRole = BaseRole | 'operator' | 'reviewer';

export interface RoleDefinition {
  readonly id: ExtendedRole;
  readonly level: number;
  readonly label: string;
  readonly description: string;
  readonly operatorModeDefault: boolean;
  readonly capabilities: readonly string[];
  readonly restrictedRoutes: readonly string[];
  readonly allowedRoutes: readonly string[];
}

// ─── Capability Constants ──────────────────────────────────────────

export const OPERATOR_CAPABILITIES = [
  'create_site_wizard',
  'preview_site',
  'publish_site',
  'view_audit',
  'manage_leads',
] as const;

export const REVIEWER_CAPABILITIES = [
  'case_jacket_review',
  'case_jacket_notes',
  'case_jacket_export',
  'view_audit',
] as const;

export const ADMIN_CAPABILITIES = [
  'create_site_wizard',
  'preview_site',
  'publish_site',
  'view_audit',
  'manage_leads',
  'case_jacket_review',
  'case_jacket_notes',
  'case_jacket_export',
  'manage_settings',
  'manage_security',
  'manage_users',
  'manage_deployments',
  'manage_templates',
  'manage_components',
  'manage_blueprints',
  'dangerous_actions',
  'full_admin_access',
] as const;

export type OperatorCapability = (typeof OPERATOR_CAPABILITIES)[number];
export type ReviewerCapability = (typeof REVIEWER_CAPABILITIES)[number];
export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];
export type Capability = OperatorCapability | ReviewerCapability | AdminCapability;

// ─── Operator-Allowed Routes ───────────────────────────────────────

export const OPERATOR_ALLOWED_ROUTES = [
  'sites',
  'client-sites',
  'leads',
  'audit',
  'law-firm',
  'smb-template',
  'agency',
] as const;

export const REVIEWER_ALLOWED_ROUTES = [
  'case-jackets',
  'documents',
  'court',
  'audit',
] as const;

// ─── Role Registry ─────────────────────────────────────────────────

export const EXTENDED_ROLES: Record<ExtendedRole, RoleDefinition> = {
  owner: {
    id: 'owner',
    level: 100,
    label: 'Owner',
    description: 'Full system access, production deploys, user management, dangerous actions',
    operatorModeDefault: false,
    capabilities: [...ADMIN_CAPABILITIES],
    restrictedRoutes: [],
    allowedRoutes: [], // empty = all routes allowed
  },
  admin: {
    id: 'admin',
    level: 75,
    label: 'Admin',
    description: 'Operations + deploy to preview/staging, no production deploys, no role management',
    operatorModeDefault: false,
    capabilities: [...ADMIN_CAPABILITIES].filter(c => c !== 'dangerous_actions'),
    restrictedRoutes: [],
    allowedRoutes: [],
  },
  editor: {
    id: 'editor',
    level: 50,
    label: 'Editor',
    description: 'Content editing only, no destructive actions',
    operatorModeDefault: false,
    capabilities: ['create_site_wizard', 'preview_site', 'view_audit'],
    restrictedRoutes: ['settings', 'security', 'asset-policy', 'session-security'],
    allowedRoutes: [],
  },
  operator: {
    id: 'operator',
    level: 40,
    label: 'Operator',
    description: 'Guided site generation only. Wizard-locked. Cannot access admin internals.',
    operatorModeDefault: true,
    capabilities: [...OPERATOR_CAPABILITIES],
    restrictedRoutes: [],
    allowedRoutes: [...OPERATOR_ALLOWED_ROUTES],
  },
  reviewer: {
    id: 'reviewer',
    level: 35,
    label: 'Reviewer',
    description: 'Case jacket review, notes, and exports. No content editing.',
    operatorModeDefault: false,
    capabilities: [...REVIEWER_CAPABILITIES],
    restrictedRoutes: [],
    allowedRoutes: [...REVIEWER_ALLOWED_ROUTES],
  },
  support: {
    id: 'support',
    level: 25,
    label: 'Support',
    description: 'Read-only + ticket notes, no edits',
    operatorModeDefault: false,
    capabilities: ['view_audit'],
    restrictedRoutes: [],
    allowedRoutes: [],
  },
};

// ─── Enforcement Functions ─────────────────────────────────────────

/**
 * Check if a role has a specific capability.
 * Fail-closed: returns false for unknown roles or capabilities.
 */
export function hasCapability(role: ExtendedRole, capability: string): boolean {
  const def = EXTENDED_ROLES[role];
  if (!def) return false;
  return def.capabilities.includes(capability as Capability);
}

/**
 * Check if user role can access a specific admin route.
 * Operator and reviewer roles use allowlists (fail-closed).
 * Other roles use the existing restrictedRoutes logic.
 */
export function canAccessRoute(role: ExtendedRole, route: string): boolean {
  const def = EXTENDED_ROLES[role];
  if (!def) return false;

  // Operator and reviewer: explicit allowlist only
  if (def.allowedRoutes.length > 0) {
    return def.allowedRoutes.includes(route);
  }

  // Other roles: everything except restricted routes
  if (def.restrictedRoutes.length > 0) {
    return !def.restrictedRoutes.includes(route);
  }

  return true;
}

/**
 * Check if Operator Mode should be active for a given role.
 * Operator Mode locks the UI to wizard-only flows.
 */
export function isOperatorModeLocked(role: ExtendedRole): boolean {
  const def = EXTENDED_ROLES[role];
  if (!def) return true; // fail-closed: unknown roles are locked
  return def.operatorModeDefault;
}

/**
 * Get all capabilities for a role.
 */
export function getCapabilities(role: ExtendedRole): readonly string[] {
  const def = EXTENDED_ROLES[role];
  if (!def) return [];
  return def.capabilities;
}

/**
 * Get all accessible routes for a role.
 * Returns null if all routes are accessible (owner/admin).
 */
export function getAccessibleRoutes(role: ExtendedRole): readonly string[] | null {
  const def = EXTENDED_ROLES[role];
  if (!def) return [];
  if (def.allowedRoutes.length > 0) return def.allowedRoutes;
  return null; // all routes accessible (minus restricted)
}

/**
 * Validate that a role assignment is valid.
 * Only owner can assign operator/reviewer roles.
 */
export function canAssignRole(assignerRole: ExtendedRole, targetRole: ExtendedRole): boolean {
  const assigner = EXTENDED_ROLES[assignerRole];
  const target = EXTENDED_ROLES[targetRole];
  if (!assigner || !target) return false;
  // Must have higher level than target
  return assigner.level > target.level;
}
