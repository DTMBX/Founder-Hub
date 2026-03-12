import { useKV } from '@/lib/local-storage-kv'
import { Badge } from '../ui/badge'
import { GlassCard } from '../ui/glass-card'
import { motion, useReducedMotion } from 'framer-motion'
import { Target, Compass, Sparkle } from '@phosphor-icons/react'

interface AboutSectionProps {
  pathway?: string
}

export default function AboutSection({ pathway }: AboutSectionProps) {
  const [aboutContent] = useKV<{
    mission: string
    currentFocus: string
    values: string[]
    updates: Array<{ date: string; title: string; content: string }>
  }>('founder-hub-about', {
    mission: 'Forging transformative solutions at the intersection of technology, home improvement, transparency, and justice.',
    currentFocus: 'Building civic technology, home improvement platforms, and legal infrastructure that increase transparency and empower communities.',
    values: ['Integrity', 'Stewardship', 'Fortitude', 'Veracity'],
    updates: [
      {
        date: '2025-06',
        title: 'Evident Ecosystem Launch',
        content: 'Eight satellite apps deployed — civic tech, legal tools, and accountability platforms now live across evident.icu subdomains.'
      }
    ]
  })

  const prefersReducedMotion = useReducedMotion()

  const containerVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }

  const itemVariants = prefersReducedMotion
    ? undefined
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }

  if (!aboutContent) return null

  return (
    <section 
      id="about"
      data-content-section="about"
      data-kv-key="founder-hub-about"
      data-admin-tab="about" 
      className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/10 to-background -z-10" />
      <div className="section-separator mb-16" />
      
      <div className="container mx-auto max-w-5xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">About</h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Personal mission, current focus, and updates
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            <motion.div variants={itemVariants}>
              <GlassCard intensity="high" className="h-full hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Target className="h-5 w-5 text-purple-400" weight="duotone" />
                    </div>
                    <h3 className="text-xl font-bold text-purple-400">Mission</h3>
                  </div>
                  <p className="text-base text-foreground/90 leading-relaxed">
                    {aboutContent.mission}
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={itemVariants}>
              <GlassCard intensity="high" className="h-full hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <Compass className="h-5 w-5 text-purple-400" weight="duotone" />
                    </div>
                    <h3 className="text-xl font-bold text-purple-400">Current Focus</h3>
                  </div>
                  <p className="text-base text-foreground/90 leading-relaxed">
                    {aboutContent.currentFocus}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="mb-10">
            <GlassCard intensity="medium" className="hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <div className="p-8">
                <h3 className="text-xl font-bold mb-6 text-center">Core Values</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  {(aboutContent.values || []).map((value, index) => (
                    <a
                      key={index}
                      href={`https://www.etymonline.com/word/${value.toLowerCase()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <Badge 
                        variant="secondary"
                        className="text-base px-5 py-2.5 bg-purple-500/15 text-purple-300 border border-purple-500/30 backdrop-blur-sm cursor-pointer hover:bg-purple-500/25 hover:border-purple-400/50 transition-all duration-200"
                      >
                        <Sparkle className="h-3.5 w-3.5 mr-1.5" weight="fill" />
                        {value}
                      </Badge>
                    </a>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {aboutContent.updates && aboutContent.updates.length > 0 && (
            <motion.div variants={itemVariants}>
              <h3 className="text-xl font-bold mb-5">Recent Updates</h3>
              <div className="space-y-3">
                {aboutContent.updates.map((update, index) => (
                  <GlassCard 
                    key={index}
                    intensity="low"
                    className="hover:border-purple-500/30 transition-all duration-300"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="text-base font-semibold">{update.title}</h4>
                        <Badge variant="outline" className="shrink-0 text-xs border-border/50">
                          {update.date}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{update.content}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
