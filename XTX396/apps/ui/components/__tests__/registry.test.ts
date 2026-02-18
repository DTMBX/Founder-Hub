import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ComponentRegistry,
  COMPONENT_REGISTRY,
  type ComponentDef,
  type A11yRules,
} from '../ComponentRegistry'

// ─── Helpers ─────────────────────────────────────────────────

const REGISTRY_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function loadJson<T = unknown>(filename: string): T {
  const raw = readFileSync(resolve(REGISTRY_DIR, filename), 'utf-8')
  return JSON.parse(raw) as T
}

const rawRegistry = loadJson<{
  version: string
  categories: Array<{ id: string; label: string }>
  components: Array<Record<string, unknown>>
}>('registry.json')

// ─── Load Blueprint Data for Cross-Reference ────────────────

const BLUEPRINTS_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'sitegen',
  'blueprints',
)

interface BlueprintCompact {
  id: string
  required_components: string[]
  optional_components: string[]
  required_sections: Array<{ id: string; component: string }>
}

const BLUEPRINT_FILES = [
  'law_firm.json',
  'agency.json',
  'contractor.json',
  'nonprofit.json',
  'professional_services.json',
]

let blueprints: BlueprintCompact[] = []
try {
  blueprints = BLUEPRINT_FILES.map((f) => {
    const raw = readFileSync(resolve(BLUEPRINTS_DIR, f), 'utf-8')
    return JSON.parse(raw) as BlueprintCompact
  })
} catch {
  // Blueprints may not exist if running P3 tests in isolation
}

// ─── Schema Structural Tests ─────────────────────────────────

describe('registry.schema.json', () => {
  const schema = loadJson<Record<string, unknown>>('registry.schema.json')

  it('exists and has a $schema field', () => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
  })

  it('requires version, categories, and components', () => {
    const req = schema.required as string[]
    expect(req).toContain('version')
    expect(req).toContain('categories')
    expect(req).toContain('components')
  })

  it('defines Component, Category, A11yRules, and PropDef in $defs', () => {
    const defs = schema.$defs as Record<string, unknown>
    expect(defs.Component).toBeDefined()
    expect(defs.Category).toBeDefined()
    expect(defs.A11yRules).toBeDefined()
    expect(defs.PropDef).toBeDefined()
  })
})

// ─── Registry JSON Structural Tests ──────────────────────────

