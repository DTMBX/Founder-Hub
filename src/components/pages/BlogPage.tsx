import { ArrowLeft, CalendarBlank, Tag } from '@phosphor-icons/react'
import { useEffect } from 'react'

import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import { POSTS } from '@/data/posts'

const CATEGORY_LABELS: Record<string, string> = {
  platform: 'Platform',
  project: 'Project',
  ecosystem: 'Ecosystem',
  update: 'Update',
}

const CATEGORY_COLORS: Record<string, string> = {
  platform: 'bg-emerald-500/10 text-emerald-400',
  project: 'bg-blue-500/10 text-blue-400',
  ecosystem: 'bg-violet-500/10 text-violet-400',
  update: 'bg-amber-500/10 text-amber-400',
}

interface BlogPageProps {
  onBack: () => void
  onNavigateToPost: (id: string) => void
}

export default function BlogPage({ onBack, onNavigateToPost }: BlogPageProps) {
  const sorted = [...POSTS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  useEffect(() => { document.title = 'Blog — Devon Tyler' }, [])

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <SectionContainer className="py-12 sm:py-16">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" weight="bold" />
            Back
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground mb-10">
            Updates from the Evident Technologies ecosystem and ongoing projects.
          </p>

          <div className="space-y-4">
            {sorted.map(post => {
              const cat = CATEGORY_LABELS[post.category] ?? post.category
              const color = CATEGORY_COLORS[post.category] ?? 'bg-muted text-muted-foreground'

              return (
                <GlassCard
                  key={post.id}
                  intensity="subtle"
                  className="p-5 sm:p-6 cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all"
                  onClick={() => onNavigateToPost(post.id)}
                >
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="inline-flex items-center gap-1">
                      <CalendarBlank className="h-3.5 w-3.5" weight="bold" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
                      <Tag className="h-3 w-3" weight="bold" />
                      {cat}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold mb-1">{post.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.summary}</p>
                </GlassCard>
              )
            })}
          </div>
        </SectionContainer>
      </div>
    </>
  )
}
