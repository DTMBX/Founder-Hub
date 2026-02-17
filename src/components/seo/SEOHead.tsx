/**
 * SEO Head Component
 * 
 * Manages all SEO meta tags based on site configuration.
 * Automatically generates structured data for local businesses.
 */

import React, { useEffect } from 'react'
import { siteConfig, seoConfig } from '@/config/site.config'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  type?: string
  url?: string
  noindex?: boolean
}

/**
 * Update document head with SEO meta tags
 */
export function SEOHead({
  title,
  description,
  image,
  type,
  url,
  noindex = false,
}: SEOProps): null {
  useEffect(() => {
    const finalTitle = title 
      ? `${title} | ${siteConfig.name}`
      : seoConfig.title
    const finalDescription = description || seoConfig.description
    const finalImage = image || seoConfig.ogImage
    const finalType = type || seoConfig.ogType
    const finalUrl = url || `https://${siteConfig.domain}`
    
    // Update title
    document.title = finalTitle
    
    // Helper to set/create meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.content = content
    }
    
    // Standard meta tags
    setMeta('description', finalDescription)
    setMeta('keywords', seoConfig.keywords.join(', '))
    
    // Robots
    if (noindex) {
      setMeta('robots', 'noindex, nofollow')
    } else {
      setMeta('robots', 'index, follow')
    }
    
    // Open Graph
    setMeta('og:title', finalTitle, true)
    setMeta('og:description', finalDescription, true)
    setMeta('og:image', finalImage.startsWith('http') ? finalImage : `https://${siteConfig.domain}${finalImage}`, true)
    setMeta('og:type', finalType, true)
    setMeta('og:url', finalUrl, true)
    setMeta('og:site_name', siteConfig.name, true)
    
    // Twitter Card
    setMeta('twitter:card', seoConfig.twitterCard)
    setMeta('twitter:title', finalTitle)
    setMeta('twitter:description', finalDescription)
    setMeta('twitter:image', finalImage.startsWith('http') ? finalImage : `https://${siteConfig.domain}${finalImage}`)
    if (seoConfig.twitterHandle) {
      setMeta('twitter:site', seoConfig.twitterHandle)
    }
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = finalUrl
    
  }, [title, description, image, type, url, noindex])
  
  return null
}

/**
 * Generate JSON-LD structured data for local business
 */
export function generateLocalBusinessSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': seoConfig.schema.type,
    name: siteConfig.name,
    description: seoConfig.description,
    url: `https://${siteConfig.domain}`,
    telephone: siteConfig.business.phone,
    email: siteConfig.business.email,
    priceRange: seoConfig.schema.priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.business.address.street,
      addressLocality: siteConfig.business.address.city,
      addressRegion: siteConfig.business.address.state,
      postalCode: siteConfig.business.address.zip,
      addressCountry: 'US',
    },
    openingHours: siteConfig.business.hours,
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.twitter,
      siteConfig.social.instagram,
      siteConfig.social.linkedin,
      siteConfig.social.youtube,
    ].filter(Boolean),
  }
}

/**
 * Structured Data Script Component
 */
export function StructuredData() {
  const schema = generateLocalBusinessSchema()
  
  // Only render if we have meaningful business data
  if (!siteConfig.business.legalName && !siteConfig.business.phone) {
    return null
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * Generate sitemap.xml content
 */
export function generateSitemap(pages: Array<{ path: string; priority?: number; changefreq?: string }>): string {
  const domain = `https://${siteConfig.domain}`
  
  const urls = pages.map(page => `
  <url>
    <loc>${domain}${page.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq || 'monthly'}</changefreq>
    <priority>${page.priority || 0.5}</priority>
  </url>`).join('')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/2000/svg">
${urls}
</urlset>`
}

export default SEOHead
