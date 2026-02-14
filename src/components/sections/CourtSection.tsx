import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Case, PDFAsset } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, Download, Copy } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface CourtSectionProps {
  investorMode: boolean
}

export default function CourtSection({ investorMode }: CourtSectionProps) {
  const [cases] = useKV<Case[]>('founder-hub-cases', [])
  const [pdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)

  const visibleCases = cases
    ?.filter(c => c.visibility === 'public' || c.visibility === 'unlisted')
    .sort((a, b) => a.order - b.order) || []

  if (visibleCases.length === 0) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-accent text-accent-foreground'
      case 'settled': return 'bg-green-500/20 text-green-400'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'closed': return 'bg-gray-500/20 text-gray-400'
      case 'dismissed': return 'bg-blue-500/20 text-blue-400'
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

  return (
    <>
      <section id="court" className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Court & Accountability</h2>
            <p className="text-lg text-muted-foreground mb-4 max-w-2xl">
              Transparent access to court proceedings and legal documentation.
            </p>
            <p className="text-sm text-muted-foreground/80 mb-12 max-w-3xl italic">
              Documents are provided for transparency and informational context. All materials are publicly available records or authorized disclosures.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCases.map((courtCase, index) => (
              <motion.div
                key={courtCase.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedCase(courtCase)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg leading-tight">{courtCase.title}</CardTitle>
                      <Badge className={getStatusColor(courtCase.status)}>
                        {courtCase.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">{courtCase.court}</p>
                      <p className="font-mono text-xs text-accent">{courtCase.docket}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-3 leading-relaxed">
                      {courtCase.summary}
                    </CardDescription>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{courtCase.dateRange}</span>
                      <span>{getCasePDFs(courtCase.id).length} docs</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!selectedCase} onOpenChange={() => setSelectedCase(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedCase && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-2xl mb-2">{selectedCase.title}</DialogTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">{selectedCase.court}</p>
                      <p className="font-mono text-accent">{selectedCase.docket}</p>
                      <p>{selectedCase.dateRange}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedCase.status)}>
                    {selectedCase.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                <div>
                  <h4 className="font-semibold mb-2">Overview</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedCase.description || selectedCase.summary}
                  </p>
                </div>

                {selectedCase.tags && selectedCase.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCase.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-3">Documents</h4>
                  <div className="space-y-3">
                    {getCasePDFs(selectedCase.id).map(pdf => (
                      <Card key={pdf.id} className="p-4">
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
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => copyShareLink(pdf.id)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {getCasePDFs(selectedCase.id).length === 0 && (
                      <p className="text-sm text-muted-foreground">No documents available.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
