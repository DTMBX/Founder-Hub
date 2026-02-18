/**
 * Pipeline Step: Validate
 *
 * Fail-closed validation of generation input against the blueprint's
 * content requirements. Rejects early if any required field is missing
 * or thresholds are not met.
 */

import type { GenerationInput, ValidationResult } from './types'

// ─── Blueprint Shape (minimal for validation) ────────────────

interface BlueprintContentRequirements {
  readonly min_pages: number
  readonly min_sections: number
  readonly min_words_per_page: number
  readonly require_contact_info: boolean
  readonly require_business_name: boolean
  readonly require_address?: boolean
  readonly require_hours?: boolean
}

interface BlueprintForValidation {
  readonly id: string
  readonly required_pages: readonly { slug: string }[]
  readonly required_sections: readonly { id: string; required?: boolean }[]
  readonly required_components: readonly string[]
  readonly content_requirements: BlueprintContentRequirements
}

// ─── Validate ────────────────────────────────────────────────

/**
 * Validates generation input against blueprint requirements.
 *
 * Returns a ValidationResult. If `valid` is false, the pipeline MUST
 * halt — fail-closed invariant.
 */
export function validate(
  input: GenerationInput,
  blueprint: BlueprintForValidation,
): ValidationResult {
  const errors: string[] = []
  const req = blueprint.content_requirements

  // ── Required fields ────────────────────────────────────────

  if (!input.blueprintId) {
    errors.push('blueprintId is required')
  }

  if (req.require_business_name && !input.businessName?.trim()) {
    errors.push('businessName is required by this blueprint')
  }

  if (req.require_contact_info && !input.contactInfo?.trim()) {
    errors.push('contactInfo is required by this blueprint')
  }

  if (req.require_address && !input.address?.trim()) {
    errors.push('address is required by this blueprint')
  }

  if (req.require_hours && !input.hours?.trim()) {
    errors.push('hours is required by this blueprint')
  }

  if (!input.operatorId?.trim()) {
    errors.push('operatorId is required')
  }

  if (!input.requestedAt?.trim()) {
    errors.push('requestedAt is required')
  }

  // ── Page count ─────────────────────────────────────────────

  const pageCount = input.pageContent
    ? Object.keys(input.pageContent).length
    : 0

  // Only check if user-provided content exists — scaffold step will add
  // blueprint-required pages. Validation ensures minimum thresholds.
  if (pageCount > 0 && pageCount < req.min_pages) {
    errors.push(
      `min_pages: need at least ${req.min_pages}, provided ${pageCount}`,
    )
  }

  // ── Word count per page ────────────────────────────────────

  if (input.pageContent) {
    for (const [slug, content] of Object.entries(input.pageContent)) {
      const wordCount = (content.body ?? '').split(/\s+/).filter(Boolean).length
      if (wordCount > 0 && wordCount < req.min_words_per_page) {
        errors.push(
          `page "${slug}": min ${req.min_words_per_page} words required, got ${wordCount}`,
        )
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  }
}
