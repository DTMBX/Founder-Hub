import { useKV } from '@github/spark/hooks'
import { Project } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { GlassButton } from '@/components/ui/glass-button'
import { GlassCard } from '@/components/ui/glass-card'
import { GithubLogo, Globe, BookOpen } from '@phosphor-icons/react'
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

  if (enabledProjects.length === 0) return null

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
    <section id="projects" className="py-16 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8" ref={ref}>
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">What I Build</h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 lg:mb-16 max-w-3xl leading-relaxed">
            Transformative solutions at the intersection of technology, governance, and justice.
          </p>
        </motion.div>

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
                className="h-full group hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="p-6 flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors">
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
      </div>
    </section>
  )
}
