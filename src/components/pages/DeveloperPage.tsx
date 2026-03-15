import { ArrowLeft, BracketsCurly, GitBranch, Plugs } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import { usePageMeta } from '@/hooks/use-page-meta'
import { ECOSYSTEM_VERSION } from '@/lib/generate-ecosystem-json'

interface DeveloperPageProps {
  onBack: () => void
}

export default function DeveloperPage({ onBack }: DeveloperPageProps) {
  const prefersReducedMotion = useReducedMotion()

  usePageMeta({
    title: 'Developer Documentation — Devon Tyler Barber',
    description: 'Technical documentation for consuming the public ecosystem data API — JSON endpoints, schema reference, and integration examples.',
    path: '/developers',
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14">
            <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Home
            </button>
          </div>
        </div>
      </div>

      <SectionContainer maxWidth="5xl" separator={false} className="pt-12 sm:pt-16">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">Developers</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-14">
            The Evident ecosystem exposes structured data through public JSON endpoints.
            Build integrations, dashboards, or analysis tools on top of a transparent knowledge graph.
          </p>
        </motion.div>

        {/* ── Overview ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Ecosystem Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <GlassCard intensity="high" className="p-6">
              <BracketsCurly className="h-8 w-8 text-blue-400 mb-4" weight="duotone" aria-hidden="true" />
              <h3 className="font-semibold mb-2">Structured JSON</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All data is served as static JSON files — no authentication needed, no rate limits, fully cacheable.
              </p>
            </GlassCard>
            <GlassCard intensity="high" className="p-6">
              <GitBranch className="h-8 w-8 text-emerald-400 mb-4" weight="duotone" aria-hidden="true" />
              <h3 className="font-semibold mb-2">Relationship Graph</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every entity relationship is expressed as a directed edge — founder, creator, developer, publisher, operator.
              </p>
            </GlassCard>
            <GlassCard intensity="high" className="p-6">
              <Plugs className="h-8 w-8 text-violet-400 mb-4" weight="duotone" aria-hidden="true" />
              <h3 className="font-semibold mb-2">Build-Time Generated</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Data is regenerated from the source registry on every deploy — always current, never stale.
              </p>
            </GlassCard>
          </div>
        </section>

        {/* ── Endpoints ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Public JSON Endpoints</h2>
          <GlassCard intensity="medium" className="p-6">
            <div className="space-y-4">
              {[
                { method: 'GET', path: '/api/ecosystem.json', desc: 'Full ecosystem — person, organizations, projects, relationships' },
                { method: 'GET', path: '/api/projects.json', desc: 'All projects with metadata' },
                { method: 'GET', path: '/api/organizations.json', desc: 'Organization entities' },
                { method: 'GET', path: '/ecosystem.json', desc: 'Root-level ecosystem mirror' },
              ].map((ep) => (
                <div key={ep.path} className="flex items-start gap-3">
                  <Badge variant="outline" className="text-[10px] font-mono mt-0.5 shrink-0">{ep.method}</Badge>
                  <div>
                    <a
                      href={ep.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-emerald-400 hover:underline"
                    >
                      {ep.path}
                    </a>
                    <p className="text-xs text-muted-foreground mt-0.5">{ep.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        {/* ── Project Schema ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Project Object Schema</h2>
          <GlassCard intensity="medium" className="p-6 overflow-x-auto">
            <pre className="text-xs font-mono text-muted-foreground">
{`{
  "id": "string",           // Unique slug identifier
  "name": "string",         // Display name
  "tagline": "string",      // One-line summary
  "description": "string",  // Full description
  "category": "string",     // civic-tech | home-improvement | software-platform
  "status": "string",       // live | in-development | research
  "repo": "string?",        // GitHub repository URL
  "domain": "string?",      // Primary domain (no protocol)
  "documentation": "string?", // Documentation URL
  "created": "string?",     // ISO date (YYYY-MM-DD)
  "updated": "string?"      // ISO date of last significant update
}`}
            </pre>
          </GlassCard>
        </section>

        {/* ── Relationship Schema ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Relationship Edge Schema</h2>
          <GlassCard intensity="medium" className="p-6 overflow-x-auto">
            <pre className="text-xs font-mono text-muted-foreground">
{`{
  "source": "string",       // Entity slug (person or organization)
  "target": "string",       // Entity slug (organization or project)
  "relationship": "string"  // founder | creator | developer | publisher | operator
}`}
            </pre>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <p><Badge variant="secondary" className="text-[10px] mr-2">founder</Badge>Person → Organization</p>
              <p><Badge variant="secondary" className="text-[10px] mr-2">creator</Badge>Person → Project</p>
              <p><Badge variant="secondary" className="text-[10px] mr-2">developer</Badge>Organization → Project (builds and maintains)</p>
              <p><Badge variant="secondary" className="text-[10px] mr-2">publisher</Badge>Organization → Project (hosts publicly)</p>
              <p><Badge variant="secondary" className="text-[10px] mr-2">operator</Badge>Organization → Project (operates the domain)</p>
            </div>
          </GlassCard>
        </section>

        {/* ── Integration Examples ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Integration Examples</h2>

          <div className="space-y-5">
            <GlassCard intensity="medium" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">JavaScript / TypeScript</h3>
              <pre className="bg-background/50 rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto">
{`const res = await fetch('https://devon-tyler.com/api/ecosystem.json')
const { projects, relationships, organizations } = await res.json()

// List all live projects
const live = projects.filter(p => p.status === 'live')

// Find all projects by an organization
const evidentProjects = relationships
  .filter(r => r.source === 'evident-technologies-llc' && r.relationship === 'developer')
  .map(r => projects.find(p => p.id === r.target))`}
              </pre>
            </GlassCard>

            <GlassCard intensity="medium" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Python</h3>
              <pre className="bg-background/50 rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto">
{`import requests

data = requests.get('https://devon-tyler.com/api/ecosystem.json').json()

for project in data['projects']:
    print(f"{project['name']} — {project['status']}")

# Build adjacency list from relationships
graph = {}
for edge in data['relationships']:
    graph.setdefault(edge['source'], []).append((edge['target'], edge['relationship']))`}
              </pre>
            </GlassCard>

            <GlassCard intensity="medium" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">cURL</h3>
              <pre className="bg-background/50 rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto">
{`# Full ecosystem
curl -s https://devon-tyler.com/api/ecosystem.json | jq '.projects | length'

# Organizations only
curl -s https://devon-tyler.com/api/organizations.json | jq '.organizations[].name'

# Project names
curl -s https://devon-tyler.com/api/projects.json | jq '.projects[].name'`}
              </pre>
            </GlassCard>
          </div>
        </section>

        {/* ── Versioning ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Versioning</h2>
          <GlassCard intensity="medium" className="p-6">
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Every response includes a <code className="text-xs bg-background/50 px-1.5 py-0.5 rounded font-mono">version</code> field
              and a <code className="text-xs bg-background/50 px-1.5 py-0.5 rounded font-mono">lastUpdated</code> ISO timestamp.
              The current schema version is <strong className="text-foreground">{ECOSYSTEM_VERSION}</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Breaking changes will increment the major version. Additive changes (new fields) are backwards-compatible.
              Data is regenerated from the source registry on every production build.
            </p>
          </GlassCard>
        </section>
      </SectionContainer>
    </div>
  )
}
