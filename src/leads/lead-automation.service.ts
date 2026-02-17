/**
 * Lead Automation Service
 *
 * Orchestrates automated actions on lead events:
 * - Auto-reply emails
 * - Follow-up task creation
 * - Founder notifications (email, SMS, push)
 * - Audit logging
 *
 * This is the central automation engine for Chain 1.
 */

import type {
  Lead,
  AutoReplyTemplate,
  NotificationConfig,
  AutomationEvent,
  AutomationAction,
  FollowUpTask,
} from './types'
import {
  FollowUpTaskService,
  getFollowUpTaskService,
} from './follow-up-task.service'
import { getLeadService } from './service'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'

// ─── Storage Keys ────────────────────────────────────────────

const KEYS = {
  TEMPLATES: 'xtx_auto_reply_templates',
  NOTIFICATION_CONFIG: 'xtx_notification_config',
  AUTOMATION_EVENTS: 'xtx_automation_events',
}

// ─── Default Templates ───────────────────────────────────────

const DEFAULT_TEMPLATES: AutoReplyTemplate[] = [
  {
    id: 'lead-welcome',
    name: 'New Lead Welcome',
    subject: 'Thanks for reaching out!',
    body: `Hi {{firstName}},

Thank you for contacting us! We received your inquiry and will get back to you within 24 hours.

In the meantime, feel free to reply to this email with any additional details about your project.

Best regards,
The Team`,
    trigger: 'lead_created',
    active: true,
  },
  {
    id: 'follow-up-reminder',
    name: 'Follow-up Reminder',
    subject: 'Just checking in...',
    body: `Hi {{firstName}},

I wanted to follow up on your recent inquiry. Do you have any questions I can help with?

Looking forward to hearing from you.

Best regards,
The Team`,
    trigger: 'follow_up_reminder',
    active: true,
  },
]

// ─── Automation Service ──────────────────────────────────────

export interface AutomationServiceConfig {
  adapter: StorageAdapter
  taskService?: FollowUpTaskService
  /** Callback for sending emails (implement with your provider) */
  sendEmail?: (to: string, subject: string, body: string) => Promise<boolean>
  /** Callback for sending SMS (implement with your provider) */
  sendSms?: (to: string, message: string) => Promise<boolean>
  /** Callback for sending push notifications */
  sendPush?: (endpoint: string, title: string, body: string) => Promise<boolean>
}

export class LeadAutomationService {
  private adapter: StorageAdapter
  private taskService: FollowUpTaskService
  private sendEmail?: AutomationServiceConfig['sendEmail']
  private sendSms?: AutomationServiceConfig['sendSms']
  private sendPush?: AutomationServiceConfig['sendPush']

  constructor(config: AutomationServiceConfig) {
    this.adapter = config.adapter
    this.taskService = config.taskService ?? getFollowUpTaskService(config.adapter)
    this.sendEmail = config.sendEmail
    this.sendSms = config.sendSms
    this.sendPush = config.sendPush
  }

  // ─── Template Management ─────────────────────────────────

  async getTemplates(): Promise<AutoReplyTemplate[]> {
    const templates = await this.adapter.get<AutoReplyTemplate[]>(KEYS.TEMPLATES)
    return templates ?? DEFAULT_TEMPLATES
  }

  async saveTemplate(template: AutoReplyTemplate): Promise<void> {
    const templates = await this.getTemplates()
    const idx = templates.findIndex((t) => t.id === template.id)
    if (idx >= 0) {
      templates[idx] = template
    } else {
      templates.push(template)
    }
    await this.adapter.set(KEYS.TEMPLATES, templates)
  }

  async getTemplateByTrigger(
    trigger: AutoReplyTemplate['trigger'],
  ): Promise<AutoReplyTemplate | null> {
    const templates = await this.getTemplates()
    return templates.find((t) => t.trigger === trigger && t.active) ?? null
  }

  // ─── Notification Config ─────────────────────────────────

  async getNotificationConfig(): Promise<NotificationConfig> {
    const config = await this.adapter.get<NotificationConfig>(KEYS.NOTIFICATION_CONFIG)
    return config ?? {
      emailEnabled: false,
      smsEnabled: false,
      pushEnabled: false,
    }
  }

  async saveNotificationConfig(config: NotificationConfig): Promise<void> {
    await this.adapter.set(KEYS.NOTIFICATION_CONFIG, config)
  }

  // ─── Template Variable Substitution ──────────────────────

