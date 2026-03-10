/**
 * use-studio-selection.ts — Host-side selection state for the Site Studio.
 *
 * Tracks which section the user has selected/hovered in the preview iframe.
 * Any panel (inspector, properties, editor) can subscribe via this hook
 * to react to selection changes without coupling to the PreviewPanel directly.
 *
 * This is a singleton store (like history-store) — multiple consumers
 * always see the same selection state.
 */

import { useSyncExternalStore } from 'react'
import type { SerializedRect } from './preview-bridge'
import { getSectionInfo, type SectionRegistryEntry } from '@/registry/sections'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StudioSelection {
  /** Currently selected section ID, or null */
  sectionId: string | null
  /** Section type (e.g. 'about', 'projects') */
  sectionType: string | null
  /** KV key for the section's content data (from data-kv-key attribute) */
  kvKey: string | null
  /** Registry entry for the selected section, if found */
  registryEntry: SectionRegistryEntry | undefined
  /** Bounding rect of the selected section in the preview iframe */
  rect: SerializedRect | null
}

export interface StudioHover {
  /** Currently hovered section ID, or null */
  sectionId: string | null
  /** Bounding rect of the hovered section */
  rect: SerializedRect | null
}

type Listener = () => void

// ─── Singleton Store ────────────────────────────────────────────────────────

let selection: StudioSelection = {
  sectionId: null,
  sectionType: null,
  kvKey: null,
  registryEntry: undefined,
  rect: null,
}

let hover: StudioHover = {
  sectionId: null,
  rect: null,
}

const selectionListeners = new Set<Listener>()
const hoverListeners = new Set<Listener>()

function notifySelection() {
  for (const fn of selectionListeners) fn()
}

function notifyHover() {
  for (const fn of hoverListeners) fn()
}

// ─── Mutation Functions (called by PreviewPanel) ────────────────────────────

export function setStudioSelection(
  sectionId: string | null,
  sectionType: string | null = null,
  kvKey: string | null = null,
  rect: SerializedRect | null = null,
) {
  selection = {
    sectionId,
    sectionType,
    kvKey,
    registryEntry: sectionType ? getSectionInfo(sectionType) : undefined,
    rect,
  }
  notifySelection()
}

export function setStudioHover(
  sectionId: string | null,
  rect: SerializedRect | null = null,
) {
  hover = { sectionId, rect }
  notifyHover()
}

export function clearStudioSelection() {
  setStudioSelection(null)
}

// ─── React Hooks ────────────────────────────────────────────────────────────

const getSelectionSnapshot = () => selection
const subscribeSelection = (fn: Listener) => {
  selectionListeners.add(fn)
  return () => { selectionListeners.delete(fn) }
}

const getHoverSnapshot = () => hover
const subscribeHover = (fn: Listener) => {
  hoverListeners.add(fn)
  return () => { hoverListeners.delete(fn) }
}

/** React hook — subscribe to the current selected section */
export function useStudioSelection(): StudioSelection {
  return useSyncExternalStore(subscribeSelection, getSelectionSnapshot)
}

/** React hook — subscribe to the current hovered section */
export function useStudioHover(): StudioHover {
  return useSyncExternalStore(subscribeHover, getHoverSnapshot)
}
