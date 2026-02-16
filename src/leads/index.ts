/**
 * Leads Module — Public API
 *
 * Lead capture and management system with:
 * - Lead types and models
 * - Lead service with pluggable storage adapters
 * - Lead capture modal component
 * - React hook for modal state management
 */

// Types
export type {
  Lead,
  LeadStatus,
  LeadSource,
  LeadActivity,
  LeadActivityType,
  LeadCaptureInput,
  LeadEnrichment,
  LeadListQuery,
  LeadListResult,
} from './types'

// Service
export {
  LeadService,
  LocalStorageAdapter,
  WebhookNotificationAdapter,
  ConsoleNotificationAdapter,
  getLeadService,
  configureLeadService,
} from './service'

export type {
  LeadStorageAdapter,
  LeadNotificationAdapter,
  LeadServiceConfig,
  WebhookAdapterConfig,
} from './service'

// Components
export { LeadCaptureModal } from './LeadCaptureModal'
export type { LeadCaptureModalProps } from './LeadCaptureModal'

// Hooks
export { useLeadCapture } from './useLeadCapture'
export type {
  UseLeadCaptureOptions,
  UseLeadCaptureResult,
} from './useLeadCapture'

// Qualification
export { QualificationForm } from './QualificationForm'
export type { QualificationFormProps } from './QualificationForm'

export {
  QUALIFICATION_QUESTIONS,
  QUALIFICATION_THRESHOLDS,
  calculateLeadScore,
  getLeadPriority,
  isQualified,
} from './qualification.config'

export type {
  QualificationQuestion,
  QualificationOption,
} from './qualification.config'
