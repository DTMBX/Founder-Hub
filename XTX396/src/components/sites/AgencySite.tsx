/**
 * AgencySite — Public-facing agency portfolio / landing page renderer.
 *
 * Pure component: receives fully resolved data as props.
 * No runtime storage calls. Deterministic output.
 */

import type { AgencySiteData, AgencyConfig } from '@/lib/types'
import { useState } from 'react'
import { ArrowRight, Briefcase, Code, PencilLine, MagnifyingGlass, ChatDots, Envelope } from '@phosphor-icons/react'

const STATUS_LABELS: Record<string, string> = {
  discovery: 'Discovery', design: 'Design', development: 'Development',
  review: 'Review', launched: 'Launched', maintenance: 'Maintenance',
}

const TEMPLATE_LABELS: Record<string, string> = {
  'law-firm': 'Law Firm', 'small-business': 'Small Business',
  custom: 'Custom', 'landing-page': 'Landing Page',
}

const SERVICE_ICONS: Record<string, typeof Code> = {
  discovery: MagnifyingGlass, design: PencilLine, development: Code,
  review: ChatDots, meeting: ChatDots, admin: Briefcase,
}

export interface AgencySiteProps {
  data: AgencySiteData
  onBack?: () => void
}

export default function AgencySite({ data, onBack }: AgencySiteProps) {
  const c: AgencyConfig = data.config
  const agencyName = c.agencyName || data.name
  const launchedProjects = data.projects.filter((p) => p.status === 'launched' || p.status === 'maintenance')
  const activeProjects = data.projects.filter((p) => p.status !== 'launched' && p.status !== 'maintenance')

  // Derive services offered from time entry categories and project template types
  const templateTypes = [...new Set(data.projects.map((p) => p.templateType))]
  const timeCategories = [...new Set(data.timeEntries.map((e) => e.category))]

  const [mobileNav, setMobileNav] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <span className="font-bold text-lg text-white">{agencyName}</span>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
              {launchedProjects.length > 0 && <a href="#work" className="hover:text-white transition-colors">Work</a>}
              {timeCategories.length > 0 && <a href="#services" className="hover:text-white transition-colors">Services</a>}
              {activeProjects.length > 0 && <a href="#active" className="hover:text-white transition-colors">In Progress</a>}
              <a href="#contact" className="px-4 py-2 rounded-md bg-white text-gray-900 font-semibold hover:bg-gray-200 transition-colors">
                Get in Touch
              </a>
            </div>
            <button className="md:hidden p-2 text-gray-400" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation">
              <span className="block w-5 h-0.5 bg-current mb-1" />
              <span className="block w-5 h-0.5 bg-current mb-1" />
              <span className="block w-5 h-0.5 bg-current" />
            </button>
          </div>
          {mobileNav && (
            <div className="md:hidden pb-4 space-y-2 text-sm font-medium text-gray-400">
              {launchedProjects.length > 0 && <a href="#work" className="block py-1">Work</a>}
              {timeCategories.length > 0 && <a href="#services" className="block py-1">Services</a>}
              <a href="#contact" className="block py-1">Contact</a>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6">
            {agencyName}
          </h1>
          <p className="text-xl lg:text-2xl text-gray-400 max-w-3xl mb-4">
            {data.projects.length > 0
              ? `${launchedProjects.length} project${launchedProjects.length !== 1 ? 's' : ''} delivered. ${activeProjects.length} in progress.`
              : 'Digital products built with precision and purpose.'}
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            {templateTypes.map((t) => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                {TEMPLATE_LABELS[t] ?? t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Launched Projects */}
      {launchedProjects.length > 0 && (
        <section id="work" className="py-16 lg:py-24 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-2">Selected Work</h2>
            <p className="text-gray-500 mb-10">Projects we&rsquo;ve delivered to production.</p>
            <div className="grid md:grid-cols-2 gap-6">
              {launchedProjects.map((proj) => (
                <div key={proj.id} className="rounded-xl bg-gray-900 border border-gray-800 p-6 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{proj.projectName ?? proj.clientName}</h3>
                      {proj.projectName && <div className="text-sm text-gray-500">{proj.clientName}</div>}
                    </div>
                    <span className="px-2 py-1 text-xs rounded font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-800">
                      {STATUS_LABELS[proj.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">{TEMPLATE_LABELS[proj.templateType] ?? proj.templateType}</span>
                    {proj.domain && (
                      <a href={`https://${proj.domain}`} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 hover:bg-blue-900/50">
                        {proj.domain}
                      </a>
                    )}
                  </div>
                  {proj.deliverables.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {proj.deliverables.slice(0, 3).join(' · ')}
                      {proj.deliverables.length > 3 && ` +${proj.deliverables.length - 3} more`}
                    </div>
                  )}
                  {proj.launchDate && (
                    <div className="text-xs text-gray-600 mt-3">Launched {new Date(proj.launchDate).toLocaleDateString()}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {timeCategories.length > 0 && (
        <section id="services" className="py-16 lg:py-24 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-2">What We Do</h2>
            <p className="text-gray-500 mb-10">Core capabilities backed by tracked hours and deliverables.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeCategories.map((cat) => {
                const Icon = SERVICE_ICONS[cat] ?? Briefcase
                const hours = data.timeEntries.filter((e) => e.category === cat).reduce((sum, e) => sum + e.hours, 0)
                return (
                  <div key={cat} className="rounded-lg bg-gray-900 border border-gray-800 p-5">
                    <Icon className="h-6 w-6 text-gray-400 mb-3" />
                    <h3 className="font-semibold text-white capitalize mb-1">{cat}</h3>
                    <p className="text-sm text-gray-500">{Math.round(hours)} hours logged</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <section id="active" className="py-16 lg:py-24 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-2">In Progress</h2>
            <p className="text-gray-500 mb-10">Current engagements.</p>
            <div className="space-y-3">
              {activeProjects.map((proj) => (
                <div key={proj.id} className="flex items-center gap-4 rounded-lg bg-gray-900 border border-gray-800 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{proj.projectName ?? proj.clientName}</h3>
                    <p className="text-sm text-gray-500">{TEMPLATE_LABELS[proj.templateType] ?? proj.templateType}</p>
                  </div>
                  <span className="shrink-0 px-2 py-1 text-xs rounded font-medium bg-amber-900/40 text-amber-300 border border-amber-800">
                    {STATUS_LABELS[proj.status]}
                  </span>
                  <div className="hidden sm:block text-right shrink-0">
                    <div className="text-xs text-gray-500">
                      {proj.hoursUsed}/{proj.hoursEstimated}h
                    </div>
                    <div className="w-20 h-1 bg-gray-800 rounded-full mt-1">
                      <div
                        className="h-1 rounded-full bg-amber-500"
                        style={{ width: `${Math.min(100, (proj.hoursUsed / Math.max(1, proj.hoursEstimated)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="py-16 lg:py-24 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Start a Project</h2>
          <p className="text-gray-400 mb-8">
            {c.paymentTerms && `${c.paymentTerms}. `}
            Tell us about your project and we&rsquo;ll be in touch.
          </p>
          {c.notificationEmail && (
            <a
              href={`mailto:${c.notificationEmail}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-200 transition-colors"
            >
              <Envelope className="h-5 w-5" />
              {c.notificationEmail}
            </a>
          )}
          {!c.notificationEmail && (
            <div className="max-w-md mx-auto">
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <input type="text" placeholder="Your name" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" required />
                <input type="email" placeholder="Email" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" required />
                <select className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">Project type</option>
                  <option value="law-firm">Law Firm Website</option>
                  <option value="small-business">Small Business Website</option>
                  <option value="landing-page">Landing Page</option>
                  <option value="custom">Custom Project</option>
                </select>
                <textarea placeholder="Project details" rows={3} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500" />
                <button type="submit" className="w-full py-3 rounded-lg bg-white text-gray-900 font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                  Send Inquiry <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} {agencyName}
        </div>
      </footer>

      {/* Back button */}
      {onBack && (
        <button onClick={onBack} className="fixed bottom-4 right-4 z-50 bg-white text-gray-900 px-4 py-2 rounded-full text-xs font-medium shadow-lg hover:bg-gray-200 transition-colors">
          ← Back
        </button>
      )}
    </div>
  )
}
