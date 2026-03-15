/**
 * EvidentDemoPage — Interactive demo of the Evident e-discovery platform.
 *
 * All mock/demo — no real evidence is processed. Demonstrates:
 * - Document ingestion (drag-drop)
 * - OCR text extraction (simulated)
 * - Searchable results grid
 * - Chain of custody timeline
 * - Redaction tool
 */

import {
  ArrowLeft,
  CheckCircle,
  CircleNotch,
  ClockCounterClockwise,
  Eye,
  EyeSlash,
  FileDoc,
  FileImage,
  FilePdf,
  FileText,
  Hash,
  LinkSimple,
  MagnifyingGlass,
  ShieldCheck,
  Upload,
  Warning,
} from '@phosphor-icons/react'
import { AnimatePresence,motion } from 'framer-motion'
import { useCallback, useRef,useState } from 'react'

import { GlassCard } from '@/components/ui/glass-card'
import { usePageMeta } from '@/hooks/use-page-meta'

interface EvidentDemoPageProps {
  onBack: () => void
}

// Mock document types
interface MockDocument {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'image' | 'email'
  size: string
  extractedText: string
  hash: string
  ingested: string
  custodian: string
  status: 'processing' | 'indexed' | 'flagged'
}

interface CustodyEvent {
  timestamp: string
  action: string
  actor: string
  hash: string
}

const DEMO_DOCUMENTS: MockDocument[] = [
  {
    id: 'doc-001',
    name: 'Board_Meeting_Minutes_2024Q3.pdf',
    type: 'pdf',
    size: '2.4 MB',
    extractedText: 'Board of Directors Meeting — September 15, 2024. Present: J. Smith (Chair), M. Williams, R. Chen, A. Patel. Agenda: Q3 revenue review, compliance audit update, new product timeline. Motion to approve Q3 budget reallocation passed unanimously. Action items: Legal team to review vendor contract by October 1.',
    hash: 'sha256:a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9',
    ingested: '2024-09-16T09:30:00Z',
    custodian: 'J. Smith',
    status: 'indexed',
  },
  {
    id: 'doc-002',
    name: 'Vendor_Agreement_Redline_v3.docx',
    type: 'docx',
    size: '890 KB',
    extractedText: 'SERVICE AGREEMENT between Acme Corp and Beta Services LLC. Section 4.2: Data handling obligations. All personally identifiable information (PII) must be encrypted at rest using AES-256. Breach notification within 72 hours. Indemnification clause amended per legal review dated August 28.',
    hash: 'sha256:b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    ingested: '2024-09-16T09:31:00Z',
    custodian: 'Legal Dept.',
    status: 'flagged',
  },
  {
    id: 'doc-003',
    name: 'Site_Inspection_Photo_001.jpg',
    type: 'image',
    size: '5.1 MB',
    extractedText: '[OCR] Location: 1200 Market St. Date stamp: 09/12/2024. Inspector badge visible. Structural assessment complete — no deficiencies noted. Permit #2024-0892.',
    hash: 'sha256:c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
    ingested: '2024-09-16T09:32:00Z',
    custodian: 'Site Team',
    status: 'indexed',
  },
  {
    id: 'doc-004',
    name: 'Internal_Memo_Compliance.pdf',
    type: 'pdf',
    size: '340 KB',
    extractedText: 'CONFIDENTIAL — Internal Memo. To: Executive Committee. From: Chief Compliance Officer. Re: Regulatory filing deadline extension. The SEC has granted a 30-day extension for Form 10-K filing. All divisional reports due by revised date of November 15, 2024.',
    hash: 'sha256:d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5',
    ingested: '2024-09-16T09:33:00Z',
    custodian: 'Compliance',
    status: 'indexed',
  },
  {
    id: 'doc-005',
    name: 'Email_Chain_ProjectAlpha.eml',
    type: 'email',
    size: '156 KB',
    extractedText: 'From: r.chen@example.com To: team@example.com Subject: Project Alpha Update — Phase 2 timeline revised. We need to push the deliverable from Q4 to Q1 due to resource constraints. Budget impact: minimal. Client notified. See attached revised Gantt chart.',
    hash: 'sha256:e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6',
    ingested: '2024-09-16T09:34:00Z',
    custodian: 'R. Chen',
    status: 'indexed',
  },
]