  private substituteVariables(template: string, lead: Lead): string {
    return template
      .replace(/\{\{firstName\}\}/g, lead.firstName ?? 'there')
      .replace(/\{\{lastName\}\}/g, lead.lastName ?? '')
      .replace(/\{\{email\}\}/g, lead.email)
      .replace(/\{\{company\}\}/g, lead.company ?? '')
      .replace(/\{\{phone\}\}/g, lead.phone ?? '')
      .replace(/\{\{projectType\}\}/g, lead.projectType ?? lead.vertical ?? '')
      .replace(/\{\{projectDescription\}\}/g, lead.projectDescription ?? '')
  }

  // ─── Core Automation: On Lead Created ────────────────────

  async onLeadCreated(lead: Lead): Promise<AutomationEvent> {
    const event: AutomationEvent = {
      id: crypto.randomUUID(),
      type: 'lead_created',
      leadId: lead.id,
      timestamp: new Date().toISOString(),
      actions: [],
      success: true,
    }

    // 1. Send auto-reply email
    const autoReplyAction = await this.sendAutoReply(lead)
    event.actions.push(autoReplyAction)

    // 2. Create follow-up task (24 hours)
    const taskAction = await this.createInitialFollowUpTask(lead)
    event.actions.push(taskAction)

    // 3. Notify founder
    const notifyActions = await this.notifyFounder(lead, 'New Lead Received')
    event.actions.push(...notifyActions)

    // 4. Log audit event
    const auditAction = await this.logAuditEvent(lead, 'lead_created')
    event.actions.push(auditAction)

    // Check if any actions failed
    event.success = event.actions.every((a) => a.result !== 'failed')

    // Store event
    await this.storeAutomationEvent(event)

    return event
  }

  // ─── Auto-Reply ──────────────────────────────────────────

  private async sendAutoReply(lead: Lead): Promise<AutomationAction> {
    const action: AutomationAction = {
      type: 'auto_reply',
      result: 'skipped',
    }

    const template = await this.getTemplateByTrigger('lead_created')
    if (!template) {
      action.details = 'No active template found'
      return action
    }

    if (!this.sendEmail) {
      action.details = 'Email sending not configured'
      return action
    }

    try {
      const subject = this.substituteVariables(template.subject, lead)
      const body = this.substituteVariables(template.body, lead)

      const sent = await this.sendEmail(lead.email, subject, body)
      if (sent) {
        action.result = 'success'
        action.details = `Auto-reply sent to ${lead.email}`

        // Log activity on lead
        const leadService = getLeadService()
        await leadService.addActivity(lead.id, 'auto_reply_sent', `Auto-reply email sent: ${template.name}`)
      } else {
        action.result = 'failed'
        action.details = 'Email send returned false'
      }
    } catch (error) {
      action.result = 'failed'
      action.details = error instanceof Error ? error.message : 'Unknown error'
    }

    return action
  }

  // ─── Follow-Up Task Creation ─────────────────────────────

  private async createInitialFollowUpTask(lead: Lead): Promise<AutomationAction> {
    const action: AutomationAction = {
      type: 'create_task',
      result: 'success',
    }

    try {
      // Create task due in 24 hours
      const dueDate = new Date()
      dueDate.setHours(dueDate.getHours() + 24)

      const task = await this.taskService.create({
        leadId: lead.id,
        title: `Follow up with ${lead.firstName ?? lead.email}`,
        dueDate: dueDate.toISOString(),
        priority: 'normal',
        taskType: 'initial_contact',
        notes: `New lead from ${lead.source}. ${lead.projectDescription ?? ''}`,
      })

      action.details = `Task created: ${task.id}`

      // Log activity on lead
      const leadService = getLeadService()
      await leadService.addActivity(
        lead.id,
        'follow_up_scheduled',
        `Follow-up task scheduled for ${dueDate.toLocaleDateString()}`,
      )
    } catch (error) {
      action.result = 'failed'
      action.details = error instanceof Error ? error.message : 'Unknown error'
    }

    return action
  }

  // ─── Founder Notifications ───────────────────────────────

