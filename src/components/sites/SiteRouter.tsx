/**
 * SiteRouter — Resolves slug or siteId and renders the correct public site.
 *
 * Handles:
 *  - Slug resolution → siteId lookup via SiteRegistry
 *  - siteId direct access (preview mode)
 *  - Status-based visibility gating:
 *    • public / demo: accessible via #s/{slug}
 *    • unlisted: accessible via #s/{slug} (not indexed) or #preview/{siteId}
 *    • private: accessible only via #preview/{siteId} (admin-only)
 *    • draft: accessible only via #preview/{siteId}
 */

import { useState, useEffect } from 'react'
import { getSiteRegistry } from '@/lib/site-registry'
import type { SiteSummary, NormalizedSiteData, LawFirmSiteData, SMBSiteData, AgencySiteData } from '@/lib/types'
import LawFirmSite from './LawFirmSite'
import SMBSite from './SMBSite'
import AgencySite from './AgencySite'

interface SiteRouterProps {
  /** Slug from #s/{slug} route — public access */
  slug?: string
  /** Direct siteId from #preview/{siteId} route — preview access */
  siteId?: string
  /** Access mode determines visibility rules */
  mode: 'public' | 'preview'
  /** Navigate back to main site */
  onBack: () => void
}

type LoadState =
  | { status: 'loading' }
  | { status: 'resolved'; site: SiteSummary; data: NormalizedSiteData }
  | { status: 'not-found' }
  | { status: 'forbidden'; reason: string }

export default function SiteRouter({ slug, siteId, mode, onBack }: SiteRouterProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      const registry = getSiteRegistry()
      let site: SiteSummary | null = null

      if (slug) {
        site = await registry.findBySlug(slug)
      } else if (siteId) {
        site = await registry.get(siteId)
      }

      if (cancelled) return

      if (!site) {
        setState({ status: 'not-found' })
        return
      }

      // Visibility gating
      if (mode === 'public') {
        // Public route: allow public, demo, and unlisted sites
        if (site.status === 'private' || site.status === 'draft') {
          setState({ status: 'forbidden', reason: 'This site is not publicly accessible.' })
          return
        }
      }
      // Preview mode: allow all statuses (admin access implied)

      // Fetch normalized data
      const normalized = await registry.getNormalizedSiteData(site.siteId)
      if (!normalized) {
        setState({ status: 'not-found' })
        return
      }

      setState({ status: 'resolved', site, data: normalized })
    }

    resolve()
    return () => { cancelled = true }
  }, [slug, siteId, mode])

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading site&hellip;</p>
        </div>
      </div>
    )
  }

  if (state.status === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
          <p className="text-gray-600 mb-6">Site not found.</p>
          <button onClick={onBack} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (state.status === 'forbidden') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <h1 className="text-6xl font-bold text-gray-200 mb-4">403</h1>
          <p className="text-gray-600 mb-6">{state.reason}</p>
          <button onClick={onBack} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const { site, data } = state

  // Preview mode indicator
  const isPreview = mode === 'preview'
  const isDraft = site.status === 'draft'
  const isDemo = site.status === 'demo'

  return (
    <>
      {/* Preview / Draft / Demo banner */}
      {(isPreview || isDraft || isDemo) && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-amber-950 text-center text-xs font-semibold py-1.5">
          {isDraft && 'DRAFT — This site is not published.'}
          {isDemo && !isDraft && 'DEMO — This site is running in demo mode.'}
          {isPreview && !isDraft && !isDemo && 'PREVIEW — Viewing as admin.'}
        </div>
      )}

      {/* Render the appropriate site component with fully resolved data */}
      <div className={(isPreview || isDraft || isDemo) ? 'pt-7' : ''}>
        {data.type === 'law-firm' && (
          <LawFirmSite data={data as LawFirmSiteData} onBack={onBack} />
        )}
        {data.type === 'small-business' && (
          <SMBSite data={data as SMBSiteData} onBack={onBack} />
        )}
        {data.type === 'agency' && (
          <AgencySite data={data as AgencySiteData} onBack={onBack} />
        )}
      </div>
    </>
  )
}
