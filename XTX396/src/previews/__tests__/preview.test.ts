/**
 * Preview System Tests
 *
 * Validates:
 * - Montage definitions completeness
 * - Scene structure validity
 * - Preset/vertical reference validity
 */

import { describe, it, expect } from 'vitest'
import {
  PREVIEW_MONTAGES,
  LAW_FIRM_72_HOUR_MONTAGE,
  SMALL_BUSINESS_STARTER_MONTAGE,
  AGENCY_PRO_MONTAGE,
  PREMIUM_FULL_SERVICE_MONTAGE,
  getMontageByOfferId,
  getAllOfferIds,
  getTotalSceneCount,
  DEFAULT_VIEWPORT,
  MOBILE_VIEWPORT,
  PREVIEW_GENERATOR_VERSION,
} from '../index'
import { getPresetById } from '@/core/presets'
import { getVerticalPack } from '@/core/verticals'
import type { PreviewMontage, PreviewScene } from '../preview.types'

// ─── Montage Registry Tests ──────────────────────────────────

describe('Preview Montages Registry', () => {
  it('should have at least 4 montages defined', () => {
    expect(PREVIEW_MONTAGES.length).toBeGreaterThanOrEqual(4)
  })

  it('should have unique offer IDs', () => {
    const ids = PREVIEW_MONTAGES.map(m => m.offerId)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should return all offer IDs', () => {
    const ids = getAllOfferIds()
    expect(ids).toContain('law-firm-72-hour-launch')
    expect(ids).toContain('small-business-starter')
    expect(ids).toContain('digital-agency-pro')
    expect(ids).toContain('premium-full-service')
  })

  it('should get montage by offer ID', () => {
    const montage = getMontageByOfferId('law-firm-72-hour-launch')
    expect(montage).not.toBeNull()
    expect(montage?.title).toBe('Law Firm – 72 Hour Launch')
  })

  it('should return null for unknown offer ID', () => {
    const montage = getMontageByOfferId('unknown-offer')
    expect(montage).toBeNull()
  })

  it('should count total scenes correctly', () => {
    const total = getTotalSceneCount()
    const expected = PREVIEW_MONTAGES.reduce((sum, m) => sum + m.scenes.length, 0)
    expect(total).toBe(expected)
    expect(total).toBeGreaterThanOrEqual(20) // At least 20 scenes across all montages
  })
})

// ─── Montage Structure Tests ─────────────────────────────────

describe('Montage Structure', () => {
  const validateMontage = (montage: PreviewMontage) => {
    it(`${montage.title} should have required fields`, () => {
      expect(montage.offerId).toBeDefined()
      expect(montage.title).toBeDefined()
      expect(montage.description).toBeDefined()
      expect(montage.scenes).toBeDefined()
      expect(montage.scenes.length).toBeGreaterThan(0)
      expect(montage.defaultDurationSeconds).toBeGreaterThan(0)
      expect(montage.viewport).toBeDefined()
      expect(montage.defaultCameraMotion).toBeDefined()
    })

    it(`${montage.title} should have valid viewport`, () => {
      expect(montage.viewport.width).toBeGreaterThan(0)
      expect(montage.viewport.height).toBeGreaterThan(0)
    })

    it(`${montage.title} should have valid duration (1-5 seconds)`, () => {
      expect(montage.defaultDurationSeconds).toBeGreaterThanOrEqual(1)
      expect(montage.defaultDurationSeconds).toBeLessThanOrEqual(5)
    })
  }

  describe('Law Firm Montage', () => {
    validateMontage(LAW_FIRM_72_HOUR_MONTAGE)

    it('should have at least 5 law firm scenes', () => {
      expect(LAW_FIRM_72_HOUR_MONTAGE.scenes.length).toBeGreaterThanOrEqual(5)
    })

    it('should only contain law-firm site types', () => {
      for (const scene of LAW_FIRM_72_HOUR_MONTAGE.scenes) {
        expect(scene.siteType).toBe('law-firm')
      }
    })
  })

  describe('Small Business Montage', () => {
    validateMontage(SMALL_BUSINESS_STARTER_MONTAGE)

    it('should have at least 5 SMB scenes', () => {
      expect(SMALL_BUSINESS_STARTER_MONTAGE.scenes.length).toBeGreaterThanOrEqual(5)
    })

    it('should only contain small-business site types', () => {
      for (const scene of SMALL_BUSINESS_STARTER_MONTAGE.scenes) {
        expect(scene.siteType).toBe('small-business')
      }
    })
  })

  describe('Agency Montage', () => {
    validateMontage(AGENCY_PRO_MONTAGE)

    it('should have at least 3 agency scenes', () => {
      expect(AGENCY_PRO_MONTAGE.scenes.length).toBeGreaterThanOrEqual(3)
    })

    it('should only contain agency site types', () => {
      for (const scene of AGENCY_PRO_MONTAGE.scenes) {
        expect(scene.siteType).toBe('agency')
      }
    })
  })

  describe('Premium Montage', () => {
    validateMontage(PREMIUM_FULL_SERVICE_MONTAGE)

    it('should showcase multiple site types', () => {
      const siteTypes = new Set(PREMIUM_FULL_SERVICE_MONTAGE.scenes.map(s => s.siteType))
      expect(siteTypes.size).toBeGreaterThanOrEqual(2) // At least 2 different site types
    })
  })
})