const CUSTODY_EVENTS: CustodyEvent[] = [
  { timestamp: '2024-09-16T09:30:00Z', action: 'Documents ingested from secure upload', actor: 'System', hash: 'sha256:batch-a3f8b2...' },
  { timestamp: '2024-09-16T09:30:05Z', action: 'SHA-256 hash computed for each file', actor: 'Integrity Engine', hash: 'sha256:verified' },
  { timestamp: '2024-09-16T09:30:12Z', action: 'OCR extraction completed (5 documents)', actor: 'OCR Pipeline', hash: 'sha256:ocr-batch...' },
  { timestamp: '2024-09-16T09:30:30Z', action: 'Full-text index built', actor: 'Search Engine', hash: 'sha256:index-v1...' },
  { timestamp: '2024-09-16T09:31:00Z', action: 'PII flag raised — doc-002 contains sensitive terms', actor: 'Compliance Scan', hash: 'sha256:flag-b4c5...' },
  { timestamp: '2024-09-16T10:15:00Z', action: 'Review session initiated by counsel', actor: 'J. Adams, Esq.', hash: 'sha256:session-01...' },
  { timestamp: '2024-09-16T11:00:00Z', action: 'Redaction applied to doc-002 (Section 4.2)', actor: 'J. Adams, Esq.', hash: 'sha256:redact-01...' },
  { timestamp: '2024-09-16T11:30:00Z', action: 'Export prepared — 5 documents, 1 redacted', actor: 'Export Engine', hash: 'sha256:export-final...' },
]

type DemoTab = 'ingest' | 'search' | 'custody' | 'redact'

const ICON_FOR_TYPE = {
  pdf: FilePdf,
  docx: FileDoc,
  image: FileImage,
  email: FileText,
}

