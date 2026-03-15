import { ArrowLeft, ArrowSquareOut, BookOpen, GithubLogo, Globe } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import type { ProjectEntry } from '@/data/projects'
import { getProjectById } from '@/data/projects'
import { usePageMeta } from '@/hooks/use-page-meta'

interface ProjectPageProps {
  projectId: string
  onBack: () => void
}

function buildSoftwareAppSchema(project: ProjectEntry) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': project.name,
    'description': project.description,
    'applicationCategory': project.category === 'civic-tech' ? 'GovernmentApplication' : project.category === 'home-improvement' ? 'LifestyleApplication' : 'WebApplication',
    'operatingSystem': 'Web',
    'url': project.url || `https://devon-tyler.com/#project/${project.id}`,
    'creator': {
      '@type': 'Person',
      'name': 'Devon Tyler Barber',
      'url': 'https://devon-tyler.com',
    },
  }
}

export default function ProjectPage({ projectId, onBack }: ProjectPageProps) {
  const project = getProjectById(projectId)

  usePageMeta({
    title: project ? project.name : 'Project Not Found',
    description: project?.tagline || 'Project detail page.',
    path: `/projects/${projectId}`,
    jsonLd: project ? [buildSoftwareAppSchema(project)] : undefined,
  })

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <h1 className="text-4xl font-bold text-muted-foreground">Project Not Found</h1>
        <p className="text-muted-foreground">The project you are looking for does not exist.</p>
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to Projects
        </Button>
      </div>
    )
  }

  const statusLabel = project.status === 'live' ? 'Live' : project.status === 'in-development' ? 'In Development' : 'Research'
  const statusColor = project.status === 'live' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : project.status === 'in-development' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-muted text-muted-foreground border-border'

  const categoryLabel = project.category === 'civic-tech' ? 'Civic Technology' : project.category === 'home-improvement' ? 'Home Improvement' : 'Software Platform'

  const linkIcon = (type: string) => {
    switch (type) {
      case 'repo': return <GithubLogo className="h-4 w-4" aria-hidden="true" />
      case 'demo': return <ArrowSquareOut className="h-4 w-4" aria-hidden="true" />
      case 'docs': return <BookOpen className="h-4 w-4" aria-hidden="true" />
      default: return <Globe className="h-4 w-4" aria-hidden="true" />
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back navigation */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All Projects
            </Button>
          </div>
        </div>
      </div>

      <SectionContainer maxWidth="5xl" separator={false} className="pt-12 sm:pt-16 pb-16">
        {/* ── Overview ── */}
        <section aria-labelledby="project-overview">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h1 id="project-overview" className="text-4xl sm:text-5xl font-bold">{project.name}</h1>
            <Badge variant="secondary" className={`text-xs px-3 py-1 border w-fit ${statusColor}`}>
              {statusLabel}
            </Badge>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mb-10">
            {project.tagline}
          </p>
        </section>

        {/* ── Purpose ── */}
        <section aria-labelledby="project-purpose" className="mb-10">
          <h2 id="project-purpose" className="text-2xl font-semibold mb-4">Purpose</h2>
          <div className="prose prose-invert max-w-3xl">
            <p className="text-muted-foreground leading-relaxed">{project.description}</p>
          </div>
        </section>

        {/* ── Technology ── */}
        <section aria-labelledby="project-technology" className="mb-10">
          <h2 id="project-technology" className="text-2xl font-semibold mb-4">Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {project.techStack.length > 0 && (
              <GlassCard intensity="medium" className="p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map(tech => (
                    <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                  ))}
                </div>
              </GlassCard>
            )}
            <GlassCard intensity="medium" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Details</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">{categoryLabel}</Badge>
                {project.repoLanguage && (
                  <Badge variant="secondary" className="text-xs bg-violet-500/15 text-violet-400 border border-violet-500/30">
                    {project.repoLanguage}
                  </Badge>
                )}
                {project.owner && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {project.owner}
                  </Badge>
                )}
              </div>
              {project.domain && (
                <p className="text-xs text-muted-foreground/60 mt-3">{project.domain}</p>
              )}
            </GlassCard>
          </div>
        </section>

        {/* ── Current Status ── */}
        <section aria-labelledby="project-status" className="mb-10">
          <h2 id="project-status" className="text-2xl font-semibold mb-4">Current Status</h2>
          <GlassCard intensity="medium" className="p-6">
            <div className="flex items-center gap-3">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${project.status === 'live' ? 'bg-emerald-400' : project.status === 'in-development' ? 'bg-amber-400' : 'bg-muted-foreground'}`} aria-hidden="true" />
              <span className="font-medium">{statusLabel}</span>
              <span className="text-muted-foreground text-sm">—</span>
              <span className="text-muted-foreground text-sm">{categoryLabel}</span>
            </div>
          </GlassCard>
        </section>

        {/* ── Links ── */}
        <section aria-labelledby="project-links">
          <h2 id="project-links" className="text-2xl font-semibold mb-4">Links</h2>
          <div className="flex flex-wrap gap-3">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-sm text-foreground transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {linkIcon('demo')}
                Visit Site
              </a>
            )}
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-sm text-foreground transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {linkIcon('repo')}
                Source Code
              </a>
            )}
            {project.documentationUrl && (
              <a
                href={project.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 text-sm text-foreground transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {linkIcon('docs')}
                Documentation
              </a>
            )}
          </div>
        </section>
      </SectionContainer>
    </div>
  )
}
