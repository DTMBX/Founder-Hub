/**
 * Site Configuration
 * 
 * Central configuration file for site customization.
 * All values can be overridden via environment variables (VITE_*)
 * or by editing this file directly for generated sites.
 */

// ============================================================================
// SITE IDENTITY
// ============================================================================

export const siteConfig = {
  // Basic Info
  name: import.meta.env.VITE_SITE_NAME || 'Founder-Hub',
  tagline: import.meta.env.VITE_SITE_TAGLINE || 'Professional Services',
  domain: import.meta.env.VITE_SITE_DOMAIN || 'localhost',
  siteId: import.meta.env.VITE_SITE_ID || 'founder-hub',
  
  // Business Details
  business: {
    legalName: import.meta.env.VITE_BUSINESS_LEGAL_NAME || '',
    phone: import.meta.env.VITE_BUSINESS_PHONE || '',
    email: import.meta.env.VITE_BUSINESS_EMAIL || '',
    address: {
      street: import.meta.env.VITE_ADDRESS_STREET || '',
      city: import.meta.env.VITE_ADDRESS_CITY || '',
      state: import.meta.env.VITE_ADDRESS_STATE || '',
      zip: import.meta.env.VITE_ADDRESS_ZIP || '',
    },
    hours: import.meta.env.VITE_BUSINESS_HOURS || 'Mon-Fri 9am-5pm',
  },
  
  // Social Links
  social: {
    facebook: import.meta.env.VITE_SOCIAL_FACEBOOK || '',
    twitter: import.meta.env.VITE_SOCIAL_TWITTER || '',
    instagram: import.meta.env.VITE_SOCIAL_INSTAGRAM || '',
    linkedin: import.meta.env.VITE_SOCIAL_LINKEDIN || '',
    youtube: import.meta.env.VITE_SOCIAL_YOUTUBE || '',
  },
}

// ============================================================================
// SEO CONFIGURATION
// ============================================================================

export const seoConfig = {
  // Meta Tags
  title: import.meta.env.VITE_SEO_TITLE || siteConfig.name,
  description: import.meta.env.VITE_SEO_DESCRIPTION || `${siteConfig.name} - ${siteConfig.tagline}`,
  keywords: (import.meta.env.VITE_SEO_KEYWORDS || '').split(',').filter(Boolean),
  
  // Open Graph
  ogImage: import.meta.env.VITE_OG_IMAGE || '/og/default.png',
  ogType: import.meta.env.VITE_OG_TYPE || 'website',
  
  // Twitter Card
  twitterCard: import.meta.env.VITE_TWITTER_CARD || 'summary_large_image',
  twitterHandle: import.meta.env.VITE_TWITTER_HANDLE || '',
  
  // Local Business Schema
  schema: {
    type: import.meta.env.VITE_SCHEMA_TYPE || 'LocalBusiness',
    priceRange: import.meta.env.VITE_SCHEMA_PRICE_RANGE || '$$',
  },
  
  // Sitemap
  generateSitemap: import.meta.env.VITE_GENERATE_SITEMAP !== 'false',
  sitemapPriorities: {
    home: 1.0,
    services: 0.9,
    about: 0.8,
    contact: 0.7,
  },
}

// ============================================================================
// THEME & STYLING
// ============================================================================

export type ThemePreset = 'default' | 'law-firm' | 'medical' | 'contractor' | 'nonprofit' | 'ecommerce'

export const themeConfig = {
  preset: (import.meta.env.VITE_THEME_PRESET || 'default') as ThemePreset,
  
  // Color Palette (CSS custom properties)
  colors: {
    primary: import.meta.env.VITE_COLOR_PRIMARY || '#2d3748',
    secondary: import.meta.env.VITE_COLOR_SECONDARY || '#4a5568',
    accent: import.meta.env.VITE_COLOR_ACCENT || '#3182ce',
    background: import.meta.env.VITE_COLOR_BACKGROUND || '#0a0a0a',
    foreground: import.meta.env.VITE_COLOR_FOREGROUND || '#fafafa',
    muted: import.meta.env.VITE_COLOR_MUTED || '#27272a',
    border: import.meta.env.VITE_COLOR_BORDER || '#27272a',
  },
  
  // Typography
  fonts: {
    heading: import.meta.env.VITE_FONT_HEADING || 'Inter',
    body: import.meta.env.VITE_FONT_BODY || 'Inter',
    mono: import.meta.env.VITE_FONT_MONO || 'JetBrains Mono',
  },
  
  // Effects
  effects: {
    glassmorphism: import.meta.env.VITE_EFFECT_GLASS !== 'false',
    animations: import.meta.env.VITE_EFFECT_ANIMATIONS !== 'false',
    particles: import.meta.env.VITE_EFFECT_PARTICLES === 'true',
    gradients: import.meta.env.VITE_EFFECT_GRADIENTS !== 'false',
    shadows: import.meta.env.VITE_EFFECT_SHADOWS !== 'false',
  },
  
  // Layout
  layout: {
    maxWidth: import.meta.env.VITE_LAYOUT_MAX_WIDTH || '1400px',
    containerPadding: import.meta.env.VITE_LAYOUT_PADDING || '1.5rem',
    sectionSpacing: import.meta.env.VITE_LAYOUT_SECTION_SPACING || '6rem',
    noWhitespace: import.meta.env.VITE_LAYOUT_NO_WHITESPACE === 'true',
  },
}

// ============================================================================
// CONTACT FORM CONFIGURATION
// ============================================================================

