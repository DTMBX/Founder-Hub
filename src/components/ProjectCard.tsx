import { ArrowSquareOut, BookOpen,GithubLogo, Globe } from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import type { Project } from '@/lib/types'
import { cn } from '@/lib/utils'

const accentClasses: Record<string, { card: string; text: string; badge: string }> = {
  emerald: { card: 'hover:border-emerald-500/30', text: 'group-hover:text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  amber: { card: 'hover:border-amber-500/30', text: 'group-hover:text-amber-400', badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  blue: { card: 'hover:border-blue-500/30', text: 'group-hover:text-blue-400', badge: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  teal: { card: 'hover:border-teal-500/30', text: 'group-hover:text-teal-400', badge: 'bg-teal-500/15 text-teal-400 border border-teal-500/30' },
  rose: { card: 'hover:border-rose-500/30', text: 'group-hover:text-rose-400', badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30' },
}
const defaultAccent = accentClasses.emerald

interface ProjectCardProps {
  project: Project
  /** If provided, renders the card as a link to the project detail page */
  linkTo?: string
  /** Compact mode hides tags and tech stack */
  compact?: boolean
}

export function ProjectCard({ project, linkTo, compact = false }: ProjectCardProps) {
  const accent = accentClasses[project.customization?.accentColor || ''] || defaultAccent
  const statusLabel = project.status === 'active' ? 'Live' : project.status === 'paused' ? 'In Development' : 'Research'
  const statusColor = project.status === 'active' ? 'text-emerald-400' : project.status === 'paused' ? 'text-amber-400' : 'text-muted-foreground'

  const linkIcon = (type: string) => {
    switch (type) {
      case 'repo': return <GithubLogo className="h-4 w-4" aria-hidden="true" />
      case 'demo': return <ArrowSquareOut className="h-4 w-4" aria-hidden="true" />
      case 'docs': return <BookOpen className="h-4 w-4" aria-hidden="true" />
      default: return <Globe className="h-4 w-4" aria-hidden="true" />
    }
  }

  const content = (
    <GlassCard
      intensity="medium"
      className={cn(
        'group h-full p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1',
        accent.card
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className={cn('text-lg font-semibold transition-colors', accent.text)}>
          {project.title}
        </h3>
        <span className={cn('text-[10px] uppercase tracking-wider font-medium whitespace-nowrap', statusColor)}>
          {statusLabel}
        </span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">
        {project.summary}
      </p>

      {!compact && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className={cn('text-[10px] px-2 py-0.5', accent.badge)}>
              {tag}
            </Badge>
          ))}
          {project.repoLanguage && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-violet-500/15 text-violet-400 border border-violet-500/30">
              {project.repoLanguage}
            </Badge>
          )}
        </div>
      )}

      {!compact && project.techStack.length > 0 && (
        <div className="text-[10px] text-muted-foreground/60 mb-4">
          {project.techStack.join(' · ')}
        </div>
      )}

      {!compact && project.owner && (
        <div className="text-[10px] text-muted-foreground/50 mb-4">
          {project.owner}
        </div>
      )}

      {project.links.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-auto">
          {project.links.slice(0, 3).map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {linkIcon(link.type)}
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      )}
    </GlassCard>
  )

  if (linkTo) {
    return (
      <a href={linkTo} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
        {content}
      </a>
    )
  }

  return content
}
