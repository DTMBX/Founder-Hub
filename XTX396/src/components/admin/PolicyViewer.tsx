/**
 * Policy Viewer - Read-only Policy Display
 * 
 * Chain B8 - Runtime Policy Engine
 * 
 * Shows:
 * - Allowed/forbidden commands
 * - Allowed/forbidden paths
 * - Action approval requirements
 * - Rate limits
 * - Execution constraints
 */

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Terminal,
  FolderOpen,
  Lock,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Eye,
  Play,
  RefreshCw,
  Info
} from 'lucide-react'
import { policyEngine, evaluateCommand, type PolicyDecision } from '@/lib/policy-engine'
import { cn } from '@/lib/utils'

interface PolicyViewerProps {
  userRole: 'owner' | 'admin' | 'editor' | 'support' | 'viewer'
  userId: string
}

export function PolicyViewer({ userRole, userId }: PolicyViewerProps) {
  const [activeSection, setActiveSection] = useState<string>('commands')
  const [testCommand, setTestCommand] = useState('')
  const [testResult, setTestResult] = useState<PolicyDecision | null>(null)
  const [dryRunMode, setDryRunMode] = useState(policyEngine.isDryRunEnabled())
  
  const policy = policyEngine.getPolicy()
  const summary = policyEngine.getPolicySummary()
  
  const handleTestCommand = async () => {
    if (!testCommand.trim()) return
    
    const result = await evaluateCommand(
      testCommand,
      userId,
      userRole,
      { dryRun: true }
    )
    setTestResult(result)
  }
  
  const handleToggleDryRun = () => {
    const newValue = !dryRunMode
    policyEngine.setDryRunMode(newValue)
    setDryRunMode(newValue)
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Runtime Policy</h2>
            <p className="text-sm text-slate-500">
              Version {summary.version} • Updated {new Date(summary.lastUpdated).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Dry Run Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleDryRun}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
              dryRunMode 
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            )}
          >
            <Eye className="h-4 w-4" />
            Dry Run: {dryRunMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-slate-700">Allowed Commands</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{summary.allowedCommandCount}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-slate-700">Forbidden Commands</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{summary.forbiddenCommandCount}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">Owner-Only Actions</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{summary.ownerApprovalActions.length}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-slate-700">Step-Up Auth Actions</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{summary.stepUpAuthActions.length}</p>
        </div>
      </div>
      
      {/* Command Tester */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Play className="h-4 w-4 text-slate-600" />
          <span className="font-medium text-slate-700">Test Command</span>
          <span className="text-xs text-slate-500 ml-auto">
            Evaluates without executing (always dry run)
          </span>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={testCommand}
            onChange={(e) => setTestCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTestCommand()}
            placeholder="Enter a command to test (e.g., git status, npm run build)"
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleTestCommand}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Evaluate
          </button>
        </div>
        
        {testResult && (
          <div className={cn(
            "mt-3 p-3 rounded-md",
            testResult.allowed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {testResult.allowed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Allowed</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Denied</span>
                </>
              )}
              <span className={cn(
                "ml-2 px-2 py-0.5 text-xs rounded-full",
                testResult.riskLevel === 'low' && "bg-green-100 text-green-700",
                testResult.riskLevel === 'medium' && "bg-yellow-100 text-yellow-700",
                testResult.riskLevel === 'high' && "bg-orange-100 text-orange-700",
                testResult.riskLevel === 'critical' && "bg-red-100 text-red-700"
              )}>
                {testResult.riskLevel} risk
              </span>
            </div>
            
            {!testResult.allowed && testResult.reasons.length > 0 && (
              <div className="text-sm text-red-700 space-y-1">
                {testResult.reasons.map((reason, i) => (
                  <p key={i}>
                    <code className="font-mono text-xs bg-red-100 px-1 rounded">{reason.code}</code>
                    {' '}{reason.message}
                  </p>
                ))}
              </div>
            )}
            
            {testResult.requiredApprovals.length > 0 && (
              <div className="mt-2 text-sm">
                <span className="font-medium">Required approvals:</span>
                <ul className="list-disc list-inside text-slate-600">
                  {testResult.requiredApprovals.map((approval, i) => (
                    <li key={i} className={approval.satisfied ? "text-green-600" : "text-amber-600"}>
                      {approval.type}: {approval.description}
                      {approval.satisfied && " ✓"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Section Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {[
          { id: 'commands', label: 'Commands', icon: Terminal },
          { id: 'paths', label: 'Paths', icon: FolderOpen },
          { id: 'actions', label: 'Actions', icon: Lock },
          { id: 'limits', label: 'Rate Limits', icon: Clock },
          { id: 'roles', label: 'Roles', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeSection === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Section Content */}
      <div className="bg-white rounded-lg border border-slate-200">
        {activeSection === 'commands' && (
          <CommandsSection policy={policy} />
        )}
        {activeSection === 'paths' && (
          <PathsSection policy={policy} />
        )}
        {activeSection === 'actions' && (
          <ActionsSection policy={policy} />
        )}
        {activeSection === 'limits' && (
          <RateLimitsSection policy={policy} />
        )}
        {activeSection === 'roles' && (
          <RolesSection policy={policy} userRole={userRole} />
        )}
      </div>
      
      {/* Policy Change Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Policy Changes Require Owner Approval</p>
            <p className="text-sm text-amber-700 mt-1">
              Modifications to the runtime policy require owner role and step-up authentication. 
              All policy changes are logged to the audit ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Section Components ──────────────────────────────────────

function CommandsSection({ policy }: { policy: any }) {
  const [showAllowed, setShowAllowed] = useState(true)
  const [showForbidden, setShowForbidden] = useState(true)
  
  return (
    <div className="divide-y divide-slate-200">
      {/* Allowed Commands */}
      <div>
        <button
          onClick={() => setShowAllowed(!showAllowed)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium text-slate-900">Allowed Commands</span>
            <span className="text-sm text-slate-500">({policy.commands.allowed.length})</span>
          </div>
          {showAllowed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        
        {showAllowed && (
          <div className="px-4 pb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 font-medium">Pattern</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Risk</th>
                  <th className="pb-2 font-medium">Required Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policy.commands.allowed.map((cmd: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2">
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        {cmd.pattern}
                      </code>
                    </td>
                    <td className="py-2 text-slate-600">{cmd.description}</td>
                    <td className="py-2">
                      <RiskBadge level={cmd.riskLevel} />
                    </td>
                    <td className="py-2 text-slate-600">{cmd.requiresRole || 'Any'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Forbidden Commands */}
      <div>
        <button
          onClick={() => setShowForbidden(!showForbidden)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-slate-900">Forbidden Commands</span>
            <span className="text-sm text-slate-500">({policy.commands.forbidden.length})</span>
          </div>
          {showForbidden ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        
        {showForbidden && (
          <div className="px-4 pb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2 font-medium">Pattern</th>
                  <th className="pb-2 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policy.commands.forbidden.map((cmd: any, i: number) => (
                  <tr key={i}>
                    <td className="py-2">
                      <code className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono">
                        {cmd.pattern}
                      </code>
                    </td>
                    <td className="py-2 text-slate-600">{cmd.reason}</td>
                    <td className="py-2">
                      <RiskBadge level={cmd.riskLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function PathsSection({ policy }: { policy: any }) {
  const [showAllowed, setShowAllowed] = useState(true)
  const [showForbidden, setShowForbidden] = useState(true)
  
  return (
    <div className="divide-y divide-slate-200">
      {/* Allowed Paths */}
      <div>
        <button
          onClick={() => setShowAllowed(!showAllowed)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium text-slate-900">Allowed Paths</span>
            <span className="text-sm text-slate-500">({policy.paths.allowed.length})</span>
          </div>
          {showAllowed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        
        {showAllowed && (
          <div className="px-4 pb-4 space-y-2">
            {policy.paths.allowed.map((path: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <code className="bg-slate-100 px-2 py-1 rounded font-mono text-xs">
                    {path.pattern}
                  </code>
                  <span className="text-slate-600">{path.description}</span>
                </div>
                {path.requiresRole && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    Requires: {path.requiresRole}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Forbidden Paths */}
      <div>
        <button
          onClick={() => setShowForbidden(!showForbidden)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-slate-900">Forbidden Paths</span>
            <span className="text-sm text-slate-500">({policy.paths.forbidden.length})</span>
          </div>
          {showForbidden ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        
        {showForbidden && (
          <div className="px-4 pb-4 space-y-2">
            {policy.paths.forbidden.map((path: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <code className="bg-red-50 text-red-700 px-2 py-1 rounded font-mono text-xs">
                  {path.pattern}
                </code>
                <span className="text-slate-600">{path.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionsSection({ policy }: { policy: any }) {
  return (
    <div className="divide-y divide-slate-200">
      {/* Owner Approval Required */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-5 w-5 text-red-500" />
          <span className="font-medium text-slate-900">Owner Approval Required</span>
        </div>
        <div className="space-y-2">
          {policy.actions.requiresOwnerApproval.map((action: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <code className="bg-red-50 text-red-700 px-2 py-1 rounded font-mono text-xs">
                {action.action}
              </code>
              <span className="text-slate-600">{action.description}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Admin Approval Required */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="h-5 w-5 text-amber-500" />
          <span className="font-medium text-slate-900">Admin Approval Required</span>
        </div>
        <div className="space-y-2">
          {policy.actions.requiresAdminApproval.map((action: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <code className="bg-amber-50 text-amber-700 px-2 py-1 rounded font-mono text-xs">
                {action.action}
              </code>
              <span className="text-slate-600">{action.description}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Step-Up Auth Required */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-slate-900">Step-Up Authentication Required</span>
        </div>
        <div className="space-y-2">
          {policy.actions.requiresStepUpAuth.map((action: any, i: number) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <code className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono text-xs">
                {action.action}
              </code>
              <span className="text-slate-500">Valid for {action.validityMinutes} minutes</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RateLimitsSection({ policy }: { policy: any }) {
  return (
    <div className="p-4 space-y-6">
      {/* Terminal Rate Limits */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="h-5 w-5 text-slate-600" />
          <span className="font-medium text-slate-900">Terminal Commands</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Per Minute</p>
            <p className="text-lg font-semibold text-slate-900">
              {policy.rateLimits.terminal.maxCommandsPerMinute}
            </p>
          </div>
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Per Hour</p>
            <p className="text-lg font-semibold text-slate-900">
              {policy.rateLimits.terminal.maxCommandsPerHour}
            </p>
          </div>
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Cooldown After Denial</p>
            <p className="text-lg font-semibold text-slate-900">
              {policy.rateLimits.terminal.cooldownAfterDenialSeconds}s
            </p>
          </div>
        </div>
      </div>
      
      {/* Assistant Rate Limits */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-slate-600" />
          <span className="font-medium text-slate-900">Assistant Tool Calls</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Per Minute</p>
            <p className="text-lg font-semibold text-slate-900">
              {policy.rateLimits.assistant.maxToolCallsPerMinute}
            </p>
          </div>
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Per Hour</p>
            <p className="text-lg font-semibold text-slate-900">
              {policy.rateLimits.assistant.maxToolCallsPerHour}
            </p>
          </div>
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Cooldown After Denial</p>
            <p className="text-lg font-semibold text-slate-900">
              {policy.rateLimits.assistant.cooldownAfterDenialSeconds}s
            </p>
          </div>
        </div>
      </div>
      
      {/* Execution Limits */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-5 w-5 text-slate-600" />
          <span className="font-medium text-slate-900">Execution Limits</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Default Timeout</p>
            <p className="text-lg font-semibold text-slate-900">
              {policy.execution.maxExecutionTimeMs.default / 1000}s
            </p>
          </div>
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Build Timeout</p>
            <p className="text-lg font-semibold text-slate-900">
              {policy.execution.maxExecutionTimeMs.build / 1000}s
            </p>
          </div>
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Test Timeout</p>
            <p className="text-lg font-semibold text-slate-900">
              {policy.execution.maxExecutionTimeMs.test / 1000}s
            </p>
          </div>
          <div className="bg-slate-50 rounded-md p-3">
            <p className="text-slate-500 mb-1">Max Output</p>
            <p className="text-lg font-semibold text-slate-900">
              {(policy.execution.outputLimits.maxOutputBytes / 1024 / 1024).toFixed(0)}MB
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RolesSection({ policy, userRole }: { policy: any; userRole: string }) {
  const roles = ['owner', 'admin', 'editor', 'support', 'viewer']
  
  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-200">
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Execute Commands</th>
              <th className="pb-3 font-medium">Modify Files</th>
              <th className="pb-3 font-medium">Approve Actions</th>
              <th className="pb-3 font-medium">View Audit</th>
              <th className="pb-3 font-medium">Modify Policy</th>
              <th className="pb-3 font-medium">Max Terminals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {roles.map(role => {
              const config = policy.roles[role]
              const isCurrentRole = role === userRole
              
              return (
                <tr key={role} className={isCurrentRole ? "bg-blue-50" : ""}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium capitalize",
                        isCurrentRole ? "text-blue-700" : "text-slate-900"
                      )}>
                        {role}
                      </span>
                      {isCurrentRole && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3">
                    <PermissionBadge allowed={resolvePermission(policy.roles, role, 'canExecuteCommands')} />
                  </td>
                  <td className="py-3">
                    <PermissionBadge allowed={resolvePermission(policy.roles, role, 'canModifyFiles')} />
                  </td>
                  <td className="py-3">
                    <PermissionBadge allowed={resolvePermission(policy.roles, role, 'canApproveActions')} />
                  </td>
                  <td className="py-3">
                    <PermissionBadge allowed={resolvePermission(policy.roles, role, 'canViewAuditLogs')} />
                  </td>
                  <td className="py-3">
                    <PermissionBadge allowed={config?.canModifyPolicy ?? false} />
                  </td>
                  <td className="py-3 text-slate-600">
                    {config?.maxConcurrentTerminals ?? 0}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Helper Components ───────────────────────────────────────

function RiskBadge({ level }: { level: string }) {
  return (
    <span className={cn(
      "px-2 py-0.5 text-xs rounded-full font-medium",
      level === 'low' && "bg-green-100 text-green-700",
      level === 'medium' && "bg-yellow-100 text-yellow-700",
      level === 'high' && "bg-orange-100 text-orange-700",
      level === 'critical' && "bg-red-100 text-red-700"
    )}>
      {level}
    </span>
  )
}

function PermissionBadge({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <CheckCircle2 className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-slate-300" />
  )
}

function resolvePermission(roles: any, role: string, permission: string): boolean {
  const config = roles[role]
  if (!config) return false
  
  if (permission in config) {
    return config[permission]
  }
  
  for (const inheritedRole of config.inherits ?? []) {
    const result = resolvePermission(roles, inheritedRole, permission)
    if (result) return true
  }
  
  return false
}

export default PolicyViewer
