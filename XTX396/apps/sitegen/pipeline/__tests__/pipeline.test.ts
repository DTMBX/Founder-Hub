import { describe, it, expect, beforeEach } from 'vitest'
import { validate } from '../validate'
import { scaffold } from '../scaffold'
import { render } from '../render'
import { watermark, type WatermarkProfile } from '../watermark'
import { hash, sha256 } from '../hash'
import {
  store,
  generateSiteId,
  InMemoryStorageAdapter,
} from '../store'
import { runPipeline, type BlueprintForPipeline } from '../pipeline'
import type { GenerationInput } from '../types'

// ─── Fixtures ────────────────────────────────────────────────

const VALID_INPUT: GenerationInput = {
  blueprintId: 'law-firm',
  businessName: 'Smith & Associates',
  contactInfo: 'contact@smithlaw.com',
  address: '123 Main St, Springfield, IL 62701',
  operatorId: 'op_001',
  requestedAt: '2026-02-18T12:00:00Z',
  pageContent: {
    home: {
      title: 'Welcome to Smith & Associates',
      body: 'We provide experienced legal representation across many practice areas. Our team is dedicated to achieving the best outcomes for every client we serve.',
    },
    about: {
      title: 'About Our Firm',
      body: 'Smith & Associates has been serving clients for over 25 years. We bring dedication, integrity, and skill to every case we handle in our practice.',
    },
    'practice-areas': {
      title: 'Practice Areas',
      body: 'Our firm handles criminal defense, personal injury, family law, and business litigation. Each practice area is led by experienced attorneys with deep expertise.',
    },
    contact: {
      title: 'Contact Us',
      body: 'Reach out to schedule a consultation. We offer in-person meetings and virtual consultations for your convenience. Call us today at 555-0100.',
    },
  },
}

const TEST_BLUEPRINT: BlueprintForPipeline = {
  id: 'law-firm',
  version: '1.0.0',
  required_pages: [
    { slug: 'home', title: 'Home', template: 'law-firm-home', required_sections: ['hero', 'cta'] },
    { slug: 'about', title: 'About', template: 'law-firm-about', required_sections: ['about-intro'] },
    { slug: 'practice-areas', title: 'Practice Areas', template: 'law-firm-practice', required_sections: ['practice-list'] },
    { slug: 'contact', title: 'Contact', template: 'law-firm-contact', required_sections: ['contact-form'] },
  ],
  required_sections: [
    { id: 'hero', label: 'Hero', component: 'hero-banner', order: 0, required: true },
    { id: 'cta', label: 'CTA', component: 'cta-block', order: 1, required: true },
    { id: 'about-intro', label: 'About', component: 'text-block', order: 0, required: true },
    { id: 'practice-list', label: 'Practices', component: 'service-list', order: 0, required: true },
    { id: 'contact-form', label: 'Contact Form', component: 'contact-form', order: 0, required: true },
  ],
  required_components: ['hero-banner', 'cta-block', 'text-block', 'service-list', 'contact-form'],
  content_requirements: {
    min_pages: 4,
    min_sections: 5,
    min_words_per_page: 10,
    require_contact_info: true,
    require_business_name: true,
    require_address: true,
    require_hours: false,
  },
  demo_watermark_profile: {
    enabled: true,
    text: 'PREVIEW — NOT A LIVE SITE',
    opacity: 0.15,
    position: 'diagonal',
  },
}

const DISABLED_WATERMARK: WatermarkProfile = {
  enabled: false,
  text: '',
  opacity: 0,
  position: 'center',
}

// ─── Validate ────────────────────────────────────────────────

