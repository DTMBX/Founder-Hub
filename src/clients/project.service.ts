/**
 * Project Service
 *
 * Manages projects with:
 * - CRUD operations
 * - Status timeline (planned → active → review → complete)
 * - Update tracking
 * - File management
 */

import type {
  Project,
  ProjectStatus,
  ProjectUpdate,
  ProjectFile,
  ProjectListQuery,
  ProjectListResult,
} from './types'
import type { StorageAdapter } from '@/lib/storage-adapter'
import { createStorageAdapter } from '@/lib/storage-adapter'

// ─── Storage Keys ────────────────────────────────────────────

const KEYS = {
  PROJECTS_INDEX: 'xtx_projects',
  PROJECT: (id: string) => `xtx_project_${id}`,
  CLIENT_PROJECTS: (clientId: string) => `xtx_client_projects_${clientId}`,
}

// ─── Status Transitions ──────────────────────────────────────

const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  planned: ['active', 'on-hold', 'cancelled'],
  active: ['review', 'on-hold', 'cancelled'],
  review: ['active', 'complete', 'on-hold'],
  complete: [], // Terminal state
  'on-hold': ['planned', 'active', 'cancelled'],
  cancelled: [], // Terminal state
}

// ─── Service ─────────────────────────────────────────────────

export interface CreateProjectInput {
  clientId: string
  name: string
  description?: string
  startDate?: string
  estimatedCompletion?: string
  budget?: number
  proposalId?: string
  projectType?: string
  priority?: Project['priority']
  tags?: string[]
  weeklyUpdateEnabled?: boolean
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  startDate?: string
  estimatedCompletion?: string
  budget?: number
  hoursTracked?: number
  projectType?: string
  priority?: Project['priority']
  tags?: string[]
  weeklyUpdateEnabled?: boolean
  progress?: number
}

export class ProjectService {
  constructor(private adapter: StorageAdapter) {}

  /**
   * Create a new project
   */
  async create(input: CreateProjectInput): Promise<Project> {
    const now = new Date().toISOString()
    const project: Project = {
      id: crypto.randomUUID(),
      clientId: input.clientId,
      name: input.name,
      description: input.description,
      status: 'planned',
      startDate: input.startDate ?? now,
      estimatedCompletion: input.estimatedCompletion,
      updates: [],
      files: [],
      createdAt: now,
      updatedAt: now,
      budget: input.budget,
      proposalId: input.proposalId,
      projectType: input.projectType,
      priority: input.priority ?? 'normal',
      tags: input.tags ?? [],
      weeklyUpdateEnabled: input.weeklyUpdateEnabled ?? true,
      progress: 0,
    }

    // Add initial update
    project.updates.push({
      id: crypto.randomUUID(),
      timestamp: now,
      type: 'status_change',
      title: 'Project Created',
      content: `Project "${project.name}" was created with status: planned`,
      sentToClient: false,
      author: 'system',
    })

    await this.adapter.set(KEYS.PROJECT(project.id), project)

    // Add to global index
    const allIds = (await this.adapter.get<string[]>(KEYS.PROJECTS_INDEX)) ?? []
    allIds.unshift(project.id)
    await this.adapter.set(KEYS.PROJECTS_INDEX, allIds)

    // Add to client's projects
    const clientProjectIds =
      (await this.adapter.get<string[]>(KEYS.CLIENT_PROJECTS(input.clientId))) ?? []
    clientProjectIds.unshift(project.id)
    await this.adapter.set(KEYS.CLIENT_PROJECTS(input.clientId), clientProjectIds)

    if (import.meta.env.DEV) console.log(`[Project Created] ${project.name}`, project.id)
    return project
  }

  /**
   * Get project by ID
   */
  async get(id: string): Promise<Project | null> {
    return this.adapter.get<Project>(KEYS.PROJECT(id))
  }

  /**
   * Update project
   */
  async update(id: string, input: UpdateProjectInput): Promise<Project | null> {
    const project = await this.get(id)
    if (!project) return null

    const updated: Project = {
      ...project,
      ...input,
      id: project.id,
      clientId: project.clientId,
      status: project.status, // Use changeStatus for status changes
      updates: project.updates,
      files: project.files,
      createdAt: project.createdAt,
      updatedAt: new Date().toISOString(),
    }

    await this.adapter.set(KEYS.PROJECT(id), updated)
    return updated
  }

