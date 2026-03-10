/**
 * use-ai-draft.ts — State machine hook for AI content proposals.
 *
 * Manages the lifecycle: idle → loading → ready (proposal) → applied/dismissed
 *
 * Usage:
 *   const ai = useAiDraft('about', editor)
 *   ai.suggest('mission', 'rewrite')  // kick off proposal
 *   ai.proposal                       // current AiProposal | null
 *   ai.accept(0)                      // apply suggestion index via editor.setField
 *   ai.dismiss()                      // discard proposal
 */

import { useState, useCallback, useRef } from 'react'
import { proposeFieldEdit, isFieldSuggestable } from '@/lib/ai-transform'
import { takeSafetySnapshot } from '@/lib/snapshot-guardrails'
import { enforceCurrentRole } from '@/lib/studio-permissions'
import type { AiProposal, AiProposalStatus } from '@/lib/ai-transform'
import type { ContentEditor } from '@/hooks/use-content-editor'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AiDraftState {
  /** Current status of the draft proposal */
  status: AiProposalStatus
  /** The active proposal, if any */
  proposal: AiProposal | null
  /** Error message if status is 'error' */
  error: string | null
  /** Request a new suggestion for a field */
  suggest: (fieldKey: string, mode: 'rewrite' | 'variants') => void
  /** Accept a specific suggestion by index — applies via editor.setField + history */
  accept: (suggestionIndex: number) => void
  /** Dismiss the current proposal without applying */
  dismiss: () => void
  /** Whether any proposal is being generated */
  isLoading: boolean
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAiDraft<T>(
  registryId: string,
  editor: ContentEditor<T>,
): AiDraftState {
  const [status, setStatus] = useState<AiProposalStatus>('idle')
  const [proposal, setProposal] = useState<AiProposal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const suggest = useCallback(
    async (fieldKey: string, mode: 'rewrite' | 'variants') => {
      // Abort any in-flight request
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      // Validate field is suggestable
      const field = editor.fields.find((f) => f.key === fieldKey)
      if (!field || !isFieldSuggestable(field)) {
        setError(`Field "${fieldKey}" is not eligible for AI suggestions`)
        setStatus('error')
        return
      }

      const currentValue = editor.getField(fieldKey)
      if (
        currentValue === undefined ||
        currentValue === null ||
        currentValue === '' ||
        (Array.isArray(currentValue) && currentValue.length === 0)
      ) {
        setError('Field is empty — write something first so AI can improve it')
        setStatus('error')
        return
      }

      setStatus('loading')
      setError(null)
      setProposal(null)

      try {
        // Gather sibling field values for context
        const allValues: Record<string, unknown> = {}
        for (const f of editor.fields) {
          allValues[f.key] = editor.getField(f.key)
        }

        const result = await proposeFieldEdit({
          registryId,
          fieldKey,
          currentValue,
          allValues,
          mode,
          signal: controller.signal,
        })

        if (controller.signal.aborted) return

        setProposal(result)
        setStatus('ready')
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Failed to generate suggestion')
        setStatus('error')
      }
    },
    [registryId, editor],
  )

  const accept = useCallback(
    async (suggestionIndex: number) => {
      if (!proposal || !proposal.suggestions[suggestionIndex]) return

      // Enforce role-based permission before applying AI content
      enforceCurrentRole('studio:ai-accept')

      const suggestion = proposal.suggestions[suggestionIndex]

      // Safety snapshot before AI mutation
      await takeSafetySnapshot('ai-accept', `Before AI ${proposal.type}: ${proposal.fieldLabel}`)

      // Apply through editor — this pushes a history entry with source tracking
      editor.update(
        (prev) => {
          // Set the specific field value on the object
          const parts = proposal.fieldKey.split('.')
          if (parts.length === 1) {
            return { ...(prev as object), [parts[0]]: suggestion.value } as T
          }
          // Handle nested dot-path
          const clone = JSON.parse(JSON.stringify(prev))
          let current = clone
          for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]]
          }
          current[parts[parts.length - 1]] = suggestion.value
          return clone as T
        },
        `AI ${proposal.type}: ${proposal.fieldLabel}`,
      )

      // Clear proposal state
      setProposal(null)
      setStatus('idle')
      setError(null)
    },
    [proposal, editor],
  )

  const dismiss = useCallback(() => {
    abortRef.current?.abort()
    setProposal(null)
    setStatus('idle')
    setError(null)
  }, [])

  return {
    status,
    proposal,
    error,
    suggest,
    accept,
    dismiss,
    isLoading: status === 'loading',
  }
}
