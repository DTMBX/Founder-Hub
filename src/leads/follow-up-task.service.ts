/**
 * Follow-Up Task Service
 *
 * Manages follow-up tasks for leads with:
 * - CRUD operations
 * - Reminder scheduling
 * - Overdue detection
 * - Task assignment
 */

import type {
  FollowUpTask,
  FollowUpTaskStatus,
  FollowUpTaskType,
} from './types'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'

// ─── Storage Keys ────────────────────────────────────────────

const KEYS = {
  TASKS_INDEX: 'xtx_followup_tasks',
  TASK: (id: string) => `xtx_followup_task_${id}`,
  LEAD_TASKS: (leadId: string) => `xtx_lead_tasks_${leadId}`,
}

// ─── Task Service ────────────────────────────────────────────

export interface CreateTaskInput {
  leadId: string
  title: string
  dueDate: string
  priority?: FollowUpTask['priority']
  taskType?: FollowUpTaskType
  assignedTo?: string
  notes?: string
}

export interface TaskListQuery {
  status?: FollowUpTaskStatus | FollowUpTaskStatus[]
  leadId?: string
  assignedTo?: string
  dueBefore?: string
  dueAfter?: string
  priority?: FollowUpTask['priority']
  limit?: number
  offset?: number
}

export interface TaskListResult {
  tasks: FollowUpTask[]
  total: number
  hasMore: boolean
}

