/**
 * Media Catalog - Stock Image Pools
 *
 * Provides placeholder image pools for each media category.
 * Uses deterministic placeholder URLs based on image IDs.
 *
 * In demo mode: Uses picsum.photos for royalty-free placeholders
 * In production: Can be swapped with licensed stock images
 */

import type { MediaCategory, ImagePool, StockImageRef } from './media.types'

// ─── Placeholder URL Generator ───────────────────────────────

/**
 * Generate a placeholder image URL.
 * Uses picsum.photos with seeded IDs for consistency.
 */
function placeholder(id: string, width: number, height: number): string {
  // Convert string ID to numeric seed for picsum
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000
  return `https://picsum.photos/seed/${seed}/${width}/${height}`
}

/**
 * Create a hero image placeholder (16:9 wide).
 */
function heroPlaceholder(id: string): string {
  return placeholder(id, 1920, 1080)
}

/**
 * Create a square image placeholder (1:1).
 */
function squarePlaceholder(id: string): string {
  return placeholder(id, 600, 600)
}

/**
 * Create a landscape image placeholder (4:3).
 */
function landscapePlaceholder(id: string): string {
  return placeholder(id, 800, 600)
}

/**
 * Create an OG image placeholder (1200x630).
 */
function ogPlaceholder(id: string): string {
  return placeholder(id, 1200, 630)
}

// ─── Legal Category Images ───────────────────────────────────

const LEGAL_HERO_BASE: StockImageRef[] = [
  { id: 'legal-hero-1', alt: 'Modern office building exterior', aspectRatio: 'hero', colorTone: 'cool', tags: ['architecture', 'professional'], placeholderUrl: heroPlaceholder('legal-hero-1') },
  { id: 'legal-hero-2', alt: 'Law library with wooden shelves', aspectRatio: 'hero', colorTone: 'warm', tags: ['library', 'books', 'traditional'], placeholderUrl: heroPlaceholder('legal-hero-2') },
  { id: 'legal-hero-3', alt: 'Courthouse columns and steps', aspectRatio: 'hero', colorTone: 'neutral', tags: ['courthouse', 'justice'], placeholderUrl: heroPlaceholder('legal-hero-3') },
  { id: 'legal-hero-4', alt: 'City skyline at dusk', aspectRatio: 'hero', colorTone: 'dark', tags: ['skyline', 'urban'], placeholderUrl: heroPlaceholder('legal-hero-4') },
  { id: 'legal-hero-5', alt: 'Conference room with city view', aspectRatio: 'hero', colorTone: 'light', tags: ['office', 'meeting'], placeholderUrl: heroPlaceholder('legal-hero-5') },
  { id: 'legal-hero-6', alt: 'Scales of justice close-up', aspectRatio: 'hero', colorTone: 'neutral', tags: ['scales', 'justice', 'symbol'], placeholderUrl: heroPlaceholder('legal-hero-6') },
  { id: 'legal-hero-7', alt: 'Professional handshake', aspectRatio: 'hero', colorTone: 'warm', tags: ['handshake', 'partnership'], placeholderUrl: heroPlaceholder('legal-hero-7') },
  { id: 'legal-hero-8', alt: 'Gavel on legal documents', aspectRatio: 'hero', colorTone: 'warm', tags: ['gavel', 'documents'], placeholderUrl: heroPlaceholder('legal-hero-8') },
]

