import { GlassCard } from '../ui/glass-card'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck, GitBranch, Eye, FileText } from '@phosphor-icons/react'

const PILLARS = [
  {
    icon: FileText,
    title: 'Why Governance Exists',
    body: 'Software that handles sensitive data needs more than good intentions. It needs a written operating contract — one that defines what the platform will and will not do, and holds the system accountable to those commitments. Governance is not a legal construct here. It is a technical specification for how the platform behaves, enforced through code and verified through audit.',
    color: 'purple',
  },
  {
    icon: GitBranch,
    title: 'Why Version Control Matters',
    body: 'Every change to a governance document is tracked in the same version control system that tracks the code itself. This means every amendment, every revision, and every policy update has a permanent, verifiable history. No document can be silently rewritten. The commit log is the record.',
    color: 'blue',
  },
  {
    icon: Eye,
    title: 'Why Auditability Matters',
    body: 'When a system manages evidence, the system itself must be auditable. Every user action, every data access event, and every export produces an immutable record. This is not optional logging — it is a structural requirement. If an operation cannot be audited, it should not be permitted.',
    color: 'emerald',
  },
  {
    icon: ShieldCheck,
    title: 'Why Transparency Matters',
    body: 'Users of the platform have the right to understand how it works, what rules govern their data, and what changed between versions. The governance framework is not a hidden policy document. It is rendered directly inside the platform, timestamped, versioned, and tied to the specific deployment commit hash.',
    color: 'amber',
  },
] as const

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', icon: 'text-purple-400' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'text-blue-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', icon: 'text-amber-400' },
}

export default function GovernanceNarrativeSection() {
  const prefersReducedMotion = useReducedMotion()

  const containerVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.12 },
        },
      }

  const itemVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }

  return (
    <section
      id="governance"
      className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
      data-content-section="governance"
      data-admin-tab="content"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background -z-10" />
      <div className="section-separator mb-16" />

      <div className="container mx-auto max-w-5xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Governance
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              How the Evident Platform holds itself accountable — through
              version-controlled documents, immutable audit trails, and
              transparent engineering.
            </p>
          </motion.div>

          {/* Pillar cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {PILLARS.map((pillar) => {
              const colors = COLOR_MAP[pillar.color] ?? COLOR_MAP.purple
              const Icon = pillar.icon
              return (
                <motion.div key={pillar.title} variants={itemVariants}>
                  <GlassCard
                    intensity="high"
                    className={`h-full hover:shadow-2xl hover:shadow-${pillar.color}-500/10 transition-all duration-300`}
                  >
                    <div className="p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`p-2.5 rounded-lg ${colors.bg} border ${colors.border}`}
                        >
                          <Icon
                            className={`h-5 w-5 ${colors.icon}`}
                            weight="duotone"
                          />
                        </div>
                        <h3 className={`text-xl font-bold ${colors.text}`}>
                          {pillar.title}
                        </h3>
                      </div>
                      <p className="text-base text-foreground/90 leading-relaxed">
                        {pillar.body}
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>

          {/* Link to governance framework */}
          <motion.div variants={itemVariants}>
            <GlassCard
              intensity="medium"
              className="hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
            >
              <div className="p-8 text-center">
                <p className="text-base text-muted-foreground leading-relaxed mb-5">
                  The full governance framework — including the constitutional
                  document, bill of rights, foundational principles, and
                  amendment timeline — is published inside the platform and
                  available for review.
                </p>
                <a
                  href="https://xtx396.com/governance"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-5 py-2.5 text-sm font-medium text-purple-300 transition-all duration-200 hover:bg-purple-500/20 hover:border-purple-400/50"
                >
                  <ShieldCheck className="h-4 w-4" weight="duotone" />
                  View Governance Framework
                </a>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
