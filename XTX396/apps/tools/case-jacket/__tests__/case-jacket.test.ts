import { describe, it, expect, beforeEach } from 'vitest'
import { CaseJacketService } from '../CaseJacketService'
import { MockAISummaryAdapter } from '../AISummaryAdapter'
import toolManifest from '../tool.manifest.json'
import type { EvidenceItem, CustodyEvent } from '../types'

// ─── Fixtures ────────────────────────────────────────────────

const CASE_ID = 'case_001'
const OPERATOR = 'op_001'

function createService(): CaseJacketService {
  return new CaseJacketService(new MockAISummaryAdapter())
}

function seedCase(svc: CaseJacketService): void {
  svc.createCase(CASE_ID, 'Test Case Alpha', 'A test case for unit testing.', OPERATOR)
}

function seedEvidence(svc: CaseJacketService): void {
  svc.submitEvidence(
    'ev_001', CASE_ID, 'document', 'Contract A',
    'Signed agreement between parties.', 'sha256_aaa', 2048, 'application/pdf', OPERATOR,
  )
  svc.submitEvidence(
    'ev_002', CASE_ID, 'email', 'Correspondence B',
    'Email exchange regarding terms.', 'sha256_bbb', 1024, 'message/rfc822', OPERATOR,
  )
}

// ─── Tool Manifest ───────────────────────────────────────────

describe('Case Jacket: tool.manifest.json', () => {
  it('has required fields', () => {
    expect(toolManifest.id).toBe('case-jacket')
    expect(toolManifest.version).toBeTruthy()
    expect(toolManifest.name).toBe('Case Jacket')
    expect(toolManifest.capabilities).toContain('evidence-indexing')
    expect(toolManifest.capabilities).toContain('ai-summary-generation')
  })

  it('audit config is append-only', () => {
    expect(toolManifest.audit.append_only).toBe(true)
    expect(toolManifest.audit.log_access).toBe(true)
    expect(toolManifest.audit.log_mutations).toBe(true)
    expect(toolManifest.audit.log_exports).toBe(true)
  })

  it('requires at least operator role', () => {
    expect(toolManifest.required_roles).toContain('operator')
    expect(toolManifest.required_roles).toContain('admin')
  })
})

// ─── Case Management ────────────────────────────────────────

describe('Case Jacket: case management', () => {
  let svc: CaseJacketService

  beforeEach(() => {
    svc = createService()
  })

  it('creates a case', () => {
    const result = svc.createCase(CASE_ID, 'Test Case', 'Description', OPERATOR)
    expect(result.success).toBe(true)
    expect(result.data?.caseId).toBe(CASE_ID)
    expect(result.data?.status).toBe('open')
  })

  it('rejects duplicate case ID', () => {
    svc.createCase(CASE_ID, 'A', 'B', OPERATOR)
    const result = svc.createCase(CASE_ID, 'A', 'B', OPERATOR)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Case ID already exists')
  })

  it('rejects empty required fields', () => {
    const result = svc.createCase('', 'A', 'B', OPERATOR)
    expect(result.success).toBe(false)
  })

  it('retrieves a case', () => {
    svc.createCase(CASE_ID, 'Test', 'Desc', OPERATOR)
    const profile = svc.getCase(CASE_ID)
    expect(profile).not.toBeNull()
    expect(profile!.title).toBe('Test')
  })

  it('returns null for nonexistent case', () => {
    expect(svc.getCase('nonexistent')).toBeNull()
  })

  it('updates case status', () => {
    svc.createCase(CASE_ID, 'Test', 'Desc', OPERATOR)
    const result = svc.updateCaseStatus(CASE_ID, 'under-review', OPERATOR)
    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('under-review')
  })

  it('rejects status update for nonexistent case', () => {
    const result = svc.updateCaseStatus('nope', 'closed', OPERATOR)
    expect(result.success).toBe(false)
  })

  it('lists all cases', () => {
    svc.createCase('c1', 'Case 1', '', OPERATOR)
    svc.createCase('c2', 'Case 2', '', OPERATOR)
    expect(svc.listCases()).toHaveLength(2)
  })
})

// ─── Evidence Management ─────────────────────────────────────

