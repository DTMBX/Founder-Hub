/**
 * offers.config.ts
 *
 * Best-in-class, generator-friendly marketing offers configuration.
 * Goals:
 * - Strong typing (safe IDs, fixed enums, readonly data)
 * - Price in cents (Stripe-native)
 * - Explicit delivery units (hours vs days)
 * - Validation that fails fast in DEV/tests
 * - Indexes for fast lookups
 * - Extensible fields for a website generator (site type, deliverables, compliance flags)
 *
 * No secrets. Pure data + pure helpers.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type CurrencyCode = 'USD'
export type BillingPeriod = 'one-time' | 'monthly' | 'annual'
export type DeliveryUnit = 'hours' | 'days'

export type SiteGenerationType = 'law-firm' | 'small-business' | 'agency' | 'universal'
export type OfferCategory = 'website' | 'retainer' | 'add-on'
export type OfferStatus = 'active' | 'draft' | 'archived'
export type OfferBadge = 'Popular' | 'Best Value' | 'New' | 'Limited' | 'Recommended'

export type TierId = string & { readonly __brand: 'TierId' }
export type OfferId = string & { readonly __brand: 'OfferId' }

export type GeneratorDeliverable =
  | 'pages'
  | 'blog'
  | 'intake-form'
  | 'contact-form'
  | 'portfolio'
  | 'case-studies'
  | 'team-profiles'
  | 'attorney-profiles'
  | 'practice-areas'
  | 'testimonials'
  | 'gallery'
  | 'maps'
  | 'seo-basic'
  | 'seo-advanced'
  | 'analytics'
  | 'newsletter'
  | 'crm-integration'
  | 'client-portal-foundation'
  | 'google-business'
  | 'hosting-setup'
  | 'domain-setup'

export type ComplianceFlag =
  | 'lawyer-advertising-disclaimer'
  | 'no-legal-advice-disclaimer'
  | 'jurisdiction-disclaimer'
  | 'accessibility-basics'
  | 'privacy-policy-placeholder'
  | 'cookie-banner-optional'

export interface DeliveryWindow {
  value: number
  unit: DeliveryUnit
}

export interface OfferTier {
  id: TierId
  name: string
  priceCents: number
  currency: CurrencyCode
  period: BillingPeriod
  description: string
  features: readonly string[]
  highlighted?: boolean
  badge?: OfferBadge
  ctaLabel?: string
  depositCents?: number
  delivery: DeliveryWindow

  /**
   * Generator hooks:
   * - deliverables: structured features your generator can toggle
   * - pageCount hint for quick scaffolding
   */
  deliverables?: readonly GeneratorDeliverable[]
  pageCountHint?: number
}

export interface MarketingOffer {
  offerId: OfferId
  title: string
  subtitle: string
  description: string

  siteType: SiteGenerationType
  category?: OfferCategory
  status?: OfferStatus

  idealFor: readonly string[]
  quickFeatures: readonly string[]

  tiers: readonly OfferTier[]

  featured?: boolean
  badge?: OfferBadge
  order: number

  /**
   * Generator hooks:
   * - recommendedTemplate: default template slug for the site generator
   * - compliance: toggles for standard disclaimers/boilerplate
   */
  recommendedTemplate?: string
  compliance?: readonly ComplianceFlag[]
}

// ─────────────────────────────────────────────────────────────
// Branding helpers
// ─────────────────────────────────────────────────────────────

export function asOfferId(value: string): OfferId {
  return value as OfferId
}

export function asTierId(value: string): TierId {
  return value as TierId
}

// ─────────────────────────────────────────────────────────────
// Canonical Site Generation Types
// ─────────────────────────────────────────────────────────────

export const SITE_GENERATION_TYPES = [
  { id: 'law-firm', label: 'Law Firm', description: 'Professional legal websites' },
  { id: 'small-business', label: 'Small Business', description: 'Modern business sites' },
  { id: 'agency', label: 'Agency / White Label', description: 'Reseller solutions' },
  { id: 'universal', label: 'Universal', description: 'Cross-industry offers' },
] as const satisfies readonly { id: SiteGenerationType; label: string; description?: string }[]

// ─────────────────────────────────────────────────────────────
// Offer Definitions (best practice: "as const satisfies")
// ─────────────────────────────────────────────────────────────

