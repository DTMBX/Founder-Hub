/**
 * workspace-registry.ts — Dynamic multi-workspace registry.
 *
 * Manages workspace definitions that can be:
 *  - Built-in (founder-hub, inherits existing data)
 *  - User-added via "Connect Repository" flow
 *  - Imported from GitHub or local filesystem
 *
 * Each workspace defines:
 *  - GitHub remote (owner/repo/branch)
 *  - Content key mappings (what data files to sync)
 *  - Local path (for Vite workspace API)
 *  - Storage namespace (KV prefix)
 *
 * Persisted in localStorage under 'wb:workspaces'.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContentKeyDef {
  /** KV key suffix (e.g. 'settings') */
  suffix: string
  /** Target filename (e.g. 'settings.json') */
  filename: string
  /** Human label */
  label: string
}

export interface WorkspaceRemote {
  /** GitHub owner (e.g. 'DTMBX') */
  owner: string
  /** GitHub repo name (e.g. 'Founder-Hub') */
  repo: string
  /** Branch to target (default: 'main') */
  branch: string
  /** Path within repo where data files live (e.g. 'public/data') */
  dataPath: string
}

export interface WorkspaceDef {
  /** Unique workspace ID (kebab-case) */
  id: string
  /** Human-readable name */
  name: string
  /** Description */
  description: string
  /** Storage namespace prefix (e.g. 'founder-hub') */
  namespace: string
  /** GitHub remote config (null if local-only) */
  remote: WorkspaceRemote | null
  /** Local filesystem path (for workspace API) */
  localPath: string | null
  /** Schema template ID that was used to create this workspace */
  schemaId: string
  /** Content key definitions */
  contentKeys: ContentKeyDef[]
  /** Preview URL for iframe preview */
  previewUrl: string
  /** Domain (informational) */
  domain: string
  /** When this workspace was added */
  createdAt: string
  /** Whether this workspace is active/enabled */
  enabled: boolean
  /** Built-in workspaces can't be deleted */
  builtIn: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'wb:workspaces'

// ─── Legacy Key Map ─────────────────────────────────────────────────────────
// Some keys in founder-hub don't follow the {namespace}-{suffix} pattern.
// This map preserves backward compatibility.
const LEGACY_KEYS: Record<string, string> = {
  'honor-flag-bar-settings': 'honor-flag-bar-settings',
  'honor-flag-bar-enabled': 'honor-flag-bar-enabled',
  'honor-flag-bar-animation': 'honor-flag-bar-animation',
  'honor-flag-bar-parallax': 'honor-flag-bar-parallax',
  'honor-flag-bar-rotation': 'honor-flag-bar-rotation',
  'honor-flag-bar-max-desktop': 'honor-flag-bar-max-desktop',
  'honor-flag-bar-max-mobile': 'honor-flag-bar-max-mobile',
  'honor-flag-bar-alignment': 'honor-flag-bar-alignment',
  'hero-accent-settings': 'hero-accent-settings',
  'flag-gallery-settings': 'flag-gallery-settings',
  'map-spotlight-settings': 'map-spotlight-settings',
  'asset-metadata': 'asset-metadata',
  'asset-usage-policy': 'asset-usage-policy',
  'law-firm-showcase': 'law-firm-showcase',
  'smb-template': 'smb-template',
  'agency-framework': 'agency-framework',
  'sites:index': 'sites:index',
}

// ─── Built-in Workspace: Founder-Hub ────────────────────────────────────────

const FOUNDER_HUB_KEYS: ContentKeyDef[] = [
  { suffix: 'settings', filename: 'settings.json', label: 'Site Settings' },
  { suffix: 'sections', filename: 'sections.json', label: 'Sections' },
  { suffix: 'projects', filename: 'projects.json', label: 'Projects' },
  { suffix: 'court-cases', filename: 'court-cases.json', label: 'Court Cases' },
  { suffix: 'proof-links', filename: 'links.json', label: 'Proof Links' },
  { suffix: 'contact-links', filename: 'contact-links.json', label: 'Contact Links' },
  { suffix: 'profile', filename: 'profile.json', label: 'Profile' },
  { suffix: 'about', filename: 'about.json', label: 'About' },
  { suffix: 'pdfs', filename: 'documents.json', label: 'Documents' },
  { suffix: 'document-types', filename: 'document-types.json', label: 'Document Types' },
  { suffix: 'offerings', filename: 'offerings.json', label: 'Offerings' },
  { suffix: 'investor', filename: 'investor.json', label: 'Investor' },
  { suffix: 'filing-types', filename: 'filing-types.json', label: 'Filing Types' },
  { suffix: 'naming-rules', filename: 'naming-rules.json', label: 'Naming Rules' },
  { suffix: 'sites-config', filename: 'sites.json', label: 'Sites Config' },
  // Visual (legacy non-namespaced keys)
  { suffix: 'honor-flag-bar-settings', filename: 'honor-flag-bar.json', label: 'Honor Flag Bar' },
  { suffix: 'honor-flag-bar-enabled', filename: 'honor-flag-bar-enabled.json', label: 'Flag Bar Enabled' },
  { suffix: 'honor-flag-bar-animation', filename: 'honor-flag-bar-animation.json', label: 'Flag Bar Animation' },
  { suffix: 'honor-flag-bar-parallax', filename: 'honor-flag-bar-parallax.json', label: 'Flag Bar Parallax' },
  { suffix: 'honor-flag-bar-rotation', filename: 'honor-flag-bar-rotation.json', label: 'Flag Bar Rotation' },
  { suffix: 'honor-flag-bar-max-desktop', filename: 'honor-flag-bar-max-desktop.json', label: 'Flag Bar Max Desktop' },
  { suffix: 'honor-flag-bar-max-mobile', filename: 'honor-flag-bar-max-mobile.json', label: 'Flag Bar Max Mobile' },
  { suffix: 'honor-flag-bar-alignment', filename: 'honor-flag-bar-alignment.json', label: 'Flag Bar Alignment' },
  { suffix: 'hero-accent-settings', filename: 'hero-accent-settings.json', label: 'Hero Accent' },
  { suffix: 'flag-gallery-settings', filename: 'flag-gallery-settings.json', label: 'Flag Gallery' },
  { suffix: 'map-spotlight-settings', filename: 'map-spotlight-settings.json', label: 'Map Spotlight' },
  { suffix: 'asset-metadata', filename: 'asset-metadata.json', label: 'Asset Metadata' },
  { suffix: 'asset-usage-policy', filename: 'asset-usage-policy.json', label: 'Asset Usage Policy' },
  { suffix: 'audit-log', filename: 'audit-log.json', label: 'Audit Log' },
  { suffix: 'law-firm-showcase', filename: 'law-firm-showcase.json', label: 'Law Firm Showcase' },
  { suffix: 'smb-template', filename: 'smb-template.json', label: 'SMB Template' },
  { suffix: 'agency-framework', filename: 'agency-framework.json', label: 'Agency Framework' },
  { suffix: 'sites:index', filename: 'sites-index.json', label: 'Sites Index' },
]

const FOUNDER_HUB_WORKSPACE: WorkspaceDef = {
  id: 'founder-hub',
  name: 'Founder Hub',
  description: 'Personal founder portfolio and investor portal',
  namespace: 'founder-hub',
  remote: { owner: 'DTMBX', repo: 'Founder-Hub', branch: 'main', dataPath: 'public/data' },
  localPath: 'Founder-Hub',
  schemaId: 'founder-hub-full',
  contentKeys: FOUNDER_HUB_KEYS,
  previewUrl: '/',
  domain: 'devon-tyler.com',
  createdAt: '2024-01-01T00:00:00Z',
  enabled: true,
  builtIn: true,
}

// ─── Schema Templates for New Workspaces ────────────────────────────────────

export interface SchemaTemplate {
  id: string
  label: string
  description: string
  keys: ContentKeyDef[]
}

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  {
    id: 'generic',
    label: 'Generic Site',
    description: 'Minimal content structure — settings, pages, navigation',
    keys: [
      { suffix: 'settings', filename: 'settings.json', label: 'Site Settings' },
      { suffix: 'content', filename: 'content.json', label: 'Content' },
      { suffix: 'pages', filename: 'pages.json', label: 'Pages' },
      { suffix: 'navigation', filename: 'navigation.json', label: 'Navigation' },
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    description: 'Projects, about, contact, skills, experience',
    keys: [
      { suffix: 'settings', filename: 'settings.json', label: 'Site Settings' },
      { suffix: 'projects', filename: 'projects.json', label: 'Projects' },
      { suffix: 'about', filename: 'about.json', label: 'About' },
      { suffix: 'contact', filename: 'contact.json', label: 'Contact' },
      { suffix: 'skills', filename: 'skills.json', label: 'Skills' },
      { suffix: 'experience', filename: 'experience.json', label: 'Experience' },
    ],
  },
  {
    id: 'docs',
    label: 'Documentation',
    description: 'Pages, navigation, search index',
    keys: [
      { suffix: 'settings', filename: 'settings.json', label: 'Site Settings' },
      { suffix: 'pages', filename: 'pages.json', label: 'Pages' },
      { suffix: 'navigation', filename: 'navigation.json', label: 'Navigation' },
      { suffix: 'search-index', filename: 'search-index.json', label: 'Search Index' },
    ],
  },
  {
    id: 'blog',
    label: 'Blog / Content',
    description: 'Posts, categories, authors, tags',
    keys: [
      { suffix: 'settings', filename: 'settings.json', label: 'Site Settings' },
      { suffix: 'posts', filename: 'posts.json', label: 'Posts' },
      { suffix: 'categories', filename: 'categories.json', label: 'Categories' },
      { suffix: 'authors', filename: 'authors.json', label: 'Authors' },
      { suffix: 'tags', filename: 'tags.json', label: 'Tags' },
    ],
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce / Storefront',
    description: 'Products, categories, orders, customers',
    keys: [
      { suffix: 'settings', filename: 'settings.json', label: 'Site Settings' },
      { suffix: 'products', filename: 'products.json', label: 'Products' },
      { suffix: 'categories', filename: 'categories.json', label: 'Categories' },
      { suffix: 'orders', filename: 'orders.json', label: 'Orders' },
      { suffix: 'customers', filename: 'customers.json', label: 'Customers' },
    ],
  },
]

// ─── Registry API ───────────────────────────────────────────────────────────

/** Load all workspaces from localStorage (includes built-in) */
export function loadWorkspaces(): WorkspaceDef[] {
  const builtIn = [FOUNDER_HUB_WORKSPACE]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return builtIn
    const stored: WorkspaceDef[] = JSON.parse(raw)
    // Merge: built-in first, then user-added (skip duplicates by id)
    const ids = new Set(builtIn.map(w => w.id))
    const userAdded = stored.filter(w => !ids.has(w.id))
    return [...builtIn, ...userAdded]
  } catch {
    return builtIn
  }
}

