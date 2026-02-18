/**
 * apps/sitegen/pipeline/__tests__/generation-completeness.test.ts
 *
 * Tests for P5 — Generation Completeness Check.
 * Verifies fail-closed artifact validation against blueprint requirements.
 */
import { describe, it, expect } from 'vitest'
import {
  checkGenerationCompleteness,
  isGenerationComplete,
  extractRequirements,
  type GeneratedArtifact,
  type BlueprintRequirements,
} from '../GenerationCompletenessCheck.js'

// ─── Fixtures ────────────────────────────────────────────────────────

function makeValidRequirements(): BlueprintRequirements {
  return {
    requiredPageSlugs: ['home', 'about', 'services', 'contact', 'faq'],
    requiredSectionIds: ['hero', 'about-intro', 'service-list', 'contact-form', 'faq-section', 'cta'],
    requiredComplianceTypes: ['privacy', 'terms', 'accessibility'],
    minPages: 5,
    minSections: 6,
    requireWatermark: true,
  }
}

function makeValidArtifact(): GeneratedArtifact {
  return {
    siteId: 'site-abc-123',
    blueprintId: 'law-firm',
    pages: [
      { slug: 'home', title: 'Home', html: '<div>Home content</div>', sections: ['hero', 'cta'] },
      { slug: 'about', title: 'About', html: '<div>About content</div>', sections: ['about-intro'] },
      { slug: 'services', title: 'Services', html: '<div>Services content</div>', sections: ['service-list'] },
      { slug: 'contact', title: 'Contact', html: '<div>Contact content</div>', sections: ['contact-form'] },
      { slug: 'faq', title: 'FAQ', html: '<div>FAQ content</div>', sections: ['faq-section'] },
    ],
    complianceBlocks: ['privacy', 'terms', 'accessibility'],
    integrityHash: 'a1b2c3d4e5f6g7h8',
    watermarkApplied: true,
    generatedAt: Date.now() - 5000,
  }
}

// ─── Tests ───────────────────────────────────────────────────────────