export const LAW_FIRM_OFFER = {
  offerId: asOfferId('law-firm-72-hour-launch'),
  title: 'Law Firm Website Launch',
  subtitle: 'Professional website in 72 hours',
  description:
    'A complete, ethics-aware law firm website built to establish credibility and convert visitors into consultations.',

  siteType: 'law-firm',
  category: 'website',
  status: 'active',

  idealFor: ['Solo practitioners', 'Small law firms', 'Practice expansions'],
  quickFeatures: ['Practice area pages', 'Attorney profiles', 'Client intake forms', 'Mobile-first design'],

  recommendedTemplate: 'law-firm-classic',
  compliance: [
    'lawyer-advertising-disclaimer',
    'no-legal-advice-disclaimer',
    'jurisdiction-disclaimer',
    'privacy-policy-placeholder',
    'accessibility-basics',
  ],

  tiers: [
    {
      id: asTierId('law-firm-starter'),
      name: 'Starter',
      priceCents: 1999_00,
      currency: 'USD',
      period: 'one-time',
      description: 'Essential law firm presence',
      features: [
        'Home + About + Contact pages',
        'Up to 3 practice area pages',
        'Single attorney bio',
        'Contact form with notifications',
        'Mobile responsive',
        'Basic SEO setup',
      ],
      delivery: { value: 5, unit: 'days' },
      depositCents: 500_00,
      deliverables: ['pages', 'contact-form', 'practice-areas', 'attorney-profiles', 'seo-basic'],
      pageCountHint: 5,
    },
    {
      id: asTierId('law-firm-professional'),
      name: 'Professional',
      priceCents: 2999_00,
      currency: 'USD',
      period: 'one-time',
      description: 'Full-featured firm website',
      features: [
        'Everything in Starter',
        'Up to 8 practice area pages',
        'Multiple attorney bios',
        'Case results showcase',
        'Client testimonials section',
        'Blog/News section',
        'Advanced SEO optimization',
        'Google Business integration',
      ],
      highlighted: true,
      badge: 'Popular',
      // 72-hour launch => 72 hours, not days
      delivery: { value: 72, unit: 'hours' },
      depositCents: 750_00,
      deliverables: [
        'pages',
        'practice-areas',
        'attorney-profiles',
        'testimonials',
        'blog',
        'seo-advanced',
        'google-business',
      ],
      pageCountHint: 12,
    },
    {
      id: asTierId('law-firm-enterprise'),
      name: 'Enterprise',
      priceCents: 4999_00,
      currency: 'USD',
      period: 'one-time',
      description: 'Multi-practice law firm solution',
      features: [
        'Everything in Professional',
        'Unlimited practice areas',
        'Unlimited attorney profiles',
        'Custom intake workflows',
        'CRM integration',
        'Client portal foundation',
        'Priority 48-hour delivery',
        '90-day support included',
      ],
      badge: 'Best Value',
      delivery: { value: 48, unit: 'hours' },
      depositCents: 1500_00,
      deliverables: [
        'pages',
        'practice-areas',
        'attorney-profiles',
        'intake-form',
        'crm-integration',
        'client-portal-foundation',
        'seo-advanced',
      ],
      pageCountHint: 18,
    },
  ] as const,

  featured: false,
  badge: 'Popular',
  order: 1,
} as const satisfies MarketingOffer

export const SMB_OFFER = {
  offerId: asOfferId('small-business-starter'),
  title: 'Small Business Starter',
  subtitle: 'Modern website for growing businesses',
  description: 'A professional business website designed to showcase your services and convert visitors into customers.',

  siteType: 'small-business',
  category: 'website',
  status: 'active',

  idealFor: ['Service businesses', 'Retail shops', 'Contractors'],
  quickFeatures: ['Service showcase', 'Team profiles', 'Contact forms', 'SEO optimized'],

  recommendedTemplate: 'smb-modern',
  compliance: ['privacy-policy-placeholder', 'accessibility-basics', 'cookie-banner-optional'],

  tiers: [
    {
      id: asTierId('smb-starter'),
      name: 'Starter',
      priceCents: 999_00,
      currency: 'USD',
      period: 'one-time',
      description: 'Essential business presence',
      features: [
        'Home + About + Contact pages',
        'Up to 5 service descriptions',
        'Contact form',
        'Mobile responsive',
        'Basic SEO',
      ],
      delivery: { value: 5, unit: 'days' },
      depositCents: 300_00,
      deliverables: ['pages', 'contact-form', 'seo-basic'],
      pageCountHint: 5,
    },
    {
      id: asTierId('smb-professional'),
      name: 'Professional',
      priceCents: 1499_00,
      currency: 'USD',
      period: 'one-time',
      description: 'Full business website',
      features: [
        'Everything in Starter',
        'Unlimited service pages',
        'Team member profiles',
        'Photo gallery',
        'Testimonials section',
        'Blog setup',
        'Google Maps integration',
      ],
      highlighted: true,
      badge: 'Popular',
      delivery: { value: 72, unit: 'hours' },
      depositCents: 500_00,
      deliverables: ['pages', 'team-profiles', 'gallery', 'testimonials', 'blog', 'maps', 'seo-basic'],
      pageCountHint: 10,
    },
  ] as const,

  featured: false,
  order: 2,
} as const satisfies MarketingOffer

