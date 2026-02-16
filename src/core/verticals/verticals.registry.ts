/**
 * Vertical Pack Registry
 *
 * Central registry providing access to all vertical packs.
 * Maps BusinessType → VerticalPack for O(1) lookup.
 */

import type { BusinessType, VerticalPack, VerticalRegistry } from './verticals.types'
import { LAWFIRM_VERTICALS } from './verticals.lawfirm'
import { SMB_VERTICALS } from './verticals.smb'
import { AGENCY_VERTICALS } from './verticals.agency'

// ─── Build Registry ──────────────────────────────────────────

/**
 * All vertical packs combined in a single array.
 */
export const ALL_VERTICALS: VerticalPack[] = [
  ...LAWFIRM_VERTICALS,
  ...SMB_VERTICALS,
  ...AGENCY_VERTICALS,
]

/**
 * Central registry mapping BusinessType to VerticalPack.
 * Provides O(1) lookup by business type ID.
 */
export const VERTICAL_REGISTRY: VerticalRegistry = ALL_VERTICALS.reduce(
  (registry, vertical) => {
    registry[vertical.id as BusinessType] = vertical
    return registry
  },
  {} as VerticalRegistry
)

// ─── Lookup Functions ────────────────────────────────────────

/**
 * Get a vertical pack by its business type ID.
 *
 * @param businessType - The BusinessType identifier
 * @returns The VerticalPack or null if not found
 *
 * @example
 * ```ts
 * const pack = getVerticalPack('lawfirm_criminal')
 * if (pack) {
 *   console.log(pack.label) // "Criminal Defense"
 * }
 * ```
 */
export function getVerticalPack(businessType: BusinessType): VerticalPack | null {
  return VERTICAL_REGISTRY[businessType] ?? null
}

/**
 * Check if a business type exists in the registry.
 *
 * @param businessType - The BusinessType identifier to check
 * @returns true if the vertical exists, false otherwise
 */
export function hasVerticalPack(businessType: string): businessType is BusinessType {
  return businessType in VERTICAL_REGISTRY
}

/**
 * Get all vertical packs for a specific site type.
 *
 * @param siteType - The site type ('law-firm', 'small-business', 'agency')
 * @returns Array of vertical packs matching the site type
 *
 * @example
 * ```ts
 * const lawFirmVerticals = getVerticalsBySiteType('law-firm')
 * // Returns array of 8 law firm verticals
 * ```
 */
export function getVerticalsBySiteType(siteType: 'law-firm' | 'small-business' | 'agency'): VerticalPack[] {
  return ALL_VERTICALS.filter(v => v.siteType === siteType)
}

/**
 * Get the default vertical for a site type.
 * Returns the first (general) vertical for that category.
 *
 * @param siteType - The site type
 * @returns The default vertical pack or null
 */
export function getDefaultVertical(siteType: 'law-firm' | 'small-business' | 'agency'): VerticalPack | null {
  const defaults: Record<string, BusinessType> = {
    'law-firm': 'lawfirm_general',
    'small-business': 'smb_contractor',
    'agency': 'agency_general',
  }
  const businessType = defaults[siteType]
  return businessType ? getVerticalPack(businessType) : null
}

/**
 * Get all available business types.
 *
 * @returns Array of all BusinessType identifiers
 */
export function getAllBusinessTypes(): BusinessType[] {
  return Object.keys(VERTICAL_REGISTRY) as BusinessType[]
}

/**
 * Get verticals grouped by site type.
 *
 * @returns Object with site types as keys and arrays of verticals as values
 */
export function getVerticalsGroupedBySiteType(): Record<string, VerticalPack[]> {
  return {
    'law-firm': getVerticalsBySiteType('law-firm'),
    'small-business': getVerticalsBySiteType('small-business'),
    'agency': getVerticalsBySiteType('agency'),
  }
}

/**
 * Search verticals by label (case-insensitive).
 *
 * @param query - Search string to match against vertical labels
 * @returns Array of matching verticals
 */
export function searchVerticals(query: string): VerticalPack[] {
  const lowerQuery = query.toLowerCase()
  return ALL_VERTICALS.filter(
    v =>
      v.label.toLowerCase().includes(lowerQuery) ||
      v.description.toLowerCase().includes(lowerQuery)
  )
}
