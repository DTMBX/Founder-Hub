/**
 * content-registry.ts — Typed Content Registry
 *
 * Central manifest of all editable content modules. Each entry declares:
 *  - Storage key (maps to KV / localStorage / static JSON)
 *  - Content kind (singleton vs collection)
 *  - Zod schema for runtime validation
 *  - Field definitions for reusable rendering
 *  - Default value factory
 *  - Preview target (which site section renders this data)
 *
 * This registry is the single source of truth for what content exists,
 * how it's shaped, and how editors should render it.
 */

import { z } from 'zod'
import {
  AboutContentSchema,
  ProfileSchema,
  InvestorContentSchema,
  ProjectsArraySchema,
  ProjectSchema,
  OfferingsArraySchema,
  OfferingSchema,
  LinksArraySchema,
  LinkSchema,
  SectionsArraySchema,
  SectionSchema,
} from '@/lib/content-schema'

// ─── Field Kinds ────────────────────────────────────────────────────────────

/**
 * Grounded field kinds — only types that actually exist in the current codebase.
 * Do not add speculative kinds.
 */
export type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'url'
  | 'image'
  | 'tags'
  | 'date'

/** A single selectable option for 'select' fields */
export interface SelectOption {
  value: string
  label: string
}

// ─── Field Definition ───────────────────────────────────────────────────────

/**
 * Describes one editable field within a content module.
 * Used by FieldRenderer to produce consistent UI without per-module JSX.
 */
export interface FieldDef {
  /** Dot-path key into the content object (e.g. 'mission', 'settings.calendlyUrl') */
  key: string
  /** Human-readable label shown above the field */
  label: string
  /** Kind of editor control to render */
  kind: FieldKind
  /** Help text shown below the label */
  description?: string
  /** Placeholder text for inputs */
  placeholder?: string
  /** Whether this field is required (used for UI indicators) */
  required?: boolean
  /** For 'select' fields: available options */
  options?: SelectOption[]
  /** For 'textarea' fields: number of rows */
  rows?: number
  /** For 'number' fields: min/max/step */
  min?: number
  max?: number
  step?: number
  /** Whether the field should span the full width (default: true) */
  fullWidth?: boolean
  /** Group name — fields with the same group render together in a card */
  group?: string
}

// ─── Content Kinds ──────────────────────────────────────────────────────────

/**
 * singleton — One object (About, Profile, Investor settings)
 * collection — Array of items (Projects, Offerings, Links, Sections)
 */
export type ContentKind = 'singleton' | 'collection'

// ─── Registry Entry ─────────────────────────────────────────────────────────

export interface ContentRegistryEntry<T = unknown> {
  /** Unique identifier matching the admin nav tab id */
  id: string
  /** Human-readable label */
  label: string
  /** KV storage key (maps to localStorage and static JSON) */
  storageKey: string
  /** Whether this is a singleton object or a collection array */
  contentKind: ContentKind
  /** Zod schema for the top-level value (object for singleton, array for collection) */
  schema: z.ZodType<T>
  /** For collections: Zod schema for a single item */
  itemSchema?: z.ZodType
  /** Field definitions for the editor */
  fields: FieldDef[]
  /** Default value factory */
  defaultValue: () => T
  /** Preview section anchor (e.g. '#about', '#projects') */
  previewTarget?: string
}

// ─── Default Values ─────────────────────────────────────────────────────────

const DEFAULT_ABOUT = {
  mission: '',
  currentFocus: '',
  values: [] as string[],
  updates: [] as Array<{ date: string; title: string; content: string }>,
}

const DEFAULT_PROFILE = {
  ownerName: '',
  title: '',
  bio: '',
  catchAllEmail: '',
  professionalEmails: [] as Array<{ label: string; email: string; icon: string; desc: string }>,
  domain: '',
}

const DEFAULT_INVESTOR = {
  pitchVideoUrl: '',
  pitchVideoThumbnail: '',
  metrics: [] as Array<{ label: string; value: string }>,
  milestones: [] as Array<{ title: string; date?: string; status?: string }>,
  documents: [] as Array<{ title: string; url?: string }>,
  faqs: [] as Array<{ question: string; answer: string }>,
  investmentTiers: [] as Array<{ name: string; amount?: number; description?: string }>,
  raisingAmount: 0,
  raisingCurrency: 'USD',
  useOfFunds: '',
  expectedROI: '',
  calendlyUrl: '',
  meetingCTA: '',
  investorEmail: '',
  investorPhone: '',
}

// ─── Field Definitions ──────────────────────────────────────────────────────

const aboutFields: FieldDef[] = [
  {
    key: 'mission',
    label: 'Mission Statement',
    kind: 'textarea',
    description: 'Your core mission — displayed prominently on the About section.',
    placeholder: 'Your mission statement...',
    rows: 3,
    group: 'Core',
  },
  {
    key: 'currentFocus',
    label: 'Current Focus',
    kind: 'textarea',
    description: 'What you\'re actively working on right now.',
    placeholder: 'What you\'re focused on...',
    rows: 3,
    group: 'Core',
  },
  {
    key: 'values',
    label: 'Core Values',
    kind: 'tags',
    description: 'Displayed as badges — add, remove, or reorder.',
    group: 'Values',
  },
]

