/**
 * apps/sitegen/preview/DeviceFrames.ts
 *
 * Device frame configurations for preview rendering.
 * Each frame defines viewport dimensions and a label for the operator
 * to toggle between desktop, tablet, and mobile previews.
 *
 * These are data-only definitions — rendering is handled by the UI layer.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface DeviceFrame {
  readonly id: string
  readonly label: string
  readonly width: number
  readonly height: number
  readonly devicePixelRatio: number
  readonly orientation: 'portrait' | 'landscape'
  readonly category: 'desktop' | 'tablet' | 'mobile'
}

// ─── Device Frame Definitions ────────────────────────────────────────

export const DEVICE_FRAMES: readonly DeviceFrame[] = [
  // Desktop
  {
    id: 'desktop-1920',
    label: 'Desktop (1920 × 1080)',
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
    orientation: 'landscape',
    category: 'desktop',
  },
  {
    id: 'desktop-1440',
    label: 'Desktop (1440 × 900)',
    width: 1440,
    height: 900,
    devicePixelRatio: 1,
    orientation: 'landscape',
    category: 'desktop',
  },
  {
    id: 'desktop-1280',
    label: 'Desktop (1280 × 720)',
    width: 1280,
    height: 720,
    devicePixelRatio: 1,
    orientation: 'landscape',
    category: 'desktop',
  },

  // Tablet
  {
    id: 'tablet-ipad',
    label: 'iPad (1024 × 1366)',
    width: 1024,
    height: 1366,
    devicePixelRatio: 2,
    orientation: 'portrait',
    category: 'tablet',
  },
  {
    id: 'tablet-ipad-landscape',
    label: 'iPad Landscape (1366 × 1024)',
    width: 1366,
    height: 1024,
    devicePixelRatio: 2,
    orientation: 'landscape',
    category: 'tablet',
  },

  // Mobile
  {
    id: 'mobile-iphone-14',
    label: 'iPhone 14 (390 × 844)',
    width: 390,
    height: 844,
    devicePixelRatio: 3,
    orientation: 'portrait',
    category: 'mobile',
  },
  {
    id: 'mobile-pixel-7',
    label: 'Pixel 7 (412 × 915)',
    width: 412,
    height: 915,
    devicePixelRatio: 2.625,
    orientation: 'portrait',
    category: 'mobile',
  },
  {
    id: 'mobile-small',
    label: 'Small Phone (375 × 667)',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    orientation: 'portrait',
    category: 'mobile',
  },
] as const

// ─── Helpers ─────────────────────────────────────────────────────────

/** Get all frames for a given category. */
export function getFramesByCategory(category: DeviceFrame['category']): readonly DeviceFrame[] {
  return DEVICE_FRAMES.filter(f => f.category === category)
}

/** Get a single frame by ID. */
export function getFrameById(id: string): DeviceFrame | undefined {
  return DEVICE_FRAMES.find(f => f.id === id)
}

/** Default preview frame (desktop 1440). */
export const DEFAULT_FRAME_ID = 'desktop-1440'

/** Get the default frame. */
export function getDefaultFrame(): DeviceFrame {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return getFrameById(DEFAULT_FRAME_ID)!
}
