/**
 * Landing Composition Contract
 * 
 * Defines the allowed sections and configuration for landing pages
 * below the hero. The hero remains hand-authored and is not part of this config.
 */

// ─── Allowed Section Types ──────────────────────────────────────

export const ALLOWED_SECTION_TYPES = [
  'about',
  'projects', 
  'offerings',
  'investor',
  'court',
  'proof',
  'contact',
  'how-it-works',
  'faq',
  'final-cta'
] as const

export type LandingSectionType = typeof ALLOWED_SECTION_TYPES[number]

// ─── Section Configuration ──────────────────────────────────────

export interface LandingSectionConfig {
  /** Unique section identifier */
  id: string
  /** Section type - must be one of the allowed types */
  type: LandingSectionType
  /** Whether section is enabled */
  enabled: boolean
  /** Display order (lower = earlier) */
  order: number
  /** Whether section is relevant for investor pathway */
  investorRelevant?: boolean
  /** Whether section is relevant for legal/court pathway */
  legalRelevant?: boolean
  /** Whether section is relevant for marketplace/services pathway */
  marketplaceRelevant?: boolean
  /** Custom props to pass to the section component */
  props?: Record<string, unknown>
}

// ─── Landing Page Configuration ─────────────────────────────────

export interface LandingConfig {
  /** Ordered list of sections below the hero */
  sections: LandingSectionConfig[]
  /** Active pathway filter */
  pathway?: 'all' | 'investors' | 'legal' | 'about' | 'marketplace'
  /** Whether proof section has content */
  hasProofContent?: boolean
}

// ─── Default Landing Configuration ──────────────────────────────

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  pathway: 'all',
  hasProofContent: false,
  sections: [
    { 
      id: 'about', 
      type: 'about', 
      enabled: true, 
      order: 1,
      investorRelevant: false,
      legalRelevant: false,
      marketplaceRelevant: false
    },
    { 
      id: 'projects', 
      type: 'projects', 
      enabled: true, 
      order: 2,
      investorRelevant: true,
      legalRelevant: false,
      marketplaceRelevant: false
    },
    { 
      id: 'investor', 
      type: 'investor', 
      enabled: true, 
      order: 3,
      investorRelevant: true,
      legalRelevant: false,
      marketplaceRelevant: false
    },
    { 
      id: 'offerings', 
      type: 'offerings', 
      enabled: true, 
      order: 4,
      investorRelevant: true,
      legalRelevant: false,
      marketplaceRelevant: true
    },
    { 
      id: 'court', 
      type: 'court', 
      enabled: true, 
      order: 5,
      investorRelevant: false,
      legalRelevant: true,
      marketplaceRelevant: false
    },
    { 
      id: 'proof', 
      type: 'proof', 
      enabled: true, 
      order: 6,
      investorRelevant: true,
      legalRelevant: false,
      marketplaceRelevant: false
    },
    { 
      id: 'contact', 
      type: 'contact', 
      enabled: true, 
      order: 7,
      investorRelevant: true,
      legalRelevant: true,
      marketplaceRelevant: true
    }
  ]
}

// ─── Section Filtering Logic ────────────────────────────────────

export function filterSectionsByPathway(
  config: LandingConfig
): LandingSectionConfig[] {
  const { sections, pathway, hasProofContent } = config
  
  // Sort by order first
  let filtered = [...sections]
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)
  
  // Hide proof section if no content
  if (!hasProofContent) {
    filtered = filtered.filter(s => s.type !== 'proof')
  }
  
  // Apply pathway filter
  if (pathway && pathway !== 'all') {
    filtered = filtered.filter(s => {
      switch (pathway) {
        case 'investors':
          return s.type === 'about' || s.investorRelevant
        case 'legal':
          return s.type === 'about' || s.legalRelevant
        case 'about':
          return s.type === 'about' || s.type === 'contact'
        case 'marketplace':
          return s.type === 'about' || s.marketplaceRelevant
        default:
          return true
      }
    })
  }
  
  return filtered
}

// ─── Type Guards ────────────────────────────────────────────────

export function isValidSectionType(type: string): type is LandingSectionType {
  return ALLOWED_SECTION_TYPES.includes(type as LandingSectionType)
}