export interface ContactField {
  name: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date' | 'file'
  required: boolean
  placeholder?: string
  options?: string[] // For select fields
  validation?: string // Regex pattern
  maxLength?: number
}

export const contactConfig = {
  // Form Behavior
  submitEndpoint: import.meta.env.VITE_CONTACT_ENDPOINT || '/api/contact',
  emailTo: import.meta.env.VITE_CONTACT_EMAIL_TO || siteConfig.business.email,
  successMessage: import.meta.env.VITE_CONTACT_SUCCESS || 'Thank you! We\'ll be in touch shortly.',
  
  // Spam Protection
  honeypotField: 'website', // Hidden field to catch bots
  enableRecaptcha: import.meta.env.VITE_RECAPTCHA_ENABLED === 'true',
  recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  
  // Form Fields (customize per site)
  fields: parseContactFields(import.meta.env.VITE_CONTACT_FIELDS) || [
    { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'John Smith' },
    { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@example.com' },
    { name: 'phone', label: 'Phone Number', type: 'phone', required: false, placeholder: '(555) 123-4567' },
    { name: 'subject', label: 'Subject', type: 'select', required: true, options: ['General Inquiry', 'Service Request', 'Support', 'Other'] },
    { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'How can we help you?', maxLength: 2000 },
  ] as ContactField[],
  
  // Lead Categories (for CRM/admin)
  leadCategories: parseList(import.meta.env.VITE_LEAD_CATEGORIES) || ['General Inquiry', 'Service Request'],
}

// ============================================================================
// E-COMMERCE / STRIPE CONFIGURATION
// ============================================================================

export const stripeConfig = {
  enabled: import.meta.env.VITE_STRIPE_ENABLED === 'true',
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  // NEVER put secret key in frontend!
  
  // Payment Settings
  currency: import.meta.env.VITE_STRIPE_CURRENCY || 'usd',
  allowedCountries: parseList(import.meta.env.VITE_STRIPE_COUNTRIES) || ['US'],
  
  // Checkout Behavior
  successUrl: import.meta.env.VITE_STRIPE_SUCCESS_URL || '/checkout/success',
  cancelUrl: import.meta.env.VITE_STRIPE_CANCEL_URL || '/checkout/cancel',
  
  // Tax Settings
  automaticTax: import.meta.env.VITE_STRIPE_AUTO_TAX === 'true',
  taxRates: parseList(import.meta.env.VITE_STRIPE_TAX_RATES) || [],
}

export interface ProductCard {
  id: string
  stripePriceId: string // Stripe Price ID for checkout
  name: string
  description: string
  price: number
  currency: string
  image?: string
  category?: string
  featured?: boolean
  inStock?: boolean
  metadata?: Record<string, string>
}

// Products loaded from env or fetched from Stripe
export const productsConfig = {
  // Inline products (for simple sites)
  products: parseProducts(import.meta.env.VITE_PRODUCTS) || [],
  
  // Or fetch from Stripe (for dynamic inventory)
  fetchFromStripe: import.meta.env.VITE_PRODUCTS_FROM_STRIPE === 'true',
  
  // Display Settings
  showPrices: import.meta.env.VITE_PRODUCTS_SHOW_PRICES !== 'false',
  showStock: import.meta.env.VITE_PRODUCTS_SHOW_STOCK === 'true',
  gridColumns: parseInt(import.meta.env.VITE_PRODUCTS_COLUMNS || '3'),
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const features = {
  // Core Features
  billing: import.meta.env.VITE_ENABLE_BILLING === 'true',
  leads: import.meta.env.VITE_ENABLE_LEADS !== 'false',
  ecommerce: import.meta.env.VITE_ENABLE_ECOMMERCE === 'true',
  
  // Page Features
  blog: import.meta.env.VITE_ENABLE_BLOG === 'true',
  gallery: import.meta.env.VITE_ENABLE_GALLERY === 'true',
  testimonials: import.meta.env.VITE_ENABLE_TESTIMONIALS !== 'false',
  faq: import.meta.env.VITE_ENABLE_FAQ === 'true',
  
  // Integrations
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  chat: import.meta.env.VITE_ENABLE_CHAT === 'true',
  newsletter: import.meta.env.VITE_ENABLE_NEWSLETTER === 'true',
  
  // Admin Features
  adminPanel: import.meta.env.VITE_ENABLE_ADMIN !== 'false',
  auditLog: import.meta.env.VITE_ENABLE_AUDIT !== 'false',
}

// ============================================================================
// ANALYTICS CONFIGURATION
// ============================================================================

export const analyticsConfig = {
  // Google Analytics
  googleAnalyticsId: import.meta.env.VITE_GA_ID || '',
  
  // Facebook Pixel
  facebookPixelId: import.meta.env.VITE_FB_PIXEL_ID || '',
  
  // Custom Events
  trackFormSubmissions: import.meta.env.VITE_TRACK_FORMS !== 'false',
  trackClicks: import.meta.env.VITE_TRACK_CLICKS === 'true',
  trackScrollDepth: import.meta.env.VITE_TRACK_SCROLL === 'true',
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseList(value: string | undefined): string[] {
  if (!value) return []
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

function parseContactFields(value: string | undefined): ContactField[] | null {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function parseProducts(value: string | undefined): ProductCard[] {
  if (!value) return []
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  site: siteConfig,
  seo: seoConfig,
  theme: themeConfig,
  contact: contactConfig,
  stripe: stripeConfig,
  products: productsConfig,
  features,
  analytics: analyticsConfig,
}
