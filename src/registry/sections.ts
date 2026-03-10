/**
 * registry/sections.ts — Section type registry for the visual builder.
 *
 * Maps every allowed section type to its metadata:
 *   - label & icon (for the builder UI)
 *   - kvKey (which useKV key feeds this section's data)
 *   - Zod schema for the section's content data
 *   - default content value (for "add section" flows)
 *   - editable fields exposed in the properties panel
 *
 * The component itself is NOT imported here — LandingSections.tsx
 * already handles lazy-loading. This registry is purely for the
 * builder/editor layer.
 */

import type { LandingSectionType } from '@/components/landing/landing.config'
import type { SectionType } from '@/lib/types'
import type { z } from 'zod'
import {
  AboutContentSchema,
  ProjectsArraySchema,
  OfferingsArraySchema,
  CasesArraySchema,
  LinksArraySchema,
  InvestorContentSchema,
} from '@/lib/content-schema'

// ─── Editable Field Descriptor ──────────────────────────────────────────────

export interface EditableField {
  /** JSON path within the content object (e.g. 'mission', 'updates[0].title') */
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'image' | 'color' | 'url' | 'tags'
  options?: string[] // for 'select' type
  placeholder?: string
  /** Short contextual hint shown below the control */
  description?: string
}

// ─── Section Registry Entry ─────────────────────────────────────────────────