// ─── Scene Validation Tests ──────────────────────────────────

describe('Scene Validation', () => {
  const validateScene = (scene: PreviewScene, context: string) => {
    it(`${context}: ${scene.label} should have required fields`, () => {
      expect(scene.sceneId).toBeDefined()
      expect(scene.label).toBeDefined()
      expect(scene.siteType).toBeDefined()
      expect(scene.verticalId).toBeDefined()
      expect(scene.presetId).toBeDefined()
    })

    it(`${context}: ${scene.label} should reference valid preset`, () => {
      const preset = getPresetById(scene.presetId)
      expect(preset).not.toBeNull()
    })

    it(`${context}: ${scene.label} should reference valid vertical`, () => {
      const vertical = getVerticalPack(scene.verticalId)
      expect(vertical).not.toBeNull()
    })

    it(`${context}: ${scene.label} preset should match scene site type`, () => {
      const preset = getPresetById(scene.presetId)
      expect(preset?.siteType).toBe(scene.siteType)
    })

    it(`${context}: ${scene.label} vertical should match scene site type`, () => {
      const vertical = getVerticalPack(scene.verticalId)
      expect(vertical?.siteType).toBe(scene.siteType)
    })
  }

  describe('All Scenes Reference Valid Presets and Verticals', () => {
    for (const montage of PREVIEW_MONTAGES) {
      describe(montage.title, () => {
        for (const scene of montage.scenes) {
          validateScene(scene, montage.offerId)
        }
      })
    }
  })

  describe('Scene IDs are Unique', () => {
    it('should have unique scene IDs across all montages', () => {
      const allSceneIds = PREVIEW_MONTAGES.flatMap(m => m.scenes.map(s => s.sceneId))
      const uniqueIds = new Set(allSceneIds)
      expect(uniqueIds.size).toBe(allSceneIds.length)
    })
  })

  describe('Scene Scroll Positions', () => {
    it('all scenes should have valid scroll positions', () => {
      for (const montage of PREVIEW_MONTAGES) {
        for (const scene of montage.scenes) {
          if (scene.scrollStart !== undefined) {
            expect(scene.scrollStart).toBeGreaterThanOrEqual(0)
            expect(scene.scrollStart).toBeLessThanOrEqual(1)
          }
          if (scene.scrollEnd !== undefined) {
            expect(scene.scrollEnd).toBeGreaterThanOrEqual(0)
            expect(scene.scrollEnd).toBeLessThanOrEqual(1)
          }
        }
      }
    })
  })
})

// ─── Viewport Config Tests ───────────────────────────────────

describe('Viewport Configurations', () => {
  it('DEFAULT_VIEWPORT should be desktop-sized', () => {
    expect(DEFAULT_VIEWPORT.width).toBeGreaterThanOrEqual(1024)
    expect(DEFAULT_VIEWPORT.height).toBeGreaterThanOrEqual(600)
    expect(DEFAULT_VIEWPORT.isMobile).toBeFalsy()
  })

  it('MOBILE_VIEWPORT should be mobile-sized', () => {
    expect(MOBILE_VIEWPORT.width).toBeLessThan(500)
    expect(MOBILE_VIEWPORT.isMobile).toBe(true)
    expect(MOBILE_VIEWPORT.deviceScaleFactor).toBeGreaterThanOrEqual(2)
  })
})

// ─── Constants Tests ─────────────────────────────────────────

describe('Preview Constants', () => {
  it('should have a valid generator version', () => {
    expect(PREVIEW_GENERATOR_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

// ─── Determinism Tests ───────────────────────────────────────

describe('Preview Determinism', () => {
  it('same offerId should always return same montage', () => {
    const montage1 = getMontageByOfferId('law-firm-72-hour-launch')
    const montage2 = getMontageByOfferId('law-firm-72-hour-launch')
    expect(montage1).toEqual(montage2)
  })

  it('montage scene order should be deterministic', () => {
    const scenes1 = getMontageByOfferId('premium-full-service')?.scenes
    const scenes2 = getMontageByOfferId('premium-full-service')?.scenes
    expect(scenes1?.map(s => s.sceneId)).toEqual(scenes2?.map(s => s.sceneId))
  })
})
