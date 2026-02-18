/**
 * apps/sitegen/preview/__tests__/preview-wow.test.ts
 *
 * Tests for P4 — Preview Wow Factor:
 * - Hero presets (curated per business type)
 * - Device frames (viewport toggles)
 * - Watermark enforcement (fail-closed)
 */
import { describe, it, expect } from 'vitest'
import {
  HERO_PRESETS,
  getPresetsForBusinessType,
  getPresetById,
  getBusinessTypesWithPresets,
  type HeroPreset,
} from '../HeroPresets.js'
import {
  DEVICE_FRAMES,
  getFramesByCategory,
  getFrameById,
  getDefaultFrame,
  DEFAULT_FRAME_ID,
} from '../DeviceFrames.js'
import {
  enforceWatermark,
  buildDefaultWatermarkProfile,
  normalizeWatermarkProfile,
  MIN_WATERMARK_OPACITY,
  MAX_WATERMARK_OPACITY,
  DEFAULT_WATERMARK_TEXT,
  type WatermarkProfile,
} from '../WatermarkEnforcer.js'

// ─── Hero Presets ────────────────────────────────────────────────────

describe('HeroPresets', () => {
  const EXPECTED_BUSINESS_TYPES = [
    'law-firm', 'agency', 'contractor', 'nonprofit', 'professional-services',
  ]

  it('has at least 3 presets per business type', () => {
    for (const bt of EXPECTED_BUSINESS_TYPES) {
      const presets = getPresetsForBusinessType(bt)
      expect(presets.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('every preset has unique ID', () => {
    const ids = HERO_PRESETS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every preset has valid layout', () => {
    const validLayouts = ['centered', 'split-left', 'split-right', 'fullscreen-overlay']
    for (const p of HERO_PRESETS) {
      expect(validLayouts).toContain(p.layout)
    }
  })

  it('every preset has valid CTA style', () => {
    const validStyles = ['solid', 'outline', 'ghost']
    for (const p of HERO_PRESETS) {
      expect(validStyles).toContain(p.ctaStyle)
    }
  })

  it('overlay opacity is between 0 and 1', () => {
    for (const p of HERO_PRESETS) {
      expect(p.overlayOpacity).toBeGreaterThan(0)
      expect(p.overlayOpacity).toBeLessThanOrEqual(1)
    }
  })

  it('accent colors are valid hex', () => {
    for (const p of HERO_PRESETS) {
      expect(p.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('getPresetById returns preset for valid ID', () => {
    expect(getPresetById('lawfirm-authority')).toBeDefined()
    expect(getPresetById('lawfirm-authority')!.businessType).toBe('law-firm')
  })

  it('getPresetById returns undefined for unknown ID', () => {
    expect(getPresetById('nonexistent')).toBeUndefined()
  })

  it('getBusinessTypesWithPresets returns all 5 types', () => {
    const types = getBusinessTypesWithPresets()
    for (const bt of EXPECTED_BUSINESS_TYPES) {
      expect(types).toContain(bt)
    }
  })

  it('presets have non-empty label and image', () => {
    for (const p of HERO_PRESETS) {
      expect(p.label.length).toBeGreaterThan(0)
      expect(p.placeholderImage.length).toBeGreaterThan(0)
    }
  })
})

// ─── Device Frames ───────────────────────────────────────────────────

describe('DeviceFrames', () => {
  it('has desktop, tablet, and mobile frames', () => {
    expect(getFramesByCategory('desktop').length).toBeGreaterThanOrEqual(2)
    expect(getFramesByCategory('tablet').length).toBeGreaterThanOrEqual(1)
    expect(getFramesByCategory('mobile').length).toBeGreaterThanOrEqual(2)
  })

  it('every frame has unique ID', () => {
    const ids = DEVICE_FRAMES.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('desktop frames have width >= 1024', () => {
    for (const f of getFramesByCategory('desktop')) {
      expect(f.width).toBeGreaterThanOrEqual(1024)
    }
  })

  it('mobile frames have width < 500', () => {
    for (const f of getFramesByCategory('mobile')) {
      expect(f.width).toBeLessThan(500)
    }
  })

  it('all frames have positive dimensions', () => {
    for (const f of DEVICE_FRAMES) {
      expect(f.width).toBeGreaterThan(0)
      expect(f.height).toBeGreaterThan(0)
      expect(f.devicePixelRatio).toBeGreaterThan(0)
    }
  })

  it('getFrameById finds existing frame', () => {
    const frame = getFrameById('desktop-1440')
    expect(frame).toBeDefined()
    expect(frame!.width).toBe(1440)
  })

  it('getFrameById returns undefined for unknown', () => {
    expect(getFrameById('nonexistent')).toBeUndefined()
  })

  it('getDefaultFrame returns the default', () => {
    const def = getDefaultFrame()
    expect(def.id).toBe(DEFAULT_FRAME_ID)
  })
})

// ─── Watermark Enforcer ──────────────────────────────────────────────

describe('WatermarkEnforcer', () => {
  const validProfile: WatermarkProfile = {
    enabled: true,
    text: 'PREVIEW',
    opacity: 0.15,
    position: 'diagonal',
  }

  describe('enforceWatermark', () => {
    it('accepts valid watermark profile', () => {
      const result = enforceWatermark(validProfile)
      expect(result.enforced).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('blocks null profile', () => {
      const result = enforceWatermark(null)
      expect(result.enforced).toBe(false)
      expect(result.violations[0]).toContain('No watermark profile')
    })

    it('blocks undefined profile', () => {
      const result = enforceWatermark(undefined)
      expect(result.enforced).toBe(false)
    })

    it('blocks disabled watermark', () => {
      const result = enforceWatermark({ ...validProfile, enabled: false })
      expect(result.enforced).toBe(false)
      expect(result.violations.some(v => v.includes('disabled'))).toBe(true)
    })

    it('blocks empty text', () => {
      const result = enforceWatermark({ ...validProfile, text: '' })
      expect(result.enforced).toBe(false)
      expect(result.violations.some(v => v.includes('text is empty'))).toBe(true)
    })

    it('blocks whitespace-only text', () => {
      const result = enforceWatermark({ ...validProfile, text: '   ' })
      expect(result.enforced).toBe(false)
    })

    it('blocks opacity below minimum', () => {
      const result = enforceWatermark({ ...validProfile, opacity: 0.01 })
      expect(result.enforced).toBe(false)
      expect(result.violations.some(v => v.includes('below minimum'))).toBe(true)
    })

    it('blocks opacity above maximum', () => {
      const result = enforceWatermark({ ...validProfile, opacity: 0.8 })
      expect(result.enforced).toBe(false)
      expect(result.violations.some(v => v.includes('exceeds maximum'))).toBe(true)
    })

    it('accepts opacity at boundaries', () => {
      expect(enforceWatermark({ ...validProfile, opacity: MIN_WATERMARK_OPACITY }).enforced).toBe(true)
      expect(enforceWatermark({ ...validProfile, opacity: MAX_WATERMARK_OPACITY }).enforced).toBe(true)
    })

    it('blocks invalid position', () => {
      const result = enforceWatermark({ ...validProfile, position: 'middle' as WatermarkProfile['position'] })
      expect(result.enforced).toBe(false)
      expect(result.violations.some(v => v.includes('Invalid watermark position'))).toBe(true)
    })

    it('accepts all valid positions', () => {
      const positions: WatermarkProfile['position'][] = [
        'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'diagonal',
      ]
      for (const pos of positions) {
        expect(enforceWatermark({ ...validProfile, position: pos }).enforced).toBe(true)
      }
    })

    it('reports all violations, does not short-circuit', () => {
      const badProfile: WatermarkProfile = {
        enabled: false,
        text: '',
        opacity: 0,
        position: 'invalid' as WatermarkProfile['position'],
      }
      const result = enforceWatermark(badProfile)
      expect(result.violations.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('buildDefaultWatermarkProfile', () => {
    it('returns enabled profile', () => {
      const def = buildDefaultWatermarkProfile()
      expect(def.enabled).toBe(true)
    })

    it('has default text', () => {
      const def = buildDefaultWatermarkProfile()
      expect(def.text).toBe(DEFAULT_WATERMARK_TEXT)
    })

    it('passes enforcement', () => {
      const result = enforceWatermark(buildDefaultWatermarkProfile())
      expect(result.enforced).toBe(true)
    })
  })

  describe('normalizeWatermarkProfile', () => {
    it('returns defaults for null input', () => {
      const norm = normalizeWatermarkProfile(null)
      expect(norm.enabled).toBe(true)
      expect(norm.text).toBe(DEFAULT_WATERMARK_TEXT)
    })

    it('keeps valid values from input', () => {
      const norm = normalizeWatermarkProfile({ text: 'DEMO', opacity: 0.2, position: 'center' })
      expect(norm.text).toBe('DEMO')
      expect(norm.opacity).toBe(0.2)
      expect(norm.position).toBe('center')
    })

    it('replaces invalid opacity with default', () => {
      const norm = normalizeWatermarkProfile({ opacity: 99 })
      expect(norm.opacity).toBe(0.15)
    })

    it('replaces invalid position with default', () => {
      const norm = normalizeWatermarkProfile({ position: 'bad' as WatermarkProfile['position'] })
      expect(norm.position).toBe('diagonal')
    })

    it('always forces enabled to true', () => {
      const norm = normalizeWatermarkProfile({ enabled: false })
      expect(norm.enabled).toBe(true)
    })

    it('normalized profile always passes enforcement', () => {
      const inputs = [null, undefined, {}, { opacity: -1 }, { text: '' }, { position: 'bad' as WatermarkProfile['position'] }]
      for (const input of inputs) {
        const norm = normalizeWatermarkProfile(input as Partial<WatermarkProfile> | null)
        expect(enforceWatermark(norm).enforced).toBe(true)
      }
    })
  })
})
