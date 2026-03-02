/**
 * RBAC Permissions Tests
 * Chain A2 — Tests for role-based access control
 *
 * Tests cover:
 * - Role permission checks
 * - Route access guards
 * - Action execution guards
 * - Feature flag integration
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  hasPermission,
  hasMinimumRole,
  canAccessRoute,
  canExecuteAction,
  filterNavByRole,
  enforcePermission,
  enforceRouteAccess,
  enforceAction,
  ROLE_HIERARCHY,
  ROUTE_PERMISSIONS,
  ACTION_GUARDS,
  PermissionDeniedError,
  type Permission,
} from '../permissions'
import type { UserRole } from '../types'

describe('Permissions RBAC', () => {
  describe('ROLE_HIERARCHY', () => {
    it('defines correct role hierarchy', () => {
      expect(ROLE_HIERARCHY.owner).toBeGreaterThan(ROLE_HIERARCHY.admin)
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.editor)
      expect(ROLE_HIERARCHY.editor).toBeGreaterThan(ROLE_HIERARCHY.support)
    })
  })

  describe('hasMinimumRole', () => {
    it('owner has minimum role for all roles', () => {
      expect(hasMinimumRole('owner', 'owner')).toBe(true)
      expect(hasMinimumRole('owner', 'admin')).toBe(true)
      expect(hasMinimumRole('owner', 'editor')).toBe(true)
      expect(hasMinimumRole('owner', 'support')).toBe(true)
    })

    it('admin has minimum role for admin and below', () => {
      expect(hasMinimumRole('admin', 'owner')).toBe(false)
      expect(hasMinimumRole('admin', 'admin')).toBe(true)
      expect(hasMinimumRole('admin', 'editor')).toBe(true)
      expect(hasMinimumRole('admin', 'support')).toBe(true)
    })

    it('editor has minimum role for editor and below', () => {
      expect(hasMinimumRole('editor', 'owner')).toBe(false)
      expect(hasMinimumRole('editor', 'admin')).toBe(false)
      expect(hasMinimumRole('editor', 'editor')).toBe(true)
      expect(hasMinimumRole('editor', 'support')).toBe(true)
    })

    it('support has minimum role only for support', () => {
      expect(hasMinimumRole('support', 'owner')).toBe(false)
      expect(hasMinimumRole('support', 'admin')).toBe(false)
      expect(hasMinimumRole('support', 'editor')).toBe(false)
      expect(hasMinimumRole('support', 'support')).toBe(true)
    })
  })

  describe('hasPermission', () => {
    describe('owner permissions', () => {
      it('owner can do everything', () => {
        expect(hasPermission('owner', 'content:read')).toBe(true)
        expect(hasPermission('owner', 'content:edit')).toBe(true)
        expect(hasPermission('owner', 'content:delete')).toBe(true)
        expect(hasPermission('owner', 'deploy:production')).toBe(true)
        expect(hasPermission('owner', 'users:manage-roles')).toBe(true)
        expect(hasPermission('owner', 'dangerous:bulk-delete')).toBe(true)
      })
    })

    describe('admin permissions', () => {
      it('admin can manage content', () => {
        expect(hasPermission('admin', 'content:read')).toBe(true)
        expect(hasPermission('admin', 'content:edit')).toBe(true)
        expect(hasPermission('admin', 'content:delete')).toBe(true)
      })

      it('admin can deploy to preview and staging', () => {
        expect(hasPermission('admin', 'deploy:preview')).toBe(true)
        expect(hasPermission('admin', 'deploy:staging')).toBe(true)
      })

      it('admin CANNOT deploy to production', () => {
        expect(hasPermission('admin', 'deploy:production')).toBe(false)
      })

      it('admin CANNOT manage user roles', () => {
        expect(hasPermission('admin', 'users:manage-roles')).toBe(false)
      })

      it('admin CANNOT execute dangerous actions', () => {
        expect(hasPermission('admin', 'dangerous:bulk-delete')).toBe(false)
        expect(hasPermission('admin', 'dangerous:wipe-data')).toBe(false)
      })
    })

    describe('editor permissions', () => {
      it('editor can read and edit content', () => {
        expect(hasPermission('editor', 'content:read')).toBe(true)
        expect(hasPermission('editor', 'content:edit')).toBe(true)
      })

      it('editor CANNOT delete content', () => {
        expect(hasPermission('editor', 'content:delete')).toBe(false)
      })

      it('editor CANNOT deploy', () => {
        expect(hasPermission('editor', 'deploy:preview')).toBe(false)
        expect(hasPermission('editor', 'deploy:staging')).toBe(false)
        expect(hasPermission('editor', 'deploy:production')).toBe(false)
      })

      it('editor CANNOT publish', () => {
        expect(hasPermission('editor', 'publish:execute')).toBe(false)
      })
    })

    describe('support permissions', () => {
      it('support can read content', () => {
        expect(hasPermission('support', 'content:read')).toBe(true)
      })

      it('support CANNOT edit content', () => {
        expect(hasPermission('support', 'content:edit')).toBe(false)
      })

      it('support can read and note tickets', () => {
        expect(hasPermission('support', 'tickets:read')).toBe(true)
        expect(hasPermission('support', 'tickets:note')).toBe(true)
      })

      it('support CANNOT publish or delete', () => {
        expect(hasPermission('support', 'publish:execute')).toBe(false)
        expect(hasPermission('support', 'content:delete')).toBe(false)
      })
    })
  })

  describe('canAccessRoute', () => {
    describe('content routes', () => {
      it('all editor+ roles can access content routes', () => {
        const contentRoutes = ['content', 'about', 'links', 'projects', 'documents']
        
        for (const route of contentRoutes) {
          expect(canAccessRoute('owner', route)).toBe(true)
          expect(canAccessRoute('admin', route)).toBe(true)
          expect(canAccessRoute('editor', route)).toBe(true)
        }
      })

      it('support CANNOT access content routes', () => {
        expect(canAccessRoute('support', 'content')).toBe(false)
      })
    })

    describe('admin routes', () => {
      const adminRoutes = ['sites', 'staging', 'audit', 'theme']
      
      it('owner can access admin routes', () => {
        for (const route of adminRoutes) {
          expect(canAccessRoute('owner', route)).toBe(true)
        }
      })

      it('admin can access admin routes', () => {
        for (const route of adminRoutes) {
          expect(canAccessRoute('admin', route)).toBe(true)
        }
      })

      it('editor CANNOT access admin routes', () => {
        for (const route of adminRoutes) {
          expect(canAccessRoute('editor', route)).toBe(false)
        }
      })

      it('support CANNOT access admin routes', () => {
        for (const route of adminRoutes) {
          expect(canAccessRoute('support', route)).toBe(false)
        }
      })
    })

    describe('system routes (admin+)', () => {
      const systemRoutes = [
        'session-security', 'runtime-policy', 'deployments',
        'provenance', 'incidents', 'audit-integrity'
      ]

      it('owner can access system routes', () => {
        for (const route of systemRoutes) {
          expect(canAccessRoute('owner', route)).toBe(true)
        }
      })

      it('admin can access system routes', () => {
        for (const route of systemRoutes) {
          expect(canAccessRoute('admin', route)).toBe(true)
        }
      })

      it('editor CANNOT access system routes', () => {
        for (const route of systemRoutes) {
          expect(canAccessRoute('editor', route)).toBe(false)
        }
      })

      it('support CANNOT access system routes', () => {
        for (const route of systemRoutes) {
          expect(canAccessRoute('support', route)).toBe(false)
        }
      })
    })

    describe('owner-only routes', () => {
      const ownerRoutes = ['settings', 'security', 'asset-policy']
      
      it('owner can access owner-only routes', () => {
        for (const route of ownerRoutes) {
          expect(canAccessRoute('owner', route)).toBe(true)
        }
      })

      it('admin CANNOT access owner-only routes', () => {
        for (const route of ownerRoutes) {
          expect(canAccessRoute('admin', route)).toBe(false)
        }
      })

      it('editor CANNOT access owner-only routes', () => {
        for (const route of ownerRoutes) {
          expect(canAccessRoute('editor', route)).toBe(false)
        }
      })
    })

    it('unknown routes default to owner-only', () => {
      expect(canAccessRoute('owner', 'unknown-route-xyz')).toBe(true)
      expect(canAccessRoute('admin', 'unknown-route-xyz')).toBe(false)
      expect(canAccessRoute('editor', 'unknown-route-xyz')).toBe(false)
      expect(canAccessRoute('support', 'unknown-route-xyz')).toBe(false)
    })
  })

  describe('canExecuteAction', () => {
    describe('publish action', () => {
      it('admin can publish', () => {
        expect(canExecuteAction('admin', 'publish')).toBe(true)
      })

      it('owner can publish', () => {
        expect(canExecuteAction('owner', 'publish')).toBe(true)
      })

      it('editor CANNOT publish', () => {
        expect(canExecuteAction('editor', 'publish')).toBe(false)
      })

      it('support CANNOT publish', () => {
        expect(canExecuteAction('support', 'publish')).toBe(false)
      })
    })

    describe('export-data action', () => {
      it('only owner can export data', () => {
        expect(canExecuteAction('owner', 'export-data')).toBe(true)
        expect(canExecuteAction('admin', 'export-data')).toBe(false)
        expect(canExecuteAction('editor', 'export-data')).toBe(false)
        expect(canExecuteAction('support', 'export-data')).toBe(false)
      })
    })

    describe('deploy actions', () => {
      it('admin can deploy to preview and staging', () => {
        expect(canExecuteAction('admin', 'deploy-preview')).toBe(true)
        expect(canExecuteAction('admin', 'deploy-staging')).toBe(true)
      })

      it('admin CANNOT deploy to production', () => {
        expect(canExecuteAction('admin', 'deploy-production')).toBe(false)
      })

      it('only owner can deploy to production', () => {
        expect(canExecuteAction('owner', 'deploy-production')).toBe(true)
      })
    })

    describe('dangerous actions', () => {
      it('only owner can execute dangerous actions', () => {
        expect(canExecuteAction('owner', 'bulk-delete')).toBe(true)
        expect(canExecuteAction('owner', 'wipe-data')).toBe(true)
        expect(canExecuteAction('owner', 'disable-2fa')).toBe(true)
        
        expect(canExecuteAction('admin', 'bulk-delete')).toBe(false)
        expect(canExecuteAction('editor', 'bulk-delete')).toBe(false)
        expect(canExecuteAction('support', 'bulk-delete')).toBe(false)
      })
    })

    it('unknown actions are denied', () => {
      expect(canExecuteAction('owner', 'unknown-action')).toBe(false)
    })
  })

  describe('filterNavByRole', () => {
    const navItems = [
      { id: 'content', label: 'Content' },
      { id: 'settings', label: 'Settings' },
      { id: 'security', label: 'Security' },
      { id: 'sites', label: 'Sites' },
      { id: 'audit', label: 'Audit' },
    ]

    it('owner sees all items', () => {
      const filtered = filterNavByRole(navItems, 'owner')
      expect(filtered).toHaveLength(5)
    })

    it('admin sees non-owner items', () => {
      const filtered = filterNavByRole(navItems, 'admin')
      expect(filtered.map(i => i.id)).toContain('content')
      expect(filtered.map(i => i.id)).toContain('sites')
      expect(filtered.map(i => i.id)).toContain('audit')
      expect(filtered.map(i => i.id)).not.toContain('settings')
      expect(filtered.map(i => i.id)).not.toContain('security')
    })

    it('editor sees only editor routes', () => {
      const filtered = filterNavByRole(navItems, 'editor')
      expect(filtered.map(i => i.id)).toContain('content')
      expect(filtered.map(i => i.id)).not.toContain('sites')
      expect(filtered.map(i => i.id)).not.toContain('settings')
    })

    it('support sees no routes', () => {
      const filtered = filterNavByRole(navItems, 'support')
      expect(filtered).toHaveLength(0)
    })
  })

  describe('enforcePermission', () => {
    it('does not throw for valid permission', () => {
      expect(() => enforcePermission('owner', 'content:read')).not.toThrow()
      expect(() => enforcePermission('editor', 'content:edit')).not.toThrow()
    })

    it('throws PermissionDeniedError for invalid permission', () => {
      expect(() => enforcePermission('editor', 'deploy:production'))
        .toThrow(PermissionDeniedError)
    })

    it('includes context in error', () => {
      try {
        enforcePermission('support', 'content:edit', 'editing blog post')
        expect.fail('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(PermissionDeniedError)
        expect((e as PermissionDeniedError).context).toBe('editing blog post')
      }
    })
  })

  describe('enforceRouteAccess', () => {
    it('does not throw for accessible routes', () => {
      expect(() => enforceRouteAccess('owner', 'settings')).not.toThrow()
      expect(() => enforceRouteAccess('admin', 'sites')).not.toThrow()
      expect(() => enforceRouteAccess('editor', 'content')).not.toThrow()
    })

    it('throws for inaccessible routes', () => {
      expect(() => enforceRouteAccess('admin', 'settings'))
        .toThrow(PermissionDeniedError)
      expect(() => enforceRouteAccess('editor', 'sites'))
        .toThrow(PermissionDeniedError)
      expect(() => enforceRouteAccess('support', 'content'))
        .toThrow(PermissionDeniedError)
    })
  })

  describe('enforceAction', () => {
    it('returns action guard for valid action', () => {
      const guard = enforceAction('owner', 'publish')
      expect(guard.permission).toBe('publish:execute')
      expect(guard.requiresConfirmation).toBe(true)
    })

    it('throws for unauthorized action', () => {
      expect(() => enforceAction('editor', 'publish'))
        .toThrow(PermissionDeniedError)
    })

    it('throws for unknown action', () => {
      expect(() => enforceAction('owner', 'nonexistent-action'))
        .toThrow(PermissionDeniedError)
    })
  })

  describe('ACTION_GUARDS configuration', () => {
    it('all critical actions require confirmation', () => {
      const criticalActions = [
        'publish',
        'export-data',
        'deploy-production',
        'delete-content',
        'disable-2fa',
        'bulk-delete',
        'wipe-data',
      ]

      for (const action of criticalActions) {
        const guard = ACTION_GUARDS[action]
        expect(guard?.requiresConfirmation).toBe(true)
      }
    })

    it('dangerous actions require typed confirmation', () => {
      expect(ACTION_GUARDS['deploy-production'].confirmationType).toBe('typed')
      expect(ACTION_GUARDS['disable-2fa'].confirmationType).toBe('typed')
      expect(ACTION_GUARDS['bulk-delete'].confirmationType).toBe('typed')
      expect(ACTION_GUARDS['wipe-data'].confirmationType).toBe('typed')
    })

    it('critical actions require audit', () => {
      const auditedActions = [
        'publish',
        'export-data',
        'deploy-production',
        'delete-user',
        'disable-2fa',
      ]

      for (const action of auditedActions) {
        expect(ACTION_GUARDS[action]?.auditRequired).toBe(true)
      }
    })
  })
})
