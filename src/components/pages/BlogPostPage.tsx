import { ArrowLeft, CalendarBlank, Tag } from '@phosphor-icons/react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useEffect, useMemo } from 'react'

import { SectionContainer } from '@/components/ui/section-container'
import type { PostEntry } from '@/data/posts'
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

interface BlogPostPageProps {
  postId: string
  onBack: () => void
}

export default function BlogPostPage({ postId, onBack }: BlogPostPageProps) {
  const post: PostEntry | undefined = POSTS.find(p => p.id === postId)

  useEffect(() => {
    document.title = post ? `${post.title} — Devon Tyler` : 'Post Not Found'
  }, [post])

  const html = useMemo(() => {
    if (!post) return ''
    const raw = marked.parse(post.contentMarkdown, { async: false }) as string
    return DOMPurify.sanitize(raw)
  }, [post])

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <h1 className="text-4xl font-bold text-muted-foreground">Post not found</h1>
        <button onClick={onBack} className="mt-4 px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Back to Blog
        </button>
      </div>
    )
  }

  const cat = CATEGORY_LABELS[post.category] ?? post.category
  const color = CATEGORY_COLORS[post.category] ?? 'bg-muted text-muted-foreground'

  // BlogPosting JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: post.date,
    author: { '@type': 'Person', name: 'Devon Tyler Barber' },
    publisher: { '@type': 'Organization', name: 'Evident Technologies LLC' },
    description: post.summary,
    mainEntityOfPage: `https://devon-tyler.com/#blog/${post.id}`,
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SectionContainer className="py-12 sm:py-16 max-w-3xl">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" weight="bold" />
          All Posts
        </button>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="inline-flex items-center gap-1">
            <CalendarBlank className="h-3.5 w-3.5" weight="bold" />
            {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
            <Tag className="h-3 w-3" weight="bold" />
            {cat}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-6">{post.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{post.summary}</p>

        <div
          className="prose prose-invert prose-sm sm:prose-base max-w-none
            prose-headings:font-semibold prose-headings:text-foreground
            prose-p:text-muted-foreground prose-li:text-muted-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </SectionContainer>
    </div>
  )
}
