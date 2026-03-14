import { ArrowLeft } from '@phosphor-icons/react'

import { Button } from './ui/button'

type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

interface LegalPageData {
  title: string
  effectiveDate: string
  content: ContentBlock[]
}

const LEGAL_PAGES: Record<string, LegalPageData> = {
  privacy: {
    title: 'Privacy Policy',
    effectiveDate: 'March 14, 2026',
    content: [
      { type: 'paragraph', text: 'Devon Tyler Barber, operating through Evident Technologies LLC ("we," "us," or "our"), operates the website devon-tyler.com (the "Site"). This Privacy Policy describes how we collect, use, and protect information when you visit or interact with the Site.' },

      { type: 'heading', text: '1. Information We Collect' },
      { type: 'paragraph', text: 'We are committed to minimal data collection. The Site is a static, client-side web application. We do not operate server-side databases, user accounts, or authentication systems for public visitors.' },
      { type: 'heading', text: '1.1 Information You Provide' },
      { type: 'list', items: [
        'Contact Information: If you contact us via email (hi@devon-tyler.com or law@devon-tyler.com), we receive and store the information you voluntarily provide, including your name, email address, and message content.',
        'Service Inquiries: If you submit a service inquiry or investment interest through the Site, we collect the information you provide in that communication.',
      ]},
      { type: 'heading', text: '1.2 Information Collected Automatically' },
      { type: 'list', items: [
        'Local Storage: The Site uses your browser\'s localStorage to save user preferences (theme, display settings). This data never leaves your device and is not transmitted to any server.',
        'No Cookies: We do not use cookies, session tokens, or any browser-based tracking mechanism.',
        'No Analytics: We do not use Google Analytics, Meta Pixel, or any third-party analytics or tracking service.',
        'No Server Logs: As a static site hosted on GitHub Pages, standard CDN access logs may exist at the infrastructure level (GitHub\'s privacy policy governs those). We do not access, process, or store such logs.',
      ]},

      { type: 'heading', text: '2. How We Use Information' },
      { type: 'paragraph', text: 'Information you voluntarily provide is used solely to:' },
      { type: 'list', items: [
        'Respond to your inquiries or communications.',
        'Discuss potential services, partnerships, or investment opportunities.',
        'Fulfill legal obligations if required by law or court order.',
      ]},
      { type: 'paragraph', text: 'We do not sell, rent, lease, or share your personal information with third parties for marketing purposes.' },

      { type: 'heading', text: '3. Third-Party Services' },
      { type: 'paragraph', text: 'The Site may contain links to external services, each governed by its own privacy policy:' },
      { type: 'list', items: [
        'GitHub (github.com) — Source code hosting and site deployment.',
        'Stripe (stripe.com) — If you engage a paid service, payment processing is handled entirely by Stripe. We do not store credit card numbers or financial account details.',
        'Evident Platform (evident.icu) — Our affiliated ecosystem of applications. Each application maintains its own privacy practices.',
      ]},
      { type: 'paragraph', text: 'We are not responsible for the privacy practices of third-party services. We encourage you to review their policies.' },

      { type: 'heading', text: '4. Court Documents & Public Records' },
      { type: 'paragraph', text: 'The Site references court filings and legal documents that are public records obtained through lawful channels, including court electronic filing systems and public records requests. Personal information appearing in these documents (names, docket numbers, court details) is already part of the public record. We do not publish sealed, expunged, or confidential court records.' },

      { type: 'heading', text: '5. Data Security' },
      { type: 'paragraph', text: 'We implement reasonable measures to protect the integrity and security of the Site, including:' },
      { type: 'list', items: [
        'HTTPS encryption on all connections.',
        'Content Security Policy (CSP) headers.',
        'No server-side storage of user data.',
        'Subresource Integrity (SRI) where applicable.',
      ]},
      { type: 'paragraph', text: 'No method of electronic transmission or storage is 100% secure. While we strive to protect information, we cannot guarantee absolute security.' },

      { type: 'heading', text: '6. Children\'s Privacy' },
      { type: 'paragraph', text: 'The Site is not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will promptly delete it.' },

      { type: 'heading', text: '7. Your Rights' },
      { type: 'paragraph', text: 'Because we collect minimal data, most privacy rights are satisfied by design. If you have communicated with us via email and wish to:' },
      { type: 'list', items: [
        'Request a copy of information we hold about you,',
        'Request deletion of your correspondence,',
        'Opt out of any future communications,',
      ]},
      { type: 'paragraph', text: 'please contact us at law@devon-tyler.com. We will respond within 30 days.' },

      { type: 'heading', text: '8. New Jersey Residents' },
      { type: 'paragraph', text: 'Under the New Jersey Data Privacy Act (NJDPA), effective January 15, 2025, New Jersey residents have the right to access, correct, delete, and obtain a copy of their personal data, as well as the right to opt out of the sale of personal data. Because we do not collect, sell, or share personal data through this Site, these rights are satisfied by default. For any inquiries, contact law@devon-tyler.com.' },

      { type: 'heading', text: '9. Changes to This Policy' },
      { type: 'paragraph', text: 'We may update this Privacy Policy from time to time. Changes will be posted on this page with a revised effective date. Your continued use of the Site after changes constitutes acceptance of the updated policy.' },

      { type: 'heading', text: '10. Contact' },
      { type: 'paragraph', text: 'For privacy inquiries or requests:' },
      { type: 'list', items: [
        'Email: law@devon-tyler.com',
        'General: hi@devon-tyler.com',
        'Entity: Evident Technologies LLC',
      ]},
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    effectiveDate: 'March 14, 2026',
    content: [
      { type: 'paragraph', text: 'These Terms & Conditions ("Terms") govern your access to and use of devon-tyler.com (the "Site"), operated by Devon Tyler Barber through Evident Technologies LLC ("we," "us," or "our"). By accessing or using the Site, you agree to be bound by these Terms. If you do not agree, do not use the Site.' },

      { type: 'heading', text: '1. Use of the Site' },
      { type: 'paragraph', text: 'The Site is provided for informational, portfolio, and professional services purposes. You may browse the Site, view project information, review public court records, and contact us through provided channels.' },
      { type: 'paragraph', text: 'You agree not to:' },
      { type: 'list', items: [
        'Use the Site for any unlawful purpose or in violation of these Terms.',
        'Attempt to gain unauthorized access to any part of the Site or its infrastructure.',
        'Engage in automated scraping, crawling, or data extraction beyond what is permitted by robots.txt.',
        'Reproduce, distribute, or create derivative works from the Site\'s content without authorization, except as permitted by applicable open-source licenses.',
        'Misrepresent your identity or affiliation when contacting us.',
      ]},

      { type: 'heading', text: '2. Intellectual Property' },
      { type: 'paragraph', text: 'All original content, designs, text, graphics, and software on the Site are the property of Devon Tyler Barber or Evident Technologies LLC, unless otherwise noted. All rights are reserved.' },
      { type: 'list', items: [
        'Open-Source Code: Software projects displayed on the Site may be governed by their individual open-source licenses (typically MIT License). The license for each project is specified in its repository.',
        'Third-Party Content: Trademarks, logos, and content belonging to third parties are the property of their respective owners and are used for identification purposes only.',
        'Court Documents: Public court records referenced on the Site are not subject to copyright claims by us. They remain public records.',
      ]},

      { type: 'heading', text: '3. Services & Offerings' },
      { type: 'paragraph', text: 'The Site displays web development and technology services offered by Devon Tyler Barber. Service descriptions and pricing are informational and do not constitute binding offers. All service engagements are subject to a separate written agreement.' },
      { type: 'paragraph', text: 'Any fees displayed are subject to change without notice. Actual pricing will be confirmed in a service agreement before work begins.' },

      { type: 'heading', text: '4. Court Documents & Legal Disclaimer' },
      { type: 'paragraph', text: 'The Site includes a public court document management system ("Case Jacket") that indexes and presents court filings. These documents are public records obtained through lawful means.' },
      { type: 'list', items: [
        'No Legal Advice: Nothing on the Site constitutes legal advice, attorney-client relationship, or professional legal consultation. The presentation of court documents is for transparency and public accountability purposes.',
        'Accuracy: While we strive for accuracy in document indexing and case information, we do not guarantee that all information is complete, current, or error-free. Verify all legal information through official court records.',
        'Pro Se Representation: References to pro se litigation reflect the actions of an individual party. This does not imply that similar actions are appropriate for your situation.',
      ]},

      { type: 'heading', text: '5. Investment Information' },
      { type: 'paragraph', text: 'The Site may contain information about investment opportunities, business metrics, or partnership structures. This information is provided for general informational purposes only.' },
      { type: 'list', items: [
        'Not a Securities Offering: Nothing on the Site constitutes an offer to sell or a solicitation to buy securities. Any investment opportunity will be presented through proper legal channels with appropriate disclosures.',
        'No Financial Advice: Content on the Site does not constitute financial, tax, or investment advice. Consult qualified professionals before making financial decisions.',
        'Risk: All investment activity involves risk, including the potential loss of principal. Past performance does not guarantee future results.',
      ]},

      { type: 'heading', text: '6. Disclaimer of Warranties' },
      { type: 'paragraph', text: 'THE SITE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY.' },
      { type: 'paragraph', text: 'We do not warrant that the Site will be uninterrupted, error-free, secure, or free of viruses or other harmful components.' },

      { type: 'heading', text: '7. Limitation of Liability' },
      { type: 'paragraph', text: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DEVON TYLER BARBER AND EVIDENT TECHNOLOGIES LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SITE, WHETHER BASED ON WARRANTY, CONTRACT, TORT, OR ANY OTHER LEGAL THEORY.' },
      { type: 'paragraph', text: 'Our total liability for any claim arising from or related to the Site shall not exceed one hundred dollars ($100.00) or the amount you paid us in the twelve months preceding the claim, whichever is greater.' },

      { type: 'heading', text: '8. Indemnification' },
      { type: 'paragraph', text: 'You agree to indemnify, defend, and hold harmless Devon Tyler Barber and Evident Technologies LLC from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys\' fees) arising from your use of the Site or violation of these Terms.' },

      { type: 'heading', text: '9. External Links' },
      { type: 'paragraph', text: 'The Site contains links to third-party websites and services. We do not control and are not responsible for the content, privacy policies, or practices of any third-party site. Links do not imply endorsement.' },

      { type: 'heading', text: '10. Modifications' },
      { type: 'paragraph', text: 'We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Site with a revised effective date. Your continued use of the Site after changes constitutes acceptance of the revised Terms.' },

      { type: 'heading', text: '11. Termination' },
      { type: 'paragraph', text: 'We reserve the right to restrict or terminate your access to the Site at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.' },

      { type: 'heading', text: '12. Governing Law & Dispute Resolution' },
      { type: 'paragraph', text: 'These Terms are governed by and construed in accordance with the laws of the State of New Jersey, without regard to conflict of law principles. Any dispute arising under these Terms shall be subject to the exclusive jurisdiction of the state and federal courts located in the State of New Jersey.' },
      { type: 'paragraph', text: 'Before initiating any legal proceeding, you agree to attempt to resolve the dispute informally by contacting us at law@devon-tyler.com. We will attempt to resolve the dispute within 30 days.' },

      { type: 'heading', text: '13. Severability' },
      { type: 'paragraph', text: 'If any provision of these Terms is held to be unenforceable or invalid, the remaining provisions will continue in full force and effect.' },

      { type: 'heading', text: '14. Entire Agreement' },
      { type: 'paragraph', text: 'These Terms, together with the Privacy Policy, constitute the entire agreement between you and us regarding the use of the Site and supersede all prior agreements and understandings.' },

      { type: 'heading', text: '15. Contact' },
      { type: 'paragraph', text: 'For questions about these Terms:' },
      { type: 'list', items: [
        'Legal inquiries: law@devon-tyler.com',
        'General inquiries: hi@devon-tyler.com',
        'Entity: Evident Technologies LLC',
      ]},
    ],
  },
}

interface LegalPageProps {
  slug: string
  onBack: () => void
}

export default function LegalPage({ slug, onBack }: LegalPageProps) {
  const page = LEGAL_PAGES[slug]

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <Button onClick={onBack} variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/30 bg-card/40 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-lg font-semibold">{page.title}</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
        <h2 className="text-3xl font-bold mb-2">{page.title}</h2>
        <p className="text-sm text-muted-foreground mb-8">Effective Date: {page.effectiveDate}</p>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          {page.content.map((block, i) => {
            switch (block.type) {
              case 'heading':
                return <h3 key={i} className="text-lg font-semibold text-foreground pt-4">{block.text}</h3>
              case 'paragraph':
                return <p key={i}>{block.text}</p>
              case 'list':
                return (
                  <ul key={i} className="list-disc list-outside pl-6 space-y-2">
                    {block.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                )
              default:
                return null
            }
          })}
        </div>
        <div className="mt-12 pt-6 border-t border-border/30 text-sm text-muted-foreground/60">
          <p>&copy; {new Date().getFullYear()} Evident Technologies LLC. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}
