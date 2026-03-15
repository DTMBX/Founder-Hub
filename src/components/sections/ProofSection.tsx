import { useKV } from '@/lib/local-storage-kv'
import { Link } from '@/lib/types'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowSquareOut, SealCheck, GithubLogo, Newspaper, Scales, ChartLineUp, Headset, ShieldCheck, Handshake, At, Wrench } from '@phosphor-icons/react'
import { GlassCard } from '../ui/glass-card'
import { CollapsibleSection } from '../ui/collapsible-section'
import { PROJECT_REGISTRY } from '@/data/projects'

const PROOF_ICON_MAP: Record<string, React.ComponentType<any>> = {
  scales: Scales,
  chart: ChartLineUp,
  press: Newspaper,
  shield: ShieldCheck,
  handshake: Handshake,
  support: Headset,
  general: At,
}

/** Two flagship businesses get hero-width callouts */
const FLAGSHIPS = [
  {
    id: 'evident-platform',
    route: '#evident',
    icon: ShieldCheck,
    accent: 'emerald',
    label: 'Evident E-Discovery Suite',
    domain: 'xtx396.com',
  },
  {
    id: 'tillerstead',
    route: '#tillerstead',
    icon: Wrench,
    accent: 'teal',
    label: 'Tillerstead — NJ HIC',
    domain: 'tillerstead.com',
  },
] as const

interface ProofSectionProps {
  investorMode: boolean
}

export default function ProofSection({ investorMode }: ProofSectionProps) {
  const [links] = useKV<Link[]>('founder-hub-proof-links', [])
  const prefersReducedMotion = useReducedMotion()

  const proofLinks = links?.filter(l => l.category === 'proof').sort((a, b) => a.order - b.order) || []

  // Registry-driven: show live projects with URLs (exclude founder-hub — we're already on it)
  const liveProjects = PROJECT_REGISTRY.filter(p => p.url && p.id !== 'founder-hub')
  const satellites = liveProjects.filter(p => !FLAGSHIPS.some(f => f.id === p.id))
  const totalCount = liveProjects.length + proofLinks.length

  const accentBorder: Record<string, string> = {
    emerald: 'border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    teal: 'border-teal-500/30 hover:border-teal-500/50 hover:shadow-teal-500/10',
  }
  const accentText: Record<string, string> = {
    emerald: 'text-emerald-400',
    teal: 'text-teal-400',
  }
  const accentBg: Record<string, string> = {
    emerald: 'bg-emerald-500/10 border-emerald-500/20',
    teal: 'bg-teal-500/10 border-teal-500/20',
  }

  return (
    <CollapsibleSection
      id="proof"
      title={investorMode ? 'Live Portfolio' : 'Live Portfolio'}
      subtitle="Deployed platforms with open-source code"
      count={totalCount}
      accent="emerald"
      defaultOpen={false}
      data-content-section="proof"
      data-kv-key="founder-hub-proof-links"
      data-admin-tab="links"
    >
      {/* Flagship callouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {FLAGSHIPS.map((flagship) => (
          <motion.a
            key={flagship.id}
            href={flagship.route}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="group"
          >
            <GlassCard intensity="high" className={`p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 ${accentBorder[flagship.accent]}`}>
              <div className="flex items-center gap-4">
                <div className={`shrink-0 p-3 rounded-xl border ${accentBg[flagship.accent]}`}>
                  <flagship.icon className={`h-6 w-6 ${accentText[flagship.accent]}`} weight="duotone" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`font-semibold text-base group-hover:${accentText[flagship.accent]} transition-colors block`}>
                    {flagship.label}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{flagship.domain}</span>
                </div>
                <ArrowRight className={`h-4 w-4 shrink-0 text-muted-foreground group-hover:${accentText[flagship.accent]} transition-colors`} />
              </div>
            </GlassCard>
          </motion.a>
        ))}
      </div>

      {/* Satellite apps grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {satellites.map((project, index) => (
          <motion.a
            key={project.id}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className="group"
          >
            <GlassCard intensity="medium" className="h-full hover:shadow-xl hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex items-center justify-between p-4 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <SealCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" weight="fill" />
                    <span className="text-sm font-semibold group-hover:text-emerald-400 transition-colors truncate">
                      {project.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{project.tagline}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {project.repo && (
                    <a
                      href={project.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-muted-foreground/50 hover:text-foreground transition-colors"
                      aria-label={`${project.name} GitHub`}
                    >
                      <GithubLogo className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <ArrowSquareOut className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            </GlassCard>
          </motion.a>
        ))}
      </div>

      {/* KV proof links — press mentions, court refs, etc. (if admin has added any) */}
      {proofLinks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border/20">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Press &amp; References</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {proofLinks.map((link, index) => {
              const Icon = PROOF_ICON_MAP[link.icon || ''] || Newspaper
              return (
                <motion.a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="group"
                >
                  <GlassCard intensity="low" className="h-full hover:border-emerald-500/30 transition-all duration-300">
                    <div className="flex items-start gap-3 p-4">
                      <Icon className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" weight="duotone" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium group-hover:text-emerald-400 transition-colors block truncate">{link.label}</span>
                        {link.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{link.description}</p>}
                      </div>
                    </div>
                  </GlassCard>
                </motion.a>
              )
            })}
          </div>
        </div>
      )}
    </CollapsibleSection>
  )
}