export class FollowUpTaskService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Create a new follow-up task
   */
  async create(input: CreateTaskInput): Promise<FollowUpTask> {
    const now = new Date().toISOString()
    const task: FollowUpTask = {
      id: crypto.randomUUID(),
      leadId: input.leadId,
      title: input.title,
      dueDate: input.dueDate,
      status: 'pending',
      reminderSent: false,
      createdAt: now,
      priority: input.priority ?? 'normal',
      taskType: input.taskType ?? 'custom',
      assignedTo: input.assignedTo,
      notes: input.notes,
    }

    // Save task
    await this.adapter.set(KEYS.TASK(task.id), task)

    // Add to global index
    const allIds = (await this.adapter.get<string[]>(KEYS.TASKS_INDEX)) ?? []
    allIds.unshift(task.id)
    await this.adapter.set(KEYS.TASKS_INDEX, allIds)

    // Add to lead's tasks index
    const leadTaskIds = (await this.adapter.get<string[]>(KEYS.LEAD_TASKS(input.leadId))) ?? []
    leadTaskIds.unshift(task.id)
    await this.adapter.set(KEYS.LEAD_TASKS(input.leadId), leadTaskIds)

    return task
  }

  /**
   * Get a task by ID
   */
  async get(id: string): Promise<FollowUpTask | null> {
    return this.adapter.get<FollowUpTask>(KEYS.TASK(id))
  }

  /**
   * Update a task
   */
  async update(id: string, updates: Partial<FollowUpTask>): Promise<FollowUpTask | null> {
    const task = await this.get(id)
    if (!task) return null

    const updated: FollowUpTask = {
      ...task,
      ...updates,
      id: task.id, // Prevent ID change
      leadId: task.leadId, // Prevent lead change
      createdAt: task.createdAt, // Prevent created change
    }

    await this.adapter.set(KEYS.TASK(id), updated)
    return updated
  }

  /**
   * Mark task as completed
   */
  async complete(id: string): Promise<FollowUpTask | null> {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
  }

  /**
   * Mark task as cancelled
   */
  async cancel(id: string): Promise<FollowUpTask | null> {
    return this.update(id, {
      status: 'cancelled',
    })
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(id: string): Promise<FollowUpTask | null> {
    return this.update(id, {
      reminderSent: true,
      reminderSentAt: new Date().toISOString(),
    })
  }

  /**
   * List tasks with optional filtering
   */
  async list(query?: TaskListQuery): Promise<TaskListResult> {
    const allIds = (await this.adapter.get<string[]>(KEYS.TASKS_INDEX)) ?? []
    let tasks: FollowUpTask[] = []

    // Load all tasks
    for (const id of allIds) {
      const task = await this.get(id)
      if (task) tasks.push(task)
    }

    // Update overdue status
    const now = new Date().toISOString()
    tasks = tasks.map((t) => {
      if (t.status === 'pending' && t.dueDate < now) {
        return { ...t, status: 'overdue' as FollowUpTaskStatus }
      }
      return t
    })

    // Apply filters
    if (query?.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status]
      tasks = tasks.filter((t) => statuses.includes(t.status))
    }

    if (query?.leadId) {
      tasks = tasks.filter((t) => t.leadId === query.leadId)
    }

    if (query?.assignedTo) {
      tasks = tasks.filter((t) => t.assignedTo === query.assignedTo)
    }

    if (query?.dueBefore) {
      tasks = tasks.filter((t) => t.dueDate <= query.dueBefore!)
    }

    if (query?.dueAfter) {
      tasks = tasks.filter((t) => t.dueDate >= query.dueAfter!)
    }

    if (query?.priority) {
      tasks = tasks.filter((t) => t.priority === query.priority)
    }

    // Sort by due date (earliest first), then priority
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
    tasks.sort((a, b) => {
      const dateComp = a.dueDate.localeCompare(b.dueDate)
      if (dateComp !== 0) return dateComp
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Paginate
    const total = tasks.length
    const offset = query?.offset ?? 0
    const limit = query?.limit ?? 50
    tasks = tasks.slice(offset, offset + limit)

    return {
      tasks,
      total,
      hasMore: offset + tasks.length < total,
    }
  }

  /**
   * Get tasks for a specific lead
   */
  async getForLead(leadId: string): Promise<FollowUpTask[]> {
    const result = await this.list({ leadId })
    return result.tasks
  }

  /**
   * Get overdue tasks
   */
  async getOverdue(): Promise<FollowUpTask[]> {
    const result = await this.list({ status: 'overdue' })
    return result.tasks
  }

  /**
   * Get pending tasks due within hours
   */
  async getDueSoon(hours: number = 24): Promise<FollowUpTask[]> {
    const targetDate = new Date()
    targetDate.setHours(targetDate.getHours() + hours)

    const result = await this.list({
      status: 'pending',
      dueBefore: targetDate.toISOString(),
    })
    return result.tasks
  }

  /**
   * Get tasks needing reminder notifications
   * Returns tasks due within specified hours that haven't had reminder sent
   */
  async getTasksNeedingReminder(hoursBeforeDue: number = 24): Promise<FollowUpTask[]> {
    const tasks = await this.getDueSoon(hoursBeforeDue)
    return tasks.filter((t) => !t.reminderSent)
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<boolean> {
    const task = await this.get(id)
    if (!task) return false

    // Remove from global index
    const allIds = (await this.adapter.get<string[]>(KEYS.TASKS_INDEX)) ?? []
    const newAllIds = allIds.filter((i) => i !== id)
    await this.adapter.set(KEYS.TASKS_INDEX, newAllIds)

    // Remove from lead index
    const leadTaskIds = (await this.adapter.get<string[]>(KEYS.LEAD_TASKS(task.leadId))) ?? []
    const newLeadIds = leadTaskIds.filter((i) => i !== id)
    await this.adapter.set(KEYS.LEAD_TASKS(task.leadId), newLeadIds)

    // Remove task data
    await this.adapter.del(KEYS.TASK(id))

    return true
  }

  /**
   * Get task statistics
   */
  async getStats(): Promise<{
    total: number
    pending: number
    overdue: number
    completedToday: number
  }> {
    const result = await this.list()
    const today = new Date().toISOString().slice(0, 10)

    return {
      total: result.total,
      pending: result.tasks.filter((t) => t.status === 'pending').length,
      overdue: result.tasks.filter((t) => t.status === 'overdue').length,
      completedToday: result.tasks.filter(
        (t) => t.status === 'completed' && t.completedAt?.slice(0, 10) === today,
      ).length,
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _taskInstance: FollowUpTaskService | null = null

export function getFollowUpTaskService(adapter?: StorageAdapter): FollowUpTaskService {
  if (adapter) {
    _taskInstance = new FollowUpTaskService(adapter)
    return _taskInstance
  }
  if (!_taskInstance) {
    _taskInstance = new FollowUpTaskService(createStorageAdapter())
  }
  return _taskInstance
}
