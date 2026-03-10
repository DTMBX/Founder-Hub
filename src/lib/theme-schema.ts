/**
 * theme-schema.ts — Zod schemas for theme tokens and presets.
 *
 * Validates theme data written by the style editor / visual builder.
 * Mirrors the themeConfig shape in site.config.ts and the CSS vars
 * managed by DevCustomizer's StylePanel.
 */

import { z } from 'zod'

// ─── Theme Preset Names ─────────────────────────────────────────────────────

export const ThemePresetSchema = z.enum([
  'default', 'law-firm', 'medical', 'contractor', 'nonprofit', 'ecommerce',
])

export type ThemePresetName = z.infer<typeof ThemePresetSchema>

// ─── Color Tokens ───────────────────────────────────────────────────────────

/** CSS color value — hex, hsl, rgb, oklch, or named color */
const CSSColor = z.string().min(1)

export const ThemeColorsSchema = z.object({
  primary: CSSColor,
  secondary: CSSColor,
  accent: CSSColor,
  background: CSSColor,
  foreground: CSSColor,
  muted: CSSColor,
  border: CSSColor,
})

export type ThemeColors = z.infer<typeof ThemeColorsSchema>

// ─── Typography ─────────────────────────────────────────────────────────────

export const ThemeFontsSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
  mono: z.string().min(1),
})

// ─── Effects ────────────────────────────────────────────────────────────────

export const ThemeEffectsSchema = z.object({
  glassmorphism: z.boolean(),
  animations: z.boolean(),
  particles: z.boolean(),
  gradients: z.boolean(),
  shadows: z.boolean(),
})

// ─── Layout ─────────────────────────────────────────────────────────────────

export const ThemeLayoutSchema = z.object({
  maxWidth: z.string(),
  containerPadding: z.string(),
  sectionSpacing: z.string(),
  noWhitespace: z.boolean().optional(),
})

// ─── CSS Variable Overrides (StylePanel format) ─────────────────────────────

export const CSSVarOverridesSchema = z.record(z.string(), z.string())

// ─── Full Theme Token File ──────────────────────────────────────────────────

export const ThemeTokensSchema = z.object({
  /** Which preset this was based on */
  preset: ThemePresetSchema.optional(),
  colors: ThemeColorsSchema.optional(),
  fonts: ThemeFontsSchema.optional(),
  effects: ThemeEffectsSchema.optional(),
  layout: ThemeLayoutSchema.optional(),
  /** Raw CSS variable overrides from the style panel (e.g. '--background': '222 47% 8%') */
  cssVarOverrides: CSSVarOverridesSchema.optional(),
  /** Custom CSS injected via the style panel */
  customCSS: z.string().optional(),
})

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>

// ─── DevCustomizer CSS Var Presets ──────────────────────────────────────────

export const StylePresetSchema = z.object({
  name: z.string().min(1),
  vars: z.record(z.string(), z.string()),
})

export const StylePresetsArraySchema = z.array(StylePresetSchema)

// ─── Validation helpers ─────────────────────────────────────────────────────

export function validateThemeTokens(data: unknown) {
  const result = ThemeTokensSchema.safeParse(data)
  if (result.success) return { success: true as const, data: result.data }
  return {
    success: false as const,
    error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
    issues: result.error.issues,
  }
}

/** Default empty theme tokens (no overrides, no custom CSS) */
export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  preset: 'default',
  colors: undefined,
  fonts: undefined,
  effects: undefined,
  layout: undefined,
  cssVarOverrides: undefined,
  customCSS: undefined,
}
