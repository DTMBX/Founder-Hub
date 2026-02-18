/**
 * apps/sitegen/wizard/__tests__/wizard.test.ts
 *
 * Tests for the Operator Wizard: schemas, state machine, and publish readiness gate.
 */
import { describe, it, expect } from 'vitest'
import {
  WIZARD_STEPS,
  BUSINESS_TYPE_IDS,
  BusinessTypeStepSchema,
  BusinessInfoStepSchema,
  StylePresetStepSchema,
  ContentReviewStepSchema,
  PreviewStepSchema,
  PublishStepSchema,
  WizardStateSchema,
  STEP_SCHEMAS,
  STEP_DATA_KEYS,
  type WizardState,
} from '../WizardSchema.js'
import {
  createWizardState,
  advanceStep,
  goBackStep,
  completedSteps,
  wizardProgress,
  isWizardComplete,
  isValidStep,
} from '../WizardStateMachine.js'
import {
  evaluatePublishReadiness,
  isReadyToPublish,
} from '../PublishReadinessGate.js'
import type { BlueprintForQuality } from '../../blueprints/validateBlueprintQuality.js'

// ─── Fixtures ────────────────────────────────────────────────────────

function makeValidBlueprint(): BlueprintForQuality {
  return {
    id: 'law-firm',
    name: 'Law Firm',
    version: '2.0.0',
    required_pages: [
      { slug: 'home', title: 'Home', required_sections: ['hero', 'cta'] },
      { slug: 'about', title: 'About', required_sections: ['about-intro'] },
      { slug: 'services', title: 'Services', required_sections: ['service-list'] },
      { slug: 'contact', title: 'Contact', required_sections: ['contact-form'] },
      { slug: 'faq', title: 'FAQ', required_sections: ['faq-section'] },
    ],
    required_sections: [
      { id: 'hero', component: 'hero-banner', required: true },
      { id: 'cta', component: 'cta-block', required: true },
      { id: 'about-intro', component: 'text-block', required: true },
      { id: 'service-list', component: 'service-list', required: true },
      { id: 'contact-form', component: 'contact-form', required: true },
      { id: 'faq-section', component: 'faq-accordion', required: true },
      { id: 'testimonials', component: 'testimonial-carousel', required: true },
      { id: 'trust', component: 'trust-badge-row', required: true },
    ],
    required_components: [
      'hero-banner', 'site-header', 'nav-bar', 'site-footer',
      'cta-block', 'contact-form', 'faq-accordion',
      'testimonial-carousel', 'trust-badge-row',
      'text-block', 'service-list', 'team-grid',
    ],
    optional_components: [
      'stats-counter', 'pricing-table', 'process-timeline',
      'image-gallery', 'blog-feed', 'case-results-table',
      'social-proof-bar',
    ],
    style_presets: ['preset-a', 'preset-b', 'preset-c'],
    compliance_blocks: [
      { id: 'priv', type: 'privacy', required: true },
      { id: 'terms', type: 'terms', required: true },
      { id: 'a11y', type: 'accessibility', required: true },
    ],
    content_requirements: {
      min_pages: 5,
      min_sections: 6,
      min_words_per_page: 100,
      require_contact_info: true,
      require_business_name: true,
    },
    demo_watermark_profile: {
      enabled: true,
      text: 'PREVIEW',
      opacity: 0.15,
      position: 'diagonal',
    },
    seo_profile: {
      title_pattern: '{{businessName}}',
      description_pattern: '{{businessName}} services',
      schema_type: 'LegalService',
      og_image_pattern: '{{businessName}}',
      keywords: ['law', 'attorney', 'legal'],
    },
  }
}

/** Build a fully-completed wizard state for readiness tests. */
function makeCompleteWizardState(): WizardState {
  return {
    currentStep: 'publish',
    businessType: { businessTypeId: 'law-firm' },
    businessInfo: {
      businessName: 'Test Firm',
      city: 'Austin',
      state: 'TX',
      email: 'test@example.com',
    },
    stylePreset: { presetId: 'lawfirm-classic' },
    contentReview: { confirmed: true },
    preview: { previewViewed: true, previewTimestamp: Date.now() },
    publish: { targetId: 'hosted', confirmed: true },
  }
}

