import { useKV } from '@/lib/local-storage-kv'
import { Case, PDFAsset } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { Eye, Files, Calendar, Gavel, MapPin } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { CollapsibleSection } from '../ui/collapsible-section'

interface CourtSectionProps {
  investorMode: boolean
  onNavigateToCase: (caseId: string) => void
}

export default function CourtSection({ investorMode, onNavigateToCase }: CourtSectionProps) {
  const [cases] = useKV<Case[]>('founder-hub-court-cases', [])
  const [pdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
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
    <CollapsibleSection
      id="court"
      title="Court &amp; Accountability"
      subtitle="Transparent access to public records"
      count={visibleCases.length || undefined}
      accent="amber"
      defaultOpen={false}
      data-content-section="court"
      data-kv-key="founder-hub-court-cases,founder-hub-pdfs"
      data-admin-tab="court"
    >
      <p className="text-xs text-muted-foreground/70 mb-6 max-w-2xl italic">
        Documents are provided for transparency and informational context. All materials are publicly available records or authorized disclosures.
      </p>

      {visibleCases.length === 0 ? (
        <GlassCard intensity="low" className="p-8 text-center">
          <p className="text-muted-foreground">No cases available at this time.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {visibleCases.map((courtCase, index) => {
            const docCount = getCasePDFs(courtCase.id).length
            return (
              <motion.div
                key={courtCase.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : index * 0.06 }}
              >
                <GlassCard
                  intensity="medium"
                  className="h-full cursor-pointer group hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all duration-300 hover:border-amber-500/30"
                  onClick={() => onNavigateToCase(courtCase.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold leading-tight group-hover:text-amber-400 transition-colors line-clamp-1">
                        {courtCase.title}
                      </h3>
                      <Badge className={`${getStatusColor(courtCase.status)} shrink-0 text-[10px] font-semibold uppercase tracking-wide`} variant="outline">
                        {courtCase.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={12} className="shrink-0 text-amber-500/60" />
                        {courtCase.court}
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <Gavel size={12} className="text-amber-500/60" />
                        <span className="font-mono text-[10px] text-amber-400/80">{courtCase.docket}</span>
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                      {courtCase.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 pt-2 border-t border-border/20">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {courtCase.dateRange}
                        </span>
                        {docCount > 0 && (
                          <span className="flex items-center gap-1 text-amber-400/70">
                            <Files size={10} />
                            {docCount}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                        <Eye size={12} />
                        View
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>
      )}
    </CollapsibleSection>
  )
}
