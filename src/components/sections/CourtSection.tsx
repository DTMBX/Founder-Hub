import { useKV } from '@github/spark/hooks'
import { Case, PDFAsset } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { Eye, Files, Calendar, Gavel, MapPin } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

interface CourtSectionProps {
  investorMode: boolean
  onNavigateToCase: (caseId: string) => void
}

export default function CourtSection({ investorMode, onNavigateToCase }: CourtSectionProps) {
  const [cases] = useKV<Case[]>('founder-hub-cases', [])
  const [pdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true })
  const prefersReducedMotion = useReducedMotion()

  const visibleCases = cases
    ?.filter(c => c.visibility === 'public' || c.visibility === 'unlisted')
    .sort((a, b) => a.order - b.order) || []

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

  return (
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

        {visibleCases.length === 0 ? (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <GlassCard intensity="low" className="p-12 text-center">
              <p className="text-muted-foreground text-lg">No cases available at this time.</p>
            </GlassCard>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-6">
            {visibleCases.map((courtCase, index) => {
              const docCount = getCasePDFs(courtCase.id).length
              return (
              <motion.div
                key={courtCase.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : index * 0.1 }}
              >
                <GlassCard
                  intensity="high"
                  className="h-full cursor-pointer group hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1 transition-all duration-300 hover:border-amber-500/30"
                  onClick={() => onNavigateToCase(courtCase.id)}
                >
                  <div className="p-6">
                    {/* Header: Title + Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className="text-lg font-bold leading-tight group-hover:text-amber-400 transition-colors line-clamp-2">
                        {courtCase.title}
                      </h3>
                      <Badge className={`${getStatusColor(courtCase.status)} shrink-0 text-[11px] font-semibold uppercase tracking-wide`} variant="outline">
                        {courtCase.status}
                      </Badge>
                    </div>

                    {/* Court + Docket info row */}
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin size={14} className="shrink-0 text-amber-500/60" />
                        <span className="truncate">{courtCase.court}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gavel size={14} className="shrink-0 text-amber-500/60" />
                        <span className="font-mono text-xs text-amber-400/80">{courtCase.docket}</span>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3">
                      {courtCase.summary}
                    </p>

                    {/* Footer: Date + Doc count + View */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {courtCase.dateRange}
                        </span>
                        {docCount > 0 && (
                          <span className="flex items-center gap-1 text-amber-400/70">
                            <Files size={12} />
                            {docCount} doc{docCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                        <Eye size={14} />
                        Details
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
