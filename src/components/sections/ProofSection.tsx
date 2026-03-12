import { useKV } from '@/lib/local-storage-kv'
import { Link } from '@/lib/types'
import { motion } from 'framer-motion'
import { ArrowSquareOut, Newspaper, Scales, ChartLineUp, Headset, ShieldCheck, Handshake, At } from '@phosphor-icons/react'
import { GlassCard } from '../ui/glass-card'

const PROOF_ICON_MAP: Record<string, React.ComponentType<any>> = {
  scales: Scales,
  chart: ChartLineUp,
  press: Newspaper,
  shield: ShieldCheck,
  handshake: Handshake,
  support: Headset,
  general: At,
}

interface ProofSectionProps {
  investorMode: boolean
}

export default function ProofSection({ investorMode }: ProofSectionProps) {
  const [links] = useKV<Link[]>('founder-hub-proof-links', [])

  const proofLinks = links?.filter(l => l.category === 'proof').sort((a, b) => a.order - b.order) || []

  // Hide entirely when empty — nav link is also hidden by PublicSite
  if (proofLinks.length === 0) return null

  return (
    <section id="proof" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden" data-content-section="proof" data-kv-key="founder-hub-proof-links" data-admin-tab="links">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background -z-10" />
      <div className="section-separator absolute top-0 left-0 right-0" />

      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            {investorMode ? 'Live Portfolio' : 'Proof of Work'}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            {investorMode
              ? 'All deployed applications across the Evident ecosystem — each running on its own domain with automated CI/CD.'
              : 'Every application in the ecosystem is live, publicly accessible, and open-source.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {proofLinks.map((link, index) => {
              const Icon = PROOF_ICON_MAP[link.icon || ''] || Newspaper
              return (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group"
              >
                <GlassCard intensity="medium" className="h-full hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between p-5 gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="shrink-0 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-0.5">
                        <Icon className="h-4 w-4 text-emerald-400" weight="duotone" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold group-hover:text-emerald-400 transition-colors block">
                          {link.label}
                        </span>
                        {link.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {link.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowSquareOut className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-emerald-400 transition-colors mt-1" />
                  </div>
                </GlassCard>
              </motion.a>
              )
            })}
          </div>
      </div>
    </section>
  )
}
