/**
 * Weekly Update Automation Service
 *
 * Generates and sends weekly status updates for active projects:
 * - Summarizes progress
 * - Sends email to client
 * - Logs automation event
 */

import type {
  Project,
  ProjectUpdate,
  WeeklyUpdateConfig,
} from './types'
import type { Client } from './types'
import { getProjectService, ProjectService } from './project.service'
import { getClientService, ClientService } from './client.service'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'

// ─── Storage Keys ────────────────────────────────────────────

const KEYS = {
  WEEKLY_CONFIG: 'xtx_weekly_update_config',
  WEEKLY_EVENTS: 'xtx_weekly_events',
}

// ─── Default Config ──────────────────────────────────────────

const DEFAULT_CONFIG: WeeklyUpdateConfig = {
  enabled: true,
  dayOfWeek: 5, // Friday
  hourToSend: 14, // 2 PM
  ccAdmin: true,
  adminEmail: undefined,
}

// ─── Email Templates ─────────────────────────────────────────

const WEEKLY_UPDATE_TEMPLATE = {
  subject: 'Weekly Project Update: {{projectName}}',
  body: `
Hi {{clientName}},

Here's your weekly update for **{{projectName}}**:

## Progress
- Current Status: {{status}}
- Progress: {{progress}}%

## This Week's Highlights
{{highlights}}

## Next Steps
{{nextSteps}}

---

You can view the full project details in your client portal:
{{portalLink}}

Best regards,
The Team
`.trim(),
}

// ─── Types ───────────────────────────────────────────────────

export interface WeeklyUpdateEvent {
  id: string
  projectId: string
  projectName: string
  clientId: string
  clientEmail: string
  timestamp: string
  success: boolean
  error?: string
}

export interface WeeklyUpdateResult {
  projectId: string
  projectName: string
  clientName: string
  success: boolean
  error?: string
}

// ─── Service ─────────────────────────────────────────────────

export interface WeeklyUpdateServiceConfig {
  adapter: StorageAdapter
  projectService?: ProjectService
  clientService?: ClientService
  sendEmail?: (to: string, subject: string, body: string, cc?: string) => Promise<boolean>
}

export class WeeklyUpdateService {
  private adapter: StorageAdapter
  private projectService: ProjectService
  private clientService: ClientService
  private sendEmail?: WeeklyUpdateServiceConfig['sendEmail']

  constructor(config: WeeklyUpdateServiceConfig) {
    this.adapter = config.adapter
    this.projectService = config.projectService ?? getProjectService(config.adapter)
    this.clientService = config.clientService ?? getClientService(config.adapter)
    this.sendEmail = config.sendEmail
  }

  // ─── Config Management ───────────────────────────────────

  async getConfig(): Promise<WeeklyUpdateConfig> {
    const config = await this.adapter.get<WeeklyUpdateConfig>(KEYS.WEEKLY_CONFIG)
    return config ?? DEFAULT_CONFIG
  }

  async saveConfig(config: WeeklyUpdateConfig): Promise<void> {
    await this.adapter.set(KEYS.WEEKLY_CONFIG, config)
  }

  // ─── Update Generation ───────────────────────────────────

  /**
   * Generate summary content for a project
   */
  generateProjectSummary(project: Project): {
    highlights: string
    nextSteps: string
  } {
    // Get recent updates (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const recentUpdates = project.updates.filter((u) => u.timestamp >= oneWeekAgo)

    // Generate highlights from recent updates
    let highlights = ''
    if (recentUpdates.length > 0) {
      highlights = recentUpdates
        .slice(0, 5) // Max 5 highlights
        .map((u) => `- ${u.title}`)
        .join('\n')
    } else {
      highlights = '- Project work continued as planned\n- No specific updates to report'
    }

    // Generate next steps based on status and progress
    let nextSteps = ''
    if (project.status === 'active') {
      if (project.progress < 25) {
        nextSteps = '- Continue initial development phase\n- Review requirements as needed'
      } else if (project.progress < 50) {
        nextSteps = '- Progress toward midpoint milestone\n- Begin testing core features'
      } else if (project.progress < 75) {
        nextSteps = '- Finalize major components\n- Prepare for review phase'
      } else {
        nextSteps = '- Final testing and polish\n- Prepare for project completion'
      }
    } else if (project.status === 'review') {
      nextSteps = '- Awaiting your feedback and approval\n- Please review deliverables'
    } else {
      nextSteps = '- Continue project work as planned'
    }

    return { highlights, nextSteps }
  }

  /**
   * Generate email content for a project update
   */
  generateEmailContent(
    project: Project,
    client: Client,
    portalBaseUrl: string = '/portal',
  ): { subject: string; body: string } {
    const summary = this.generateProjectSummary(project)

    const subject = WEEKLY_UPDATE_TEMPLATE.subject
      .replace(/\{\{projectName\}\}/g, project.name)

    const body = WEEKLY_UPDATE_TEMPLATE.body
      .replace(/\{\{clientName\}\}/g, client.name.split(' ')[0]) // First name
      .replace(/\{\{projectName\}\}/g, project.name)
      .replace(/\{\{status\}\}/g, this.formatStatus(project.status))
      .replace(/\{\{progress\}\}/g, String(project.progress))
      .replace(/\{\{highlights\}\}/g, summary.highlights)
      .replace(/\{\{nextSteps\}\}/g, summary.nextSteps)
      .replace(/\{\{portalLink\}\}/g, `${portalBaseUrl}?project=${project.id}`)

    return { subject, body }
  }

