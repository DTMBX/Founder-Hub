/**
 * Offers Configuration
 *
 * Central config for all marketing offers.
 * Edit this file to change offer content without touching JSX.
 */

export interface OfferTier {
  id: string
  name: string
  price: number
  currency: string
  period?: string
  description: string
  features: string[]
  highlighted?: boolean
  badge?: string
  ctaLabel?: string
  depositRequired?: number
  deliveryDays?: number
}

export interface MarketingOffer {
  offerId: string
  title: string
  subtitle: string
  description: string
  idealFor: string[]
  quickFeatures: string[]
  tiers: OfferTier[]
  featured?: boolean
  badge?: string
  order: number
}

// ─── Law Firm Offer ──────────────────────────────────────────

export const LAW_FIRM_OFFER: MarketingOffer = {
  offerId: 'law-firm-72-hour-launch',
  title: 'Law Firm Website Launch',
  subtitle: 'Professional website in 72 hours',
  description: 'A complete, ethics-compliant law firm website built to establish credibility and convert visitors into consultations.',
  idealFor: ['Solo practitioners', 'Small law firms', 'Practice expansions'],
  quickFeatures: [
    'Practice area pages',
    'Attorney profiles',
    'Client intake forms',
    'Mobile-first design',
  ],
  tiers: [
    {
      id: 'law-firm-starter',
      name: 'Starter',
      price: 1999,
      currency: 'USD',
      description: 'Essential law firm presence',
      features: [
        'Home + About + Contact pages',
        'Up to 3 practice area pages',
        'Single attorney bio',
        'Contact form with notifications',
        'Mobile responsive',
        'Basic SEO setup',
      ],
      deliveryDays: 5,
      depositRequired: 500,
    },
    {
      id: 'law-firm-professional',
      name: 'Professional',
      price: 2999,
      currency: 'USD',
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
      deliveryDays: 72,
      depositRequired: 750,
    },
    {
      id: 'law-firm-enterprise',
      name: 'Enterprise',
      price: 4999,
      currency: 'USD',
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
      deliveryDays: 48,
      depositRequired: 1500,
    },
  ],
  featured: false,
  badge: 'Popular',
  order: 1,
}

// ─── Small Business Offer ────────────────────────────────────

export const SMB_OFFER: MarketingOffer = {
  offerId: 'small-business-starter',
  title: 'Small Business Starter',
  subtitle: 'Modern website for growing businesses',
  description: 'A professional business website designed to showcase your services and convert visitors into customers.',
  idealFor: ['Service businesses', 'Retail shops', 'Contractors'],
  quickFeatures: [
    'Service showcase',
    'Team profiles',
    'Contact forms',
    'SEO optimized',
  ],
  tiers: [
    {
      id: 'smb-starter',
      name: 'Starter',
      price: 999,
      currency: 'USD',
      description: 'Essential business presence',
      features: [
        'Home + About + Contact pages',
        'Up to 5 service descriptions',
        'Contact form',
        'Mobile responsive',
        'Basic SEO',
      ],
      deliveryDays: 5,
      depositRequired: 300,
    },
    {
      id: 'smb-professional',
      name: 'Professional',
      price: 1499,
      currency: 'USD',
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
      deliveryDays: 72,
      depositRequired: 500,
    },
  ],
  featured: false,
  order: 2,
}

// ─── Agency Offer ────────────────────────────────────────────

export const AGENCY_OFFER: MarketingOffer = {
  offerId: 'digital-agency-pro',
  title: 'Digital Agency Pro',
  subtitle: 'Portfolio site that wins clients',
  description: 'A sophisticated agency website designed to showcase your work and convert prospects into high-value clients.',
  idealFor: ['Creative agencies', 'Marketing firms', 'Design studios'],
  quickFeatures: [
    'Portfolio showcase',
    'Case studies',
    'Team directory',
    'Lead capture',
  ],
  tiers: [
    {
      id: 'agency-starter',
      name: 'Starter',
      price: 2499,
      currency: 'USD',
      description: 'Essential agency presence',
      features: [
        'Home + About + Contact pages',
        'Portfolio grid (up to 12 projects)',
        'Team directory',
        'Contact form',
        'Modern animations',
      ],
      deliveryDays: 5,
      depositRequired: 750,
    },
    {
      id: 'agency-professional',
      name: 'Professional',
      price: 3999,
      currency: 'USD',
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
      deliveryDays: 72,
      depositRequired: 1200,
    },
  ],
  featured: false,
  badge: 'New',
  order: 3,
}

// ─── Premium Full Service ────────────────────────────────────

export const PREMIUM_OFFER: MarketingOffer = {
  offerId: 'premium-full-service',
  title: 'Premium Full Service',
  subtitle: 'White-glove website experience',
  description: 'A fully custom website built with dedicated support, unlimited revisions, and priority delivery.',
  idealFor: ['High-growth companies', 'Professional firms', 'Premium brands'],
  quickFeatures: [
    'Custom design',
    'Priority support',
    'Unlimited revisions',
    'Strategy session',
  ],
  tiers: [
    {
      id: 'premium-full',
      name: 'Full Service',
      price: 4999,
      currency: 'USD',
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
      deliveryDays: 48,
      depositRequired: 1500,
    },
  ],
  featured: true,
  badge: 'Best Value',
  order: 4,
}

// ─── All Offers Array ────────────────────────────────────────

export const MARKETING_OFFERS: MarketingOffer[] = [
  LAW_FIRM_OFFER,
  SMB_OFFER,
  AGENCY_OFFER,
  PREMIUM_OFFER,
].sort((a, b) => a.order - b.order)

// ─── Helpers ─────────────────────────────────────────────────

export function getOfferById(offerId: string): MarketingOffer | undefined {
  return MARKETING_OFFERS.find(o => o.offerId === offerId)
}

export function getFeaturedOffer(): MarketingOffer | undefined {
  return MARKETING_OFFERS.find(o => o.featured)
}

export function getPopularTier(offer: MarketingOffer): OfferTier | undefined {
  return offer.tiers.find(t => t.highlighted)
}

export function formatPrice(amount: number, currency: string): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString()}`
  }
  return `${currency} ${amount.toLocaleString()}`
}
