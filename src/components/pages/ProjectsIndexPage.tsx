import { ArrowLeft } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'

import { ProjectCard } from '@/components/ProjectCard'
import { Button } from '@/components/ui/button'
import { SectionContainer } from '@/components/ui/section-container'
import type { ProjectCategory } from '@/data/projects'
import { PROJECT_CATEGORIES, PROJECT_REGISTRY } from '@/data/projects'
import { usePageMeta } from '@/hooks/use-page-meta'
import { toRuntimeProject } from '@/lib/project-defaults'
import { cn } from '@/lib/utils'

interface ProjectsIndexPageProps {
  onBack: () => void
  onNavigateToProject: (projectId: string) => void
}

export default function ProjectsIndexPage({ onBack, onNavigateToProject }: ProjectsIndexPageProps) {
  const [activeFilter, setActiveFilter] = useState<ProjectCategory | 'all'>('all')
  const prefersReducedMotion = useReducedMotion()

  const filtered = activeFilter === 'all'
    ? PROJECT_REGISTRY
    : PROJECT_REGISTRY.filter(p => p.category === activeFilter)

  usePageMeta({
    title: 'Projects',
    description: 'Explore the full portfolio of civic technology, home improvement, and accountability platforms built by Devon Tyler Barber.',
    path: '/projects',
    jsonLd: [{
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'Projects — Devon Tyler Barber',
      'description': 'Portfolio of civic technology and accountability platforms.',
      'url': 'https://devon-tyler.com/#projects-index',
      'author': { '@type': 'Person', 'name': 'Devon Tyler Barber' },
    }],
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Home
            </Button>
          </div>
        </div>
      </div>

      <SectionContainer maxWidth="7xl" separator={false} className="pt-12 sm:pt-16">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">What I Build</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Live applications across the Evident ecosystem — civic technology, home improvement platforms, and accountability tools, each deployed with open-source code and transparent governance.
          </p>
        </motion.div>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2 mb-10" role="tablist" aria-label="Filter projects by category">
          {PROJECT_CATEGORIES.map(cat => (
            <button
              key={cat.value}
              role="tab"
              aria-selected={activeFilter === cat.value}
              onClick={() => setActiveFilter(cat.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                activeFilter === cat.value
                  ? 'bg-foreground/15 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" role="tabpanel">
          {filtered.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <button
                onClick={() => onNavigateToProject(entry.id)}
                className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              >
                <ProjectCard project={toRuntimeProject(entry)} />
              </button>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">No projects in this category yet.</p>
        )}
      </SectionContainer>
    </div>
  )
}