const LEGAL_GALLERY_BASE: StockImageRef[] = [
  { id: 'legal-gallery-1', alt: 'Professional meeting in progress', aspectRatio: 'landscape', colorTone: 'neutral', tags: ['meeting', 'team'], placeholderUrl: landscapePlaceholder('legal-gallery-1') },
  { id: 'legal-gallery-2', alt: 'Document review at desk', aspectRatio: 'landscape', colorTone: 'warm', tags: ['documents', 'work'], placeholderUrl: landscapePlaceholder('legal-gallery-2') },
  { id: 'legal-gallery-3', alt: 'Client consultation', aspectRatio: 'landscape', colorTone: 'light', tags: ['consultation', 'client'], placeholderUrl: landscapePlaceholder('legal-gallery-3') },
  { id: 'legal-gallery-4', alt: 'Modern office interior', aspectRatio: 'landscape', colorTone: 'cool', tags: ['office', 'interior'], placeholderUrl: landscapePlaceholder('legal-gallery-4') },
  { id: 'legal-gallery-5', alt: 'Legal team collaboration', aspectRatio: 'landscape', colorTone: 'neutral', tags: ['team', 'collaboration'], placeholderUrl: landscapePlaceholder('legal-gallery-5') },
  { id: 'legal-gallery-6', alt: 'Reception area', aspectRatio: 'landscape', colorTone: 'light', tags: ['reception', 'lobby'], placeholderUrl: landscapePlaceholder('legal-gallery-6') },
  { id: 'legal-gallery-7', alt: 'Law books on shelf', aspectRatio: 'landscape', colorTone: 'warm', tags: ['books', 'library'], placeholderUrl: landscapePlaceholder('legal-gallery-7') },
  { id: 'legal-gallery-8', alt: 'Signing documents', aspectRatio: 'landscape', colorTone: 'neutral', tags: ['signing', 'documents'], placeholderUrl: landscapePlaceholder('legal-gallery-8') },
]

