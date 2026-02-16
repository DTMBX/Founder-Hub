/**
 * Deploy Readiness Validation
 *
 * Validates that a NormalizedSiteData object meets minimum requirements
 * for deployment. Pure function, no side effects, no storage calls.
 *
 * Validation is type-specific:
 *  - Law Firm: name, primaryColor, practice area, attorney, contact
 *  - SMB: name, primaryColor, service, contact
 *  - Agency: name, launched project
 */

import type {
  NormalizedSiteData,
  LawFirmSiteData,
  SMBSiteData,
  AgencySiteData,
} from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// ─── Common Validators ──────────────────────────────────────

function validateCommon(data: NormalizedSiteData): string[] {
  const errors: string[] = []

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Site name is required.')
  }

  if (!data.branding.primaryColor || data.branding.primaryColor.trim().length === 0) {
    errors.push('Primary brand color is required.')
  }

  if (!data.seo.title || data.seo.title.trim().length === 0) {
    errors.push('SEO title is required.')
  }

  return errors
}

// ─── Type-Specific Validators ───────────────────────────────

function validateLawFirm(data: LawFirmSiteData): string[] {
  const errors: string[] = []
  const c = data.config

  if (data.practiceAreas.length === 0) {
    errors.push('At least one practice area is required.')
  }

  if (data.attorneys.length === 0) {
    errors.push('At least one attorney profile is required.')
  }

  // Contact method: phone, email, or intake form
  const hasContact = !!(c.phone || c.email || c.intakeFormEnabled)
  if (!hasContact) {
    errors.push('At least one contact method is required (phone, email, or intake form).')
  }

  return errors
}

function validateSMB(data: SMBSiteData): string[] {
  const errors: string[] = []
  const c = data.config

  if (data.services.length === 0) {
    errors.push('At least one service is required.')
  }

  // Contact method: phone, email, or contact section enabled
  const hasContact = !!(c.phone || c.email)
  if (!hasContact) {
    errors.push('At least one contact method is required (phone or email).')
  }

  return errors
}

function validateAgency(data: AgencySiteData): string[] {
  const errors: string[] = []

  const launchedProjects = data.projects.filter(
    (p) => p.status === 'launched' || p.status === 'maintenance',
  )

  if (launchedProjects.length === 0) {
    errors.push('At least one launched project is required.')
  }

  return errors
}

// ─── Main Validation Function ────────────────────────────────

/**
 * Validate whether a site is ready for deployment.
 *
 * Pure function. No side effects. No storage calls.
 * Returns a ValidationResult with isValid flag and list of errors.
 */
export function validateSiteReadyForDeploy(
  siteData: NormalizedSiteData,
): ValidationResult {
  const errors: string[] = [
    ...validateCommon(siteData),
  ]

  switch (siteData.type) {
    case 'law-firm':
      errors.push(...validateLawFirm(siteData))
      break
    case 'small-business':
      errors.push(...validateSMB(siteData))
      break
    case 'agency':
      errors.push(...validateAgency(siteData))
      break
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
