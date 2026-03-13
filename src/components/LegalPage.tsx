import { ArrowLeft } from '@phosphor-icons/react'

import { Button } from './ui/button'

const LEGAL_PAGES: Record<string, { title: string; content: string[] }> = {
  privacy: {
    title: 'Privacy Policy',
    content: [
      'Devon Tyler Barber ("we", "us") operates devon-tyler.com. This page informs you of our policies regarding the collection, use, and disclosure of personal information.',
      'Information Collection — This site is a static, local-first web application. We do not collect personal data through server-side analytics, cookies, or tracking pixels. All user data (settings, preferences) is stored exclusively in your browser\'s localStorage and never transmitted to any server.',
      'Third-Party Services — If you contact us via email, your message is handled by your email provider and ours (Proton Mail / custom domain). We do not sell or share email correspondence with third parties.',
      'External Links — This site contains links to external services (GitHub, Stripe, Evident Platform). Each has its own privacy policy. We are not responsible for the privacy practices of external sites.',
      'Security — We use Content Security Policy headers, HTTPS, and modern security practices to protect the integrity of this site. No sensitive user data is stored server-side.',
      'Changes — We may update this policy from time to time. Changes will be reflected on this page with the updated date.',
      'Contact — For privacy inquiries, email hi@devon-tyler.com.',
      'Last updated: March 2026.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    content: [
      'By accessing devon-tyler.com, you agree to the following terms.',
      'Use of Site — This site is provided for informational purposes. You may browse, view projects, and contact us through the provided channels. The site is offered "as-is" without warranties of any kind.',
      'Intellectual Property — All content, code, and designs on this site are the property of Devon Tyler Barber or their respective owners unless otherwise noted. Open-source projects are governed by their individual licenses (typically MIT).',
      'Court Documents — Court documents referenced on this site are public records obtained through lawful channels. Their inclusion does not constitute legal advice.',
      'Investment Information — Investment-related content is for informational purposes only and does not constitute a securities offering, financial advice, or guarantee of returns. All investment involves risk.',
      'Limitation of Liability — Devon Tyler Barber shall not be liable for any damages arising from the use of this site or reliance on its content.',
      'Governing Law — These terms are governed by the laws of the State of New Jersey.',
      'Contact — For questions about these terms, email hi@devon-tyler.com.',
      'Last updated: March 2026.',
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
        <h2 className="text-3xl font-bold mb-8">{page.title}</h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          {page.content.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </main>
    </div>
  )
}
