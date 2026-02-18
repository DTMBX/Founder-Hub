/**
 * Case Jacket System — Types
 *
 * Defines the data structures for case profiles, evidence items,
 * AI summaries, and export manifests.
 *
 * Invariants:
 * - Evidence items are immutable after creation.
 * - All mutations are logged (append-only audit trail).
 * - AI summaries are clearly labeled as generated content.
 */

// ─── Case Profile ────────────────────────────────────────────

/** A case profile with evidence index. */
export interface CaseProfile {
  readonly caseId: string
  readonly title: string
  readonly description: string
  readonly createdBy: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly status: CaseStatus
  readonly tags: readonly string[]
  readonly evidenceIds: readonly string[]
}

/** Allowed case statuses. */
export type CaseStatus = 'open' | 'under-review' | 'closed' | 'archived'

// ─── Evidence Item ───────────────────────────────────────────

/** A single piece of evidence within a case. */
export interface EvidenceItem {
  /** Unique evidence identifier. */
  readonly evidenceId: string
  /** Parent case ID. */
  readonly caseId: string
  /** Evidence type category. */
  readonly type: EvidenceType
  /** Human-readable label. */
  readonly label: string
  /** Description of the evidence. */
  readonly description: string
  /** SHA-256 hash of the original content. */
  readonly contentHash: string
  /** Size in bytes. */
  readonly size: number
  /** MIME type or content descriptor. */
  readonly mimeType: string
  /** Who submitted this evidence. */
  readonly submittedBy: string
  /** ISO 8601 submission timestamp. */
  readonly submittedAt: string
  /** Chain of custody events. */
  readonly custody: readonly CustodyEvent[]
}

/** Categories of evidence. */
export type EvidenceType =
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'email'
  | 'log'
  | 'other'

/** A chain-of-custody event. */
export interface CustodyEvent {
  readonly action: 'submitted' | 'viewed' | 'exported' | 'transferred' | 'sealed'
  readonly actor: string
  readonly timestamp: string
  readonly notes?: string
}

// ─── AI Summary ──────────────────────────────────────────────

/** An AI-generated summary of case evidence. */
export interface AISummary {
  readonly summaryId: string
  readonly caseId: string
  /** Model or adapter used. */
  readonly generatedBy: string
  /** ISO 8601 generation timestamp. */
  readonly generatedAt: string
  /** Summary text. */
  readonly content: string
  /** Source evidence IDs this summary was derived from. */
  readonly sourceEvidenceIds: readonly string[]
  /** Confidence or quality indicator (0-1). */
  readonly confidence: number
  /** Explicit disclaimer. */
  readonly disclaimer: string
}

// ─── Export ──────────────────────────────────────────────────

/** An export manifest for a case jacket. */
export interface ExportManifest {
  readonly exportId: string
  readonly caseId: string
  readonly exportedBy: string
  readonly exportedAt: string
  readonly evidenceIds: readonly string[]
  readonly summaryIds: readonly string[]
  /** SHA-256 of all included artifacts, sorted. */
  readonly manifestHash: string
  readonly format: 'json' | 'pdf-bundle' | 'archive'
}

// ─── Audit Entry ─────────────────────────────────────────────

/** An append-only audit log entry. */
export interface AuditEntry {
  readonly entryId: string
  readonly caseId: string
  readonly action: string
  readonly actor: string
  readonly timestamp: string
  readonly details?: string
}

// ─── Service Result Types ────────────────────────────────────

export interface CaseJacketResult<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}
