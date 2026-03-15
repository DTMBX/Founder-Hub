/**
 * PortfolioGallery — Before/after project gallery for Tillerstead.
 * Filter tabs, placeholder before/after cards with descriptions,
 * status badges, and ImageObject structured data.
 */

import { ArrowRight, CheckCircle, CircleNotch, Clock, Images, MapPin, Star } from '@phosphor-icons/react'
import { AnimatePresence,motion } from 'framer-motion'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { PORTFOLIO_CATEGORIES, PORTFOLIO_PROJECTS, type PortfolioProject } from '@/data/portfolio'

interface PortfolioGalleryProps {
  className?: string
}

function StatusBadge({ status }: { status: PortfolioProject['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle size={10} weight="fill" className="mr-1" /> Completed
        </Badge>
      )
    case 'in-progress':
      return (
        <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
          <CircleNotch size={10} className="mr-1 animate-spin" /> In Progress
        </Badge>
      )
    case 'planned':
      return (
        <Badge variant="outline" className="text-blue-400 border-blue-500/30 bg-blue-500/10">
          <Clock size={10} weight="fill" className="mr-1" /> Planned
        </Badge>
      )
  }
}

export function PortfolioGallery({ className }: PortfolioGalleryProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = activeFilter === 'all'
    ? PORTFOLIO_PROJECTS
    : PORTFOLIO_PROJECTS.filter(p => p.category === activeFilter)

  return (
    <div className={className}>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter projects by category">
        {PORTFOLIO_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={activeFilter === cat.id}
            onClick={() => setActiveFilter(cat.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeFilter === cat.id
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" role="tabpanel">
        <AnimatePresence mode="popLayout">
          {filtered.map((project) => {
            const isExpanded = expandedId === project.id

            return (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
              >
                <GlassCard
                  intensity="medium"
                  className={`overflow-hidden transition-all ${
                    isExpanded ? 'ring-1 ring-emerald-500/30' : ''
                  }`}
                >
                  {/* Before/After visual */}
                  <div className="grid grid-cols-2 gap-px bg-border/20">
                    {/* Before */}
                    <div className="bg-card/30 aspect-[4/3] flex flex-col items-center justify-center text-center p-4 relative">
                      {project.beforeImage ? (
                        <img
                          src={project.beforeImage}
                          alt={`Before — ${project.title}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <Images size={28} className="text-muted-foreground/20 mb-2" />
                          <p className="text-[10px] text-muted-foreground/50 max-w-[140px]">{project.beforeLabel}</p>
                        </>
                      )}
                      <Badge variant="outline" className="absolute top-2 left-2 text-[9px] bg-background/80 backdrop-blur-sm">
                        Before
                      </Badge>
                    </div>

                    {/* After */}
                    <div className="bg-card/30 aspect-[4/3] flex flex-col items-center justify-center text-center p-4 relative">
                      {project.afterImage ? (
                        <img
                          src={project.afterImage}
                          alt={`After — ${project.title}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <>
                          <Images size={28} className="text-emerald-500/20 mb-2" />
                          <p className="text-[10px] text-muted-foreground/50 max-w-[140px]">{project.afterLabel}</p>
                        </>
                      )}
                      <Badge variant="outline" className="absolute top-2 left-2 text-[9px] bg-emerald-500/10 border-emerald-500/30 text-emerald-400 backdrop-blur-sm">
                        After
                      </Badge>
                    </div>
                  </div>

                  {/* Project info */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-sm">{project.title}</h3>
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} weight="fill" /> {project.location}
                      </span>
                      <span>{project.year}</span>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : project.id)}
                      className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? 'Show less' : 'Project details'}
                      <ArrowRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 space-y-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">{project.scope}</p>
                            <div>
                              <p className="text-xs font-medium mb-2">Highlights</p>
                              <ul className="space-y-1">
                                {project.highlights.map(h => (
                                  <li key={h} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <Star size={10} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No projects in this category yet.
        </div>
      )}
    </div>
  )
}
