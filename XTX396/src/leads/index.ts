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
  // Chain 1: New types
  LeadAttachment,
  FollowUpTask,
  FollowUpTaskStatus,
  FollowUpTaskType,
  AutoReplyTemplate,
  NotificationConfig,
  AutomationEvent,
  AutomationAction,
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

// Intake Packet
export { IntakeService, getIntakeService } from './intake'
export type { IntakePacket } from './intake'

// Admin
export { AdminLeadsViewer } from './AdminLeadsViewer'
export type { AdminLeadsViewerProps } from './AdminLeadsViewer'

// Chain 1: Follow-Up Tasks
export {
  FollowUpTaskService,
  getFollowUpTaskService,
} from './follow-up-task.service'

export type {
  CreateTaskInput,
  TaskListQuery,
  TaskListResult,
} from './follow-up-task.service'

// Chain 1: Lead Automation
export {
  LeadAutomationService,
  getLeadAutomationService,
} from './lead-automation.service'

export type {
  AutomationServiceConfig,
} from './lead-automation.service'

// Chain 1: Mobile Intake Form
export { MobileLeadIntakeForm } from './MobileLeadIntakeForm'
export type { MobileLeadIntakeFormProps } from './MobileLeadIntakeForm'

// Chain 1: Follow-Up Dashboard
export { FollowUpDashboard } from './FollowUpDashboard'
export type { FollowUpDashboardProps } from './FollowUpDashboard'
