# Case Jacket Tool — B21-P6

> A case-level evidence organization, AI summary, and export system.

---

## Overview

The Case Jacket system provides:

1. **Case Profile Management** — Create, retrieve, and update case profiles.
2. **Evidence Indexing** — Submit immutable evidence items with chain-of-custody tracking.
3. **AI Summary Generation** — Produce disclaimered, deterministic summaries from evidence.
4. **Export Manifests** — Generate tamper-evident packages with deterministic hashes.
5. **Audit Logging** — Append-only log of all operations.

## Architecture

```
CaseJacketService
├── Case Management (CRUD + status)
├── Evidence Management (submit, custody, list)
├── AI Summary (via AISummaryAdapterInterface)
├── Export (manifest + hash)
└── Audit Log (append-only)
```

## Files

| File | Purpose |
|------|---------|
| `apps/tools/case-jacket/tool.manifest.json` | Tool manifest |
| `apps/tools/case-jacket/types.ts` | All type definitions |
| `apps/tools/case-jacket/CaseJacketService.ts` | Service logic |
| `apps/tools/case-jacket/AISummaryAdapter.ts` | AI adapter interface + mock |
| `apps/tools/case-jacket/__tests__/case-jacket.test.ts` | Tests |

## AI Summary Adapter

The system uses a pluggable adapter interface:

```typescript
interface AISummaryAdapterInterface {
  readonly adapterId: string
  generateSummary(caseId: string, evidence: readonly EvidenceItem[]): Promise<AISummary>
}
```

The default `MockAISummaryAdapter`:
- Produces deterministic output from evidence metadata.
- Includes an explicit legal disclaimer.
- Makes no external API calls.
- Reports a fixed confidence score.

Production adapters can connect to governed AI services while preserving
the same interface contract.

## Evidence Integrity

- Evidence items are immutable after submission.
- Each item has a `contentHash` (SHA-256 of original content).
- Chain of custody is append-only (events only accumulate).
- Original evidence is never modified or deleted by the system.

## Export Manifests

Export manifests include:
- List of included evidence IDs.
- List of included summary IDs.
- Deterministic `manifestHash` (DJB2 of sorted content hashes + summary IDs).
- Format selector (JSON, PDF bundle, archive).

## Audit Log

- Append-only (no deletions or edits).
- Unique entry IDs (sequential).
- Filterable by case ID.
- Logged events: case-created, status-changed, evidence-submitted, custody events, summary-generated, export-created.

## Invariants

1. Evidence is immutable after submission.
2. Audit log is append-only.
3. AI summaries always include a disclaimer.
4. Export manifest hash is deterministic.
5. All mutations are logged.
6. Custody chain only grows.
