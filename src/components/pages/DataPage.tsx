import { ArrowLeft, CloudArrowDown, Database, FileJs } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/ui/glass-card'
import { SectionContainer } from '@/components/ui/section-container'
import { usePageMeta } from '@/hooks/use-page-meta'
import { ECOSYSTEM_VERSION } from '@/lib/generate-ecosystem-json'

interface DataPageProps {
  onBack: () => void
}

const ENDPOINTS = [
  {
    name: 'ecosystem.json',
    path: '/api/ecosystem.json',
    description: 'Complete ecosystem dataset — person, organizations, projects, and relationship graph.',
    icon: Database,
  },
  {
    name: 'projects.json',
    path: '/api/projects.json',
    description: 'All projects with metadata: status, category, domains, documentation links, and dates.',
    icon: FileJs,
  },
  {
    name: 'organizations.json',
    path: '/api/organizations.json',
    description: 'Organization entities with industry, type, and relationship to founder.',
    icon: FileJs,
  },
]

export default function DataPage({ onBack }: DataPageProps) {
  const prefersReducedMotion = useReducedMotion()

  usePageMeta({
    title: 'Ecosystem Data — Devon Tyler Barber',
    description: 'Download machine-readable ecosystem data — projects, organizations, and relationship graph in JSON format.',
    path: '/data',
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold">Ecosystem Data</h1>
            <Badge variant="secondary" className="text-xs">v{ECOSYSTEM_VERSION}</Badge>
          </div>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed mb-14">
            Download machine-readable datasets describing every project, organization, and relationship in the ecosystem.
          </p>
        </motion.div>

        {/* ── Download Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {ENDPOINTS.map((ep) => (
            <GlassCard key={ep.name} intensity="high" className="p-6 sm:p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <ep.icon className="h-6 w-6 text-emerald-400" weight="duotone" aria-hidden="true" />
                <h2 className="text-lg font-semibold">{ep.name}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {ep.description}
              </p>
              <a
                href={ep.path}
                download={ep.name}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <CloudArrowDown className="h-4 w-4" aria-hidden="true" />
                Download
              </a>
            </GlassCard>
          ))}
        </div>

        {/* ── API Endpoints ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Public API Endpoints</h2>
          <GlassCard intensity="medium" className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/40">
                  <th className="pb-3 font-medium">Endpoint</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Format</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {ENDPOINTS.map((ep) => (
                  <tr key={ep.path}>
                    <td className="py-3 font-mono text-xs text-emerald-400">
                      <a href={ep.path} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {ep.path}
                      </a>
                    </td>
                    <td className="py-3 text-muted-foreground">{ep.description}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-[10px]">JSON</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </section>

        {/* ── Schema Info ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Schema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <GlassCard intensity="medium" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Version</h3>
              <p className="text-2xl font-bold">{ECOSYSTEM_VERSION}</p>
              <p className="text-xs text-muted-foreground mt-2">Data regenerated on every build</p>
            </GlassCard>
            <GlassCard intensity="medium" className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Relationship Types</h3>
              <div className="flex flex-wrap gap-2">
                {['creator', 'developer', 'publisher', 'operator', 'founder'].map(r => (
                  <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        {/* ── Sample Usage ── */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Usage</h2>
          <GlassCard intensity="medium" className="p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Fetch with JavaScript</h3>
            <pre className="bg-background/50 rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto">
{`const res = await fetch('https://devon-tyler.com/api/ecosystem.json')
const data = await res.json()

console.log(data.version)        // "${ECOSYSTEM_VERSION}"
console.log(data.projects.length) // 9
console.log(data.organizations)   // [{ name: "Evident Technologies LLC", ... }]
console.log(data.relationships)   // [{ source, target, relationship }]`}
            </pre>
          </GlassCard>
        </section>
      </SectionContainer>
    </div>
  )
}
