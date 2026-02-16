/**
 * LawFirmSite — Public-facing law firm website renderer.
 *
 * Pure component: receives fully resolved data as props.
 * No runtime storage calls. Deterministic output.
 */

import type { LawFirmSiteData, LawFirmConfig, SiteCoreBranding } from '@/lib/types'
import { useState } from 'react'
import { Phone, Envelope, MapPin, Star, ArrowRight } from '@phosphor-icons/react'

export interface LawFirmSiteProps {
  data: LawFirmSiteData
  onBack?: () => void
}

export default function LawFirmSite({ data, onBack }: LawFirmSiteProps) {
  const c: LawFirmConfig = data.config
  const b: SiteCoreBranding = data.branding
  const primary = b.primaryColor
  const accent = b.secondaryColor ?? c.accentColor ?? '#c7a44a'

  const publishedPosts = data.blogPosts.filter((p) => p.status === 'published')
  const featuredResults = data.caseResults.filter((r) => r.featured && !r.isConfidential)
  const featuredAttorneys = data.attorneys.filter((a) => a.featured)
  const featuredTestimonials = data.testimonials.filter((t) => t.featured)

  const [mobileNav, setMobileNav] = useState(false)

  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ '--firm-primary': primary, '--firm-accent': accent } as React.CSSProperties}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {(b.logo ?? c.logoUrl) && <img src={b.logo ?? c.logoUrl} alt={c.firmName} className="h-8 w-auto" />}
              <span className="font-bold text-lg" style={{ color: primary }}>{c.firmName || data.name}</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              {data.practiceAreas.length > 0 && <a href="#practice-areas" className="hover:text-gray-600">Practice Areas</a>}
              {featuredResults.length > 0 && <a href="#results" className="hover:text-gray-600">Results</a>}
              {data.attorneys.length > 0 && <a href="#attorneys" className="hover:text-gray-600">Attorneys</a>}
              {publishedPosts.length > 0 && <a href="#insights" className="hover:text-gray-600">Insights</a>}
              {c.intakeFormEnabled && (
                <a href="#contact" className="px-4 py-2 rounded-md text-white text-sm font-semibold" style={{ backgroundColor: primary }}>
                  Free Consultation
                </a>
              )}
              {(c.headerLinks ?? []).map((l, i) => (
                <a key={i} href={l.href} className="hover:text-gray-600">{l.label}</a>
              ))}
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation">
              <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-700 mb-1" />
              <span className="block w-5 h-0.5 bg-gray-700" />
            </button>
          </div>
          {mobileNav && (
            <div className="md:hidden pb-4 space-y-2 text-sm font-medium">
              {data.practiceAreas.length > 0 && <a href="#practice-areas" className="block py-1">Practice Areas</a>}
              {data.attorneys.length > 0 && <a href="#attorneys" className="block py-1">Attorneys</a>}
              {c.intakeFormEnabled && <a href="#contact" className="block py-1">Contact</a>}
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-20 lg:py-32" style={{ backgroundColor: primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-4">{c.firmName || data.name}</h1>
          {c.tagline && <p className="text-xl lg:text-2xl opacity-90 mb-6 max-w-3xl mx-auto">{c.tagline}</p>}
          {c.description && <p className="text-base opacity-75 max-w-2xl mx-auto mb-8">{c.description}</p>}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {c.intakeFormEnabled && (
              <a href="#contact" className="px-6 py-3 rounded-lg font-semibold text-sm" style={{ backgroundColor: accent, color: primary }}>
                Schedule a Consultation
              </a>
            )}
            {c.phone && (
              <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-white/90 hover:text-white">
                <Phone className="h-4 w-4" /> {c.phone}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Practice Areas */}
      {data.practiceAreas.length > 0 && (
        <section id="practice-areas" className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>Practice Areas</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...data.practiceAreas].sort((a, b) => a.order - b.order).map((area) => (
                <div key={area.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-2" style={{ color: primary }}>{area.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{area.description}</p>
                  {area.keyPoints.length > 0 && (
                    <ul className="space-y-1">
                      {area.keyPoints.slice(0, 4).map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                          <ArrowRight className="h-3 w-3 mt-1 shrink-0" style={{ color: accent }} /> {pt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Results */}
      {featuredResults.length > 0 && (
        <section id="results" className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: primary }}>Notable Results</h2>
            <p className="text-center text-sm text-gray-500 mb-12 max-w-xl mx-auto">Past results do not guarantee future outcomes.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResults.sort((a, b) => a.order - b.order).map((r) => (
                <div key={r.id} className="rounded-xl border border-gray-100 p-6 shadow-sm">
                  <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: accent }}>{r.resultType}</div>
                  {r.amount && <div className="text-3xl font-bold mb-1" style={{ color: primary }}>{fmt(r.amount)}</div>}
                  <h3 className="font-semibold text-gray-900 mb-2">{r.title}</h3>
                  <p className="text-sm text-gray-600">{r.summary}</p>
                  {r.practiceArea && <div className="mt-3 text-xs text-gray-400">{r.practiceArea}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Attorneys */}
      {data.attorneys.length > 0 && (
        <section id="attorneys" className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>Our Attorneys</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(featuredAttorneys.length > 0 ? featuredAttorneys : data.attorneys)
                .sort((a, b) => a.order - b.order)
                .slice(0, 6)
                .map((att) => (
                  <div key={att.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {att.photoUrl && (
                      <div className="aspect-[4/3] bg-gray-100">
                        <img src={att.photoUrl} alt={att.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-semibold text-lg">{att.name}</h3>
                      <p className="text-sm" style={{ color: accent }}>{att.title}</p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">{att.bio}</p>
                      {att.practiceAreas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {att.practiceAreas.slice(0, 3).map((pa) => (
                            <span key={pa} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{pa}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {featuredTestimonials.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>Client Testimonials</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTestimonials.sort((a, b) => a.order - b.order).map((t) => (
                <div key={t.id} className="bg-gray-50 rounded-xl p-6">
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

      {/* Blog */}
      {publishedPosts.length > 0 && (
        <section id="insights" className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: primary }}>Legal Insights</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedPosts.sort((a, b) => a.order - b.order).slice(0, 6).map((post) => (
                <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {post.featuredImageUrl && (
                    <div className="aspect-video bg-gray-100">
                      <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    {post.practiceArea && <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: accent }}>{post.practiceArea}</div>}
                    <h3 className="font-semibold mb-2">{post.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                    {post.publishedAt && <div className="text-xs text-gray-400 mt-3">{new Date(post.publishedAt).toLocaleDateString()}</div>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact / Intake */}
      {c.intakeFormEnabled && (
        <section id="contact" className="py-16 lg:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: primary }}>Schedule a Consultation</h2>
            <p className="text-center text-gray-600 text-sm mb-8">Fill out the form below and we will get back to you promptly.</p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {c.intakeFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows={4} required={field.required} />
                  ) : field.type === 'select' ? (
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required={field.required}>
                      <option value="">Select...</option>
                      {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input type={field.type} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" required={field.required} />
                  )}
                </div>
              ))}
              <button type="submit" className="w-full py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: primary }}>
                Submit
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 text-white" style={{ backgroundColor: primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Firm info */}
            <div>
              <h3 className="font-bold text-lg mb-3">{c.firmName || data.name}</h3>
              {c.address && <p className="text-sm opacity-80 flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 mt-0.5" /> {c.address}</p>}
              {c.phone && <p className="text-sm opacity-80 flex items-center gap-2 mt-1"><Phone className="h-4 w-4" /> {c.phone}</p>}
              {c.email && <p className="text-sm opacity-80 flex items-center gap-2 mt-1"><Envelope className="h-4 w-4" /> {c.email}</p>}
            </div>
            {/* Office Locations */}
            {(c.officeLocations ?? []).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Offices</h4>
                {c.officeLocations!.map((loc) => (
                  <div key={loc.id} className="text-sm opacity-80 mb-2">
                    <span className="font-medium">{loc.name}</span>
                    <br />{loc.address}
                  </div>
                ))}
              </div>
            )}
            {/* Footer links */}
            {(c.footerLinks ?? []).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Links</h4>
                <div className="space-y-1">
                  {c.footerLinks!.sort((a, b) => a.order - b.order).map((l, i) => (
                    <a key={i} href={l.href} className="block text-sm opacity-80 hover:opacity-100">{l.label}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
          {c.disclaimer && (
            <div className="pt-6 border-t border-white/20">
              <p className="text-xs opacity-60 max-w-4xl">{c.disclaimer}</p>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between text-xs opacity-50">
            <span>&copy; {new Date().getFullYear()} {c.firmName || data.name}</span>
            {c.privacyPolicyUrl && <a href={c.privacyPolicyUrl} className="hover:opacity-100">Privacy Policy</a>}
          </div>
        </div>
      </footer>

      {/* Back button (for embedded/demo viewing) */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-full text-xs font-medium shadow-lg hover:bg-gray-800 transition-colors"
        >
          ← Back
        </button>
      )}
    </div>
  )
}
