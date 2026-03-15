import { ArrowRight } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { ProjectCard } from '@/components/ProjectCard'
import { GlassButton } from '@/components/ui/glass-button'
import { PROJECT_REGISTRY } from '@/data/projects'
import { toRuntimeProject } from '@/lib/project-defaults'

/** Show the top N projects (excluding founder-hub — we're on it) */
const FEATURED_COUNT = 6

/** Flagship IDs that link to internal showcase pages instead of project detail */
const SHOWCASE_ROUTES: Record<string, string> = {
  'evident-platform': '#evident',
  'tillerstead': '#tillerstead',
}

/** Priority ordering: flagships first, then by registry order */
const PRIORITY_IDS = ['evident-platform', 'tillerstead']

export default function FeaturedProjects() {
  const prefersReducedMotion = useReducedMotion()

  const eligible = PROJECT_REGISTRY.filter(p => p.id !== 'founder-hub')
  // Sort: priority IDs first, then rest in registry order
  const sorted = [
    ...PRIORITY_IDS.map(id => eligible.find(p => p.id === id)).filter(Boolean),
    ...eligible.filter(p => !PRIORITY_IDS.includes(p.id)),
  ] as typeof eligible
  const featured = sorted.slice(0, FEATURED_COUNT)

  if (featured.length === 0) return null

  return (
    <section
      id="featured-projects"
      aria-label="Featured projects"
      className="py-12 sm:py-16 border-t border-border/20"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-6 gap-4"
        >
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Current Projects</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Live platforms in the Evident ecosystem
            </p>
          </div>
          <GlassButton asChild className="hidden sm:inline-flex shrink-0" size="sm">
            <a href="#projects-index">
              View all
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </a>
          </GlassButton>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {featured.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <a
                href={SHOWCASE_ROUTES[entry.id] || `#project/${entry.id}`}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
              >
                <ProjectCard project={toRuntimeProject(entry)} compact />
              </a>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 text-center sm:hidden">
          <GlassButton asChild size="sm">
            <a href="#projects-index">
              View all projects
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </a>
          </GlassButton>
        </div>
      </div>
    </section>
  )
}
