import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { Case, PDFAsset, TimelineEvent, FilingType, DocumentAnalysis, CaseAnalysis } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassButton } from '@/components/ui/glass-button'
import { GlassCard } from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useIsMobile } from '@/hooks/use-mobile'
import { HONOR_BAR_HEIGHT_DESKTOP, HONOR_BAR_HEIGHT_MOBILE } from './HonorFlagBar'
import { 
  ArrowLeft, 
  Download, 
  Share, 
  Copy, 
  MagnifyingGlass,
  SortAscending,
  SortDescending,
  Funnel,
  X,
  FileText,
  Calendar,
  Eye,
  Star,
  Printer,
  Info,
  CaretRight,
  CheckCircle,
  Circle,
  ClipboardText,
  Warning,
  List,
  ListDashes,
  CaretDown,
  CaretUp,
  Sparkle,
  Certificate
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AnalysisGenerator } from '@/lib/analysis-generator'

interface CaseJacketProps {
  caseId: string
  onBack: () => void
}

type SortField = 'date' | 'title' | 'type'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'by-type' | 'chronological'

export default function CaseJacket({ caseId, onBack }: CaseJacketProps) {
  const [cases] = useKV<Case[]>('founder-hub-court-cases', [])
  const [pdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [filingTypes] = useKV<FilingType[]>('founder-hub-filing-types', [])
  const [documentAnalyses] = useKV<DocumentAnalysis[]>('founder-hub-document-analyses', [])
  const [caseAnalyses] = useKV<CaseAnalysis[]>('founder-hub-case-analyses', [])
  const isMobile = useIsMobile()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocType, setSelectedDocType] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('by-type')
  const [selectedPDF, setSelectedPDF] = useState<PDFAsset | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'docs' | 'timeline' | 'details' | 'analysis'>('docs')
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])

  const selectedCase = cases?.find(c => c.id === caseId)
  const caseAnalysis = caseAnalyses?.find(a => a.caseId === caseId && a.visibility !== 'private')

  useEffect(() => {
    if (!selectedCase) return
    document.title = `${selectedCase.title} - Case Jacket`
  }, [selectedCase])

  const caseDocs = useMemo(() => {
    if (!pdfs || !selectedCase) return []
    return pdfs.filter(pdf => 
      pdf.caseId === caseId && 
      (pdf.visibility === 'public' || pdf.visibility === 'unlisted') &&
      pdf.stage === 'published'
    )
  }, [pdfs, caseId, selectedCase])

  const featuredDocs = useMemo(() => {
    if (!selectedCase?.featuredDocIds || !caseDocs) return []
    return caseDocs.filter(doc => selectedCase.featuredDocIds?.includes(doc.id))
  }, [selectedCase, caseDocs])

  const allDocTypes = useMemo(() => {
    const types = new Set(caseDocs.map(doc => doc.documentType).filter(Boolean))
    return Array.from(types)
  }, [caseDocs])

  const allTags = useMemo(() => {
    const tags = new Set(caseDocs.flatMap(doc => doc.tags || []))
    return Array.from(tags)
  }, [caseDocs])

  const filteredAndSortedDocs = useMemo(() => {
    let filtered = [...caseDocs]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.metadata?.extractedText?.toLowerCase().includes(query)
      )
    }

    if (selectedDocType !== 'all') {
      filtered = filtered.filter(doc => doc.documentType === selectedDocType)
    }

    if (selectedTag !== 'all') {
      filtered = filtered.filter(doc => (doc.tags || []).includes(selectedTag))
    }

    if (featuredOnly) {
      filtered = filtered.filter(doc => doc.featured)
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
      }

      const order = sortOrder === 'asc' ? 1 : -1
      if (compareA < compareB) return -1 * order
      if (compareA > compareB) return 1 * order
      return 0
    })

    return filtered
  }, [caseDocs, searchQuery, selectedDocType, selectedTag, featuredOnly, sortField, sortOrder])

  const groupedDocs = useMemo(() => {
    if (viewMode === 'chronological') {
      return { 'All Documents': filteredAndSortedDocs }
    }

    const sortedFilingTypes = [...(filingTypes || [])].sort((a, b) => a.sortOrder - b.sortOrder)
    const groups: Record<string, PDFAsset[]> = {}

    sortedFilingTypes.forEach(type => {
      groups[type.id] = []
    })
    groups['undated'] = []
    groups['uncategorized'] = []

    filteredAndSortedDocs.forEach(doc => {
      if (doc.filingTypeId && groups[doc.filingTypeId]) {
        if (!doc.filingDate) {
          groups['undated'].push(doc)
        } else {
          groups[doc.filingTypeId].push(doc)
        }
      } else {
        groups['uncategorized'].push(doc)
      }
    })

    const nonEmptyGroups: Record<string, PDFAsset[]> = {}
    Object.entries(groups).forEach(([key, docs]) => {
      if (docs.length > 0) {
        nonEmptyGroups[key] = docs
      }
    })

    return nonEmptyGroups
  }, [filteredAndSortedDocs, viewMode, filingTypes])

  const getFilingTypeName = (filingTypeId: string): string => {
    if (filingTypeId === 'undated') return 'Undated Documents'
    if (filingTypeId === 'uncategorized') return 'Other Documents'
    const type = filingTypes?.find(t => t.id === filingTypeId)
    return type ? `${type.icon || '📄'} ${type.name}` : 'Unknown Type'
  }

  const getGroupDateRange = (docs: PDFAsset[]): string => {
    const dates = docs.map(d => d.filingDate).filter(Boolean).sort()
    if (dates.length === 0) return ''
    if (dates.length === 1) return new Date(dates[0]!).toLocaleDateString()
    const first = new Date(dates[0]!).toLocaleDateString()
    const last = new Date(dates[dates.length - 1]!).toLocaleDateString()
    return `${first} - ${last}`
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(current =>
      current.includes(groupId)
        ? current.filter(id => id !== groupId)
        : [...current, groupId]
    )
  }

  const expandAll = () => {
    setExpandedGroups(Object.keys(groupedDocs))
  }

  const collapseAll = () => {
    setExpandedGroups([])
  }

  useEffect(() => {
    if (viewMode === 'by-type') {
      expandAll()
    }
  }, [viewMode])

  if (!selectedCase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Case not found</p>
          <Button onClick={onBack}>Back to Cases</Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent/20 text-accent border-accent/40'
      case 'settled': return 'bg-green-500/20 text-green-400 border-green-500/40'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
      case 'closed': return 'bg-gray-500/20 text-gray-400 border-gray-500/40'
      case 'dismissed': return 'bg-blue-500/20 text-blue-400 border-blue-500/40'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const copyLink = () => {
    const url = `${window.location.origin}/case/${caseId}`
    navigator.clipboard.writeText(url)
    toast.success('Case link copied to clipboard')
  }

  const handleExportIndex = () => {
    toast.success('Case index export started')
  }

  const FilterBar = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-border"
          />
        </div>
        {isMobile ? (
          <GlassButton onClick={() => setShowFilters(!showFilters)} size="icon">
            <Funnel size={18} />
          </GlassButton>
        ) : null}
      </div>

      {(!isMobile || showFilters) && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          <Select value={selectedDocType} onValueChange={setSelectedDocType}>
            <SelectTrigger className="bg-card/50 border-border">
              <SelectValue placeholder="Doc Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {allDocTypes.map(type => (
                <SelectItem key={type} value={type!}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="bg-card/50 border-border">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="bg-card/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="title">Sort by Title</SelectItem>
              <SelectItem value="type">Sort by Type</SelectItem>
            </SelectContent>
          </Select>

          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="bg-card/50 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="by-type">
                <span className="flex items-center gap-2">
                  <ListDashes size={16} />
                  By Filing Type
                </span>
              </SelectItem>
              <SelectItem value="chronological">
                <span className="flex items-center gap-2">
                  <List size={16} />
                  Chronological
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {viewMode === 'by-type' && (
              <>
                <GlassButton onClick={expandAll} variant="glass" size="sm" title="Expand all groups">
                  <CaretDown size={16} />
                </GlassButton>
                <GlassButton onClick={collapseAll} variant="glass" size="sm" title="Collapse all groups">
                  <CaretUp size={16} />
                </GlassButton>
              </>
            )}
            <GlassButton
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              variant="glass"
              size="icon"
              className="flex-1"
            >
              {sortOrder === 'asc' ? <SortAscending size={18} /> : <SortDescending size={18} />}
            </GlassButton>
            <GlassButton
              onClick={() => setFeaturedOnly(!featuredOnly)}
              variant={featuredOnly ? 'glassPrimary' : 'glass'}
              size="icon"
              className="flex-1"
            >
              <Star size={18} weight={featuredOnly ? 'fill' : 'regular'} />
            </GlassButton>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredAndSortedDocs.length} document{filteredAndSortedDocs.length !== 1 ? 's' : ''}</span>
        {(searchQuery || selectedDocType !== 'all' || selectedTag !== 'all' || featuredOnly) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setSelectedDocType('all')
              setSelectedTag('all')
              setFeaturedOnly(false)
            }}
            className="text-accent"
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )

  const DocumentRow = ({ doc }: { doc: PDFAsset }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <GlassCard 
        className="p-4 hover:border-accent/50 transition-colors cursor-pointer"
        onClick={() => setSelectedPDF(doc)}
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <FileText size={24} className="text-accent" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                {doc.title}
              </h4>
              {doc.featured && (
                <Star size={16} weight="fill" className="text-accent shrink-0" />
              )}
            </div>
            
            {doc.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{doc.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {doc.filingDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(doc.filingDate).toLocaleDateString()}
                </span>
              )}
              {doc.documentType && (
                <Badge variant="outline" className="text-xs">{doc.documentType}</Badge>
              )}
              {doc.pageCount && (
                <span>{doc.pageCount} pages</span>
              )}
              {(doc.tags || []).slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <GlassButton size="sm" variant="glass">
              <Eye size={16} />
              Preview
            </GlassButton>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div
        className="sticky z-40 border-b border-border bg-background/80 backdrop-blur-xl"
        style={{ top: `var(--honor-bar-height, ${HONOR_BAR_HEIGHT_DESKTOP}px)` }}
      >
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <GlassButton onClick={onBack} variant="glass" size="sm">
              <ArrowLeft size={18} />
              {!isMobile && <span>Back to Court</span>}
            </GlassButton>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <span>Court Section</span>
                <CaretRight size={12} />
                <span className="text-foreground">Case Jacket</span>
              </div>
              <h1 className="text-xl lg:text-2xl font-bold font-display truncate">{selectedCase.title}</h1>
            </div>

            <div className="flex items-center gap-2">
              <GlassButton onClick={copyLink} size="sm" variant="glass">
                <Copy size={18} />
                {!isMobile && <span>Copy Link</span>}
              </GlassButton>
              
              <GlassButton onClick={handleExportIndex} size="sm" variant="glassPrimary">
                <Printer size={18} />
                {!isMobile && <span>Export</span>}
              </GlassButton>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getStatusColor(selectedCase.status)} variant="outline">
              {selectedCase.status}
            </Badge>
            <span className="text-sm text-muted-foreground">{selectedCase.court}</span>
            <span className="text-sm font-mono text-accent">{selectedCase.docket}</span>
            {selectedCase.lastUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(selectedCase.lastUpdate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {isMobile ? (
        <div className="p-4 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-card/50">
              <TabsTrigger value="docs">Docs</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="docs" className="space-y-4 mt-4">
              {featuredDocs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Star size={16} weight="fill" className="text-accent" />
                    Featured Documents
                  </h3>
                  <div className="space-y-2">
                    {featuredDocs.map(doc => (
                      <DocumentRow key={doc.id} doc={doc} />
                    ))}
                  </div>
                  <Separator className="my-4" />
                </div>
              )}

              <FilterBar />
              
              <div className="space-y-2">
                {viewMode === 'by-type' ? (
                  Object.entries(groupedDocs).map(([groupId, docs]) => {
                    const isExpanded = expandedGroups.includes(groupId)
                    const groupName = getFilingTypeName(groupId)
                    const dateRange = getGroupDateRange(docs)
                    
                    return (
                      <div key={groupId} className="mb-4">
                        <div
                          className="flex items-center justify-between p-3 bg-card/50 border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors"
                          onClick={() => toggleGroup(groupId)}
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <CaretDown size={18} /> : <CaretRight size={18} />}
                            <h3 className="text-sm font-semibold">{groupName}</h3>
                            <Badge variant="outline">{docs.length}</Badge>
                            {dateRange && (
                              <span className="text-xs text-muted-foreground">{dateRange}</span>
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-2 mt-2"
                          >
                            {docs.map(doc => (
                              <DocumentRow key={doc.id} doc={doc} />
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  Object.entries(groupedDocs).map(([group, docs]) => (
                    <div key={group}>
                      {docs.map(doc => (
                        <DocumentRow key={doc.id} doc={doc} />
                      ))}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <TimelinePanel case={selectedCase} />
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <DetailsPanel case={selectedCase} />
              <div className="mt-4">
                <ReviewNotesPanel case={selectedCase} />
              </div>
              <div className="mt-4">
                <ContingencyChecklistPanel case={selectedCase} />
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="mt-4 space-y-4">
              {caseAnalysis ? (
                <CaseAnalysisPanel analysis={caseAnalysis} case={selectedCase} />
              ) : (
                <GlassCard className="p-6 text-center">
                  <Sparkle size={48} className="mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No case analysis available yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Case analysis must be generated and reviewed by admin.
                  </p>
                </GlassCard>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-[320px_1fr] gap-6">
          <aside className="space-y-4">
            <DetailsPanel case={selectedCase} />
            <TimelinePanel case={selectedCase} />
            <ReviewNotesPanel case={selectedCase} />
            <ContingencyChecklistPanel case={selectedCase} />
            {caseAnalysis && (
              <CaseAnalysisPanel analysis={caseAnalysis} case={selectedCase} />
            )}
          </aside>

          <main className="space-y-4">
            {featuredDocs.length > 0 && (
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star size={20} weight="fill" className="text-accent" />
                  Featured Documents
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {featuredDocs.map(doc => (
                    <GlassButton
                      key={doc.id}
                      onClick={() => setSelectedPDF(doc)}
                      variant="glassAccent"
                      className="justify-start h-auto p-3"
                    >
                      <FileText size={18} />
                      <span className="text-sm truncate">{doc.title}</span>
                    </GlassButton>
                  ))}
                </div>
              </GlassCard>
            )}

            <GlassCard className="p-6">
              <FilterBar />
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {viewMode === 'by-type' ? (
                    Object.entries(groupedDocs).map(([groupId, docs]) => {
                      const isExpanded = expandedGroups.includes(groupId)
                      const groupName = getFilingTypeName(groupId)
                      const dateRange = getGroupDateRange(docs)
                      
                      return (
                        <div key={groupId} className="mb-4">
                          <div
                            className="flex items-center justify-between p-3 bg-card/50 border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors"
                            onClick={() => toggleGroup(groupId)}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? <CaretDown size={18} /> : <CaretRight size={18} />}
                              <h3 className="text-sm font-semibold text-accent">{groupName}</h3>
                              <Badge variant="outline">{docs.length}</Badge>
                              {dateRange && (
                                <span className="text-xs text-muted-foreground">{dateRange}</span>
                              )}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-2 mt-2"
                            >
                              {docs.map(doc => (
                                <DocumentRow key={doc.id} doc={doc} />
                              ))}
                            </motion.div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    Object.entries(groupedDocs).map(([group, docs]) => (
                      <div key={group}>
                        {docs.map(doc => (
                          <DocumentRow key={doc.id} doc={doc} />
                        ))}
                      </div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </main>
        </div>
      )}

      <PDFPreviewSheet 
        pdf={selectedPDF} 
        isOpen={!!selectedPDF} 
        onClose={() => setSelectedPDF(null)} 
      />
    </div>
  )
}

function DetailsPanel({ case: selectedCase }: { case: Case }) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold mb-4">Case Overview</h3>
      
      <div className="space-y-3 text-sm">
        {selectedCase.jurisdiction && (
          <div>
            <dt className="text-muted-foreground mb-1">Jurisdiction</dt>
            <dd className="font-medium">{selectedCase.jurisdiction}</dd>
          </div>
        )}
        
        <div>
          <dt className="text-muted-foreground mb-1">Court</dt>
          <dd className="font-medium">{selectedCase.court}</dd>
        </div>
        
        <div>
          <dt className="text-muted-foreground mb-1">Docket</dt>
          <dd className="font-mono text-accent">{selectedCase.docket}</dd>
        </div>
        
        {selectedCase.parties && (
          <div>
            <dt className="text-muted-foreground mb-1">Parties</dt>
            <dd className="font-medium">{selectedCase.parties}</dd>
          </div>
        )}
        
        {selectedCase.filingDate && (
          <div>
            <dt className="text-muted-foreground mb-1">Filing Date</dt>
            <dd className="font-medium">{new Date(selectedCase.filingDate).toLocaleDateString()}</dd>
          </div>
        )}
        
        <div>
          <dt className="text-muted-foreground mb-1">Procedural Posture</dt>
          <dd className="font-medium">{selectedCase.stage}</dd>
        </div>

        {selectedCase.overview && (
          <div className="pt-3 border-t border-border">
            <dt className="text-muted-foreground mb-2">Summary</dt>
            <dd className="text-muted-foreground leading-relaxed">{selectedCase.overview}</dd>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

function TimelinePanel({ case: selectedCase }: { case: Case }) {
  if (!selectedCase.timeline || selectedCase.timeline.length === 0) {
    return null
  }

  const sortedTimeline = [...selectedCase.timeline].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold mb-4">Timeline</h3>
      
      <div className="space-y-4">
        {sortedTimeline.map((event, index) => (
          <div key={event.id} className="relative pl-6">
            {index < sortedTimeline.length - 1 && (
              <div className="absolute left-2 top-6 bottom-0 w-px bg-border" />
            )}
            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-accent/20 border-2 border-accent" />
            
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {new Date(event.date).toLocaleDateString()}
              </div>
              <div className="font-semibold text-sm">{event.title}</div>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

function ReviewNotesPanel({ case: selectedCase }: { case: Case }) {
  if (!selectedCase.reviewNotes || Object.keys(selectedCase.reviewNotes).length === 0) {
    return null
  }

  const { damagesInjuries, keyEvidenceSources, deadlinesLimitations, reliefSought, notes } = selectedCase.reviewNotes

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <ClipboardText size={20} className="text-accent" />
        Attorney Review Notes
      </h3>
      
      <div className="space-y-4 text-sm">
        {damagesInjuries && (
          <div>
            <dt className="text-muted-foreground mb-1 font-semibold">Damages/Injuries</dt>
            <dd className="text-foreground leading-relaxed">{damagesInjuries}</dd>
          </div>
        )}
        
        {keyEvidenceSources && (
          <div>
            <dt className="text-muted-foreground mb-1 font-semibold">Key Evidence Sources</dt>
            <dd className="text-foreground leading-relaxed">{keyEvidenceSources}</dd>
          </div>
        )}
        
        {deadlinesLimitations && (
          <div>
            <dt className="text-muted-foreground mb-1 font-semibold">Deadlines/Limitations</dt>
            <dd className="text-foreground leading-relaxed">{deadlinesLimitations}</dd>
          </div>
        )}
        
        {reliefSought && (
          <div>
            <dt className="text-muted-foreground mb-1 font-semibold">Relief Sought</dt>
            <dd className="text-foreground leading-relaxed">{reliefSought}</dd>
          </div>
        )}
        
        {notes && (
          <div className="pt-3 border-t border-border">
            <dt className="text-muted-foreground mb-1 font-semibold">Additional Notes</dt>
            <dd className="text-muted-foreground leading-relaxed">{notes}</dd>
          </div>
        )}
      </div>
    </GlassCard>
  )
}

function ContingencyChecklistPanel({ case: selectedCase }: { case: Case }) {
  if (!selectedCase.contingencyChecklist || selectedCase.contingencyChecklist.length === 0) {
    return null
  }

  const checkedCount = selectedCase.contingencyChecklist.filter(item => item.checked).length
  const totalCount = selectedCase.contingencyChecklist.length

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle size={20} className="text-accent" />
          Contingency Evaluation
        </h3>
        <Badge variant="outline" className="text-xs">
          {checkedCount}/{totalCount}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {selectedCase.contingencyChecklist.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {item.checked ? (
                <CheckCircle size={18} weight="fill" className="text-accent" />
              ) : (
                <Circle size={18} className="text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm",
                item.checked ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {item.label}
              </p>
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {checkedCount < totalCount && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Warning size={14} className="shrink-0 mt-0.5" />
            <p>Additional review recommended. {totalCount - checkedCount} item{totalCount - checkedCount !== 1 ? 's' : ''} pending verification.</p>
          </div>
        </div>
      )}
    </GlassCard>
  )
}

function CaseAnalysisPanel({ analysis, case: selectedCase }: { analysis: CaseAnalysis; case: Case }) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkle size={20} className="text-accent" />
          Case Brief
        </h3>
        <Badge className={AnalysisGenerator.getStatusColor(analysis.adminReviewStatus)}>
          {AnalysisGenerator.getStatusLabel(analysis.adminReviewStatus)}
        </Badge>
      </div>

      {analysis.adminReviewStatus === 'draft' && (
        <Alert className="mb-4 border-orange-400/30 bg-orange-400/10">
          <Warning className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-400">
            DRAFT — This analysis requires admin verification before it can be considered accurate.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 text-sm">
        <div>
          <dt className="text-muted-foreground mb-1 font-semibold">Procedural Posture</dt>
          <dd className="text-foreground leading-relaxed">{analysis.proceduralPosture}</dd>
        </div>

        {analysis.timelineHighlights.length > 0 && (
          <div>
            <dt className="text-muted-foreground mb-2 font-semibold">Timeline Highlights</dt>
            <dd className="space-y-2">
              {analysis.timelineHighlights.map((highlight, idx) => (
                <div key={idx} className="pl-3 border-l-2 border-accent/30">
                  <div className="text-xs text-muted-foreground">{new Date(highlight.date).toLocaleDateString()}</div>
                  <div className="font-medium">{highlight.event}</div>
                  <div className="text-muted-foreground">{highlight.significance}</div>
                </div>
              ))}
            </dd>
          </div>
        )}

        {analysis.keyFilingsChecklist.length > 0 && (
          <div>
            <dt className="text-muted-foreground mb-2 font-semibold">Key Filings Checklist</dt>
            <dd className="space-y-1">
              {analysis.keyFilingsChecklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {item.present ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : (
                    <Circle size={16} className="text-muted-foreground" />
                  )}
                  <span>{item.filingType}</span>
                  {item.notes && <span className="text-xs text-muted-foreground">({item.notes})</span>}
                </div>
              ))}
            </dd>
          </div>
        )}

        {analysis.missingDocsChecklist.length > 0 && (
          <div>
            <dt className="text-muted-foreground mb-2 font-semibold flex items-center gap-2">
              <Warning size={16} className="text-orange-400" />
              Missing Documents
            </dt>
            <dd>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {analysis.missingDocsChecklist.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        {analysis.counselQuestions.length > 0 && (
          <div>
            <dt className="text-muted-foreground mb-2 font-semibold">Questions for Counsel</dt>
            <dd>
              <ul className="space-y-1">
                {analysis.counselQuestions.map((question, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}

        {analysis.damagesInjuriesAnalysis && (
          <div className="pt-3 border-t border-border">
            <dt className="text-muted-foreground mb-1 font-semibold">Damages/Injuries</dt>
            <dd className="text-foreground leading-relaxed">{analysis.damagesInjuriesAnalysis}</dd>
          </div>
        )}

        {analysis.adminReviewedBy && analysis.adminReviewedAt && (
          <div className="pt-3 border-t border-border text-xs text-muted-foreground">
            Reviewed by admin on {new Date(analysis.adminReviewedAt).toLocaleString()}
          </div>
        )}
      </div>
    </GlassCard>
  )
}

function PDFPreviewSheet({ pdf, isOpen, onClose }: { pdf: PDFAsset | null; isOpen: boolean; onClose: () => void }) {
  const isMobile = useIsMobile()

  if (!pdf) return null

  const handleDownload = () => {
    window.open(pdf.fileUrl, '_blank')
    toast.success('Opening PDF in new tab')
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/pdf/${pdf.id}`
    navigator.clipboard.writeText(url)
    toast.success('PDF link copied')
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side={isMobile ? 'bottom' : 'right'} className="w-full sm:max-w-2xl p-0 overflow-hidden">
        <SheetHeader className="p-6 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left mb-2">{pdf.title}</SheetTitle>
              {pdf.description && (
                <p className="text-sm text-muted-foreground">{pdf.description}</p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {pdf.documentType && (
              <Badge variant="outline">{pdf.documentType}</Badge>
            )}
            {pdf.filingDate && (
              <Badge variant="secondary">
                {new Date(pdf.filingDate).toLocaleDateString()}
              </Badge>
            )}
            {pdf.pageCount && (
              <Badge variant="secondary">{pdf.pageCount} pages</Badge>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <GlassButton onClick={handleDownload} className="flex-1">
              <Download size={18} />
              Open in New Tab
            </GlassButton>
            {(pdf.visibility === 'unlisted' || pdf.visibility === 'public') && (
              <GlassButton onClick={handleCopyLink} variant="glass" className="flex-1">
                <Copy size={18} />
                Copy Link
              </GlassButton>
            )}
          </div>
        </SheetHeader>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
          <div className="aspect-[8.5/11] bg-muted rounded-lg flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground">
              <FileText size={48} className="mx-auto mb-2" />
              <p className="text-sm">PDF Preview</p>
              <p className="text-xs mt-1">Click "Open in New Tab" to view full document</p>
            </div>
          </div>

          {pdf.tags && pdf.tags.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {pdf.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {pdf.metadata && (
            <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Info size={16} />
                Document Details
              </h4>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Original Filename:</dt>
                  <dd className="font-mono">{pdf.metadata.originalFilename}</dd>
                </div>
                {pdf.metadata.checksum && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Checksum:</dt>
                    <dd className="font-mono text-xs truncate max-w-[200px]">{pdf.metadata.checksum.slice(0, 16)}...</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Uploaded:</dt>
                  <dd>{new Date(pdf.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