describe('GenerationCompletenessCheck', () => {
  describe('checkGenerationCompleteness', () => {
    it('passes for complete artifact', () => {
      const result = checkGenerationCompleteness(makeValidArtifact(), makeValidRequirements())
      expect(result.complete).toBe(true)
      expect(result.blockers).toHaveLength(0)
    })

    it('fails if required page missing', () => {
      const artifact = {
        ...makeValidArtifact(),
        pages: makeValidArtifact().pages.filter(p => p.slug !== 'faq'),
      }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('"faq"'))).toBe(true)
    })

    it('fails if page count below minimum', () => {
      const artifact = {
        ...makeValidArtifact(),
        pages: makeValidArtifact().pages.slice(0, 3),
      }
      const reqs = { ...makeValidRequirements(), requiredPageSlugs: ['home', 'about', 'services'] }
      const result = checkGenerationCompleteness(artifact, reqs)
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('minimum'))).toBe(true)
    })

    it('fails if required section missing', () => {
      const artifact: GeneratedArtifact = {
        ...makeValidArtifact(),
        pages: [
          { slug: 'home', title: 'Home', html: '<div>Home</div>', sections: ['hero'] },
          { slug: 'about', title: 'About', html: '<div>About</div>', sections: ['about-intro'] },
          { slug: 'services', title: 'Services', html: '<div>Services</div>', sections: ['service-list'] },
          { slug: 'contact', title: 'Contact', html: '<div>Contact</div>', sections: ['contact-form'] },
          { slug: 'faq', title: 'FAQ', html: '<div>FAQ</div>', sections: ['faq-section'] },
        ],
      }
      // 'cta' section is missing
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('"cta"'))).toBe(true)
    })

    it('fails if compliance block missing', () => {
      const artifact = {
        ...makeValidArtifact(),
        complianceBlocks: ['privacy', 'accessibility'], // missing 'terms'
      }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('"terms"'))).toBe(true)
    })

    it('fails if integrity hash missing', () => {
      const artifact = { ...makeValidArtifact(), integrityHash: '' }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('hash'))).toBe(true)
    })

    it('fails if integrity hash too short', () => {
      const artifact = { ...makeValidArtifact(), integrityHash: 'abc' }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
    })

    it('fails if watermark not applied when required', () => {
      const artifact = { ...makeValidArtifact(), watermarkApplied: false }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('Watermark'))).toBe(true)
    })

    it('passes without watermark check when not required', () => {
      const artifact = { ...makeValidArtifact(), watermarkApplied: false }
      const reqs = { ...makeValidRequirements(), requireWatermark: false }
      const result = checkGenerationCompleteness(artifact, reqs)
      expect(result.complete).toBe(true)
    })

    it('fails if page has empty HTML', () => {
      const artifact: GeneratedArtifact = {
        ...makeValidArtifact(),
        pages: [
          ...makeValidArtifact().pages.slice(0, 4),
          { slug: 'faq', title: 'FAQ', html: '', sections: ['faq-section'] },
        ],
      }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('empty HTML'))).toBe(true)
    })

    it('fails if timestamp is zero', () => {
      const artifact = { ...makeValidArtifact(), generatedAt: 0 }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('timestamp'))).toBe(true)
    })

    it('fails if timestamp is too far in the future', () => {
      const artifact = { ...makeValidArtifact(), generatedAt: Date.now() + 120_000 }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
    })

    it('fails if siteId is empty', () => {
      const artifact = { ...makeValidArtifact(), siteId: '' }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('Site ID'))).toBe(true)
    })

    it('fails if blueprintId is empty', () => {
      const artifact = { ...makeValidArtifact(), blueprintId: '' }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.some(b => b.includes('Blueprint ID'))).toBe(true)
    })

    it('reports all blockers, does not short-circuit', () => {
      const artifact: GeneratedArtifact = {
        siteId: '',
        blueprintId: '',
        pages: [],
        complianceBlocks: [],
        integrityHash: '',
        watermarkApplied: false,
        generatedAt: 0,
      }
      const result = checkGenerationCompleteness(artifact, makeValidRequirements())
      expect(result.complete).toBe(false)
      expect(result.blockers.length).toBeGreaterThan(5)
    })

    it('each check has id, label, passed, and message', () => {
      const result = checkGenerationCompleteness(makeValidArtifact(), makeValidRequirements())
      for (const check of result.checks) {
        expect(check.id).toBeTruthy()
        expect(check.label).toBeTruthy()
        expect(typeof check.passed).toBe('boolean')
        expect(check.message).toBeTruthy()
      }
    })
  })

  describe('isGenerationComplete', () => {
    it('returns true for valid artifact', () => {
      expect(isGenerationComplete(makeValidArtifact(), makeValidRequirements())).toBe(true)
    })

    it('returns false for invalid artifact', () => {
      const artifact = { ...makeValidArtifact(), siteId: '' }
      expect(isGenerationComplete(artifact, makeValidRequirements())).toBe(false)
    })
  })

  describe('extractRequirements', () => {
    it('extracts requirements from blueprint-like object', () => {
      const bp = {
        required_pages: [{ slug: 'home' }, { slug: 'contact' }],
        required_sections: [{ id: 'hero' }, { id: 'cta' }],
        compliance_blocks: [{ type: 'privacy' }, { type: 'terms' }, { type: 'privacy' }],
        content_requirements: { min_pages: 3, min_sections: 4 },
        demo_watermark_profile: { enabled: true },
      }
      const reqs = extractRequirements(bp)
      expect(reqs.requiredPageSlugs).toEqual(['home', 'contact'])
      expect(reqs.requiredSectionIds).toEqual(['hero', 'cta'])
      expect(reqs.requiredComplianceTypes).toEqual(['privacy', 'terms']) // deduplicated
      expect(reqs.minPages).toBe(3)
      expect(reqs.minSections).toBe(4)
      expect(reqs.requireWatermark).toBe(true)
    })

    it('deduplicates compliance types', () => {
      const bp = {
        required_pages: [],
        required_sections: [],
        compliance_blocks: [{ type: 'privacy' }, { type: 'privacy' }, { type: 'terms' }],
        content_requirements: { min_pages: 1, min_sections: 1 },
        demo_watermark_profile: { enabled: false },
      }
      const reqs = extractRequirements(bp)
      expect(reqs.requiredComplianceTypes).toEqual(['privacy', 'terms'])
      expect(reqs.requireWatermark).toBe(false)
    })
  })
})
