/**
 * preview-bridge.ts — postMessage protocol for preview iframe ↔ studio communication.
 *
 * The preview iframe loads the app at #studio-preview (a clean, chrome-free
 * render of PublicSite). The studio host sends commands (highlight section,
 * navigate, viewport change) and the iframe sends events back (section clicked,
 * hover, scroll position).
 *
 * Security: messages are origin-checked against window.location.origin.
 */
// ─── Protocol Version ─────────────────────────────────────────────────────────

/** Bumped when the message contract changes. Host and preview must match. */
export const BRIDGE_PROTOCOL_VERSION = 1
// ─── Message Types ──────────────────────────────────────────────────────────

/** Messages sent FROM the studio host TO the preview iframe */
export type HostMessage =
  | { type: 'studio:highlight'; sectionId: string | null }
  | { type: 'studio:scroll-to'; sectionId: string }
  | { type: 'studio:refresh' }
  | { type: 'studio:set-pathway'; pathway: string }
  | { type: 'studio:ping' }

/** Messages sent FROM the preview iframe TO the studio host */
export type PreviewMessage =
  | { type: 'preview:ready'; version: number }
  | { type: 'preview:section-click'; sectionId: string; sectionType: string; kvKey: string | null; rect: SerializedRect }
  | { type: 'preview:section-hover'; sectionId: string | null; rect: SerializedRect | null }
  | { type: 'preview:scroll'; scrollY: number; viewportHeight: number; documentHeight: number }
  | { type: 'preview:pong' }

export interface SerializedRect {
  top: number
  left: number
  width: number
  height: number
}

// ─── Host Side (studio panel) ───────────────────────────────────────────────

export type PreviewMessageHandler = (msg: PreviewMessage) => void

/**
 * Creates the host-side bridge. Call this in the studio/DevCustomizer.
 * Returns controls to send commands and a cleanup function.
 */
export function createHostBridge(iframe: HTMLIFrameElement, onMessage: PreviewMessageHandler) {
  const origin = window.location.origin

  const handler = (e: MessageEvent) => {
    if (e.origin !== origin) return
    const data = e.data as PreviewMessage
    if (!data?.type?.startsWith('preview:')) return
    onMessage(data)
  }

  window.addEventListener('message', handler)

  const send = (msg: HostMessage) => {
    iframe.contentWindow?.postMessage(msg, origin)
  }

  return {
    send,
    highlight: (sectionId: string | null) => send({ type: 'studio:highlight', sectionId }),
    scrollTo: (sectionId: string) => send({ type: 'studio:scroll-to', sectionId }),
    refresh: () => send({ type: 'studio:refresh' }),
    setPathway: (pathway: string) => send({ type: 'studio:set-pathway', pathway }),
    ping: () => send({ type: 'studio:ping' }),
    destroy: () => window.removeEventListener('message', handler),
  }
}

// ─── Preview Side (inside iframe) ───────────────────────────────────────────

export type HostMessageHandler = (msg: HostMessage) => void

/**
 * Creates the preview-side bridge. Call this inside the #studio-preview route.
 * Listens for host commands and provides a `send` to post events back.
 */
export function createPreviewBridge(onMessage: HostMessageHandler) {
  const origin = window.location.origin

  const handler = (e: MessageEvent) => {
    if (e.origin !== origin) return
    const data = e.data as HostMessage
    if (!data?.type?.startsWith('studio:')) return
    onMessage(data)
  }

  window.addEventListener('message', handler)

  const send = (msg: PreviewMessage) => {
    window.parent.postMessage(msg, origin)
  }

  // Notify host that preview is ready
  send({ type: 'preview:ready', version: BRIDGE_PROTOCOL_VERSION })

  return {
    send,
    notifyClick: (sectionId: string, sectionType: string, kvKey: string | null, rect: SerializedRect) =>
      send({ type: 'preview:section-click', sectionId, sectionType, kvKey, rect }),
    notifyHover: (sectionId: string | null, rect: SerializedRect | null) =>
      send({ type: 'preview:section-hover', sectionId, rect }),
    notifyScroll: () =>
      send({
        type: 'preview:scroll',
        scrollY: window.scrollY,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
      }),
    destroy: () => window.removeEventListener('message', handler),
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert DOMRect to a plain serializable object */
export function serializeRect(rect: DOMRect): SerializedRect {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}
