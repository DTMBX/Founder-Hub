/**
 * Pipeline Step: Watermark
 *
 * Injects demo watermark overlay into rendered pages.
 * Controlled by the blueprint's demo_watermark_profile.
 */

import type {
  RenderResult,
  WatermarkResult,
  WatermarkedPage,
} from './types'

// ─── Watermark Profile ───────────────────────────────────────

export interface WatermarkProfile {
  readonly enabled: boolean
  readonly text: string
  readonly opacity: number
  readonly position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'diagonal'
}

// ─── Watermark Injection ─────────────────────────────────────

/**
 * Injects a watermark overlay into each page's HTML.
 *
 * If the watermark profile is disabled, pages pass through unchanged
 * with `watermarked: false`.
 */
export function watermark(
  renderResult: RenderResult,
  profile: WatermarkProfile,
): WatermarkResult {
  if (!profile.enabled) {
    return {
      pages: renderResult.pages.map((p) => ({
        ...p,
        watermarked: false,
      })),
      assets: renderResult.assets,
      watermarkApplied: false,
    }
  }

  const watermarkCss = generateWatermarkCSS(profile)
  const watermarkHtml = generateWatermarkHTML(profile)

  const pages: WatermarkedPage[] = renderResult.pages.map((page) => {
    // Inject watermark CSS before </head> and watermark HTML before </body>
    let html = page.html
    html = html.replace('</head>', `${watermarkCss}\n</head>`)
    html = html.replace('</body>', `${watermarkHtml}\n</body>`)
    return { slug: page.slug, title: page.title, html, watermarked: true }
  })

  return { pages, assets: renderResult.assets, watermarkApplied: true }
}

// ─── Helpers ─────────────────────────────────────────────────

function generateWatermarkCSS(profile: WatermarkProfile): string {
  const positionStyles = getPositionStyles(profile.position)
  return [
    '<style data-watermark="true">',
    '.sitegen-watermark {',
    '  position: fixed;',
    `  ${positionStyles}`,
    '  pointer-events: none;',
    '  user-select: none;',
    `  opacity: ${profile.opacity};`,
    '  color: #000;',
    '  font-size: 2rem;',
    '  font-weight: 700;',
    '  z-index: 99999;',
    '  font-family: system-ui, sans-serif;',
    profile.position === 'diagonal'
      ? '  transform: rotate(-35deg); transform-origin: center;'
      : '',
    '}',
    '</style>',
  ]
    .filter(Boolean)
    .join('\n')
}

function generateWatermarkHTML(profile: WatermarkProfile): string {
  return `<div class="sitegen-watermark" aria-hidden="true">${escapeHtml(profile.text)}</div>`
}

function getPositionStyles(
  position: WatermarkProfile['position'],
): string {
  switch (position) {
    case 'top-left':
      return 'top: 1rem; left: 1rem;'
    case 'top-right':
      return 'top: 1rem; right: 1rem;'
    case 'bottom-left':
      return 'bottom: 1rem; left: 1rem;'
    case 'bottom-right':
      return 'bottom: 1rem; right: 1rem;'
    case 'center':
      return 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
    case 'diagonal':
      return 'top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-35deg);'
    default:
      return 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
