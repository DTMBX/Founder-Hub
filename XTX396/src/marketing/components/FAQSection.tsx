/**
 * FAQ Section
 *
 * Accordion-style FAQ section with category filtering.
 */

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GENERAL_FAQS, type FAQItem } from '../faq.config'
import { track, MARKETING_EVENTS } from '../event-tracker'

// ─── Types ───────────────────────────────────────────────────

export interface FAQSectionProps {
  /** Section title */
  title?: string
  /** Section subtitle */
  subtitle?: string
  /** FAQ items to display */
  faqs?: FAQItem[]
  /** Allow multiple open at once */
  allowMultiple?: boolean
  /** Custom className */
  className?: string
}

// ─── FAQ Item Component ──────────────────────────────────────

interface FAQItemProps {
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}

function FAQAccordionItem({ item, isOpen, onToggle }: FAQItemProps) {
  const buttonId = `faq-button-${item.id}`
  const panelId = `faq-panel-${item.id}`
  
  const handleToggle = () => {
    if (!isOpen) {
      track(MARKETING_EVENTS.FAQ_EXPANDED, { faqId: item.id, question: item.question })
    }
    onToggle()
  }
  
  return (
    <div className="border-b border-border last:border-b-0">
      <h3>
        <button
          id={buttonId}
          onClick={handleToggle}
          className={cn(
            'flex items-center justify-between w-full py-5 text-left',
            'hover:text-primary transition-colors'
          )}
          aria-expanded={isOpen}
          aria-controls={panelId}
        >
          <span className="font-medium pr-4">{item.question}</span>
          <ChevronDown
            className={cn(
              'w-5 h-5 flex-shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>
      </h3>
      
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-5' : 'max-h-0'
        )}
        hidden={!isOpen}
      >
        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function FAQSection({
  title = 'Frequently Asked Questions',
  subtitle = 'Everything you need to know about our website services',
  faqs = GENERAL_FAQS,
  allowMultiple = false,
  className,
}: FAQSectionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  
  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      
      if (next.has(id)) {
        next.delete(id)
      } else {
        if (!allowMultiple) {
          next.clear()
        }
        next.add(id)
      }
      
      return next
    })
  }
  
  return (
    <section 
      className={cn('py-16 lg:py-24', className)} 
      id="faq"
      aria-labelledby="faq-heading"
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <HelpCircle className="w-6 h-6 text-primary" aria-hidden="true" />
            <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold">{title}</h2>
          </div>
          <p className="text-lg text-muted-foreground">{subtitle}</p>
        </div>
        
        {/* FAQ List */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-lg border border-border px-6">
            {faqs.map((faq) => (
              <FAQAccordionItem
                key={faq.id}
                item={faq}
                isOpen={openItems.has(faq.id)}
                onToggle={() => toggleItem(faq.id)}
              />
            ))}
          </div>
        </div>
        
        {/* Support CTA */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground">
            Still have questions?{' '}
            <a
              href="#booking"
              className="text-primary hover:underline font-medium"
            >
              Book a call
            </a>
            {' '}and we'll help you out.
          </p>
        </div>
      </div>
    </section>
  )
}

export default FAQSection
