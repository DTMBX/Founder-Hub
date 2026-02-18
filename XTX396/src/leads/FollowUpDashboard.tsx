/**
 * Follow-Up Task Dashboard
 *
 * Admin panel component for managing follow-up tasks:
 * - Task list with filtering
 * - Quick actions (complete, reschedule)
 * - Lead context integration
 * - Overdue highlighting
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  ChevronRight,
  Filter,
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getFollowUpTaskService } from './follow-up-task.service'
import { getLeadService } from './service'
import type { FollowUpTask, FollowUpTaskStatus, Lead } from './types'

// ─── Types ───────────────────────────────────────────────────

export interface FollowUpDashboardProps {
  /** Callback when lead is selected */
  onLeadSelect?: (leadId: string) => void
  /** Custom class */
  className?: string
}

interface TaskWithLead extends FollowUpTask {
  lead?: Lead | null
}

type FilterStatus = 'all' | FollowUpTaskStatus

// ─── Component ───────────────────────────────────────────────

export function FollowUpDashboard({
  onLeadSelect,
  className,
}: FollowUpDashboardProps) {
  const [tasks, setTasks] = useState<TaskWithLead[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    completedToday: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)

  // ─── Data Loading ──────────────────────────────────────────

  const loadTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const taskService = getFollowUpTaskService()
      const leadService = getLeadService()

      const statusFilter =
        filter === 'all' ? undefined : filter

      const result = await taskService.list({
        status: statusFilter,
        limit: 100,
      })

      // Enrich tasks with lead data
      const enriched: TaskWithLead[] = await Promise.all(
        result.tasks.map(async (task) => ({
          ...task,
          lead: await leadService.get(task.leadId),
        })),
      )

      // Apply search filter
      let filtered = enriched
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = enriched.filter(
          (t) =>
            t.title.toLowerCase().includes(query) ||
            t.lead?.email?.toLowerCase().includes(query) ||
            t.lead?.firstName?.toLowerCase().includes(query) ||
            t.lead?.company?.toLowerCase().includes(query),
        )
      }

      setTasks(filtered)

      // Load stats
      const statsData = await taskService.getStats()
      setStats(statsData)
    } catch (error) {
      console.error('[FollowUpDashboard] Error loading tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filter, searchQuery])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // ─── Task Actions ──────────────────────────────────────────

  const completeTask = async (taskId: string) => {
    try {
      const taskService = getFollowUpTaskService()
      await taskService.complete(taskId)
      await loadTasks()
    } catch (error) {
      console.error('[FollowUpDashboard] Error completing task:', error)
    }
  }

  const cancelTask = async (taskId: string) => {
    try {
      const taskService = getFollowUpTaskService()
      await taskService.cancel(taskId)
      await loadTasks()
    } catch (error) {
      console.error('[FollowUpDashboard] Error cancelling task:', error)
    }
  }

  // ─── Helpers ───────────────────────────────────────────────

  const formatDueDate = (date: string): string => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = d.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffHours < -24) {
      return `${Math.abs(Math.floor(diffDays))} days overdue`
    }
    if (diffHours < 0) {
      return `${Math.abs(Math.floor(diffHours))} hours overdue`
    }
    if (diffHours < 24) {
      return `in ${Math.floor(diffHours)} hours`
    }
    if (diffDays < 7) {
      return `in ${Math.floor(diffDays)} days`
    }
    return d.toLocaleDateString()
  }

  const getStatusColor = (status: FollowUpTaskStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-700'
      case 'overdue':
        return 'bg-red-100 text-red-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-gray-100 text-gray-500'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: FollowUpTask['priority']): string => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-orange-500'
      case 'normal':
        return 'border-l-blue-500'
      case 'low':
        return 'border-l-gray-300'
      default:
        return 'border-l-gray-300'
    }
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="border-b bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Follow-Up Tasks</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTasks}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-center">
            <div className="text-xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-xs text-blue-600/80">Pending</div>
          </div>
          <div className="rounded-lg bg-red-50 px-3 py-2 text-center">
            <div className="text-xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs text-red-600/80">Overdue</div>
          </div>
          <div className="rounded-lg bg-green-50 px-3 py-2 text-center">
            <div className="text-xl font-bold text-green-600">{stats.completedToday}</div>
            <div className="text-xs text-green-600/80">Today</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
            <div className="text-xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Search tasks or leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2">
            {(['all', 'pending', 'overdue', 'completed'] as FilterStatus[]).map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
                className="flex-1 sm:flex-none capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
            <p className="text-sm text-gray-500">
              {filter === 'all'
                ? 'Tasks will appear here when new leads come in.'
                : `No ${filter} tasks at the moment.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {tasks.map((task) => (
              <li
                key={task.id}
                className={cn(
                  'border-l-4 bg-white transition-colors hover:bg-gray-50',
                  getPriorityColor(task.priority),
                )}
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                            getStatusColor(task.status),
                          )}
                        >
                          {task.status}
                        </span>
                        {task.status === 'overdue' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>

                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </h3>

                      {/* Lead info */}
                      {task.lead && (
                        <button
                          onClick={() => onLeadSelect?.(task.leadId)}
                          className="mt-1 flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          <User className="h-3 w-3" />
                          {task.lead.firstName
                            ? `${task.lead.firstName} ${task.lead.lastName ?? ''}`
                            : task.lead.email}
                          {task.lead.company && (
                            <span className="text-gray-500">• {task.lead.company}</span>
                          )}
                        </button>
                      )}

                      {/* Due date */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDueDate(task.dueDate)}
                        </span>
                        <span className="capitalize">{task.taskType.replace(/_/g, ' ')}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {task.lead?.phone && (
                        <a
                          href={`tel:${task.lead.phone}`}
                          className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Call"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {task.lead?.email && (
                        <a
                          href={`mailto:${task.lead.email}`}
                          className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Email"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {task.status === 'pending' || task.status === 'overdue' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => completeTask(task.id)}
                          className="whitespace-nowrap"
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Done
                        </Button>
                      ) : null}
                      <button
                        onClick={() =>
                          setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                        }
                        className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedTaskId === task.id && (
                    <div className="mt-4 rounded-lg border bg-gray-50 p-4">
                      <div className="space-y-3 text-sm">
                        {task.notes && (
                          <div>
                            <span className="font-medium">Notes:</span>
                            <p className="mt-1 text-gray-600">{task.notes}</p>
                          </div>
                        )}
                        <div className="flex gap-4">
                          <div>
                            <span className="font-medium">Created:</span>{' '}
                            {new Date(task.createdAt).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Priority:</span>{' '}
                            <span className="capitalize">{task.priority}</span>
                          </div>
                        </div>
                        {task.status !== 'completed' && task.status !== 'cancelled' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelTask(task.id)}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Cancel Task
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
