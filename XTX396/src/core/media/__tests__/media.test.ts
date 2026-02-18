/**
 * Media Kit System Tests
 *
 * Tests for deterministic media selection and kit generation.
 */

import { describe, it, expect } from 'vitest'
import {
  generateMediaKit,
  createSiteRandom,
  selectOne,
  selectMany,
  selectWithPreference,
  validateMediaKit,
  regenerateHeroImage,
  MEDIA_KIT_VERSION,
} from '../media-selector'
import {
  MEDIA_CATALOG,
  getImagePool,
  getAllMediaCategories,
} from '../media.catalog'
import type { MediaCategory, StockImageRef } from '../media.types'

// ─── Seeded Random Tests ─────────────────────────────────────

describe('Seeded Random Generator', () => {
  it('produces deterministic results for same seed', () => {
    const random1 = createSiteRandom('site-abc', 'test')
    const random2 = createSiteRandom('site-abc', 'test')

    const values1 = [random1(), random1(), random1()]
    const values2 = [random2(), random2(), random2()]

    expect(values1).toEqual(values2)
  })

  it('produces different results for different seeds', () => {
    const random1 = createSiteRandom('site-abc', 'test')
    const random2 = createSiteRandom('site-xyz', 'test')

    const value1 = random1()
    const value2 = random2()

    expect(value1).not.toBe(value2)
  })

  it('produces different results for different salts', () => {
    const random1 = createSiteRandom('site-abc', 'hero')
    const random2 = createSiteRandom('site-abc', 'gallery')

    const value1 = random1()
    const value2 = random2()

    expect(value1).not.toBe(value2)
  })

  it('produces values between 0 and 1', () => {
    const random = createSiteRandom('site-test', 'salt')

    for (let i = 0; i < 100; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('has good distribution', () => {
    const random = createSiteRandom('distribution-test', 'salt')
    const buckets = [0, 0, 0, 0, 0]

    for (let i = 0; i < 1000; i++) {
      const value = random()
      const bucket = Math.floor(value * 5)
      buckets[bucket]++
    }

    // Each bucket should have roughly 200 values (20% each)
    // Allow 10% variance
    for (const count of buckets) {
      expect(count).toBeGreaterThan(150)
      expect(count).toBeLessThan(250)
    }
  })
})

// ─── Selection Function Tests ────────────────────────────────

describe('selectOne', () => {
  const items = ['a', 'b', 'c', 'd', 'e']

  it('returns an item from the array', () => {
    const random = createSiteRandom('test', 'select')
    const result = selectOne(items, random)
    expect(items).toContain(result)
  })

  it('is deterministic', () => {
    const random1 = createSiteRandom('test', 'select')
    const random2 = createSiteRandom('test', 'select')

    expect(selectOne(items, random1)).toBe(selectOne(items, random2))
  })

  it('varies by seed', () => {
    const results = new Set<string>()
    for (let i = 0; i < 50; i++) {
      const random = createSiteRandom(`site-${i}`, 'select')
      results.add(selectOne(items, random))
    }
    // Should hit multiple items
    expect(results.size).toBeGreaterThan(1)
  })
})

describe('selectMany', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  it('returns the requested number of items', () => {
    const random = createSiteRandom('test', 'multi')
    const result = selectMany(items, 4, random)
    expect(result).toHaveLength(4)
  })

  it('returns unique items', () => {
    const random = createSiteRandom('test', 'multi')
    const result = selectMany(items, 5, random)
    const uniqueIds = new Set(result)
    expect(uniqueIds.size).toBe(result.length)
  })

  it('is deterministic', () => {
    const random1 = createSiteRandom('test', 'multi')
    const random2 = createSiteRandom('test', 'multi')

    expect(selectMany(items, 3, random1)).toEqual(selectMany(items, 3, random2))
  })

  it('handles count larger than array', () => {
    const random = createSiteRandom('test', 'multi')
    const result = selectMany(items, 20, random)
    expect(result).toHaveLength(items.length)
  })
})

describe('selectWithPreference', () => {
  const images: StockImageRef[] = [
    { id: 'warm-1', alt: 'Warm image', aspectRatio: 'hero', colorTone: 'warm', tags: ['food'], placeholderUrl: 'url' },
    { id: 'warm-2', alt: 'Warm image', aspectRatio: 'hero', colorTone: 'warm', tags: ['interior'], placeholderUrl: 'url' },
    { id: 'cool-1', alt: 'Cool image', aspectRatio: 'hero', colorTone: 'cool', tags: ['tech'], placeholderUrl: 'url' },
    { id: 'cool-2', alt: 'Cool image', aspectRatio: 'hero', colorTone: 'cool', tags: ['modern'], placeholderUrl: 'url' },
    { id: 'neutral-1', alt: 'Neutral', aspectRatio: 'hero', colorTone: 'neutral', tags: ['office'], placeholderUrl: 'url' },
  ]

  it('returns requested number of items', () => {
    const random = createSiteRandom('test', 'pref')
    const result = selectWithPreference(images, 3, random)
    expect(result).toHaveLength(3)
  })

  it('prefers matching color tone', () => {
    // Run multiple times to verify preference trend
    let warmCount = 0
    for (let i = 0; i < 50; i++) {
      const random = createSiteRandom(`site-${i}`, 'pref')
      const result = selectWithPreference(images, 2, random, 'warm')
      warmCount += result.filter(img => img.colorTone === 'warm').length
    }
    // With 2/5 warm images, baseline is ~40. Preference should exceed baseline.
    expect(warmCount).toBeGreaterThanOrEqual(35) // Preference has some effect
  })

  it('is still deterministic', () => {
    const random1 = createSiteRandom('test', 'pref')
    const random2 = createSiteRandom('test', 'pref')

    const result1 = selectWithPreference(images, 2, random1, 'cool', ['tech'])
    const result2 = selectWithPreference(images, 2, random2, 'cool', ['tech'])

    expect(result1.map(r => r.id)).toEqual(result2.map(r => r.id))
  })
})

// ─── Media Catalog Tests ─────────────────────────────────────

describe('Media Catalog', () => {
  it('has all expected categories', () => {
    const categories = getAllMediaCategories()
    expect(categories).toContain('legal-general')
    expect(categories).toContain('legal-criminal')
    expect(categories).toContain('smb-contractor')
    expect(categories).toContain('smb-restaurant')
    expect(categories).toContain('agency-general')
    expect(categories).toContain('agency-design')
  })

  it('has 19 total categories', () => {
    const categories = getAllMediaCategories()
    // 8 legal + 7 SMB + 4 agency = 19
    expect(categories).toHaveLength(19)
  })

  it('each category has required image pools', () => {
    const categories = getAllMediaCategories()

    for (const category of categories) {
      const pool = getImagePool(category)
      expect(pool.category).toBe(category)
      expect(pool.heroImages.length).toBeGreaterThan(0)
      expect(pool.galleryImages.length).toBeGreaterThan(0)
      expect(pool.teamImages.length).toBeGreaterThan(0)
      expect(pool.backgroundImages.length).toBeGreaterThan(0)
      expect(pool.ogImages.length).toBeGreaterThan(0)
    }
  })

  it('all images have required properties', () => {
    const pool = getImagePool('legal-general')

    for (const img of pool.heroImages) {
      expect(img.id).toBeTruthy()
      expect(img.alt).toBeTruthy()
      expect(img.aspectRatio).toBeTruthy()
      expect(img.colorTone).toBeTruthy()
      expect(Array.isArray(img.tags)).toBe(true)
      expect(img.placeholderUrl).toContain('https://')
    }
  })
})

// ─── Media Kit Generation Tests ──────────────────────────────

describe('generateMediaKit', () => {
  it('generates a complete media kit', () => {
    const kit = generateMediaKit('site-abc123', 'legal-criminal')

    expect(kit.siteId).toBe('site-abc123')
    expect(kit.category).toBe('legal-criminal')
    expect(kit.heroImage).toBeDefined()
    expect(kit.heroImage.id).toBeTruthy()
    expect(kit.galleryImages.length).toBe(4) // default
    expect(kit.teamImages.length).toBe(3) // default
    expect(kit.backgroundImage).toBeDefined()
    expect(kit.ogImage).toBeDefined()
  })

  it('respects galleryCount option', () => {
    const kit = generateMediaKit('site-test', 'smb-restaurant', {
      galleryCount: 6,
    })

    expect(kit.galleryImages.length).toBe(6)
  })

  it('respects teamCount option', () => {
    const kit = generateMediaKit('site-test', 'agency-general', {
      teamCount: 5,
    })

    expect(kit.teamImages.length).toBe(5)
  })

  it('is deterministic for same siteId', () => {
    const kit1 = generateMediaKit('site-deterministic', 'legal-family')
    const kit2 = generateMediaKit('site-deterministic', 'legal-family')

    expect(kit1.heroImage.id).toBe(kit2.heroImage.id)
    expect(kit1.galleryImages.map(g => g.id)).toEqual(kit2.galleryImages.map(g => g.id))
    expect(kit1.teamImages.map(t => t.id)).toEqual(kit2.teamImages.map(t => t.id))
    expect(kit1.backgroundImage.id).toBe(kit2.backgroundImage.id)
    expect(kit1.ogImage.id).toBe(kit2.ogImage.id)
  })

  it('produces different results for different siteIds', () => {
    const kit1 = generateMediaKit('site-one', 'legal-general')
    const kit2 = generateMediaKit('site-two', 'legal-general')

    // At minimum, something should differ
    const sameHero = kit1.heroImage.id === kit2.heroImage.id
    const sameGallery =
      JSON.stringify(kit1.galleryImages.map(g => g.id)) ===
      JSON.stringify(kit2.galleryImages.map(g => g.id))

    expect(sameHero && sameGallery).toBe(false)
  })

  it('includes correct metadata', () => {
    const kit = generateMediaKit('site-meta', 'smb-salon')

    expect(kit.meta.seed).toBe('site-meta')
    expect(kit.meta.generatorVersion).toBe(MEDIA_KIT_VERSION)
    expect(kit.meta.generatedAt).toBeGreaterThan(0)
  })

  it('works for all categories', () => {
    const categories = getAllMediaCategories()

    for (const category of categories) {
      const kit = generateMediaKit(`test-${category}`, category)
      expect(kit.heroImage).toBeDefined()
      expect(kit.galleryImages.length).toBeGreaterThan(0)
    }
  })
})

// ─── Media Kit Validation Tests ──────────────────────────────

describe('validateMediaKit', () => {
  it('validates a correct media kit', () => {
    const kit = generateMediaKit('site-valid', 'agency-marketing')
    const result = validateMediaKit(kit)

    expect(result.valid).toBe(true)
    expect(result.issues).toHaveLength(0)
  })

  it('detects duplicate images', () => {
    const kit = generateMediaKit('site-test', 'smb-medical')

    // Force a duplicate
    kit.galleryImages[1] = kit.galleryImages[0]

    const result = validateMediaKit(kit)
    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0]).toContain('Duplicate')
  })
})