/** Save user-added workspaces (built-in are never stored) */
function saveUserWorkspaces(workspaces: WorkspaceDef[]): void {
  const userOnly = workspaces.filter(w => !w.builtIn)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly))
}

/** Add a new workspace */
export function addWorkspace(ws: Omit<WorkspaceDef, 'createdAt' | 'builtIn'>): WorkspaceDef {
  const full: WorkspaceDef = {
    ...ws,
    createdAt: new Date().toISOString(),
    builtIn: false,
  }
  const all = loadWorkspaces()
  if (all.some(w => w.id === full.id)) {
    throw new Error(`Workspace "${full.id}" already exists`)
  }
  saveUserWorkspaces([...all, full])
  return full
}

/** Update a workspace (built-in can update remote/localPath/enabled) */
export function updateWorkspace(id: string, patch: Partial<WorkspaceDef>): void {
  const all = loadWorkspaces()
  const idx = all.findIndex(w => w.id === id)
  if (idx < 0) throw new Error(`Workspace "${id}" not found`)
  all[idx] = { ...all[idx], ...patch, id: all[idx].id, builtIn: all[idx].builtIn }
  saveUserWorkspaces(all)
}

/** Remove a user-added workspace */
export function removeWorkspace(id: string): void {
  const all = loadWorkspaces()
  const target = all.find(w => w.id === id)
  if (!target) return
  if (target.builtIn) throw new Error('Cannot remove built-in workspace')
  saveUserWorkspaces(all.filter(w => w.id !== id))
}