export const AGENCY_OFFER = {
  offerId: asOfferId('digital-agency-pro'),
  title: 'Digital Agency Pro',
  subtitle: 'Portfolio site that wins clients',
  description: 'A sophisticated agency website designed to showcase your work and convert prospects into high-value clients.',

  siteType: 'agency',
  category: 'website',
  status: 'active',

  idealFor: ['Creative agencies', 'Marketing firms', 'Design studios'],
  quickFeatures: ['Portfolio showcase', 'Case studies', 'Team directory', 'Lead capture'],

  recommendedTemplate: 'agency-portfolio',
  compliance: ['privacy-policy-placeholder', 'accessibility-basics', 'cookie-banner-optional'],

  tiers: [
    {
      id: asTierId('agency-starter'),
      name: 'Starter',
      priceCents: 2499_00,
      currency: 'USD',
      period: 'one-time',
      description: 'Essential agency presence',
      features: [
        'Home + About + Contact pages',
        'Portfolio grid (up to 12 projects)',
        'Team directory',
        'Contact form',
        'Modern animations',
      ],
      delivery: { value: 5, unit: 'days' },
      depositCents: 750_00,
      deliverables: ['pages', 'portfolio', 'team-profiles', 'contact-form'],
      pageCountHint: 6,
    },
    {
      id: asTierId('agency-professional'),
      name: 'Professional',
      priceCents: 3999_00,
      currency: 'USD',
      period: 'one-time',
      description: 'Complete agency platform',
      features: [
        'Everything in Starter',
        'Unlimited portfolio items',
        'Case study pages',
        'Client testimonials',
        'Services breakdown',
        'Blog/Insights section',
        'Newsletter integration',
        'Analytics dashboard',
      ],
      highlighted: true,
      badge: 'Popular',
      delivery: { value: 72, unit: 'hours' },
      depositCents: 1200_00,
      deliverables: ['pages', 'portfolio', 'case-studies', 'testimonials', 'blog', 'newsletter', 'analytics'],
      pageCountHint: 12,
    },
  ] as const,

  featured: false,
  badge: 'New',
  order: 3,
} as const satisfies MarketingOffer

export const PREMIUM_OFFER = {
  offerId: asOfferId('premium-full-service'),
  title: 'Premium Full Service',
  subtitle: 'White glove website experience',
  description: 'A fully custom website built with dedicated support, unlimited revisions, and priority delivery.',

  siteType: 'universal',
  category: 'website',
  status: 'active',

  idealFor: ['High-growth companies', 'Professional firms', 'Premium brands'],
  quickFeatures: ['Custom design', 'Priority support', 'Unlimited revisions', 'Strategy session'],

  recommendedTemplate: 'premium-custom',
  compliance: ['privacy-policy-placeholder', 'accessibility-basics', 'cookie-banner-optional'],

  tiers: [
    {
      id: asTierId('premium-full'),
      name: 'Full Service',
      priceCents: 4999_00,
      currency: 'USD',
      period: 'one-time',
      description: 'Complete premium package',
      features: [
        'Custom design consultation',
        'All features from any vertical',
        'Priority 48-hour delivery',
        'Unlimited revisions (30 days)',
        'Dedicated support contact',
        'Performance optimization',
        '1-hour strategy session',
        '90-day maintenance included',
      ],
      highlighted: true,
      badge: 'Best Value',
      delivery: { value: 48, unit: 'hours' },
      depositCents: 1500_00,
      deliverables: ['pages', 'seo-advanced', 'analytics', 'hosting-setup', 'domain-setup'],
      pageCountHint: 12,
    },
  ] as const,

  featured: true,
  badge: 'Best Value',
  order: 4,
} as const satisfies MarketingOffer

