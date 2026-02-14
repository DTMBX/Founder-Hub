import { useKV } from '@github/spark/hooks'
import { Link } from '@/lib/types'
import { motion } from 'framer-motion'
import { ArrowSquareOut } from '@phosphor-icons/react'

interface ProofSectionProps {
  investorMode: boolean
}

export default function ProofSection({ investorMode }: ProofSectionProps) {
  const [links] = useKV<Link[]>('founder-hub-proof-links', [])

  const proofLinks = links?.filter(l => l.category === 'proof').sort((a, b) => a.order - b.order) || []

  if (proofLinks.length === 0) return null

  return (
    <section id="proof" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Press & Proof</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
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
              className="group flex items-center justify-between p-6 border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-all"
            >
              <span className="text-lg font-medium group-hover:text-accent transition-colors">
                {link.label}
              </span>
              <ArrowSquareOut className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