export default function EvidentDemoPage({ onBack }: EvidentDemoPageProps) {
  usePageMeta({
    title: 'Evident Platform Demo',
    description: 'Interactive demonstration of the Evident e-discovery platform — document ingestion, OCR, search, chain of custody, and redaction.',
    path: '/evident-demo',
  })

  const [activeTab, setActiveTab] = useState<DemoTab>('ingest')
  const [ingested, setIngested] = useState<MockDocument[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<MockDocument | null>(null)
  const [redactedRanges, setRedactedRanges] = useState<Record<string, string[]>>({})
  const [isDragOver, setIsDragOver] = useState(false)
  const processTimer = useRef<ReturnType<typeof setTimeout>>(null)

  const simulateIngestion = useCallback(() => {
    if (isProcessing) return
    setIsProcessing(true)

    // Simulate progressive document processing
    let idx = 0
    const addNext = () => {
      if (idx < DEMO_DOCUMENTS.length) {
        setIngested(prev => [...prev, { ...DEMO_DOCUMENTS[idx], status: 'processing' }])
        const currentIdx = idx
        setTimeout(() => {
          setIngested(prev =>
            prev.map((d, i) => i === currentIdx ? { ...d, status: DEMO_DOCUMENTS[currentIdx].status } : d)
          )
        }, 800)
        idx++
        processTimer.current = setTimeout(addNext, 600)
      } else {
        setIsProcessing(false)
      }
    }
    addNext()
  }, [isProcessing])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    simulateIngestion()
  }, [simulateIngestion])

  const filteredDocs = ingested.filter(doc => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return doc.name.toLowerCase().includes(q) ||
      doc.extractedText.toLowerCase().includes(q) ||
      doc.custodian.toLowerCase().includes(q)
  })

  const toggleRedaction = (docId: string, phrase: string) => {
    setRedactedRanges(prev => {
      const existing = prev[docId] || []
      if (existing.includes(phrase)) {
        return { ...prev, [docId]: existing.filter(p => p !== phrase) }
      }
      return { ...prev, [docId]: [...existing, phrase] }
    })
  }

  const applyRedactions = (text: string, docId: string) => {
    const ranges = redactedRanges[docId] || []
    let result = text
    for (const phrase of ranges) {
      result = result.replaceAll(phrase, '█'.repeat(phrase.length))
    }
    return result
  }

  const tabs: { id: DemoTab; label: string; icon: typeof FileText }[] = [
    { id: 'ingest', label: 'Ingest', icon: Upload },
    { id: 'search', label: 'Search', icon: MagnifyingGlass },
    { id: 'custody', label: 'Chain of Custody', icon: LinkSimple },
    { id: 'redact', label: 'Redaction', icon: EyeSlash },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back bar */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/30">
        <div className="mx-auto max-w-7xl flex items-center gap-4 px-4 py-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="h-4 w-px bg-border/50" />
          <h1 className="text-sm font-semibold">Evident Platform — Interactive Demo</h1>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-xs text-amber-400">
            <Warning size={12} weight="fill" /> Demo Mode — No Real Evidence
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-xs text-emerald-400 mb-4">
            <ShieldCheck size={14} weight="fill" /> E-Discovery Platform Demo
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            See How Evident Processes Evidence
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Walk through the core workflow: ingest documents, extract text via OCR, search across the corpus,
            track chain of custody, and apply redactions — all with cryptographic integrity at every step.
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/30 mb-8 max-w-2xl mx-auto" role="tablist">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={16} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Ingest Tab ── */}
          {activeTab === 'ingest' && (
            <motion.div
              key="ingest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Drop zone */}
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/5'
                    : 'border-border/50 hover:border-primary/40 hover:bg-muted/20'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={simulateIngestion}
                role="button"
                aria-label="Drop documents or click to simulate ingestion"
              >
                <Upload size={48} className="mx-auto mb-4 text-muted-foreground" weight="duotone" />
                <p className="text-lg font-medium mb-1">Drag & Drop Documents</p>
                <p className="text-sm text-muted-foreground mb-4">
                  or click to simulate ingestion of 5 demo documents
                </p>
                {isProcessing && (
                  <div className="inline-flex items-center gap-2 text-sm text-emerald-400">
                    <CircleNotch size={16} className="animate-spin" /> Processing...
                  </div>
                )}
              </div>

              {/* Ingested documents list */}
              {ingested.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Ingested Documents ({ingested.length})
                  </h3>
                  {ingested.map((doc, i) => {
                    const TypeIcon = ICON_FOR_TYPE[doc.type]
                    return (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <GlassCard intensity="medium" className="p-4">
                          <div className="flex items-center gap-4">
                            <TypeIcon size={24} weight="duotone" className="text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.size} · {doc.custodian}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="text-[10px] text-muted-foreground font-mono hidden md:block">
                                {doc.hash.slice(0, 24)}…
                              </code>
                              {doc.status === 'processing' ? (
                                <CircleNotch size={18} className="animate-spin text-amber-400" />
                              ) : doc.status === 'flagged' ? (
                                <Warning size={18} className="text-amber-400" weight="fill" />
                              ) : (
                                <CheckCircle size={18} className="text-emerald-400" weight="fill" />
                              )}
                            </div>
                          </div>
                        </GlassCard>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Search Tab ── */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {ingested.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <MagnifyingGlass size={48} className="mx-auto mb-4 opacity-40" />
                  <p>Ingest documents first to enable search.</p>
                  <button onClick={() => setActiveTab('ingest')} className="mt-4 text-sm text-primary hover:underline">
                    Go to Ingest →
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative max-w-2xl mx-auto mb-8">
                    <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search extracted text, filenames, custodians..."
                      className="w-full rounded-xl border border-border/50 bg-background/50 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      aria-label="Search documents"
                    />
                    {searchQuery && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {filteredDocs.length} result{filteredDocs.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {filteredDocs.map(doc => {
                      const TypeIcon = ICON_FOR_TYPE[doc.type]
                      return (
                        <GlassCard key={doc.id} intensity="medium" className="p-5 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedDoc(doc)}>
                          <div className="flex items-start gap-4">
                            <TypeIcon size={20} weight="duotone" className="text-primary shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{doc.name}</p>
                                {doc.status === 'flagged' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-400">
                                    <Warning size={10} weight="fill" /> PII Flagged
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{doc.extractedText}</p>
                              <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground/60">
                                <span>{doc.custodian}</span>
                                <span>{doc.size}</span>
                                <code className="font-mono">{doc.hash.slice(0, 20)}…</code>
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      )
                    })}
                  </div>

                  {/* Document detail modal */}
                  {selectedDoc && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedDoc(null)}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl rounded-2xl border border-border/50 bg-background p-6 shadow-2xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">{selectedDoc.name}</h3>
                          <button onClick={() => setSelectedDoc(null)} className="text-muted-foreground hover:text-foreground text-sm">Close</button>
                        </div>
                        <div className="space-y-4 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Custodian</p>
                              <p>{selectedDoc.custodian}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Size</p>
                              <p>{selectedDoc.size}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-1">SHA-256 Hash</p>
                            <code className="text-xs font-mono break-all">{selectedDoc.hash}</code>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs mb-2">Extracted Text</p>
                            <div className="rounded-lg bg-muted/30 border border-border/30 p-4 text-xs leading-relaxed font-mono whitespace-pre-wrap">
                              {applyRedactions(selectedDoc.extractedText, selectedDoc.id)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ── Chain of Custody Tab ── */}
          {activeTab === 'custody' && (
            <motion.div
              key="custody"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <div className="flex items-center gap-2 mb-6">
                <ClockCounterClockwise size={20} className="text-primary" weight="duotone" />
                <h3 className="text-lg font-semibold">Audit Trail</h3>
                <span className="text-xs text-muted-foreground ml-auto">Append-only · Immutable</span>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border/40" />

                <div className="space-y-1">
                  {CUSTODY_EVENTS.map((event, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="relative flex items-start gap-4 py-3"
                    >
                      <div className="relative z-10 mt-1 h-[12px] w-[12px] rounded-full bg-primary/80 ring-4 ring-background shrink-0 ml-[17px]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{event.action}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{event.actor}</span>
                          <span>·</span>
                          <time>{new Date(event.timestamp).toLocaleString()}</time>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Hash size={10} className="text-muted-foreground/40" />
                          <code className="text-[10px] text-muted-foreground/50 font-mono">{event.hash}</code>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Redaction Tab ── */}
          {activeTab === 'redact' && (
            <motion.div
              key="redact"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {ingested.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <EyeSlash size={48} className="mx-auto mb-4 opacity-40" />
                  <p>Ingest documents first to use redaction tools.</p>
                  <button onClick={() => setActiveTab('ingest')} className="mt-4 text-sm text-primary hover:underline">
                    Go to Ingest →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Document list */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                      Select Document
                    </h3>
                    {ingested.map(doc => {
                      const isSelected = selectedDoc?.id === doc.id
                      const redactCount = (redactedRanges[doc.id] || []).length
                      return (
                        <button
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className={`w-full text-left rounded-xl border p-4 transition-all ${
                            isSelected
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-border/30 hover:border-primary/30'
                          }`}
                        >
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{doc.custodian}</span>
                            {redactCount > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2 py-0.5 text-[10px] text-red-400">
                                <EyeSlash size={10} /> {redactCount} redaction{redactCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Redaction preview */}
                  <div>
                    {selectedDoc ? (
                      <GlassCard intensity="high" className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold">{selectedDoc.name}</h4>
                          <div className="flex items-center gap-2">
                            <Eye size={14} className="text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Preview</span>
                          </div>
                        </div>

                        {/* Redacted text preview */}
                        <div className="rounded-lg bg-muted/30 border border-border/30 p-4 text-xs leading-relaxed font-mono whitespace-pre-wrap mb-4">
                          {applyRedactions(selectedDoc.extractedText, selectedDoc.id)}
                        </div>

                        {/* Quick redaction buttons for sensitive phrases */}
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">Click to toggle redaction:</p>
                          <div className="flex flex-wrap gap-2">
                            {getSensitivePhrases(selectedDoc).map(phrase => {
                              const isRedacted = (redactedRanges[selectedDoc.id] || []).includes(phrase)
                              return (
                                <button
                                  key={phrase}
                                  onClick={() => toggleRedaction(selectedDoc.id, phrase)}
                                  className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-all ${
                                    isRedacted
                                      ? 'bg-red-500/20 border border-red-500/40 text-red-300 line-through'
                                      : 'bg-muted/50 border border-border/50 hover:border-red-500/40 hover:bg-red-500/10'
                                  }`}
                                >
                                  {phrase}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </GlassCard>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                        Select a document to apply redactions
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Platform notice */}
        <div className="mt-16 text-center text-xs text-muted-foreground/50 max-w-xl mx-auto">
          <p>
            This is an interactive demonstration. No real evidence, documents, or personal data is processed.
            All data shown is synthetic and generated for illustrative purposes only.
          </p>
        </div>
      </div>
    </div>
  )
}

/** Extract "interesting" phrases from a document's text for redaction demo */
function getSensitivePhrases(doc: MockDocument): string[] {
  const text = doc.extractedText
  const phrases: string[] = []

  // Extract email addresses
  const emailMatches = text.match(/[\w.-]+@[\w.-]+\.\w+/g)
  if (emailMatches) phrases.push(...emailMatches)

  // Extract names (simple heuristic: capitalized words after "From:", "To:", custodian names)
  const nameMatches = text.match(/[A-Z]\. [A-Z][a-z]+/g)
  if (nameMatches) phrases.push(...new Set(nameMatches))

  // Extract dates
  const dateMatches = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/g)
  if (dateMatches) phrases.push(...dateMatches)

  // Extract identifiers (permit numbers, form numbers)
  const idMatches = text.match(/#[\w-]+/g)
  if (idMatches) phrases.push(...idMatches)

  // AES-256, PII, specific legal terms
  if (text.includes('AES-256')) phrases.push('AES-256')
  if (text.includes('Form 10-K')) phrases.push('Form 10-K')

  return [...new Set(phrases)].slice(0, 8)
}