describe('Pipeline: validate', () => {
  it('accepts valid input', () => {
    const result = validate(VALID_INPUT, TEST_BLUEPRINT)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects missing businessName', () => {
    const result = validate(
      { ...VALID_INPUT, businessName: '' },
      TEST_BLUEPRINT,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('businessName is required by this blueprint')
  })

  it('rejects missing contactInfo', () => {
    const result = validate(
      { ...VALID_INPUT, contactInfo: '' },
      TEST_BLUEPRINT,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('contactInfo is required by this blueprint')
  })

  it('rejects missing address when required', () => {
    const result = validate(
      { ...VALID_INPUT, address: '' },
      TEST_BLUEPRINT,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('address is required by this blueprint')
  })

  it('rejects missing operatorId', () => {
    const result = validate(
      { ...VALID_INPUT, operatorId: '' },
      TEST_BLUEPRINT,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('operatorId is required')
  })

  it('rejects missing requestedAt', () => {
    const result = validate(
      { ...VALID_INPUT, requestedAt: '' },
      TEST_BLUEPRINT,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('requestedAt is required')
  })

  it('rejects missing blueprintId', () => {
    const result = validate(
      { ...VALID_INPUT, blueprintId: '' },
      TEST_BLUEPRINT,
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('blueprintId is required')
  })

  it('collects multiple errors at once', () => {
    const result = validate(
      { ...VALID_INPUT, businessName: '', contactInfo: '', operatorId: '' },
      TEST_BLUEPRINT,
    )
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})

// ─── Scaffold ────────────────────────────────────────────────

describe('Pipeline: scaffold', () => {
  it('produces pages matching blueprint required_pages', () => {
    const result = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    expect(result.pages).toHaveLength(TEST_BLUEPRINT.required_pages.length)
    const slugs = result.pages.map((p) => p.slug)
    expect(slugs).toContain('home')
    expect(slugs).toContain('contact')
  })

  it('uses operator-provided titles when available', () => {
    const result = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const homePage = result.pages.find((p) => p.slug === 'home')
    expect(homePage?.title).toBe('Welcome to Smith & Associates')
  })

  it('falls back to blueprint title when no operator title provided', () => {
    const inputNoTitles: GenerationInput = {
      ...VALID_INPUT,
      pageContent: undefined,
    }
    const result = scaffold(inputNoTitles, TEST_BLUEPRINT)
    const homePage = result.pages.find((p) => p.slug === 'home')
    expect(homePage?.title).toBe('Home')
  })

  it('sections are sorted by order', () => {
    const result = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const homePage = result.pages.find((p) => p.slug === 'home')!
    for (let i = 1; i < homePage.sections.length; i++) {
      expect(homePage.sections[i].order).toBeGreaterThanOrEqual(
        homePage.sections[i - 1].order,
      )
    }
  })

  it('metadata contains blueprint info', () => {
    const result = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    expect(result.metadata.blueprintId).toBe('law-firm')
    expect(result.metadata.blueprintVersion).toBe('1.0.0')
    expect(result.metadata.businessName).toBe('Smith & Associates')
  })
})

// ─── Render ──────────────────────────────────────────────────

describe('Pipeline: render', () => {
  it('produces HTML for each scaffolded page', () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const result = render(scaffoldResult)
    expect(result.pages).toHaveLength(scaffoldResult.pages.length)
    for (const page of result.pages) {
      expect(page.html).toContain('<!DOCTYPE html>')
      expect(page.html).toContain(`<title>`)
      expect(page.html).toContain('</html>')
    }
  })

  it('includes section components in output', () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const result = render(scaffoldResult)
    const homePage = result.pages.find((p) => p.slug === 'home')!
    expect(homePage.html).toContain('data-component="hero-banner"')
    expect(homePage.html).toContain('data-component="cta-block"')
  })

  it('generates base CSS and JS assets', () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const result = render(scaffoldResult)
    expect(result.assets.length).toBeGreaterThanOrEqual(2)
    const css = result.assets.find((a) => a.type === 'css')
    const js = result.assets.find((a) => a.type === 'js')
    expect(css).toBeDefined()
    expect(js).toBeDefined()
  })

  it('generates a manifest.json asset', () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const result = render(scaffoldResult)
    const manifest = result.assets.find((a) => a.path === '/manifest.json')
    expect(manifest).toBeDefined()
    const parsed = JSON.parse(manifest!.content)
    expect(parsed.blueprint).toBe('law-firm')
  })

  it('escapes HTML in content', () => {
    const scaffoldResult = scaffold(
      {
        ...VALID_INPUT,
        pageContent: {
          home: { body: '<script>alert("xss")</script>' },
        },
      },
      TEST_BLUEPRINT,
    )
    const result = render(scaffoldResult)
    const home = result.pages.find((p) => p.slug === 'home')!
    expect(home.html).not.toContain('<script>alert')
    expect(home.html).toContain('&lt;script&gt;')
  })
})

// ─── Watermark ───────────────────────────────────────────────

describe('Pipeline: watermark', () => {
  it('injects watermark when enabled', () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const renderResult = render(scaffoldResult)
    const result = watermark(renderResult, TEST_BLUEPRINT.demo_watermark_profile)
    expect(result.watermarkApplied).toBe(true)
    for (const page of result.pages) {
      expect(page.watermarked).toBe(true)
      expect(page.html).toContain('sitegen-watermark')
      expect(page.html).toContain('PREVIEW')
    }
  })

  it('skips watermark when disabled', () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const renderResult = render(scaffoldResult)
    const result = watermark(renderResult, DISABLED_WATERMARK)
    expect(result.watermarkApplied).toBe(false)
    for (const page of result.pages) {
      expect(page.watermarked).toBe(false)
      expect(page.html).not.toContain('sitegen-watermark')
    }
  })

  it('watermark is aria-hidden', () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const renderResult = render(scaffoldResult)
    const result = watermark(renderResult, TEST_BLUEPRINT.demo_watermark_profile)
    for (const page of result.pages) {
      expect(page.html).toContain('aria-hidden="true"')
    }
  })
})

// ─── Hash ────────────────────────────────────────────────────

describe('Pipeline: hash', () => {
  it('sha256 produces deterministic hex output', async () => {
    const a = await sha256('hello')
    const b = await sha256('hello')
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })

  it('sha256 produces different hashes for different inputs', async () => {
    const a = await sha256('input-a')
    const b = await sha256('input-b')
    expect(a).not.toBe(b)
  })

  it('hash step produces artifacts and manifest hash', async () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const renderResult = render(scaffoldResult)
    const watermarkResult = watermark(
      renderResult,
      TEST_BLUEPRINT.demo_watermark_profile,
    )
    const result = await hash(watermarkResult)
    expect(result.artifacts.length).toBeGreaterThan(0)
    expect(result.manifestHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('artifacts are sorted by path', async () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const renderResult = render(scaffoldResult)
    const watermarkResult = watermark(
      renderResult,
      TEST_BLUEPRINT.demo_watermark_profile,
    )
    const result = await hash(watermarkResult)
    for (let i = 1; i < result.artifacts.length; i++) {
      expect(
        result.artifacts[i].path >= result.artifacts[i - 1].path,
      ).toBe(true)
    }
  })

  it('manifest hash is deterministic', async () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const renderResult = render(scaffoldResult)
    const watermarkResult = watermark(
      renderResult,
      TEST_BLUEPRINT.demo_watermark_profile,
    )
    const result1 = await hash(watermarkResult)
    const result2 = await hash(watermarkResult)
    expect(result1.manifestHash).toBe(result2.manifestHash)
  })

  it('each artifact has sha256 and size', async () => {
    const scaffoldResult = scaffold(VALID_INPUT, TEST_BLUEPRINT)
    const renderResult = render(scaffoldResult)
    const watermarkResult = watermark(
      renderResult,
      TEST_BLUEPRINT.demo_watermark_profile,
    )
    const result = await hash(watermarkResult)
    for (const artifact of result.artifacts) {
      expect(artifact.sha256).toMatch(/^[0-9a-f]{64}$/)
      expect(artifact.size).toBeGreaterThan(0)
      expect(artifact.path).toBeTruthy()
    }
  })
})

// ─── Store ───────────────────────────────────────────────────

describe('Pipeline: store', () => {
  let adapter: InMemoryStorageAdapter

  beforeEach(() => {
    adapter = new InMemoryStorageAdapter()
  })

  it('generateSiteId produces consistent IDs', () => {
    const a = generateSiteId('law-firm', 'op_001', '2026-02-18T12:00:00Z')
    const b = generateSiteId('law-firm', 'op_001', '2026-02-18T12:00:00Z')
    expect(a).toBe(b)
  })

  it('generateSiteId produces different IDs for different inputs', () => {
    const a = generateSiteId('law-firm', 'op_001', '2026-02-18T12:00:00Z')
    const b = generateSiteId('agency', 'op_002', '2026-02-18T13:00:00Z')
    expect(a).not.toBe(b)
  })

  it('stores and retrieves a site record', async () => {
    const siteId = 'site_test_001'
    const metadata = {
      blueprintId: 'law-firm',
      blueprintVersion: '1.0.0',
      presetId: 'default',
      businessName: 'Test',
      generatedAt: '2026-02-18T12:00:00Z',
    }
    const hashResult = {
      artifacts: [{ path: '/home.html', sha256: 'abc', size: 100 }],
      manifestHash: 'def',
    }
    const record = await store(siteId, metadata, hashResult, 'op_001', adapter)
    expect(record.siteId).toBe(siteId)
    expect(record.status).toBe('stored')

    const retrieved = await adapter.get(siteId)
    expect(retrieved).not.toBeNull()
    expect(retrieved!.siteId).toBe(siteId)
  })

  it('adapter.list returns all stored sites', async () => {
    const metadata = {
      blueprintId: 'law-firm',
      blueprintVersion: '1.0.0',
      presetId: 'default',
      businessName: 'Test',
      generatedAt: '2026-02-18T12:00:00Z',
    }
    const hashResult = {
      artifacts: [],
      manifestHash: 'abc',
    }
    await store('site_1', metadata, hashResult, 'op_001', adapter)
    await store('site_2', metadata, hashResult, 'op_002', adapter)
    const all = await adapter.list()
    expect(all).toHaveLength(2)
  })
})

// ─── Full Pipeline ───────────────────────────────────────────

describe('Pipeline: runPipeline (full)', () => {
  it('succeeds with valid input', async () => {
    const adapter = new InMemoryStorageAdapter()
    const result = await runPipeline(VALID_INPUT, TEST_BLUEPRINT, adapter)

    expect(result.success).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.validation.valid).toBe(true)
    expect(result.scaffold).toBeDefined()
    expect(result.render).toBeDefined()
    expect(result.watermark).toBeDefined()
    expect(result.hash).toBeDefined()
    expect(result.stored).toBeDefined()
    expect(result.duration).toBeGreaterThan(0)
  })

  it('fails closed on invalid input', async () => {
    const result = await runPipeline(
      { ...VALID_INPUT, businessName: '' },
      TEST_BLUEPRINT,
    )

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.scaffold).toBeUndefined()
    expect(result.render).toBeUndefined()
  })

  it('produces deterministic manifest hash', async () => {
    const result1 = await runPipeline(VALID_INPUT, TEST_BLUEPRINT)
    const result2 = await runPipeline(VALID_INPUT, TEST_BLUEPRINT)

    expect(result1.hash?.manifestHash).toBe(result2.hash?.manifestHash)
  })

  it('stores the site in the adapter', async () => {
    const adapter = new InMemoryStorageAdapter()
    const result = await runPipeline(VALID_INPUT, TEST_BLUEPRINT, adapter)

    expect(adapter.size).toBe(1)
    const stored = await adapter.get(result.siteId)
    expect(stored).not.toBeNull()
    expect(stored!.blueprintId).toBe('law-firm')
  })

  it('watermark is applied when enabled', async () => {
    const result = await runPipeline(VALID_INPUT, TEST_BLUEPRINT)
    expect(result.watermark?.watermarkApplied).toBe(true)
  })

  it('pages include proper HTML structure', async () => {
    const result = await runPipeline(VALID_INPUT, TEST_BLUEPRINT)
    for (const page of result.render!.pages) {
      expect(page.html).toContain('<!DOCTYPE html>')
      expect(page.html).toContain('</html>')
    }
  })

  it('siteId is deterministic for same input', async () => {
    const result1 = await runPipeline(VALID_INPUT, TEST_BLUEPRINT)
    const result2 = await runPipeline(VALID_INPUT, TEST_BLUEPRINT)
    expect(result1.siteId).toBe(result2.siteId)
  })
})

// ─── Determinism Invariant ───────────────────────────────────

describe('Determinism invariant', () => {
  it('same input produces byte-identical output', async () => {
    const result1 = await runPipeline(VALID_INPUT, TEST_BLUEPRINT)
    const result2 = await runPipeline(VALID_INPUT, TEST_BLUEPRINT)

    // Same pages
    expect(result1.render!.pages.length).toBe(result2.render!.pages.length)
    for (let i = 0; i < result1.render!.pages.length; i++) {
      expect(result1.render!.pages[i].html).toBe(result2.render!.pages[i].html)
    }

    // Same assets
    expect(result1.render!.assets.length).toBe(result2.render!.assets.length)
    for (let i = 0; i < result1.render!.assets.length; i++) {
      expect(result1.render!.assets[i].content).toBe(
        result2.render!.assets[i].content,
      )
    }

    // Same hashes
    expect(result1.hash!.manifestHash).toBe(result2.hash!.manifestHash)
    expect(result1.hash!.artifacts.length).toBe(result2.hash!.artifacts.length)
    for (let i = 0; i < result1.hash!.artifacts.length; i++) {
      expect(result1.hash!.artifacts[i].sha256).toBe(
        result2.hash!.artifacts[i].sha256,
      )
    }
  })
})
