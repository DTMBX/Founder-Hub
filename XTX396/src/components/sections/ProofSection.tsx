import { useKV } from '@/lib/local-storage-kv'
import { Link } from '@/lib/types'
import { motion } from 'framer-motion'
import { ArrowSquareOut, Newspaper } from '@phosphor-icons/react'
import { GlassCard } from '../ui/glass-card'

// Note: GlassCard kept for link cards below

interface ProofSectionProps {
  investorMode: boolean
}

export default function ProofSection({ investorMode }: ProofSectionProps) {
  const [links] = useKV<Link[]>('founder-hub-proof-links', [])

  const proofLinks = links?.filter(l => l.category === 'proof').sort((a, b) => a.order - b.order) || []

  // Hide entirely when empty — nav link is also hidden by PublicSite
  if (proofLinks.length === 0) return null

  return (
    <section id="proof" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
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
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Press & Proof</h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Select media coverage, publications, and verification materials.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proofLinks.map((link, index) => (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <GlassCard intensity="medium" className="h-full hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between p-6 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="shrink-0 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <Newspaper className="h-5 w-5 text-emerald-400" weight="duotone" />
                      </div>
                      <span className="text-base font-medium group-hover:text-emerald-400 transition-colors">
                        {link.label}
                      </span>
                    </div>
                    <ArrowSquareOut className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                  </div>
                </GlassCard>
              </motion.a>
            ))}
          </div>
      </div>
    </section>
  )
}
