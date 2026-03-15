/**
 * LatestPosts — Compact blog preview shown on homepage.
 *
 * Renders the 3 most recent posts from the static POSTS array
 * with read-more links to the full blog page.
 */

import { ArrowRight, Article } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { POSTS } from '@/data/posts'

const CATEGORY_COLORS: Record<string, string> = {
  platform: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  project: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ecosystem: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  update: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

export default function LatestPosts() {
  const prefersReducedMotion = useReducedMotion()

  const latestPosts = [...POSTS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  if (latestPosts.length === 0) return null

  return (
    <section
      aria-label="Latest blog posts"
      className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="container mx-auto max-w-[1200px]">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Article
                className="h-5 w-5 text-muted-foreground/60"
                weight="duotone"
                aria-hidden="true"
              />
              <h2 className="text-2xl sm:text-3xl font-bold">Latest</h2>
            </div>
            <a
              href="#blog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 group"
            >
              All posts
              <ArrowRight
                className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform"
                aria-hidden="true"
              />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {latestPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <a href={`#blog/${post.id}`} className="block group">
                  <GlassCard
                    intensity="medium"
                    className="h-full p-5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${CATEGORY_COLORS[post.category] ?? ''}`}
                      >
                        {post.category}
                      </Badge>
                      <time
                        dateTime={post.date}
                        className="text-[11px] text-muted-foreground/60"
                      >
                        {new Date(post.date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                    <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {post.summary}
                    </p>
                  </GlassCard>
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
