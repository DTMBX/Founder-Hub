import { useState, useCallback, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { PDFAsset, Case, UploadQueueItem, PDFMetadata } from '@/lib/types'
import { OCRPipeline, OCRExtractionResult } from '@/lib/ocr-pipeline'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  CloudArrowUp, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Trash,
  Files,
  Sparkle,
  MagnifyingGlass,
  Scales,
  FolderOpen,
  Archive,
  ArrowRight,
  Plus
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface ExtendedUploadQueueItem extends UploadQueueItem {
  ocrResult?: OCRExtractionResult
  suggestedCaseId?: string
  assignedCaseId?: string
}

export default function AdminInbox() {
  const [pdfs, setPdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [cases, setCases] = useKV<Case[]>('founder-hub-cases', [])
  const [queue, setQueue] = useState<ExtendedUploadQueueItem[]>([])
  const [enableOCR, setEnableOCR] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState<string>()
  const [dragOverCaseId, setDragOverCaseId] = useState<string>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const calculateChecksum = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const extractBasicMetadata = async (file: File): Promise<Partial<PDFMetadata>> => {
    return {
      originalFilename: file.name,
      checksum: await calculateChecksum(file),
      fileCreationDate: new Date(file.lastModified).toISOString(),
      fileModDate: new Date(file.lastModified).toISOString(),
    }
  }

  const findMatchingCase = (filename: string, docket?: string): string | undefined => {
    if (!cases || cases.length === 0) return undefined

    const lowerFilename = filename.toLowerCase()
    
    if (docket) {
      const matchedCase = cases.find(c => 
        c.docket.toLowerCase().includes(docket.toLowerCase()) ||
        docket.toLowerCase().includes(c.docket.toLowerCase())
      )
      if (matchedCase) return matchedCase.id
    }

    for (const c of cases) {
      const docketSimple = c.docket.replace(/[^a-z0-9]/gi, '').toLowerCase()
      const filenameSimple = lowerFilename.replace(/[^a-z0-9]/gi, '')
      
      if (filenameSimple.includes(docketSimple) && docketSimple.length > 3) {
        return c.id
      }
    }

    return undefined
  }

  const processFile = async (item: ExtendedUploadQueueItem) => {
    try {
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'uploading', progress: 30 } : q
      ))

      const basicMetadata = await extractBasicMetadata(item.file)
      
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, progress: 50, metadata: basicMetadata } : q
      ))

      await new Promise(resolve => setTimeout(resolve, 300))

      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'processing', progress: 60 } : q
      ))

      let ocrResult: OCRExtractionResult | undefined
      let suggestedTitle = item.file.name.replace('.pdf', '')
      let suggestedDocType: string | undefined
      let suggestedFilingDate: string | undefined
      let suggestedCaseId: string | undefined

      if (enableOCR) {
        ocrResult = await OCRPipeline.processDocument(item.file, {
          extractText: true,
          detectStamp: true,
          extractFields: true,
        })

        if (ocrResult.fields.documentType) {
          suggestedDocType = ocrResult.fields.documentType.value
        }

        if (ocrResult.fields.filingDate) {
          suggestedFilingDate = ocrResult.fields.filingDate.value
        }

        if (ocrResult.fields.docket?.value) {
          suggestedCaseId = findMatchingCase(item.file.name, ocrResult.fields.docket.value)
          
          if (ocrResult.fields.documentType?.value) {
            suggestedTitle = `${ocrResult.fields.docket.value} - ${ocrResult.fields.documentType.value}`
          }
        } else {
          suggestedCaseId = findMatchingCase(item.file.name)
        }
      } else {
        suggestedCaseId = findMatchingCase(item.file.name)
      }

      const fullMetadata: PDFMetadata = {
        ...basicMetadata,
        extractedText: ocrResult?.extractedText,
        extractionConfidence: ocrResult?.extractionConfidence,
        courtStampPresent: ocrResult?.courtStampDetection.present,
        courtStampRegion: ocrResult?.courtStampDetection.region,
        suggestedDocType: ocrResult?.fields.documentType?.value,
        suggestedDocTypeConfidence: ocrResult?.fields.documentType?.confidence,
        suggestedFilingDate: ocrResult?.fields.filingDate?.value,
        suggestedFilingDateConfidence: ocrResult?.fields.filingDate?.confidence,
        suggestedDocket: ocrResult?.fields.docket?.value,
        suggestedDocketConfidence: ocrResult?.fields.docket?.confidence,
      } as PDFMetadata

      const fileUrl = URL.createObjectURL(item.file)

      const stagingData: Partial<PDFAsset> = {
        title: suggestedTitle,
        description: '',
        caseId: suggestedCaseId || selectedCaseId,
        documentType: suggestedDocType,
        filingDate: suggestedFilingDate,
        tags: [],
        visibility: 'private',
        stage: 'staging',
        featured: false,
        fileSize: item.file.size,
        ocrStatus: enableOCR ? 'completed' : 'none',
        metadata: fullMetadata,
        fileUrl,
      }

      setQueue(prev => prev.map(q => 
        q.id === item.id ? { 
          ...q, 
          status: 'completed', 
          progress: 100, 
          metadata: fullMetadata,
          stagingData,
          ocrResult,
          suggestedCaseId,
          assignedCaseId: suggestedCaseId || selectedCaseId
        } : q
      ))

      toast.success(`${item.file.name} processed successfully`)
    } catch (error) {
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { 
          ...q, 
          status: 'failed', 
          validationErrors: [error instanceof Error ? error.message : 'Unknown error'] 
        } : q
      ))
      toast.error(`Failed to process ${item.file.name}`)
    }
  }

  const handleFiles = useCallback(async (files: FileList | File[], targetCaseId?: string) => {
    const newItems: ExtendedUploadQueueItem[] = []

    Array.from(files).forEach(file => {
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file`)
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`)
        return
      }

      const item: ExtendedUploadQueueItem = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: 'pending',
        progress: 0,
        assignedCaseId: targetCaseId
      }

      newItems.push(item)
    })

    setQueue(prev => [...prev, ...newItems])
    
    for (const item of newItems) {
      processFile(item)
    }
  }, [enableOCR, selectedCaseId])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleCaseCardDrop = useCallback((e: React.DragEvent, caseId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCaseId(undefined)
    handleFiles(e.dataTransfer.files, caseId)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleCaseCardDragOver = useCallback((e: React.DragEvent, caseId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCaseId(caseId)
  }, [])

  const handleCaseCardDragLeave = useCallback(() => {
    setDragOverCaseId(undefined)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const handleRemove = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id))
  }

  const handleAssignToCase = (itemId: string, caseId: string) => {
    setQueue(prev => prev.map(q => {
      if (q.id === itemId) {
        return {
          ...q,
          assignedCaseId: caseId,
          stagingData: q.stagingData ? { ...q.stagingData, caseId } : undefined
        }
      }
      return q
    }))
    toast.success('Case assignment updated')
  }

  const handlePublishToCase = async () => {
    const completedItems = queue.filter(q => q.status === 'completed' && q.stagingData)
    
    if (completedItems.length === 0) {
      toast.error('No completed uploads to publish')
      return
    }

    const itemsWithoutCase = completedItems.filter(item => !item.assignedCaseId)
    if (itemsWithoutCase.length > 0) {
      toast.error(`${itemsWithoutCase.length} item(s) need case assignment`)
      return
    }

    const newPDFs: PDFAsset[] = completedItems.map(item => ({
      id: item.id,
      ...item.stagingData!,
      caseId: item.assignedCaseId,
      stage: 'published',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      filingDateConfirmed: false,
      analysisStatus: 'none',
      notesVisibility: 'private'
    } as PDFAsset))

    setPdfs((current) => [...(current || []), ...newPDFs])
    
    const caseGroups = new Map<string, number>()
    completedItems.forEach(item => {
      if (item.assignedCaseId) {
        caseGroups.set(item.assignedCaseId, (caseGroups.get(item.assignedCaseId) || 0) + 1)
      }
    })

    setQueue(prev => prev.filter(q => q.status !== 'completed'))
    
    toast.success(
      `Published ${completedItems.length} document${completedItems.length !== 1 ? 's' : ''} to ${caseGroups.size} case${caseGroups.size !== 1 ? 's' : ''}`
    )
  }

  const handleClearCompleted = () => {
    setQueue(prev => prev.filter(q => q.status !== 'completed'))
  }

  const handleClearAll = () => {
    if (!confirm('Clear all items from inbox?')) return
    setQueue([])
  }

  const completedCount = queue.filter(q => q.status === 'completed').length
  const failedCount = queue.filter(q => q.status === 'failed').length
  const activeCount = queue.filter(q => q.status === 'uploading' || q.status === 'processing').length
  const assignedCount = queue.filter(q => q.status === 'completed' && q.assignedCaseId).length

  const filteredCases = cases?.filter(c => 
    !searchQuery || 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.docket.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.court.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Admin Inbox</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Batch upload and assign documents to cases
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 p-2 rounded-lg border border-border/50">
            <Sparkle size={16} className={enableOCR ? 'text-accent' : 'text-muted-foreground'} weight={enableOCR ? 'fill' : 'regular'} />
            <Switch
              id="ocr-toggle"
              checked={enableOCR}
              onCheckedChange={setEnableOCR}
            />
            <Label htmlFor="ocr-toggle" className="text-sm cursor-pointer">
              Advanced OCR + Auto-Matching
            </Label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <GlassCard
            className={cn(
              'p-8 border-2 border-dashed transition-all duration-200',
              isDragging ? 'border-accent bg-accent/10' : 'border-border'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-center">
              <CloudArrowUp size={48} className="mx-auto mb-3 text-accent" />
              <h3 className="text-lg font-semibold mb-2">Drop PDFs here</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Files will be automatically matched to cases or you can assign manually
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Files size={18} />
                Select Files
              </Button>
            </div>
          </GlassCard>

          {queue.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {queue.length} file{queue.length !== 1 ? 's' : ''}
                  </span>
                  {activeCount > 0 && (
                    <Badge variant="default">{activeCount} processing</Badge>
                  )}
                  {completedCount > 0 && (
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">
                      {assignedCount}/{completedCount} assigned
                    </Badge>
                  )}
                  {failedCount > 0 && (
                    <Badge variant="destructive">{failedCount} failed</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {completedCount > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleClearCompleted}>
                        Clear Completed
                      </Button>
                      <Button 
                        onClick={handlePublishToCase}
                        disabled={assignedCount !== completedCount}
                      >
                        <Archive size={16} />
                        Publish to Cases ({completedCount})
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleClearAll}>
                    <Trash size={16} />
                  </Button>
                </div>
              </div>

              <GlassCard className="p-4">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {queue.map(item => {
                        const assignedCase = item.assignedCaseId 
                          ? cases?.find(c => c.id === item.assignedCaseId)
                          : undefined

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-card/50 rounded-lg border border-border"
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0">
                                {item.status === 'completed' ? (
                                  <CheckCircle size={24} weight="fill" className="text-green-500" />
                                ) : item.status === 'failed' ? (
                                  <XCircle size={24} weight="fill" className="text-destructive" />
                                ) : (
                                  <FileText size={24} className="text-accent" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate text-sm">{item.file.name}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <Badge variant={
                                    item.status === 'completed' ? 'default' :
                                    item.status === 'failed' ? 'destructive' :
                                    'outline'
                                  } className="text-xs">
                                    {item.status}
                                  </Badge>
                                </div>

                                {(item.status === 'uploading' || item.status === 'processing') && (
                                  <div className="space-y-1">
                                    <Progress value={item.progress} className="h-1.5" />
                                    <p className="text-xs text-muted-foreground">
                                      {item.status === 'uploading' ? 'Uploading...' : 'Processing metadata...'}
                                    </p>
                                  </div>
                                )}

                                {item.status === 'completed' && (
                                  <div className="space-y-2">
                                    {assignedCase ? (
                                      <div className="flex items-center gap-2 p-2 bg-accent/10 rounded border border-accent/30">
                                        <Scales size={14} className="text-accent shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-accent truncate">
                                            {assignedCase.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground font-mono">
                                            {assignedCase.docket}
                                          </p>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 shrink-0"
                                          onClick={() => handleAssignToCase(item.id, '')}
                                        >
                                          <XCircle size={14} />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border border-border/50">
                                        <FolderOpen size={14} className="text-muted-foreground" />
                                        <p className="text-xs text-muted-foreground flex-1">
                                          {item.suggestedCaseId ? 'Case auto-match failed' : 'No case assigned'}
                                        </p>
                                      </div>
                                    )}

                                    {item.ocrResult && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        {item.ocrResult.fields.documentType && (
                                          <div className="p-1.5 bg-card/80 rounded border border-border/30">
                                            <p className="text-muted-foreground mb-0.5">Doc Type</p>
                                            <p className="font-medium truncate">{item.ocrResult.fields.documentType.value}</p>
                                          </div>
                                        )}
                                        {item.ocrResult.fields.filingDate && (
                                          <div className="p-1.5 bg-card/80 rounded border border-border/30">
                                            <p className="text-muted-foreground mb-0.5">Filing Date</p>
                                            <p className="font-medium">{item.ocrResult.fields.filingDate.value}</p>
                                          </div>
                                        )}
                                        {item.ocrResult.fields.docket && (
                                          <div className="col-span-2 p-1.5 bg-card/80 rounded border border-border/30">
                                            <p className="text-muted-foreground mb-0.5">Docket</p>
                                            <p className="font-medium font-mono truncate">{item.ocrResult.fields.docket.value}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0 hover:text-destructive"
                                onClick={() => handleRemove(item.id)}
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </GlassCard>
            </>
          )}
        </div>

        <div className="space-y-4">
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Scales size={16} />
              Case Records
            </h3>
            
            <div className="relative mb-3">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <ScrollArea className="h-[660px]">
              <div className="space-y-2 pr-3">
                {filteredCases.length === 0 ? (
                  <div className="text-center py-8">
                    <Scales size={32} className="mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? 'No cases found' : 'No cases created yet'}
                    </p>
                  </div>
                ) : (
                  filteredCases.map(caseItem => {
                    const assignedDocs = queue.filter(q => 
                      q.status === 'completed' && q.assignedCaseId === caseItem.id
                    ).length

                    return (
                      <motion.div
                        key={caseItem.id}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all cursor-pointer',
                          dragOverCaseId === caseItem.id
                            ? 'border-accent bg-accent/10 scale-[1.02]'
                            : 'border-border/50 hover:border-accent/50 hover:bg-card/50'
                        )}
                        onDrop={(e) => handleCaseCardDrop(e, caseItem.id)}
                        onDragOver={(e) => handleCaseCardDragOver(e, caseItem.id)}
                        onDragLeave={handleCaseCardDragLeave}
                        onClick={() => {
                          const unassignedCompleted = queue.find(q => 
                            q.status === 'completed' && !q.assignedCaseId
                          )
                          if (unassignedCompleted) {
                            handleAssignToCase(unassignedCompleted.id, caseItem.id)
                          }
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold truncate">{caseItem.title}</h4>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {caseItem.docket}
                            </p>
                          </div>
                          {assignedDocs > 0 && (
                            <Badge variant="default" className="text-xs shrink-0">
                              +{assignedDocs}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {caseItem.status}
                          </Badge>
                          <span className="truncate">{caseItem.court}</span>
                        </div>

                        {dragOverCaseId === caseItem.id && (
                          <div className="mt-2 pt-2 border-t border-accent/30">
                            <p className="text-xs text-accent font-medium flex items-center gap-1">
                              <ArrowRight size={12} />
                              Drop to assign documents
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
