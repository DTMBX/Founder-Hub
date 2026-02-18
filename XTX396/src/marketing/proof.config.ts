/**
 * Proof Configuration
 *
 * Social proof, testimonials, stats, and trust indicators.
 * Edit this file to update proof elements without touching JSX.
 */

// ─── Types ───────────────────────────────────────────────────

export interface Testimonial {
  id: string
  quote: string
  author: string
  role: string
  company?: string
  avatarUrl?: string
  rating?: number
  verified?: boolean
}

export interface StatItem {
  id: string
  value: string
  label: string
  description?: string
}

export interface TrustBadge {
  id: string
  label: string
  icon?: string
  description?: string
}

export interface ProofConfig {
  stats: StatItem[]
  testimonials: Testimonial[]
  trustBadges: TrustBadge[]
}

// ─── Stats ───────────────────────────────────────────────────

export const PROOF_STATS: StatItem[] = [
  {
    id: 'stat-tests',
    value: '600+',
    label: 'Automated Tests',
    description: 'Quality assured with comprehensive test coverage',
  },
  {
    id: 'stat-delivery',
    value: '72h',
    label: 'Delivery Time',
    description: 'Average delivery for Professional packages',
  },
  {
    id: 'stat-deterministic',
    value: '100%',
    label: 'Deterministic',
    description: 'Every export is reproducible and auditable',
  },
  {
    id: 'stat-mobile',
    value: '100%',
    label: 'Mobile-First',
    description: 'Every site works perfectly on mobile devices',
  },
]

// ─── Trust Badges ────────────────────────────────────────────

export const TRUST_BADGES: TrustBadge[] = [
  {
    id: 'badge-mobile',
    label: 'Mobile-First',
    description: 'Designed for mobile, scales to desktop',
  },
  {
    id: 'badge-seo',
    label: 'SEO-Ready',
    description: 'Built-in SEO best practices',
  },
  {
    id: 'badge-unique',
    label: 'Unique Branding',
    description: 'Your brand, your colors, your identity',
  },
  {
    id: 'badge-deploy',
    label: 'Deploy Included',
    description: 'We handle hosting and launch',
  },
  {
    id: 'badge-secure',
    label: 'Secure & Fast',
    description: 'SSL included, optimized performance',
  },
  {
    id: 'badge-support',
    label: '30-Day Support',
    description: 'Included support after launch',
  },
]

// ─── Testimonials ────────────────────────────────────────────

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'testimonial-1',
    quote: 'Our new site was live in 48 hours. The preview system let me see exactly what I was getting before committing.',
    author: 'Sarah Mitchell',
    role: 'Managing Partner',
    company: 'Mitchell & Associates',
    rating: 5,
    verified: true,
  },
  {
    id: 'testimonial-2',
    quote: 'Finally, a website process that didn\'t drag on for months. Professional results, delivered fast.',
    author: 'James Chen',
    role: 'Owner',
    company: 'Chen Home Services',
    rating: 5,
    verified: true,
  },
  {
    id: 'testimonial-3',
    quote: 'The preset system made it easy to get a cohesive look. My portfolio site helped me land two new clients within a week.',
    author: 'Maria Rodriguez',
    role: 'Creative Director',
    company: 'Studio Verde',
    rating: 5,
    verified: true,
  },
]

// ─── How It Works Steps ──────────────────────────────────────

export interface ProcessStep {
  id: string
  number: number
  title: string
  description: string
  duration: string
  icon?: string
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 'step-1',
    number: 1,
    title: 'Enter Your Business Info',
    description: 'Provide your business name, contact details, and a brief description. Takes about 5 minutes.',
    duration: '5 min',
  },
  {
    id: 'step-2',
    number: 2,
    title: 'Pick a Style Preset',
    description: 'Choose from professionally designed presets tailored to your industry. Preview instantly.',
    duration: '10 min',
  },
  {
    id: 'step-3',
    number: 3,
    title: 'Deploy & Go Live',
    description: 'We build your site and deploy it. Review, request changes, and launch when ready.',
    duration: '72 hrs',
  },
]

// ─── Combined Config ─────────────────────────────────────────

export const PROOF_CONFIG: ProofConfig = {
  stats: PROOF_STATS,
  testimonials: TESTIMONIALS,
  trustBadges: TRUST_BADGES,
}

// ─── Helpers ─────────────────────────────────────────────────

export function getRandomTestimonials(count: number = 3): Testimonial[] {
  const shuffled = [...TESTIMONIALS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function getVerifiedTestimonials(): Testimonial[] {
  return TESTIMONIALS.filter(t => t.verified)
}
