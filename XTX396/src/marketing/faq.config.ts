/**
 * FAQ Configuration
 *
 * Central config for marketing FAQ sections.
 * Edit this file to change FAQ content without touching JSX.
 */

export interface FAQItem {
  id: string
  question: string
  answer: string
  category?: string
  order: number
}

// ─── General FAQs ────────────────────────────────────────────

export const GENERAL_FAQS: FAQItem[] = [
  {
    id: 'faq-timeline',
    question: 'How long does it take to build my website?',
    answer: 'Most websites are delivered within 72 hours of receiving your content. Premium packages include priority 48-hour delivery. We send you a preview link before going live so you can review everything.',
    category: 'process',
    order: 1,
  },
  {
    id: 'faq-hosting',
    question: 'Do you need access to my hosting?',
    answer: 'No. We deploy your site to our optimized infrastructure. If you prefer self-hosting, we provide an export package you can deploy anywhere. Custom domain setup is included.',
    category: 'technical',
    order: 2,
  },
  {
    id: 'faq-domain',
    question: 'Can I keep my existing domain?',
    answer: 'Absolutely. We help you point your existing domain to your new site, or we can help you purchase a new domain if needed. Domain setup is included in all packages.',
    category: 'technical',
    order: 3,
  },
  {
    id: 'faq-revisions',
    question: 'What if I don\'t like the draft?',
    answer: 'We include revisions in every package. Professional and Premium tiers include unlimited revisions for 30 days. We work with you until you\'re satisfied.',
    category: 'process',
    order: 4,
  },
  {
    id: 'faq-deposit',
    question: 'Why is a deposit required?',
    answer: 'A deposit reserves your spot in our production queue and covers initial design work. The remaining balance is due upon your approval of the preview, before we deploy.',
    category: 'payment',
    order: 5,
  },
  {
    id: 'faq-refund',
    question: 'What is your refund policy?',
    answer: 'If you\'re not satisfied with the preview and we cannot resolve your concerns through revisions, we offer a full deposit refund. No questions asked.',
    category: 'payment',
    order: 6,
  },
  {
    id: 'faq-maintenance',
    question: 'What about ongoing maintenance?',
    answer: 'All sites include 30 days of support post-launch. We offer optional monthly maintenance plans starting at $99/month for updates, security patches, and content changes.',
    category: 'support',
    order: 7,
  },
  {
    id: 'faq-content',
    question: 'What content do I need to provide?',
    answer: 'At minimum: your business name, contact info, and a brief description of your services. We can work with whatever you have—photos, bios, testimonials are helpful but not required to start.',
    category: 'process',
    order: 8,
  },
]

// ─── Law Firm Specific FAQs ──────────────────────────────────

export const LAW_FIRM_FAQS: FAQItem[] = [
  {
    id: 'faq-law-ethics',
    question: 'Are your law firm sites ethics-compliant?',
    answer: 'Yes. We include standard ethics disclaimers, avoid guaranteed outcome language, and follow bar advertising guidelines. You should still have your state bar review before launch.',
    category: 'legal',
    order: 1,
  },
  {
    id: 'faq-law-intake',
    question: 'Do intake forms comply with confidentiality rules?',
    answer: 'Yes. Our intake forms include confidentiality notices and we recommend reviewing the language with your malpractice carrier. We do not store client data—submissions go directly to your email.',
    category: 'legal',
    order: 2,
  },
  {
    id: 'faq-law-results',
    question: 'Can I list case results?',
    answer: 'We include case results sections with proper disclaimers about past results not guaranteeing future outcomes. You control what results to display based on your jurisdiction\'s rules.',
    category: 'legal',
    order: 3,
  },
]

// ─── SMB Specific FAQs ───────────────────────────────────────

export const SMB_FAQS: FAQItem[] = [
  {
    id: 'faq-smb-seo',
    question: 'Will my site rank on Google?',
    answer: 'We include basic SEO setup: proper meta tags, structured data, sitemap, and mobile optimization. Rankings depend on many factors, but we give you a solid foundation.',
    category: 'technical',
    order: 1,
  },
  {
    id: 'faq-smb-ecommerce',
    question: 'Can I sell products on my site?',
    answer: 'Our standard packages are service-focused websites. For e-commerce functionality, we recommend a custom consultation to discuss your specific needs.',
    category: 'features',
    order: 2,
  },
]

// ─── Agency Specific FAQs ────────────────────────────────────

export const AGENCY_FAQS: FAQItem[] = [
  {
    id: 'faq-agency-portfolio',
    question: 'How do I update my portfolio?',
    answer: 'You receive access to a simple admin panel where you can add, edit, and remove portfolio items. We provide a quick tutorial video and documentation.',
    category: 'technical',
    order: 1,
  },
  {
    id: 'faq-agency-branding',
    question: 'Can you match our existing brand guidelines?',
    answer: 'Absolutely. Send us your brand guidelines, color palette, and fonts. We\'ll match your existing identity or help you evolve it if desired.',
    category: 'design',
    order: 2,
  },
]

// ─── All FAQs Combined ───────────────────────────────────────

export const ALL_FAQS: FAQItem[] = [
  ...GENERAL_FAQS,
  ...LAW_FIRM_FAQS,
  ...SMB_FAQS,
  ...AGENCY_FAQS,
].sort((a, b) => a.order - b.order)

// ─── Helpers ─────────────────────────────────────────────────

export function getFAQsByCategory(category: string): FAQItem[] {
  return ALL_FAQS.filter(f => f.category === category)
}

export function getFAQsForOffer(offerId: string): FAQItem[] {
  const general = GENERAL_FAQS
  
  if (offerId.includes('law-firm')) {
    return [...general, ...LAW_FIRM_FAQS]
  }
  if (offerId.includes('small-business')) {
    return [...general, ...SMB_FAQS]
  }
  if (offerId.includes('agency')) {
    return [...general, ...AGENCY_FAQS]
  }
  
  return general
}
