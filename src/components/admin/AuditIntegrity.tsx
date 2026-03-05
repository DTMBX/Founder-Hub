/**
 * Audit Integrity - Verification and Reporting UI
 * 
 * Chain B6 - Incident Log + Tamper-Evident Audit
 * 
 * Features:
 * - Verify audit ledger integrity
 * - View hash chain status
 * - Export integrity reports
 * - View checkpoints
 * - Browse audit entries
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  ShieldCheck, ShieldWarning, CheckCircle, XCircle, 
  ArrowClockwise, Export, MagnifyingGlass, Link,
  Clock, Hash, List, FileText, Copy, Check
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  auditLedger,
  type AuditEntry,
  type AuditCheckpoint,
  type AuditIntegrityResult,
  type AuditIntegrityReport,
  type AuditCategory,
  type AuditSeverity
} from '@/lib/audit-ledger'

// ─── Constants ───────────────────────────────────────────────

const CATEGORY_COLORS: Record<AuditCategory, string> = {
  security: 'bg-red-100 text-red-700',
  access: 'bg-blue-100 text-blue-700',
  authentication: 'bg-purple-100 text-purple-700',
  authorization: 'bg-indigo-100 text-indigo-700',
  data: 'bg-green-100 text-green-700',
  configuration: 'bg-yellow-100 text-yellow-700',
  deployment: 'bg-orange-100 text-orange-700',
  incident: 'bg-pink-100 text-pink-700',
  system: 'bg-gray-100 text-gray-700',
  policy: 'bg-cyan-100 text-cyan-700'
}

const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
}

// ─── Component ───────────────────────────────────────────────

export default function AuditIntegrity() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [checkpoints, setCheckpoints] = useState<AuditCheckpoint[]>([])
  const [integrityResult, setIntegrityResult] = useState<AuditIntegrityResult | null>(null)
  const [report, setReport] = useState<AuditIntegrityReport | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  
  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])
  
  async function loadData() {
    await auditLedger.initialize()
    setEntries(auditLedger.getEntries())
    setCheckpoints(auditLedger.getCheckpoints())
  }
  
  async function handleVerify() {
    setIsVerifying(true)
    try {
      const result = await auditLedger.verify()
      setIntegrityResult(result)
      if (result.valid) {
        toast.success('Audit ledger integrity verified')
      } else {
        toast.error(`Integrity check failed: ${result.invalidEntries} invalid entries`)
      }
    } catch (error) {
      toast.error('Verification failed')
      console.error(error)
    } finally {
      setIsVerifying(false)
    }
  }
  
  async function handleGenerateReport() {
    setIsGeneratingReport(true)
    try {
      const reportData = await auditLedger.generateReport()
      setReport(reportData)
      setIntegrityResult(reportData.integrity)
      toast.success('Report generated')
    } catch (error) {
      toast.error('Report generation failed')
      console.error(error)
    } finally {
      setIsGeneratingReport(false)
    }
  }
  
  async function handleExport() {
    try {
      const exportData = await auditLedger.export({ includeIntegrity: true })
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Audit log exported')
    } catch (error) {
      toast.error('Export failed')
      console.error(error)
    }
  }
  
  async function handleExportReport() {
    if (!report) {
      toast.error('Generate a report first')
      return
    }
    
    try {
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-integrity-report-${report.reportId}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Report exported')
    } catch (error) {
      toast.error('Export failed')
      console.error(error)
    }
  }
  
  function copyHash(hash: string) {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    setTimeout(() => setCopiedHash(null), 2000)
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
  
  function truncateHash(hash: string): string {
    if (hash.length <= 16) return hash
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`
  }
  
  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (searchTerm && !entry.event.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !entry.event.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (categoryFilter !== 'all' && entry.event.category !== categoryFilter) {
      return false
    }
    if (severityFilter !== 'all' && entry.event.severity !== severityFilter) {
      return false
    }
    return true
  }).sort((a, b) => b.sequence - a.sequence)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Audit Integrity</h2>
          <p className="text-sm text-muted-foreground">
            Verify tamper-evident audit ledger and export integrity reports
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleVerify} disabled={isVerifying}>
            <ArrowClockwise className={`mr-2 h-4 w-4 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying...' : 'Verify Integrity'}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Export className="mr-2 h-4 w-4" />
            Export Log
          </Button>
        </div>
      </div>
      
      {/* Integrity Status */}
      <Card className={integrityResult ? (integrityResult.valid ? 'border-green-500' : 'border-red-500') : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {integrityResult ? (
              integrityResult.valid ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  Integrity Verified
                </>
              ) : (
                <>
                  <ShieldWarning className="h-5 w-5 text-red-500" />
                  Integrity Compromised
                </>
              )
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                Integrity Status
              </>
            )}
          </CardTitle>
          <CardDescription>
            Hash-chained audit entries with tamper detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {integrityResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Entries Verified</p>
                  <p className="text-2xl font-bold">{integrityResult.entriesVerified}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valid</p>
                  <p className="text-2xl font-bold text-green-600">{integrityResult.validEntries}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Invalid</p>
                  <p className="text-2xl font-bold text-red-600">{integrityResult.invalidEntries}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Checkpoints</p>
                  <p className="text-2xl font-bold">{integrityResult.checkpointsVerified}</p>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Chain Hash</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                    {integrityResult.currentChainHash}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyHash(integrityResult.currentChainHash)}
                  >
                    {copiedHash === integrityResult.currentChainHash ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Verified at {formatDate(integrityResult.verifiedAt)}
              </div>
              
              {integrityResult.errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-700 mb-2">Integrity Errors</h4>
                  <div className="space-y-2">
                    {integrityResult.errors.slice(0, 5).map((error, i) => (
                      <div key={i} className="text-sm text-red-600">
                        <span className="font-mono">Seq #{error.sequence}</span>: {error.type} mismatch
                      </div>
                    ))}
                    {integrityResult.errors.length > 5 && (
                      <p className="text-sm text-red-500">
                        ...and {integrityResult.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Click "Verify Integrity" to check the audit ledger</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Integrity Report
          </CardTitle>
          <CardDescription>
            Generate and export a comprehensive audit integrity report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Button 
              onClick={handleGenerateReport} 
              disabled={isGeneratingReport}
              className="flex-1"
            >
              {isGeneratingReport ? 'Generating...' : 'Generate Report'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportReport}
              disabled={!report}
              className="flex-1"
            >
              <Export className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
          
          {report && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Report ID</p>
                  <p className="font-mono text-xs">{truncateHash(report.reportId)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Generated</p>
                  <p>{formatDate(report.generatedAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Entries</p>
                  <p className="font-bold">{report.statistics.totalEntries}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={report.integrity.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                    {report.integrity.valid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Tabs for Entries and Checkpoints */}
      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Entries ({entries.length})
          </TabsTrigger>
          <TabsTrigger value="checkpoints" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Checkpoints ({checkpoints.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="authentication">Authentication</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="configuration">Configuration</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {filteredEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <List className="h-12 w-12 mb-2" />
                    <p>No entries found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEntries.slice(0, 100).map((entry) => (
                      <div
                        key={entry.sequence}
                        className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-muted-foreground">
                                #{entry.sequence}
                              </span>
                              <Badge className={`text-xs ${CATEGORY_COLORS[entry.event.category]}`}>
                                {entry.event.category}
                              </Badge>
                              <Badge className={`text-xs ${SEVERITY_COLORS[entry.event.severity]}`}>
                                {entry.event.severity}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm">{entry.event.action}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {entry.event.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(entry.timestamp)}
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <Hash className="h-3 w-3" />
                                {truncateHash(entry.eventHash)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredEntries.length > 100 && (
                      <p className="text-center text-sm text-muted-foreground py-4">
                        Showing 100 of {filteredEntries.length} entries
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="checkpoints" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <ScrollArea className="h-[400px]">
                {checkpoints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Link className="h-12 w-12 mb-2" />
                    <p>No checkpoints yet</p>
                    <p className="text-sm">Checkpoints are created every 100 entries</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...checkpoints].reverse().map((checkpoint) => (
                      <div
                        key={checkpoint.sequence}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Checkpoint #{checkpoint.sequence}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {checkpoint.entryCount} entries
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(checkpoint.timestamp)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Last Entry Sequence</p>
                            <p className="font-mono text-sm">#{checkpoint.lastEntrySequence}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Chain Hash</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                                {checkpoint.chainHash}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyHash(checkpoint.chainHash)}
                              >
                                {copiedHash === checkpoint.chainHash ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