const profileFields: FieldDef[] = [
  {
    key: 'ownerName',
    label: 'Owner Name',
    kind: 'text',
    description: 'Your full legal or professional name.',
    placeholder: 'Full name',
    required: true,
    group: 'Identity',
  },
  {
    key: 'title',
    label: 'Title',
    kind: 'text',
    description: 'Professional title shown on your site.',
    placeholder: 'e.g. Founder & CEO',
    group: 'Identity',
  },
  {
    key: 'bio',
    label: 'Bio',
    kind: 'textarea',
    description: 'Short biography displayed on your profile.',
    placeholder: 'Tell your story...',
    rows: 4,
    group: 'Identity',
  },
  {
    key: 'catchAllEmail',
    label: 'Primary Email',
    kind: 'text',
    description: 'Catch-all email address for general inquiries.',
    placeholder: 'you@domain.com',
    group: 'Contact',
  },
  {
    key: 'domain',
    label: 'Domain',
    kind: 'text',
    description: 'Your primary domain name.',
    placeholder: 'example.com',
    group: 'Contact',
  },
]

const investorSettingsFields: FieldDef[] = [
  {
    key: 'pitchVideoUrl',
    label: 'Pitch Video URL',
    kind: 'url',
    description: 'Link to your investor pitch video.',
    placeholder: 'https://youtube.com/...',
    group: 'Media',
  },
  {
    key: 'pitchVideoThumbnail',
    label: 'Pitch Video Thumbnail',
    kind: 'image',
    description: 'Thumbnail image for the pitch video.',
    placeholder: 'https://...',
    group: 'Media',
  },
  {
    key: 'raisingAmount',
    label: 'Raising Amount',
    kind: 'number',
    description: 'Total fundraising target.',
    min: 0,
    step: 1000,
    group: 'Fundraise',
  },
  {
    key: 'raisingCurrency',
    label: 'Currency',
    kind: 'select',
    options: [
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
    ],
    group: 'Fundraise',
  },
  {
    key: 'useOfFunds',
    label: 'Use of Funds',
    kind: 'textarea',
    description: 'How the investment will be deployed.',
    rows: 3,
    group: 'Fundraise',
  },
  {
    key: 'expectedROI',
    label: 'Expected ROI',
    kind: 'text',
    description: 'Projected return for investors.',
    group: 'Fundraise',
  },
  {
    key: 'calendlyUrl',
    label: 'Calendly URL',
    kind: 'url',
    description: 'Meeting scheduling link for investors.',
    placeholder: 'https://calendly.com/...',
    group: 'Contact',
  },
  {
    key: 'meetingCTA',
    label: 'Meeting CTA',
    kind: 'text',
    description: 'Call-to-action text for the meeting booking button.',
    placeholder: 'Book a Meeting',
    group: 'Contact',
  },
  {
    key: 'investorEmail',
    label: 'Investor Email',
    kind: 'text',
    description: 'Dedicated email for investor relations.',
    placeholder: 'invest@domain.com',
    group: 'Contact',
  },
  {
    key: 'investorPhone',
    label: 'Investor Phone',
    kind: 'text',
    description: 'Phone number for investor inquiries.',
    placeholder: '+1 (555) 000-0000',
    group: 'Contact',
  },
]

const projectItemFields: FieldDef[] = [
  {
    key: 'title',
    label: 'Title',
    kind: 'text',
    required: true,
    placeholder: 'Project name',
    group: 'Details',
  },
  {
    key: 'summary',
    label: 'Summary',
    kind: 'text',
    description: 'One-line summary shown in cards.',
    placeholder: 'Brief description...',
    group: 'Details',
  },
  {
    key: 'description',
    label: 'Description',
    kind: 'textarea',
    description: 'Full project description.',
    rows: 4,
    group: 'Details',
  },
  {
    key: 'status',
    label: 'Status',
    kind: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'archived', label: 'Archived' },
    ],
    group: 'Status',
  },
  {
    key: 'featured',
    label: 'Featured',
    kind: 'boolean',
    description: 'Show this project prominently.',
    group: 'Status',
  },
  {
    key: 'enabled',
    label: 'Enabled',
    kind: 'boolean',
    description: 'Whether this project is visible on the site.',
    group: 'Status',
  },
  {
    key: 'tags',
    label: 'Tags',
    kind: 'tags',
    description: 'Categorization tags.',
    group: 'Metadata',
  },
  {
    key: 'techStack',
    label: 'Tech Stack',
    kind: 'tags',
    description: 'Technologies used in this project.',
    group: 'Metadata',
  },
]

// ─── Registry ───────────────────────────────────────────────────────────────

