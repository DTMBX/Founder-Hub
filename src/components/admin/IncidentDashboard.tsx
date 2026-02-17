/**
 * Incident Dashboard - Admin UI for Incident Management
 * 
 * Chain B6 - Incident Log + Tamper-Evident Audit
 * 
 * Features:
 * - View and manage incidents
 * - Create new incidents
 * - Transition incident status
 * - Timeline view
 * - Role-based access (read-only for Support, full for Owner)
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Warning, ShieldWarning, CheckCircle, Clock, Plus, 
  MagnifyingGlass, ArrowRight, Export, CaretDown, User,
  CalendarBlank, Tag, ListBullets, X
} from '@phosphor-icons/react'
import { usePermissions } from '@/lib/route-guards'
import { toast } from 'sonner'
import {
  incidentLog,
  type Incident,
  type IncidentType,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentStats
} from '@/lib/incident-log'

// ─── Constants ───────────────────────────────────────────────

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-black',
  low: 'bg-blue-500 text-white'
}

const STATUS_COLORS: Record<IncidentStatus, string> = {
  open: 'bg-red-500 text-white',
  investigating: 'bg-yellow-500 text-black',
  resolved: 'bg-green-500 text-white',
  closed: 'bg-gray-500 text-white'
}

const INCIDENT_TYPES: { value: IncidentType; label: string }[] = [
  { value: 'security_event', label: 'Security Event' },
  { value: 'access_anomaly', label: 'Access Anomaly' },
  { value: 'deploy_failure', label: 'Deploy Failure' },
  { value: 'key_exposure', label: 'Key Exposure' },
  { value: 'data_breach', label: 'Data Breach' },
  { value: 'system_failure', label: 'System Failure' },
  { value: 'policy_violation', label: 'Policy Violation' },
  { value: 'unauthorized_access', label: 'Unauthorized Access' },
  { value: 'integrity_violation', label: 'Integrity Violation' },
  { value: 'other', label: 'Other' }
]

// ─── Component ───────────────────────────────────────────────

export default function IncidentDashboard() {
  const permissions = usePermissions()
  const isReadOnly = !permissions.canExecuteAction('incident-manage')
  
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<IncidentStats | null>(null)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  
  // Form state for creating incidents
  const [newIncident, setNewIncident] = useState({
    type: 'security_event' as IncidentType,
    title: '',
    description: '',
    severity: 'medium' as IncidentSeverity,
    affected: '',
    impact: ''
  })
  
  // Load incidents on mount
  useEffect(() => {
    loadIncidents()
  }, [])
  
  async function loadIncidents() {
    await incidentLog.initialize()
    setIncidents(incidentLog.getAll())
    setStats(incidentLog.getStats())
  }
  
  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    if (searchTerm && !incident.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !incident.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'all' && incident.status !== statusFilter) {
      return false
    }
    if (severityFilter !== 'all' && incident.severity !== severityFilter) {
      return false
    }
    return true
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  async function handleCreateIncident() {
    if (!newIncident.title || !newIncident.description) {
      toast.error('Title and description are required')
      return
    }
    
    try {
      await incidentLog.create({
        type: newIncident.type,
        title: newIncident.title,
        description: newIncident.description,
        severity: newIncident.severity,
        affected: newIncident.affected.split(',').map(s => s.trim()).filter(Boolean),
        impact: newIncident.impact || undefined
      })
      
      toast.success('Incident created')
      setShowCreateDialog(false)
      setNewIncident({
        type: 'security_event',
        title: '',
        description: '',
        severity: 'medium',
        affected: '',
        impact: ''
      })
      loadIncidents()
    } catch (error) {
      toast.error('Failed to create incident')
      console.error(error)
    }
  }
  
  async function handleTransition(incident: Incident, newStatus: IncidentStatus) {
    try {
      await incidentLog.transition(incident.id, newStatus)
      toast.success(`Incident ${newStatus}`)
      loadIncidents()
      // Refresh selected incident
      if (selectedIncident?.id === incident.id) {
        setSelectedIncident(incidentLog.get(incident.id) ?? null)
      }
    } catch (error) {
      toast.error('Failed to update incident')
      console.error(error)
    }
  }
  
  async function handleExport() {
    try {
      const exportData = incidentLog.export({ includeTimeline: true })
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `incidents-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Incidents exported')
    } catch (error) {
      toast.error('Export failed')
      console.error(error)
    }
  }
  
  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  function formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h`
    const minutes = Math.floor(ms / (1000 * 60))
    return `${minutes}m`
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Incident Management</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage security incidents and system events
          </p>
        </div>
        <div className="flex gap-2">
          {!isReadOnly && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Incident
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Export className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
              <Warning className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.byStatus.investigating} investigating
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical/High</CardTitle>
              <ShieldWarning className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.bySeverity.critical + stats.bySeverity.high}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.bySeverity.critical} critical
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved (24h)</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedLast24h}</div>
              <p className="text-xs text-muted-foreground">
                {stats.byStatus.closed} total closed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avgResolutionTimeMs ? formatDuration(stats.avgResolutionTimeMs) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.total} total incidents
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Incident List */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents</CardTitle>
          <CardDescription>
            {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {filteredIncidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-2" />
                <p>No incidents found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedIncident(incident)
                      setShowDetailDialog(true)
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">
                          {incident.id}
                        </span>
                        <Badge className={SEVERITY_COLORS[incident.severity]}>
                          {incident.severity}
                        </Badge>
                        <Badge className={STATUS_COLORS[incident.status]}>
                          {incident.status}
                        </Badge>
                      </div>
                      <h4 className="font-medium truncate">{incident.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {incident.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarBlank className="h-3 w-3" />
                          {formatDate(incident.createdAt)}
                        </span>
                        {incident.affected.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {incident.affected.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Create Incident Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Incident</DialogTitle>
            <DialogDescription>
              Document a new security incident or system event
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newIncident.type}
                  onValueChange={(value) => setNewIncident(prev => ({ ...prev, type: value as IncidentType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={newIncident.severity}
                  onValueChange={(value) => setNewIncident(prev => ({ ...prev, severity: value as IncidentSeverity }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newIncident.title}
                onChange={(e) => setNewIncident(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Brief incident title"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newIncident.description}
                onChange={(e) => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the incident"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Affected Systems (comma-separated)</Label>
              <Input
                value={newIncident.affected}
                onChange={(e) => setNewIncident(prev => ({ ...prev, affected: e.target.value }))}
                placeholder="e.g., authentication, api, database"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Impact Assessment</Label>
              <Textarea
                value={newIncident.impact}
                onChange={(e) => setNewIncident(prev => ({ ...prev, impact: e.target.value }))}
                placeholder="Describe the impact of this incident"
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateIncident}>
              Create Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Incident Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {selectedIncident && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-muted-foreground">
                    {selectedIncident.id}
                  </span>
                  <Badge className={SEVERITY_COLORS[selectedIncident.severity]}>
                    {selectedIncident.severity}
                  </Badge>
                  <Badge className={STATUS_COLORS[selectedIncident.status]}>
                    {selectedIncident.status}
                  </Badge>
                </div>
                <DialogTitle>{selectedIncident.title}</DialogTitle>
                <DialogDescription>
                  Created {formatDate(selectedIncident.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="flex-1 overflow-auto">
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="mt-1">{selectedIncident.description}</p>
                    </div>
                    
                    {selectedIncident.impact && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Impact</Label>
                        <p className="mt-1">{selectedIncident.impact}</p>
                      </div>
                    )}
                    
                    {selectedIncident.rootCause && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Root Cause</Label>
                        <p className="mt-1">{selectedIncident.rootCause}</p>
                      </div>
                    )}
                    
                    {selectedIncident.resolution && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Resolution</Label>
                        <p className="mt-1">{selectedIncident.resolution}</p>
                      </div>
                    )}
                    
                    {selectedIncident.affected.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Affected Systems</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedIncident.affected.map((system) => (
                            <Badge key={system} variant="outline">{system}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <p className="mt-1">{selectedIncident.type.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Last Updated</Label>
                        <p className="mt-1">{formatDate(selectedIncident.updatedAt)}</p>
                      </div>
                      {selectedIncident.resolvedAt && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Resolved At</Label>
                          <p className="mt-1">{formatDate(selectedIncident.resolvedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="timeline" className="flex-1 overflow-auto">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4 py-4">
                      {selectedIncident.timeline.map((entry, index) => (
                        <div key={entry.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            {index < selectedIncident.timeline.length - 1 && (
                              <div className="w-px flex-1 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                {entry.action.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(entry.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.description}
                            </p>
                            {entry.actor && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {entry.actor.name ?? entry.actor.id}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              
              {!isReadOnly && (
                <DialogFooter>
                  {selectedIncident.status === 'open' && (
                    <Button
                      variant="outline"
                      onClick={() => handleTransition(selectedIncident, 'investigating')}
                    >
                      Start Investigation
                    </Button>
                  )}
                  {(selectedIncident.status === 'open' || selectedIncident.status === 'investigating') && (
                    <Button
                      variant="outline"
                      onClick={() => handleTransition(selectedIncident, 'resolved')}
                    >
                      Mark Resolved
                    </Button>
                  )}
                  {selectedIncident.status === 'resolved' && (
                    <Button onClick={() => handleTransition(selectedIncident, 'closed')}>
                      Close Incident
                    </Button>
                  )}
                  {selectedIncident.status === 'closed' && (
                    <Button
                      variant="outline"
                      onClick={() => handleTransition(selectedIncident, 'open')}
                    >
                      Reopen
                    </Button>
                  )}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
