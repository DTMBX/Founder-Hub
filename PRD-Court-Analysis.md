# Product Requirements: xTx396 Court Analysis & Document Intelligence

Building a professional legal document analysis system for the xTx396 Founder Hub that transforms court case management from basic document storage into an intelligent triage and review platform—always with strict human validation before anything becomes visible.

**Current Implementation Status**: Core architecture complete with filing type taxonomy, document organization by type with collapsible groups, OCR pipeline with confidence scoring, automated field extraction, review notes generation, case brief analysis, and comprehensive admin management interfaces. System successfully organizes documents by filing type with date ranges, provides attorney review notes and contingency checklists, and maintains strict visibility controls with audit trails.

## Experience Qualities

1. **Trustworthy and Validated** - Every AI-generated insight is clearly marked as draft and requires explicit admin review, ensuring attorneys never see unverified analysis presented as fact.
2. **Attorney-grade Organization** - Documents are grouped by filing type with deterministic sorting, collapsible groups showing date ranges, and featured document highlighting, making case review feel like working with a well-organized litigation file.
3. **Transparent and Traceable** - OCR confidence scores, snippet evidence, and admin approval trails make the provenance of every data point clear and auditable.
4. **Attorney-Ready Review Workflow** - Comprehensive review notes capture damages/injuries, key evidence sources, deadlines, relief sought, plus structured contingency evaluation checklists with progress tracking.

## Complexity Level

**Complex Application** (advanced functionality with multiple views and workflows) - This extends beyond content showcase into intelligent document processing with OCR pipelines, confidence scoring, multi-stage review workflows, structured analysis generation, attorney review notes with contingency checklists, and strict visibility controls. The system must handle asynchronous processing, maintain audit trails, and provide both admin curation interfaces and attorney-facing presentation views with professional case jacket layouts.

## Essential Features

### Filing Type Taxonomy Management
**Functionality**: Admin defines and manages document filing types (Complaint, Motion, Order, Certification, Exhibit, etc.) with custom properties.
**Purpose**: Creates consistent categorization that mirrors real litigation workflow and enables meaningful grouping.
**Trigger**: Admin navigates to Settings → Filing Types.
**Progression**: Admin views list → clicks Add Type → enters name/token/icon/order → saves → type appears in document dropdowns → can reorder via drag.
**Success**: All document editors show current filing types; documents group correctly by type in Case Jacket view.

### Document Organization by Filing Type
**Functionality**: Case Jacket displays documents in collapsible groups by filing type with count badges and date ranges.
**Purpose**: Attorneys can quickly scan "all Motions" or "all Orders" without hunting through chronological lists.
**Trigger**: User opens Case Jacket from Court section.
**Progression**: Jacket loads → documents auto-group by filing type → each group shows count/date range → user expands/collapses groups → clicks doc to preview.
**Success**: Documents sorted deterministically (filing date desc, then title); undated docs labeled clearly; groups collapsible; fast rendering.

### Chronological View Toggle
**Functionality**: Toggle between "By Filing Type" (grouped) and "Chronological" (flat date list).
**Purpose**: Some attorneys prefer timeline scanning; others prefer type-based review.
**Trigger**: User clicks view toggle button in Case Jacket header.
**Progression**: User toggles → view re-renders with chosen organization → preference persists in session.
**Success**: Both views show same documents with same sorting; toggle is instant; preference remembered.

### OCR Text Extraction (Optional)
**Functionality**: Admin enables OCR per batch or per document to extract searchable text from PDFs.
**Purpose**: Enables full-text search and powers automated field suggestions.
**Trigger**: Admin uploads batch → toggles "Enable OCR" → confirms.
**Progression**: Files upload → OCR status shows "Pending" → background processing → status updates to "Completed" with confidence → text indexed.
**Success**: Extracted text searchable; OCR status visible per doc; failures clearly reported; processing doesn't block UI.

### OCR Field Suggestions with Evidence
**Functionality**: From extracted text, propose candidate fields (filing date, docket, court, doc type, parties) with confidence scores and highlighted snippets.
**Purpose**: Speeds admin data entry while maintaining accuracy through transparency.
**Trigger**: OCR completes on a document.
**Progression**: Admin opens document in staging review → sees suggested fields panel → each suggestion shows confidence badge + "Why" tooltip with text snippet → admin accepts/rejects/edits → saves confirmed values.
**Success**: Suggestions never auto-publish; high-confidence suggestions (>85%) save clicks; low-confidence flagged for manual review; snippet evidence builds trust.

