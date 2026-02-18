import { describe, it, expect } from 'vitest';
import {
  EXTENDED_ROLES,
  OPERATOR_CAPABILITIES,
  REVIEWER_CAPABILITIES,
  ADMIN_CAPABILITIES,
  OPERATOR_ALLOWED_ROUTES,
  REVIEWER_ALLOWED_ROUTES,
  hasCapability,
  canAccessRoute,
  isOperatorModeLocked,
  getCapabilities,
  getAccessibleRoutes,
  canAssignRole,
  type ExtendedRole,
} from '../roles';

describe('B21 Operator Mode — Role Definitions', () => {
  // ─── Role Registry ───────────────────────────────────────────

  it('defines 6 roles: owner, admin, editor, operator, reviewer, support', () => {
    const roles = Object.keys(EXTENDED_ROLES);
    expect(roles).toHaveLength(6);
    expect(roles).toContain('owner');
    expect(roles).toContain('admin');
    expect(roles).toContain('editor');
    expect(roles).toContain('operator');
    expect(roles).toContain('reviewer');
    expect(roles).toContain('support');
  });

  it('role levels are strictly ordered', () => {
    expect(EXTENDED_ROLES.owner.level).toBeGreaterThan(EXTENDED_ROLES.admin.level);
    expect(EXTENDED_ROLES.admin.level).toBeGreaterThan(EXTENDED_ROLES.editor.level);
    expect(EXTENDED_ROLES.editor.level).toBeGreaterThan(EXTENDED_ROLES.operator.level);
    expect(EXTENDED_ROLES.operator.level).toBeGreaterThan(EXTENDED_ROLES.reviewer.level);
    expect(EXTENDED_ROLES.reviewer.level).toBeGreaterThan(EXTENDED_ROLES.support.level);
  });

  it('every role has required fields', () => {
    for (const [id, def] of Object.entries(EXTENDED_ROLES)) {
      expect(def.id).toBe(id);
      expect(def.label).toBeTruthy();
      expect(def.description).toBeTruthy();
      expect(typeof def.operatorModeDefault).toBe('boolean');
      expect(Array.isArray(def.capabilities)).toBe(true);
      expect(Array.isArray(def.restrictedRoutes)).toBe(true);
      expect(Array.isArray(def.allowedRoutes)).toBe(true);
    }
  });

  // ─── Operator Role ──────────────────────────────────────────

  it('operator has exactly the allowed capabilities', () => {
    const caps = EXTENDED_ROLES.operator.capabilities;
    for (const c of OPERATOR_CAPABILITIES) {
      expect(caps).toContain(c);
    }
    expect(caps).toHaveLength(OPERATOR_CAPABILITIES.length);
  });

  it('operator mode is ON by default for operator role', () => {
    expect(EXTENDED_ROLES.operator.operatorModeDefault).toBe(true);
  });

  it('operator mode is OFF by default for all other roles', () => {
    for (const [id, def] of Object.entries(EXTENDED_ROLES)) {
      if (id !== 'operator') {
        expect(def.operatorModeDefault).toBe(false);
      }
    }
  });

  it('operator can only access allowlisted routes', () => {
    expect(EXTENDED_ROLES.operator.allowedRoutes.length).toBeGreaterThan(0);
    for (const r of EXTENDED_ROLES.operator.allowedRoutes) {
      expect(OPERATOR_ALLOWED_ROUTES).toContain(r);
    }
  });

  // ─── Reviewer Role ──────────────────────────────────────────

  it('reviewer has exactly the allowed capabilities', () => {
    const caps = EXTENDED_ROLES.reviewer.capabilities;
    for (const c of REVIEWER_CAPABILITIES) {
      expect(caps).toContain(c);
    }
    expect(caps).toHaveLength(REVIEWER_CAPABILITIES.length);
  });

  it('reviewer can only access allowlisted routes', () => {
    expect(EXTENDED_ROLES.reviewer.allowedRoutes.length).toBeGreaterThan(0);
    for (const r of EXTENDED_ROLES.reviewer.allowedRoutes) {
      expect(REVIEWER_ALLOWED_ROUTES).toContain(r);
    }
  });

  // ─── Capability Checks ──────────────────────────────────────

  it('operator can create_site_wizard and preview_site', () => {
    expect(hasCapability('operator', 'create_site_wizard')).toBe(true);
    expect(hasCapability('operator', 'preview_site')).toBe(true);
  });

  it('operator CANNOT manage_settings or dangerous_actions', () => {
    expect(hasCapability('operator', 'manage_settings')).toBe(false);
    expect(hasCapability('operator', 'dangerous_actions')).toBe(false);
    expect(hasCapability('operator', 'full_admin_access')).toBe(false);
  });

  it('reviewer can review case jackets but not create sites', () => {
    expect(hasCapability('reviewer', 'case_jacket_review')).toBe(true);
    expect(hasCapability('reviewer', 'case_jacket_notes')).toBe(true);
    expect(hasCapability('reviewer', 'create_site_wizard')).toBe(false);
  });

  it('admin has all capabilities except dangerous_actions', () => {
    expect(hasCapability('admin', 'create_site_wizard')).toBe(true);
    expect(hasCapability('admin', 'manage_settings')).toBe(true);
    expect(hasCapability('admin', 'dangerous_actions')).toBe(false);
  });

  it('owner has dangerous_actions capability', () => {
    expect(hasCapability('owner', 'dangerous_actions')).toBe(true);
  });

  it('unknown role has no capabilities (fail-closed)', () => {
    expect(hasCapability('unknown' as ExtendedRole, 'create_site_wizard')).toBe(false);
  });

  // ─── Route Access ───────────────────────────────────────────

  it('operator can access allowlisted routes', () => {
    expect(canAccessRoute('operator', 'sites')).toBe(true);
    expect(canAccessRoute('operator', 'client-sites')).toBe(true);
    expect(canAccessRoute('operator', 'leads')).toBe(true);
  });

  it('operator CANNOT access settings, security, or system routes', () => {
    expect(canAccessRoute('operator', 'settings')).toBe(false);
    expect(canAccessRoute('operator', 'security')).toBe(false);
    expect(canAccessRoute('operator', 'deployments')).toBe(false);
    expect(canAccessRoute('operator', 'theme')).toBe(false);
    expect(canAccessRoute('operator', 'content')).toBe(false);
  });

  it('reviewer can access case-jackets and documents', () => {
    expect(canAccessRoute('reviewer', 'case-jackets')).toBe(true);
    expect(canAccessRoute('reviewer', 'documents')).toBe(true);
    expect(canAccessRoute('reviewer', 'court')).toBe(true);
  });

  it('reviewer CANNOT access sites or settings', () => {
    expect(canAccessRoute('reviewer', 'sites')).toBe(false);
    expect(canAccessRoute('reviewer', 'settings')).toBe(false);
    expect(canAccessRoute('reviewer', 'content')).toBe(false);
  });

  it('owner can access all routes', () => {
    expect(canAccessRoute('owner', 'settings')).toBe(true);
    expect(canAccessRoute('owner', 'security')).toBe(true);
    expect(canAccessRoute('owner', 'sites')).toBe(true);
    expect(canAccessRoute('owner', 'content')).toBe(true);
  });

  it('unknown role cannot access any route (fail-closed)', () => {
    expect(canAccessRoute('unknown' as ExtendedRole, 'sites')).toBe(false);
  });

  // ─── Operator Mode Lock ─────────────────────────────────────

  it('isOperatorModeLocked returns true for operator', () => {
    expect(isOperatorModeLocked('operator')).toBe(true);
  });

  it('isOperatorModeLocked returns false for owner/admin', () => {
    expect(isOperatorModeLocked('owner')).toBe(false);
    expect(isOperatorModeLocked('admin')).toBe(false);
  });

  it('isOperatorModeLocked returns true for unknown role (fail-closed)', () => {
    expect(isOperatorModeLocked('unknown' as ExtendedRole)).toBe(true);
  });

  // ─── getCapabilities ────────────────────────────────────────

  it('getCapabilities returns correct list for operator', () => {
    const caps = getCapabilities('operator');
    expect(caps).toHaveLength(OPERATOR_CAPABILITIES.length);
  });

  it('getCapabilities returns empty for unknown role', () => {
    expect(getCapabilities('unknown' as ExtendedRole)).toHaveLength(0);
  });

  // ─── getAccessibleRoutes ────────────────────────────────────

  it('getAccessibleRoutes returns allowlist for operator', () => {
    const routes = getAccessibleRoutes('operator');
    expect(routes).not.toBeNull();
    expect(routes!.length).toBe(OPERATOR_ALLOWED_ROUTES.length);
  });

  it('getAccessibleRoutes returns null for owner (all routes)', () => {
    expect(getAccessibleRoutes('owner')).toBeNull();
  });

  // ─── Role Assignment ────────────────────────────────────────

  it('owner can assign operator role', () => {
    expect(canAssignRole('owner', 'operator')).toBe(true);
  });

  it('admin can assign operator role', () => {
    expect(canAssignRole('admin', 'operator')).toBe(true);
  });

  it('operator CANNOT assign any role', () => {
    expect(canAssignRole('operator', 'support')).toBe(true); // 40 > 25
    expect(canAssignRole('operator', 'operator')).toBe(false); // 40 = 40
    expect(canAssignRole('operator', 'editor')).toBe(false); // 40 < 50
  });

  it('no role can assign a role of equal or higher level', () => {
    expect(canAssignRole('admin', 'admin')).toBe(false);
    expect(canAssignRole('admin', 'owner')).toBe(false);
    expect(canAssignRole('editor', 'admin')).toBe(false);
  });
});
