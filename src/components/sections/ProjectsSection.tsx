import { useState } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { Project } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { GlassButton } from '@/components/ui/glass-button'
import { GlassCard } from '@/components/ui/glass-card'
import { GithubLogo, Globe, BookOpen, ArrowSquareOut, ArrowRight, ShieldCheck, Wrench, CaretDown } from '@phosphor-icons/react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { ECOSYSTEM_DEFAULTS } from '@/lib/project-defaults'
import { PROJECT_REGISTRY } from '@/data/projects'
import { cn } from '@/lib/utils'

interface ProjectsSectionProps {
  investorMode: boolean
}

const accentClasses: Record<string, { card: string; text: string; badge: string; shadow: string }> = {
  emerald: {
    card: 'hover:border-emerald-500/30',
    text: 'group-hover:text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    shadow: 'hover:shadow-emerald-500/10',
  },
  amber: {
    card: 'hover:border-amber-500/30',
    text: 'group-hover:text-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    shadow: 'hover:shadow-amber-500/10',
  },
  blue: {
    card: 'hover:border-blue-500/30',
    text: 'group-hover:text-blue-400',
    badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    shadow: 'hover:shadow-blue-500/10',
  },
  teal: {
    card: 'hover:border-teal-500/30',
    text: 'group-hover:text-teal-400',
    badge: 'bg-teal-500/15 text-teal-400 border border-teal-500/30',
    shadow: 'hover:shadow-teal-500/10',
  },
  rose: {
    card: 'hover:border-rose-500/30',
    text: 'group-hover:text-rose-400',
    badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    shadow: 'hover:shadow-rose-500/10',
  },
}

const defaultAccent = accentClasses.emerald

/** IDs that get flagship hero cards instead of grid cards */
const FLAGSHIP_IDS = ['evident-platform', 'tillerstead'] as const
const FLAGSHIP_META: Record<string, { icon: typeof ShieldCheck; route: string; domain: string }> = {
  'evident-platform': { icon: ShieldCheck, route: '#evident', domain: 'xtx396.com' },
  'tillerstead': { icon: Wrench, route: '#tillerstead', domain: 'tillerstead.com' },
}

export default function ProjectsSection({ investorMode }: ProjectsSectionProps) {
  const [projects] = useKV<Project[]>('founder-hub-projects', [])
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true })
  const prefersReducedMotion = useReducedMotion()
  const [expanded, setExpanded] = useState(false)

  const kvProjects = projects?.filter(p => p.enabled).sort((a, b) => a.order - b.order) || []
  const allProjects = kvProjects.length > 0 ? kvProjects : ECOSYSTEM_DEFAULTS

  // Filter out founder-hub (we're already on it) and split flagships from satellites
  const enabledProjects = allProjects.filter(p => p.id !== 'founder-hub')
  const flagships = enabledProjects.filter(p => (FLAGSHIP_IDS as readonly string[]).includes(p.id))
  const satellites = enabledProjects.filter(p => !(FLAGSHIP_IDS as readonly string[]).includes(p.id))

  // Group satellites by category
  const evidentSatellites = satellites.filter(p => {
    const entry = PROJECT_REGISTRY.find(r => r.id === p.id)
    return entry?.category === 'civic-tech' || entry?.category === 'software-platform'
  })
  const homeSatellites = satellites.filter(p => {
    const entry = PROJECT_REGISTRY.find(r => r.id === p.id)
    return entry?.category === 'home-improvement'
  })

  const linkIcon = (type: string) => {
    switch (type) {
      case 'repo': return <GithubLogo className="h-4 w-4" />
      case 'demo': return <ArrowSquareOut className="h-4 w-4" />
      case 'docs': return <BookOpen className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const renderProjectCard = (project: Project, index: number) => {
    const accent = accentClasses[project.customization?.accentColor || ''] || defaultAccent
    return (
      <motion.div
        key={project.id}
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: prefersReducedMotion ? 0 : index * 0.06 }}
      >
        <a href={`#project/${project.id}`} className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
          <GlassCard
            intensity="medium"
            className={cn('h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5', accent.card, accent.shadow)}
          >
            <div className="p-5 flex flex-col h-full">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={cn('text-base font-semibold transition-colors', accent.text)}>{project.title}</h3>
                <span className="text-[10px] uppercase tracking-wider font-medium text-emerald-400 whitespace-nowrap">Live</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                {investorMode ? project.description : project.summary}
              </p>
              {project.links && project.links.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-border/20">
                  {project.links.map((link, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {linkIcon(link.type)}
                      <span>{link.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </a>
      </motion.div>
    )
  }

  return (
    <section id="projects" className="relative px-4 sm:px-6 lg:px-8 overflow-hidden py-12 sm:py-16" ref={ref} data-content-section="projects" data-kv-key="founder-hub-projects" data-admin-tab="projects">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background -z-10" />
      <div className="section-separator absolute top-0 left-0 right-0" />
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            {investorMode ? 'Investment Opportunities' : 'What I Build'}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            {investorMode
              ? 'Active projects seeking funding and partnership.'
              : 'Two flagship businesses and a suite of satellite applications — all live, open source, and transparently governed.'
            }
          </p>
          {investorMode && (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-sm px-4 py-1.5">
                Open to Investment
              </Badge>
              <a
                href="mailto:iv@devon-tyler.com"
                className="text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-400 transition-colors"
              >
                iv@devon-tyler.com
              </a>
            </div>
          )}
        </motion.div>

        {/* ── Flagship hero cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {flagships.map((project) => {
            const meta = FLAGSHIP_META[project.id]
            if (!meta) return null
            const accent = accentClasses[project.customization?.accentColor || ''] || defaultAccent
            return (
              <motion.a
                key={project.id}
                href={meta.route}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              >
                <GlassCard intensity="high" className={cn('h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1', accent.card)}>
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <div className={cn('p-3 rounded-xl border', accent.badge)}>
                        <meta.icon className="h-6 w-6" weight="duotone" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={cn('text-lg font-bold transition-colors', accent.text)}>{project.title}</h3>
                        <span className="text-xs text-muted-foreground font-mono">{meta.domain}</span>
                      </div>
                      <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{project.summary}</p>
                  </div>
                </GlassCard>
              </motion.a>
            )
          })}
        </div>

        {/* ── Satellite grid — collapsed by default, shows first row ── */}
        <div>
          {/* E-Discovery satellites */}
          {evidentSatellites.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">E-Discovery &amp; Civic Tech</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {(expanded ? evidentSatellites : evidentSatellites.slice(0, 3)).map((p, i) => renderProjectCard(p, i))}
              </div>
            </div>
          )}

          {/* Home Improvement satellites — only visible when expanded or if few total */}
          <AnimatePresence>
            {(expanded || homeSatellites.length === 0) ? null : null}
          </AnimatePresence>
          {expanded && homeSatellites.length > 0 && (
            <motion.div
              initial={prefersReducedMotion ? {} : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="mb-4"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Home Improvement</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {homeSatellites.map((p, i) => renderProjectCard(p, i))}
              </div>
            </motion.div>
          )}

          {/* Show more / less toggle */}
          {(evidentSatellites.length > 3 || homeSatellites.length > 0) && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => setExpanded(prev => !prev)}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-3 py-1.5"
              >
                {expanded ? 'Show less' : `Show all ${satellites.length} projects`}
                <CaretDown className={cn('h-4 w-4 transition-transform duration-300', expanded && 'rotate-180')} weight="bold" />
              </button>

              <GlassButton asChild size="sm">
                <a href="#projects-index">
                  Full project index
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </a>
              </GlassButton>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
