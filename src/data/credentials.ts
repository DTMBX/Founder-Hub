// Professional credentials, career timeline, and competency data for Devon Tyler Barber.

export interface Credential {
  id: string
  type: 'license' | 'certification' | 'education'
  title: string
  issuer: string
  identifier?: string
  issued?: string
  status: 'active' | 'completed'
}

export interface CareerEntry {
  id: string
  year: string
  role: string
  organization: string
  description: string
}

export interface Competency {
  id: string
  domain: string
  skills: string[]
}

export const CREDENTIALS: Credential[] = [
  {
    id: 'nj-hic',
    type: 'license',
    title: 'Home Improvement Contractor License',
    issuer: 'State of New Jersey',
    identifier: '13VH10808800',
    status: 'active',
  },
  {
    id: 'evident-llc',
    type: 'certification',
    title: 'Evident Technologies LLC — Founder & Principal',
    issuer: 'State of New Jersey',
    status: 'active',
  },
  {
    id: 'tillerstead-llc',
    type: 'certification',
    title: 'Tillerstead LLC — Founder & Licensed Contractor',
    issuer: 'State of New Jersey',
    status: 'active',
  },
]

export const CAREER_TIMELINE: CareerEntry[] = [
  {
    id: 'tillerstead-founding',
    year: '2023',
    role: 'Founder & Licensed Contractor',
    organization: 'Tillerstead LLC',
    description: 'Established licensed home improvement contracting firm. Tile, bathroom, kitchen, and flooring projects across South Jersey.',
  },
  {
    id: 'evident-founding',
    year: '2024',
    role: 'Founder & Principal',
    organization: 'Evident Technologies LLC',
    description: 'Founded legal-technology company focused on e-discovery, evidence integrity, and civic accountability tools.',
  },
  {
    id: 'ecosystem-launch',
    year: '2025',
    role: 'Ecosystem Architect',
    organization: 'Evident Technologies',
    description: 'Deployed eight satellite applications spanning civic technology, document management, and transparency infrastructure.',
  },
  {
    id: 'founder-hub',
    year: '2026',
    role: 'Platform Lead',
    organization: 'Devon Tyler Ventures',
    description: 'Consolidated venture portfolio into unified Founder Hub with public accountability, real-time dashboards, and investor visibility.',
  },
]

export const COMPETENCIES: Competency[] = [
  {
    id: 'engineering',
    domain: 'Software Engineering',
    skills: ['TypeScript', 'React', 'Cloudflare Workers', 'Vite', 'Node.js', 'PostgreSQL'],
  },
  {
    id: 'legal-tech',
    domain: 'Legal Technology',
    skills: ['E-Discovery', 'Evidence Processing', 'Chain of Custody', 'Document Review', 'Redaction'],
  },
  {
    id: 'construction',
    domain: 'Construction & Contracting',
    skills: ['Tile Installation', 'Bathroom Renovation', 'Kitchen Remodel', 'Flooring', 'Project Estimation'],
  },
  {
    id: 'operations',
    domain: 'Business Operations',
    skills: ['LLC Formation', 'Venture Architecture', 'Public Accountability', 'Investor Relations', 'Compliance'],
  },
]

/**
 * Build enhanced Person JSON-LD with credentials, occupations, and competencies.
 */
export function buildPersonSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${siteUrl}/#person`,
    name: 'Devon Tyler Barber',
    alternateName: 'Devon Tyler',
    url: siteUrl,
    jobTitle: 'Entrepreneur & Licensed NJ Contractor',
    knowsAbout: COMPETENCIES.flatMap(c => c.skills),
    hasCredential: CREDENTIALS.filter(c => c.type === 'license').map(c => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: c.title,
      recognizedBy: {
        '@type': 'GovernmentOrganization',
        name: c.issuer,
      },
      ...(c.identifier ? { identifier: c.identifier } : {}),
    })),
    hasOccupation: [
      {
        '@type': 'Occupation',
        name: 'Software Engineer',
        occupationalCategory: '15-1252.00',
        skills: COMPETENCIES.find(c => c.id === 'engineering')?.skills.join(', '),
      },
      {
        '@type': 'Occupation',
        name: 'Home Improvement Contractor',
        occupationalCategory: '47-2061.00',
        skills: COMPETENCIES.find(c => c.id === 'construction')?.skills.join(', '),
      },
    ],
    worksFor: [
      { '@type': 'Organization', name: 'Evident Technologies LLC', url: 'https://www.xtx396.com' },
      { '@type': 'Organization', name: 'Tillerstead LLC', url: 'https://tillerstead.com' },
    ],
  }
}
