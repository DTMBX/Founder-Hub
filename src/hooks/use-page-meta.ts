import { useEffect } from 'react'

interface PageMetaProps {
  /** Page title — will be formatted as "{title} | Devon Tyler Barber" */
  title: string
  /** Meta description */
  description: string
  /** Canonical path (e.g. "/about") — appended to base URL */
  path?: string
  /** Open Graph image URL */
  ogImage?: string
  /** JSON-LD structured data objects to inject */
  jsonLd?: Record<string, unknown>[]
}

const BASE_URL = 'https://devon-tyler.com'
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-preview.png`
const SITE_NAME = 'Devon Tyler Barber'

/**
 * Map route paths to their generated OG image.
 * Falls back to the default og-preview.png if no match.
 */
function resolveOgImage(path?: string): string {
  if (!path) return DEFAULT_OG_IMAGE
  const slug = path.replace(/^\//, '').replace(/\//g, '-') || 'home'

  // Blog posts: /blog/{id} → /og/blog-{id}.png
  if (slug.startsWith('blog-') && slug !== 'blog') {
    return `${BASE_URL}/og/${slug}.png`
  }
  // Hash routes: /evident → /og/evident.png
  const routeSlugs = [
    'home', 'evident', 'evident-site', 'tillerstead', 'accountability',
    'projects-index', 'blog', 'invest', 'activity', 'intelligence',
    'data', 'developers', 'evident-demo', 'health', 'system-status',
  ]
  if (routeSlugs.includes(slug)) {
    return `${BASE_URL}/og/${slug}.png`
  }
  return DEFAULT_OG_IMAGE
}

/**
 * Sets document title, meta description, OG tags, and optional JSON-LD
 * for the current page view. Cleans up on unmount.
 */
export function usePageMeta({
  title,
  description,
  path,
  ogImage,
  jsonLd,
}: PageMetaProps) {
  useEffect(() => {
    // Scroll to top on page view change
    window.scrollTo(0, 0)

    const fullTitle = `${title} | ${SITE_NAME}`
    const canonicalUrl = path ? `${BASE_URL}${path}` : BASE_URL
    const image = ogImage || resolveOgImage(path)

    // Store original values for cleanup
    const originalTitle = document.title

    document.title = fullTitle

    // Helper to set/create a <meta> tag
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:type', 'website')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)

    // Canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', canonicalUrl)

    // JSON-LD
    const scriptElements: HTMLScriptElement[] = []
    if (jsonLd?.length) {
      for (const data of jsonLd) {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.textContent = JSON.stringify(data)
        document.head.appendChild(script)
        scriptElements.push(script)
      }
    }

    return () => {
      document.title = originalTitle
      for (const script of scriptElements) {
        script.remove()
      }
    }
  }, [title, description, path, ogImage, jsonLd])
}
