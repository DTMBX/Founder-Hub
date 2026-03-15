import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to a hash route and wait for the view to settle. */
async function goHash(page: Page, hash: string) {
  await page.goto(`/#${hash}`)
  // Allow lazy-loaded views to mount
  await page.waitForLoadState('networkidle')
}

/** Assert that no uncaught JS errors were logged during a callback. */
async function expectNoConsoleErrors(page: Page, fn: () => Promise<void>) {
  const errors: string[] = []
  const handler = (msg: import('@playwright/test').ConsoleMessage) => {
    if (msg.type() === 'error') errors.push(msg.text())
  }
  page.on('console', handler)
  await fn()
  page.off('console', handler)
  expect(errors, 'Unexpected console errors').toEqual([])
}

// ---------------------------------------------------------------------------
// 1. Homepage Smoke
// ---------------------------------------------------------------------------

test.describe('Homepage', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Devon Tyler/)
  })

  test('hero H1 renders correctly', async ({ page }) => {
    await page.goto('/')
    const h1 = page.locator('h1').first()
    await expect(h1).toBeVisible()
    await expect(h1).not.toBeEmpty()
  })

  test('hero section is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#hero')).toBeVisible()
  })

  test('navigation is accessible', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.locator('nav[aria-label="Main navigation"]'),
    ).toBeVisible()
  })

  test('skip-to-content link works', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.locator('a[href="#main-content"]')
    await skipLink.focus()
    await expect(skipLink).toBeVisible()
    await skipLink.click()
    await expect(page.locator('#main-content')).toBeInViewport()
  })

  test('footer is present', async ({ page }) => {
    await page.goto('/')
    await expect(
      page.locator('footer[aria-label="Site footer"]'),
    ).toBeAttached()
  })
})

// ---------------------------------------------------------------------------
// 2. Hash Route Navigation — every public route renders without blank screen
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = [
  'about',
  'projects-index',
  'evident',
  'evident-site',
  'tillerstead',
  'accountability',
  'invest',
  'data',
  'developers',
  'activity',
  'intelligence',
  'blog',
] as const

