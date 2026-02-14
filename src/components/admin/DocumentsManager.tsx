import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { PDFAsset, Case, DocumentType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  MagnifyingGlass, 
  Funnel, 
  FileText, 
  Eye, 
  Trash, 
  Star,
  CaretUp,
  CaretDown,
  CheckSquare,
  Square,
  Calendar,
  Tag,
  FolderOpen,
  Download,
  ArrowsClockwise
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function DocumentsManager() {
  const [pdfs, setPdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [cases] = useKV<Case[]>('founder-hub-cases', [])
  const [documentTypes] = useKV<DocumentType[]>('founder-hub-document-types', [])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCaseFilter, setSelectedCaseFilter] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all')
  const [selectedVisibilityFilter, setSelectedVisibilityFilter] = useState<string>('all')
  const [selectedOCRFilter, setSelectedOCRFilter] = useState<string>('all')
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<'title' | 'date' | 'type' | 'case'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedPDF, setSelectedPDF] = useState<PDFAsset | null>(null)

  const filteredAndSortedDocs = useMemo(() => {
    let filtered = [...(pdfs || [])]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.metadata?.originalFilename.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (selectedCaseFilter !== 'all') {
      filtered = filtered.filter(doc => doc.caseId === selectedCaseFilter)
    }

    if (selectedTypeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.documentType === selectedTypeFilter)
    }

    if (selectedStageFilter !== 'all') {
      filtered = filtered.filter(doc => doc.stage === selectedStageFilter)
    }

    if (selectedVisibilityFilter !== 'all') {
      filtered = filtered.filter(doc => doc.visibility === selectedVisibilityFilter)
    }

    if (selectedOCRFilter !== 'all') {
      filtered = filtered.filter(doc => doc.ocrStatus === selectedOCRFilter)
    }

    filtered.sort((a, b) => {
      let compareA: any, compareB: any

      switch (sortField) {
        case 'date':
          compareA = a.filingDate || a.createdAt
          compareB = b.filingDate || b.createdAt
          break
        case 'title':
          compareA = a.title.toLowerCase()
          compareB = b.title.toLowerCase()
          break
        case 'type':
          compareA = a.documentType || ''
          compareB = b.documentType || ''
          break
        case 'case':
          compareA = a.caseId || ''
          compareB = b.caseId || ''
          break
      }

      const order = sortOrder === 'asc' ? 1 : -1
      if (compareA < compareB) return -1 * order
      if (compareA > compareB) return 1 * order
      return 0
    })

    return filtered
  }, [pdfs, searchQuery, selectedCaseFilter, selectedTypeFilter, selectedStageFilter, selectedVisibilityFilter, selectedOCRFilter, sortField, sortOrder])

  const allSelected = filteredAndSortedDocs.length > 0 && selectedDocs.size === filteredAndSortedDocs.length

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(filteredAndSortedDocs.map(doc => doc.id)))
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

  const handleBulkAssignCase = async (caseId: string) => {
    if (selectedDocs.size === 0) return
    
    setPdfs((current) => 
      (current || []).map(doc =>
        selectedDocs.has(doc.id) ? { ...doc, caseId, updatedAt: Date.now() } : doc
      )
    )
    
    toast.success(`Assigned ${selectedDocs.size} documents to case`)
    setSelectedDocs(new Set())
  }

  const handleBulkSetVisibility = async (visibility: 'public' | 'unlisted' | 'private') => {
    if (selectedDocs.size === 0) return
    
    setPdfs((current) => 
      (current || []).map(doc =>
        selectedDocs.has(doc.id) ? { ...doc, visibility, updatedAt: Date.now() } : doc
      )
    )
    
    toast.success(`Updated visibility for ${selectedDocs.size} documents`)
    setSelectedDocs(new Set())
  }

  const handleBulkAddTags = async () => {
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
    
    toast.success(`Added tags to ${selectedDocs.size} documents`)
    setSelectedDocs(new Set())
  }

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return
    if (!confirm(`Delete ${selectedDocs.size} documents? This cannot be undone.`)) return
    
    setPdfs((current) => (current || []).filter(doc => !selectedDocs.has(doc.id)))
    
    toast.success(`Deleted ${selectedDocs.size} documents`)
    setSelectedDocs(new Set())
  }

  const handleBulkPublish = async () => {
    if (selectedDocs.size === 0) return
    
    setPdfs((current) => 
      (current || []).map(doc =>
        selectedDocs.has(doc.id) ? { ...doc, stage: 'published', updatedAt: Date.now() } : doc
      )
    )
    
    toast.success(`Published ${selectedDocs.size} documents`)
    setSelectedDocs(new Set())
  }

  const handleToggleFeatured = async (docId: string) => {
    setPdfs((current) =>
      (current || []).map(doc =>
        doc.id === docId ? { ...doc, featured: !doc.featured, updatedAt: Date.now() } : doc
      )
    )
    toast.success('Updated featured status')
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Delete this document? This cannot be undone.')) return
    
    setPdfs((current) => (current || []).filter(doc => doc.id !== docId))
    toast.success('Document deleted')
  }

  const getCaseTitle = (caseId?: string) => {
    if (!caseId) return 'Unassigned'
    return cases?.find(c => c.id === caseId)?.title || 'Unknown Case'
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCaseFilter('all')
    setSelectedTypeFilter('all')
    setSelectedStageFilter('all')
    setSelectedVisibilityFilter('all')
    setSelectedOCRFilter('all')
  }

  const hasFilters = searchQuery || selectedCaseFilter !== 'all' || selectedTypeFilter !== 'all' || 
                     selectedStageFilter !== 'all' || selectedVisibilityFilter !== 'all' || selectedOCRFilter !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Document Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all PDFs with filters, bulk actions, and metadata controls
          </p>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search documents by title, description, filename, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Funnel size={18} />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Select value={selectedCaseFilter} onValueChange={setSelectedCaseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Cases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cases</SelectItem>
                <SelectItem value="">Unassigned</SelectItem>
                {cases?.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {documentTypes?.map(type => (
                  <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStageFilter} onValueChange={setSelectedStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedVisibilityFilter} onValueChange={setSelectedVisibilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedOCRFilter} onValueChange={setSelectedOCRFilter}>
              <SelectTrigger>
                <SelectValue placeholder="OCR Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All OCR Status</SelectItem>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                {filteredAndSortedDocs.length} document{filteredAndSortedDocs.length !== 1 ? 's' : ''}
              </span>
              {selectedDocs.size > 0 && (
                <span className="text-accent font-semibold">
                  {selectedDocs.size} selected
                </span>
              )}
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {selectedDocs.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-4 bg-accent/10 rounded-lg border border-accent/30">
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
              <Button variant="outline" size="sm" onClick={handleBulkPublish}>
                <CheckSquare size={16} />
                Publish
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash size={16} />
                Delete
              </Button>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-accent" onClick={() => {
                  setSortField('title')
                  setSortOrder(sortField === 'title' && sortOrder === 'asc' ? 'desc' : 'asc')
                }}>
                  <div className="flex items-center gap-1">
                    Title
                    {sortField === 'title' && (sortOrder === 'asc' ? <CaretUp size={14} /> : <CaretDown size={14} />)}
                  </div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-accent" onClick={() => {
                  setSortField('case')
                  setSortOrder(sortField === 'case' && sortOrder === 'asc' ? 'desc' : 'asc')
                }}>
                  <div className="flex items-center gap-1">
                    Case
                    {sortField === 'case' && (sortOrder === 'asc' ? <CaretUp size={14} /> : <CaretDown size={14} />)}
                  </div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-accent" onClick={() => {
                  setSortField('type')
                  setSortOrder(sortField === 'type' && sortOrder === 'asc' ? 'desc' : 'asc')
                }}>
                  <div className="flex items-center gap-1">
                    Type
                    {sortField === 'type' && (sortOrder === 'asc' ? <CaretUp size={14} /> : <CaretDown size={14} />)}
                  </div>
                </th>
                <th className="text-left p-3 cursor-pointer hover:text-accent" onClick={() => {
                  setSortField('date')
                  setSortOrder(sortField === 'date' && sortOrder === 'asc' ? 'desc' : 'asc')
                }}>
                  <div className="flex items-center gap-1">
                    Date
                    {sortField === 'date' && (sortOrder === 'asc' ? <CaretUp size={14} /> : <CaretDown size={14} />)}
                  </div>
                </th>
                <th className="text-left p-3">Stage</th>
                <th className="text-left p-3">Visibility</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredAndSortedDocs.map((doc) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-border hover:bg-accent/5"
                  >
                    <td className="p-3">
                      <Checkbox
                        checked={selectedDocs.has(doc.id)}
                        onCheckedChange={() => toggleSelect(doc.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-start gap-2">
                        <FileText size={18} className="text-accent shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {doc.title}
                            {doc.featured && <Star size={14} weight="fill" className="text-accent" />}
                          </div>
                          {doc.pageCount && (
                            <div className="text-xs text-muted-foreground">{doc.pageCount} pages</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{getCaseTitle(doc.caseId)}</td>
                    <td className="p-3">
                      {doc.documentType && (
                        <Badge variant="outline" className="text-xs">{doc.documentType}</Badge>
                      )}
                    </td>
                    <td className="p-3 text-sm">
                      {doc.filingDate ? new Date(doc.filingDate).toLocaleDateString() : 
                       <span className="text-muted-foreground">No date</span>}
                    </td>
                    <td className="p-3">
                      <Badge variant={doc.stage === 'published' ? 'default' : 'secondary'} className="text-xs">
                        {doc.stage}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge 
                        variant={doc.visibility === 'public' ? 'default' : 'outline'} 
                        className="text-xs"
                      >
                        {doc.visibility}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleToggleFeatured(doc.id)}
                        >
                          <Star size={16} weight={doc.featured ? 'fill' : 'regular'} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => handleDeleteDoc(doc.id)}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredAndSortedDocs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No documents found</p>
              {hasFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear filters to see all documents
                </Button>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