  private async notifyFounder(
    lead: Lead,
    title: string,
  ): Promise<AutomationAction[]> {
    const actions: AutomationAction[] = []
    const config = await this.getNotificationConfig()

    const leadName = lead.firstName ? `${lead.firstName} ${lead.lastName ?? ''}`.trim() : lead.email
    const leadSource = lead.source.replace(/_/g, ' ')
    const message = `${title}: ${leadName} (${lead.email}) from ${leadSource}`

    // Email notification
    if (config.emailEnabled && config.notifyEmail && this.sendEmail) {
      const emailAction: AutomationAction = {
        type: 'notify_email',
        result: 'success',
      }

      try {
        const body = `
New lead received:

Name: ${leadName}
Email: ${lead.email}
Phone: ${lead.phone ?? 'Not provided'}
Company: ${lead.company ?? 'Not provided'}
Source: ${leadSource}
Project: ${lead.projectDescription ?? 'Not provided'}

View in admin panel to respond.
        `.trim()

        const sent = await this.sendEmail(config.notifyEmail, title, body)
        if (!sent) {
          emailAction.result = 'failed'
          emailAction.details = 'Email send returned false'
        } else {
          emailAction.details = `Notification sent to ${config.notifyEmail}`
        }
      } catch (error) {
        emailAction.result = 'failed'
        emailAction.details = error instanceof Error ? error.message : 'Unknown error'
      }

      actions.push(emailAction)
    }

    // SMS notification
    if (config.smsEnabled && config.notifyPhone && this.sendSms) {
      const smsAction: AutomationAction = {
        type: 'notify_sms',
        result: 'success',
      }

      try {
        const sent = await this.sendSms(config.notifyPhone, message)
        if (!sent) {
          smsAction.result = 'failed'
          smsAction.details = 'SMS send returned false'
        } else {
          smsAction.details = `SMS sent to ${config.notifyPhone}`
        }
      } catch (error) {
        smsAction.result = 'failed'
        smsAction.details = error instanceof Error ? error.message : 'Unknown error'
      }

      actions.push(smsAction)
    }

    // Push notification
    if (config.pushEnabled && config.pushEndpoint && this.sendPush) {
      const pushAction: AutomationAction = {
        type: 'notify_push',
        result: 'success',
      }

      try {
        const sent = await this.sendPush(config.pushEndpoint, title, message)
        if (!sent) {
          pushAction.result = 'failed'
          pushAction.details = 'Push send returned false'
        } else {
          pushAction.details = 'Push notification sent'
        }
      } catch (error) {
        pushAction.result = 'failed'
        pushAction.details = error instanceof Error ? error.message : 'Unknown error'
      }

      actions.push(pushAction)
    }

    return actions
  }

  // ─── Audit Logging ───────────────────────────────────────

  private async logAuditEvent(
    lead: Lead,
    eventType: string,
  ): Promise<AutomationAction> {
    const action: AutomationAction = {
      type: 'log_audit',
      result: 'success',
    }

    try {
      const leadService = getLeadService()
      await leadService.addActivity(
        lead.id,
        'created',
        `Automation triggered for ${eventType}`,
        { eventType },
      )
      action.details = `Audit logged for ${eventType}`
    } catch (error) {
      action.result = 'failed'
      action.details = error instanceof Error ? error.message : 'Unknown error'
    }

    return action
  }

  // ─── Event Storage ───────────────────────────────────────

  private async storeAutomationEvent(event: AutomationEvent): Promise<void> {
    const events = (await this.adapter.get<AutomationEvent[]>(KEYS.AUTOMATION_EVENTS)) ?? []
    events.unshift(event)

    // Keep last 1000 events
    if (events.length > 1000) {
      events.length = 1000
    }

    await this.adapter.set(KEYS.AUTOMATION_EVENTS, events)
  }

  async getAutomationEvents(limit: number = 50): Promise<AutomationEvent[]> {
    const events = (await this.adapter.get<AutomationEvent[]>(KEYS.AUTOMATION_EVENTS)) ?? []
    return events.slice(0, limit)
  }

  // ─── Process Due Reminders ───────────────────────────────

  async processReminders(): Promise<{
    processed: number
    sent: number
    failed: number
  }> {
    const tasks = await this.taskService.getTasksNeedingReminder(24)
    let sent = 0
    let failed = 0

    const config = await this.getNotificationConfig()

    for (const task of tasks) {
      try {
        // Send reminder notification to founder
        if (config.emailEnabled && config.notifyEmail && this.sendEmail) {
          const leadService = getLeadService()
          const lead = await leadService.get(task.leadId)

          const subject = `⏰ Follow-up Due: ${task.title}`
          const body = `
A follow-up task is due soon:

Task: ${task.title}
Due: ${new Date(task.dueDate).toLocaleString()}
Lead: ${lead?.email ?? 'Unknown'}
Priority: ${task.priority}

${task.notes ?? ''}
          `.trim()

          const success = await this.sendEmail(config.notifyEmail, subject, body)
          if (success) {
            await this.taskService.markReminderSent(task.id)
            sent++
          } else {
            failed++
          }
        }
      } catch {
        failed++
      }
    }

    return {
      processed: tasks.length,
      sent,
      failed,
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _automationInstance: LeadAutomationService | null = null

export function getLeadAutomationService(
  config?: Partial<AutomationServiceConfig>,
): LeadAutomationService {
  if (config) {
    _automationInstance = new LeadAutomationService({
      adapter: config.adapter ?? createStorageAdapter(),
      ...config,
    })
    return _automationInstance
  }
  if (!_automationInstance) {
    _automationInstance = new LeadAutomationService({
      adapter: createStorageAdapter(),
    })
  }
  return _automationInstance
}