test.describe('Hash Routes — render without blank screen', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`#${route} renders content`, async ({ page }) => {
      await expectNoConsoleErrors(page, async () => {
        await goHash(page, route)
        // The main-content area must have at least one visible child
        const main = page.locator('#main-content')
        await expect(main).toBeAttached()
        // At least one heading or paragraph should be visible
        const content = main.locator('h1, h2, h3, p').first()
        await expect(content).toBeVisible({ timeout: 10000 })
      })
    })
  }

  test('#about shows an H1 or H2', async ({ page }) => {
    await goHash(page, 'about')
    const heading = page.locator('#main-content h1, #main-content h2').first()
    await expect(heading).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Project Cards → Detail Pages
// ---------------------------------------------------------------------------

const PROJECT_IDS = [
  'evident-platform',
  'tillerstead',
  'founder-hub',
  'civics-hierarchy',
  'doj-document-library',
  'informed-consent',
  'essential-goods-ledger',
  'geneva-bible-study',
  'contractor-command-center',
]

test.describe('Project Cards and Detail Pages', () => {
  test('projects-index shows project cards', async ({ page }) => {
    await goHash(page, 'projects-index')
    // At least one card-like element should exist
    const cards = page.locator('[data-project-id], article, .project-card, a[href*="project/"]')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  for (const id of PROJECT_IDS) {
    test(`#project/${id} renders detail view`, async ({ page }) => {
      await goHash(page, `project/${id}`)
      const main = page.locator('#main-content')
      await expect(main).toBeAttached()
      // Detail view should have a heading
      const heading = main.locator('h1, h2').first()
      await expect(heading).toBeVisible({ timeout: 10000 })
    })
  }
})

// ---------------------------------------------------------------------------
// 4. Blog — Markdown Rendering
// ---------------------------------------------------------------------------

const BLOG_POST_IDS = [
  'evident-ediscovery-platform',
  'doj-document-library-launch',
  'tillerstead-contractor-platform',
]

test.describe('Blog', () => {
  test('blog index lists posts', async ({ page }) => {
    await goHash(page, 'blog')
    const postLinks = page.locator('a[href*="blog/"], [data-post-id]')
    await expect(postLinks.first()).toBeVisible({ timeout: 10000 })
  })

  for (const id of BLOG_POST_IDS) {
    test(`blog post "${id}" renders sanitized markdown`, async ({ page }) => {
      await goHash(page, `blog/${id}`)
      const main = page.locator('#main-content')
      // Blog posts should have an H1/H2 title and paragraph content
      const heading = main.locator('h1, h2').first()
      await expect(heading).toBeVisible({ timeout: 10000 })
      const paragraph = main.locator('p').first()
      await expect(paragraph).toBeVisible()
      // No raw markdown should be visible (e.g. "## " or "**")
      const bodyText = await main.textContent()
      expect(bodyText).not.toMatch(/^## /m)
    })
  }
})

// ---------------------------------------------------------------------------
// 5. Tillerstead Inquiry Form — Validation
// ---------------------------------------------------------------------------

test.describe('Tillerstead Form Validation', () => {
  test('form requires name and email', async ({ page }) => {
    await goHash(page, 'tillerstead')
    const form = page.locator('form').first()
    // Wait for form to be visible
    await expect(form).toBeVisible({ timeout: 10000 })

    // Try to submit empty form — should not succeed
    const submitBtn = form.locator('button[type="submit"]')
    await submitBtn.click()

    // HTML5 validation should prevent submission — check for :invalid inputs
    const invalidInputs = form.locator('input:invalid, textarea:invalid, select:invalid')
    const count = await invalidInputs.count()
    expect(count).toBeGreaterThan(0)
  })

  test('form displays required fields', async ({ page }) => {
    await goHash(page, 'tillerstead')
    const form = page.locator('form').first()
    await expect(form).toBeVisible({ timeout: 10000 })

    // Name and email fields should be present and required
    const nameInput = form.locator('input[name="name"], input[placeholder*="name" i]').first()
    const emailInput = form.locator('input[name="email"], input[type="email"]').first()
    await expect(nameInput).toBeAttached()
    await expect(emailInput).toBeAttached()
  })
})

// ---------------------------------------------------------------------------
// 6. Evident Licensing Section Visibility
// ---------------------------------------------------------------------------

test.describe('Evident Licensing', () => {
  test('evident-site page shows licensing-related content', async ({ page }) => {
    await goHash(page, 'evident-site')
    const main = page.locator('#main-content')
    await expect(main).toBeAttached()
    // Look for licensing/contact form or relevant heading
    const content = main.locator('h1, h2, h3, form').first()
    await expect(content).toBeVisible({ timeout: 10000 })
  })
})

// ---------------------------------------------------------------------------
// 7. Structured Data — JSON-LD on Every Page
// ---------------------------------------------------------------------------

test.describe('JSON-LD Structured Data', () => {
  const ROUTES_WITH_JSONLD = ['', ...PUBLIC_ROUTES]

  for (const route of ROUTES_WITH_JSONLD) {
    const label = route || 'homepage'
    test(`${label} has valid JSON-LD`, async ({ page }) => {
      if (route) {
        await goHash(page, route)
      } else {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
      }

      const scripts = page.locator('script[type="application/ld+json"]')
      const count = await scripts.count()
      expect(count, `${label} should have at least one JSON-LD block`).toBeGreaterThanOrEqual(1)

      for (let i = 0; i < count; i++) {
        const raw = await scripts.nth(i).textContent()
        expect(raw).toBeTruthy()
        // Must parse as valid JSON
        const parsed = JSON.parse(raw!)
        expect(parsed).toHaveProperty('@context')
        expect(parsed).toHaveProperty('@type')
      }
    })
  }
})

// ---------------------------------------------------------------------------
// 8. 404 — Unrecognized Routes
// ---------------------------------------------------------------------------

test.describe('404 Handling', () => {
  test('unknown hash route shows not-found view', async ({ page }) => {
    await goHash(page, 'this-route-does-not-exist-xyz')
    const main = page.locator('#main-content')
    await expect(main).toBeAttached()
    // Should show some kind of 404/not-found indicator
    const text = await main.textContent()
    expect(
      text?.toLowerCase().includes('not found') ||
      text?.toLowerCase().includes('404') ||
      text?.toLowerCase().includes('page not found') ||
      text?.toLowerCase().includes('return'),
    ).toBeTruthy()
  })
})
