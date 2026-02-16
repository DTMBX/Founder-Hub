/**
 * Content Uniqueness Engine — Public API
 *
 * Re-exports types and functions for deterministic content generation.
 */

// Types
export type {
  CopyVariantSet,
  FAQTemplate,
  TemplateContext,
  SelectedCopy,
  SelectedFAQ,
  ContentKit,
  ContentKitMeta,
  ContentGenerationOptions,
} from './content.types'

// Generator Functions
export {
  generateContentKit,
  regenerateCopyField,
  validateContentKit,
  getFieldCopy,
  interpolateTemplate,
  hasUnresolvedPlaceholders,
  extractPlaceholders,
} from './content-generator'
