/**
 * Media Selector - Deterministic Image Selection
 *
 * Uses seeded pseudo-random number generation to select
 * unique images per siteId, ensuring:
 * 1. Same siteId always gets the same images
 * 2. Different siteIds get different image combinations
 * 3. Selection is reproducible and auditable
 */

import type {
  StockImageRef,
  MediaCategory,
  MediaKit,
  MediaKitMeta,
  MediaSelectionOptions,
  DEFAULT_SELECTION_OPTIONS,
} from './media.types'
import { getImagePool, MEDIA_CATALOG } from './media.catalog'

// ─── Seeded PRNG ─────────────────────────────────────────────

/**
 * Mulberry32 PRNG - Fast, good distribution, deterministic.
 * Returns a function that generates numbers between 0 and 1.
 */
function createSeededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Convert a string seed to a numeric seed using FNV-1a hash.
 */
function hashString(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash
}

/**
 * Create a seeded random generator from a string seed.
 */
export function createSiteRandom(siteId: string, salt = ''): () => number {
  const seed = hashString(`${siteId}:${salt}`)
  return createSeededRandom(seed)
}

// ─── Selection Algorithms ────────────────────────────────────

/**
 * Shuffle an array using Fisher-Yates with seeded random.
 */
function shuffleArray<T>(array: T[], random: () => number): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Select a single item from an array using seeded random.
 */
export function selectOne<T>(items: T[], random: () => number): T {
  const index = Math.floor(random() * items.length)
  return items[index]
}

/**
 * Select multiple unique items from an array using seeded random.
 */
export function selectMany<T>(items: T[], count: number, random: () => number): T[] {
  const shuffled = shuffleArray(items, random)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

/**
 * Score an image based on preference matching.
 */
function scoreImage(
  image: StockImageRef,
  preferredTone?: StockImageRef['colorTone'],
  preferredTags?: string[],
): number {
  let score = 0
  if (preferredTone && image.colorTone === preferredTone) {
    score += 10
  }
  if (preferredTags) {
    for (const tag of preferredTags) {
      if (image.tags.includes(tag)) {
        score += 5
      }
    }
  }
  return score
}

/**
 * Select images with preference weighting.
 * Higher-scored images have better chance of selection.
 */
export function selectWithPreference<T extends StockImageRef>(
  items: T[],
  count: number,
  random: () => number,
  preferredTone?: StockImageRef['colorTone'],
  preferredTags?: string[],
): T[] {
  // Score items
  const scored = items.map(item => ({
    item,
    score: scoreImage(item, preferredTone, preferredTags) + random() * 5, // Add randomness
  }))

  // Sort by score (higher first)
  scored.sort((a, b) => b.score - a.score)

  // Take top items, then shuffle to vary order
  const top = scored.slice(0, Math.max(count * 2, items.length))
  const selected = selectMany(
    top.map(s => s.item),
    count,
    random,
  )

  return selected
}

// ─── Media Kit Generation ────────────────────────────────────

/**
 * Generator version for tracking.
 */
export const MEDIA_KIT_VERSION = '1.0.0'

/**
 * Generate a complete media kit for a site.
 *
 * @param siteId - Unique site identifier (seed)
 * @param category - Media category for the site
 * @param options - Selection options
 * @returns Complete media kit with all selected images
 *
 * @example
 * ```ts
 * const kit = generateMediaKit('site-abc123', 'legal-criminal', {
 *   galleryCount: 6,
 *   preferredTone: 'dark',
 * })
 * console.log(kit.heroImage.placeholderUrl)
 * ```
 */
export function generateMediaKit(
  siteId: string,
  category: MediaCategory,
  options: MediaSelectionOptions = {},
): MediaKit {
  const opts: Required<MediaSelectionOptions> = {
    galleryCount: options.galleryCount ?? 4,
    teamCount: options.teamCount ?? 3,
    preferredTone: options.preferredTone ?? 'neutral',
    preferredTags: options.preferredTags ?? [],
  }

  const pool = getImagePool(category)

  // Create separate random generators for each selection
  // This ensures changing one aspect doesn't shift others
  const heroRandom = createSiteRandom(siteId, 'hero')
  const galleryRandom = createSiteRandom(siteId, 'gallery')
  const teamRandom = createSiteRandom(siteId, 'team')
  const bgRandom = createSiteRandom(siteId, 'background')
  const ogRandom = createSiteRandom(siteId, 'og')

  // Select images
  const heroImage = selectOne(
    pool.heroImages.length > 0 ? pool.heroImages : [pool.heroImages[0]],
    heroRandom,
  )

  const galleryImages = selectWithPreference(
    pool.galleryImages,
    opts.galleryCount,
    galleryRandom,
    opts.preferredTone,
    opts.preferredTags,
  )

  const teamImages = selectMany(pool.teamImages, opts.teamCount, teamRandom)
  const backgroundImage = selectOne(pool.backgroundImages, bgRandom)
  const ogImage = selectOne(pool.ogImages, ogRandom)

  const meta: MediaKitMeta = {
    generatedAt: Date.now(),
    seed: siteId,
    generatorVersion: MEDIA_KIT_VERSION,
  }

  return {
    siteId,
    category,
    heroImage,
    galleryImages,
    teamImages,
    backgroundImage,
    ogImage,
    meta,
  }
}

/**
 * Regenerate just the hero image for a site.
 * Useful when user wants a different hero without changing everything.
 */
export function regenerateHeroImage(
  siteId: string,
  category: MediaCategory,
  excludeIds: string[] = [],
): StockImageRef {
  const pool = getImagePool(category)
  const available = pool.heroImages.filter(img => !excludeIds.includes(img.id))

  if (available.length === 0) {
    // Fall back to full pool if all excluded
    return selectOne(pool.heroImages, createSiteRandom(siteId, 'hero-regen'))
  }

  return selectOne(available, createSiteRandom(siteId, 'hero-regen'))
}

/**
 * Get a specific image by ID from the catalog.
 */
export function getImageById(imageId: string): StockImageRef | null {
  // Search all pools
  const allPools = Object.values(MEDIA_CATALOG)
  for (const pool of allPools) {
    for (const img of [
      ...pool.heroImages,
      ...pool.galleryImages,
      ...pool.teamImages,
      ...pool.backgroundImages,
      ...pool.ogImages,
    ]) {
      if (img.id === imageId) {
        return img
      }
    }
  }
  return null
}

/**
 * Validate that a media kit contains no duplicate images.
 */
export function validateMediaKit(kit: MediaKit): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  const usedIds = new Set<string>()

  const checkDupe = (img: StockImageRef, context: string) => {
    if (usedIds.has(img.id)) {
      issues.push(`Duplicate image ${img.id} in ${context}`)
    }
    usedIds.add(img.id)
  }

  checkDupe(kit.heroImage, 'heroImage')
  kit.galleryImages.forEach((img, i) => checkDupe(img, `galleryImages[${i}]`))
  kit.teamImages.forEach((img, i) => checkDupe(img, `teamImages[${i}]`))
  checkDupe(kit.backgroundImage, 'backgroundImage')
  checkDupe(kit.ogImage, 'ogImage')

  return {
    valid: issues.length === 0,
    issues,
  }
}
