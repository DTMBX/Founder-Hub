/**
 * selection-overlay.ts — Click-to-select section overlay for the preview iframe.
 *
 * When injected into the preview frame, this module:
 *  1. Finds all elements with `data-content-section` or `id` matching section IDs
 *  2. Attaches mousemove/click listeners to enable hover highlight + click-to-select
 *  3. Responds to studio highlight commands (from preview-bridge)
 *  4. Draws a non-intrusive overlay using a fixed-position div (no iframe needed inside)
 *
 * This is the preview-side companion to preview-bridge.ts.
 */

import { createPreviewBridge, serializeRect, type PreviewMessage } from './preview-bridge'

// ─── Overlay Controller ───────────────────────────────────────────────────────

export function initSelectionOverlay() {
  // Overlay elements created once
  const hoverOverlay = document.createElement('div')
  hoverOverlay.id = 'studio-hover-overlay'
  Object.assign(hoverOverlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '99998',
    border: '2px solid rgba(59, 130, 246, 0.6)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    transition: 'all 75ms ease',
    display: 'none',
  })

  const hoverLabel = document.createElement('span')
  Object.assign(hoverLabel.style, {
    position: 'absolute',
    top: '-24px',
    left: '0',
    fontSize: '11px',
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  })
  hoverOverlay.appendChild(hoverLabel)

  const selectOverlay = document.createElement('div')
  selectOverlay.id = 'studio-select-overlay'
  Object.assign(selectOverlay.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '99999',
    border: '2px solid rgba(16, 185, 129, 0.8)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    display: 'none',
  })

  document.body.appendChild(hoverOverlay)
  document.body.appendChild(selectOverlay)

  // ── Section finder ──

  function findSectionElement(el: HTMLElement): HTMLElement | null {
    let node: HTMLElement | null = el
    while (node && node !== document.body) {
      if (node.dataset.contentSection || node.dataset.sectionId) return node
      // Also match by common section id pattern
      if (node.id && /^(hero|about|projects|services|offerings|investor|court|proof|contact|governance|how-it-works|faq|final-cta|now)$/.test(node.id)) {
        return node
      }
      node = node.parentElement
    }
    return null
  }

  function getSectionId(el: HTMLElement): string {
    return el.dataset.contentSection || el.dataset.sectionId || el.id || 'unknown'
  }

  function getSectionType(el: HTMLElement): string {
    return el.dataset.contentSection || el.dataset.sectionType || el.id || 'unknown'
  }

  function getKvKey(el: HTMLElement): string | null {
    return el.dataset.kvKey || null
  }

  // ── Position overlay on element ──

  function positionOverlay(overlay: HTMLElement, el: HTMLElement) {
    const rect = el.getBoundingClientRect()
    overlay.style.top = `${rect.top}px`
    overlay.style.left = `${rect.left}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`
    overlay.style.display = 'block'
  }

  // ── Bridge ──

  const bridge = createPreviewBridge((msg) => {
    switch (msg.type) {
      case 'studio:highlight': {
        if (!msg.sectionId) {
          selectOverlay.style.display = 'none'
          return
        }
        const el = document.getElementById(msg.sectionId) ||
          document.querySelector(`[data-content-section="${msg.sectionId}"]`) as HTMLElement
        if (el) positionOverlay(selectOverlay, el)
        break
      }
      case 'studio:scroll-to': {
        const el = document.getElementById(msg.sectionId) ||
          document.querySelector(`[data-content-section="${msg.sectionId}"]`) as HTMLElement
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      }
      case 'studio:refresh':
        window.location.reload()
        break
      case 'studio:ping':
        bridge.send({ type: 'preview:pong' } as PreviewMessage)
        break
      case 'studio:set-pathway': {
        const pathway = msg.pathway
        window.dispatchEvent(new CustomEvent('studio:set-pathway', { detail: { pathway } }))
        break
      }
    }
  })

  // ── Mouse listeners ──

  let hoveredSection: HTMLElement | null = null

  const onMouseMove = (e: MouseEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
    if (!el) {
      hoverOverlay.style.display = 'none'
      if (hoveredSection) {
        bridge.notifyHover(null, null)
        hoveredSection = null
      }
      return
    }

    const section = findSectionElement(el)
    if (section && section !== hoveredSection) {
      hoveredSection = section
      positionOverlay(hoverOverlay, section)
      hoverLabel.textContent = getSectionId(section)
      const rect = section.getBoundingClientRect()
      bridge.notifyHover(getSectionId(section), serializeRect(rect))
    } else if (!section && hoveredSection) {
      hoverOverlay.style.display = 'none'
      bridge.notifyHover(null, null)
      hoveredSection = null
    }
  }

  const onClick = (e: MouseEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
    if (!el) return

    const section = findSectionElement(el)
    if (section) {
      e.preventDefault()
      e.stopPropagation()
      const rect = section.getBoundingClientRect()
      positionOverlay(selectOverlay, section)
      bridge.notifyClick(getSectionId(section), getSectionType(section), getKvKey(section), serializeRect(rect))
    }
  }

  // Track scroll to report position
  const onScroll = () => {
    bridge.notifyScroll()
    // Re-position overlays on scroll
    if (hoveredSection) {
      positionOverlay(hoverOverlay, hoveredSection)
    }
  }

  document.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('click', onClick, true)
  window.addEventListener('scroll', onScroll, { passive: true })

  return {
    bridge,
    destroy: () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('scroll', onScroll)
      hoverOverlay.remove()
      selectOverlay.remove()
      bridge.destroy()
    },
  }
}
