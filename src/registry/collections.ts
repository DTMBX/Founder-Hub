/**
 * registry/collections.ts — Collection metadata for array-of-object editing.
 *
 * Maps KV keys to explicit typed metadata describing how to edit
 * each collection: item fields, identity, ordering, add/remove,
 * and default item factories.
 *
 * Only covers grounded collections with clearly defined schemas.
 * Complex nested collections (court cases, investor sub-arrays)
 * are intentionally deferred.
 */

import type { z } from 'zod'
import type { EditableField } from '@/registry/sections'
import {
  LinksArraySchema,
  ProjectsArraySchema,
  OfferingsArraySchema,
} from '@/lib/content-schema'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CollectionRegistryEntry {
  /** KV key for the array data */
  kvKey: string
  /** Human-readable label for the collection */
  label: string
  /** Label for individual items (e.g. 'Link', 'Project') */
  itemLabel: string
  /** Zod schema for the entire array — used for validation before persistence */
  arraySchema: z.ZodType
  /** Which field serves as item identity */
  idField: string
  /** Which field to display as item title in the list */
  titleField: string
  /** Editable fields per item */
  itemFields: EditableField[]
  /** Whether items can be reordered via drag */
  allowReorder: boolean
  /** Whether items can be added/removed */
  allowAddRemove: boolean
  /** Factory function for a new blank item */
  createDefault: () => Record<string, unknown>
}

// ─── Link Item Fields ───────────────────────────────────────────────────────

const LINK_ITEM_FIELDS: EditableField[] = [
  { key: 'label', label: 'Label', type: 'text', placeholder: 'Link label' },
  { key: 'url', label: 'URL', type: 'url', placeholder: 'https://…' },
  { key: 'category', label: 'Category', type: 'text', placeholder: 'general' },
  { key: 'icon', label: 'Icon', type: 'text', placeholder: 'Optional icon name' },
  { key: 'order', label: 'Order', type: 'number' },
]

function createDefaultLink(): Record<string, unknown> {
  return {
    id: crypto.randomUUID(),
    label: 'New Link',
    url: '',
    category: 'general',
    order: 0,
  }
}

// ─── Project Item Fields ────────────────────────────────────────────────────

const PROJECT_ITEM_FIELDS: EditableField[] = [
  { key: 'title', label: 'Title', type: 'text', placeholder: 'Project name' },
  { key: 'summary', label: 'Summary', type: 'textarea', placeholder: 'Brief summary…' },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Full description…' },
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'paused', 'archived'] },
  { key: 'enabled', label: 'Enabled', type: 'boolean' },
  { key: 'featured', label: 'Featured', type: 'boolean' },
  { key: 'tags', label: 'Tags', type: 'tags', placeholder: 'Add tag…' },
  { key: 'techStack', label: 'Tech Stack', type: 'tags', placeholder: 'Add technology…' },
  { key: 'order', label: 'Order', type: 'number' },
]

function createDefaultProject(): Record<string, unknown> {
  return {
    id: crypto.randomUUID(),
    title: 'New Project',
    summary: '',
    description: '',
    tags: [],
    techStack: [],
    links: [],
    order: 0,
    enabled: true,
    featured: false,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// ─── Offering Item Fields ───────────────────────────────────────────────────

const OFFERING_ITEM_FIELDS: EditableField[] = [
  { key: 'title', label: 'Title', type: 'text', placeholder: 'Offering name' },
  { key: 'slug', label: 'Slug', type: 'text', placeholder: 'url-slug' },
  { key: 'summary', label: 'Summary', type: 'textarea', placeholder: 'Brief summary…' },
  { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Full description…' },
  { key: 'category', label: 'Category', type: 'select', options: ['digital', 'service', 'whitelabel', 'subscription', 'barter'] },
  { key: 'pricingType', label: 'Pricing Type', type: 'select', options: ['free', 'paid', 'donation', 'contact', 'trade'] },
  { key: 'visibility', label: 'Visibility', type: 'select', options: ['public', 'unlisted', 'private'] },
  { key: 'featured', label: 'Featured', type: 'boolean' },
  { key: 'tags', label: 'Tags', type: 'tags', placeholder: 'Add tag…' },
  { key: 'turnaround', label: 'Turnaround', type: 'text', placeholder: 'e.g. 2–4 weeks' },
  { key: 'contactCTA', label: 'Contact CTA', type: 'text', placeholder: 'Get in touch' },
  { key: 'order', label: 'Order', type: 'number' },
]

function createDefaultOffering(): Record<string, unknown> {
  return {
    id: crypto.randomUUID(),
    title: 'New Offering',
    slug: 'new-offering',
    summary: '',
    description: '',
    category: 'service',
    pricingType: 'contact',
    priceTiers: [],
    tags: [],
    featured: false,
    order: 0,
    visibility: 'public',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

// ─── Registry ───────────────────────────────────────────────────────────────

export const COLLECTION_REGISTRY: Record<string, CollectionRegistryEntry> = {
  'founder-hub-proof-links': {
    kvKey: 'founder-hub-proof-links',
    label: 'Proof & Press Links',
    itemLabel: 'Link',
    arraySchema: LinksArraySchema,
    idField: 'id',
    titleField: 'label',
    itemFields: LINK_ITEM_FIELDS,
    allowReorder: true,
    allowAddRemove: true,
    createDefault: createDefaultLink,
  },

  'founder-hub-contact-links': {
    kvKey: 'founder-hub-contact-links',
    label: 'Contact Links',
    itemLabel: 'Link',
    arraySchema: LinksArraySchema,
    idField: 'id',
    titleField: 'label',
    itemFields: LINK_ITEM_FIELDS,
    allowReorder: true,
    allowAddRemove: true,
    createDefault: createDefaultLink,
  },

  'founder-hub-projects': {
    kvKey: 'founder-hub-projects',
    label: 'Projects',
    itemLabel: 'Project',
    arraySchema: ProjectsArraySchema,
    idField: 'id',
    titleField: 'title',
    itemFields: PROJECT_ITEM_FIELDS,
    allowReorder: true,
    allowAddRemove: true,
    createDefault: createDefaultProject,
  },

  'founder-hub-offerings': {
    kvKey: 'founder-hub-offerings',
    label: 'Offerings',
    itemLabel: 'Offering',
    arraySchema: OfferingsArraySchema,
    idField: 'id',
    titleField: 'title',
    itemFields: OFFERING_ITEM_FIELDS,
    allowReorder: true,
    allowAddRemove: true,
    createDefault: createDefaultOffering,
  },
}

/** Look up collection metadata by KV key. Returns undefined if not supported. */
export function getCollectionInfo(kvKey: string): CollectionRegistryEntry | undefined {
  return COLLECTION_REGISTRY[kvKey]
}