describe('registry.json structure', () => {
  it('has a valid semver version', () => {
    expect(rawRegistry.version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('has at least 5 categories', () => {
    expect(rawRegistry.categories.length).toBeGreaterThanOrEqual(5)
  })

  it('has at least 30 components', () => {
    expect(rawRegistry.components.length).toBeGreaterThanOrEqual(30)
  })

  it('category IDs are unique', () => {
    const ids = rawRegistry.categories.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('component IDs are unique', () => {
    const ids = rawRegistry.components.map((c) => c.id as string)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every component references an existing category', () => {
    const categoryIds = new Set(rawRegistry.categories.map((c) => c.id))
    for (const comp of rawRegistry.components) {
      expect(categoryIds.has(comp.category as string)).toBe(true)
    }
  })
})

// ─── ComponentRegistry Class Tests ───────────────────────────

describe('ComponentRegistry class', () => {
  it('loads as singleton via COMPONENT_REGISTRY', () => {
    expect(COMPONENT_REGISTRY).toBeInstanceOf(ComponentRegistry)
  })

  it('has correct version', () => {
    expect(COMPONENT_REGISTRY.version).toBe(rawRegistry.version)
  })

  it('has correct size', () => {
    expect(COMPONENT_REGISTRY.size).toBe(rawRegistry.components.length)
  })

  it('get() returns a component by ID', () => {
    const comp = COMPONENT_REGISTRY.get('hero-banner')
    expect(comp).not.toBeNull()
    expect(comp!.id).toBe('hero-banner')
    expect(comp!.label).toBeTruthy()
  })

  it('get() returns null for unknown ID', () => {
    expect(COMPONENT_REGISTRY.get('nonexistent-component')).toBeNull()
  })

  it('has() returns true for existing ID', () => {
    expect(COMPONENT_REGISTRY.has('site-header')).toBe(true)
  })

  it('has() returns false for unknown ID', () => {
    expect(COMPONENT_REGISTRY.has('does-not-exist')).toBe(false)
  })

  it('ids contains all component IDs', () => {
    const ids = COMPONENT_REGISTRY.ids
    expect(ids.length).toBe(COMPONENT_REGISTRY.size)
    expect(ids).toContain('hero-banner')
    expect(ids).toContain('site-footer')
  })

  it('getByCategory returns components for a valid category', () => {
    const forms = COMPONENT_REGISTRY.getByCategory('forms')
    expect(forms.length).toBeGreaterThan(0)
    for (const comp of forms) {
      expect(comp.category).toBe('forms')
    }
  })

  it('getByCategory returns empty array for unknown category', () => {
    expect(COMPONENT_REGISTRY.getByCategory('unknown')).toEqual([])
  })

  it('getByTag returns matching components', () => {
    const heroComponents = COMPONENT_REGISTRY.getByTag('hero')
    expect(heroComponents.length).toBeGreaterThan(0)
    for (const comp of heroComponents) {
      expect(comp.tags).toContain('hero')
    }
  })

  it('getInteractive returns only interactive components', () => {
    const interactive = COMPONENT_REGISTRY.getInteractive()
    expect(interactive.length).toBeGreaterThan(0)
    for (const comp of interactive) {
      expect(comp.interactive).toBe(true)
    }
  })

  it('getKeyboardNavigable returns components requiring keyboard nav', () => {
    const kbnav = COMPONENT_REGISTRY.getKeyboardNavigable()
    expect(kbnav.length).toBeGreaterThan(0)
    for (const comp of kbnav) {
      expect(comp.a11y.keyboard_navigable).toBe(true)
    }
  })

  it('validateComponentIds returns empty for valid IDs', () => {
    const missing = COMPONENT_REGISTRY.validateComponentIds([
      'hero-banner',
      'site-header',
      'contact-form',
    ])
    expect(missing).toEqual([])
  })

  it('validateComponentIds returns missing IDs', () => {
    const missing = COMPONENT_REGISTRY.validateComponentIds([
      'hero-banner',
      'nonexistent',
      'also-fake',
    ])
    expect(missing).toEqual(['nonexistent', 'also-fake'])
  })

  it('throws on duplicate component IDs in constructor', () => {
    const dupeData = {
      version: '1.0.0',
      categories: [{ id: 'test', label: 'Test' }],
      components: [
        { id: 'dupe', label: 'A', category: 'test', a11y: { role: 'none', keyboard_navigable: false, min_contrast: 'AA' as const } },
        { id: 'dupe', label: 'B', category: 'test', a11y: { role: 'none', keyboard_navigable: false, min_contrast: 'AA' as const } },
      ],
    }
    expect(() => new ComponentRegistry(dupeData)).toThrow('Duplicate component ID: dupe')
  })
})

// ─── A11y Rules Tests ────────────────────────────────────────

describe('A11y rules', () => {
  it('every component has a11y rules', () => {
    for (const comp of COMPONENT_REGISTRY.components) {
      expect(comp.a11y).toBeDefined()
      expect(comp.a11y.role).toBeTruthy()
      expect(comp.a11y.min_contrast).toBeTruthy()
    }
  })

  it('every component has min_contrast of AA or AAA', () => {
    for (const comp of COMPONENT_REGISTRY.components) {
      expect(['AA', 'AAA']).toContain(comp.a11y.min_contrast)
    }
  })

  it('all interactive components are keyboard navigable', () => {
    const interactive = COMPONENT_REGISTRY.components.filter(
      (c) => c.interactive === true,
    )
    for (const comp of interactive) {
      expect(comp.a11y.keyboard_navigable).toBe(true)
    }
  })

  it('all interactive components have focus_visible set', () => {
    const interactive = COMPONENT_REGISTRY.components.filter(
      (c) => c.interactive === true,
    )
    for (const comp of interactive) {
      expect(comp.a11y.focus_visible).toBe(true)
    }
  })

  it('all components respect reduced motion', () => {
    for (const comp of COMPONENT_REGISTRY.components) {
      // Default is true per schema, but we verify explicitly where set
      expect(comp.a11y.reduced_motion_safe).not.toBe(false)
    }
  })

  it('form components require labels', () => {
    const forms = COMPONENT_REGISTRY.getByCategory('forms')
    for (const comp of forms) {
      expect(comp.a11y.requires_label).toBe(true)
    }
  })

  it('navigation components require labels', () => {
    const nav = COMPONENT_REGISTRY.get('nav-bar')
    expect(nav?.a11y.requires_label).toBe(true)
  })
})

// ─── Per-Component Structural Tests ──────────────────────────

describe.each(COMPONENT_REGISTRY.components as unknown as ComponentDef[])(
  'Component: $id',
  (comp) => {
    it('has a valid ID format', () => {
      expect(comp.id).toMatch(/^[a-z][a-z0-9-]+$/)
    })

    it('has a label of at least 2 characters', () => {
      expect(comp.label.length).toBeGreaterThanOrEqual(2)
    })

    it('has a category that exists in the categories list', () => {
      const categoryIds = COMPONENT_REGISTRY.categories.map((c) => c.id)
      expect(categoryIds).toContain(comp.category)
    })

    it('has a11y.role defined', () => {
      expect(comp.a11y.role).toBeTruthy()
    })

    it('has a11y.min_contrast defined', () => {
      expect(['AA', 'AAA']).toContain(comp.a11y.min_contrast)
    })

    it('responsive defaults to true', () => {
      // All current components are responsive
      expect(comp.responsive).not.toBe(false)
    })
  },
)

// ─── Blueprint Cross-Reference Tests ─────────────────────────

describe('Blueprint component cross-reference', () => {
  it.skipIf(blueprints.length === 0)(
    'all blueprint required_components exist in registry',
    () => {
      for (const bp of blueprints) {
        const missing = COMPONENT_REGISTRY.validateComponentIds(
          bp.required_components,
        )
        expect(
          missing,
          `Blueprint "${bp.id}" references missing components: ${missing.join(', ')}`,
        ).toEqual([])
      }
    },
  )

  it.skipIf(blueprints.length === 0)(
    'all blueprint optional_components exist in registry',
    () => {
      for (const bp of blueprints) {
        const missing = COMPONENT_REGISTRY.validateComponentIds(
          bp.optional_components,
        )
        expect(
          missing,
          `Blueprint "${bp.id}" references missing optional components: ${missing.join(', ')}`,
        ).toEqual([])
      }
    },
  )

  it.skipIf(blueprints.length === 0)(
    'all blueprint section components exist in registry',
    () => {
      for (const bp of blueprints) {
        const sectionComponents = bp.required_sections.map((s) => s.component)
        const missing =
          COMPONENT_REGISTRY.validateComponentIds(sectionComponents)
        expect(
          missing,
          `Blueprint "${bp.id}" sections reference missing components: ${missing.join(', ')}`,
        ).toEqual([])
      }
    },
  )
})

// ─── Structural Invariants ───────────────────────────────────

describe('Registry invariants', () => {
  it('site-header, site-footer, nav-bar all exist', () => {
    expect(COMPONENT_REGISTRY.has('site-header')).toBe(true)
    expect(COMPONENT_REGISTRY.has('site-footer')).toBe(true)
    expect(COMPONENT_REGISTRY.has('nav-bar')).toBe(true)
  })

  it('hero-banner and cta-block exist', () => {
    expect(COMPONENT_REGISTRY.has('hero-banner')).toBe(true)
    expect(COMPONENT_REGISTRY.has('cta-block')).toBe(true)
  })

  it('contact-form exists', () => {
    expect(COMPONENT_REGISTRY.has('contact-form')).toBe(true)
  })

  it('every category has at least one component', () => {
    for (const cat of COMPONENT_REGISTRY.categories) {
      const comps = COMPONENT_REGISTRY.getByCategory(cat.id)
      expect(
        comps.length,
        `Category "${cat.id}" has no components`,
      ).toBeGreaterThan(0)
    }
  })

  it('total component count is at least 30 (best-in-class target)', () => {
    expect(COMPONENT_REGISTRY.size).toBeGreaterThanOrEqual(30)
  })
})
