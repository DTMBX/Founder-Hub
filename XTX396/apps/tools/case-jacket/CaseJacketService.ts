/**
 * Case Jacket System — Service
 *
 * Manages case profiles, evidence indexing, AI summaries, and exports.
 * All operations produce audit log entries (append-only).
 *
 * Invariants:
 * - Evidence items are immutable after submission.
 * - Original evidence is never modified or deleted.
 * - Audit log is append-only (no deletions, no edits).
 * - AI summaries are clearly labeled and disclaimered.
 * - Exports include deterministic manifest hashes.
 */

import type {
  CaseProfile,
  CaseStatus,
  EvidenceItem,
  EvidenceType,
  CustodyEvent,
  AISummary,
  ExportManifest,
  AuditEntry,
  CaseJacketResult,
} from './types'
import type { AISummaryAdapterInterface } from './AISummaryAdapter'
import { MockAISummaryAdapter } from './AISummaryAdapter'

// ─── Service ─────────────────────────────────────────────────

export class CaseJacketService {
  private readonly _cases = new Map<string, CaseProfile>()
  private readonly _evidence = new Map<string, EvidenceItem>()
  private readonly _summaries = new Map<string, AISummary>()
  private readonly _exports = new Map<string, ExportManifest>()
  private readonly _auditLog: AuditEntry[] = []
  private readonly _aiAdapter: AISummaryAdapterInterface
  private _auditCounter = 0

  constructor(aiAdapter?: AISummaryAdapterInterface) {
    this._aiAdapter = aiAdapter ?? new MockAISummaryAdapter()
  }

  // ── Case Management ──────────────────────────────────────

  /**
   * Creates a new case profile.
   */
  createCase(
    caseId: string,
    title: string,
    description: string,
    createdBy: string,
  ): CaseJacketResult<CaseProfile> {
    if (this._cases.has(caseId)) {
      return { success: false, error: 'Case ID already exists' }
    }

    if (!caseId.trim() || !title.trim() || !createdBy.trim()) {
      return { success: false, error: 'caseId, title, and createdBy are required' }
    }

    const now = new Date().toISOString()
    const profile: CaseProfile = {
      caseId,
      title,
      description,
      createdBy,
      createdAt: now,
      updatedAt: now,
      status: 'open',
      tags: [],
      evidenceIds: [],
    }

    this._cases.set(caseId, profile)
    this._appendAudit(caseId, 'case-created', createdBy, `Case "${title}" created`)
    return { success: true, data: profile }
  }

  /**
   * Retrieves a case profile by ID.
   */
  getCase(caseId: string): CaseProfile | null {
    return this._cases.get(caseId) ?? null
  }

  /**
   * Updates case status.
   */
  updateCaseStatus(
    caseId: string,
    status: CaseStatus,
    actor: string,
  ): CaseJacketResult<CaseProfile> {
    const existing = this._cases.get(caseId)
    if (!existing) {
      return { success: false, error: 'Case not found' }
    }

    const updated: CaseProfile = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    }

