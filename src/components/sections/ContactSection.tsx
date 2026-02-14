import { useKV } from '@github/spark/hooks'
import { Link } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { EnvelopeSimple, CalendarBlank, GithubLogo, LinkedinLogo, TwitterLogo } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface ContactSectionProps {
  investorMode: boolean
}

export default function ContactSection({ investorMode }: ContactSectionProps) {
  const [links] = useKV<Link[]>('founder-hub-contact-links', [])

  const contactLinks = links?.filter(l => l.category === 'contact').sort((a, b) => a.order - b.order) || []
  const socialLinks = links?.filter(l => l.category === 'social').sort((a, b) => a.order - b.order) || []

  const getSocialIcon = (icon?: string) => {
    switch (icon) {
      case 'github': return <GithubLogo className="h-5 w-5" />
      case 'linkedin': return <LinkedinLogo className="h-5 w-5" />
      case 'twitter': return <TwitterLogo className="h-5 w-5" />
      default: return null
    }
  }

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Let's Connect</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Interested in collaborating or learning more? Reach out through any of these channels.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button size="lg" asChild className="gap-2">
              <a href="mailto:devon@xtx396.online">
                <EnvelopeSimple className="h-5 w-5" />
                Email Me
              </a>
            </Button>
            
            {contactLinks.map(link => (
              <Button key={link.id} size="lg" variant="outline" asChild className="gap-2">
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.icon === 'calendar' && <CalendarBlank className="h-5 w-5" />}
                  {link.label}
                </a>
              </Button>
            ))}
          </div>

          {socialLinks.length > 0 && (
            <div className="flex justify-center gap-4 pt-8 border-t border-border">
              {socialLinks.map(link => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full border border-border hover:border-accent hover:bg-accent/10 transition-all"
                >
                  {getSocialIcon(link.icon)}
                </a>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
