/**
 * Environment Validation
 *
 * Validates VITE_* environment variables at import-time so misconfigurations
 * fail fast with a clear message instead of silently using fallbacks.
 *
 * Only validates variables that are actually set — optional/absent vars
 * are fine (the defaults in site.config.ts handle those).
 */

import { z } from 'zod'

const envSchema = z.object({
  // Auth — must NEVER leak into a production bundle
  VITE_ADMIN_EMAIL: z.string().email().optional(),
  VITE_ADMIN_PASSWORD: z.string().min(12, 'Admin password must be ≥12 chars').optional(),

  // Site identity
  VITE_SITE_NAME: z.string().min(1).optional(),
  VITE_SITE_DOMAIN: z.string().min(1).optional(),
  VITE_SITE_ID: z.string().regex(/^[a-z0-9-]+$/, 'Site ID must be lowercase alphanumeric + hyphens').optional(),

  // Ports
  VITE_PORT: z.coerce.number().int().min(1024).max(65535).optional(),

  // Theme
  VITE_THEME_PRESET: z.enum(['default', 'law-firm', 'medical', 'contractor', 'nonprofit', 'ecommerce']).optional(),

  // Colors (hex)
  VITE_COLOR_PRIMARY: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex color').optional(),
  VITE_COLOR_ACCENT: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex color').optional(),
  VITE_COLOR_BACKGROUND: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a 6-digit hex color').optional(),

  // Stripe
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
})

type EnvConfig = z.infer<typeof envSchema>

/** Parsed and validated env. Throws at import time if invalid values are set. */
export const env: EnvConfig = (() => {
  // Collect only VITE_ vars that are actually defined
  const raw: Record<string, string> = {}
  for (const [key, value] of Object.entries(import.meta.env)) {
    if (key.startsWith('VITE_') && typeof value === 'string' && value !== '') {
      raw[key] = value
    }
  }

  const result = envSchema.safeParse(raw)

  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    const msg = `[env] Invalid environment variables:\n${issues}`

    // In dev, warn loudly but don't crash (allow iteration)
    if (import.meta.env.DEV) {
      console.error(msg)
      return raw as unknown as EnvConfig
    }
    // In production, fail hard — bad config should never reach users
    throw new Error(msg)
  }

  return result.data
})()
