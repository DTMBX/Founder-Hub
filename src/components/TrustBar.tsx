/**
 * TrustBar — Compact credibility strip shown on homepage.
 *
 * Verified facts only: license numbers, live domains, public repos,
 * and governance markers. No superlatives, no promises.
 */

import {
  Certificate,
  GithubLogo,
  Globe,
  ShieldCheck,
} from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'framer-motion'

const TRUST_ITEMS = [
  {
    icon: Certificate,
    label: 'NJ Licensed Contractor',
    detail: 'HIC #13VH10808800',
    href: undefined,
  },
  {
    icon: ShieldCheck,
    label: '2 Active LLCs',
    detail: 'Evident Technologies · Tillerstead',
    href: undefined,
  },
  {
    icon: Globe,
    label: '9 Live Domains',
    detail: 'Public, verifiable infrastructure',
    href: '#system-status',
  },
  {
    icon: GithubLogo,
    label: 'Open Source',
    detail: 'All repos public on GitHub',
    href: 'https://github.com/DTMBX',
  },
] as const

export default function TrustBar() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      aria-label="Verified credentials"
      className="relative border-y border-border/20 bg-card/30 backdrop-blur-sm"
    >
      <div className="container mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {TRUST_ITEMS.map((item, i) => {
            const content = (
              <div className="flex items-start gap-3 group">
                <item.icon
                  className="h-5 w-5 mt-0.5 text-muted-foreground/70 group-hover:text-foreground transition-colors shrink-0"
                  weight="duotone"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                    {item.detail}
                  </p>
                </div>
              </div>
            )

            return item.href ? (
              <a
                key={i}
                href={item.href}
                className="rounded-lg p-2 -m-2 hover:bg-accent/5 transition-colors"
                {...(item.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {content}
              </a>
            ) : (
              <div key={i} className="p-2 -m-2">
                {content}
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
