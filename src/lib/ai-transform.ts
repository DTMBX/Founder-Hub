/**
 * ai-transform.ts — Structured AI proposal system for content fields.
 *
 * Implements the proposal pattern:
 *  1. AI produces a structured suggestion (JSON, not freeform)
 *  2. User reviews current vs proposed in a diff UI
 *  3. User explicitly approves before Apply
 *  4. Apply goes through editor.setField() → history (source: 'ai') → Zod validation
 *
 * When Ollama is running locally, proposals come from the real model.
 * When unavailable, returns stub proposals with a clear "AI offline" message.
 *
 * No direct KV mutation. No auto-commit. No freeform rewrite.
 */

import { getAiStatus, getCachedAiStatus, suggestContentField } from '@/lib/ai-service'
import type { ContentSuggestionResponse } from '@/lib/ai-service'
import { getContentEntry } from '@/lib/content-registry'
import type { FieldDef } from '@/lib/content-registry'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AiProposal {
  /** What kind of change this proposes */
  type: 'rewrite' | 'variants'
  /** The field key this applies to */
  fieldKey: string
  /** Human-readable field label */
  fieldLabel: string
  /** Current value (for diff comparison) */
  currentValue: unknown
  /** Proposed new values — user picks one */
  suggestions: Array<{
    value: string | string[]
    label: string
  }>
  /** AI reasoning or explanation */
  reasoning: string
  /** Whether this came from a real AI backend or a stub */
  isStub: boolean
}

export type AiProposalStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface AiProposalState {
  status: AiProposalStatus
  proposal: AiProposal | null
  error: string | null
}

// ─── Status check ───────────────────────────────────────────────────────────

/**
 * Check if local AI backend is available (async, uses cached status).
 */
export async function isAiAvailable(): Promise<boolean> {
  const status = await getAiStatus()
  return status.available
}

/**
 * Synchronous availability check — reads last cached probe result.
 * Returns false if never checked. Used by CommandPalette filters to
 * hide AI commands when Ollama is not running.
 * Kicks off an async probe as a side effect to warm the cache.
 */
export function isAIAvailable(): boolean {
  // Side-effect: warm the cache for future calls
  getAiStatus().catch(() => {})
  const cached = getCachedAiStatus()
  return cached?.available ?? false
}

// ─── Field eligibility ──────────────────────────────────────────────────────

/** Only text-like fields are eligible for AI suggestions */
const SUGGESTABLE_KINDS = new Set(['text', 'textarea', 'tags'])

export function isFieldSuggestable(field: FieldDef): boolean {
  return SUGGESTABLE_KINDS.has(field.kind)
}

/** Get all suggestable fields for a registry entry */
export function getSuggestableFields(registryId: string): FieldDef[] {
  const entry = getContentEntry(registryId)
  if (!entry) return []
  return entry.fields.filter(isFieldSuggestable)
}

// ─── Proposal generation ────────────────────────────────────────────────────

export interface ProposeOptions {
  registryId: string
  fieldKey: string
  currentValue: unknown
  /** All current field values for context */
  allValues?: Record<string, unknown>
  mode: 'rewrite' | 'variants'
  signal?: AbortSignal
}

/**
 * Generate a structured AI proposal for a content field.
 * Returns stub proposals when AI is unavailable.
 */
export async function proposeFieldEdit(
  opts: ProposeOptions,
): Promise<AiProposal> {
  const entry = getContentEntry(opts.registryId)
  const field = entry?.fields.find((f) => f.key === opts.fieldKey)
  const fieldLabel = field?.label || opts.fieldKey

  // Check AI availability
  const available = await isAiAvailable()

  if (!available) {
    // Return stub proposal — makes the UI testable without Ollama
    return {
      type: opts.mode,
      fieldKey: opts.fieldKey,
      fieldLabel,
      currentValue: opts.currentValue,
      suggestions: [
        {
          value: opts.currentValue as string | string[],
          label: 'AI Offline — Start Ollama to get suggestions',
        },
      ],
      reasoning:
        'Local AI is not available. Run `ollama serve` and pull a model (e.g. `ollama pull qwen2.5-coder:7b`) to enable suggestions.',
      isStub: true,
    }
  }

  // Build context from sibling fields
  const context: Record<string, unknown> = {}
  if (opts.allValues && entry) {
    for (const f of entry.fields) {
      if (f.key !== opts.fieldKey) {
        const val = opts.allValues[f.key]
        if (val) context[f.label] = val
      }
    }
  }

  let response: ContentSuggestionResponse
  try {
    response = await suggestContentField({
      fieldLabel,
      fieldKind: field?.kind || 'text',
      currentValue: opts.currentValue as string | string[],
      context: Object.keys(context).length > 0 ? context : undefined,
      mode: opts.mode,
      signal: opts.signal,
    })
  } catch (err) {
    // If JSON parsing or network fails, return error-state stub
    return {
      type: opts.mode,
      fieldKey: opts.fieldKey,
      fieldLabel,
      currentValue: opts.currentValue,
      suggestions: [
        {
          value: opts.currentValue as string | string[],
          label: 'AI Error — suggestion could not be generated',
        },
      ],
      reasoning:
        err instanceof Error ? err.message : 'Unknown error generating suggestion',
      isStub: true,
    }
  }

  return {
    type: opts.mode,
    fieldKey: opts.fieldKey,
    fieldLabel,
    currentValue: opts.currentValue,
    suggestions: response.suggestions,
    reasoning: response.reasoning,
    isStub: false,
  }
}