  /**
   * Change project status with validation
   */
  async changeStatus(
    id: string,
    newStatus: ProjectStatus,
    note?: string,
  ): Promise<Project | null> {
    const project = await this.get(id)
    if (!project) return null

    // Validate transition
    const validNext = VALID_TRANSITIONS[project.status]
    if (!validNext.includes(newStatus)) {
      console.warn(
        `[Project] Invalid status transition: ${project.status} → ${newStatus}`,
      )
      return null
    }

    const now = new Date().toISOString()
    const oldStatus = project.status

    // Update status
    project.status = newStatus
    project.updatedAt = now

    // Set completion date if completing
    if (newStatus === 'complete') {
      project.completedAt = now
      project.progress = 100
    }

    // Add status change update
    const update: ProjectUpdate = {
      id: crypto.randomUUID(),
      timestamp: now,
      type: 'status_change',
      title: `Status: ${oldStatus} → ${newStatus}`,
      content: note ?? `Project status changed from ${oldStatus} to ${newStatus}`,
      sentToClient: false,
      author: 'system',
    }
    project.updates.unshift(update)

    await this.adapter.set(KEYS.PROJECT(id), project)
    return project
  }

  /**
   * Add a project update
   */
  async addUpdate(
    id: string,
    update: Omit<ProjectUpdate, 'id' | 'timestamp' | 'sentToClient' | 'sentAt'>,
  ): Promise<Project | null> {
    const project = await this.get(id)
    if (!project) return null

    const newUpdate: ProjectUpdate = {
      ...update,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sentToClient: false,
    }

    project.updates.unshift(newUpdate)
    project.updatedAt = newUpdate.timestamp

    await this.adapter.set(KEYS.PROJECT(id), project)
    return project
  }

  /**
   * Mark an update as sent to client
   */
  async markUpdateSent(projectId: string, updateId: string): Promise<boolean> {
    const project = await this.get(projectId)
    if (!project) return false

    const update = project.updates.find((u) => u.id === updateId)
    if (!update) return false

    update.sentToClient = true
    update.sentAt = new Date().toISOString()

    await this.adapter.set(KEYS.PROJECT(projectId), project)
    return true
  }

  /**
   * Add a file to project
   */
  async addFile(
    id: string,
    file: Omit<ProjectFile, 'id' | 'uploadedAt'>,
  ): Promise<Project | null> {
    const project = await this.get(id)
    if (!project) return null

    const newFile: ProjectFile = {
      ...file,
      id: crypto.randomUUID(),
      uploadedAt: new Date().toISOString(),
    }

    project.files.push(newFile)
    project.updatedAt = newFile.uploadedAt

    // Add update entry
    project.updates.unshift({
      id: crypto.randomUUID(),
      timestamp: newFile.uploadedAt,
      type: 'note',
      title: 'File Added',
      content: `File "${file.name}" was uploaded`,
      attachments: [newFile],
      sentToClient: false,
      author: file.uploadedBy,
    })

    await this.adapter.set(KEYS.PROJECT(id), project)
    return project
  }

  /**
   * Remove a file from project
   */
  async removeFile(projectId: string, fileId: string): Promise<boolean> {
    const project = await this.get(projectId)
    if (!project) return false

    const fileIndex = project.files.findIndex((f) => f.id === fileId)
    if (fileIndex === -1) return false

    project.files.splice(fileIndex, 1)
    project.updatedAt = new Date().toISOString()

    await this.adapter.set(KEYS.PROJECT(projectId), project)
    return true
  }

  /**
   * Update progress percentage
   */
  async updateProgress(id: string, progress: number): Promise<Project | null> {
    const project = await this.get(id)
    if (!project) return null

    const clampedProgress = Math.max(0, Math.min(100, progress))
    const previousProgress = project.progress

    project.progress = clampedProgress
    project.updatedAt = new Date().toISOString()

    // Add milestone update if crossing thresholds
    const milestones = [25, 50, 75, 100]
    for (const milestone of milestones) {
      if (previousProgress < milestone && clampedProgress >= milestone) {
        project.updates.unshift({
          id: crypto.randomUUID(),
          timestamp: project.updatedAt,
          type: 'milestone',
          title: `${milestone}% Complete`,
          content: `Project reached ${milestone}% completion`,
          sentToClient: false,
          author: 'system',
        })
        break
      }
    }

    await this.adapter.set(KEYS.PROJECT(id), project)
    return project
  }