// ─────────────────────────────────────────────────────────────
// Collection + Indexes
// ─────────────────────────────────────────────────────────────

export const MARKETING_OFFERS = [LAW_FIRM_OFFER, SMB_OFFER, PREMIUM_OFFER] as const

export const OFFERS_SORTED: readonly MarketingOffer[] = [...MARKETING_OFFERS].sort((a, b) => a.order - b.order)

export const OFFER_BY_ID: ReadonlyMap<OfferId, MarketingOffer> = new Map(
  OFFERS_SORTED.map(o => [o.offerId, o])
)

export const TIERS_BY_ID: ReadonlyMap<TierId, { offer: MarketingOffer; tier: OfferTier }> = new Map(
  OFFERS_SORTED.flatMap(offer => offer.tiers.map(tier => [tier.id, { offer, tier }] as const))
)

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export function getOfferById(offerId: OfferId): MarketingOffer | undefined {
  return OFFER_BY_ID.get(offerId)
}

export function getTierById(tierId: TierId): { offer: MarketingOffer; tier: OfferTier } | undefined {
  return TIERS_BY_ID.get(tierId)
}

export function getFeaturedOffer(): MarketingOffer | undefined {
  return OFFERS_SORTED.find(o => o.featured)
}

export function getPopularTier(offer: MarketingOffer): OfferTier | undefined {
  return offer.tiers.find(t => t.highlighted)
}

export function formatPriceCents(amountCents: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0, // set to 2 if you want cents shown
  }).format(amountCents / 100)
}

export function formatDelivery(delivery: DeliveryWindow): string {
  const unit = delivery.unit === 'hours' ? 'hour' : 'day'
  const plural = delivery.value === 1 ? unit : `${unit}s`
  return `${delivery.value} ${plural}`
}

/**
 * Filter offers by site generation type.
 * Universal offers always included.
 */
export function getOffersBySiteType(siteType: SiteGenerationType | 'all'): MarketingOffer[] {
  if (siteType === 'all') return [...OFFERS_SORTED]
  return OFFERS_SORTED.filter(o => o.siteType === siteType || o.siteType === 'universal')
}

// ─────────────────────────────────────────────────────────────
// Validation (fail fast in dev/test)
// ─────────────────────────────────────────────────────────────

export function validateOffers(offers: readonly MarketingOffer[]): void {
  const offerIds = new Set<string>()
  const orders = new Set<number>()
  let featuredCount = 0

  for (const offer of offers) {
    if (offerIds.has(offer.offerId)) throw new Error(`Duplicate offerId: ${offer.offerId}`)
    offerIds.add(offer.offerId)

    if (orders.has(offer.order)) throw new Error(`Duplicate offer order: ${offer.order} (${offer.offerId})`)
    orders.add(offer.order)

    if (offer.featured) featuredCount++

    const tierIds = new Set<string>()
    let highlightedCount = 0

    for (const tier of offer.tiers) {
      if (tierIds.has(tier.id)) throw new Error(`Duplicate tier id within offer ${offer.offerId}: ${tier.id}`)
      tierIds.add(tier.id)

      if (tier.highlighted) highlightedCount++

      if (!tier.priceCents || tier.priceCents < 0) throw new Error(`Invalid priceCents for ${offer.offerId}/${tier.id}`)
      if (!tier.depositCents) {
        // ok
      } else if (tier.depositCents < 0 || tier.depositCents > tier.priceCents) {
        throw new Error(`Invalid depositCents for ${offer.offerId}/${tier.id}`)
      }
      if (tier.delivery.value <= 0) throw new Error(`Invalid delivery for ${offer.offerId}/${tier.id}`)
    }

    if (highlightedCount > 1) throw new Error(`Multiple highlighted tiers for offer ${offer.offerId}`)
  }

  if (featuredCount > 1) throw new Error(`Multiple featured offers detected`)
}

// Safe to call from app startup in dev, or from tests/CI
// Avoid hard dependency on Vite env. Call this from your app bootstrap if desired.
validateOffers(OFFERS_SORTED)