import { useKV } from '@github/spark/hooks'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { motion, useReducedMotion } from 'framer-motion'

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
    mission: 'Building transformative solutions at the intersection of technology and justice.',
    currentFocus: 'Developing civic infrastructure and legal technology platforms to increase transparency and accountability.',
    values: ['Transparency', 'Accountability', 'Innovation', 'Justice'],
    updates: [
      {
        date: '2024-01',
        title: 'New Project Launch',
        content: 'Launching Essential Goods Ledger to track public accountability.'
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
      className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 relative"
    >
      <div className="section-separator mb-16" />
      
      <div className="container mx-auto max-w-4xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">About</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Personal mission, current focus, and updates
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-12">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
              <h3 className="text-2xl font-bold mb-4 text-accent">Mission</h3>
              <p className="text-lg text-foreground leading-relaxed">
                {aboutContent.mission}
              </p>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-12">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
              <h3 className="text-2xl font-bold mb-4 text-accent">Current Focus</h3>
              <p className="text-lg text-foreground leading-relaxed">
                {aboutContent.currentFocus}
              </p>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-12">
            <h3 className="text-2xl font-bold mb-6">Core Values</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {aboutContent.values.map((value, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="text-base px-4 py-2 bg-accent/20 text-accent border-accent/30"
                >
                  {value}
                </Badge>
              ))}
            </div>
          </motion.div>

          {aboutContent.updates && aboutContent.updates.length > 0 && (
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-bold mb-6">Recent Updates</h3>
              <div className="space-y-4">
                {aboutContent.updates.map((update, index) => (
                  <Card 
                    key={index}
                    className="p-6 bg-card/30 backdrop-blur-sm border-border/50 hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h4 className="text-lg font-semibold">{update.title}</h4>
                      <Badge variant="outline" className="shrink-0">
                        {update.date}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{update.content}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