  /**
   * List projects with filtering
   */
  async list(query?: ProjectListQuery): Promise<ProjectListResult> {
    let projectIds: string[]

    if (query?.clientId) {
      // Get client's projects
      projectIds =
        (await this.adapter.get<string[]>(KEYS.CLIENT_PROJECTS(query.clientId))) ?? []
    } else {
      // Get all projects
      projectIds = (await this.adapter.get<string[]>(KEYS.PROJECTS_INDEX)) ?? []
    }

    let projects: Project[] = []

    // Load all projects
    for (const id of projectIds) {
      const project = await this.get(id)
      if (project) projects.push(project)
    }

    // Apply filters
    if (query?.status) {
      const statuses = Array.isArray(query.status) ? query.status : [query.status]
      projects = projects.filter((p) => statuses.includes(p.status))
    }

    if (query?.search) {
      const searchLower = query.search.toLowerCase()
      projects = projects.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower),
      )
    }

    // Sort by status priority, then updated date
    const statusOrder: Record<ProjectStatus, number> = {
      active: 0,
      review: 1,
      planned: 2,
      'on-hold': 3,
      complete: 4,
      cancelled: 5,
    }
    projects.sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return b.updatedAt.localeCompare(a.updatedAt)
    })

    const total = projects.length
    const offset = query?.offset ?? 0
    const limit = query?.limit ?? 50
    const paginated = projects.slice(offset, offset + limit)

    return {
      projects: paginated,
      total,
      hasMore: offset + paginated.length < total,
    }
  }

  /**
   * Get projects needing weekly update
   */
  async getProjectsForWeeklyUpdate(): Promise<Project[]> {
    const allIds = (await this.adapter.get<string[]>(KEYS.PROJECTS_INDEX)) ?? []
    const projects: Project[] = []

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    for (const id of allIds) {
      const project = await this.get(id)
      if (!project) continue

      // Only active projects with weekly updates enabled
      if (project.status !== 'active') continue
      if (!project.weeklyUpdateEnabled) continue

      // Haven't sent update in the last 7 days
      if (!project.lastWeeklyUpdate || project.lastWeeklyUpdate < oneWeekAgo) {
        projects.push(project)
      }
    }

    return projects
  }

  /**
   * Mark weekly update as sent
   */
  async markWeeklyUpdateSent(id: string): Promise<boolean> {
    const project = await this.get(id)
    if (!project) return false

    project.lastWeeklyUpdate = new Date().toISOString()
    await this.adapter.set(KEYS.PROJECT(id), project)
    return true
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<boolean> {
    const project = await this.get(id)
    if (!project) return false

    // Remove from global index
    const allIds = (await this.adapter.get<string[]>(KEYS.PROJECTS_INDEX)) ?? []
    const newIds = allIds.filter((i) => i !== id)
    await this.adapter.set(KEYS.PROJECTS_INDEX, newIds)

    // Remove from client's projects
    const clientProjectIds =
      (await this.adapter.get<string[]>(KEYS.CLIENT_PROJECTS(project.clientId))) ?? []
    const newClientIds = clientProjectIds.filter((i) => i !== id)
    await this.adapter.set(KEYS.CLIENT_PROJECTS(project.clientId), newClientIds)

    // Remove project data
    await this.adapter.del(KEYS.PROJECT(id))

    return true
  }

  /**
   * Get project statistics
   */
  async getStats(): Promise<{
    total: number
    byStatus: Record<ProjectStatus, number>
    activeCount: number
    completedThisMonth: number
  }> {
    const allIds = (await this.adapter.get<string[]>(KEYS.PROJECTS_INDEX)) ?? []
    const byStatus: Record<ProjectStatus, number> = {
      planned: 0,
      active: 0,
      review: 0,
      complete: 0,
      'on-hold': 0,
      cancelled: 0,
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const startOfMonthStr = startOfMonth.toISOString()

    let completedThisMonth = 0

    for (const id of allIds) {
      const project = await this.get(id)
      if (!project) continue

      byStatus[project.status]++

      if (project.status === 'complete' && project.completedAt && project.completedAt >= startOfMonthStr) {
        completedThisMonth++
      }
    }

    return {
      total: allIds.length,
      byStatus,
      activeCount: byStatus.active + byStatus.review,
      completedThisMonth,
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────

let _projectService: ProjectService | null = null

export function getProjectService(adapter?: StorageAdapter): ProjectService {
  if (!_projectService) {
    _projectService = new ProjectService(adapter ?? createStorageAdapter())
  }
  return _projectService
}
