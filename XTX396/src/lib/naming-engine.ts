/**
 * Naming Engine — Template-based file naming for case jacket documents.
 *
 * Tokens:
 *   {DOCKET}   – Case docket number (sanitized)
 *   {TYPE}     – Filing type token (e.g. CMPL, MTN, ORD)
 *   {DATE}     – Filing date in YYYY-MM-DD
 *   {SEQ}      – Zero-padded sequence number within case (01, 02, …)
 *   {COURT}    – Short court identifier
 *   {PARTY}    – First party last name
 *   {ORIGINAL} – Original filename (without extension)
 *   {TITLE}    – Document title (sanitized)
 *   {EXT}      – File extension (pdf, jpg, …)
 */

import type { PDFAsset, Case, FilingType, NamingRule } from './types'

// ---------- helpers ----------

/** Remove characters unsafe for filenames, collapse spaces & dashes. */
function sanitize(str: string): string {
  return str
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function zeroPad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

function extractExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(dot + 1).toLowerCase() : 'pdf'
}

function originalStem(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(0, dot) : filename
}

// ---------- core ----------

export interface NamingContext {
  doc: PDFAsset
  caseData?: Case | null
  filingType?: FilingType | null
  sequenceNumber: number
}

/**
 * Resolve a single template string against a NamingContext,
 * returning the computed filename (without extension) and the extension separately.
 */
export function resolveTemplate(
  template: string,
  ctx: NamingContext,
): { stem: string; ext: string } {
  const docket = sanitize(ctx.caseData?.docket ?? 'NO-DOCKET')
  const type = ctx.filingType?.defaultNamingToken ?? ctx.doc.documentType ?? 'DOC'
  const date = ctx.doc.filingDate ?? new Date(ctx.doc.createdAt).toISOString().slice(0, 10)
  const seq = zeroPad(ctx.sequenceNumber)
  const court = sanitize(ctx.caseData?.court ?? 'COURT').slice(0, 30)

  // Try to extract a party name from case data
  const partiesRaw = ctx.caseData?.parties ?? ''
  const party = sanitize(partiesRaw.split(/\s+v\.?\s+/i)[0] || 'PARTY').slice(0, 30)

  const original = originalStem(ctx.doc.metadata?.originalFilename ?? ctx.doc.title ?? 'document')
  const title = sanitize(ctx.doc.title ?? 'Untitled')
  const ext = extractExtension(ctx.doc.metadata?.originalFilename ?? ctx.doc.title ?? 'document.pdf')

  const stem = template
    .replace(/\{DOCKET\}/gi, docket)
    .replace(/\{TYPE\}/gi, type)
    .replace(/\{DATE\}/gi, date)
    .replace(/\{SEQ\}/gi, seq)
    .replace(/\{COURT\}/gi, court)
    .replace(/\{PARTY\}/gi, party)
    .replace(/\{ORIGINAL\}/gi, sanitize(original))
    .replace(/\{TITLE\}/gi, title)
    .replace(/\{EXT\}/gi, ext)

  return { stem: sanitize(stem), ext }
}

/**
 * Preview what a batch rename would produce — returns an array of
 * `{ docId, currentName, newName }` without mutating anything.
 */
export function previewBatchRename(
  docs: PDFAsset[],
  cases: Case[],
  filingTypes: FilingType[],
  rule: NamingRule,
): Array<{ docId: string; currentName: string; newName: string }> {
  // Group docs by caseId to assign sequence numbers per case
  const byCaseId: Record<string, PDFAsset[]> = {}
  for (const doc of docs) {
    const key = doc.caseId ?? '__unassigned__'
    ;(byCaseId[key] ??= []).push(doc)
  }

  // Sort each group by filingDate then createdAt for consistent sequence
  for (const group of Object.values(byCaseId)) {
    group.sort((a, b) => {
      const da = a.filingDate ?? ''
      const db = b.filingDate ?? ''
      if (da !== db) return da.localeCompare(db)
      return a.createdAt - b.createdAt
    })
  }

  const results: Array<{ docId: string; currentName: string; newName: string }> = []

  for (const [caseId, group] of Object.entries(byCaseId)) {
    const caseData = cases.find(c => c.id === caseId) ?? null

    for (let i = 0; i < group.length; i++) {
      const doc = group[i]
      const filingType = filingTypes.find(ft => ft.id === doc.filingTypeId) ?? null
      const { stem, ext } = resolveTemplate(rule.template, {
        doc,
        caseData,
        filingType,
        sequenceNumber: i + 1,
      })

      results.push({
        docId: doc.id,
        currentName: doc.metadata?.displayFilename ?? doc.metadata?.originalFilename ?? doc.title,
        newName: `${stem}.${ext}`,
      })
    }
  }

  return results
}

/**
 * Apply the rename — mutates each PDFAsset's metadata.displayFilename and title.
 * Returns the mutated docs so caller can persist them.
 */
export function applyBatchRename(
  docs: PDFAsset[],
  cases: Case[],
  filingTypes: FilingType[],
  rule: NamingRule,
): PDFAsset[] {
  const preview = previewBatchRename(docs, cases, filingTypes, rule)
  const lookup = new Map(preview.map(p => [p.docId, p.newName]))

  return docs.map(doc => {
    const newName = lookup.get(doc.id)
    if (!newName) return doc
    return {
      ...doc,
      title: newName,
      metadata: {
        ...doc.metadata,
        displayFilename: newName,
      },
      updatedAt: Date.now(),
    }
  })
}

// ---------- built-in rules ----------

export const DEFAULT_NAMING_RULES: NamingRule[] = [
  {
    id: 'standard',
    name: 'Standard Court Filing',
    template: '{DOCKET}_{TYPE}_{DATE}',
    tokens: ['DOCKET', 'TYPE', 'DATE'],
    enabled: true,
    order: 1,
  },
  {
    id: 'sequenced',
    name: 'Sequential with Type',
    template: '{DOCKET}_{SEQ}_{TYPE}',
    tokens: ['DOCKET', 'SEQ', 'TYPE'],
    enabled: false,
    order: 2,
  },
  {
    id: 'party-date',
    name: 'Party + Date',
    template: '{PARTY}_{TYPE}_{DATE}',
    tokens: ['PARTY', 'TYPE', 'DATE'],
    enabled: false,
    order: 3,
  },
  {
    id: 'full-context',
    name: 'Full Context',
    template: '{DOCKET}_{COURT}_{TYPE}_{DATE}_{SEQ}',
    tokens: ['DOCKET', 'COURT', 'TYPE', 'DATE', 'SEQ'],
    enabled: false,
    order: 4,
  },
]

export const AVAILABLE_TOKENS = [
  { token: 'DOCKET', label: 'Docket #', example: 'BER-L-001234-24' },
  { token: 'TYPE', label: 'Filing Type', example: 'MTN' },
  { token: 'DATE', label: 'Filing Date', example: '2024-08-15' },
  { token: 'SEQ', label: 'Sequence #', example: '03' },
  { token: 'COURT', label: 'Court', example: 'NJ-SUPER' },
  { token: 'PARTY', label: 'Party Name', example: 'Smith' },
  { token: 'ORIGINAL', label: 'Original Name', example: 'scan001' },
  { token: 'TITLE', label: 'Doc Title', example: 'Motion-to-Dismiss' },
] as const
