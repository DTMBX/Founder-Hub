import { useKV } from '@/lib/local-storage-kv'
import { Link } from '@/lib/types'
import { GlassCard } from '@/components/ui/glass-card'
import { GlassButton } from '@/components/ui/glass-button'
import { EnvelopeSimple, CalendarBlank, GithubLogo, LinkedinLogo, TwitterLogo, Scales, ChartLineUp, Handshake, ShieldCheck, Headset, Newspaper, At, ArrowRight } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface ContactSectionProps {
  investorMode: boolean
}

interface ProfessionalEmail {
  label: string
  email: string
  icon: string
  desc: string
}

interface SiteProfile {
  ownerName: string
  title: string
  bio: string
  catchAllEmail: string
  professionalEmails: ProfessionalEmail[]
  domain: string
}

/** Primary contact - shown prominently */
const PRIMARY_EMAIL = 'hello@xtx396.com'

/** Department-specific contacts */
const DEFAULT_EMAILS: ProfessionalEmail[] = [
  { label: 'Legal Services', email: 'legal@xtx396.com', icon: 'scales', desc: 'Court filings & case support' },
  { label: 'Investor Relations', email: 'invest@xtx396.com', icon: 'chart', desc: 'Funding & partnerships' },
  { label: 'Business Development', email: 'partner@xtx396.com', icon: 'handshake', desc: 'Collaborations & contracts' },
]

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  envelope: EnvelopeSimple,
  scales: Scales,
  chart: ChartLineUp,
  handshake: Handshake,
  shield: ShieldCheck,
  support: Headset,
  press: Newspaper,
  general: At,
}

export default function ContactSection({ investorMode }: ContactSectionProps) {
  const [links] = useKV<Link[]>('founder-hub-contact-links', [])
  const [profile] = useKV<SiteProfile | null>('founder-hub-profile', null)

  const emails = profile?.professionalEmails?.length ? profile.professionalEmails : DEFAULT_EMAILS
  const contactLinks = links?.filter(l => l.category === 'contact').sort((a, b) => a.order - b.order) || []
  const socialLinks = links?.filter(l => l.category === 'social').sort((a, b) => a.order - b.order) || []

  const getSocialIcon = (icon?: string) => {
    switch (icon) {
      case 'github': return <GithubLogo className="h-5 w-5" weight="duotone" />
      case 'linkedin': return <LinkedinLogo className="h-5 w-5" weight="duotone" />
      case 'twitter': return <TwitterLogo className="h-5 w-5" weight="duotone" />
      default: return null
    }
  }

  return (
    <section id="contact" className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background -z-10" />
      <div className="section-separator absolute top-0 left-0 right-0" />

      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            {investorMode ? 'Investor Relations' : 'Let\'s Connect'}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {investorMode 
              ? 'Ready to discuss funding, partnerships, or project collaboration? Let\'s talk.'
              : 'Interested in collaborating or learning more? Reach out through the right channel.'
            }
          </p>
        </motion.div>

        {/* Investor CTA — prominent when in investor mode */}
        {investorMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-10"
          >
            <GlassCard intensity="high" className="border-emerald-500/30 bg-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/15 transition-all duration-300">
              <div className="p-8 sm:p-10 text-center">
                <ChartLineUp className="h-10 w-10 text-emerald-400 mx-auto mb-4" weight="duotone" />
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Open to Investment</h3>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
                  I'm actively seeking investment partners for web development projects and technology ventures. 
                  Every project is built with transparency, measurable milestones, and long-term growth in mind.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <GlassButton variant="glassPrimary" size="lg" asChild className="bg-emerald-600/20 border-emerald-500/40 hover:bg-emerald-600/30">
                    <a href="mailto:invest@xtx396.com">
                      <EnvelopeSimple className="h-5 w-5 mr-2" />
                      invest@xtx396.com
                    </a>
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Professional email grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6 mb-10"
        >
          {/* Primary Contact - Prominent */}
          <a href={`mailto:${PRIMARY_EMAIL}`} className="block cursor-pointer" style={{ pointerEvents: 'auto' }}>
            <GlassCard intensity="high" className="hover:shadow-2xl hover:shadow-primary/15 hover:border-primary/40 transition-all duration-300 cursor-pointer group">
              <div className="p-8 sm:p-10 text-center">
                <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors mb-5">
                  <EnvelopeSimple className="h-8 w-8 text-primary" weight="duotone" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">General Inquiries</h3>
                <p className="text-lg font-mono text-primary/90 mb-3 underline decoration-primary/30 underline-offset-4">{PRIMARY_EMAIL}</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  For all inquiries not listed below, reach out here. Response within 24–48 hours.
                </p>
                <div className="mt-5 flex items-center justify-center gap-2 text-sm text-primary/70 group-hover:text-primary transition-colors">
                  <span>Send a message</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </GlassCard>
          </a>

          {/* Department Contacts - Clean Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {emails.map((item, idx) => {
              const Icon = ICON_MAP[item.icon] || EnvelopeSimple
              return (
                <a key={idx} href={`mailto:${item.email}`} className="block cursor-pointer" style={{ pointerEvents: 'auto' }}>
                  <GlassCard intensity="medium" className="h-full hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                    <div className="p-5 text-center">
                      <div className="inline-flex items-center justify-center p-2.5 rounded-xl bg-muted/50 border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors mb-3">
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" weight="duotone" />
                      </div>
                      <p className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">{item.label}</p>
                      <p className="text-xs font-mono text-muted-foreground truncate underline decoration-border underline-offset-2">{item.email}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1.5">{item.desc}</p>
                    </div>
                  </GlassCard>
                </a>
              )
            })}
          </div>
        </motion.div>

        {/* Additional contact links */}
        {contactLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-10"
          >
            {contactLinks.map(link => (
              <GlassButton key={link.id} variant="glass" size="lg" asChild>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="gap-2">
                  {link.icon === 'calendar' && <CalendarBlank className="h-5 w-5" />}
                  {link.label}
                </a>
              </GlassButton>
            ))}
          </motion.div>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex justify-center gap-3 pt-8 border-t border-border/30">
              {socialLinks.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl backdrop-blur-md bg-card/30 border border-border/40 hover:border-primary/40 hover:bg-primary/10 hover:shadow-lg transition-all duration-300"
                >
                  {getSocialIcon(link.icon)}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