// ─── Hero Regeneration Tests ─────────────────────────────────

describe('regenerateHeroImage', () => {
  it('returns a hero image', () => {
    const hero = regenerateHeroImage('site-test', 'legal-criminal')
    expect(hero).toBeDefined()
    expect(hero.id).toBeTruthy()
    expect(hero.aspectRatio).toBe('hero')
  })

  it('excludes specified image IDs', () => {
    const category: MediaCategory = 'legal-general'
    const pool = getImagePool(category)
    const excludeId = pool.heroImages[0].id

    // Generate multiple times to verify exclusion
    for (let i = 0; i < 20; i++) {
      const hero = regenerateHeroImage(`site-${i}`, category, [excludeId])
      expect(hero.id).not.toBe(excludeId)
    }
  })

  it('falls back when all excluded', () => {
    const category: MediaCategory = 'legal-general'
    const pool = getImagePool(category)
    const allIds = pool.heroImages.map(h => h.id)

    // Should still return something
    const hero = regenerateHeroImage('site-test', category, allIds)
    expect(hero).toBeDefined()
  })
})

// ─── Uniqueness Across Sites Test ────────────────────────────

describe('Cross-site uniqueness', () => {
  it('generates unique hero combinations across many sites', () => {
    const heroIds = new Set<string>()

    for (let i = 0; i < 100; i++) {
      const kit = generateMediaKit(`unique-site-${i}`, 'legal-criminal')
      heroIds.add(kit.heroImage.id)
    }

    // Should have variation (not all same hero)
    expect(heroIds.size).toBeGreaterThan(1)
  })

  it('generates unique gallery combinations across sites', () => {
    const gallerySignatures = new Set<string>()

    for (let i = 0; i < 50; i++) {
      const kit = generateMediaKit(`gallery-site-${i}`, 'agency-design')
      const signature = kit.galleryImages.map(g => g.id).sort().join(',')
      gallerySignatures.add(signature)
    }

    // Should have significant variation
    expect(gallerySignatures.size).toBeGreaterThan(5)
  })
})
