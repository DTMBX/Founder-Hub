/**
 * Component Registry — B21 P3
 *
 * Provides typed access to the component registry JSON.
 * Used by the site generation pipeline to resolve blueprint component references.
 *
 * Invariants:
 * - Every component ID referenced by a blueprint must exist in this registry.
 * - Every component has explicit a11y rules.
 * - The registry is immutable at runtime — read-only after load.
 */

import registryData from './registry.json'

// ─── Types ───────────────────────────────────────────────────

export interface A11yRules {
  readonly role: string
  readonly keyboard_navigable: boolean
  readonly min_contrast: 'AA' | 'AAA'
  readonly requires_label?: boolean
  readonly focus_visible?: boolean
  readonly reduced_motion_safe?: boolean
  readonly screen_reader_text?: boolean
}

export interface PropDef {
  readonly name: string
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum'
  readonly required?: boolean
  readonly default?: unknown
  readonly description?: string
  readonly enum_values?: readonly string[]
}

export interface ComponentDef {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly category: string
  readonly tags?: readonly string[]
  readonly a11y: A11yRules
  readonly props?: readonly PropDef[]
  readonly slots?: readonly string[]
  readonly variants?: readonly string[]
  readonly responsive?: boolean
  readonly interactive?: boolean
}

export interface CategoryDef {
  readonly id: string
  readonly label: string
  readonly description?: string
}

export interface RegistryData {
  readonly version: string
  readonly categories: readonly CategoryDef[]
  readonly components: readonly ComponentDef[]
}

// ─── Registry Class ──────────────────────────────────────────

/**
 * Read-only component registry.
 *
 * Provides O(1) lookup by component ID and category-based filtering.
 * Loaded once from the JSON registry file and frozen.
 */
export class ComponentRegistry {
  private readonly _data: RegistryData
  private readonly _byId: ReadonlyMap<string, ComponentDef>
  private readonly _byCategory: ReadonlyMap<string, readonly ComponentDef[]>

  constructor(data?: RegistryData) {
    this._data = Object.freeze(data ?? (registryData as unknown as RegistryData))

    // Build ID index
    const byId = new Map<string, ComponentDef>()
    for (const comp of this._data.components) {
      if (byId.has(comp.id)) {
        throw new Error(`Duplicate component ID: ${comp.id}`)
      }
      byId.set(comp.id, comp)
    }
    this._byId = byId

    // Build category index
    const byCategory = new Map<string, ComponentDef[]>()
    for (const comp of this._data.components) {
      const existing = byCategory.get(comp.category) ?? []
      existing.push(comp)
      byCategory.set(comp.category, existing)
    }
    this._byCategory = byCategory
  }

  /** Registry version. */
  get version(): string {
    return this._data.version
  }

  /** Total component count. */
  get size(): number {
    return this._data.components.length
  }

  /** All category definitions. */
  get categories(): readonly CategoryDef[] {
    return this._data.categories
  }

  /** All component definitions. */
  get components(): readonly ComponentDef[] {
    return this._data.components
  }

  /** All component IDs. */
  get ids(): readonly string[] {
    return [...this._byId.keys()]
  }

  /** Get a component by ID. Returns null if not found. */
  get(id: string): ComponentDef | null {
    return this._byId.get(id) ?? null
  }

  /** Check if a component ID exists. */
  has(id: string): boolean {
    return this._byId.has(id)
  }

  /** Get all components in a category. */
  getByCategory(categoryId: string): readonly ComponentDef[] {
    return this._byCategory.get(categoryId) ?? []
  }

  /** Get all components matching a tag. */
  getByTag(tag: string): readonly ComponentDef[] {
    return this._data.components.filter((c) => c.tags?.includes(tag))
  }

  /** Get all interactive components. */
  getInteractive(): readonly ComponentDef[] {
    return this._data.components.filter((c) => c.interactive === true)
  }

  /** Get all components requiring keyboard navigation. */
  getKeyboardNavigable(): readonly ComponentDef[] {
    return this._data.components.filter((c) => c.a11y.keyboard_navigable)
  }

  /**
   * Validate that all component IDs in a list exist in the registry.
   * Returns an array of missing IDs (empty if all valid).
   */
  validateComponentIds(ids: readonly string[]): string[] {
    return ids.filter((id) => !this._byId.has(id))
  }

  /**
   * Validate that all components referenced by blueprint sections
   * exist in the registry. Returns missing component IDs.
   */
  validateBlueprintComponents(
    requiredComponents: readonly string[],
    optionalComponents: readonly string[],
  ): { missingRequired: string[]; missingOptional: string[] } {
    return {
      missingRequired: this.validateComponentIds(requiredComponents),
      missingOptional: this.validateComponentIds(optionalComponents),
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────

/** Default registry instance loaded from the bundled JSON. */
export const COMPONENT_REGISTRY = new ComponentRegistry()