describe('Case Jacket: evidence management', () => {
  let svc: CaseJacketService

  beforeEach(() => {
    svc = createService()
    seedCase(svc)
  })

  it('submits evidence to a case', () => {
    const result = svc.submitEvidence(
      'ev_001', CASE_ID, 'document', 'Doc A', 'A document.',
      'sha256_abc', 500, 'application/pdf', OPERATOR,
    )
    expect(result.success).toBe(true)
    expect(result.data?.evidenceId).toBe('ev_001')
    expect(result.data?.contentHash).toBe('sha256_abc')
  })

  it('adds initial custody event on submission', () => {
    svc.submitEvidence('ev_001', CASE_ID, 'document', 'Doc', '', 'hash', 100, 'text/plain', OPERATOR)
    const item = svc.getEvidence('ev_001')
    expect(item?.custody).toHaveLength(1)
    expect(item?.custody[0].action).toBe('submitted')
  })

  it('rejects evidence for nonexistent case', () => {
    const result = svc.submitEvidence('ev_001', 'nope', 'document', 'Doc', '', 'hash', 100, 'text/plain', OPERATOR)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Case not found')
  })

  it('rejects duplicate evidence ID', () => {
    svc.submitEvidence('ev_001', CASE_ID, 'document', 'A', '', 'h', 1, 't', OPERATOR)
    const result = svc.submitEvidence('ev_001', CASE_ID, 'document', 'B', '', 'h2', 2, 't', OPERATOR)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Evidence ID already exists')
  })

  it('lists evidence for a case', () => {
    seedEvidence(svc)
    expect(svc.listEvidence(CASE_ID)).toHaveLength(2)
  })

  it('returns empty for nonexistent case evidence', () => {
    expect(svc.listEvidence('nope')).toHaveLength(0)
  })

  it('updates case evidenceIds on submission', () => {
    seedEvidence(svc)
    const profile = svc.getCase(CASE_ID)
    expect(profile?.evidenceIds).toContain('ev_001')
    expect(profile?.evidenceIds).toContain('ev_002')
  })

  it('records custody events', () => {
    svc.submitEvidence('ev_001', CASE_ID, 'document', 'Doc', '', 'hash', 100, 'text/plain', OPERATOR)
    const event: CustodyEvent = {
      action: 'viewed',
      actor: 'reviewer_001',
      timestamp: new Date().toISOString(),
    }
    const result = svc.recordCustodyEvent('ev_001', event)
    expect(result.success).toBe(true)
    expect(result.data?.custody).toHaveLength(2)
    expect(result.data?.custody[1].action).toBe('viewed')
  })

  it('rejects custody event for nonexistent evidence', () => {
    const event: CustodyEvent = {
      action: 'viewed',
      actor: OPERATOR,
      timestamp: new Date().toISOString(),
    }
    expect(svc.recordCustodyEvent('nope', event).success).toBe(false)
  })
})

// ─── AI Summary ──────────────────────────────────────────────

describe('Case Jacket: AI summary', () => {
  let svc: CaseJacketService

  beforeEach(() => {
    svc = createService()
    seedCase(svc)
    seedEvidence(svc)
  })

  it('generates a summary for a case', async () => {
    const result = await svc.generateSummary(CASE_ID, OPERATOR)
    expect(result.success).toBe(true)
    expect(result.data?.caseId).toBe(CASE_ID)
    expect(result.data?.sourceEvidenceIds).toHaveLength(2)
    expect(result.data?.content).toContain('2 evidence item')
  })

  it('summary includes disclaimer', async () => {
    const result = await svc.generateSummary(CASE_ID, OPERATOR)
    expect(result.data?.disclaimer).toContain('not legal advice')
  })

  it('summary cites source evidence', async () => {
    const result = await svc.generateSummary(CASE_ID, OPERATOR)
    expect(result.data?.sourceEvidenceIds).toContain('ev_001')
    expect(result.data?.sourceEvidenceIds).toContain('ev_002')
  })

  it('rejects summary for nonexistent case', async () => {
    const result = await svc.generateSummary('nope', OPERATOR)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Case not found')
  })

  it('rejects summary for case with no evidence', async () => {
    svc.createCase('empty_case', 'Empty', '', OPERATOR)
    const result = await svc.generateSummary('empty_case', OPERATOR)
    expect(result.success).toBe(false)
    expect(result.error).toBe('No evidence to summarize')
  })

  it('lists summaries for a case', async () => {
    await svc.generateSummary(CASE_ID, OPERATOR)
    const summaries = svc.listSummaries(CASE_ID)
    expect(summaries).toHaveLength(1)
    expect(summaries[0].generatedBy).toBe('mock-ai-v1')
  })
})

