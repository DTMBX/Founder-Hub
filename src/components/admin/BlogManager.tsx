import {
ArrowLeft,   Article,   CalendarBlank, Eye, EyeSlash, FloppyDisk,
MagnifyingGlass,
PencilSimple,   Plus, Tag,
Trash} from '@phosphor-icons/react'
import { useCallback,useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type PostEntry,POSTS } from '@/data/posts'
import { useKV } from '@/lib/local-storage-kv'
import { cn } from '@/lib/utils'

type PostDraft = Omit<PostEntry, 'id'> & { id?: string; draft?: boolean }

const CATEGORIES: PostEntry['category'][] = ['platform', 'project', 'ecosystem', 'update']

const CATEGORY_COLORS: Record<PostEntry['category'], string> = {
  platform: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  project: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ecosystem: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  update: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || `post-${Date.now()}`
}

export default function BlogManager() {
  // KV-backed custom posts (overrides/additions to static POSTS)
  const [kvPosts, setKvPosts] = useKV<PostEntry[]>('founder-hub-blog-posts', [])
  const [draftFlags, setDraftFlags] = useKV<Record<string, boolean>>('founder-hub-blog-drafts', {})
  const [editing, setEditing] = useState<PostDraft | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<PostEntry['category'] | 'all'>('all')

  // Merge static + KV posts, KV versions override static by id
  const allPosts = useMemo(() => {
    const kvMap = new Map(kvPosts.map(p => [p.id, p]))
    const merged: PostEntry[] = []
    // Start with static posts, replacing with KV versions if they exist
    for (const post of POSTS) {
      merged.push(kvMap.get(post.id) ?? post)
      kvMap.delete(post.id)
    }
    // Add any KV-only posts
    for (const post of kvMap.values()) {
      merged.push(post)
    }
    // Sort by date descending
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return merged
  }, [kvPosts])

  const filtered = useMemo(() => {
    return allPosts.filter(p => {
      if (filterCategory !== 'all' && p.category !== filterCategory) return false
      if (search) {
        const q = search.toLowerCase()
        return p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q)
      }
      return true
    })
  }, [allPosts, filterCategory, search])

  const isDraft = useCallback((id: string) => draftFlags[id] ?? false, [draftFlags])

  const startNew = useCallback(() => {
    setEditing({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      category: 'update',
      summary: '',
      contentMarkdown: '',
      draft: true,
    })
    setIsNew(true)
    setShowPreview(false)
  }, [])

  const startEdit = useCallback((post: PostEntry) => {
    setEditing({ ...post, draft: isDraft(post.id) })
    setIsNew(false)
    setShowPreview(false)
  }, [isDraft])

  const save = useCallback(() => {
    if (!editing) return
    const id = editing.id || generateId(editing.title)
    const post: PostEntry = {
      id,
      title: editing.title,
      date: editing.date,
      category: editing.category,
      summary: editing.summary,
      contentMarkdown: editing.contentMarkdown,
    }

    setKvPosts(prev => {
      const idx = prev.findIndex(p => p.id === id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = post
        return next
      }
      return [...prev, post]
    })

    setDraftFlags(prev => ({ ...prev, [id]: !!editing.draft }))
    setEditing(null)
  }, [editing, setKvPosts, setDraftFlags])

  const deletePost = useCallback((id: string) => {
    setKvPosts(prev => prev.filter(p => p.id !== id))
    setDraftFlags(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [setKvPosts, setDraftFlags])

  const toggleDraft = useCallback((id: string) => {
    setDraftFlags(prev => ({ ...prev, [id]: !prev[id] }))
  }, [setDraftFlags])

  // Simple markdown→HTML for preview (headings, bold, italic, lists, paragraphs)
  const renderMarkdown = (md: string) => {
    const lines = md.split('\n')
    const html: string[] = []
    let inList = false

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        if (inList) { html.push('</ul>'); inList = false }
        continue
      }
      if (trimmed.startsWith('### ')) {
        if (inList) { html.push('</ul>'); inList = false }
        html.push(`<h3 class="text-base font-semibold mt-4 mb-1">${escapeHtml(trimmed.slice(4))}</h3>`)
      } else if (trimmed.startsWith('## ')) {
        if (inList) { html.push('</ul>'); inList = false }
        html.push(`<h2 class="text-lg font-bold mt-5 mb-2">${escapeHtml(trimmed.slice(3))}</h2>`)
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) { html.push('<ul class="list-disc list-inside space-y-1 text-sm text-muted-foreground">'); inList = true }
        html.push(`<li>${formatInline(trimmed.slice(2))}</li>`)
      } else {
        if (inList) { html.push('</ul>'); inList = false }
        html.push(`<p class="text-sm text-muted-foreground leading-relaxed">${formatInline(trimmed)}</p>`)
      }
    }
    if (inList) html.push('</ul>')
    return html.join('\n')
  }

  const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const formatInline = (s: string) => {
    let out = escapeHtml(s)
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    out = out.replace(/\*(.+?)\*/g, '<em>$1</em>')
    out = out.replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs">$1</code>')
    return out
  }

  // Editor view
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold tracking-tight">
              {isNew ? 'New Post' : 'Edit Post'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowPreview(p => !p)}
            >
              {showPreview ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Editor' : 'Preview'}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={save} disabled={!editing.title.trim()}>
              <FloppyDisk className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        {showPreview ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-[10px] capitalize', CATEGORY_COLORS[editing.category])}>
                  {editing.category}
                </Badge>
                {editing.draft && (
                  <Badge variant="outline" className="text-[10px]">Draft</Badge>
                )}
              </div>
              <CardTitle className="text-2xl mt-2">{editing.title || 'Untitled'}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{editing.date}</p>
              <p className="text-sm text-muted-foreground mt-2">{editing.summary}</p>
            </CardHeader>
            <CardContent
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(editing.contentMarkdown) }}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</label>
              <input
                type="text"
                value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Post title"
              />
            </div>

            {/* Row: Date + Category + Draft */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  value={editing.date}
                  onChange={e => setEditing({ ...editing, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                <select
                  value={editing.category}
                  onChange={e => setEditing({ ...editing, category: e.target.value as PostEntry['category'] })}
                  className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => setEditing({ ...editing, draft: !editing.draft })}
                >
                  {editing.draft ? (
                    <><EyeSlash className="h-3.5 w-3.5" /> Draft</>
                  ) : (
                    <><Eye className="h-3.5 w-3.5" /> Published</>
                  )}
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Summary</label>
              <textarea
                value={editing.summary}
                onChange={e => setEditing({ ...editing, summary: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                placeholder="Brief description shown in post listings"
              />
            </div>

            {/* Markdown content */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Content (Markdown)</label>
              <textarea
                value={editing.contentMarkdown}
                onChange={e => setEditing({ ...editing, contentMarkdown: e.target.value })}
                rows={16}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                placeholder="Write post content in Markdown..."
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Blog Posts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {allPosts.length} posts &middot; {allPosts.filter(p => isDraft(p.id)).length} drafts
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={startNew}>
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {(['all', ...CATEGORIES] as const).map(c => (
            <Button
              key={c}
              variant={filterCategory === c ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilterCategory(c as PostEntry['category'] | 'all')}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Posts list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Article className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" weight="duotone" />
            <p className="text-sm text-muted-foreground">No posts found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(post => (
            <Card key={post.id} className={cn(
              'transition-all duration-200 hover:border-primary/20',
              isDraft(post.id) && 'opacity-70 border-dashed',
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn('text-[10px] capitalize', CATEGORY_COLORS[post.category])}>
                        {post.category}
                      </Badge>
                      {isDraft(post.id) && (
                        <Badge variant="outline" className="text-[10px]">Draft</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CalendarBlank className="h-3 w-3" />
                        {post.date}
                      </span>
                    </div>
                    <p className="text-sm font-semibold truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{post.summary}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleDraft(post.id)}
                      title={isDraft(post.id) ? 'Publish' : 'Unpublish'}
                    >
                      {isDraft(post.id) ? <Eye className="h-4 w-4" /> : <EyeSlash className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEdit(post)}
                    >
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300"
                      onClick={() => deletePost(post.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