export interface SectionRegistryEntry {
  /** Section type identifier (includes 'hero' which is excluded from LandingSectionType) */
  type: SectionType | LandingSectionType
  /** Human-readable label */
  label: string
  /** Phosphor icon name (for display — not imported here to avoid bundle bloat) */
  iconName: string
  /** The KV key that stores this section's content — null if section has no KV data */
  kvKey: string | null
  /** Zod schema for the content data. Used for validation before writes. */
  contentSchema: z.ZodType | null
  /** Default content when adding a new section */
  defaultContent: unknown
  /** Fields exposed in the visual builder properties panel */
  editableFields: EditableField[]
  /** Whether this section supports the investor pathway */
  supportsInvestorMode: boolean
  /** Whether this section can be added multiple times */
  allowMultiple: boolean
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const SECTION_REGISTRY: Record<string, SectionRegistryEntry> = {
  hero: {
    type: 'hero',
    label: 'Hero',
    iconName: 'Star',
    kvKey: null, // Hero is hand-authored, no separate KV data file
    contentSchema: null,
    defaultContent: null,
    editableFields: [],
    supportsInvestorMode: true,
    allowMultiple: false,
  },

  about: {
    type: 'about',
    label: 'About',
    iconName: 'UserCircle',
    kvKey: 'founder-hub-about',
    contentSchema: AboutContentSchema,
    defaultContent: {
      mission: '',
      currentFocus: '',
      values: [],
      updates: [],
    },
    editableFields: [
      { key: 'mission', label: 'Mission Statement', type: 'textarea', placeholder: 'Your mission...' },
      { key: 'currentFocus', label: 'Current Focus', type: 'textarea', placeholder: 'What you are working on...' },
      { key: 'values', label: 'Core Values', type: 'tags', placeholder: 'Add a value...' },
    ],
    supportsInvestorMode: false,
    allowMultiple: false,
  },

  governance: {
    type: 'governance',
    label: 'Governance Narrative',
    iconName: 'Shield',
    kvKey: null, // Reads from about data
    contentSchema: null,
    defaultContent: null,
    editableFields: [],
    supportsInvestorMode: true,
    allowMultiple: false,
  },

  projects: {
    type: 'projects',
    label: 'Projects',
    iconName: 'FolderOpen',
    kvKey: 'founder-hub-projects',
    contentSchema: ProjectsArraySchema,
    defaultContent: [],
    editableFields: [],
    supportsInvestorMode: true,
    allowMultiple: false,
  },

  offerings: {
    type: 'offerings',
    label: 'Offerings & Services',
    iconName: 'ShoppingBag',
    kvKey: 'founder-hub-offerings',
    contentSchema: OfferingsArraySchema,
    defaultContent: [],
    editableFields: [],
    supportsInvestorMode: true,
    allowMultiple: false,
  },

  services: {
    type: 'services',
    label: 'Services',
    iconName: 'Wrench',
    kvKey: 'founder-hub-offerings', // Same data as offerings
    contentSchema: OfferingsArraySchema,
    defaultContent: [],
    editableFields: [],
    supportsInvestorMode: true,
    allowMultiple: false,
  },

  investor: {
    type: 'investor',
    label: 'Investor Brief',
    iconName: 'TrendUp',
    kvKey: 'founder-hub-investor',
    contentSchema: InvestorContentSchema,
    defaultContent: {
      pitchVideoUrl: '',
      pitchVideoThumbnail: '',
      metrics: [],
      milestones: [],
      documents: [],
      faqs: [],
      investmentTiers: [],
      raisingAmount: 0,
      raisingCurrency: 'USD',
      useOfFunds: '',
      expectedROI: '',
      calendlyUrl: '',
      meetingCTA: 'Schedule a Call',
      investorEmail: '',
      investorPhone: '',
    },
    editableFields: [
      { key: 'raisingAmount', label: 'Raising Amount', type: 'number', placeholder: '0', description: 'Amount in cents (e.g. 5000000 = $50,000)' },
      { key: 'raisingCurrency', label: 'Currency', type: 'select', options: ['USD', 'EUR', 'GBP'] },
      { key: 'useOfFunds', label: 'Use of Funds', type: 'textarea', placeholder: 'How funds will be used...' },
      { key: 'expectedROI', label: 'Expected ROI', type: 'text', placeholder: 'Expected return...' },
      { key: 'meetingCTA', label: 'Meeting CTA', type: 'text', placeholder: 'Schedule a Call' },
      { key: 'investorEmail', label: 'Investor Email', type: 'text', placeholder: 'invest@example.com' },
      { key: 'investorPhone', label: 'Investor Phone', type: 'text', placeholder: '+1 (555) 000-0000' },
      { key: 'calendlyUrl', label: 'Calendly URL', type: 'url', placeholder: 'https://calendly.com/...' },
      { key: 'pitchVideoUrl', label: 'Pitch Video URL', type: 'url', placeholder: 'https://youtube.com/...', description: 'YouTube, Vimeo, or direct video URL' },
      { key: 'pitchVideoThumbnail', label: 'Video Thumbnail', type: 'image', placeholder: 'https://...', description: 'Poster image shown before video plays' },
    ],
    supportsInvestorMode: true,
    allowMultiple: false,
  },

  court: {
    type: 'court',
    label: 'Court & Accountability',
    iconName: 'Scales',
    kvKey: 'founder-hub-court-cases',
    contentSchema: CasesArraySchema,
    defaultContent: [],
    editableFields: [],
    supportsInvestorMode: false,
    allowMultiple: false,
  },

  proof: {
    type: 'proof',
    label: 'Press & Proof',
    iconName: 'Newspaper',
    kvKey: 'founder-hub-proof-links',
    contentSchema: LinksArraySchema,
    defaultContent: [],
    editableFields: [],
    supportsInvestorMode: true,
    allowMultiple: false,
  },

  contact: {
    type: 'contact',
    label: 'Contact',
    iconName: 'PaperPlaneRight',
    kvKey: 'founder-hub-contact-links',
    contentSchema: LinksArraySchema,
    defaultContent: [],
    editableFields: [],
    supportsInvestorMode: true,
    allowMultiple: false,
  },

  'how-it-works': {
    type: 'how-it-works',
    label: 'How It Works',
    iconName: 'ListNumbers',
    kvKey: null,
    contentSchema: null,
    defaultContent: null,
    editableFields: [],
    supportsInvestorMode: false,
    allowMultiple: false,
  },

  faq: {
    type: 'faq',
    label: 'FAQ',
    iconName: 'Question',
    kvKey: null,
    contentSchema: null,
    defaultContent: null,
    editableFields: [],
    supportsInvestorMode: false,
    allowMultiple: false,
  },

  'final-cta': {
    type: 'final-cta',
    label: 'Call to Action',
    iconName: 'Lightning',
    kvKey: null,
    contentSchema: null,
    defaultContent: null,
    editableFields: [],
    supportsInvestorMode: false,
    allowMultiple: false,
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get registry entry by type. Returns undefined for unknown types. */
export function getSectionInfo(type: string): SectionRegistryEntry | undefined {
  return SECTION_REGISTRY[type]
}

/** Get all registered section types that can be added. */
export function getAddableSections(): SectionRegistryEntry[] {
  return Object.values(SECTION_REGISTRY).filter(
    entry => entry.type as string !== 'hero' // Hero can't be added/removed
  )
}

/** Get the default Section config object for a new section of a given type. */
export function createDefaultSection(type: LandingSectionType, order: number) {
  const info = SECTION_REGISTRY[type]
  return {
    id: type,
    type,
    title: info?.label || type,
    content: '',
    order,
    enabled: true,
    investorRelevant: info?.supportsInvestorMode ?? false,
  }
}

/** Re-export validation schemas for convenience */
export { SectionSchema, SectionsArraySchema } from '@/lib/content-schema'