### Attorney Review Notes Generation (Draft)
**Functionality**: For each OCR'd document, generate structured "Review Notes (Draft)" with summary, procedural signals, key dates, entities, questions for counsel, and flags. Additionally, provides case-level review notes panel capturing damages/injuries, key evidence sources (BWC, PDFs, testimony), deadlines/limitations dates (admin-entered, never auto-calculated), relief sought, and general attorney notes.
**Purpose**: Gives attorneys a starting point for case evaluation without manual note-taking and provides structured fields for contingency assessment.
**Trigger**: Admin enables analysis generation for a document with OCR text, or manually enters review notes in Case Manager.
**Progression**: Admin clicks "Generate Review Notes" → system processes → draft notes appear with "DRAFT—requires verification" banner → admin reviews/edits → marks as Reviewed → optionally publishes per visibility rules. Alternatively, admin manually completes Review Notes fields in Case Manager (damages/injuries, key evidence, deadlines, relief sought) and saves for attorney visibility.
**Success**: Notes clearly marked as unverified until admin review; structured sections make scanning easy; questions highlight gaps; case-level review notes display prominently in Case Jacket for attorney triage.

### Contingency Evaluation Checklist
**Functionality**: Admin-configurable checklist template for each case with items covering jurisdiction verification, procedural posture assessment, key evidence availability, damages calculation readiness, statute of limitations compliance, and other contingency factors. Each item has checkbox status, optional notes field, and progress tracking.
**Purpose**: Provides attorneys with a structured framework for evaluating whether a case is suitable for contingency representation, ensuring no critical factor is overlooked during triage.
**Trigger**: Admin creates or opens a case in Case Manager.
**Progression**: Admin navigates to Contingency Checklist tab → views template items or adds custom checklist items → checks off completed evaluations → adds notes per item → saves progress → checklist displays in Case Jacket for attorney review with clear progress indicator.
**Success**: Checklist visible in Case Jacket with progress percentage; attorneys can quickly see evaluation status; admin can customize checklist per case; items track completion state; notes field allows detailed reasoning per item.

### Case-Level Brief Generation (Draft)
**Functionality**: Compile case-wide analysis: posture overview, timeline highlights, key filings checklist, "what's missing" list.
**Purpose**: Attorneys get a case brief that synthesizes the entire jacket.
**Trigger**: Admin clicks "Generate Case Brief" in Case Manager.
**Progression**: System analyzes all case documents → generates draft brief → admin reviews each section → edits as needed → marks as Reviewed → sets visibility.
**Success**: Brief never visible publicly until admin approval; sections are editable; missing docs checklist prompts admin to fill gaps.

### Visibility Controls for Analysis
**Functionality**: Per-case and per-document settings control who can see generated analysis (Private / Unlisted Link / Public).
**Purpose**: Protects sensitive attorney work product and unverified drafts from public exposure.
**Trigger**: Admin sets visibility dropdown in document or case editor.
**Progression**: Admin edits document → sets Analysis Visibility to "Private only" (default) → saves → analysis visible only in admin dashboard → attorney accessing case via unlisted link sees no analysis.
**Success**: Default is always Private; prominent warning before changing to Public; visibility enforced server-side; audit log tracks changes.

### Admin Review Workflow
**Functionality**: Three-state workflow: Draft (unreviewed) → Reviewed (admin confirmed) → Published (visible per visibility).
**Purpose**: Enforces human validation gate before any AI output becomes visible.
**Trigger**: Admin generates analysis.
**Progression**: Analysis created in Draft state → admin reviews content → clicks "Mark as Reviewed" → optionally edits → clicks "Publish" if visibility allows → status badge updates.
**Success**: Clear status badges; admin can't accidentally publish unreviewed content; published analysis shows admin name and timestamp.

### Evidence Linkage and Anchoring
**Functionality**: Review notes link back to specific documents and pages/snippets that support each extracted point.
**Purpose**: Attorneys can verify claims quickly; builds trust in automated analysis.
**Trigger**: User views published review notes.
**Progression**: User reads a note point (e.g., "Motion filed 03/15/2023") → sees link icon → clicks → PDF viewer opens to relevant page/snippet → user verifies.
**Success**: Links jump to correct page; unanchored points labeled "Unanchored—verify manually"; snippet highlighting visible.