const LEGAL_TEAM_BASE: StockImageRef[] = [
  { id: 'legal-team-1', alt: 'Professional headshot placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('legal-team-1') },
  { id: 'legal-team-2', alt: 'Professional headshot placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('legal-team-2') },
  { id: 'legal-team-3', alt: 'Professional headshot placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('legal-team-3') },
  { id: 'legal-team-4', alt: 'Professional headshot placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('legal-team-4') },
  { id: 'legal-team-5', alt: 'Professional headshot placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('legal-team-5') },
  { id: 'legal-team-6', alt: 'Professional headshot placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('legal-team-6') },
]

const LEGAL_BACKGROUND_BASE: StockImageRef[] = [
  { id: 'legal-bg-1', alt: 'Abstract geometric pattern', aspectRatio: 'hero', colorTone: 'dark', tags: ['abstract', 'pattern'], placeholderUrl: heroPlaceholder('legal-bg-1') },
  { id: 'legal-bg-2', alt: 'Subtle texture background', aspectRatio: 'hero', colorTone: 'light', tags: ['texture', 'subtle'], placeholderUrl: heroPlaceholder('legal-bg-2') },
  { id: 'legal-bg-3', alt: 'Marble texture', aspectRatio: 'hero', colorTone: 'neutral', tags: ['marble', 'elegant'], placeholderUrl: heroPlaceholder('legal-bg-3') },
  { id: 'legal-bg-4', alt: 'Blurred office background', aspectRatio: 'hero', colorTone: 'cool', tags: ['office', 'blur'], placeholderUrl: heroPlaceholder('legal-bg-4') },
]

const LEGAL_OG_BASE: StockImageRef[] = [
  { id: 'legal-og-1', alt: 'Professional law firm social image', aspectRatio: 'og', colorTone: 'neutral', tags: ['social', 'professional'], placeholderUrl: ogPlaceholder('legal-og-1') },
  { id: 'legal-og-2', alt: 'Law firm brand image', aspectRatio: 'og', colorTone: 'cool', tags: ['brand', 'modern'], placeholderUrl: ogPlaceholder('legal-og-2') },
  { id: 'legal-og-3', alt: 'Justice and law social image', aspectRatio: 'og', colorTone: 'warm', tags: ['justice', 'traditional'], placeholderUrl: ogPlaceholder('legal-og-3') },
  { id: 'legal-og-4', alt: 'Legal services social image', aspectRatio: 'og', colorTone: 'dark', tags: ['services', 'dramatic'], placeholderUrl: ogPlaceholder('legal-og-4') },
]

// ─── SMB Category Images ─────────────────────────────────────

const SMB_CONTRACTOR_HERO: StockImageRef[] = [
  { id: 'contractor-hero-1', alt: 'Construction site at sunrise', aspectRatio: 'hero', colorTone: 'warm', tags: ['construction', 'work'], placeholderUrl: heroPlaceholder('contractor-hero-1') },
  { id: 'contractor-hero-2', alt: 'Home renovation in progress', aspectRatio: 'hero', colorTone: 'neutral', tags: ['renovation', 'home'], placeholderUrl: heroPlaceholder('contractor-hero-2') },
  { id: 'contractor-hero-3', alt: 'Professional tools and blueprints', aspectRatio: 'hero', colorTone: 'cool', tags: ['tools', 'blueprints'], placeholderUrl: heroPlaceholder('contractor-hero-3') },
  { id: 'contractor-hero-4', alt: 'Completed home exterior', aspectRatio: 'hero', colorTone: 'light', tags: ['home', 'exterior', 'finished'], placeholderUrl: heroPlaceholder('contractor-hero-4') },
  { id: 'contractor-hero-5', alt: 'Kitchen remodel complete', aspectRatio: 'hero', colorTone: 'warm', tags: ['kitchen', 'interior'], placeholderUrl: heroPlaceholder('contractor-hero-5') },
  { id: 'contractor-hero-6', alt: 'Bathroom renovation', aspectRatio: 'hero', colorTone: 'light', tags: ['bathroom', 'interior'], placeholderUrl: heroPlaceholder('contractor-hero-6') },
]

const SMB_RESTAURANT_HERO: StockImageRef[] = [
  { id: 'restaurant-hero-1', alt: 'Elegant restaurant interior', aspectRatio: 'hero', colorTone: 'warm', tags: ['dining', 'interior'], placeholderUrl: heroPlaceholder('restaurant-hero-1') },
  { id: 'restaurant-hero-2', alt: 'Fresh cuisine dish', aspectRatio: 'hero', colorTone: 'warm', tags: ['food', 'cuisine'], placeholderUrl: heroPlaceholder('restaurant-hero-2') },
  { id: 'restaurant-hero-3', alt: 'Cozy cafe atmosphere', aspectRatio: 'hero', colorTone: 'warm', tags: ['cafe', 'cozy'], placeholderUrl: heroPlaceholder('restaurant-hero-3') },
  { id: 'restaurant-hero-4', alt: 'Kitchen action shot', aspectRatio: 'hero', colorTone: 'neutral', tags: ['kitchen', 'chef'], placeholderUrl: heroPlaceholder('restaurant-hero-4') },
  { id: 'restaurant-hero-5', alt: 'Outdoor dining patio', aspectRatio: 'hero', colorTone: 'light', tags: ['patio', 'outdoor'], placeholderUrl: heroPlaceholder('restaurant-hero-5') },
  { id: 'restaurant-hero-6', alt: 'Bar and cocktail area', aspectRatio: 'hero', colorTone: 'dark', tags: ['bar', 'drinks'], placeholderUrl: heroPlaceholder('restaurant-hero-6') },
]

const SMB_MEDICAL_HERO: StockImageRef[] = [
  { id: 'medical-hero-1', alt: 'Modern medical facility', aspectRatio: 'hero', colorTone: 'light', tags: ['facility', 'modern'], placeholderUrl: heroPlaceholder('medical-hero-1') },
  { id: 'medical-hero-2', alt: 'Healthcare professional', aspectRatio: 'hero', colorTone: 'cool', tags: ['healthcare', 'professional'], placeholderUrl: heroPlaceholder('medical-hero-2') },
  { id: 'medical-hero-3', alt: 'Clean medical office', aspectRatio: 'hero', colorTone: 'light', tags: ['office', 'clean'], placeholderUrl: heroPlaceholder('medical-hero-3') },
  { id: 'medical-hero-4', alt: 'Patient care consultation', aspectRatio: 'hero', colorTone: 'warm', tags: ['consultation', 'care'], placeholderUrl: heroPlaceholder('medical-hero-4') },
  { id: 'medical-hero-5', alt: 'Medical equipment', aspectRatio: 'hero', colorTone: 'cool', tags: ['equipment', 'technology'], placeholderUrl: heroPlaceholder('medical-hero-5') },
  { id: 'medical-hero-6', alt: 'Wellness and health', aspectRatio: 'hero', colorTone: 'light', tags: ['wellness', 'health'], placeholderUrl: heroPlaceholder('medical-hero-6') },
]

const SMB_SALON_HERO: StockImageRef[] = [
  { id: 'salon-hero-1', alt: 'Stylish salon interior', aspectRatio: 'hero', colorTone: 'warm', tags: ['salon', 'interior'], placeholderUrl: heroPlaceholder('salon-hero-1') },
  { id: 'salon-hero-2', alt: 'Beauty treatment in progress', aspectRatio: 'hero', colorTone: 'light', tags: ['treatment', 'beauty'], placeholderUrl: heroPlaceholder('salon-hero-2') },
  { id: 'salon-hero-3', alt: 'Modern spa atmosphere', aspectRatio: 'hero', colorTone: 'neutral', tags: ['spa', 'relaxation'], placeholderUrl: heroPlaceholder('salon-hero-3') },
  { id: 'salon-hero-4', alt: 'Hair styling station', aspectRatio: 'hero', colorTone: 'cool', tags: ['hair', 'styling'], placeholderUrl: heroPlaceholder('salon-hero-4') },
  { id: 'salon-hero-5', alt: 'Makeup and beauty products', aspectRatio: 'hero', colorTone: 'warm', tags: ['makeup', 'products'], placeholderUrl: heroPlaceholder('salon-hero-5') },
  { id: 'salon-hero-6', alt: 'Relaxing salon ambiance', aspectRatio: 'hero', colorTone: 'warm', tags: ['ambiance', 'relaxing'], placeholderUrl: heroPlaceholder('salon-hero-6') },
]

const SMB_AUTO_HERO: StockImageRef[] = [
  { id: 'auto-hero-1', alt: 'Auto service garage', aspectRatio: 'hero', colorTone: 'neutral', tags: ['garage', 'service'], placeholderUrl: heroPlaceholder('auto-hero-1') },
  { id: 'auto-hero-2', alt: 'Mechanic at work', aspectRatio: 'hero', colorTone: 'cool', tags: ['mechanic', 'work'], placeholderUrl: heroPlaceholder('auto-hero-2') },
  { id: 'auto-hero-3', alt: 'Car being serviced', aspectRatio: 'hero', colorTone: 'neutral', tags: ['car', 'service'], placeholderUrl: heroPlaceholder('auto-hero-3') },
  { id: 'auto-hero-4', alt: 'Modern auto shop', aspectRatio: 'hero', colorTone: 'cool', tags: ['shop', 'modern'], placeholderUrl: heroPlaceholder('auto-hero-4') },
  { id: 'auto-hero-5', alt: 'Auto detail work', aspectRatio: 'hero', colorTone: 'warm', tags: ['detail', 'quality'], placeholderUrl: heroPlaceholder('auto-hero-5') },
  { id: 'auto-hero-6', alt: 'Professional equipment', aspectRatio: 'hero', colorTone: 'neutral', tags: ['equipment', 'professional'], placeholderUrl: heroPlaceholder('auto-hero-6') },
]

const SMB_RETAIL_HERO: StockImageRef[] = [
  { id: 'retail-hero-1', alt: 'Welcoming storefront', aspectRatio: 'hero', colorTone: 'warm', tags: ['storefront', 'retail'], placeholderUrl: heroPlaceholder('retail-hero-1') },
  { id: 'retail-hero-2', alt: 'Product display', aspectRatio: 'hero', colorTone: 'light', tags: ['products', 'display'], placeholderUrl: heroPlaceholder('retail-hero-2') },
  { id: 'retail-hero-3', alt: 'Shopping experience', aspectRatio: 'hero', colorTone: 'warm', tags: ['shopping', 'experience'], placeholderUrl: heroPlaceholder('retail-hero-3') },
  { id: 'retail-hero-4', alt: 'Boutique interior', aspectRatio: 'hero', colorTone: 'light', tags: ['boutique', 'interior'], placeholderUrl: heroPlaceholder('retail-hero-4') },
  { id: 'retail-hero-5', alt: 'Curated product selection', aspectRatio: 'hero', colorTone: 'neutral', tags: ['curated', 'selection'], placeholderUrl: heroPlaceholder('retail-hero-5') },
  { id: 'retail-hero-6', alt: 'Local shop ambiance', aspectRatio: 'hero', colorTone: 'warm', tags: ['local', 'ambiance'], placeholderUrl: heroPlaceholder('retail-hero-6') },
]

const SMB_NONPROFIT_HERO: StockImageRef[] = [
  { id: 'nonprofit-hero-1', alt: 'Community volunteers working', aspectRatio: 'hero', colorTone: 'warm', tags: ['volunteers', 'community'], placeholderUrl: heroPlaceholder('nonprofit-hero-1') },
  { id: 'nonprofit-hero-2', alt: 'Making a difference', aspectRatio: 'hero', colorTone: 'light', tags: ['impact', 'change'], placeholderUrl: heroPlaceholder('nonprofit-hero-2') },
  { id: 'nonprofit-hero-3', alt: 'Team collaboration', aspectRatio: 'hero', colorTone: 'warm', tags: ['team', 'collaboration'], placeholderUrl: heroPlaceholder('nonprofit-hero-3') },
  { id: 'nonprofit-hero-4', alt: 'Community event', aspectRatio: 'hero', colorTone: 'warm', tags: ['event', 'community'], placeholderUrl: heroPlaceholder('nonprofit-hero-4') },
  { id: 'nonprofit-hero-5', alt: 'Helping hands', aspectRatio: 'hero', colorTone: 'neutral', tags: ['helping', 'support'], placeholderUrl: heroPlaceholder('nonprofit-hero-5') },
  { id: 'nonprofit-hero-6', alt: 'Mission in action', aspectRatio: 'hero', colorTone: 'warm', tags: ['mission', 'action'], placeholderUrl: heroPlaceholder('nonprofit-hero-6') },
]

// ─── Agency Category Images ──────────────────────────────────

const AGENCY_HERO_BASE: StockImageRef[] = [
  { id: 'agency-hero-1', alt: 'Creative workspace', aspectRatio: 'hero', colorTone: 'cool', tags: ['workspace', 'creative'], placeholderUrl: heroPlaceholder('agency-hero-1') },
  { id: 'agency-hero-2', alt: 'Modern design studio', aspectRatio: 'hero', colorTone: 'light', tags: ['studio', 'design'], placeholderUrl: heroPlaceholder('agency-hero-2') },
  { id: 'agency-hero-3', alt: 'Team brainstorming session', aspectRatio: 'hero', colorTone: 'warm', tags: ['team', 'brainstorm'], placeholderUrl: heroPlaceholder('agency-hero-3') },
  { id: 'agency-hero-4', alt: 'Tech-forward office', aspectRatio: 'hero', colorTone: 'dark', tags: ['tech', 'modern'], placeholderUrl: heroPlaceholder('agency-hero-4') },
  { id: 'agency-hero-5', alt: 'Abstract creative concept', aspectRatio: 'hero', colorTone: 'cool', tags: ['abstract', 'creative'], placeholderUrl: heroPlaceholder('agency-hero-5') },
  { id: 'agency-hero-6', alt: 'Collaborative work environment', aspectRatio: 'hero', colorTone: 'neutral', tags: ['collaborative', 'work'], placeholderUrl: heroPlaceholder('agency-hero-6') },
  { id: 'agency-hero-7', alt: 'Digital design process', aspectRatio: 'hero', colorTone: 'cool', tags: ['digital', 'process'], placeholderUrl: heroPlaceholder('agency-hero-7') },
  { id: 'agency-hero-8', alt: 'Creative team meeting', aspectRatio: 'hero', colorTone: 'warm', tags: ['meeting', 'team'], placeholderUrl: heroPlaceholder('agency-hero-8') },
]

const AGENCY_GALLERY_BASE: StockImageRef[] = [
  { id: 'agency-gallery-1', alt: 'Project showcase', aspectRatio: 'landscape', colorTone: 'neutral', tags: ['project', 'showcase'], placeholderUrl: landscapePlaceholder('agency-gallery-1') },
  { id: 'agency-gallery-2', alt: 'Design work sample', aspectRatio: 'landscape', colorTone: 'cool', tags: ['design', 'sample'], placeholderUrl: landscapePlaceholder('agency-gallery-2') },
  { id: 'agency-gallery-3', alt: 'Creative process', aspectRatio: 'landscape', colorTone: 'warm', tags: ['creative', 'process'], placeholderUrl: landscapePlaceholder('agency-gallery-3') },
  { id: 'agency-gallery-4', alt: 'Team at work', aspectRatio: 'landscape', colorTone: 'neutral', tags: ['team', 'work'], placeholderUrl: landscapePlaceholder('agency-gallery-4') },
  { id: 'agency-gallery-5', alt: 'Brand identity work', aspectRatio: 'landscape', colorTone: 'light', tags: ['brand', 'identity'], placeholderUrl: landscapePlaceholder('agency-gallery-5') },
  { id: 'agency-gallery-6', alt: 'Digital product', aspectRatio: 'landscape', colorTone: 'cool', tags: ['digital', 'product'], placeholderUrl: landscapePlaceholder('agency-gallery-6') },
  { id: 'agency-gallery-7', alt: 'Marketing campaign', aspectRatio: 'landscape', colorTone: 'warm', tags: ['marketing', 'campaign'], placeholderUrl: landscapePlaceholder('agency-gallery-7') },
  { id: 'agency-gallery-8', alt: 'Website design', aspectRatio: 'landscape', colorTone: 'neutral', tags: ['website', 'design'], placeholderUrl: landscapePlaceholder('agency-gallery-8') },
]

// ─── Generic Fallback Images ─────────────────────────────────

const GENERIC_GALLERY: StockImageRef[] = [
  { id: 'generic-gallery-1', alt: 'Professional service image', aspectRatio: 'landscape', colorTone: 'neutral', tags: ['professional', 'service'], placeholderUrl: landscapePlaceholder('generic-gallery-1') },
  { id: 'generic-gallery-2', alt: 'Business environment', aspectRatio: 'landscape', colorTone: 'cool', tags: ['business', 'environment'], placeholderUrl: landscapePlaceholder('generic-gallery-2') },
  { id: 'generic-gallery-3', alt: 'Quality work', aspectRatio: 'landscape', colorTone: 'warm', tags: ['quality', 'work'], placeholderUrl: landscapePlaceholder('generic-gallery-3') },
  { id: 'generic-gallery-4', alt: 'Team collaboration', aspectRatio: 'landscape', colorTone: 'light', tags: ['team', 'collaboration'], placeholderUrl: landscapePlaceholder('generic-gallery-4') },
  { id: 'generic-gallery-5', alt: 'Customer service', aspectRatio: 'landscape', colorTone: 'warm', tags: ['customer', 'service'], placeholderUrl: landscapePlaceholder('generic-gallery-5') },
  { id: 'generic-gallery-6', alt: 'Modern workspace', aspectRatio: 'landscape', colorTone: 'neutral', tags: ['modern', 'workspace'], placeholderUrl: landscapePlaceholder('generic-gallery-6') },
]

const GENERIC_TEAM: StockImageRef[] = [
  { id: 'generic-team-1', alt: 'Team member placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('generic-team-1') },
  { id: 'generic-team-2', alt: 'Team member placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('generic-team-2') },
  { id: 'generic-team-3', alt: 'Team member placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('generic-team-3') },
  { id: 'generic-team-4', alt: 'Team member placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('generic-team-4') },
  { id: 'generic-team-5', alt: 'Team member placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('generic-team-5') },
  { id: 'generic-team-6', alt: 'Team member placeholder', aspectRatio: 'portrait', colorTone: 'neutral', tags: ['headshot'], placeholderUrl: squarePlaceholder('generic-team-6') },
]

const GENERIC_BACKGROUND: StockImageRef[] = [
  { id: 'generic-bg-1', alt: 'Abstract background', aspectRatio: 'hero', colorTone: 'dark', tags: ['abstract'], placeholderUrl: heroPlaceholder('generic-bg-1') },
  { id: 'generic-bg-2', alt: 'Subtle pattern', aspectRatio: 'hero', colorTone: 'light', tags: ['pattern'], placeholderUrl: heroPlaceholder('generic-bg-2') },
  { id: 'generic-bg-3', alt: 'Gradient background', aspectRatio: 'hero', colorTone: 'cool', tags: ['gradient'], placeholderUrl: heroPlaceholder('generic-bg-3') },
  { id: 'generic-bg-4', alt: 'Texture background', aspectRatio: 'hero', colorTone: 'neutral', tags: ['texture'], placeholderUrl: heroPlaceholder('generic-bg-4') },
]

const GENERIC_OG: StockImageRef[] = [
  { id: 'generic-og-1', alt: 'Social share image', aspectRatio: 'og', colorTone: 'neutral', tags: ['social'], placeholderUrl: ogPlaceholder('generic-og-1') },
  { id: 'generic-og-2', alt: 'Brand image', aspectRatio: 'og', colorTone: 'cool', tags: ['brand'], placeholderUrl: ogPlaceholder('generic-og-2') },
  { id: 'generic-og-3', alt: 'Professional image', aspectRatio: 'og', colorTone: 'warm', tags: ['professional'], placeholderUrl: ogPlaceholder('generic-og-3') },
  { id: 'generic-og-4', alt: 'Business image', aspectRatio: 'og', colorTone: 'dark', tags: ['business'], placeholderUrl: ogPlaceholder('generic-og-4') },
]

// ─── Build Image Pools ───────────────────────────────────────

/**
 * Create an image pool for a category.
 */
function createImagePool(
  category: MediaCategory,
  heroImages: StockImageRef[],
  galleryImages?: StockImageRef[],
  teamImages?: StockImageRef[],
  backgroundImages?: StockImageRef[],
  ogImages?: StockImageRef[],
): ImagePool {
  return {
    category,
    heroImages,
    galleryImages: galleryImages ?? GENERIC_GALLERY,
    teamImages: teamImages ?? GENERIC_TEAM,
    backgroundImages: backgroundImages ?? GENERIC_BACKGROUND,
    ogImages: ogImages ?? GENERIC_OG,
  }
}

// ─── Media Catalog ───────────────────────────────────────────

/**
 * Complete media catalog mapping categories to image pools.
 */
export const MEDIA_CATALOG: Record<MediaCategory, ImagePool> = {
  // Legal categories
  'legal-general': createImagePool('legal-general', LEGAL_HERO_BASE, LEGAL_GALLERY_BASE, LEGAL_TEAM_BASE, LEGAL_BACKGROUND_BASE, LEGAL_OG_BASE),
  'legal-criminal': createImagePool('legal-criminal', [...LEGAL_HERO_BASE].reverse(), LEGAL_GALLERY_BASE, LEGAL_TEAM_BASE, LEGAL_BACKGROUND_BASE, LEGAL_OG_BASE),
  'legal-injury': createImagePool('legal-injury', LEGAL_HERO_BASE, LEGAL_GALLERY_BASE, LEGAL_TEAM_BASE, LEGAL_BACKGROUND_BASE, LEGAL_OG_BASE),
  'legal-family': createImagePool('legal-family', LEGAL_HERO_BASE.filter(h => h.colorTone === 'warm' || h.colorTone === 'light'), LEGAL_GALLERY_BASE, LEGAL_TEAM_BASE, LEGAL_BACKGROUND_BASE, LEGAL_OG_BASE),
  'legal-immigration': createImagePool('legal-immigration', LEGAL_HERO_BASE, LEGAL_GALLERY_BASE, LEGAL_TEAM_BASE, LEGAL_BACKGROUND_BASE, LEGAL_OG_BASE),
  'legal-realestate': createImagePool('legal-realestate', LEGAL_HERO_BASE.filter(h => h.tags.includes('building') || h.colorTone === 'warm'), LEGAL_GALLERY_BASE, LEGAL_TEAM_BASE, LEGAL_BACKGROUND_BASE, LEGAL_OG_BASE),
  'legal-civilrights': createImagePool('legal-civilrights', LEGAL_HERO_BASE.filter(h => h.tags.includes('justice') || h.colorTone === 'neutral'), LEGAL_GALLERY_BASE, LEGAL_TEAM_BASE, LEGAL_BACKGROUND_BASE, LEGAL_OG_BASE),
  'legal-business': createImagePool('legal-business', LEGAL_HERO_BASE, LEGAL_GALLERY_BASE, LEGAL_TEAM_BASE, LEGAL_BACKGROUND_BASE, LEGAL_OG_BASE),

  // SMB categories
  'smb-contractor': createImagePool('smb-contractor', SMB_CONTRACTOR_HERO),
  'smb-restaurant': createImagePool('smb-restaurant', SMB_RESTAURANT_HERO),
  'smb-medical': createImagePool('smb-medical', SMB_MEDICAL_HERO),
  'smb-salon': createImagePool('smb-salon', SMB_SALON_HERO),
  'smb-auto': createImagePool('smb-auto', SMB_AUTO_HERO),
  'smb-retail': createImagePool('smb-retail', SMB_RETAIL_HERO),
  'smb-nonprofit': createImagePool('smb-nonprofit', SMB_NONPROFIT_HERO),

  // Agency categories
  'agency-general': createImagePool('agency-general', AGENCY_HERO_BASE, AGENCY_GALLERY_BASE),
  'agency-design': createImagePool('agency-design', AGENCY_HERO_BASE.filter(h => h.tags.includes('design') || h.tags.includes('creative')), AGENCY_GALLERY_BASE),
  'agency-marketing': createImagePool('agency-marketing', AGENCY_HERO_BASE, AGENCY_GALLERY_BASE.filter(g => g.tags.includes('marketing') || g.tags.includes('campaign'))),
  'agency-development': createImagePool('agency-development', AGENCY_HERO_BASE.filter(h => h.tags.includes('tech') || h.tags.includes('digital')), AGENCY_GALLERY_BASE),
}

/**
 * Get image pool for a category.
 */
export function getImagePool(category: MediaCategory): ImagePool {
  return MEDIA_CATALOG[category]
}

/**
 * Get all available media categories.
 */
export function getAllMediaCategories(): MediaCategory[] {
  return Object.keys(MEDIA_CATALOG) as MediaCategory[]
}
