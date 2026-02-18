/**
 * Honor Bar Layout Guard
 *
 * Dev-only utility that checks for CSS ancestors that could clip the
 * HonorFlagBar. Logs a warning if any ancestor sets overflow:hidden
 * or overflow:clip between the bar element and the viewport root.
 *
 * This is a defensive diagnostic — it does NOT modify any styles.
 * Production builds skip the check entirely.
 */

const IS_DEV = import.meta.env.DEV

/**
 * Check that no ancestor of the given element clips overflow.
 * Returns list of offending elements (empty = safe).
 */
export function checkHonorBarAncestors(element: HTMLElement | null): HTMLElement[] {
  if (!element) return []

  const offenders: HTMLElement[] = []
  let current = element.parentElement

  while (current && current !== document.documentElement) {
    const computed = getComputedStyle(current)
    const inline = current.style

    // Check both computed and inline styles (jsdom may not resolve computed from inline)
    const overflowX = computed.overflowX || inline.overflowX || ''
    const overflowY = computed.overflowY || inline.overflowY || ''
    const overflow = computed.overflow || inline.overflow || ''

    const clipping = ['hidden', 'clip']
    if (
      clipping.includes(overflowX) || clipping.includes(overflowY) ||
      clipping.includes(overflow)
    ) {
      offenders.push(current)
    }

    current = current.parentElement
  }

  return offenders
}

/**
 * Run the guard and log warnings (dev-only).
 * Call from a useEffect in HonorFlagBar after mount.
 */
export function runHonorBarLayoutGuard(barElement: HTMLElement | null): void {
  if (!IS_DEV) return
  if (!barElement) return

  const offenders = checkHonorBarAncestors(barElement)

  if (offenders.length > 0) {
    console.warn(
      '[HonorBar Guard] %d ancestor(s) may clip the Honor Flag Bar:',
      offenders.length,
      offenders.map(el => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || '(none)',
        class: el.className?.slice(0, 80) || '(none)',
        overflow: getComputedStyle(el).overflow,
      }))
    )
  }
}

/**
 * Verify z-index ordering: HonorBar should be below nav but above content.
 * Returns true if ordering is correct.
 */
export function verifyZIndexOrdering(barElement: HTMLElement | null): boolean {
  if (!barElement) return true

  const barZ = parseInt(getComputedStyle(barElement).zIndex || '0', 10)

  // Find nav element — expected to be z-50 (50)
  const navElement = document.querySelector('nav[class*="z-50"]') as HTMLElement | null
  if (!navElement) return true

  const navZ = parseInt(getComputedStyle(navElement).zIndex || '0', 10)

  if (barZ >= navZ) {
    if (IS_DEV) {
      console.warn(
        '[HonorBar Guard] z-index conflict: bar=%d should be < nav=%d',
        barZ, navZ
      )
    }
    return false
  }

  return true
}