// ─── Schema Tests ────────────────────────────────────────────────────

describe('WizardSchema', () => {
  describe('BusinessTypeStepSchema', () => {
    it('accepts valid business type', () => {
      const result = BusinessTypeStepSchema.safeParse({ businessTypeId: 'law-firm' })
      expect(result.success).toBe(true)
    })

    it('rejects unknown business type', () => {
      const result = BusinessTypeStepSchema.safeParse({ businessTypeId: 'bakery' })
      expect(result.success).toBe(false)
    })

    it('accepts all 5 business types', () => {
      for (const id of BUSINESS_TYPE_IDS) {
        expect(BusinessTypeStepSchema.safeParse({ businessTypeId: id }).success).toBe(true)
      }
    })
  })

  describe('BusinessInfoStepSchema', () => {
    const valid = { businessName: 'Acme Corp', city: 'Austin', state: 'TX', email: 'a@b.com' }

    it('accepts valid info', () => {
      expect(BusinessInfoStepSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects missing business name', () => {
      expect(BusinessInfoStepSchema.safeParse({ ...valid, businessName: '' }).success).toBe(false)
    })

    it('rejects invalid email', () => {
      expect(BusinessInfoStepSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false)
    })

    it('rejects 3-letter state', () => {
      expect(BusinessInfoStepSchema.safeParse({ ...valid, state: 'TXA' }).success).toBe(false)
    })

    it('accepts optional fields', () => {
      const withOpts = { ...valid, phone: '5125550142', address: '200 Main St', tagline: 'Best firm' }
      expect(BusinessInfoStepSchema.safeParse(withOpts).success).toBe(true)
    })
  })

  describe('StylePresetStepSchema', () => {
    it('accepts valid preset', () => {
      expect(StylePresetStepSchema.safeParse({ presetId: 'lawfirm-classic' }).success).toBe(true)
    })

    it('rejects empty preset', () => {
      expect(StylePresetStepSchema.safeParse({ presetId: '' }).success).toBe(false)
    })
  })

  describe('ContentReviewStepSchema', () => {
    it('accepts confirmed review', () => {
      expect(ContentReviewStepSchema.safeParse({ confirmed: true }).success).toBe(true)
    })

    it('rejects unconfirmed review', () => {
      expect(ContentReviewStepSchema.safeParse({ confirmed: false }).success).toBe(false)
    })
  })

  describe('PreviewStepSchema', () => {
    it('accepts viewed preview', () => {
      expect(PreviewStepSchema.safeParse({ previewViewed: true, previewTimestamp: Date.now() }).success).toBe(true)
    })

    it('rejects unviewed preview', () => {
      expect(PreviewStepSchema.safeParse({ previewViewed: false, previewTimestamp: Date.now() }).success).toBe(false)
    })

    it('rejects missing timestamp', () => {
      expect(PreviewStepSchema.safeParse({ previewViewed: true }).success).toBe(false)
    })
  })

  describe('PublishStepSchema', () => {
    it('accepts valid publish', () => {
      expect(PublishStepSchema.safeParse({ targetId: 'hosted', confirmed: true }).success).toBe(true)
    })

    it('rejects invalid target', () => {
      expect(PublishStepSchema.safeParse({ targetId: 'ftp', confirmed: true }).success).toBe(false)
    })

    it('rejects unconfirmed', () => {
      expect(PublishStepSchema.safeParse({ targetId: 'hosted', confirmed: false }).success).toBe(false)
    })
  })

  it('STEP_SCHEMAS has entry for each step', () => {
    for (const step of WIZARD_STEPS) {
      expect(STEP_SCHEMAS[step]).toBeDefined()
    }
  })

  it('STEP_DATA_KEYS has entry for each step', () => {
    for (const step of WIZARD_STEPS) {
      expect(STEP_DATA_KEYS[step]).toBeDefined()
    }
  })
})

// ─── State Machine Tests ─────────────────────────────────────────────

describe('WizardStateMachine', () => {
  describe('createWizardState', () => {
    it('starts at the first step', () => {
      const state = createWizardState()
      expect(state.currentStep).toBe(WIZARD_STEPS[0])
    })

    it('has no step data initially', () => {
      const state = createWizardState()
      expect(state.businessType).toBeUndefined()
      expect(state.businessInfo).toBeUndefined()
      expect(state.stylePreset).toBeUndefined()
      expect(state.contentReview).toBeUndefined()
      expect(state.preview).toBeUndefined()
      expect(state.publish).toBeUndefined()
    })
  })

  describe('advanceStep', () => {
    it('advances from step 1 to step 2 on valid data', () => {
      const state = createWizardState()
      const result = advanceStep(state, { businessTypeId: 'law-firm' })
      expect(result.success).toBe(true)
      expect(result.state.currentStep).toBe('business-info')
      expect(result.state.businessType).toEqual({ businessTypeId: 'law-firm' })
    })

    it('rejects invalid step data', () => {
      const state = createWizardState()
      const result = advanceStep(state, { businessTypeId: 'bakery' })
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.state.currentStep).toBe('business-type')
    })

    it('does not mutate original state', () => {
      const state = createWizardState()
      const result = advanceStep(state, { businessTypeId: 'law-firm' })
      expect(state.currentStep).toBe('business-type')
      expect(result.state.currentStep).toBe('business-info')
    })

    it('advances through all steps sequentially', () => {
      let state = createWizardState()

      // Step 1 → 2
      let r = advanceStep(state, { businessTypeId: 'agency' })
      expect(r.success).toBe(true)
      state = r.state

      // Step 2 → 3
      r = advanceStep(state, { businessName: 'Test Agency', city: 'Portland', state: 'OR', email: 'a@b.com' })
      expect(r.success).toBe(true)
      state = r.state

      // Step 3 → 4
      r = advanceStep(state, { presetId: 'agency-bold' })
      expect(r.success).toBe(true)
      state = r.state

      // Step 4 → 5
      r = advanceStep(state, { confirmed: true })
      expect(r.success).toBe(true)
      state = r.state

      // Step 5 → 6
      r = advanceStep(state, { previewViewed: true, previewTimestamp: Date.now() })
      expect(r.success).toBe(true)
      state = r.state

      expect(state.currentStep).toBe('publish')
    })

    it('blocks advance from final step', () => {
      const state: WizardState = {
        ...makeCompleteWizardState(),
        currentStep: 'publish',
      }
      const result = advanceStep(state, { targetId: 'hosted', confirmed: true })
      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('final step')
    })
  })

  describe('goBackStep', () => {
    it('goes back one step', () => {
      let state = createWizardState()
      const r = advanceStep(state, { businessTypeId: 'contractor' })
      state = r.state
      expect(state.currentStep).toBe('business-info')

      const back = goBackStep(state)
      expect(back.success).toBe(true)
      expect(back.state.currentStep).toBe('business-type')
    })

    it('preserves data when going back', () => {
      let state = createWizardState()
      const r = advanceStep(state, { businessTypeId: 'contractor' })
      state = r.state

      const back = goBackStep(state)
      expect(back.state.businessType).toEqual({ businessTypeId: 'contractor' })
    })

    it('blocks going back from step 1', () => {
      const state = createWizardState()
      const result = goBackStep(state)
      expect(result.success).toBe(false)
      expect(result.errors[0]).toContain('first step')
    })
  })

  describe('completedSteps', () => {
    it('returns empty for fresh state', () => {
      expect(completedSteps(createWizardState())).toEqual([])
    })

    it('tracks completed steps', () => {
      let state = createWizardState()
      state = advanceStep(state, { businessTypeId: 'nonprofit' }).state
      const done = completedSteps(state)
      expect(done).toContain('business-type')
      expect(done).not.toContain('business-info')
    })
  })

  describe('wizardProgress', () => {
    it('returns 0 for fresh state', () => {
      expect(wizardProgress(createWizardState())).toBe(0)
    })

    it('returns 100 for complete state', () => {
      expect(wizardProgress(makeCompleteWizardState())).toBe(100)
    })
  })

  describe('isWizardComplete', () => {
    it('returns false for fresh state', () => {
      expect(isWizardComplete(createWizardState())).toBe(false)
    })

    it('returns true for complete state', () => {
      expect(isWizardComplete(makeCompleteWizardState())).toBe(true)
    })
  })

  describe('isValidStep', () => {
    it('accepts all wizard step IDs', () => {
      for (const step of WIZARD_STEPS) {
        expect(isValidStep(step)).toBe(true)
      }
    })

    it('rejects unknown step IDs', () => {
      expect(isValidStep('unknown')).toBe(false)
      expect(isValidStep('')).toBe(false)
    })
  })
})

