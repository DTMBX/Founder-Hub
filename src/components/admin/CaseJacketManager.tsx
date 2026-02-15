import { useState, useCallback, useMemo, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuth, logAudit } from '@/lib/auth'
import { OCRPipeline, type OCRExtractionResult } from '@/lib/ocr-pipeline'
import {
  resolveTemplate,
  previewBatchRename,
  applyBatchRename,
  DEFAULT_NAMING_RULES,
  AVAILABLE_TOKENS,
  type NamingContext,
} from '@/lib/naming-engine'
import type {
  PDFAsset,
  Case,
  FilingType,
  NamingRule,
  PDFMetadata,
  OCRStatus,
} from '@/lib/types'
import {
  Folder, FilePdf, CloudArrowUp, MagnifyingGlass, TextAa, ArrowsClockwise,
  Eye, Trash, Pencil, Check, X, CaretDown, CaretRight, FileArrowUp,
  ScanSmiley, Tag, ArrowRight, CheckCircle, Warning, Info,
  Lightning, ArrowsDownUp, Funnel, ListBullets, GridFour,
} from '@phosphor-icons/react'

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

interface UploadItem {
  id: string
  file: File
  status: 'pending' | 'hashing' | 'ocr' | 'ready' | 'failed'
  progress: number
  checksum?: string
  ocrResult?: OCRExtractionResult
  suggestedTitle?: string
  suggestedType?: string
  suggestedDate?: string
  filingTypeId?: string
  error?: string
}

type SortField = 'title' | 'filingDate' | 'type' | 'createdAt'
type SortDir = 'asc' | 'desc'

// ────────────────────────────────────────────
// Component
// ────────────────────────────────────────────

