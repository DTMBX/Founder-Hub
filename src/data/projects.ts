/**
 * Central project registry — single source of truth for all Evident ecosystem projects.
 *
 * Every page that displays project information reads from this file.
 * The registry is separate from the runtime KV store (localStorage) so that
 * the default catalog is available at build-time for SSR/SSG, structured data,
 * and sitemap generation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProjectCategory = 'civic-tech' | 'home-improvement' | 'software-platform'
export type ProjectStatus = 'live' | 'in-development' | 'research'

export interface ProjectEntry {
  id: string
  name: string
  tagline: string
  description: string
  category: ProjectCategory
  status: ProjectStatus
  url?: string
  repo?: string
  techStack: string[]
  accentColor: string
  /** ISO date string (YYYY-MM-DD) when the project was first created / launched */
  created?: string
  /** ISO date string (YYYY-MM-DD) of the most recent significant update */
  lastUpdated?: string
  /** GitHub stars (populated by CI script) */
  repoStars?: number
  /** Primary programming language (populated by CI script) */
  repoLanguage?: string
  /** URL to project documentation */
  documentationUrl?: string
  /** Primary domain for the project (without protocol) */
  domain?: string
  /** Owning entity name */
  owner?: string
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const PROJECT_REGISTRY: ProjectEntry[] = [
  {
    id: 'evident-platform',
    name: 'Evident Platform',
    tagline: 'Evidence processing platform — PDFs, video, audio, digital media with audit trails and chain of custody.',
    description:
      'The Evident Platform is the e-discovery and evidence processing hub for the xtx396.com ecosystem. ' +
      'It provides ingestion, OCR, chain-of-custody tracking, and audit trails across PDFs, video, audio, ' +
      'and digital media. Six satellite applications extend its capabilities into specific civic domains.',
    category: 'civic-tech',
    status: 'live',
    url: 'https://www.xtx396.com',
    repo: 'https://github.com/DTMBX/EVIDENT',
    techStack: ['React', 'TypeScript', 'Vite'],
    accentColor: 'emerald',
    created: '2025-01-15',
    lastUpdated: '2026-03-15',
    repoLanguage: 'TypeScript',
    documentationUrl: 'https://www.xtx396.com/docs/',
    domain: 'xtx396.com',
    owner: 'Evident Technologies LLC',
  },
  {
    id: 'tillerstead',
    name: 'Tillerstead',
    tagline: 'Home improvement and land stewardship platform — tools, calculators, and planning resources for property owners.',
    description:
      'Tillerstead is a resource hub for property owners managing home improvement projects and land stewardship. ' +
      'It includes ROI calculators, material estimators, and planning guides for fencing, grading, and ' +
      'structural improvements, all designed for self-reliant homeowners.',
    category: 'home-improvement',
    status: 'live',
    url: 'https://tillerstead.com',
    repo: 'https://github.com/DTMBX/tillerstead',
    techStack: ['Jekyll', 'JavaScript'],
    accentColor: 'emerald',
    created: '2025-03-01',
    lastUpdated: '2026-03-07',
    repoLanguage: 'JavaScript',
    domain: 'tillerstead.com',
    owner: 'Tillerstead LLC',
  },
  {
    id: 'founder-hub',
    name: 'Founder Hub',
    tagline: 'Operations hub, portfolio, and accountability platform by Devon Tyler Barber.',
    description:
      'Founder Hub is the operational headquarters for all Evident Technologies ventures. ' +
      'It hosts the public portfolio, accountability records, investor communications, ' +
      'and administrative tools that keep every project transparent and auditable.',
    category: 'software-platform',
    status: 'live',
    url: 'https://devon-tyler.com',
    repo: 'https://github.com/DTMBX/Founder-Hub',
    techStack: ['React', 'TypeScript', 'Vite'],
    accentColor: 'slate',
    created: '2025-02-01',
    lastUpdated: '2026-03-15',
    repoLanguage: 'TypeScript',
    domain: 'devon-tyler.com',
    owner: 'Evident Technologies LLC',
  },
  {
    id: 'civics-hierarchy',
    name: 'Civics Hierarchy',
    tagline: 'Constitutional law reference — navigable views mapping the hierarchy of legal authority.',
    description:
      'Civics Hierarchy visualizes the structure of local, state, and federal government in an interactive tree. ' +
      'Users can explore branches of authority, understand the purpose of each agency, and trace the chain of command ' +
      'from the Constitution to their local school board.',
    category: 'civic-tech',
    status: 'live',
    url: 'https://civics.xtx396.com',
    repo: 'https://github.com/DTMBX/civics-hierarchy',
    techStack: ['React', 'TypeScript'],
    accentColor: 'blue',
    created: '2025-06-01',
    lastUpdated: '2026-03-08',
    repoLanguage: 'TypeScript',
    domain: 'civics.xtx396.com',
    owner: 'Evident Technologies LLC',
  },
  {
    id: 'doj-document-library',
    name: 'DOJ Document Library',
    tagline: 'DOJ Epstein case documents — e-discovery demo and public-service archive powered by Evident processing engines.',
    description:
      'The DOJ Document Library indexes publicly released Epstein case documents from the U.S. Department of Justice — ' +
      'court filings, depositions, flight logs, and FOIA responses — into a searchable, verifiable interface. ' +
      'It serves as both a genuine public-service resource and a live production demo of Evident\'s e-discovery tooling.',
    category: 'civic-tech',
    status: 'live',
    url: 'https://library.xtx396.com',
    repo: 'https://github.com/DTMBX/epstein-library-evid',
    techStack: ['React', 'TypeScript'],
    accentColor: 'amber',
    created: '2025-06-01',
    lastUpdated: '2026-03-08',
    repoLanguage: 'TypeScript',
    domain: 'library.xtx396.com',
    owner: 'Evident Technologies LLC',
  },
  {
    id: 'informed-consent',
    name: 'Informed Consent Companion',
    tagline: 'Evidence-based maternity and newborn care information with sourced claims and consent tracking.',
    description:
      'Informed Consent Companion provides evidence-based maternity and newborn care information with fully sourced claims. ' +
      'It helps individuals understand their rights before signing medical or institutional agreements, ' +
      'tracks what was disclosed, and gives users a personal audit trail of every consent granted or revoked.',
    category: 'civic-tech',
    status: 'live',
    url: 'https://consent.xtx396.com',
    repo: 'https://github.com/DTMBX/informed-consent-com',
    techStack: ['React', 'TypeScript'],
    accentColor: 'rose',
    created: '2025-06-01',
    lastUpdated: '2026-03-08',
    repoLanguage: 'TypeScript',
    domain: 'consent.xtx396.com',
    owner: 'Evident Technologies LLC',
  },
  {
    id: 'essential-goods-ledger',
    name: 'Essential Goods Ledger',
    tagline: 'Economic analysis — commodity pricing, supply chain metrics, and cost-of-living indicators.',
    description:
      'The Essential Goods Ledger provides economic analysis across commodity pricing, supply chain metrics, ' +
      'and cost-of-living indicators. Each data point is timestamped and linked to its source, ' +
      'making it possible to track pricing trends, distribution patterns, and resource allocation transparently.',
    category: 'civic-tech',
    status: 'live',
    url: 'https://ledger.xtx396.com',
    repo: 'https://github.com/DTMBX/essential-goods-ledg',
    techStack: ['React', 'TypeScript'],
    accentColor: 'teal',
    created: '2025-06-01',
    lastUpdated: '2026-03-08',
    repoLanguage: 'TypeScript',
    domain: 'ledger.xtx396.com',
    owner: 'Evident Technologies LLC',
  },
  {
    id: 'geneva-bible-study',
    name: 'Geneva Bible Study',
    tagline: 'Offline-capable Scripture study — full-text search, marginal notes, and reading plans.',
    description:
      'Geneva Bible Study presents the Geneva Bible text alongside margin annotations and historical commentary. ' +
      'Users can search by book, chapter, or keyword, compare translations, and read the original reformer notes ' +
      'that shaped English-speaking constitutional thought. Built as an offline-capable PWA for study anywhere.',
    category: 'software-platform',
    status: 'live',
    url: 'https://bible.xtx396.com',
    repo: 'https://github.com/DTMBX/geneva-bible-study-t',
    techStack: ['React', 'TypeScript'],
    accentColor: 'amber',
    created: '2025-06-01',
    lastUpdated: '2026-03-08',
    repoLanguage: 'TypeScript',
    domain: 'bible.xtx396.com',
    owner: 'Evident Technologies LLC',
  },
  {
    id: 'contractor-command-center',
    name: 'Contractor Command Center',
    tagline: 'Project management and estimating tools for construction contractors.',
    description:
      'Contractor Command Center gives homeowners and contractors a shared workspace to track job progress, ' +
      'manage line-item estimates, log change orders, and store before/after photos. Built as a PWA for ' +
      'offline-capable use on job sites.',
    category: 'home-improvement',
    status: 'live',
    url: 'https://contractor.xtx396.com',
    repo: 'https://github.com/DTMBX/contractor-command-c',
    techStack: ['React', 'TypeScript', 'PWA'],
    accentColor: 'blue',
    created: '2025-06-01',
    lastUpdated: '2026-03-08',
    repoLanguage: 'TypeScript',
    domain: 'contractor.xtx396.com',
    owner: 'Evident Technologies LLC',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a project by its id. */
export function getProjectById(id: string): ProjectEntry | undefined {
  return PROJECT_REGISTRY.find(p => p.id === id)
}

/** Return projects matching one or more categories. */
export function getProjectsByCategory(...categories: ProjectCategory[]): ProjectEntry[] {
  if (categories.length === 0) return PROJECT_REGISTRY
  return PROJECT_REGISTRY.filter(p => categories.includes(p.category))
}

/** All distinct categories present in the registry. */
export const PROJECT_CATEGORIES: { value: ProjectCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'civic-tech', label: 'Civic Tech' },
  { value: 'home-improvement', label: 'Home Improvement' },
  { value: 'software-platform', label: 'Software Platforms' },
]
