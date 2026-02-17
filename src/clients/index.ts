/**
 * Clients Module
 *
 * Client retention and project management system.
 */

// ─── Types ───────────────────────────────────────────────────

export type {
  Client,
  ClientAddress,
  ClientListQuery,
  ClientListResult,
  Project,
  ProjectStatus,
  ProjectUpdate,
  ProjectFile,
  ProjectListQuery,
  ProjectListResult,
  SiteSubscription,
  SubscriptionPlanTier,
  SubscriptionStatus,
  SubscriptionService,
  SubscriptionListQuery,
  SubscriptionListResult,
  PortalSession,
  WeeklyUpdateConfig,
} from './types'

// ─── Services ────────────────────────────────────────────────

export {
  ClientService,
  getClientService,
  type CreateClientInput,
  type UpdateClientInput,
} from './client.service'

export {
  ProjectService,
  getProjectService,
  type CreateProjectInput,
  type UpdateProjectInput,
} from './project.service'

export {
  SubscriptionService,
  getSubscriptionService,
  PLAN_PRICING,
  type CreateSubscriptionInput,
  type UpdateSubscriptionInput,
} from './subscription.service'

export {
  WeeklyUpdateService,
  getWeeklyUpdateService,
  type WeeklyUpdateServiceConfig,
  type WeeklyUpdateEvent,
  type WeeklyUpdateResult,
} from './weekly-update.service'

// ─── UI Components ───────────────────────────────────────────

export { ClientPortal } from './ClientPortal'

export {
  SubscriptionDashboard,
  SubscriptionBadge,
} from './SubscriptionDashboard'
