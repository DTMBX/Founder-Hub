import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Case, PDFAsset } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { GlassCard } from '@/components/ui/glass-card'
import { GlassButton } from '@/components/ui/glass-button'
import { Eye, Copy } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from 'sonner'

interface CourtSectionProps {
  investorMode: boolean
}

export default function CourtSection({ investorMode }: CourtSectionProps) {
  const [cases] = useKV<Case[]>('founder-hub-cases', [])
  const [pdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true })
  const prefersReducedMotion = useReducedMotion()
  const isMobile = useIsMobile()

  const visibleCases = cases
    ?.filter(c => c.visibility === 'public' || c.visibility === 'unlisted')
    .sort((a, b) => a.order - b.order) || []

  if (visibleCases.length === 0) return null

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

  const getCasePDFs = (caseId: string) => {
    return pdfs?.filter(pdf => 
      pdf.caseId === caseId && 
      (pdf.visibility === 'public' || pdf.visibility === 'unlisted')
    ) || []
  }

  const copyShareLink = (pdfId: string) => {
    const link = `${window.location.origin}/pdf/${pdfId}`
    navigator.clipboard.writeText(link)
    toast.success('Share link copied to clipboard')
  }

  const CaseDetailsContent = () => {
    if (!selectedCase) return null

    return (
      <>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">{selectedCase.title}</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{selectedCase.court}</p>
              <p className="font-mono text-accent">{selectedCase.docket}</p>
              <p>{selectedCase.dateRange}</p>
            </div>
          </div>
          <Badge className={getStatusColor(selectedCase.status)} variant="outline">
            {selectedCase.status}
          </Badge>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-2 text-lg">Overview</h4>
            <p className="text-muted-foreground leading-relaxed">
              {selectedCase.description || selectedCase.summary}
            </p>
          </div>

          {selectedCase.tags && selectedCase.tags.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-lg">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCase.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-4 text-lg">Documents</h4>
            <div className="space-y-3">
              {getCasePDFs(selectedCase.id).map(pdf => (
                <GlassCard key={pdf.id} intensity="low" className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h5 className="font-medium mb-1">{pdf.title}</h5>
                      <p className="text-sm text-muted-foreground mb-2">{pdf.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{(pdf.fileSize / 1024).toFixed(0)} KB</span>
                        <span>•</span>
                        <span>{new Date(pdf.createdAt).toLocaleDateString()}</span>
                        {pdf.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <GlassButton size="sm" variant="glassGhost">
                        <Eye />
                      </GlassButton>
                      <GlassButton size="sm" variant="glassGhost" onClick={() => copyShareLink(pdf.id)}>
                        <Copy />
                      </GlassButton>
                    </div>
                  </div>
                </GlassCard>
              ))}
              {getCasePDFs(selectedCase.id).length === 0 && (
                <p className="text-sm text-muted-foreground">No documents available.</p>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <section id="court" className="relative py-16 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden" ref={ref}>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background -z-10" />
        <div className="section-separator absolute top-0 left-0 right-0" />
        
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Court & Accountability</h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-4 max-w-3xl leading-relaxed">
              Transparent access to court proceedings and legal documentation.
            </p>
            <p className="text-sm text-muted-foreground/80 mb-12 lg:mb-16 max-w-3xl italic">
              Documents are provided for transparency and informational context. All materials are publicly available records or authorized disclosures.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {visibleCases.map((courtCase, index) => (
              <motion.div
                key={courtCase.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : index * 0.1 }}
              >
                <GlassCard
                  intensity="medium"
                  className="h-full cursor-pointer group hover:shadow-2xl hover:shadow-accent/10 hover:-translate-y-1 transition-all duration-300"
                  onClick={() => setSelectedCase(courtCase)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-semibold leading-tight group-hover:text-accent transition-colors">
                        {courtCase.title}
                      </h3>
                      <Badge className={getStatusColor(courtCase.status)} variant="outline">
                        {courtCase.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm mb-4">
                      <p className="text-muted-foreground">{courtCase.court}</p>
                      <p className="font-mono text-xs text-accent">{courtCase.docket}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {courtCase.summary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40">
                      <span>{courtCase.dateRange}</span>
                      <span className="font-medium">{getCasePDFs(courtCase.id).length} docs</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {isMobile ? (
        <Drawer open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
          <DrawerContent className="max-h-[90vh] bg-background/95 backdrop-blur-xl">
            <DrawerHeader>
              <DrawerTitle>Case Details</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-8 overflow-y-auto">
              <CaseDetailsContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="sr-only">Case Details</DialogTitle>
            </DialogHeader>
            <CaseDetailsContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