/** Get a single workspace by ID */
export function getWorkspace(id: string): WorkspaceDef | undefined {
  return loadWorkspaces().find(w => w.id === id)
}

// ─── Key Resolution ─────────────────────────────────────────────────────────

/**
 * Resolve a content key suffix to the full KV storage key.
 * Handles founder-hub legacy keys (non-namespaced) automatically.
 */
export function resolveKVKey(namespace: string, suffix: string): string {
  if (namespace === 'founder-hub' && LEGACY_KEYS[suffix]) {
    return LEGACY_KEYS[suffix]
  }
  return `${namespace}-${suffix}`
}

/**
 * Build a DATA_FILES-compatible map for publishing.
 * Maps full KV keys → filenames for GitHub sync.
 */
export function buildDataFilesMap(ws: WorkspaceDef): Record<string, string> {
  const map: Record<string, string> = {}
  for (const key of ws.contentKeys) {
    const kvKey = resolveKVKey(ws.namespace, key.suffix)
    map[kvKey] = key.filename
  }
  return map
}

/**
 * Build STATIC_DATA_MAP (kvKey → /data/filename.json) for read fallback.
 */
export function buildStaticDataMap(ws: WorkspaceDef, basePath = '/data'): Record<string, string> {
  const map: Record<string, string> = {}
  for (const key of ws.contentKeys) {
    const kvKey = resolveKVKey(ws.namespace, key.suffix)
    map[kvKey] = `${basePath}/${key.filename}`
  }
  return map
}

/**
 * Get the localStorage prefix for a workspace.
 */
export function getStoragePrefix(ws: WorkspaceDef): string {
  return `${ws.namespace}:`
}
