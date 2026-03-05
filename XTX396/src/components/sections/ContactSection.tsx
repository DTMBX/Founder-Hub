import { useKV } from '@/lib/local-storage-kv'
import { Link } from '@/lib/types'
import { GlassCard } from '@/components/ui/glass-card'
import { GlassButton } from '@/components/ui/glass-button'
import { EnvelopeSimple, CalendarBlank, GithubLogo, LinkedinLogo, TwitterLogo, Scales, ChartLineUp, Handshake, ShieldCheck, Headset, Newspaper, At } from '@phosphor-icons/react'
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

const DEFAULT_EMAILS: ProfessionalEmail[] = [
  { label: 'General Inquiries', email: 'x@devon-tyler.com', icon: 'envelope', desc: 'Main contact' },
  { label: 'Legal & Court', email: 'legal@devon-tyler.com', icon: 'scales', desc: 'Case inquiries' },
  { label: 'Investor Relations', email: 'invest@devon-tyler.com', icon: 'chart', desc: 'Projects & funding' },
  { label: 'Partnerships', email: 'partner@devon-tyler.com', icon: 'handshake', desc: 'Collaborations' },
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
                    <a href="mailto:invest@devon-tyler.com">
                      <EnvelopeSimple className="h-5 w-5 mr-2" />
                      invest@devon-tyler.com
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
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
        >
          {emails.map((item, idx) => {
            const Icon = ICON_MAP[item.icon] || EnvelopeSimple
            return (
              <a key={idx} href={`mailto:${item.email}`}>
                <GlassCard intensity="medium" className="h-full hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                  <div className="p-5 flex items-center gap-4">
                    <div className="shrink-0 p-3 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" weight="duotone" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">{item.label}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{item.email}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </GlassCard>
              </a>
            )
          })}
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
