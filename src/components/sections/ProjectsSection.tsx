import { useKV } from '@/lib/local-storage-kv'
import { Project } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { GlassButton } from '@/components/ui/glass-button'
import { GlassCard } from '@/components/ui/glass-card'
import { GithubLogo, Globe, BookOpen, FolderOpen, ArrowSquareOut, Star } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

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

export default function ProjectsSection({ investorMode }: ProjectsSectionProps) {
  const [projects] = useKV<Project[]>('founder-hub-projects', [])
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true })
  const prefersReducedMotion = useReducedMotion()

  const enabledProjects = projects
    ?.filter(p => p.enabled)
    .sort((a, b) => a.order - b.order) || []

  const linkIcon = (type: string) => {
    switch (type) {
      case 'repo': return <GithubLogo className="h-4 w-4" />
      case 'demo': return <ArrowSquareOut className="h-4 w-4" />
      case 'docs': return <BookOpen className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  const containerVariants = prefersReducedMotion
    ? undefined
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { staggerChildren: 0.1 }
      }

  const itemVariants = prefersReducedMotion
    ? undefined
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      }

  return (
    <section id="projects" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background -z-10" />
      <div className="section-separator absolute top-0 left-0 right-0" />
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            {investorMode ? 'Investment Opportunities' : 'What I Build'}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-4 max-w-3xl leading-relaxed">
            {investorMode 
              ? 'Active projects seeking funding and partnership. Each initiative is designed for measurable impact and sustainable growth.'
              : 'I am actively building an MMORPG and managing multiple client web services. My work spans transformative solutions at the intersection of technology, gaming, transparency, and justice—delivering scalable, professional services for individuals, businesses, and agencies.'
            }
          </p>
          {investorMode && (
            <div className="flex flex-wrap items-center gap-3 mb-12 lg:mb-16">
              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-sm px-4 py-1.5">
                Open to Investment
              </Badge>
              <a 
                href="mailto:invest@xtx396.com" 
                className="text-sm text-emerald-400 hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/40 hover:decoration-emerald-400 transition-colors"
              >
                invest@xtx396.com
              </a>
            </div>
          )}
          {!investorMode && <div className="mb-12 lg:mb-16" />}
        </motion.div>

        {enabledProjects.length === 0 ? (
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center py-6"
          >
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground/70">Projects loading or not yet configured.</p>
          </motion.div>
        ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate={isVisible ? 'animate' : 'initial'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {enabledProjects.map((project, index) => {
            const accent = accentClasses[project.customization?.accentColor || ''] || defaultAccent

            return (
            <motion.div
              key={project.id}
              variants={itemVariants}
              transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : index * 0.1 }}
            >
              <GlassCard 
                intensity="medium"
                className={`h-full group hover:shadow-2xl ${accent.shadow} hover:-translate-y-1 ${accent.card} transition-all duration-300`}
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className={`text-xl font-semibold ${accent.text} transition-colors`}>
                        {project.title}
                      </h3>
                      {project.featured && (
                        <Star className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" weight="fill" />
                      )}
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {investorMode ? project.description : project.summary}
                    </p>
                  </div>

                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {project.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[11px] font-medium px-2 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.techStack.map(tech => (
                        <span key={tech} className="text-[10px] font-mono text-muted-foreground/70 bg-muted/30 rounded px-1.5 py-0.5">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-border/30">
                    {project.customization?.badgeText && (
                      <Badge className={`${accent.badge} text-[11px] px-2.5 py-0.5`}>
                        {project.customization.badgeText}
                      </Badge>
                    )}
                    {project.links && project.links.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 ml-auto">
                        {project.links.map((link, i) => (
                          <GlassButton
                            key={i}
                            variant="glassGhost"
                            size="sm"
                            asChild
                          >
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                              {linkIcon(link.type)}
                              <span className="text-xs">{link.label}</span>
                            </a>
                          </GlassButton>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
            )
          })}
        </motion.div>
        )}
      </div>
    </section>
  )
}
