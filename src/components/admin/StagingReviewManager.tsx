import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { PDFAsset, Case, DocumentType } from '@/lib/types'
import { OCRPipeline } from '@/lib/ocr-pipeline'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  CheckCircle,
  CheckSquare,
  Calendar,
  Tag,
  Eye,
  EyeSlash,
  Trash,
  Star,
  FloppyDisk,
  ArrowsClockwise,
  Sparkle,
  Check,
  CaretDown,
  CaretUp
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function StagingReviewManager() {
  const [pdfs, setPdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [cases] = useKV<Case[]>('founder-hub-cases', [])
  const [documentTypes] = useKV<DocumentType[]>('founder-hub-document-types', [])
  
  const [selectedDoc, setSelectedDoc] = useState<PDFAsset | null>(null)
  const [editedDoc, setEditedDoc] = useState<Partial<PDFAsset>>({})
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [showOCRSuggestions, setShowOCRSuggestions] = useState(true)

  const stagingDocs = useMemo(() => {
    return (pdfs || []).filter(doc => doc.stage === 'staging').sort((a, b) => b.createdAt - a.createdAt)
  }, [pdfs])

  const allSelected = stagingDocs.length > 0 && selectedDocs.size === stagingDocs.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(stagingDocs.map(doc => doc.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDocs(newSelected)
  }

  const handleSelectDoc = (doc: PDFAsset) => {
    setSelectedDoc(doc)
    setEditedDoc({})
    setShowOCRSuggestions(true)
  }

  const handleAcceptSuggestion = (field: string, value: any) => {
    setEditedDoc({ ...editedDoc, [field]: value })
    toast.success(`Applied suggested ${field}`)
  }

  const handleSaveDoc = () => {
    if (!selectedDoc) return

    setPdfs((current) =>
      (current || []).map(doc =>
        doc.id === selectedDoc.id 
          ? { ...doc, ...editedDoc, updatedAt: Date.now() } 
          : doc
      )
    )

    setSelectedDoc({ ...selectedDoc, ...editedDoc })
    setEditedDoc({})
    toast.success('Changes saved')
  }

  const handlePublishDoc = (docId: string) => {
    setPdfs((current) =>
      (current || []).map(doc =>
        doc.id === docId 
          ? { ...doc, stage: 'published', updatedAt: Date.now() } 
          : doc
      )
    )
    
    if (selectedDoc?.id === docId) {
      setSelectedDoc(null)
    }
    
    toast.success('Document published')
  }

  const handleBulkPublish = () => {
    if (selectedDocs.size === 0) return

    setPdfs((current) =>
      (current || []).map(doc =>
        selectedDocs.has(doc.id) 
          ? { ...doc, stage: 'published', updatedAt: Date.now() } 
          : doc
      )
    )

    setSelectedDocs(new Set())
    setSelectedDoc(null)
    toast.success(`Published ${selectedDocs.size} documents`)
  }

  const handleBulkAssignCase = (caseId: string) => {
    if (selectedDocs.size === 0) return

    setPdfs((current) =>
      (current || []).map(doc =>
        selectedDocs.has(doc.id) 
          ? { ...doc, caseId, updatedAt: Date.now() } 
          : doc
      )
    )

    setSelectedDocs(new Set())
    toast.success(`Assigned ${selectedDocs.size} documents to case`)
  }

  const handleBulkSetVisibility = (visibility: 'public' | 'unlisted' | 'private') => {
    if (selectedDocs.size === 0) return

    setPdfs((current) =>
      (current || []).map(doc =>
        selectedDocs.has(doc.id) 
          ? { ...doc, visibility, updatedAt: Date.now() } 
          : doc
      )
    )

    setSelectedDocs(new Set())
    toast.success(`Updated visibility for ${selectedDocs.size} documents`)
  }

  const handleBulkAddTags = () => {
    const tagsInput = prompt('Enter tags (comma-separated):')
    if (!tagsInput || selectedDocs.size === 0) return

    const newTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)

    setPdfs((current) =>
      (current || []).map(doc =>
        selectedDocs.has(doc.id) 
          ? { ...doc, tags: [...new Set([...doc.tags, ...newTags])], updatedAt: Date.now() } 
          : doc
      )
    )

    setSelectedDocs(new Set())
    toast.success(`Added tags to ${selectedDocs.size} documents`)
  }

  const handleDeleteDoc = (docId: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return

    setPdfs((current) => (current || []).filter(doc => doc.id !== docId))
    
    if (selectedDoc?.id === docId) {
      setSelectedDoc(null)
    }
    
    toast.success('Document deleted')
  }

  const getCaseTitle = (caseId?: string) => {
    if (!caseId) return 'Unassigned'
    return cases?.find(c => c.id === caseId)?.title || 'Unknown Case'
  }

  const currentDoc = selectedDoc ? { ...selectedDoc, ...editedDoc } : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Staging Review</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and edit documents before publishing - {stagingDocs.length} document{stagingDocs.length !== 1 ? 's' : ''} in staging
          </p>
        </div>
        {selectedDocs.size > 0 && (
          <Button onClick={handleBulkPublish}>
            <CheckCircle size={18} />
            Publish Selected ({selectedDocs.size})
          </Button>
        )}
      </div>

      {selectedDocs.size > 0 && (
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Bulk Actions:</span>
            <Select onValueChange={handleBulkAssignCase}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assign to Case" />
              </SelectTrigger>
              <SelectContent>
                {cases?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(v) => handleBulkSetVisibility(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Set Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleBulkAddTags}>
              <Tag size={16} />
              Add Tags
            </Button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        <GlassCard className="p-6 h-fit max-h-[calc(100vh-300px)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Documents</h3>
            {stagingDocs.length > 0 && (
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
            )}
          </div>

          <div className="space-y-2">
            {stagingDocs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>No documents in staging</p>
                <p className="text-xs mt-2">Upload files from the Upload Queue</p>
              </div>
            ) : (
              stagingDocs.map(doc => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'p-3 rounded-lg border cursor-pointer transition-all',
                    selectedDoc?.id === doc.id 
                      ? 'border-accent bg-accent/10' 
                      : 'border-border hover:border-accent/50 hover:bg-accent/5'
                  )}
                  onClick={() => handleSelectDoc(doc)}
                >
                  <div className="flex items-start gap-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedDocs.has(doc.id)}
                        onCheckedChange={() => toggleSelect(doc.id)}
                      />
                    </div>
                    <FileText size={18} className="text-accent shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{doc.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {getCaseTitle(doc.caseId)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {doc.documentType && (
                          <Badge variant="outline" className="text-xs">{doc.documentType}</Badge>
                        )}
                        {doc.metadata?.suggestedDocType && !doc.documentType && (
                          <Badge variant="secondary" className="text-xs">
                            Suggested: {doc.metadata.suggestedDocType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          {currentDoc ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Document Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Edit metadata and publish when ready
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveDoc} disabled={Object.keys(editedDoc).length === 0}>
                    <FloppyDisk size={16} />
                    Save
                  </Button>
                  <Button size="sm" onClick={() => handlePublishDoc(currentDoc.id)}>
                    <CheckCircle size={16} />
                    Publish
                  </Button>
                </div>
              </div>

              <Separator />

              {currentDoc.ocrStatus === 'completed' && (
                currentDoc.metadata.suggestedDocket || 
                currentDoc.metadata.suggestedDocType || 
                currentDoc.metadata.suggestedFilingDate
              ) && (
                <>
                  <div className="space-y-3">
                    <div 
                      className="flex items-center justify-between cursor-pointer group" 
                      onClick={() => setShowOCRSuggestions(!showOCRSuggestions)}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkle size={18} className="text-accent group-hover:scale-110 transition-transform" weight="fill" />
                        <h4 className="font-semibold text-sm">Automated Field Suggestions</h4>
                        <Badge variant="outline" className="text-xs">
                          {[
                            currentDoc.metadata.suggestedDocket,
                            currentDoc.metadata.suggestedDocType,
                            currentDoc.metadata.suggestedFilingDate
                          ].filter(Boolean).length} fields extracted
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {showOCRSuggestions ? <CaretUp size={16} /> : <CaretDown size={16} />}
                      </Button>
                    </div>

                    {showOCRSuggestions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        <div className="p-2 bg-muted/30 rounded text-xs text-muted-foreground border border-border/50">
                          <p className="flex items-center gap-1 mb-1">
                            <Sparkle size={12} />
                            <strong>Confidence Scores:</strong>
                          </p>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-green-400"></div>
                              <span>High (85%+)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                              <span>Medium (65-84%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                              <span>Low (&lt;65%)</span>
                            </div>
                          </div>
                        </div>

                        {currentDoc.metadata.suggestedDocket && (
                          <div className="p-3 bg-card/80 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Docket Number</p>
                                <p className="text-sm font-mono font-semibold">{currentDoc.metadata.suggestedDocket}</p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs shrink-0",
                                  OCRPipeline.getConfidenceLevel(currentDoc.metadata.suggestedDocketConfidence || 0).color
                                )}
                              >
                                {Math.round((currentDoc.metadata.suggestedDocketConfidence || 0) * 100)}%
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                const matchingCase = cases?.find(c => 
                                  c.docket === currentDoc.metadata.suggestedDocket
                                )
                                if (matchingCase) {
                                  handleAcceptSuggestion('caseId', matchingCase.id)
                                  toast.success(`Assigned to case: ${matchingCase.title}`)
                                } else {
                                  toast.info('No matching case found for this docket')
                                }
                              }}
                            >
                              <Check size={14} />
                              Link to Matching Case
                            </Button>
                          </div>
                        )}

                        {currentDoc.metadata.suggestedDocType && !currentDoc.documentType && (
                          <div className="p-3 bg-card/80 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Document Type</p>
                                <p className="text-sm font-semibold">{currentDoc.metadata.suggestedDocType}</p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs shrink-0",
                                  OCRPipeline.getConfidenceLevel(currentDoc.metadata.suggestedDocTypeConfidence || 0).color
                                )}
                              >
                                {Math.round((currentDoc.metadata.suggestedDocTypeConfidence || 0) * 100)}%
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleAcceptSuggestion('documentType', currentDoc.metadata.suggestedDocType)}
                            >
                              <Check size={14} />
                              Apply Suggestion
                            </Button>
                          </div>
                        )}

                        {currentDoc.metadata.suggestedFilingDate && !currentDoc.filingDate && (
                          <div className="p-3 bg-card/80 rounded-lg border border-border/50 hover:border-accent/50 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Suggested Filing Date</p>
                                <p className="text-sm font-semibold">{currentDoc.metadata.suggestedFilingDate}</p>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs shrink-0",
                                  OCRPipeline.getConfidenceLevel(currentDoc.metadata.suggestedFilingDateConfidence || 0).color
                                )}
                              >
                                {Math.round((currentDoc.metadata.suggestedFilingDateConfidence || 0) * 100)}%
                              </Badge>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                const dateObj = new Date(currentDoc.metadata.suggestedFilingDate!)
                                const formatted = dateObj.toISOString().split('T')[0]
                                handleAcceptSuggestion('filingDate', formatted)
                              }}
                            >
                              <Check size={14} />
                              Apply Suggestion
                            </Button>
                          </div>
                        )}

                        {currentDoc.metadata.courtStampPresent && (
                          <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
                            <div className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-accent" weight="fill" />
                              <p className="text-xs font-medium text-accent">Court Stamp Detected</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              This document appears to have an official court filing stamp
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>

                  <Separator />
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={currentDoc.title}
                    onChange={(e) => setEditedDoc({ ...editedDoc, title: e.target.value })}
                    placeholder="Document title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="case">Case Assignment</Label>
                  <Select 
                    value={currentDoc.caseId || ''} 
                    onValueChange={(v) => setEditedDoc({ ...editedDoc, caseId: v || undefined })}
                  >
                    <SelectTrigger id="case">
                      <SelectValue placeholder="Select case" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {cases?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="docType">Document Type</Label>
                  <Select 
                    value={currentDoc.documentType || ''} 
                    onValueChange={(v) => setEditedDoc({ ...editedDoc, documentType: v || undefined })}
                  >
                    <SelectTrigger id="docType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {documentTypes?.map(type => (
                        <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {currentDoc.metadata?.suggestedDocType && !currentDoc.documentType && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowsClockwise size={12} />
                      Suggested: {currentDoc.metadata.suggestedDocType} 
                      ({Math.round((currentDoc.metadata.suggestedDocTypeConfidence || 0) * 100)}% confidence)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filingDate">Filing Date</Label>
                  <Input
                    id="filingDate"
                    type="date"
                    value={currentDoc.filingDate || ''}
                    onChange={(e) => setEditedDoc({ ...editedDoc, filingDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select 
                    value={currentDoc.visibility} 
                    onValueChange={(v) => setEditedDoc({ ...editedDoc, visibility: v as any })}
                  >
                    <SelectTrigger id="visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Checkbox
                      checked={currentDoc.featured}
                      onCheckedChange={(checked) => setEditedDoc({ ...editedDoc, featured: !!checked })}
                    />
                    Featured Document
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show in featured documents section
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={currentDoc.description}
                    onChange={(e) => setEditedDoc({ ...editedDoc, description: e.target.value })}
                    placeholder="Brief description of this document"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={currentDoc.tags.join(', ')}
                    onChange={(e) => setEditedDoc({ 
                      ...editedDoc, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                    })}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">File Information</h4>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Original Filename</dt>
                    <dd className="font-mono text-xs truncate">{currentDoc.metadata.originalFilename}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">File Size</dt>
                    <dd>{(currentDoc.fileSize / 1024 / 1024).toFixed(2)} MB</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Checksum</dt>
                    <dd className="font-mono text-xs truncate">{currentDoc.metadata.checksum}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">OCR Status</dt>
                    <dd>
                      <Badge variant={currentDoc.ocrStatus === 'completed' ? 'default' : 'secondary'}>
                        {currentDoc.ocrStatus}
                      </Badge>
                    </dd>
                  </div>
                  {currentDoc.pageCount && (
                    <div>
                      <dt className="text-muted-foreground">Pages</dt>
                      <dd>{currentDoc.pageCount}</dd>
                    </div>
                  )}
                  {currentDoc.metadata.courtStampPresent && (
                    <div>
                      <dt className="text-muted-foreground">Court Stamp</dt>
                      <dd className="text-accent">Detected</dd>
                    </div>
                  )}
                </dl>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => window.open(currentDoc.fileUrl, '_blank')}
                >
                  <Eye size={16} />
                  Preview PDF
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteDoc(currentDoc.id)}
                >
                  <Trash size={16} />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-muted-foreground">
              <FileText size={64} className="mx-auto mb-4 opacity-50" />
              <p>Select a document to review and edit</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
