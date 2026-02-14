import { useKV } from '@github/spark/hooks'
import { Project } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GithubLogo, Globe, BookOpen } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface ProjectsSectionProps {
  investorMode: boolean
}

export default function ProjectsSection({ investorMode }: ProjectsSectionProps) {
  const [projects] = useKV<Project[]>('founder-hub-projects', [])

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

  return (
    <section id="projects" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">What I Build</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
            Transformative solutions at the intersection of technology, governance, and justice.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enabledProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {project.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map(tech => (
                        <Badge key={tech} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {project.links && project.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {project.links.map((link, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                            {linkIcon(link.type)}
                            {link.label}
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
