/**
 * Site Data Normalization
 *
 * Converts legacy site data (LawFirmShowcaseData, SMBTemplateData,
 * AgencyFrameworkData) into normalized SiteCore-extended shapes.
 *
 * Deterministic: same inputs always produce same outputs.
 * No side effects. No storage calls.
 */

import type {
  SiteSummary,
  SiteCore,
  SiteCoreBranding,
  SiteCoreSEO,
  LawFirmSiteData,
  SMBSiteData,
  AgencySiteData,
  NormalizedSiteData,
  SiteData,
  LawFirmShowcaseData,
  SMBTemplateData,
  AgencyFrameworkData,
} from '@/lib/types'

// ─── Type Guards ─────────────────────────────────────────────

/** Check if data is already normalized (has SiteCore fields). */
export function isNormalized(data: SiteData): data is NormalizedSiteData {
  return 'siteId' in data && 'branding' in data && 'seo' in data && 'type' in data
}

export function isLegacyLawFirm(data: SiteData): data is LawFirmShowcaseData {
  return 'config' in data && 'visibility' in data && 'intakeSubmissions' in data && !('type' in data)
}

export function isLegacySMB(data: SiteData): data is SMBTemplateData {
  return 'config' in data && 'contactSubmissions' in data && !('type' in data)
}

export function isLegacyAgency(data: SiteData): data is AgencyFrameworkData {
  return 'brandingRemoved' in data && 'projects' in data && !('type' in data)
}

// ─── Default SiteCore Values ─────────────────────────────────

const DEFAULT_BRANDING: SiteCoreBranding = {
  primaryColor: '#1a365d',
}

const DEFAULT_SEO: SiteCoreSEO = {
  title: '',
  description: '',
}

// ─── Normalization Functions ─────────────────────────────────

/**
 * Build SiteCore fields from a SiteSummary and extracted config values.
 */
function buildCore(
  summary: SiteSummary,
  branding: Partial<SiteCoreBranding>,
  seo: Partial<SiteCoreSEO>,
): SiteCore {
  return {
    siteId: summary.siteId,
    name: summary.name,
    slug: summary.slug,
    status: summary.status === 'private' ? 'draft' : summary.status,
    domain: summary.domain,
    branding: {
      ...DEFAULT_BRANDING,
      ...branding,
    },
    seo: {
      ...DEFAULT_SEO,
      title: seo.title || summary.name,
      description: seo.description || '',
      ogImage: seo.ogImage,
    },
    createdAt: summary.createdAt,
    updatedAt: summary.updatedAt,
  }
}

/**
 * Normalize legacy LawFirmShowcaseData into LawFirmSiteData.
 */
export function normalizeLawFirm(
  legacy: LawFirmShowcaseData,
  summary: SiteSummary,
): LawFirmSiteData {
  const c = legacy.config
  const core = buildCore(summary, {
    primaryColor: c.primaryColor ?? '#1a365d',
    secondaryColor: c.accentColor,
    logo: c.logoUrl,
  }, {
    title: c.seo.globalTitle || c.firmName,
    description: c.seo.globalDescription || c.description || '',
    ogImage: c.seo.ogImageUrl,
  })

  return {
    ...core,
    type: 'law-firm',
    config: c,
    caseResults: legacy.caseResults,
    attorneys: legacy.attorneys,
    practiceAreas: legacy.practiceAreas,
    testimonials: legacy.testimonials,
    blogPosts: legacy.blogPosts,
    intakeSubmissions: legacy.intakeSubmissions,
    visibility: legacy.visibility,
  }
}

/**
 * Normalize legacy SMBTemplateData into SMBSiteData.
 */
export function normalizeSMB(
  legacy: SMBTemplateData,
  summary: SiteSummary,
): SMBSiteData {
  const c = legacy.config
  const core = buildCore(summary, {
    primaryColor: c.primaryColor ?? '#2563eb',
    secondaryColor: c.accentColor,
    logo: c.logoUrl,
  }, {
    title: c.seo.siteTitle || c.businessName,
    description: c.seo.siteDescription || c.description || '',
    ogImage: c.seo.ogImageUrl,
  })

  return {
    ...core,
    type: 'small-business',
    config: c,
    services: legacy.services,
    team: legacy.team,
    testimonials: legacy.testimonials,
    faqs: legacy.faqs,
    galleryImages: legacy.galleryImages,
    promotions: legacy.promotions,
    blogPosts: legacy.blogPosts,
    contactSubmissions: legacy.contactSubmissions,
  }
}

/**
 * Normalize legacy AgencyFrameworkData into AgencySiteData.
 */
export function normalizeAgency(
  legacy: AgencyFrameworkData,
  summary: SiteSummary,
): AgencySiteData {
  const c = legacy.config
  const core = buildCore(summary, {
    primaryColor: '#111827',
  }, {
    title: c.agencyName || summary.name,
    description: '',
  })

  return {
    ...core,
    type: 'agency',
    config: c,
    projects: legacy.projects,
    pipeline: legacy.pipeline,
    invoices: legacy.invoices,
    proposals: legacy.proposals,
    timeEntries: legacy.timeEntries,
    brandingRemoved: true,
  }
}

/**
 * Normalize any site data (legacy or already normalized) into its
 * SiteCore-extended form.
 *
 * Deterministic. No side effects. No storage calls.
 */
export function normalizeSiteData(
  data: SiteData,
  summary: SiteSummary,
): NormalizedSiteData {
  // Already normalized — merge in fresh SiteCore from summary
  if (isNormalized(data)) {
    return {
      ...data,
      siteId: summary.siteId,
      name: summary.name,
      slug: summary.slug,
      status: summary.status === 'private' ? 'draft' : summary.status,
      domain: summary.domain,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    } as NormalizedSiteData
  }

  // Legacy shapes
  switch (summary.type) {
    case 'law-firm':
      return normalizeLawFirm(data as LawFirmShowcaseData, summary)
    case 'small-business':
      return normalizeSMB(data as SMBTemplateData, summary)
    case 'agency':
      return normalizeAgency(data as AgencyFrameworkData, summary)
  }
}