export default function CaseJacketManager() {
  const { currentUser } = useAuth()

  // KV stores
  const [cases] = useKV<Case[]>('founder-hub-cases', [])
  const [pdfs, setPdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [filingTypes] = useKV<FilingType[]>('founder-hub-filing-types', [])
  const [namingRules, setNamingRules] = useKV<NamingRule[]>('founder-hub-naming-rules', DEFAULT_NAMING_RULES)

  // State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('documents')
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set())
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<PDFAsset>>({})
  const [sortField, setSortField] = useState<SortField>('filingDate')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [renameRule, setRenameRule] = useState<NamingRule>(namingRules[0] ?? DEFAULT_NAMING_RULES[0])
  const [renamePreview, setRenamePreview] = useState<Array<{ docId: string; currentName: string; newName: string }>>([])
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [customTemplate, setCustomTemplate] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const selectedCase = useMemo(() => cases.find(c => c.id === selectedCaseId), [cases, selectedCaseId])

  // Documents for selected case
  const caseDocs = useMemo(() => {
    if (!selectedCaseId) return []
    return pdfs.filter(p => p.caseId === selectedCaseId)
  }, [pdfs, selectedCaseId])

  // Filtered + sorted docs
  const displayDocs = useMemo(() => {
    let docs = [...caseDocs]

    // Filter by type
    if (filterType !== 'all') {
      docs = docs.filter(d => d.filingTypeId === filterType)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      docs = docs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.metadata?.originalFilename?.toLowerCase().includes(q)
      )
    }

    // Sort
    docs.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'title': cmp = a.title.localeCompare(b.title); break
        case 'filingDate': cmp = (a.filingDate ?? '').localeCompare(b.filingDate ?? ''); break
        case 'type': cmp = (a.filingTypeId ?? '').localeCompare(b.filingTypeId ?? ''); break
        case 'createdAt': cmp = a.createdAt - b.createdAt; break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return docs
  }, [caseDocs, filterType, searchQuery, sortField, sortDir])

  // Stats
  const stats = useMemo(() => {
    const total = caseDocs.length
    const ocrDone = caseDocs.filter(d => d.ocrStatus === 'completed').length
    const ocrPending = caseDocs.filter(d => d.ocrStatus === 'none' || d.ocrStatus === 'pending').length
    const staged = caseDocs.filter(d => d.stage === 'staging').length
    const published = caseDocs.filter(d => d.stage === 'published').length
    const types = new Set(caseDocs.map(d => d.filingTypeId).filter(Boolean))
    return { total, ocrDone, ocrPending, staged, published, typeCount: types.size }
  }, [caseDocs])

  // ── Helpers ──

  async function computeSHA256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  function getFilingTypeName(id?: string) {
    return filingTypes.find(ft => ft.id === id)?.name ?? 'Unassigned'
  }

  function getFilingTypeToken(id?: string) {
    return filingTypes.find(ft => ft.id === id)?.defaultNamingToken ?? '—'
  }

  // ── Upload Logic ──

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f =>
      f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    )
    if (pdfFiles.length === 0) {
      toast.error('No PDF files detected. Please select PDF files only.')
      return
    }

    const newItems: UploadItem[] = pdfFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      status: 'pending' as const,
      progress: 0,
    }))

    setUploadItems(prev => [...prev, ...newItems])
    setActiveTab('upload')
    toast.success(`${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''} added to upload queue`)
  }, [])

  const processUploadQueue = useCallback(async () => {
    setIsUploading(true)
    const toProcess = uploadItems.filter(i => i.status === 'pending')

    for (const item of toProcess) {
      try {
        // Phase 1: Hash
        setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'hashing', progress: 20 } : i))
        const checksum = await computeSHA256(item.file)

        // Phase 2: OCR
        setUploadItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'ocr', progress: 50, checksum } : i))
        const ocrResult = await OCRPipeline.processDocument(item.file, {
          extractFields: true,
          detectStamps: true,
        })

        // Determine suggested values
        const suggestedTitle = ocrResult.fields.documentType?.value
          ? `${ocrResult.fields.documentType.value}${ocrResult.fields.filingDate?.value ? ` — ${ocrResult.fields.filingDate.value}` : ''}`
          : item.file.name.replace(/\.pdf$/i, '')
        const suggestedType = ocrResult.fields.documentType?.value ?? ''
        const suggestedDate = ocrResult.fields.filingDate?.value ?? ''

        // Auto-match filing type
        let filingTypeId: string | undefined
        if (suggestedType) {
          const lower = suggestedType.toLowerCase()
          const match = filingTypes.find(ft =>
            ft.name.toLowerCase().includes(lower) ||
            lower.includes(ft.name.toLowerCase()) ||
            ft.defaultNamingToken.toLowerCase() === lower.slice(0, 4)
          )
          if (match) filingTypeId = match.id
        }

        setUploadItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: 'ready',
          progress: 100,
          checksum,
          ocrResult,
          suggestedTitle,
          suggestedType,
          suggestedDate,
          filingTypeId,
        } : i))
      } catch (err) {
        setUploadItems(prev => prev.map(i => i.id === item.id ? {
          ...i,
          status: 'failed',
          progress: 0,
          error: err instanceof Error ? err.message : 'Processing failed',
        } : i))
      }
    }

    setIsUploading(false)
    toast.success('Upload processing complete')
  }, [uploadItems, filingTypes])

  const commitUploads = useCallback(async () => {
    const readyItems = uploadItems.filter(i => i.status === 'ready')
    if (readyItems.length === 0 || !selectedCaseId) return

    const existingCount = caseDocs.length
    const newDocs: PDFAsset[] = readyItems.map((item, idx) => ({
      id: crypto.randomUUID(),
      fileUrl: URL.createObjectURL(item.file),
      title: item.suggestedTitle ?? item.file.name.replace(/\.pdf$/i, ''),
      description: '',
      caseId: selectedCaseId,
      filingTypeId: item.filingTypeId,
      filingDate: item.suggestedDate ?? undefined,
      filingDateConfirmed: false,
      tags: [],
      visibility: 'private' as const,
      stage: 'staging' as const,
      featured: false,
      fileSize: item.file.size,
      pageCount: item.ocrResult?.metadata.pageCount,
      ocrStatus: (item.ocrResult ? 'completed' : 'none') as OCRStatus,
      extractedFields: item.ocrResult?.fields ? {
        docket: item.ocrResult.fields.docket ? {
          value: item.ocrResult.fields.docket.value,
          confidence: item.ocrResult.fields.docket.confidence,
          source: item.ocrResult.fields.docket.source,
          reasoning: item.ocrResult.fields.docket.reasoning,
        } : undefined,
        filingDate: item.ocrResult.fields.filingDate ? {
          value: item.ocrResult.fields.filingDate.value,
          confidence: item.ocrResult.fields.filingDate.confidence,
          source: item.ocrResult.fields.filingDate.source,
          reasoning: item.ocrResult.fields.filingDate.reasoning,
        } : undefined,
        courtName: item.ocrResult.fields.courtName ? {
          value: item.ocrResult.fields.courtName.value,
          confidence: item.ocrResult.fields.courtName.confidence,
          source: item.ocrResult.fields.courtName.source,
          reasoning: item.ocrResult.fields.courtName.reasoning,
        } : undefined,
        documentType: item.ocrResult.fields.documentType ? {
          value: item.ocrResult.fields.documentType.value,
          confidence: item.ocrResult.fields.documentType.confidence,
          source: item.ocrResult.fields.documentType.source,
          reasoning: item.ocrResult.fields.documentType.reasoning,
        } : undefined,
        parties: item.ocrResult.fields.parties ? {
          value: item.ocrResult.fields.parties.value,
          confidence: item.ocrResult.fields.parties.confidence,
          source: item.ocrResult.fields.parties.source,
          reasoning: item.ocrResult.fields.parties.reasoning,
        } : undefined,
        caseNumber: item.ocrResult.fields.caseNumber ? {
          value: item.ocrResult.fields.caseNumber.value,
          confidence: item.ocrResult.fields.caseNumber.confidence,
          source: item.ocrResult.fields.caseNumber.source,
          reasoning: item.ocrResult.fields.caseNumber.reasoning,
        } : undefined,
      } : undefined,
      metadata: {
        originalFilename: item.file.name,
        displayFilename: item.suggestedTitle ? `${item.suggestedTitle}.pdf` : item.file.name,
        checksum: item.checksum ?? '',
        extractedText: item.ocrResult?.extractedText,
        extractionConfidence: item.ocrResult?.extractionConfidence,
        courtStampPresent: item.ocrResult?.courtStampDetection.present,
        courtStampRegion: item.ocrResult?.courtStampDetection.region,
        suggestedDocType: item.suggestedType,
        suggestedFilingDate: item.suggestedDate,
      },
      orderInCase: existingCount + idx + 1,
      analysisStatus: 'none',
      notesVisibility: 'private',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      uploadedBy: currentUser?.email,
    }))

    setPdfs([...pdfs, ...newDocs])
    setUploadItems(prev => prev.filter(i => i.status !== 'ready'))

    await logAudit(
      currentUser?.id ?? 'system',
      currentUser?.email ?? 'system',
      'batch_upload_pdf',
      `Batch uploaded ${newDocs.length} documents to case ${selectedCase?.docket ?? selectedCaseId}`,
      'pdf',
      selectedCaseId,
    )

    toast.success(`${newDocs.length} document${newDocs.length > 1 ? 's' : ''} added to case jacket`)
  }, [uploadItems, selectedCaseId, caseDocs, pdfs, setPdfs, currentUser, selectedCase])

  // ── OCR Re-run ──

  const runOCROnSelected = useCallback(async () => {
    const ids = Array.from(selectedDocIds)
    const targetDocs = caseDocs.filter(d => ids.includes(d.id))
    if (targetDocs.length === 0) return

    toast.info(`Running OCR on ${targetDocs.length} document(s)…`)

    const updatedPdfs = [...pdfs]
    for (const doc of targetDocs) {
      // Simulate re-processing using filename-based OCR
      const fakeFile = new File([''], doc.metadata.originalFilename, { type: 'application/pdf' })
      try {
        const result = await OCRPipeline.processDocument(fakeFile, {
          extractFields: true,
          detectStamps: true,
        })

        const idx = updatedPdfs.findIndex(p => p.id === doc.id)
        if (idx >= 0) {
          updatedPdfs[idx] = {
            ...updatedPdfs[idx],
            ocrStatus: 'completed',
            extractedFields: {
              docket: result.fields.docket ? { value: result.fields.docket.value, confidence: result.fields.docket.confidence, source: result.fields.docket.source, reasoning: result.fields.docket.reasoning } : undefined,
              filingDate: result.fields.filingDate ? { value: result.fields.filingDate.value, confidence: result.fields.filingDate.confidence, source: result.fields.filingDate.source, reasoning: result.fields.filingDate.reasoning } : undefined,
              courtName: result.fields.courtName ? { value: result.fields.courtName.value, confidence: result.fields.courtName.confidence, source: result.fields.courtName.source, reasoning: result.fields.courtName.reasoning } : undefined,
              documentType: result.fields.documentType ? { value: result.fields.documentType.value, confidence: result.fields.documentType.confidence, source: result.fields.documentType.source, reasoning: result.fields.documentType.reasoning } : undefined,
              parties: result.fields.parties ? { value: result.fields.parties.value, confidence: result.fields.parties.confidence, source: result.fields.parties.source, reasoning: result.fields.parties.reasoning } : undefined,
              caseNumber: result.fields.caseNumber ? { value: result.fields.caseNumber.value, confidence: result.fields.caseNumber.confidence, source: result.fields.caseNumber.source, reasoning: result.fields.caseNumber.reasoning } : undefined,
            },
            metadata: {
              ...updatedPdfs[idx].metadata,
              extractedText: result.extractedText,
              extractionConfidence: result.extractionConfidence,
              courtStampPresent: result.courtStampDetection.present,
            },
            updatedAt: Date.now(),
          }
        }
      } catch { /* skip failed docs */ }
    }

    setPdfs(updatedPdfs)
    await logAudit(
      currentUser?.id ?? 'system',
      currentUser?.email ?? 'system',
      'run_ocr',
      `Re-ran OCR on ${targetDocs.length} documents`,
      'pdf',
      selectedCaseId ?? undefined,
    )
    setSelectedDocIds(new Set())
    toast.success(`OCR completed on ${targetDocs.length} document(s)`)
  }, [selectedDocIds, caseDocs, pdfs, setPdfs, currentUser, selectedCaseId])

  // ── Rename Logic ──

  const generateRenamePreview = useCallback(() => {
    const targetDocs = selectedDocIds.size > 0
      ? caseDocs.filter(d => selectedDocIds.has(d.id))
      : caseDocs
    if (targetDocs.length === 0) return

    const rule = customTemplate.trim()
      ? { ...renameRule, template: customTemplate.trim() }
      : renameRule

    const preview = previewBatchRename(targetDocs, cases, filingTypes, rule)
    setRenamePreview(preview)
    setShowRenameDialog(true)
  }, [selectedDocIds, caseDocs, cases, filingTypes, renameRule, customTemplate])

  const executeRename = useCallback(() => {
    const rule = customTemplate.trim()
      ? { ...renameRule, template: customTemplate.trim() }
      : renameRule

    const targetDocs = selectedDocIds.size > 0
      ? caseDocs.filter(d => selectedDocIds.has(d.id))
      : caseDocs

    const renamed = applyBatchRename(targetDocs, cases, filingTypes, rule)
    const renamedMap = new Map(renamed.map(d => [d.id, d]))

    setPdfs(pdfs.map(p => renamedMap.get(p.id) ?? p))

    logAudit(
      currentUser?.id ?? 'system',
      currentUser?.email ?? 'system',
      'apply_naming_rules',
      `Applied naming rule "${rule.name}" to ${renamed.length} documents`,
      'pdf',
      selectedCaseId ?? undefined,
    )

    setShowRenameDialog(false)
    setSelectedDocIds(new Set())
    toast.success(`Renamed ${renamed.length} document(s)`)
  }, [selectedDocIds, caseDocs, cases, filingTypes, renameRule, customTemplate, pdfs, setPdfs, currentUser, selectedCaseId])

  // ── Document Editing ──

  const startEdit = (doc: PDFAsset) => {
    setEditingDocId(doc.id)
    setEditForm({
      title: doc.title,
      description: doc.description,
      filingTypeId: doc.filingTypeId,
      filingDate: doc.filingDate,
      tags: doc.tags,
      visibility: doc.visibility,
      stage: doc.stage,
    })
  }

  const saveEdit = () => {
    if (!editingDocId) return
    setPdfs(pdfs.map(p => p.id === editingDocId ? { ...p, ...editForm, updatedAt: Date.now() } : p))
    setEditingDocId(null)
    toast.success('Document updated')
  }

  const deleteSelected = () => {
    const count = selectedDocIds.size
    if (count === 0) return
    setPdfs(pdfs.filter(p => !selectedDocIds.has(p.id)))
    setSelectedDocIds(new Set())
    toast.success(`Deleted ${count} document(s)`)
  }

  const bulkSetType = (filingTypeId: string) => {
    setPdfs(pdfs.map(p => selectedDocIds.has(p.id) ? { ...p, filingTypeId, updatedAt: Date.now() } : p))
    setSelectedDocIds(new Set())
    toast.success(`Filing type updated on ${selectedDocIds.size} document(s)`)
  }

  const bulkSetStage = (stage: 'staging' | 'published' | 'archived') => {
    setPdfs(pdfs.map(p => selectedDocIds.has(p.id) ? { ...p, stage, updatedAt: Date.now() } : p))
    setSelectedDocIds(new Set())
    toast.success(`Stage set to "${stage}" on ${selectedDocIds.size} document(s)`)
  }

  const toggleSelectAll = () => {
    if (selectedDocIds.size === displayDocs.length) {
      setSelectedDocIds(new Set())
    } else {
      setSelectedDocIds(new Set(displayDocs.map(d => d.id)))
    }
  }

  // ── Drag / Drop ──

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // ── Confidence Badge ──

  function ConfidenceBadge({ confidence }: { confidence: number }) {
    const level = confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low'
    const colors = {
      high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      low: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return (
      <Badge variant="outline" className={cn('text-[10px] border', colors[level])}>
        {Math.round(confidence * 100)}%
      </Badge>
    )
  }

  // ────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────

  // No case selected — show case picker
  if (!selectedCaseId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Case Jacket Manager</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select a case to manage its document jacket — upload, OCR, rename, and organize.
          </p>
        </div>

        {cases.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Folder className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" weight="duotone" />
              <p className="text-sm text-muted-foreground">No cases found. Create a case in Court Cases first.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map(c => {
              const docCount = pdfs.filter(p => p.caseId === c.id).length
              const ocrPending = pdfs.filter(p => p.caseId === c.id && (p.ocrStatus === 'none' || p.ocrStatus === 'pending')).length
              return (
                <Card
                  key={c.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors group"
                  onClick={() => setSelectedCaseId(c.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
                        {c.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{c.docket}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FilePdf className="h-3.5 w-3.5" /> {docCount} docs
                      </span>
                      {ocrPending > 0 && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <ScanSmiley className="h-3.5 w-3.5" /> {ocrPending} pending OCR
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{c.summary}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Case Selected — Main UI ──

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => { setSelectedCaseId(null); setActiveTab('documents'); setUploadItems([]) }}
          >
            <CaretRight className="h-4 w-4 rotate-180" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-base font-bold truncate">{selectedCase?.title}</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{selectedCase?.docket}</span>
              <span>·</span>
              <span>{selectedCase?.court}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{stats.total} docs</Badge>
          <Badge variant="outline" className="text-xs bg-primary/10 text-primary">{stats.published} published</Badge>
          {stats.ocrPending > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400">{stats.ocrPending} need OCR</Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="documents" className="text-xs gap-1.5">
            <ListBullets className="h-3.5 w-3.5" /> Documents
          </TabsTrigger>
          <TabsTrigger value="upload" className="text-xs gap-1.5">
            <CloudArrowUp className="h-3.5 w-3.5" /> Upload
            {uploadItems.length > 0 && (
              <Badge className="ml-1 h-4 w-4 p-0 text-[9px] justify-center">{uploadItems.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ocr" className="text-xs gap-1.5">
            <ScanSmiley className="h-3.5 w-3.5" /> OCR
          </TabsTrigger>
          <TabsTrigger value="rename" className="text-xs gap-1.5">
            <TextAa className="h-3.5 w-3.5" /> Rename
          </TabsTrigger>
        </TabsList>

        {/* ═══════  DOCUMENTS TAB  ═══════ */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Search documents…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 text-xs w-48"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 text-xs w-40">
                <Funnel className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filingTypes.map(ft => (
                  <SelectItem key={ft.id} value={ft.id}>{ft.icon} {ft.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortField} onValueChange={v => setSortField(v as SortField)}>
              <SelectTrigger className="h-8 text-xs w-36">
                <ArrowsDownUp className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filingDate">Filing Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="createdAt">Uploaded</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
              <ArrowsDownUp className={cn('h-3.5 w-3.5', sortDir === 'desc' && 'rotate-180')} />
            </Button>

            <div className="ml-auto flex items-center gap-2">
              {selectedDocIds.size > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">{selectedDocIds.size} selected</span>
                  <Select onValueChange={bulkSetType}>
                    <SelectTrigger className="h-7 text-[11px] w-32">
                      <Tag className="h-3 w-3 mr-1" />
                      <SelectValue placeholder="Set type" />
                    </SelectTrigger>
                    <SelectContent>
                      {filingTypes.map(ft => (
                        <SelectItem key={ft.id} value={ft.id}>{ft.icon} {ft.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={v => bulkSetStage(v as 'staging' | 'published' | 'archived')}>
                    <SelectTrigger className="h-7 text-[11px] w-28">
                      <SelectValue placeholder="Set stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="sm" className="h-7 text-[11px]" onClick={deleteSelected}>
                    <Trash className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Document List */}
          {displayDocs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <FilePdf className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" weight="duotone" />
                <p className="text-sm text-muted-foreground">No documents in this case jacket yet.</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => setActiveTab('upload')}>
                  <CloudArrowUp className="h-3.5 w-3.5 mr-1.5" /> Upload PDFs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {/* Select all */}
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
                <Checkbox
                  checked={selectedDocIds.size === displayDocs.length && displayDocs.length > 0}
                  onCheckedChange={toggleSelectAll}
                  className="h-3.5 w-3.5"
                />
                <span className="w-[40%]">Document</span>
                <span className="w-[18%]">Type</span>
                <span className="w-[15%]">Date</span>
                <span className="w-[12%]">OCR</span>
                <span className="w-[15%] text-right">Actions</span>
              </div>
              <Separator />

              <ScrollArea className="max-h-[500px]">
                <div className="space-y-0.5">
                  {displayDocs.map(doc => {
                    const isEditing = editingDocId === doc.id
                    const isSelected = selectedDocIds.has(doc.id)

                    return (
                      <div
                        key={doc.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors',
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted/50',
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={checked => {
                            const next = new Set(selectedDocIds)
                            checked ? next.add(doc.id) : next.delete(doc.id)
                            setSelectedDocIds(next)
                          }}
                          className="h-3.5 w-3.5"
                        />

                        {/* Title */}
                        <div className="w-[40%] min-w-0">
                          {isEditing ? (
                            <Input
                              value={editForm.title ?? ''}
                              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                              className="h-7 text-xs"
                            />
                          ) : (
                            <div>
                              <p className="font-medium truncate">{doc.title}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{doc.metadata?.originalFilename}</p>
                            </div>
                          )}
                        </div>

                        {/* Type */}
                        <div className="w-[18%]">
                          {isEditing ? (
                            <Select
                              value={editForm.filingTypeId ?? ''}
                              onValueChange={v => setEditForm({ ...editForm, filingTypeId: v })}
                            >
                              <SelectTrigger className="h-7 text-[11px]">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {filingTypes.map(ft => (
                                  <SelectItem key={ft.id} value={ft.id}>{ft.icon} {ft.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              {getFilingTypeName(doc.filingTypeId)}
                            </Badge>
                          )}
                        </div>

                        {/* Date */}
                        <div className="w-[15%]">
                          {isEditing ? (
                            <Input
                              type="date"
                              value={editForm.filingDate ?? ''}
                              onChange={e => setEditForm({ ...editForm, filingDate: e.target.value })}
                              className="h-7 text-[11px]"
                            />
                          ) : (
                            <span className="text-muted-foreground">{doc.filingDate ?? '—'}</span>
                          )}
                        </div>

                        {/* OCR Status */}
                        <div className="w-[12%]">
                          {doc.ocrStatus === 'completed' ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> Done
                            </Badge>
                          ) : doc.ocrStatus === 'failed' ? (
                            <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400">Failed</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">None</Badge>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="w-[15%] flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveEdit}>
                                <Check className="h-3 w-3 text-emerald-400" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingDocId(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(doc)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  setPdfs(pdfs.filter(p => p.id !== doc.id))
                                  toast.success('Document removed')
                                }}
                              >
                                <Trash className="h-3 w-3 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </TabsContent>

        {/* ═══════  UPLOAD TAB  ═══════ */}
        <TabsContent value="upload" className="mt-4 space-y-4">
          {/* Drop zone */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
              isDragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border/50 hover:border-primary/30 hover:bg-muted/30',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
            />
            <FileArrowUp className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" weight="duotone" />
            <p className="text-sm font-medium">Drop PDF files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              Files will be hashed, OCR-scanned, and auto-categorized
            </p>
          </div>

          {/* Queue */}
          {uploadItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Upload Queue ({uploadItems.length})</h3>
                <div className="flex items-center gap-2">
                  {uploadItems.some(i => i.status === 'pending') && (
                    <Button
                      size="sm"
                      className="text-xs h-7"
                      onClick={processUploadQueue}
                      disabled={isUploading}
                    >
                      <Lightning className="h-3 w-3 mr-1" />
                      {isUploading ? 'Processing…' : 'Process All'}
                    </Button>
                  )}
                  {uploadItems.some(i => i.status === 'ready') && (
                    <Button
                      size="sm"
                      variant="default"
                      className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                      onClick={commitUploads}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Commit {uploadItems.filter(i => i.status === 'ready').length} to Case
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setUploadItems(prev => prev.filter(i => i.status !== 'ready' && i.status !== 'failed'))}
                  >
                    Clear Done
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {uploadItems.map(item => (
                  <Card key={item.id} className={cn(
                    'transition-colors',
                    item.status === 'ready' && 'border-emerald-500/30',
                    item.status === 'failed' && 'border-red-500/30',
                  )}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <FilePdf className="h-5 w-5 text-primary/70 shrink-0 mt-0.5" weight="duotone" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium truncate">{item.file.name}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground">
                                {(item.file.size / 1024).toFixed(0)} KB
                              </span>
                              {item.status === 'ready' && (
                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400">
                                  Ready
                                </Badge>
                              )}
                              {item.status === 'pending' && (
                                <Badge variant="outline" className="text-[10px]">Pending</Badge>
                              )}
                              {(item.status === 'hashing' || item.status === 'ocr') && (
                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary animate-pulse">
                                  {item.status === 'hashing' ? 'Hashing…' : 'OCR…'}
                                </Badge>
                              )}
                              {item.status === 'failed' && (
                                <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400">
                                  Failed
                                </Badge>
                              )}
                            </div>
                          </div>

                          {(item.status === 'hashing' || item.status === 'ocr') && (
                            <Progress value={item.progress} className="h-1 mt-2" />
                          )}

                          {/* OCR Results */}
                          {item.ocrResult && item.status === 'ready' && (
                            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                              {item.ocrResult.fields.documentType && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Type:</span>
                                  <span className="font-medium">{item.ocrResult.fields.documentType.value}</span>
                                  <ConfidenceBadge confidence={item.ocrResult.fields.documentType.confidence} />
                                </div>
                              )}
                              {item.ocrResult.fields.docket && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Docket:</span>
                                  <span className="font-mono font-medium">{item.ocrResult.fields.docket.value}</span>
                                  <ConfidenceBadge confidence={item.ocrResult.fields.docket.confidence} />
                                </div>
                              )}
                              {item.ocrResult.fields.filingDate && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Filed:</span>
                                  <span className="font-medium">{item.ocrResult.fields.filingDate.value}</span>
                                  <ConfidenceBadge confidence={item.ocrResult.fields.filingDate.confidence} />
                                </div>
                              )}
                              {item.ocrResult.fields.courtName && (
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Court:</span>
                                  <span className="font-medium">{item.ocrResult.fields.courtName.value}</span>
                                </div>
                              )}
                              {item.ocrResult.courtStampDetection.present && (
                                <div className="flex items-center gap-1 text-emerald-400">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Court stamp detected</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Filing type assignment */}
                          {item.status === 'ready' && (
                            <div className="mt-2 flex items-center gap-2">
                              <Label className="text-[10px] text-muted-foreground shrink-0">Filing Type:</Label>
                              <Select
                                value={item.filingTypeId ?? ''}
                                onValueChange={v => {
                                  setUploadItems(prev => prev.map(i =>
                                    i.id === item.id ? { ...i, filingTypeId: v } : i
                                  ))
                                }}
                              >
                                <SelectTrigger className="h-6 text-[11px] w-44">
                                  <SelectValue placeholder="Assign type…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {filingTypes.map(ft => (
                                    <SelectItem key={ft.id} value={ft.id}>{ft.icon} {ft.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {item.error && (
                            <p className="text-[10px] text-red-400 mt-1">{item.error}</p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => setUploadItems(prev => prev.filter(i => i.id !== item.id))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══════  OCR TAB  ═══════ */}
        <TabsContent value="ocr" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">OCR & Field Extraction</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Run OCR on documents to extract docket numbers, filing dates, court names, and document types.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="text-xs h-7"
                disabled={selectedDocIds.size === 0}
                onClick={runOCROnSelected}
              >
                <ScanSmiley className="h-3 w-3 mr-1" />
                Run OCR ({selectedDocIds.size > 0 ? selectedDocIds.size : 0})
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setSelectedDocIds(new Set(caseDocs.filter(d => d.ocrStatus !== 'completed').map(d => d.id)))
                }}
              >
                Select Pending
              </Button>
            </div>
          </div>

          {/* OCR document list */}
          {caseDocs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No documents to process.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {caseDocs.map(doc => (
                <Card key={doc.id} className={cn(
                  'transition-colors',
                  selectedDocIds.has(doc.id) && 'border-primary/30 bg-primary/5',
                )}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedDocIds.has(doc.id)}
                        onCheckedChange={checked => {
                          const next = new Set(selectedDocIds)
                          checked ? next.add(doc.id) : next.delete(doc.id)
                          setSelectedDocIds(next)
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium truncate">{doc.title}</p>
                          {doc.ocrStatus === 'completed' ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">
                              <CheckCircle className="h-2.5 w-2.5 mr-0.5" /> OCR Done
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] shrink-0">No OCR</Badge>
                          )}
                        </div>

                        {/* Extracted fields */}
                        {doc.extractedFields && doc.ocrStatus === 'completed' && (
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
                            {doc.extractedFields.docket && (
                              <div>
                                <span className="text-muted-foreground">Docket: </span>
                                <span className="font-mono font-medium">{doc.extractedFields.docket.value}</span>
                                <ConfidenceBadge confidence={doc.extractedFields.docket.confidence} />
                              </div>
                            )}
                            {doc.extractedFields.filingDate && (
                              <div>
                                <span className="text-muted-foreground">Filed: </span>
                                <span className="font-medium">{doc.extractedFields.filingDate.value}</span>
                                <ConfidenceBadge confidence={doc.extractedFields.filingDate.confidence} />
                              </div>
                            )}
                            {doc.extractedFields.documentType && (
                              <div>
                                <span className="text-muted-foreground">Type: </span>
                                <span className="font-medium">{doc.extractedFields.documentType.value}</span>
                                <ConfidenceBadge confidence={doc.extractedFields.documentType.confidence} />
                              </div>
                            )}
                            {doc.extractedFields.courtName && (
                              <div>
                                <span className="text-muted-foreground">Court: </span>
                                <span className="font-medium">{doc.extractedFields.courtName.value}</span>
                              </div>
                            )}
                            {doc.extractedFields.parties && (
                              <div>
                                <span className="text-muted-foreground">Parties: </span>
                                <span className="font-medium">{doc.extractedFields.parties.value}</span>
                              </div>
                            )}
                            {doc.extractedFields.caseNumber && (
                              <div>
                                <span className="text-muted-foreground">Case #: </span>
                                <span className="font-mono font-medium">{doc.extractedFields.caseNumber.value}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {doc.metadata?.courtStampPresent && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
                            <CheckCircle className="h-2.5 w-2.5" /> Court stamp detected
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══════  RENAME TAB  ═══════ */}
        <TabsContent value="rename" className="mt-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Batch Rename & Organize</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Apply naming templates to standardize document filenames across the case jacket.
            </p>
          </div>

          {/* Rule selector */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs font-medium">Naming Rule</Label>
                  <Select
                    value={renameRule.id}
                    onValueChange={v => {
                      const rule = namingRules.find(r => r.id === v) ?? DEFAULT_NAMING_RULES.find(r => r.id === v)
                      if (rule) {
                        setRenameRule(rule)
                        setCustomTemplate(rule.template)
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(namingRules.length > 0 ? namingRules : DEFAULT_NAMING_RULES).map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} — <code className="text-[10px]">{r.template}</code>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-medium">Custom Template</Label>
                  <Input
                    value={customTemplate}
                    onChange={e => setCustomTemplate(e.target.value)}
                    placeholder="{DOCKET}_{TYPE}_{DATE}"
                    className="h-8 text-xs font-mono mt-1"
                  />
                </div>
              </div>

              {/* Token reference */}
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_TOKENS.map(t => (
                  <button
                    key={t.token}
                    className="px-2 py-0.5 rounded border border-border/50 text-[10px] font-mono hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    onClick={() => setCustomTemplate(prev => prev + `{${t.token}}`)}
                    title={`${t.label} — e.g. ${t.example}`}
                  >
                    {`{${t.token}}`}
                  </button>
                ))}
              </div>

              {/* Live preview of one sample */}
              {caseDocs.length > 0 && customTemplate && (
                <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
                  <p className="text-muted-foreground font-medium">Preview (first document):</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground line-through">
                      {caseDocs[0].metadata?.originalFilename ?? caseDocs[0].title}
                    </span>
                    <ArrowRight className="h-3 w-3 text-primary" />
                    <span className="font-mono font-medium text-primary">
                      {(() => {
                        const ft = filingTypes.find(f => f.id === caseDocs[0].filingTypeId)
                        const { stem, ext } = resolveTemplate(
                          customTemplate || renameRule.template,
                          { doc: caseDocs[0], caseData: selectedCase, filingType: ft, sequenceNumber: 1 }
                        )
                        return `${stem}.${ext}`
                      })()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={generateRenamePreview}
                  disabled={caseDocs.length === 0}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview Rename ({selectedDocIds.size > 0 ? selectedDocIds.size : caseDocs.length} docs)
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  {selectedDocIds.size > 0
                    ? `${selectedDocIds.size} documents selected — only those will be renamed`
                    : 'All documents in case will be renamed'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current document names for reference */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium">Current Document Names</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {caseDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No documents</p>
                ) : (
                  caseDocs.map((doc, idx) => (
                    <div key={doc.id} className="flex items-center gap-2 text-xs py-1">
                      <span className="text-muted-foreground w-5 text-right shrink-0">{idx + 1}.</span>
                      <Badge variant="outline" className="text-[9px] shrink-0 w-12 justify-center">
                        {getFilingTypeToken(doc.filingTypeId)}
                      </Badge>
                      <span className="truncate font-mono">{doc.metadata?.displayFilename ?? doc.title}</span>
                      <span className="text-muted-foreground ml-auto shrink-0">{doc.filingDate ?? '—'}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════  RENAME PREVIEW DIALOG  ═══════ */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">Batch Rename Preview</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-1.5">
            {renamePreview.map(item => (
              <div key={item.docId} className="flex items-center gap-2 text-xs py-1.5 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground truncate w-[45%] text-right">
                  {item.currentName}
                </span>
                <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                <span className="font-mono font-medium text-primary truncate w-[45%]">
                  {item.newName}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={executeRename}>
              <ArrowsClockwise className="h-3 w-3 mr-1" />
              Apply Rename ({renamePreview.length} docs)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
