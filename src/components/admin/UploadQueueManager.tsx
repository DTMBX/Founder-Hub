import { useState, useCallback, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { PDFAsset, UploadQueueItem, PDFMetadata } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  CloudArrowUp, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Pause,
  Play,
  Trash,
  Files,
  Warning,
  Info
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function UploadQueueManager() {
  const [pdfs, setPdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [queue, setQueue] = useState<UploadQueueItem[]>([])
  const [enableOCR, setEnableOCR] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
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

  const simulateOCR = async (item: UploadQueueItem): Promise<Partial<PDFMetadata>> => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const filename = item.file.name.toLowerCase()
    const extractedText = `Extracted text from ${filename}...`
    
    let suggestedDocType: string | undefined = undefined
    let suggestedDocTypeConfidence: number | undefined = undefined
    
    if (filename.includes('complaint')) {
      suggestedDocType = 'Complaint'
      suggestedDocTypeConfidence = 0.85
    } else if (filename.includes('motion')) {
      suggestedDocType = 'Motion'
      suggestedDocTypeConfidence = 0.80
    } else if (filename.includes('order')) {
      suggestedDocType = 'Order'
      suggestedDocTypeConfidence = 0.90
    } else if (filename.includes('certification')) {
      suggestedDocType = 'Certification'
      suggestedDocTypeConfidence = 0.75
    }

    return {
      extractedText,
      extractionConfidence: 0.85,
      suggestedDocType,
      suggestedDocTypeConfidence,
      courtStampPresent: Math.random() > 0.5,
    }
  }

  const processFile = async (item: UploadQueueItem) => {
    try {
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'uploading', progress: 30 } : q
      ))

      const basicMetadata = await extractBasicMetadata(item.file)
      
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, progress: 50, metadata: basicMetadata } : q
      ))

      await new Promise(resolve => setTimeout(resolve, 500))

      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'processing', progress: 60 } : q
      ))

      let ocrMetadata: Partial<PDFMetadata> = {}
      if (enableOCR) {
        ocrMetadata = await simulateOCR(item)
      }

      const fullMetadata: PDFMetadata = {
        ...basicMetadata,
        ...ocrMetadata,
      } as PDFMetadata

      const fileUrl = URL.createObjectURL(item.file)

      const stagingData: Partial<PDFAsset> = {
        title: item.file.name.replace('.pdf', ''),
        description: '',
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
          stagingData 
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

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = []

    Array.from(files).forEach(file => {
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file`)
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 50MB limit`)
        return
      }

      const item: UploadQueueItem = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        status: 'pending',
        progress: 0,
      }

      newItems.push(item)
    })

    setQueue(prev => [...prev, ...newItems])
    
    for (const item of newItems) {
      processFile(item)
    }
  }, [enableOCR])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const handlePauseResume = (id: string) => {
    setQueue(prev => prev.map(q => {
      if (q.id === id) {
        if (q.status === 'paused') {
          processFile(q)
          return { ...q, status: 'uploading' }
        } else if (q.status === 'uploading' || q.status === 'processing') {
          return { ...q, status: 'paused' }
        }
      }
      return q
    }))
  }

  const handleRemove = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id))
  }

  const handleRetry = (id: string) => {
    const item = queue.find(q => q.id === id)
    if (item) {
      setQueue(prev => prev.map(q => 
        q.id === id ? { ...q, status: 'pending', progress: 0, validationErrors: [] } : q
      ))
      processFile(item)
    }
  }

  const handleMoveToStaging = async () => {
    const completedItems = queue.filter(q => q.status === 'completed' && q.stagingData)
    
    if (completedItems.length === 0) {
      toast.error('No completed uploads to move to staging')
      return
    }

    const newPDFs: PDFAsset[] = completedItems.map(item => ({
      id: item.id,
      ...item.stagingData!,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as PDFAsset))

    setPdfs((current) => [...(current || []), ...newPDFs])
    
    setQueue(prev => prev.filter(q => q.status !== 'completed'))
    
    toast.success(`Moved ${completedItems.length} documents to staging`)
  }

  const handleClearCompleted = () => {
    setQueue(prev => prev.filter(q => q.status !== 'completed'))
  }

  const handleClearAll = () => {
    if (!confirm('Clear all items from queue?')) return
    setQueue([])
  }

  const completedCount = queue.filter(q => q.status === 'completed').length
  const failedCount = queue.filter(q => q.status === 'failed').length
  const activeCount = queue.filter(q => q.status === 'uploading' || q.status === 'processing').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Batch Upload Queue</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop multiple PDFs or click to upload
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="ocr-toggle"
              checked={enableOCR}
              onCheckedChange={setEnableOCR}
            />
            <Label htmlFor="ocr-toggle" className="text-sm">
              Enable OCR
            </Label>
          </div>
        </div>
      </div>

      <GlassCard
        className={cn(
          'p-12 border-2 border-dashed transition-all duration-200',
          isDragging ? 'border-accent bg-accent/10' : 'border-border'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <CloudArrowUp size={64} className="mx-auto mb-4 text-accent" />
          <h3 className="text-lg font-semibold mb-2">Drop PDF files here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            or click to browse (max 50MB per file)
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
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                {queue.length} file{queue.length !== 1 ? 's' : ''} in queue
              </span>
              {activeCount > 0 && (
                <Badge variant="default">{activeCount} processing</Badge>
              )}
              {completedCount > 0 && (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/40">
                  {completedCount} completed
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
                  <Button onClick={handleMoveToStaging}>
                    Move to Staging ({completedCount})
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                <Trash size={16} />
                Clear All
              </Button>
            </div>
          </div>

          <GlassCard className="p-6">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {queue.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-card/50 rounded-lg border border-border"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        {item.status === 'completed' ? (
                          <CheckCircle size={24} weight="fill" className="text-green-500" />
                        ) : item.status === 'failed' ? (
                          <XCircle size={24} weight="fill" className="text-destructive" />
                        ) : (
                          <FileText size={24} className="text-accent" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{item.file.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {(item.file.size / 1024 / 1024).toFixed(2)} MB
                              {item.metadata?.checksum && (
                                <span className="ml-2 font-mono">
                                  {item.metadata.checksum.slice(0, 8)}...
                                </span>
                              )}
                            </p>
                          </div>
                          <Badge variant={
                            item.status === 'completed' ? 'default' :
                            item.status === 'failed' ? 'destructive' :
                            item.status === 'paused' ? 'secondary' :
                            'outline'
                          }>
                            {item.status}
                          </Badge>
                        </div>

                        {(item.status === 'uploading' || item.status === 'processing') && (
                          <div className="space-y-1">
                            <Progress value={item.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {item.status === 'uploading' ? 'Uploading...' : 'Processing metadata...'}
                            </p>
                          </div>
                        )}

                        {item.status === 'completed' && item.stagingData && (
                          <div className="mt-2 p-3 bg-accent/5 rounded border border-accent/20">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Pages:</span>
                                <span className="ml-2 font-semibold">{item.stagingData.pageCount || 'Unknown'}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">OCR:</span>
                                <span className="ml-2 font-semibold">{item.stagingData.ocrStatus}</span>
                              </div>
                              {item.metadata?.suggestedDocType && (
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">Suggested Type:</span>
                                  <span className="ml-2 font-semibold">
                                    {item.metadata.suggestedDocType}
                                    <span className="text-muted-foreground ml-1">
                                      ({Math.round((item.metadata.suggestedDocTypeConfidence || 0) * 100)}%)
                                    </span>
                                  </span>
                                </div>
                              )}
                              {item.metadata?.courtStampPresent && (
                                <div className="col-span-2 flex items-center gap-1 text-accent">
                                  <Info size={12} />
                                  <span>Court stamp detected</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {item.validationErrors && item.validationErrors.length > 0 && (
                          <div className="mt-2 p-3 bg-destructive/10 rounded border border-destructive/30">
                            <div className="flex items-start gap-2">
                              <Warning size={16} className="text-destructive shrink-0 mt-0.5" />
                              <div className="text-xs">
                                {item.validationErrors.map((error, idx) => (
                                  <p key={idx} className="text-destructive">{error}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {(item.status === 'uploading' || item.status === 'processing' || item.status === 'paused') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePauseResume(item.id)}
                          >
                            {item.status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                          </Button>
                        )}
                        {item.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRetry(item.id)}
                          >
                            <Play size={16} />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}
