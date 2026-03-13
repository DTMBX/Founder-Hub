import { test, expect } from '@playwright/test'

test.describe('Public Site — Smoke Tests', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Devon Tyler/)
  })

  test('hero section is visible', async ({ page }) => {
    await page.goto('/')
    const hero = page.locator('#hero')
    await expect(hero).toBeVisible()
  })

  test('navigation is accessible', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await expect(nav).toBeVisible()
  })

  test('skip-to-content link works', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.locator('a[href="#main-content"]')
    await skipLink.focus()
    await expect(skipLink).toBeVisible()
    await skipLink.click()
    const main = page.locator('#main-content')
    await expect(main).toBeInViewport()
  })

  test('footer is present', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('footer[aria-label="Site footer"]')
    await expect(footer).toBeAttached()
  })
})