  private formatStatus(status: string): string {
    const statusLabels: Record<string, string> = {
      planned: 'Planned',
      active: 'In Progress',
      review: 'In Review',
      complete: 'Completed',
      'on-hold': 'On Hold',
      cancelled: 'Cancelled',
    }
    return statusLabels[status] ?? status
  }

  // ─── Update Sending ──────────────────────────────────────

  /**
   * Send weekly update for a single project
   */
  async sendProjectUpdate(projectId: string): Promise<WeeklyUpdateResult> {
    const project = await this.projectService.get(projectId)
    if (!project) {
      return {
        projectId,
        projectName: 'Unknown',
        clientName: 'Unknown',
        success: false,
        error: 'Project not found',
      }
    }

    const client = await this.clientService.get(project.clientId)
    if (!client) {
      return {
        projectId,
        projectName: project.name,
        clientName: 'Unknown',
        success: false,
        error: 'Client not found',
      }
    }

    if (!this.sendEmail) {
      return {
        projectId,
        projectName: project.name,
        clientName: client.name,
        success: false,
        error: 'Email sending not configured',
      }
    }

    try {
      const config = await this.getConfig()
      const { subject, body } = this.generateEmailContent(project, client)

      const cc = config.ccAdmin && config.adminEmail ? config.adminEmail : undefined
      const sent = await this.sendEmail(client.email, subject, body, cc)

      if (sent) {
        // Add update to project
        await this.projectService.addUpdate(projectId, {
          type: 'auto_weekly',
          title: 'Weekly Update Sent',
          content: `Automated weekly status update sent to ${client.email}`,
          author: 'system',
        })

        // Mark as sent
        await this.projectService.markWeeklyUpdateSent(projectId)

        // Log event
        await this.logEvent({
          id: crypto.randomUUID(),
          projectId,
          projectName: project.name,
          clientId: client.id,
          clientEmail: client.email,
          timestamp: new Date().toISOString(),
          success: true,
        })

        return {
          projectId,
          projectName: project.name,
          clientName: client.name,
          success: true,
        }
      } else {
        throw new Error('Email send returned false')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      await this.logEvent({
        id: crypto.randomUUID(),
        projectId,
        projectName: project.name,
        clientId: client.id,
        clientEmail: client.email,
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMessage,
      })

      return {
        projectId,
        projectName: project.name,
        clientName: client.name,
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Process all projects needing weekly updates
   */
  async processWeeklyUpdates(): Promise<WeeklyUpdateResult[]> {
    const config = await this.getConfig()
    if (!config.enabled) {
      if (import.meta.env.DEV) console.log('[WeeklyUpdate] Disabled in config')
      return []
    }

    const projects = await this.projectService.getProjectsForWeeklyUpdate()
    if (import.meta.env.DEV) console.log(`[WeeklyUpdate] Processing ${projects.length} projects`)

    const results: WeeklyUpdateResult[] = []
    for (const project of projects) {
      const result = await this.sendProjectUpdate(project.id)
      results.push(result)
    }

    return results
  }

  /**
   * Check if it's time to send updates (for cron/scheduler)
   */
  async shouldRunNow(): Promise<boolean> {
    const config = await this.getConfig()
    if (!config.enabled) return false

    const now = new Date()
    const dayOfWeek = now.getDay()
    const hour = now.getHours()

    return dayOfWeek === config.dayOfWeek && hour === config.hourToSend
  }

  // ─── Event Logging ───────────────────────────────────────

  private async logEvent(event: WeeklyUpdateEvent): Promise<void> {
    const events = (await this.adapter.get<WeeklyUpdateEvent[]>(KEYS.WEEKLY_EVENTS)) ?? []
    events.unshift(event)

    // Keep only last 100 events
    const trimmed = events.slice(0, 100)
    await this.adapter.set(KEYS.WEEKLY_EVENTS, trimmed)
  }

  async getRecentEvents(limit: number = 20): Promise<WeeklyUpdateEvent[]> {
    const events = (await this.adapter.get<WeeklyUpdateEvent[]>(KEYS.WEEKLY_EVENTS)) ?? []
    return events.slice(0, limit)
  }

  // ─── Manual Trigger ──────────────────────────────────────

  /**
   * Preview what would be sent (without sending)
   */
  async previewUpdate(projectId: string): Promise<{
    project: Project
    client: Client
    subject: string
    body: string
  } | null> {
    const project = await this.projectService.get(projectId)
    if (!project) return null

    const client = await this.clientService.get(project.clientId)
    if (!client) return null

    const { subject, body } = this.generateEmailContent(project, client)

    return { project, client, subject, body }
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _weeklyUpdateService: WeeklyUpdateService | null = null

export function getWeeklyUpdateService(config?: Partial<WeeklyUpdateServiceConfig>): WeeklyUpdateService {
  if (!_weeklyUpdateService) {
    const adapter = config?.adapter ?? createStorageAdapter()
    _weeklyUpdateService = new WeeklyUpdateService({
      adapter,
      ...config,
    })
  }
  return _weeklyUpdateService
}
