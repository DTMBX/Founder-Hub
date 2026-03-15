/**
 * Search index for Cmd+K modal.
 *
 * Aggregates all searchable items: pages, projects, blog posts, and actions.
 * Each item has a label, description, category, and navigation target.
 */

import { projects } from '@/config/projects'
import { POSTS } from '@/data/posts'

export interface SearchItem {
  id: string
  label: string
  description: string
  category: 'page' | 'project' | 'blog' | 'action'
  href: string
  keywords?: string[]
}

/** Static pages */
const PAGES: SearchItem[] = [
  { id: 'home', label: 'Home', description: 'Main landing page', category: 'page', href: '', keywords: ['home', 'landing', 'start'] },
  { id: 'about', label: 'About Devon', description: 'Background, mission, and values', category: 'page', href: '#about', keywords: ['about', 'bio', 'mission'] },
  { id: 'projects-index', label: 'Projects', description: 'All ventures and satellite applications', category: 'page', href: '#projects-index', keywords: ['projects', 'ventures', 'all'] },
  { id: 'evident', label: 'Evident Technologies', description: 'E-discovery and evidence processing platform', category: 'page', href: '#evident', keywords: ['evident', 'ediscovery', 'legal', 'evidence'] },
  { id: 'evident-site', label: 'Evident Technologies LLC', description: 'Corporate site and licensing', category: 'page', href: '#evident-site', keywords: ['evident', 'corporate', 'llc'] },
  { id: 'evident-demo', label: 'Evident Platform Demo', description: 'Interactive e-discovery demonstration', category: 'page', href: '#evident-demo', keywords: ['demo', 'trial', 'ediscovery', 'platform'] },
  { id: 'tillerstead', label: 'Tillerstead LLC', description: 'Licensed NJ home improvement contractor', category: 'page', href: '#tillerstead', keywords: ['tillerstead', 'contractor', 'tile', 'nj', 'home improvement'] },
  { id: 'accountability', label: 'Accountability', description: 'Proof of work and transparency', category: 'page', href: '#accountability', keywords: ['accountability', 'proof'] },
  { id: 'invest', label: 'Investment', description: 'Capital allocation and investor relations', category: 'page', href: '#invest', keywords: ['invest', 'capital', 'funding'] },
  { id: 'blog', label: 'Blog', description: 'Updates from the ecosystem', category: 'page', href: '#blog', keywords: ['blog', 'news', 'updates'] },
  { id: 'activity', label: 'Ecosystem Activity', description: 'Real-time development activity', category: 'page', href: '#activity', keywords: ['activity', 'commits', 'development'] },
  { id: 'intelligence', label: 'Ecosystem Intelligence', description: 'Metrics and health monitoring', category: 'page', href: '#intelligence', keywords: ['intelligence', 'metrics', 'health'] },
  { id: 'data', label: 'Public Data API', description: 'Machine-readable ecosystem data', category: 'page', href: '#data', keywords: ['api', 'data', 'json'] },
  { id: 'developers', label: 'Developer Portal', description: 'API documentation and integration guides', category: 'page', href: '#developers', keywords: ['developer', 'api', 'docs', 'integration'] },
  { id: 'health', label: 'System Status', description: 'Real-time operational status of all services', category: 'page', href: '#system-status', keywords: ['status', 'health', 'uptime', 'monitoring'] },
  { id: 'privacy', label: 'Privacy Policy', description: 'Data practices and privacy rights', category: 'page', href: '#privacy', keywords: ['privacy', 'gdpr', 'ccpa'] },
  { id: 'terms', label: 'Terms of Service', description: 'Legal terms and conditions', category: 'page', href: '#terms', keywords: ['terms', 'legal', 'tos'] },
  { id: 'cookie-policy', label: 'Cookie Policy', description: 'Cookie and localStorage usage', category: 'page', href: '#cookie-policy', keywords: ['cookie', 'storage'] },
]

/** Projects from registry */
const PROJECT_ITEMS: SearchItem[] = projects.map(p => ({
  id: `project-${p.id}`,
  label: p.name,
  description: p.summary,
  category: 'project' as const,
  href: `#project/${p.id}`,
  keywords: [p.category],
}))

/** Blog posts */
const BLOG_ITEMS: SearchItem[] = POSTS.map(p => ({
  id: `blog-${p.id}`,
  label: p.title,
  description: p.summary,
  category: 'blog' as const,
  href: `#blog/${p.id}`,
  keywords: [p.category],
}))

/** Quick actions */
const ACTIONS: SearchItem[] = [
  { id: 'action-contact', label: 'Contact Devon', description: 'Scroll to contact section', category: 'action', href: '#contact', keywords: ['contact', 'email', 'reach out'] },
  { id: 'action-admin', label: 'Admin Dashboard', description: 'Open admin panel', category: 'action', href: '#admin', keywords: ['admin', 'dashboard', 'login'] },
]

/** Full search index */
export const SEARCH_INDEX: SearchItem[] = [
  ...PAGES,
  ...PROJECT_ITEMS,
  ...BLOG_ITEMS,
  ...ACTIONS,
]

export const CATEGORY_LABELS: Record<SearchItem['category'], string> = {
  page: 'Pages',
  project: 'Projects',
  blog: 'Blog Posts',
  action: 'Actions',
}
