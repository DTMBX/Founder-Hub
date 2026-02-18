// B11 – Operations + Growth Automation Layer
// RBAC (Role-Based Access Control) scaffold for Ops Console

export type OpsRole = 'Admin' | 'Operator' | 'ReadOnly';

export interface OpsUser {
  id: string;
  username: string;
  role: OpsRole;
  displayName: string;
}

/** Permission definitions per role. */
const PERMISSIONS: Record<OpsRole, Set<string>> = {
  Admin: new Set([
    'leads.read', 'leads.create', 'leads.update', 'leads.delete',
    'clients.read', 'clients.update', 'clients.archive',
    'automations.read', 'automations.toggle', 'automations.run',
    'content.read', 'content.trigger', 'content.publish',
    'settings.read', 'settings.update',
    'audit.read', 'audit.export',
    'dashboard.read',
  ]),
  Operator: new Set([
    'leads.read', 'leads.create', 'leads.update',
    'clients.read', 'clients.update',
    'automations.read', 'automations.toggle', 'automations.run',
    'content.read', 'content.trigger',
    'settings.read',
    'audit.read',
    'dashboard.read',
  ]),
  ReadOnly: new Set([
    'leads.read',
    'clients.read',
    'automations.read',
    'content.read',
    'settings.read',
    'audit.read',
    'dashboard.read',
  ]),
};

/** Check if a role has a specific permission. */
export function hasPermission(role: OpsRole, permission: string): boolean {
  return PERMISSIONS[role]?.has(permission) ?? false;
}

/** Get all permissions for a role. */
export function getPermissions(role: OpsRole): string[] {
  return Array.from(PERMISSIONS[role] ?? []);
}

/** Mock dev-only user for local development. */
export const DEV_USER: OpsUser = {
  id: 'dev-admin-001',
  username: 'dev-admin',
  role: 'Admin',
  displayName: 'Dev Admin',
};
