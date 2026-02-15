import { useKV } from '@/lib/local-storage-kv'
import { Project } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { GlassButton } from '@/components/ui/glass-button'
import { GlassCard } from '@/components/ui/glass-card'
import { GithubLogo, Globe, BookOpen, FolderOpen } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

interface ProjectsSectionProps {
  investorMode: boolean
}

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
      case 'demo': return <Globe className="h-4 w-4" />
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
              : 'Transformative solutions at the intersection of technology, home improvement, transparency, and justice.'
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            <GlassCard intensity="medium" className="group hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-emerald-400 transition-colors">
                    Evident Technologies®
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    AI-powered litigation support and evidence analysis platform for legal professionals
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs font-medium">Legal Tech</Badge>
                  <Badge variant="secondary" className="text-xs font-medium">AI/ML</Badge>
                  <Badge variant="secondary" className="text-xs font-medium">Document Intelligence</Badge>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-4">
                  <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1">
                    In Development
                  </Badge>
                </div>
              </div>
            </GlassCard>

            <GlassCard intensity="medium" className="group hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-emerald-400 transition-colors">
                    Essential Goods Ledger
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Blockchain-based platform for tracking public accountability and transparency
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs font-medium">Civic Tech</Badge>
                  <Badge variant="secondary" className="text-xs font-medium">Blockchain</Badge>
                  <Badge variant="secondary" className="text-xs font-medium">Transparency</Badge>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-4">
                  <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1">
                    In Development
                  </Badge>
                </div>
              </div>
            </GlassCard>

            <GlassCard intensity="medium" className="group hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300">
              <div className="p-6 flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-emerald-400 transition-colors">
                    Contractor Command Center
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Comprehensive platform for home improvement project management and contractor coordination
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs font-medium">Home Tech</Badge>
                  <Badge variant="secondary" className="text-xs font-medium">SaaS</Badge>
                  <Badge variant="secondary" className="text-xs font-medium">Project Management</Badge>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-4">
                  <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1">
                    In Development
                  </Badge>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate={isVisible ? 'animate' : 'initial'}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {enabledProjects.map((project, index) => (
            <motion.div
              key={project.id}
              variants={itemVariants}
              transition={{ duration: 0.5, delay: prefersReducedMotion ? 0 : index * 0.1 }}
            >
              <GlassCard 
                intensity="medium"
                className="h-full group hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-emerald-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {project.summary}
                    </p>
                  </div>
                  
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.techStack.map(tech => (
                        <Badge key={tech} variant="secondary" className="text-xs font-medium">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {project.links && project.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-auto pt-4">
                      {project.links.map((link, i) => (
                        <GlassButton
                          key={i}
                          variant="glassGhost"
                          size="sm"
                          asChild
                        >
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {linkIcon(link.type)}
                            {link.label}
                          </a>
                        </GlassButton>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
        )}
      </div>
    </section>
  )
}