// ─── Export ──────────────────────────────────────────────────

describe('Case Jacket: export', () => {
  let svc: CaseJacketService

  beforeEach(async () => {
    svc = createService()
    seedCase(svc)
    seedEvidence(svc)
    await svc.generateSummary(CASE_ID, OPERATOR)
  })

  it('creates an export manifest', () => {
    const result = svc.createExport(CASE_ID, OPERATOR)
    expect(result.success).toBe(true)
    expect(result.data?.caseId).toBe(CASE_ID)
    expect(result.data?.evidenceIds).toHaveLength(2)
    expect(result.data?.summaryIds).toHaveLength(1)
    expect(result.data?.manifestHash).toBeTruthy()
  })

  it('export manifest hash is deterministic', () => {
    const r1 = svc.createExport(CASE_ID, OPERATOR)
    const r2 = svc.createExport(CASE_ID, OPERATOR)
    expect(r1.data?.manifestHash).toBe(r2.data?.manifestHash)
  })

  it('rejects export for nonexistent case', () => {
    const result = svc.createExport('nope', OPERATOR)
    expect(result.success).toBe(false)
  })

  it('supports format selection', () => {
    const result = svc.createExport(CASE_ID, OPERATOR, 'archive')
    expect(result.data?.format).toBe('archive')
  })
})

// ─── Audit Log ───────────────────────────────────────────────

describe('Case Jacket: audit log', () => {
  let svc: CaseJacketService

  beforeEach(() => {
    svc = createService()
    seedCase(svc)
    seedEvidence(svc)
  })

  it('logs case creation', () => {
    const log = svc.getAuditLogForCase(CASE_ID)
    const creation = log.find((e) => e.action === 'case-created')
    expect(creation).toBeDefined()
    expect(creation!.actor).toBe(OPERATOR)
  })

  it('logs evidence submission', () => {
    const log = svc.getAuditLogForCase(CASE_ID)
    const submissions = log.filter((e) => e.action === 'evidence-submitted')
    expect(submissions).toHaveLength(2)
  })

  it('logs summary generation', async () => {
    await svc.generateSummary(CASE_ID, OPERATOR)
    const log = svc.getAuditLogForCase(CASE_ID)
    const summaryEntry = log.find((e) => e.action === 'summary-generated')
    expect(summaryEntry).toBeDefined()
  })

  it('logs export creation', () => {
    svc.createExport(CASE_ID, OPERATOR)
    const log = svc.getAuditLogForCase(CASE_ID)
    const exportEntry = log.find((e) => e.action === 'export-created')
    expect(exportEntry).toBeDefined()
  })

  it('audit log is append-only (grows monotonically)', () => {
    const sizeBefore = svc.auditLogSize
    svc.createCase('c2', 'Another', '', OPERATOR)
    expect(svc.auditLogSize).toBeGreaterThan(sizeBefore)
  })

  it('audit entries have unique IDs', () => {
    const log = svc.getAuditLog()
    const ids = log.map((e) => e.entryId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('filters by case ID', () => {
    svc.createCase('other_case', 'Other', '', OPERATOR)
    const log = svc.getAuditLogForCase('other_case')
    expect(log.every((e) => e.caseId === 'other_case')).toBe(true)
  })
})

// ─── Mock AI Adapter ─────────────────────────────────────────

describe('MockAISummaryAdapter', () => {
  it('produces a summary with disclaimer', async () => {
    const adapter = new MockAISummaryAdapter()
    const evidence: EvidenceItem[] = [
      {
        evidenceId: 'ev_t1',
        caseId: 'c_test',
        type: 'document',
        label: 'Test Doc',
        description: 'A test document.',
        contentHash: 'abc',
        size: 100,
        mimeType: 'application/pdf',
        submittedBy: 'op',
        submittedAt: new Date().toISOString(),
        custody: [],
      },
    ]
    const summary = await adapter.generateSummary('c_test', evidence)
    expect(summary.disclaimer).toContain('not legal advice')
    expect(summary.sourceEvidenceIds).toEqual(['ev_t1'])
    expect(summary.confidence).toBeGreaterThan(0)
    expect(summary.confidence).toBeLessThanOrEqual(1)
  })

  it('adapter ID is deterministic', () => {
    const adapter = new MockAISummaryAdapter()
    expect(adapter.adapterId).toBe('mock-ai-v1')
  })
})