### Audit Trail and Versioning
**Functionality**: Log all OCR runs, analysis generations, admin edits, review status changes, and publication events.
**Purpose**: Maintains chain of custody and allows tracing how any piece of analysis was derived.
**Trigger**: Any OCR/analysis/review action.
**Progression**: Action occurs → audit event created with who/what/when → admin can view audit log filtered by document or case → sees full history.
**Success**: Every change tracked; "Regenerate analysis" keeps prior versions; admin can see previous drafts.

## Edge Case Handling

- **Missing filing dates** - Documents without dates labeled "Undated" and placed in dedicated sub-group within filing type; fallback to upload date with clear label; admin can manually override.
- **OCR failures** - Status shows "Failed" with error message; admin can retry or skip; document remains fully functional without OCR; manual fields always work.
- **Conflicting suggestions** - When OCR proposes multiple candidates, show all with confidence scores; admin picks best or enters manually; alternatives preserved in metadata.
- **Unanchored analysis points** - If system can't link a claim to a specific snippet, label it "Unanchored—verify manually" with warning icon; never hide unverifiable claims.
- **Visibility rule conflicts** - Case-level visibility acts as ceiling (Private case can't expose Public docs); admin gets warning when attempting invalid visibility combo.
- **Analysis regeneration** - "Regenerate" button archives current version with timestamp; new version marked as Draft requiring re-review; previous versions accessible in history.
- **Large document batches** - OCR queue processes asynchronously; admin sees progress per file; failures don't block successful files; pause/resume/cancel available.

## Design Direction

Professional, trustworthy, attorney-grade. The interface should feel like a sophisticated legal tech platform with clear information hierarchy, restrained colors signaling confidence levels (green/high, yellow/medium, orange/low), and prominent visual indicators for review status. Analysis must never look like final truth until admin-reviewed; Draft state visually distinct from Reviewed state. Fast scanning is priority—attorneys need to triage in minutes, so typography, spacing, and grouping must support rapid comprehension.

## Color Selection

Building on the existing dark theme with enhanced semantic signaling for confidence and review states.

- **Primary Color (oklch(0.65 0.24 250))**: Main brand/action color for key buttons and navigation—used for primary CTAs and active states.
- **Accent Color (oklch(0.75 0.15 200))**: Highlight color for focus and important elements—used for feature highlights and hover states.
- **Success/High Confidence (oklch(0.70 0.18 145))**: Green indicating high-confidence suggestions (≥85%) and reviewed status—signals trustworthy data.
- **Warning/Medium Confidence (oklch(0.75 0.15 85))**: Yellow for medium-confidence suggestions (65-84%)—prompts careful review.
- **Alert/Low Confidence (oklch(0.70 0.18 35))**: Orange for low-confidence suggestions (<65%) and missing anchors—signals caution required.
- **Draft State Background (oklch(0.30 0.08 250))**: Slightly warmer card background with subtle border to visually distinguish unreviewed content from reviewed.

**Foreground/Background Pairings**:
- Background (oklch(0.15 0.04 250)): Foreground White (oklch(0.98 0 0)) - Ratio 17.2:1 ✓
- Success (oklch(0.70 0.18 145)): White text (oklch(0.98 0 0)) - Ratio 8.5:1 ✓
- Warning (oklch(0.75 0.15 85)): Dark text (oklch(0.15 0.04 250)) - Ratio 9.1:1 ✓
- Alert (oklch(0.70 0.18 35)): White text (oklch(0.98 0 0)) - Ratio 8.2:1 ✓

## Font Selection

Continue using the established typefaces—Space Grotesk for strong hierarchical headings (filing type groups, section headers) and Inter for readable body text (document lists, analysis notes). JetBrains Mono for docket numbers, confidence scores, and metadata fields.

- **Typographic Hierarchy**:
  - H1 (Case Title): Space Grotesk Bold / 28px / tight letter spacing
  - H2 (Filing Type Group): Space Grotesk SemiBold / 18px / normal spacing
  - H3 (Section Headers): Space Grotesk Medium / 16px / normal spacing
  - Body (Document Titles): Inter Medium / 15px / relaxed line height (1.6)
  - Small (Metadata/Dates): Inter Regular / 13px / normal line height
  - Mono (Dockets/Confidence): JetBrains Mono Medium / 13px / tabular numbers

## Animations

Subtle and purposeful—expand/collapse filing type groups with smooth height transition (250ms ease-out); confidence badge fade-in when suggestions load (200ms); review status change with brief highlight pulse (300ms). Respect reduced-motion by disabling transitions. No animation should delay user actions; prioritize instant feedback over flourish.

## Component Selection

- **Components**: Accordion for filing type groups (collapsible with count badges); Tabs for view toggle (Filing Type / Chronological); Badge for confidence levels and review status; Tooltip for "Why this suggestion" evidence snippets; Dialog for review note editing; Sheet for PDF Quick Look; Alert for draft warnings; Separator for clean visual division between groups.
- **Customizations**: Custom AccordionItem styling with count badge in trigger; custom Badge variants for confidence levels (success/warning/alert); custom Alert with strong visual "DRAFT" indicator; custom Tooltip with code-style snippet display.
- **States**: 
  - Buttons: default (glass), hover (border brighten + lift), active (press scale), disabled (opacity 50%)
  - Confidence badges: high (green bg + white text), medium (yellow bg + dark text), low (orange bg + white text)
  - Review status badges: Draft (orange + warning icon), Reviewed (blue + check icon), Published (green + public icon)
  - Document rows: default (glass card), hover (border accent + lift), selected (accent border), loading (skeleton pulse)
- **Icon Selection**: FunnelSimple (filter), SortAscending/Descending (sort), Star (featured), CheckCircle (reviewed), Warning (draft/low confidence), Eye (preview), FileText (document), Certificate (certification), Scales (motion), Stamp (order), ClipboardText (review notes), ListChecks (checklist)
- **Spacing**: Generous padding within cards (p-6), consistent gap between groups (gap-4), tight spacing within document metadata (gap-2), section separators (my-6)
- **Mobile**: Filing type groups stack full-width with larger touch targets; filters collapse into bottom sheet; view toggle becomes segmented control; review notes move to separate tab in mobile Case Jacket tabs.

## Data Model Additions

### FilingType
```typescript
{
  id: string
  name: string
  sortOrder: number
  defaultNamingToken: string
  icon?: string
  color?: string
  defaultVisibility?: 'public' | 'unlisted' | 'private'
  createdAt: number
  updatedAt: number
}
```

### Document (extends PDFAsset)
New fields:
```typescript
{
  filingTypeId?: string
  filingDate?: string // ISO date string
  filingDateConfirmed: boolean // true if admin confirmed vs suggested
  tags: string[]
  ocrStatus: 'none' | 'pending' | 'completed' | 'failed'
  ocrTextRef?: string // key to stored extracted text
  extractedFields: {
    docket?: { value: string; confidence: number; source: string; reasoning: string }
    filingDate?: { value: string; confidence: number; source: string; reasoning: string }
    courtName?: { value: string; confidence: number; source: string; reasoning: string }
    documentType?: { value: string; confidence: number; source: string; reasoning: string }
    parties?: { value: string; confidence: number; source: string; reasoning: string }
  }
  analysisStatus: 'none' | 'draft' | 'reviewed' | 'published'
  notesVisibility: 'private' | 'unlisted' | 'public'
}
```

### DocumentAnalysis
```typescript
{
  id: string
  docId: string
  version: number
  generatedAt: number
  confidence: number
  summary: string
  proceduralSignals: Array<{
    type: string // 'motion_type' | 'relief_requested' | 'hearing_scheduled' | 'deadline_set'
    value: string
    confidence: number
    sourceSnippet?: string
    pageNumber?: number
  }>
  keyDates: Array<{
    date: string
    label: string
    confidence: number
    sourceSnippet?: string
    pageNumber?: number
  }>
  keyEntities: Array<{
    name: string
    role: string // 'judge' | 'attorney' | 'party' | 'witness' | 'expert'
    confidence: number
  }>
  issues: string[]
  suggestedTags: string[]
  questionsForCounsel: string[]
  missingContextFlags: string[]
  adminReviewedBy?: string
  adminReviewedAt?: number
  adminNotes?: string
  status: 'draft' | 'reviewed' | 'published'
  previousVersionId?: string
}
```

### CaseAnalysis
```typescript
{
  id: string
  caseId: string
  version: number
  generatedAt: number
  postureSummary: string
  timelineHighlights: Array<{
    date: string
    event: string
    significance: string
    linkedDocId?: string
  }>
  keyFilingsChecklist: Array<{
    filingType: string
    present: boolean
    docIds?: string[]
    notes?: string
  }>
  missingDocsChecklist: string[]
  counselQuestions: string[]
  damagesInjuriesAnalysis?: string
  keyEvidenceHighlights?: string[]
  proceduralPosture: string
  adminReviewStatus: 'draft' | 'reviewed' | 'published'
  adminReviewedBy?: string
  adminReviewedAt?: number
  adminNotes?: string
  visibility: 'private' | 'unlisted' | 'public'
  previousVersionId?: string
}
```

## MVP Feature Acceptance Criteria

### Organization
- **MUST** group documents by filing type with collapsible accordion sections
- **MUST** show count, date range, and featured docs per group
- **MUST** sort by filing date (newest first) with secondary title sort
- **MUST** provide "Oldest first" toggle that reverses date sort
- **MUST** handle undated documents gracefully with "Undated" sub-group
- **MUST** provide chronological view toggle that persists per session
- **MUST** allow admin to override filing type, date, and title manually
- **MUST** clearly differentiate "Admin Confirmed" vs "OCR Suggested" fields

### OCR + Field Suggestions
- **MUST** enable/disable OCR per batch upload with clear toggle
- **MUST** extract text asynchronously with visible status per document
- **MUST** propose filing date, docket, court, doc type, parties with confidence
- **MUST** show confidence score, source, and reasoning for each suggestion
- **MUST** display snippet evidence in tooltip showing matched text
- **MUST** allow admin to accept, reject, or edit each suggestion individually
- **MUST** require explicit admin confirmation before any suggestion becomes published value
- **MUST** store original extracted text securely and index for search

### Review Notes Generation
- **MUST** generate structured review notes for each OCR'd document on demand
- **MUST** include sections: summary, procedural signals, key dates, entities, questions, flags
- **MUST** mark all generated content as "Draft—requires verification" with visual indicator
- **MUST** require admin review and explicit "Mark as Reviewed" action
- **MUST** allow admin to edit any section of generated notes
- **MUST** link notes back to source documents and pages where possible
- **MUST** label unanchored claims as "Unanchored—verify manually" with warning icon
- **MUST** respect visibility settings (Private by default)

### Case Brief Generation
- **MUST** generate case-level analysis compiling all documents
- **MUST** include posture summary, timeline, key filings, missing docs checklist
- **MUST** mark as Draft requiring admin review before visibility
- **MUST** provide editable sections for admin customization
- **MUST** show "what's missing" checklist prompting admin action
- **MUST** allow admin to set visibility: Private / Unlisted / Public
- **MUST** display prominent warning before changing visibility to Public

### Visibility & Safety
- **MUST** default all analysis to Private visibility
- **MUST** enforce case-level visibility as ceiling for document visibility
- **MUST** show prominent warning dialog before publishing analysis publicly
- **MUST** require explicit "Publish" action separate from "Review" action
- **MUST** display admin reviewer name and timestamp on published analysis
- **MUST** provide "Regenerate analysis" that archives current version with history

### Audit & Integrity
- **MUST** log all OCR runs with timestamp, file IDs, and results
- **MUST** log all analysis generations with version and inputs
- **MUST** log all admin review actions (accept/reject/edit/publish)
- **MUST** log all visibility changes with before/after values
- **MUST** preserve previous analysis versions for traceability
- **MUST** show audit timeline per document and per case in admin view
- **MUST** provide downloadable audit report per case

### Attorney Experience
- **MUST** present Case Jacket with clean left panel (metadata), main panel (grouped docs), optional right panel (preview)
- **MUST** provide fast document scanning with immediate group expand/collapse
- **MUST** show review notes in dockable/collapsible panel that doesn't block document browsing
- **MUST** allow keyboard navigation (Expand All, Collapse All, arrow keys, Enter to open doc)
- **MUST** display confidence levels with clear color coding (green/yellow/orange)
- **MUST** ensure published analysis feels credible with admin approval badge
- **MUST** keep UI fast (lazy load preview, skeleton placeholders, virtualized lists if >50 docs)
