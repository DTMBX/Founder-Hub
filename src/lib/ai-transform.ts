/**
 * ai-transform.ts — Safe AI-assisted transform stubs.
 *
 * Implements the structured proposal pattern:
 *  1. AI produces a proposal (structured data, not freeform)
 *  2. User reviews the proposal in the UI
 *  3. User explicitly approves before Apply
 *  4. Apply goes through draft/apply discipline with validation
 *
 * Since no AI infrastructure exists in this repo, all transform functions
 * return stub proposals with placeholder text. When AI backend is available,
 * replace the stub implementations with real API calls.
 *
 * No direct KV mutation. No auto-commit. No freeform rewrite.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AIProposal {
  /** What kind of change this proposes */
  type: 'text-improvement' | 'tag-suggestions' | 'bullet-suggestions'
  /** The field key this applies to */
  fieldKey: string
  /** Current value (for comparison) */
  currentValue: unknown
  /** Proposed new value */
  proposedValue: unknown
  /** AI reasoning or explanation */
  reasoning: string
  /** Whether this came from a real AI backend or a stub */
  isStub: boolean
}

export interface AITransformResult {
  success: boolean
  proposal?: AIProposal
  error?: string
}

// ─── Stub Detection ─────────────────────────────────────────────────────────

/**
 * Check if AI backend is available.
 * Returns false — no AI infrastructure exists in this repo.
 */
export function isAIAvailable(): boolean {
  return false
}

// ─── Transform Stubs ────────────────────────────────────────────────────────

/**
 * Propose improved description text for a selected item.
 * Stub: returns placeholder proposal.
 */
export async function proposeImprovedDescription(
  currentDescription: string,
  context: { title?: string; type?: string },
): Promise<AITransformResult> {
  if (!currentDescription.trim()) {
    return { success: false, error: 'No description to improve' }
  }

  // Stub proposal
  return {
    success: true,
    proposal: {
      type: 'text-improvement',
      fieldKey: 'description',
      currentValue: currentDescription,
      proposedValue: currentDescription, // No change in stub
      reasoning: `AI backend not available. When connected, this will suggest an improved version of the ${context.type || 'item'} description for "${context.title || 'untitled'}".`,
      isStub: true,
    },
  }
}

/**
 * Propose tags for a collection item.
 * Stub: returns placeholder proposal.
 */
export async function proposeTags(
  currentTags: string[],
  context: { title?: string; description?: string },
): Promise<AITransformResult> {
  // Stub proposal
  return {
    success: true,
    proposal: {
      type: 'tag-suggestions',
      fieldKey: 'tags',
      currentValue: currentTags,
      proposedValue: currentTags, // No change in stub
      reasoning: `AI backend not available. When connected, this will suggest relevant tags based on "${context.title || 'untitled'}" content.`,
      isStub: true,
    },
  }
}

/**
 * Propose bullet-point suggestions (e.g. for About values).
 * Stub: returns placeholder proposal.
 */
export async function proposeBullets(
  currentBullets: string[],
  context: { sectionType?: string },
): Promise<AITransformResult> {
  // Stub proposal
  return {
    success: true,
    proposal: {
      type: 'bullet-suggestions',
      fieldKey: 'values',
      currentValue: currentBullets,
      proposedValue: currentBullets, // No change in stub
      reasoning: `AI backend not available. When connected, this will suggest additional ${context.sectionType || ''} values.`,
      isStub: true,
    },
  }
}