    this._cases.set(caseId, updated)
    this._appendAudit(caseId, 'status-changed', actor, `Status → ${status}`)
    return { success: true, data: updated }
  }

  /**
   * Lists all cases.
   */
  listCases(): readonly CaseProfile[] {
    return [...this._cases.values()]
  }

  // ── Evidence Management ──────────────────────────────────

  /**
   * Submits evidence to a case.
   * Evidence is immutable after submission.
   */
  submitEvidence(
    evidenceId: string,
    caseId: string,
    type: EvidenceType,
    label: string,
    description: string,
    contentHash: string,
    size: number,
    mimeType: string,
    submittedBy: string,
  ): CaseJacketResult<EvidenceItem> {
    if (!this._cases.has(caseId)) {
      return { success: false, error: 'Case not found' }
    }

    if (this._evidence.has(evidenceId)) {
      return { success: false, error: 'Evidence ID already exists' }
    }

    if (!evidenceId.trim() || !label.trim() || !contentHash.trim()) {
      return { success: false, error: 'evidenceId, label, and contentHash are required' }
    }

    const now = new Date().toISOString()
    const item: EvidenceItem = {
      evidenceId,
      caseId,
      type,
      label,
      description,
      contentHash,
      size,
      mimeType,
      submittedBy,
      submittedAt: now,
      custody: [
        {
          action: 'submitted',
          actor: submittedBy,
          timestamp: now,
        },
      ],
    }

    this._evidence.set(evidenceId, item)

    // Update case evidence index
    const caseProfile = this._cases.get(caseId)!
    const updatedCase: CaseProfile = {
      ...caseProfile,
      evidenceIds: [...caseProfile.evidenceIds, evidenceId],
      updatedAt: now,
    }
    this._cases.set(caseId, updatedCase)

    this._appendAudit(caseId, 'evidence-submitted', submittedBy, `Evidence "${label}" [${type}]`)
    return { success: true, data: item }
  }

  /**
   * Retrieves an evidence item by ID.
   */
  getEvidence(evidenceId: string): EvidenceItem | null {
    return this._evidence.get(evidenceId) ?? null
  }

  /**
   * Lists all evidence for a case.
   */
  listEvidence(caseId: string): readonly EvidenceItem[] {
    const caseProfile = this._cases.get(caseId)
    if (!caseProfile) return []
    return caseProfile.evidenceIds
      .map((id) => this._evidence.get(id))
      .filter((e): e is EvidenceItem => e !== undefined)
  }

  /**
   * Records a custody event on an evidence item.
   */
  recordCustodyEvent(
    evidenceId: string,
    event: CustodyEvent,
  ): CaseJacketResult<EvidenceItem> {
    const item = this._evidence.get(evidenceId)
    if (!item) {
      return { success: false, error: 'Evidence not found' }
    }

    const updated: EvidenceItem = {
      ...item,
      custody: [...item.custody, event],
    }

    this._evidence.set(evidenceId, updated)
    this._appendAudit(item.caseId, `custody-${event.action}`, event.actor, `Evidence ${evidenceId}`)
    return { success: true, data: updated }
  }

  // ── AI Summary ───────────────────────────────────────────

  /**
   * Generates an AI summary for a case's evidence.
   */
  async generateSummary(
    caseId: string,
    actor: string,
  ): Promise<CaseJacketResult<AISummary>> {
    const caseProfile = this._cases.get(caseId)
    if (!caseProfile) {
      return { success: false, error: 'Case not found' }
    }

    const evidence = this.listEvidence(caseId)
    if (evidence.length === 0) {
      return { success: false, error: 'No evidence to summarize' }
    }

    const summary = await this._aiAdapter.generateSummary(caseId, evidence)
    this._summaries.set(summary.summaryId, summary)
    this._appendAudit(caseId, 'summary-generated', actor, `AI summary by ${summary.generatedBy}`)
    return { success: true, data: summary }
  }

  /**
   * Retrieves a summary by ID.
   */
  getSummary(summaryId: string): AISummary | null {
    return this._summaries.get(summaryId) ?? null
  }

  /**
   * Lists all summaries for a case.
   */
  listSummaries(caseId: string): readonly AISummary[] {
    return [...this._summaries.values()].filter((s) => s.caseId === caseId)
  }

  // ── Export ───────────────────────────────────────────────

  /**
   * Creates an export manifest for the case.
   * Hash is deterministic: SHA-256 of sorted evidence hashes + summary IDs.
   */
  createExport(
    caseId: string,
    exportedBy: string,
    format: ExportManifest['format'] = 'json',
  ): CaseJacketResult<ExportManifest> {
    const caseProfile = this._cases.get(caseId)
    if (!caseProfile) {
      return { success: false, error: 'Case not found' }
    }

    const evidence = this.listEvidence(caseId)
    const summaries = this.listSummaries(caseId)

    // Deterministic manifest hash: sorted evidence hashes + summary IDs
    const hashParts = [
      ...evidence.map((e) => e.contentHash).sort(),
      ...summaries.map((s) => s.summaryId).sort(),
    ]
    const manifestHash = deterministicHash(hashParts.join(':'))

    const now = new Date().toISOString()
    const exportId = `exp_${caseId}_${now.replace(/[^0-9]/g, '').slice(0, 14)}`

    const manifest: ExportManifest = {
      exportId,
      caseId,
      exportedBy,
      exportedAt: now,
      evidenceIds: evidence.map((e) => e.evidenceId),
      summaryIds: summaries.map((s) => s.summaryId),
      manifestHash,
      format,
    }

    this._exports.set(exportId, manifest)
    this._appendAudit(caseId, 'export-created', exportedBy, `Export ${exportId} [${format}]`)
    return { success: true, data: manifest }
  }

  // ── Audit Log ────────────────────────────────────────────

  /**
   * Returns the full audit log (read-only).
   */
  getAuditLog(): readonly AuditEntry[] {
    return [...this._auditLog]
  }

  /**
   * Returns audit entries for a specific case.
   */
  getAuditLogForCase(caseId: string): readonly AuditEntry[] {
    return this._auditLog.filter((e) => e.caseId === caseId)
  }

  get auditLogSize(): number {
    return this._auditLog.length
  }

  // ── Internal ─────────────────────────────────────────────

  private _appendAudit(
    caseId: string,
    action: string,
    actor: string,
    details?: string,
  ): void {
    this._auditCounter += 1
    this._auditLog.push({
      entryId: `aud_${this._auditCounter}`,
      caseId,
      action,
      actor,
      timestamp: new Date().toISOString(),
      details,
    })
  }
}

// ─── Deterministic Hash (sync, for manifests) ────────────────

/**
 * Simple deterministic hash for manifest generation.
 * Uses DJB2 algorithm — NOT cryptographic, but deterministic and fast.
 * Cryptographic SHA-256 is used for evidence hashing (outside this module).
 */
function deterministicHash(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}