// ─── Publish Readiness Gate Tests ────────────────────────────────────

describe('PublishReadinessGate', () => {
  const bp = makeValidBlueprint()

  describe('evaluatePublishReadiness', () => {
    it('returns ready for complete state + valid blueprint', () => {
      const state = makeCompleteWizardState()
      const result = evaluatePublishReadiness(state, bp)
      expect(result.ready).toBe(true)
      expect(result.blockers).toHaveLength(0)
    })

    it('blocks if no blueprint provided', () => {
      const state = makeCompleteWizardState()
      const result = evaluatePublishReadiness(state, null)
      expect(result.ready).toBe(false)
      expect(result.blockers.some(b => b.includes('No blueprint'))).toBe(true)
    })

    it('blocks if preview not viewed', () => {
      const state: WizardState = {
        ...makeCompleteWizardState(),
        preview: { previewViewed: false, previewTimestamp: 0 },
      }
      const result = evaluatePublishReadiness(state, bp)
      expect(result.ready).toBe(false)
      expect(result.blockers.some(b => b.includes('preview'))).toBe(true)
    })

    it('blocks if publish not confirmed', () => {
      const state: WizardState = {
        ...makeCompleteWizardState(),
        publish: { targetId: 'hosted', confirmed: false },
      }
      const result = evaluatePublishReadiness(state, bp)
      expect(result.ready).toBe(false)
    })

    it('blocks if business info missing', () => {
      const state: WizardState = {
        ...makeCompleteWizardState(),
        businessInfo: undefined,
      }
      const result = evaluatePublishReadiness(state, bp)
      expect(result.ready).toBe(false)
      expect(result.blockers.some(b => b.includes('Business name'))).toBe(true)
    })

    it('blocks if step data missing', () => {
      const state: WizardState = {
        ...makeCompleteWizardState(),
        stylePreset: undefined,
      }
      const result = evaluatePublishReadiness(state, bp)
      expect(result.ready).toBe(false)
    })

    it('returns all blockers, does not short-circuit', () => {
      const state = createWizardState()
      const result = evaluatePublishReadiness(state, null)
      // Should have multiple blockers: missing steps, no blueprint, no preview, no publish, no info
      expect(result.blockers.length).toBeGreaterThan(3)
    })

    it('each check has id, label, passed, and message', () => {
      const state = makeCompleteWizardState()
      const result = evaluatePublishReadiness(state, bp)
      for (const check of result.checks) {
        expect(check.id).toBeTruthy()
        expect(check.label).toBeTruthy()
        expect(typeof check.passed).toBe('boolean')
        expect(check.message).toBeTruthy()
      }
    })
  })

  describe('isReadyToPublish', () => {
    it('returns true for complete & valid', () => {
      expect(isReadyToPublish(makeCompleteWizardState(), bp)).toBe(true)
    })

    it('returns false for incomplete', () => {
      expect(isReadyToPublish(createWizardState(), bp)).toBe(false)
    })

    it('returns false for null blueprint', () => {
      expect(isReadyToPublish(makeCompleteWizardState(), null)).toBe(false)
    })
  })
})
