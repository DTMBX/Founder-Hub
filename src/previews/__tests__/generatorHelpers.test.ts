/**
 * Generator Helpers Tests
 *
 * Tests for the preview generator helper functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  generateDemoSiteId,
  getDemoPreviewPath,
  getMontageOutputPath,
  getSceneThumbnailPath,
  getMontagePosterPath,
  getMontageMetaPath,
  calculateScrollPositions,
  interpolateScrollPosition,
  getSceneDuration,
  calculateTotalDuration,
  validateScene,
  validateMontage,
  createSceneMeta,
  createPreviewMeta,
  getEffectiveCameraMotion,
  isScrollingMotion,
  getScrollDirection,
  GENERATOR_VERSION,
} from '../generatorHelpers'
import type { PreviewScene, PreviewMontage } from '../preview.types'

// ─── ID Generation ───────────────────────────────────────────

describe('generateDemoSiteId', () => {
  it('generates deterministic IDs', () => {
    const id1 = generateDemoSiteId('offer-1', 'scene-001')
    const id2 = generateDemoSiteId('offer-1', 'scene-001')
    expect(id1).toBe(id2)
  })

  it('generates different IDs for different scenes', () => {
    const id1 = generateDemoSiteId('offer-1', 'scene-001')
    const id2 = generateDemoSiteId('offer-1', 'scene-002')
    expect(id1).not.toBe(id2)
  })

  it('generates different IDs for different offers', () => {
    const id1 = generateDemoSiteId('offer-1', 'scene-001')
    const id2 = generateDemoSiteId('offer-2', 'scene-001')
    expect(id1).not.toBe(id2)
  })

  it('uses seed override when provided', () => {
    const id1 = generateDemoSiteId('offer-1', 'scene-001', 'custom-seed')
    const id2 = generateDemoSiteId('offer-2', 'scene-002', 'custom-seed')
    expect(id1).toBe(id2) // Same seed = same ID
  })

  it('starts with demo- prefix', () => {
    const id = generateDemoSiteId('offer-1', 'scene-001')
    expect(id).toMatch(/^demo-/)
  })

  it('has consistent length', () => {
    const id = generateDemoSiteId('offer-1', 'scene-001')
    expect(id.length).toBe(11) // 'demo-' + 6 chars
  })
})

describe('getDemoPreviewPath', () => {
  it('generates hash-based preview path', () => {
    const path = getDemoPreviewPath('demo-abc123')
    expect(path).toBe('#preview/demo-abc123')
  })
})

// ─── Path Helpers ────────────────────────────────────────────

describe('getMontageOutputPath', () => {
  it('combines base path with offer ID', () => {
    const path = getMontageOutputPath('/output/previews', 'law-firm-launch')
    expect(path).toBe('/output/previews/law-firm-launch')
  })
})

describe('getSceneThumbnailPath', () => {
  it('generates thumbnail path', () => {
    const path = getSceneThumbnailPath('/output/previews/offer', 'scene-001')
    expect(path).toBe('/output/previews/offer/thumbs/scene-001.png')
  })
})

describe('getMontagePosterPath', () => {
  it('generates poster path', () => {
    const path = getMontagePosterPath('/output/previews/offer')
    expect(path).toBe('/output/previews/offer/poster.png')
  })
})

describe('getMontageMetaPath', () => {
  it('generates meta.json path', () => {
    const path = getMontageMetaPath('/output/previews/offer')
    expect(path).toBe('/output/previews/offer/meta.json')
  })
})

// ─── Scroll Calculations ─────────────────────────────────────

describe('calculateScrollPositions', () => {
  it('calculates scroll positions from percentages', () => {
    const result = calculateScrollPositions(2000, 720, 0, 0.5)
    expect(result.maxScroll).toBe(1280) // 2000 - 720
    expect(result.startY).toBe(0)
    expect(result.endY).toBe(640) // 50% of 1280
  })

  it('handles zero scroll height', () => {
    const result = calculateScrollPositions(500, 720, 0, 1)
    expect(result.maxScroll).toBe(0) // Cannot scroll
    expect(result.startY).toBe(0)
    expect(result.endY).toBe(0)
  })

  it('handles full scroll range', () => {
    const result = calculateScrollPositions(1720, 720, 0, 1)
    expect(result.maxScroll).toBe(1000)
    expect(result.startY).toBe(0)
    expect(result.endY).toBe(1000)
  })
})

describe('interpolateScrollPosition', () => {
  it('interpolates at start', () => {
    expect(interpolateScrollPosition(0, 1000, 0)).toBe(0)
  })

  it('interpolates at end', () => {
    expect(interpolateScrollPosition(0, 1000, 1)).toBe(1000)
  })

  it('interpolates at midpoint', () => {
    expect(interpolateScrollPosition(0, 1000, 0.5)).toBe(500)
  })

  it('clamps progress below 0', () => {
    expect(interpolateScrollPosition(0, 1000, -0.5)).toBe(0)
  })

  it('clamps progress above 1', () => {
    expect(interpolateScrollPosition(0, 1000, 1.5)).toBe(1000)
  })

  it('handles reverse scroll', () => {
    expect(interpolateScrollPosition(1000, 0, 0.5)).toBe(500)
  })
})

// ─── Duration Calculations ───────────────────────────────────

describe('getSceneDuration', () => {
  it('uses scene duration when specified', () => {
    expect(getSceneDuration({ durationSeconds: 3.5 })).toBe(3.5)
  })

  it('uses montage default when scene duration not specified', () => {
    expect(getSceneDuration({}, 2.5)).toBe(2.5)
  })

  it('uses fallback of 2.0 when nothing specified', () => {
    expect(getSceneDuration({})).toBe(2.0)
  })

  it('prefers scene duration over montage default', () => {
    expect(getSceneDuration({ durationSeconds: 1.5 }, 3.0)).toBe(1.5)
  })
})

describe('calculateTotalDuration', () => {
  it('sums scene durations', () => {
    const scenes = [
      { durationSeconds: 2.0 },
      { durationSeconds: 3.0 },
      { durationSeconds: 1.5 },
    ]
    expect(calculateTotalDuration(scenes)).toBe(6.5)
  })

  it('uses montage default for missing durations', () => {
    const scenes = [
      { durationSeconds: 2.0 },
      {},
      { durationSeconds: 1.0 },
    ]
    expect(calculateTotalDuration(scenes, 2.5)).toBe(5.5) // 2.0 + 2.5 + 1.0
  })

  it('uses fallback for all missing durations', () => {
    const scenes = [{}, {}, {}]
    expect(calculateTotalDuration(scenes)).toBe(6.0) // 3 * 2.0
  })

  it('returns 0 for empty array', () => {
    expect(calculateTotalDuration([])).toBe(0)
  })
})

// ─── Validation ──────────────────────────────────────────────

describe('validateScene', () => {
  const validScene: PreviewScene = {
    sceneId: 'scene-001',
    label: 'Test Scene',
    siteType: 'law-firm',
    presetId: 'test-preset',
    verticalId: 'test-vertical',
    scrollStart: 0,
    scrollEnd: 0.5,
  }

  it('returns empty array for valid scene', () => {
    expect(validateScene(validScene)).toHaveLength(0)
  })

  it('reports missing sceneId', () => {
    const invalid = { ...validScene, sceneId: '' } as PreviewScene
    expect(validateScene(invalid)).toContain('sceneId is required and must be a string')
  })

  it('reports missing label', () => {
    const invalid = { ...validScene, label: '' } as PreviewScene
    expect(validateScene(invalid)).toContain('label is required and must be a string')
  })

  it('reports missing siteType', () => {
    const invalid = { ...validScene, siteType: undefined as unknown as string } as PreviewScene
    expect(validateScene(invalid)).toContain('siteType is required')
  })

  it('reports invalid scrollStart', () => {
    const invalid = { ...validScene, scrollStart: 1.5 }
    expect(validateScene(invalid)).toContain('scrollStart must be between 0 and 1')
  })

  it('reports invalid scrollEnd', () => {
    const invalid = { ...validScene, scrollEnd: -0.1 }
    expect(validateScene(invalid)).toContain('scrollEnd must be between 0 and 1')
  })

  it('reports non-positive duration', () => {
    const invalid = { ...validScene, durationSeconds: 0 }
    expect(validateScene(invalid)).toContain('durationSeconds must be positive')
  })
})

describe('validateMontage', () => {
  const validScene: PreviewScene = {
    sceneId: 'scene-001',
    label: 'Test Scene',
    siteType: 'law-firm',
    presetId: 'test-preset',
    verticalId: 'test-vertical',
  }

  const validMontage: PreviewMontage = {
    offerId: 'test-offer',
    title: 'Test Montage',
    description: 'Test description',
    scenes: [validScene],
    viewport: { width: 1280, height: 720 },
    defaultDurationSeconds: 2.0,
    defaultCameraMotion: 'scroll-down',
  }

  it('returns empty array for valid montage', () => {
    expect(validateMontage(validMontage)).toHaveLength(0)
  })

  it('reports missing offerId', () => {
    const invalid = { ...validMontage, offerId: '' }
    const errors = validateMontage(invalid)
    expect(errors).toContain('offerId is required and must be a string')
  })

  it('reports missing title', () => {
    const invalid = { ...validMontage, title: '' }
    const errors = validateMontage(invalid)
    expect(errors).toContain('title is required and must be a string')
  })

  it('reports empty scenes array', () => {
    const invalid = { ...validMontage, scenes: [] }
    const errors = validateMontage(invalid)
    expect(errors).toContain('at least one scene is required')
  })

  it('reports duplicate scene IDs', () => {
    const invalid = {
      ...validMontage,
      scenes: [
        validScene,
        { ...validScene }, // Same ID
      ],
    }
    const errors = validateMontage(invalid)
    expect(errors.some(e => e.includes('duplicate sceneId'))).toBe(true)
  })

  it('reports scene validation errors with context', () => {
    const invalid = {
      ...validMontage,
      scenes: [{ ...validScene, scrollStart: 2.0 }],
    }
    const errors = validateMontage(invalid)
    expect(errors.some(e => e.includes('scene 0') && e.includes('scrollStart'))).toBe(true)
  })
})

// ─── Meta Generation ─────────────────────────────────────────

describe('createSceneMeta', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates scene metadata', () => {
    const scene: PreviewScene = {
      sceneId: 'scene-001',
      label: 'Test Scene',
      siteType: 'law-firm',
      presetId: 'test-preset',
      verticalId: 'test-vertical',
      durationSeconds: 2.5,
    }

    const meta = createSceneMeta(scene, 'test-offer', 'demo-abc123', 'scene-001.webm')

    expect(meta.sceneId).toBe('scene-001')
    expect(meta.label).toBe('Test Scene')
    expect(meta.siteType).toBe('law-firm')
    expect(meta.presetId).toBe('test-preset')
    expect(meta.verticalId).toBe('test-vertical')
    expect(meta.generatedSiteId).toBe('demo-abc123')
    expect(meta.durationSeconds).toBe(2.5)
    expect(meta.thumbnailFilename).toBe('thumbs/scene-001.png')
    expect(meta.videoFilename).toBe('scene-001.webm')
    expect(meta.recordedAt).toBe('2025-01-15T12:00:00.000Z')
  })

  it('uses default duration when not specified', () => {
    const scene: PreviewScene = {
      sceneId: 'scene-001',
      label: 'Test Scene',
      siteType: 'law-firm',
      presetId: 'test-preset',
      verticalId: 'test-vertical',
    }

    const meta = createSceneMeta(scene, 'test-offer', 'demo-abc123', null)
    expect(meta.durationSeconds).toBe(2.0)
  })
})

describe('createPreviewMeta', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates preview metadata', () => {
    const montage: PreviewMontage = {
      offerId: 'test-offer',
      title: 'Test Montage',
      description: 'Test description',
      scenes: [],
      viewport: { width: 1280, height: 720 },
      defaultDurationSeconds: 2.0,
      defaultCameraMotion: 'scroll-down',
    }

    const sceneMetas = [
      { sceneId: 's1', durationSeconds: 2.0 },
      { sceneId: 's2', durationSeconds: 3.0 },
    ] as import('../preview.types').SceneMeta[]

    const meta = createPreviewMeta(montage, sceneMetas, 'scene-playlist', 'montage.webm')

    expect(meta.offerId).toBe('test-offer')
    expect(meta.title).toBe('Test Montage')
    expect(meta.description).toBe('Test description')
    expect(meta.generatorVersion).toBe(GENERATOR_VERSION)
    expect(meta.generatedAt).toBe('2025-01-15T12:00:00.000Z')
    expect(meta.totalDurationSeconds).toBe(5.0)
    expect(meta.viewport).toEqual({ width: 1280, height: 720 })
    expect(meta.assemblyStrategy).toBe('scene-playlist')
    expect(meta.videoFilename).toBe('montage.webm')
    expect(meta.posterFilename).toBe('poster.png')
    expect(meta.scenes).toHaveLength(2)
  })
})

// ─── Camera Motion ───────────────────────────────────────────

describe('getEffectiveCameraMotion', () => {
  it('uses scene camera motion when specified', () => {
    expect(getEffectiveCameraMotion({ cameraMotion: 'pan-hero' })).toBe('pan-hero')
  })

  it('uses montage default when scene motion not specified', () => {
    expect(getEffectiveCameraMotion({}, 'scroll-up')).toBe('scroll-up')
  })

  it('uses scroll-down as fallback', () => {
    expect(getEffectiveCameraMotion({})).toBe('scroll-down')
  })

  it('prefers scene motion over montage default', () => {
    expect(getEffectiveCameraMotion({ cameraMotion: 'static' }, 'scroll-down')).toBe('static')
  })
})

describe('isScrollingMotion', () => {
  it('returns true for scroll-down', () => {
    expect(isScrollingMotion('scroll-down')).toBe(true)
  })

  it('returns true for scroll-up', () => {
    expect(isScrollingMotion('scroll-up')).toBe(true)
  })

  it('returns false for static', () => {
    expect(isScrollingMotion('static')).toBe(false)
  })

  it('returns false for pan-hero', () => {
    expect(isScrollingMotion('pan-hero')).toBe(false)
  })

  it('returns false for zoom-out', () => {
    expect(isScrollingMotion('zoom-out')).toBe(false)
  })
})

describe('getScrollDirection', () => {
  it('returns 1 for scroll-down', () => {
    expect(getScrollDirection('scroll-down')).toBe(1)
  })

  it('returns -1 for scroll-up', () => {
    expect(getScrollDirection('scroll-up')).toBe(-1)
  })

  it('returns 0 for static', () => {
    expect(getScrollDirection('static')).toBe(0)
  })

  it('returns 0 for pan-hero', () => {
    expect(getScrollDirection('pan-hero')).toBe(0)
  })

  it('returns 0 for zoom-out', () => {
    expect(getScrollDirection('zoom-out')).toBe(0)
  })
})
