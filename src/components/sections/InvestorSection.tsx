import { useKV } from '@/lib/local-storage-kv'
import { InvestorData } from '@/lib/types'
import { GlassCard } from '@/components/ui/glass-card'
import { GlassButton } from '@/components/ui/glass-button'
import { Badge } from '@/components/ui/badge'
import { motion, useReducedMotion } from 'framer-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import {
  TrendUp,
  TrendDown,
  Minus,
  Calendar,
  FileText,
  Download,
  Play,
  CaretRight,
  CheckCircle,
  CircleNotch,
  Clock,
  CurrencyDollar,
  Question,
  CaretDown,
  Envelope,
  Phone,
  ChartLine,
  Rocket,
  Handshake,
  Files
} from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const defaultInvestorData: InvestorData = {
  metrics: [],
  milestones: [],
  documents: [],
  faqs: [],
  investmentTiers: []
}

function formatCurrency(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(cents / 100)
}

// ─── Metrics Section ─────────────────────────────────────────

function MetricsSection({ metrics }: { metrics: InvestorData['metrics'] }) {
  if (!metrics || metrics.length === 0) return null

  const sortedMetrics = [...metrics].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <ChartLine className="h-5 w-5 text-primary" weight="duotone" />
        Traction & Metrics
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sortedMetrics.map(metric => (
          <GlassCard key={metric.id} className="p-4 text-center">
            <p className="text-2xl md:text-3xl font-bold text-foreground">{metric.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{metric.label}</p>
            {metric.trend && (
              <div className={cn(
                'flex items-center justify-center gap-1 mt-2 text-xs font-medium',
                metric.trend === 'up' && 'text-emerald-400',
                metric.trend === 'down' && 'text-red-400',
                metric.trend === 'neutral' && 'text-muted-foreground'
              )}>
                {metric.trend === 'up' && <TrendUp className="h-3 w-3" />}
                {metric.trend === 'down' && <TrendDown className="h-3 w-3" />}
                {metric.trend === 'neutral' && <Minus className="h-3 w-3" />}
                {metric.trendValue}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

// ─── Pitch Video Section ─────────────────────────────────────

function PitchVideoSection({ url, thumbnail }: { url?: string; thumbnail?: string }) {
  if (!url) return null

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
  const isVimeo = url.includes('vimeo.com')

  let embedUrl = url
  if (isYouTube) {
    const videoId = url.includes('youtu.be') 
      ? url.split('/').pop()
      : new URL(url).searchParams.get('v')
    embedUrl = `https://www.youtube.com/embed/${videoId}`
  } else if (isVimeo) {
    const videoId = url.split('/').pop()
    embedUrl = `https://player.vimeo.com/video/${videoId}`
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Play className="h-5 w-5 text-primary" weight="duotone" />
        Pitch Video
      </h3>
      <div className="aspect-video rounded-xl overflow-hidden border border-border/50 bg-card">
        {(isYouTube || isVimeo) ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={url}
            poster={thumbnail}
            controls
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  )
}

// ─── Roadmap / Milestones ────────────────────────────────────

function RoadmapSection({ milestones }: { milestones: InvestorData['milestones'] }) {
  if (!milestones || milestones.length === 0) return null

  const sorted = [...milestones].sort((a, b) => a.order - b.order)

  const statusIcon = {
    completed: <CheckCircle className="h-4 w-4 text-emerald-400" weight="fill" />,
    'in-progress': <CircleNotch className="h-4 w-4 text-amber-400 animate-spin" />,
    upcoming: <Clock className="h-4 w-4 text-muted-foreground" />
  }

  const statusColor = {
    completed: 'border-emerald-500/30 bg-emerald-500/5',
    'in-progress': 'border-amber-500/30 bg-amber-500/5',
    upcoming: 'border-border/30 bg-card/30'
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Rocket className="h-5 w-5 text-primary" weight="duotone" />
        Roadmap
      </h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-6 bottom-6 w-px bg-border/50" />
        
        <div className="space-y-4">
          {sorted.map((milestone, idx) => (
            <div key={milestone.id} className="relative flex gap-4">
              <div className={cn(
                'relative z-10 flex items-center justify-center w-8 h-8 rounded-full border',
                statusColor[milestone.status]
              )}>
                {statusIcon[milestone.status]}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">{milestone.date}</span>
                  <Badge variant="outline" className={cn(
                    'text-[10px]',
                    milestone.status === 'completed' && 'border-emerald-500/30 text-emerald-400',
                    milestone.status === 'in-progress' && 'border-amber-500/30 text-amber-400',
                    milestone.status === 'upcoming' && 'border-border text-muted-foreground'
                  )}>
                    {milestone.status.replace('-', ' ')}
                  </Badge>
                </div>
                <h4 className="font-medium mt-1">{milestone.title}</h4>
                {milestone.description && (
                  <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Documents Section ───────────────────────────────────────

function DocumentsSection({ documents }: { documents: InvestorData['documents'] }) {
  if (!documents || documents.length === 0) return null

  const sorted = [...documents].sort((a, b) => a.order - b.order)

  const typeIcons: Record<string, React.ReactNode> = {
    'pitch-deck': <Play className="h-4 w-4" />,
    'executive-summary': <FileText className="h-4 w-4" />,
    'financials': <CurrencyDollar className="h-4 w-4" />,
    'one-pager': <FileText className="h-4 w-4" />,
    'media-kit': <Files className="h-4 w-4" />,
    'other': <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Files className="h-5 w-5 text-primary" weight="duotone" />
        Documents & Downloads
      </h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {sorted.map(doc => (
          <a
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <GlassCard className="p-4 flex items-center gap-3 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                {typeIcons[doc.type] || typeIcons.other}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate group-hover:text-primary transition-colors">
                  {doc.title}
                </p>
                {doc.description && (
                  <p className="text-xs text-muted-foreground truncate">{doc.description}</p>
                )}
              </div>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </GlassCard>
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── Investment Tiers ────────────────────────────────────────

function InvestmentSection({ 
  tiers, 
  raisingAmount, 
  raisingCurrency,
  useOfFunds,
  expectedROI 
}: { 
  tiers: InvestorData['investmentTiers']
  raisingAmount?: number
  raisingCurrency?: string
  useOfFunds?: string
  expectedROI?: string
}) {
  if (!tiers || tiers.length === 0) return null

  const sorted = [...tiers].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Handshake className="h-5 w-5 text-primary" weight="duotone" />
        Investment Opportunity
      </h3>
      
      {raisingAmount && raisingAmount > 0 && (
        <GlassCard className="p-4 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Currently Raising</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(raisingAmount, raisingCurrency || 'USD')}
              </p>
            </div>
            {expectedROI && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Expected ROI</p>
                <p className="text-lg font-semibold text-emerald-400">{expectedROI}</p>
              </div>
            )}
          </div>
          {useOfFunds && (
            <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/30">
              <strong>Use of Funds:</strong> {useOfFunds}
            </p>
          )}
        </GlassCard>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(tier => (
          <GlassCard 
            key={tier.id} 
            className={cn(
              'p-4',
              !tier.available && 'opacity-60'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">{tier.name}</h4>
              {tier.equity && (
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">
                  {tier.equity} equity
                </Badge>
              )}
            </div>
            <p className="text-xl font-bold">
              {formatCurrency(tier.minAmount, 'USD')}
              {tier.maxAmount && ` - ${formatCurrency(tier.maxAmount, 'USD')}`}
            </p>
            {tier.perks.length > 0 && (
              <ul className="mt-3 space-y-1">
                {tier.perks.map((perk, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" weight="fill" />
                    {perk}
                  </li>
                ))}
              </ul>
            )}
            {!tier.available && (
              <Badge variant="secondary" className="mt-3">Fully Subscribed</Badge>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

// ─── FAQ Accordion ───────────────────────────────────────────

function FAQSection({ faqs }: { faqs: InvestorData['faqs'] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  
  if (!faqs || faqs.length === 0) return null

  const sorted = [...faqs].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Question className="h-5 w-5 text-primary" weight="duotone" />
        Investor FAQ
      </h3>
      <div className="space-y-2">
        {sorted.map(faq => (
          <GlassCard key={faq.id} className="overflow-hidden">
            <button
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-card/50 transition-colors"
            >
              <span className="font-medium pr-4">{faq.question}</span>
              <CaretDown className={cn(
                'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0',
                openId === faq.id && 'rotate-180'
              )} />
            </button>
            {openId === faq.id && (
              <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border/30 pt-3">
                {faq.answer}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

// ─── Calendar / Meeting ──────────────────────────────────────

function MeetingSection({ calendlyUrl, meetingCTA }: { calendlyUrl?: string; meetingCTA?: string }) {
  if (!calendlyUrl) return null

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" weight="duotone" />
        Schedule a Meeting
      </h3>
      <GlassCard className="p-6 text-center">
        <p className="text-muted-foreground mb-4">
          Ready to discuss the opportunity? Book a time that works for you.
        </p>
        <a 
          href={calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-medium transition-all"
        >
          <Calendar className="h-4 w-4" />
          {meetingCTA || 'Schedule a Call'}
          <CaretRight className="h-4 w-4" />
        </a>
      </GlassCard>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export default function InvestorSection() {
  const [data] = useKV<InvestorData>('founder-hub-investor', defaultInvestorData)
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1, freezeOnceVisible: true })
  const prefersReducedMotion = useReducedMotion()

  // Check if ANY content exists
  const hasMetrics = (data?.metrics?.length ?? 0) > 0
  const hasPitchVideo = !!data?.pitchVideoUrl
  const hasMilestones = (data?.milestones?.length ?? 0) > 0
  const hasDocuments = (data?.documents?.length ?? 0) > 0
  const hasTiers = (data?.investmentTiers?.length ?? 0) > 0
  const hasFaqs = (data?.faqs?.length ?? 0) > 0
  const hasCalendar = !!data?.calendlyUrl
  
  const hasAnyContent = hasMetrics || hasPitchVideo || hasMilestones || 
                        hasDocuments || hasTiers || hasFaqs || hasCalendar

  // If no content, render nothing
  if (!hasAnyContent) return null

  return (
    <section 
      id="investor" 
      className="relative py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
      ref={ref}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background -z-10" />
      <div className="section-separator absolute top-0 left-0 right-0" />
      
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-10 lg:mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              For Investors
            </Badge>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Investment Opportunity
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed">
              Detailed information for potential investors and partners. 
              Review our traction, roadmap, and investment terms.
            </p>
          </div>

          <div className="space-y-12">
            {/* Each section auto-hides if empty */}
            <MetricsSection metrics={data?.metrics} />
            <PitchVideoSection url={data?.pitchVideoUrl} thumbnail={data?.pitchVideoThumbnail} />
            <RoadmapSection milestones={data?.milestones} />
            <DocumentsSection documents={data?.documents} />
            <InvestmentSection 
              tiers={data?.investmentTiers}
              raisingAmount={data?.raisingAmount}
              raisingCurrency={data?.raisingCurrency}
              useOfFunds={data?.useOfFunds}
              expectedROI={data?.expectedROI}
            />
            <FAQSection faqs={data?.faqs} />
            <MeetingSection calendlyUrl={data?.calendlyUrl} meetingCTA={data?.meetingCTA} />
          </div>

          {/* Contact footer */}
          {(data?.investorEmail || data?.investorPhone) && (
            <div className="mt-12 pt-8 border-t border-border/30">
              <p className="text-sm text-muted-foreground mb-3">Direct Investor Contact</p>
              <div className="flex flex-wrap gap-4">
                {data.investorEmail && (
                  <a 
                    href={`mailto:${data.investorEmail}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Envelope className="h-4 w-4" />
                    {data.investorEmail}
                  </a>
                )}
                {data.investorPhone && (
                  <a 
                    href={`tel:${data.investorPhone}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {data.investorPhone}
                  </a>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
