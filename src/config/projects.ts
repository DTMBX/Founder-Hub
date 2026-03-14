/**
 * Canonical project registry — single source of truth for all Evident ecosystem projects.
 *
 * This file is the TypeScript representation of /projects.registry.json at the workspace root.
 * The EvidentManager admin component consumes this instead of inline arrays.
 */

export interface Project {
  id: string
  name: string
  slug: string
  summary: string
  status: 'live' | 'development' | 'concept' | 'stable'
  canonicalUrl: string | null
  repoUrl: string | null
  docsUrl: string | null
  category: 'core' | 'subsidiary' | 'satellite' | 'tooling' | 'r-and-d'
  owner: string
  deploymentTarget: 'github-pages' | 'netlify' | 'railway' | null
  showInNav: boolean
  showInFooter: boolean
  showOnHome: boolean
  sortOrder: number
}

export const projects: Project[] = [
  {
    id: 'evident',
    name: 'Evident',
    slug: 'evident',
    summary: 'Evidence processing platform — PDFs, video, audio, digital media with audit trails and chain of custody.',
    status: 'live',
    canonicalUrl: 'https://www.xtx396.com',
    repoUrl: 'https://github.com/DTMBX/Evident',
    docsUrl: 'https://www.xtx396.com/docs/',
    category: 'core',
    owner: 'Evident Technologies LLC',
    deploymentTarget: 'github-pages',
    showInNav: true,
    showInFooter: true,
    showOnHome: true,
    sortOrder: 1,
  },
  {
    id: 'founder-hub',
    name: 'Founder Hub',
    slug: 'founder-hub',
    summary: 'Operations hub, portfolio, and accountability platform by Devon Tyler Barber.',
    status: 'live',
    canonicalUrl: 'https://devon-tyler.com',
    repoUrl: 'https://github.com/DTMBX/Founder-Hub',
    docsUrl: null,
    category: 'core',
    owner: 'Evident Technologies LLC',
    deploymentTarget: 'github-pages',
    showInNav: false,
    showInFooter: false,
    showOnHome: false,
    sortOrder: 2,
  },
  {
    id: 'tillerstead',
    name: 'Tillerstead',
    slug: 'tillerstead',
    summary: 'TCNA-compliant professional tile installation — South Jersey. NJ HIC #13VH10808800.',
    status: 'live',
    canonicalUrl: 'https://tillerstead.com',
    repoUrl: 'https://github.com/DTMBX/Tillerstead',
    docsUrl: null,
    category: 'subsidiary',
    owner: 'Tillerstead LLC',
    deploymentTarget: 'github-pages',
    showInNav: false,
    showInFooter: false,
    showOnHome: false,
    sortOrder: 3,
  },
  {
    id: 'civics-hierarchy',
    name: 'Civics Hierarchy',
    slug: 'civics-hierarchy',
    summary: 'Constitutional law reference — navigable views mapping the hierarchy of legal authority.',
    status: 'live',
    canonicalUrl: 'https://civics.xtx396.com',
    repoUrl: 'https://github.com/DTMBX/civics-hierarchy',
    docsUrl: null,
    category: 'satellite',
    owner: 'Evident Technologies LLC',
    deploymentTarget: 'github-pages',
    showInNav: true,
    showInFooter: false,
    showOnHome: true,
    sortOrder: 10,
  },
  {
    id: 'doj-document-library',
    name: 'Document Library',
    slug: 'epstein-library',
    summary: 'DOJ evidence analysis — processing engines and source verification scoring.',
    status: 'live',
    canonicalUrl: 'https://library.xtx396.com',
    repoUrl: 'https://github.com/DTMBX/epstein-library-evid',
    docsUrl: null,
    category: 'satellite',
    owner: 'Evident Technologies LLC',
    deploymentTarget: 'github-pages',
    showInNav: true,
    showInFooter: false,
    showOnHome: true,
    sortOrder: 11,
  },
  {
    id: 'essential-goods-ledger',
    name: 'Essential Goods Ledger',
    slug: 'essential-goods',
    summary: 'Economic analysis — commodity pricing, supply chain metrics, cost-of-living indicators.',
    status: 'live',
    canonicalUrl: 'https://ledger.xtx396.com',
    repoUrl: 'https://github.com/DTMBX/essential-goods-ledg',
    docsUrl: null,
    category: 'satellite',
    owner: 'Evident Technologies LLC',
    deploymentTarget: 'github-pages',
    showInNav: true,
    showInFooter: false,
    showOnHome: true,
    sortOrder: 12,
  },
  {
    id: 'geneva-bible-study',
    name: 'Geneva Bible Study',
    slug: 'geneva-bible-study',
    summary: 'Offline-capable Scripture study — full-text search, marginal notes, reading plans.',
    status: 'live',
    canonicalUrl: 'https://bible.xtx396.com',
    repoUrl: 'https://github.com/DTMBX/geneva-bible-study-t',
    docsUrl: null,
    category: 'satellite',
    owner: 'Evident Technologies LLC',
    deploymentTarget: 'github-pages',
    showInNav: true,
    showInFooter: false,
    showOnHome: true,
    sortOrder: 13,
  },
  {
    id: 'informed-consent',
    name: 'Informed Consent Companion',
    slug: 'informed-consent',
    summary: 'Evidence-based maternity and newborn care information with sourced claims.',
    status: 'live',
    canonicalUrl: 'https://consent.xtx396.com',
    repoUrl: 'https://github.com/DTMBX/informed-consent-com',
    docsUrl: null,
    category: 'satellite',
    owner: 'Evident Technologies LLC',
    deploymentTarget: 'github-pages',
    showInNav: true,
    showInFooter: false,
    showOnHome: true,
    sortOrder: 14,
  },
  {
    id: 'contractor-command-center',
    name: 'Contractor Command Center',
    slug: 'contractor-command',
    summary: 'Project management and estimating tools for construction contractors.',
    status: 'live',
    canonicalUrl: 'https://contractor.xtx396.com',
    repoUrl: 'https://github.com/DTMBX/contractor-command-c',
    docsUrl: null,
    category: 'satellite',
    owner: 'Evident Technologies LLC',
    deploymentTarget: 'github-pages',
    showInNav: true,
    showInFooter: false,
    showOnHome: true,
    sortOrder: 15,
  },
]

/** Satellite apps only (category === 'satellite') */
export const satellites = projects.filter(p => p.category === 'satellite')

/** All live deployed projects */
export const liveProjects = projects.filter(p => p.status === 'live')

/** Projects shown on the home/apps grid */
export const homeProjects = projects.filter(p => p.showOnHome).sort((a, b) => a.sortOrder - b.sortOrder)
