/**
 * SMBSite — Public-facing small business website renderer.
 *
 * Pure component: receives fully resolved data as props.
 * No runtime storage calls. Deterministic output.
 */

import type { SMBSiteData, SMBTemplateConfig, SiteCoreBranding } from '@/lib/types'
import { useState } from 'react'
import { Phone, Envelope, MapPin, Star, Clock, ArrowRight, Tag } from '@phosphor-icons/react'

export interface SMBSiteProps {
  data: SMBSiteData
  onBack?: () => void
}

export default function SMBSite({ data, onBack }: SMBSiteProps) {
  const c: SMBTemplateConfig = data.config
  const b: SiteCoreBranding = data.branding
  const s = c.sections
  const primary = b.primaryColor
  const accent = b.secondaryColor ?? c.accentColor ?? '#f59e0b'

  const activePromos = data.promotions.filter((p) => p.active)
  const publishedPosts = data.blogPosts.filter((p) => p.status === 'published')
  const featuredTestimonials = data.testimonials.filter((t) => t.featured)
  const [mobileNav, setMobileNav] = useState(false)
  const [faqOpen, setFaqOpen] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Active Promotion Banner */}
      {s.promotions && activePromos.length > 0 && (
        <div className="text-center py-2 text-sm font-medium text-white" style={{ backgroundColor: accent }}>
          <Tag className="inline h-3.5 w-3.5 mr-1" weight="bold" />
          {activePromos[0].title}
          {activePromos[0].code && <span className="ml-2 font-mono bg-white/20 px-2 py-0.5 rounded text-xs">{activePromos[0].code}</span>}
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {(b.logo ?? c.logoUrl) && <img src={b.logo ?? c.logoUrl} alt={c.businessName} className="h-8 w-auto" />}
              <span className="font-bold text-lg" style={{ color: primary }}>{c.businessName || data.name}</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              {s.services && data.services.length > 0 && <a href="#services" className="hover:text-gray-600">Services</a>}
              {s.about && <a href="#about" className="hover:text-gray-600">About</a>}
              {s.gallery && data.galleryImages.length > 0 && <a href="#gallery" className="hover:text-gray-600">Gallery</a>}
              {s.blog && publishedPosts.length > 0 && <a href="#blog" className="hover:text-gray-600">Blog</a>}
              {s.contact && (
                <a href="#contact" className="px-4 py-2 rounded-md text-white text-sm font-semibold" style={{ backgroundColor: primary }}>
                  Contact Us
                </a>
              )}
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation">
              <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-700" />
            </button>
          </div>
          {mobileNav && (
            <div className="md:hidden pb-4 space-y-2 text-sm font-medium">
              {s.services && <a href="#services" className="block py-1">Services</a>}
              {s.about && <a href="#about" className="block py-1">About</a>}
              {s.contact && <a href="#contact" className="block py-1">Contact</a>}
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      {s.hero && (
        <section className="relative py-20 lg:py-32 overflow-hidden" style={
          c.heroStyle === 'image' && c.heroImageUrl
            ? { backgroundImage: `url(${c.heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%)` }
        }>
          {c.heroStyle === 'image' && c.heroImageUrl && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-4">{c.businessName || data.name}</h1>
            {c.tagline && <p className="text-xl lg:text-2xl opacity-90 mb-6 max-w-3xl mx-auto">{c.tagline}</p>}
            {c.description && <p className="text-base opacity-75 max-w-2xl mx-auto mb-8">{c.description}</p>}
            {c.ctaText && (
              <a href={c.ctaUrl ?? '#contact'} className="inline-block px-6 py-3 rounded-lg font-semibold text-sm" style={{ backgroundColor: accent, color: '#1a1a1a' }}>
                {c.ctaText}
              </a>
            )}
          </div>
        </section>
      )}

      {/* Services */}
      {s.services && data.services.length > 0 && (
        <section id="services" className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>Our Services</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...data.services].sort((a, b) => a.order - b.order).map((svc) => (
                <div key={svc.id} className="rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {svc.imageUrl && (
                    <div className="aspect-video bg-gray-100">
                      <img src={svc.imageUrl} alt={svc.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-lg mb-1">{svc.name}</h3>
                    {svc.price && <div className="text-sm font-medium mb-2" style={{ color: accent }}>{svc.price}</div>}
                    <p className="text-sm text-gray-600 mb-3">{svc.description}</p>
                    {svc.ctaText && (
                      <a href={svc.ctaUrl ?? '#contact'} className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: primary }}>
                        {svc.ctaText} <ArrowRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {s.about && c.description && (
        <section id="about" className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6" style={{ color: primary }}>About {c.businessName}</h2>
            <p className="text-gray-600 leading-relaxed">{c.description}</p>
            {c.hours && (
              <div className="mt-6 inline-flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" /> {c.hours}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Team */}
      {s.team && data.team.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>Our Team</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...data.team].sort((a, b) => a.order - b.order).map((m) => (
                <div key={m.id} className="text-center">
                  {m.photoUrl ? (
                    <img src={m.photoUrl} alt={m.name} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" loading="lazy" />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto mb-3 bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <h3 className="font-semibold">{m.name}</h3>
                  <p className="text-sm text-gray-500">{m.role}</p>
                  {m.bio && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{m.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {s.testimonials && featuredTestimonials.length > 0 && (
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>What Our Clients Say</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTestimonials.sort((a, b) => a.order - b.order).map((t) => (
                <div key={t.id} className="bg-white rounded-xl p-6 shadow-sm">
                  {t.rating && (
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4" style={{ color: accent }} weight="fill" />
                      ))}
                    </div>
                  )}
                  <blockquote className="text-sm text-gray-700 italic mb-4">&ldquo;{t.quote}&rdquo;</blockquote>
                  <div className="text-sm font-medium">{t.clientName}</div>
                  {t.clientTitle && <div className="text-xs text-gray-500">{t.clientTitle}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {s.faq && data.faqs.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>Frequently Asked Questions</h2>
            <div className="space-y-3">
              {[...data.faqs].sort((a, b) => a.order - b.order).map((faq) => (
                <div key={faq.id} className="border border-gray-200 rounded-lg">
                  <button
                    className="w-full text-left px-5 py-4 flex items-center justify-between text-sm font-medium"
                    onClick={() => setFaqOpen(faqOpen === faq.id ? null : faq.id)}
                    aria-expanded={faqOpen === faq.id}
                  >
                    {faq.question}
                    <span className="ml-2 shrink-0 text-gray-400">{faqOpen === faq.id ? '−' : '+'}</span>
                  </button>
                  {faqOpen === faq.id && (
                    <div className="px-5 pb-4 text-sm text-gray-600">{faq.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {s.gallery && data.galleryImages.length > 0 && (
        <section id="gallery" className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...data.galleryImages].sort((a, b) => a.order - b.order).map((img) => (
                <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img.url} alt={img.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog */}
      {s.blog && publishedPosts.length > 0 && (
        <section id="blog" className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>Latest News</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedPosts.sort((a, b) => a.order - b.order).slice(0, 6).map((post) => (
                <article key={post.id} className="rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                  {post.featuredImageUrl && (
                    <div className="aspect-video bg-gray-100">
                      <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="p-5">
                    {post.category && <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accent }}>{post.category}</div>}
                    <h3 className="font-semibold mb-2">{post.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      {s.contact && (
        <section id="contact" className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: primary }}>Get in Touch</h2>
            <div className="flex items-center justify-center gap-6 mb-8 text-sm text-gray-600 flex-wrap">
              {c.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {c.phone}</span>}
              {c.email && <span className="flex items-center gap-1"><Envelope className="h-4 w-4" /> {c.email}</span>}
              {c.address && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {c.address}</span>}
            </div>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="smb-name" className="sr-only">Your name</label>
                  <input id="smb-name" type="text" placeholder="Your name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label htmlFor="smb-email" className="sr-only">Email address</label>
                  <input id="smb-email" type="email" placeholder="Email address" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
              </div>
              <label htmlFor="smb-phone" className="sr-only">Phone</label>
              <input id="smb-phone" type="tel" placeholder="Phone (optional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <label htmlFor="smb-message" className="sr-only">Message</label>
              <textarea id="smb-message" placeholder="How can we help you?" rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
              <button type="submit" className="w-full py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: primary }}>
                Send Message
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Map */}
      {s.map && c.mapEmbedUrl && (
        <section className="h-80">
          <iframe src={c.mapEmbedUrl} title="Location map" className="w-full h-full border-0" loading="lazy" allowFullScreen />
        </section>
      )}

      {/* Footer */}
      <footer className="py-8 text-white" style={{ backgroundColor: primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm opacity-80">
          <span>&copy; {new Date().getFullYear()} {c.businessName || data.name}</span>
          {c.socialLinks && Object.keys(c.socialLinks).length > 0 && (
            <div className="flex gap-4">
              {Object.entries(c.socialLinks).map(([platform, url]) => (
                <a key={platform} href={url} className="hover:opacity-100 capitalize" target="_blank" rel="noopener noreferrer">{platform}</a>
              ))}
            </div>
          )}
        </div>
      </footer>

      {/* Back button */}
      {onBack && (
        <button onClick={onBack} className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg hover:bg-gray-800 transition-colors">
          ← Back
        </button>
      )}
    </div>
  )
}
