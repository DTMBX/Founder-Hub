/**
 * Admin Leads Viewer
 *
 * Admin component for viewing and managing leads.
 * Features:
 * - Lead list with filtering
 * - Lead detail view
 * - Status updates
 * - Intake packet generation
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  Download,
  Eye,
  ChevronDown,
  Mail,
  Building,
  Clock,
  DollarSign,
  FileText,
  Printer,
  RefreshCw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getLeadService } from './service'
import { getIntakeService } from './intake'
import type { Lead, LeadStatus, LeadListResult } from './types'

// ─── Types ───────────────────────────────────────────────────

export interface AdminLeadsViewerProps {
  /** Maximum leads per page */
  pageSize?: number
  /** Custom className */
  className?: string
}

// ─── Status Badge Colors ─────────────────────────────────────

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
  contacted: 'bg-amber-100 text-amber-700',
  proposal_sent: 'bg-indigo-100 text-indigo-700',
  deposit_paid: 'bg-emerald-100 text-emerald-700',
  converted: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-700',
  unqualified: 'bg-red-100 text-red-700',
}

// ─── Lead Row Component ──────────────────────────────────────

interface LeadRowProps {
  lead: Lead
  onView: () => void
}

function LeadRow({ lead, onView }: LeadRowProps) {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  
  return (
    <tr
      className="hover:bg-muted/50 cursor-pointer"
      onClick={onView}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {(lead.firstName?.[0] || lead.email[0]).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">
              {lead.firstName || lead.lastName
                ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
                : lead.email}
            </div>
            <div className="text-sm text-muted-foreground">{lead.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm">{lead.company || '—'}</span>
      </td>
      <td className="px-4 py-3">
        <Badge className={cn('text-xs', STATUS_COLORS[lead.status])}>
          {lead.status.replace('_', ' ')}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm">{lead.source.replace('_', ' ')}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{formatDate(lead.createdAt)}</span>
      </td>
      <td className="px-4 py-3">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView(); }}>
          <Eye className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  )
}

// ─── Lead Detail Panel ───────────────────────────────────────

interface LeadDetailProps {
  lead: Lead
  onClose: () => void
  onStatusChange: (status: LeadStatus) => void
  onDownloadPacket: () => void
  onPrintPacket: () => void
}

function LeadDetail({
  lead,
  onClose,
  onStatusChange,
  onDownloadPacket,
  onPrintPacket,
}: LeadDetailProps) {
  const [activities, setActivities] = useState<Array<{ timestamp: string; type: string; description: string }>>([])
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  
  useEffect(() => {
    const loadActivities = async () => {
      const leadService = getLeadService()
      const acts = await leadService.getActivities(lead.id)
      setActivities(acts.map((a) => ({
        timestamp: a.timestamp,
        type: a.type,
        description: a.description,
      })))
    }
    loadActivities()
  }, [lead.id])
  
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  
  const statuses: LeadStatus[] = [
    'new', 'qualified', 'contacted', 'proposal_sent',
    'deposit_paid', 'converted', 'lost', 'unqualified',
  ]
  
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l shadow-xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lead Details</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Contact Info */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-medium">
              {(lead.firstName?.[0] || lead.email[0]).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold">
                {lead.firstName || lead.lastName
                  ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
                  : 'No Name'}
              </h3>
              <div className="text-muted-foreground">{lead.email}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{lead.email}</span>
            </div>
            {lead.company && (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span>{lead.company}</span>
              </div>
            )}
            {lead.budget && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>{lead.budget}</span>
              </div>
            )}
            {lead.timeline && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{lead.timeline}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Status */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">Status</label>
          <div className="relative mt-2">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
            >
              <Badge className={cn('text-sm', STATUS_COLORS[lead.status])}>
                {lead.status.replace('_', ' ')}
              </Badge>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showStatusMenu && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-10">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      onStatusChange(status)
                      setShowStatusMenu(false)
                    }}
                    className={cn(
                      'w-full px-4 py-2 text-left text-sm hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg',
                      status === lead.status && 'bg-muted'
                    )}
                  >
                    <Badge className={cn('text-xs', STATUS_COLORS[status])}>
                      {status.replace('_', ' ')}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Project Description */}
        {lead.projectDescription && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Project Description</label>
            <p className="mt-2">{lead.projectDescription}</p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDownloadPacket}>
            <Download className="w-4 h-4 mr-2" />
            Download Packet
          </Button>
          <Button variant="outline" size="sm" onClick={onPrintPacket}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
        
        {/* Timeline */}
        <div>
          <label className="text-sm font-medium text-muted-foreground">Activity Timeline</label>
          <div className="mt-2 space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activities yet.</p>
            ) : (
              activities.map((act, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <div className="text-muted-foreground">{formatDate(act.timestamp)}</div>
                    <div>{act.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Meta */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Created: {formatDate(lead.createdAt)}</div>
          <div>Last Updated: {formatDate(lead.updatedAt)}</div>
          <div>Source: {lead.source}</div>
          {lead.landingPage && <div>Landing Page: {lead.landingPage}</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function AdminLeadsViewer({
  pageSize = 20,
  className,
}: AdminLeadsViewerProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  
  const loadLeads = useCallback(async () => {
    setIsLoading(true)
    const leadService = getLeadService()
    
    const result: LeadListResult = await leadService.list({
      search: search || undefined,
      status: statusFilter ?? undefined,
      limit: pageSize,
      offset,
    })
    
    setLeads(result.leads)
    setTotal(result.total)
    setIsLoading(false)
  }, [search, statusFilter, pageSize, offset])
  
  useEffect(() => {
    loadLeads()
  }, [loadLeads])
  
  const handleStatusChange = async (status: LeadStatus) => {
    if (!selectedLead) return
    
    const leadService = getLeadService()
    const updated = await leadService.updateStatus(selectedLead.id, status)
    
    if (updated) {
      setSelectedLead(updated)
      loadLeads()
    }
  }
  
  const handleDownloadPacket = async () => {
    if (!selectedLead) return
    
    const intakeService = getIntakeService()
    const packet = await intakeService.generatePacket(selectedLead.id)
    
    if (packet) {
      intakeService.downloadHTML(packet)
    }
  }
  
  const handlePrintPacket = async () => {
    if (!selectedLead) return
    
    const intakeService = getIntakeService()
    const packet = await intakeService.generatePacket(selectedLead.id)
    
    if (packet) {
      intakeService.print(packet)
    }
  }
  
  const statuses: LeadStatus[] = [
    'new', 'qualified', 'contacted', 'proposal_sent',
    'deposit_paid', 'converted', 'lost', 'unqualified',
  ]
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">{total} total leads</p>
        </div>
        <Button variant="outline" onClick={loadLeads} disabled={isLoading}>
          <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="relative">
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus || null)}
            className="h-10 px-4 pr-8 border rounded-md bg-background appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>
      
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-3 text-left text-sm font-medium">Contact</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Company</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Source</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Created</th>
              <th className="px-4 py-3 text-left text-sm font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {isLoading ? 'Loading...' : 'No leads found.'}
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onView={() => setSelectedLead(lead)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {offset + 1} - {Math.min(offset + pageSize, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - pageSize))}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + pageSize)}
              disabled={offset + pageSize >= total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      {/* Detail Panel */}
      {selectedLead && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedLead(null)}
          />
          <LeadDetail
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onStatusChange={handleStatusChange}
            onDownloadPacket={handleDownloadPacket}
            onPrintPacket={handlePrintPacket}
          />
        </>
      )}
    </div>
  )
}

export default AdminLeadsViewer