export const contentRegistry: ContentRegistryEntry[] = [
  {
    id: 'about',
    label: 'About',
    storageKey: 'founder-hub-about',
    contentKind: 'singleton',
    schema: AboutContentSchema,
    fields: aboutFields,
    defaultValue: () => ({ ...DEFAULT_ABOUT }),
    previewTarget: '#about',
  },
  {
    id: 'profile',
    label: 'Profile',
    storageKey: 'founder-hub-profile',
    contentKind: 'singleton',
    schema: ProfileSchema,
    fields: profileFields,
    defaultValue: () => ({ ...DEFAULT_PROFILE }),
    previewTarget: '#hero',
  },
  {
    id: 'investor-settings',
    label: 'Investor Settings',
    storageKey: 'founder-hub-investor',
    contentKind: 'singleton',
    schema: InvestorContentSchema,
    fields: investorSettingsFields,
    defaultValue: () => ({ ...DEFAULT_INVESTOR }),
    previewTarget: '#investor',
  },
  {
    id: 'projects',
    label: 'Projects',
    storageKey: 'founder-hub-projects',
    contentKind: 'collection',
    schema: ProjectsArraySchema,
    itemSchema: ProjectSchema,
    fields: projectItemFields,
    defaultValue: () => [],
    previewTarget: '#projects',
  },
  {
    id: 'offerings',
    label: 'Offerings',
    storageKey: 'founder-hub-offerings',
    contentKind: 'collection',
    schema: OfferingsArraySchema,
    itemSchema: OfferingSchema,
    fields: [], // Offerings has complex nested tiers — keeps custom editor for now
    defaultValue: () => [],
    previewTarget: '#offerings',
  },
  {
    id: 'contact-links',
    label: 'Contact Links',
    storageKey: 'founder-hub-contact-links',
    contentKind: 'collection',
    schema: LinksArraySchema,
    itemSchema: LinkSchema,
    fields: [
      { key: 'label', label: 'Label', kind: 'text', required: true, placeholder: 'Link name' },
      { key: 'url', label: 'URL', kind: 'url', required: true, placeholder: 'https://...' },
      { key: 'icon', label: 'Icon', kind: 'select', options: [
        { value: 'email', label: 'Email' },
        { value: 'github', label: 'GitHub' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'twitter', label: 'Twitter' },
        { value: 'calendar', label: 'Calendar' },
        { value: 'website', label: 'Website' },
        { value: 'press', label: 'Press' },
        { value: 'link', label: 'Generic Link' },
      ]},
      { key: 'category', label: 'Category', kind: 'select', options: [
        { value: 'contact', label: 'Contact' },
        { value: 'social', label: 'Social' },
      ]},
    ],
    defaultValue: () => [],
    previewTarget: '#contact',
  },
  {
    id: 'proof-links',
    label: 'Proof Links',
    storageKey: 'founder-hub-proof-links',
    contentKind: 'collection',
    schema: LinksArraySchema,
    itemSchema: LinkSchema,
    fields: [
      { key: 'label', label: 'Label', kind: 'text', required: true, placeholder: 'Link name' },
      { key: 'url', label: 'URL', kind: 'url', required: true, placeholder: 'https://...' },
      { key: 'icon', label: 'Icon', kind: 'select', options: [
        { value: 'link', label: 'Link' },
        { value: 'press', label: 'Press' },
        { value: 'website', label: 'Website' },
      ]},
    ],
    defaultValue: () => [],
    previewTarget: '#proof',
  },
  {
    id: 'sections',
    label: 'Sections',
    storageKey: 'founder-hub-sections',
    contentKind: 'collection',
    schema: SectionsArraySchema,
    itemSchema: SectionSchema,
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true },
      { key: 'content', label: 'Content', kind: 'textarea', rows: 4 },
      { key: 'enabled', label: 'Enabled', kind: 'boolean' },
      { key: 'investorRelevant', label: 'Investor Relevant', kind: 'boolean' },
    ],
    defaultValue: () => [],
  },
]

// ─── Lookup Helpers ─────────────────────────────────────────────────────────

/** Find a registry entry by module id */
export function getContentEntry(id: string): ContentRegistryEntry | undefined {
  return contentRegistry.find(e => e.id === id)
}

/** Find a registry entry by KV storage key */
export function getContentEntryByKey(storageKey: string): ContentRegistryEntry | undefined {
  return contentRegistry.find(e => e.storageKey === storageKey)
}

/** Get all singleton entries */
export function getSingletonEntries(): ContentRegistryEntry[] {
  return contentRegistry.filter(e => e.contentKind === 'singleton')
}

/** Get all collection entries */
export function getCollectionEntries(): ContentRegistryEntry[] {
  return contentRegistry.filter(e => e.contentKind === 'collection')
}

/** Group field definitions by their group property */
export function groupFields(fields: FieldDef[]): Map<string, FieldDef[]> {
  const map = new Map<string, FieldDef[]>()
  for (const field of fields) {
    const group = field.group || 'General'
    const existing = map.get(group) || []
    existing.push(field)
    map.set(group, existing)
  }
  return map
}
