import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { useInitializeDocumentTypes } from '@/lib/initialize-document-types'
import { downloadDataFiles, persistAllToFiles, isLocalhost } from '@/lib/local-storage-kv'
import { publishToGitHub, hasGitHubToken, type PublishMode } from '@/lib/github-sync'
import { useSite } from '@/lib/site-context'
import { toast } from 'sonner'
import { usePermissions, FOUNDER_MODE_ROUTES } from '@/lib/route-guards'
import { useFeatureFlags, activateFounderMode, activateOpsMode } from '@/lib/feature-flags'
import { useHistory, history as historyStore } from '@/lib/history-store'
import { useKeyboardShortcuts, type Shortcut } from '@/lib/keyboard-shortcuts'
import { useGlobalDirty } from '@/lib/editor-state'
import { useRecentItems } from '@/hooks/use-recent-items'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { WorkspaceSiteProvider, useWorkspaceSite } from '@/lib/workspace-site'
import { setSafetySnapshotSiteScope } from '@/lib/snapshot-guardrails'
import MigrationBanner from './MigrationBanner'
import { useRouteLeaveGuard } from './RouteLeaveGuard'
import {
  SignOut, Article, FolderOpen, Scales, FilePdf, CloudArrowUp, 
  MagnifyingGlass, Palette, ClockCounterClockwise, Gear, Stack, 
  Certificate, ClipboardText, Tray, ShieldCheck, VideoCamera, 
  Image, Flag, Sparkle, ArrowLeft, CaretRight, House, Briefcase,
  UserCircle, LinkSimple, IdentificationBadge, FlagBanner, Export, GithubLogo, ShoppingBag, TrendUp, TreeStructure, Globe,
  Buildings, Storefront, Kanban, UsersFour, CircleNotch, List, X, Rocket,
  Warning, Link, DeviceMobile, Scroll, MagicWand, Star, StarHalf, FloppyDisk,
  HardDrive, Terminal
} from '@phosphor-icons/react'
import SitePicker from './SitePicker'
import SidebarNav from './SidebarNav'
import CommandPalette from './CommandPalette'
import WorkspaceSiteSwitcher from './WorkspaceSiteSwitcher'
import KeyboardShortcutsDialog from './KeyboardShortcutsDialog'
import { useClientSites } from '@/hooks/use-client-sites'
import { cn } from '@/lib/utils'

// Lazy-load all admin modules for code splitting
const ContentManager = lazy(() => import('./ContentManager'))
const EnhancedProjectsManager = lazy(() => import('./EnhancedProjectsManager'))
const EnhancedCourtManager = lazy(() => import('./EnhancedCourtManager'))
const DocumentsManager = lazy(() => import('./DocumentsManager'))
const AdminInbox = lazy(() => import('./AdminInbox'))
const UploadQueueManager = lazy(() => import('./UploadQueueManager'))
const StagingReviewManager = lazy(() => import('./StagingReviewManager'))
const FilingTypesManager = lazy(() => import('./FilingTypesManager'))
const TemplatesManager = lazy(() => import('./TemplatesManager'))
const HeroMediaManager = lazy(() => import('./HeroMediaManager'))
const ThemeManager = lazy(() => import('./ThemeManager'))
const SettingsManager = lazy(() => import('./SettingsManager'))
const SecurityManager = lazy(() => import('./SecurityManager'))
const AuditLog = lazy(() => import('./AuditLog'))
const AssetScanner = lazy(() => import('./AssetScanner'))
const AssetUsagePolicyManager = lazy(() => import('./AssetUsagePolicyManager'))
const VisualModulesManager = lazy(() => import('./VisualModulesManager'))
const CaseJacketManager = lazy(() => import('./CaseJacketManager'))
const AboutManager = lazy(() => import('./AboutManager'))
const LinksManager = lazy(() => import('./LinksManager'))
const ProfileManager = lazy(() => import('./ProfileManager'))
const HonorFlagBarManager = lazy(() => import('./HonorFlagBarManager'))
const OfferingsManager = lazy(() => import('./OfferingsManager'))
const InvestorManager = lazy(() => import('./InvestorManager'))
const GovernancePanel = lazy(() => import('./GovernancePanel'))
const EvidentManager = lazy(() => import('./EvidentManager'))
const SitesManager = lazy(() => import('./SitesManager'))
const LawFirmShowcaseManager = lazy(() => import('./LawFirmShowcaseManager'))
const SMBTemplateManager = lazy(() => import('./SMBTemplateManager'))
const AgencyFrameworkManager = lazy(() => import('./AgencyFrameworkManager'))
const ClientSiteManager = lazy(() => import('./ClientSiteManager'))
const AdminLeadsViewer = lazy(() => import('@/leads').then(m => ({ default: m.AdminLeadsViewer })))
const DeploymentsPanel = lazy(() => import('./DeploymentsPanel'))
const ProvenancePanel = lazy(() => import('./ProvenancePanel'))
const IncidentDashboard = lazy(() => import('./IncidentDashboard'))
const AuditIntegrity = lazy(() => import('./AuditIntegrity'))
const SecuritySettings = lazy(() => import('./SecuritySettings'))
const PolicyViewer = lazy(() => import('./PolicyViewer'))
const StyleEditorManager = lazy(() => import('./StyleEditorManager'))
const DashboardOverview = lazy(() => import('./DashboardOverview'))
const EditorToolbar = lazy(() => import('./EditorToolbar'))
const PreviewPanel = lazy(() => import('./PreviewPanel'))
const HistoryTimeline = lazy(() => import('./HistoryTimeline'))
const WorkspaceManager = lazy(() => import('./WorkspaceManager'))
const DevToolsPanel = lazy(() => import('./DevToolsPanel'))

// Mobile Quick Actions (lazy-loaded for code splitting)
const MobileQuickActions = lazy(() => import('./MobileQuickActions'))

// Loading fallback for lazy-loaded modules
function ModuleLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <CircleNotch className="h-8 w-8 animate-spin" />
        <span className="text-sm">Loading module...</span>
      </div>
    </div>
  )
}

interface AdminDashboardProps {
  onExit: () => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; weight?: string }>
  category: string
}

const navItems: NavItem[] = [
  // Overview
  { id: 'overview', label: 'Dashboard', icon: House, category: 'Overview' },
  // Site Management
  { id: 'content', label: 'Content', icon: Article, category: 'Site Management' },
  { id: 'about', label: 'About & Updates', icon: UserCircle, category: 'Site Management' },
  { id: 'links', label: 'Navigation Links', icon: LinkSimple, category: 'Site Management' },
  { id: 'profile', label: 'Profile & Contacts', icon: IdentificationBadge, category: 'Site Management' },
  { id: 'hero-media', label: 'Hero Media', icon: VideoCamera, category: 'Site Management' },
  { id: 'visual-modules', label: 'Visual Modules', icon: Sparkle, category: 'Site Management' },
  { id: 'honor-flag-bar', label: 'Honor Flag Bar', icon: FlagBanner, category: 'Site Management' },
  // Investor Relations
  { id: 'investor', label: 'Investor Portal', icon: TrendUp, category: 'Investor Relations' },
  { id: 'offerings', label: 'Offerings Catalog', icon: ShoppingBag, category: 'Investor Relations' },
  // Platform
  { id: 'evident', label: 'Ecosystem Overview', icon: Globe, category: 'Platform' },
  { id: 'sites', label: 'Sites & Repositories', icon: TreeStructure, category: 'Platform' },
  { id: 'workspaces', label: 'Workspaces', icon: HardDrive, category: 'Platform' },
  // Client Frameworks
  { id: 'client-sites', label: 'Client Sites', icon: Globe, category: 'Client Frameworks' },
  { id: 'law-firm', label: 'Law Firm Template', icon: Buildings, category: 'Client Frameworks' },
  { id: 'smb-template', label: 'Small Business Template', icon: Storefront, category: 'Client Frameworks' },
  { id: 'agency', label: 'Agency Template', icon: Kanban, category: 'Client Frameworks' },
  // Case Management
  { id: 'projects', label: 'Projects', icon: FolderOpen, category: 'Case Management' },
  { id: 'court', label: 'Court Cases', icon: Scales, category: 'Case Management' },
  { id: 'documents', label: 'Documents', icon: FilePdf, category: 'Case Management' },
  { id: 'case-jackets', label: 'Case Jackets', icon: Briefcase, category: 'Case Management' },
  { id: 'filing-types', label: 'Filing Types', icon: Certificate, category: 'Case Management' },
  { id: 'templates', label: 'Templates', icon: ClipboardText, category: 'Case Management' },
  // Assets & Media
  { id: 'inbox', label: 'Inbox', icon: Tray, category: 'Assets & Media' },
  { id: 'upload', label: 'Upload Queue', icon: CloudArrowUp, category: 'Assets & Media' },
  { id: 'staging', label: 'Staging Review', icon: Stack, category: 'Assets & Media' },
  { id: 'assets', label: 'Asset Scanner', icon: Image, category: 'Assets & Media' },
  { id: 'asset-policy', label: 'Usage Policy', icon: Flag, category: 'Assets & Media' },
  // System & Security
  { id: 'governance', label: 'Content Governance', icon: ShieldCheck, category: 'System & Security' },
  { id: 'style-editor', label: 'Style Editor', icon: MagicWand, category: 'System & Security' },
  { id: 'theme', label: 'Theme', icon: Palette, category: 'System & Security' },
  { id: 'settings', label: 'Site Settings', icon: Gear, category: 'System & Security' },
  { id: 'security', label: 'Security', icon: ShieldCheck, category: 'System & Security' },
  { id: 'session-security', label: 'Sessions & Devices', icon: DeviceMobile, category: 'System & Security' },
  { id: 'runtime-policy', label: 'Runtime Policy', icon: Scroll, category: 'System & Security' },
  { id: 'deployments', label: 'Deployments', icon: Rocket, category: 'System & Security' },
  { id: 'provenance', label: 'Build Provenance', icon: Certificate, category: 'System & Security' },
  { id: 'incidents', label: 'Incidents', icon: Warning, category: 'System & Security' },
  { id: 'audit-integrity', label: 'Audit Integrity', icon: Link, category: 'System & Security' },
  { id: 'audit', label: 'Audit Log', icon: ClockCounterClockwise, category: 'System & Security' },
  { id: 'leads', label: 'Leads', icon: UsersFour, category: 'System & Security' },
  { id: 'devtools', label: 'Developer Tools', icon: Terminal, category: 'System & Security' },
]

const categories = ['Overview', 'Site Management', 'Investor Relations', 'Platform', 'Client Frameworks', 'Case Management', 'Assets & Media', 'System & Security']

/**
 * Syncs the active workspace site to history-store and snapshot-guardrails.
 * Must be rendered inside WorkspaceSiteProvider.
 */
function WorkspaceSiteSync() {
  const { activeSite } = useWorkspaceSite()

  useEffect(() => {
    historyStore.setSiteScope(activeSite.siteId)
    setSafetySnapshotSiteScope(activeSite.siteId)
  }, [activeSite.siteId])

  return null
}

export default function AdminDashboard({ onExit }: AdminDashboardProps) {
  const { logout, currentUser } = useAuth()
  const { activeSite, activeSatellite } = useSite()
  const [activeTab, setActiveTab] = useState(() => {
    // Pick up tab from DevToolbar quick nav
    const devTab = sessionStorage.getItem('dev-admin-tab')
    if (devTab) {
      sessionStorage.removeItem('dev-admin-tab')
      return devTab
    }
    return 'overview'
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [publishMessage, setPublishMessage] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { activeSite: activeClientSite, activeSiteId: activeClientSiteId, sites: clientSites, setActiveSiteId: setActiveClientSiteId } = useClientSites()
  
  // RBAC & Feature Flags
  const permissions = usePermissions()
  const { flags } = useFeatureFlags()
  
  // Phase A: Edit/Preview Integrity
  const historyState = useHistory()
  const { isDirty: globalDirty, dirtyKeys } = useGlobalDirty()
  const { recentItems, favorites, trackVisit, toggleFavorite, isFavorite } = useRecentItems()

  // Route leave protection — warns before navigating away with unsaved changes
  const { guardedNavigate, GuardDialog } = useRouteLeaveGuard({
    isDirty: globalDirty,
    dirtyModules: dirtyKeys.map(k => k.replace('founder-hub-', '')),
  })

  // Service-level route guard for tab switching (with dirty-state protection)
  const directSetActiveTab = useCallback((tabId: string) => {
    if (!permissions.canAccessRouteInCurrentMode(tabId)) {
      toast.error('You do not have permission to access that section')
      return
    }
    // Track visit for recents
    const item = navItems.find(n => n.id === tabId)
    if (item) trackVisit(tabId, item.label, item.category)
    setActiveTab(tabId)
  }, [permissions, trackVisit])

  const guardedSetActiveTab = useCallback((tabId: string) => {
    guardedNavigate(tabId, directSetActiveTab)
  }, [guardedNavigate, directSetActiveTab])
  
  // Filter nav items based on role and mode
  const filteredNavItems = useMemo(() => {
    return permissions.filterNavItems(navItems)
  }, [permissions])
  
  // Filter categories that have visible items
  const visibleCategories = useMemo(() => {
    return categories.filter(category =>
      filteredNavItems.some(item => item.category === category)
    )
  }, [filteredNavItems])
  
  // Check action permissions
  const canPublish = permissions.canExecuteAction('publish')
  const canExport = permissions.canExecuteAction('export-data')
  
  useInitializeDocumentTypes()

  // Save handler — writes all KV data to disk via workspace API (localhost) or falls back to download
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      if (isLocalhost()) {
        const result = await persistAllToFiles()
        if (result.failed.length === 0) {
          toast.success(`Saved ${result.succeeded} file${result.succeeded !== 1 ? 's' : ''} to disk`)
        } else {
          toast.warning(`Saved ${result.succeeded} files, ${result.failed.length} failed`)
        }
      } else {
        downloadDataFiles()
        toast.success('Data files downloaded — copy to public/data/ and commit to deploy.')
      }
    } catch {
      toast.error('Save failed')
    } finally {
      setIsSaving(false)
    }
  }, [])

  // Global keyboard shortcuts
  const shortcuts = useMemo<Shortcut[]>(() => [
    { key: 's', ctrl: true, label: 'Save', category: 'File', action: handleSave },
    { key: 'z', ctrl: true, label: 'Undo', category: 'Edit', action: () => {
      const entry = historyStore.undo()
      if (entry) toast.info(`Undone: ${entry.label}`)
    }},
    { key: 'z', ctrl: true, shift: true, label: 'Redo', category: 'Edit', action: () => {
      const entry = historyStore.redo()
      if (entry) toast.info(`Redone: ${entry.label}`)
    }},
    { key: 'p', ctrl: true, shift: true, label: 'Toggle Preview', category: 'View', action: () => setPreviewOpen(p => !p) },
    { key: 'h', ctrl: true, shift: true, label: 'Toggle History', category: 'View', action: () => setHistoryOpen(h => !h) },
    { key: '?', label: 'Keyboard Shortcuts', category: 'Help', action: () => setShortcutsOpen(s => !s) },
  ], [handleSave])

  useKeyboardShortcuts(shortcuts, { allowInInputs: true })

  const handleLogout = async () => {
    await logout()
    onExit()
  }

  const handlePublish = async () => {
    // RBAC check at service level
    if (!canPublish) {
      toast.error('You do not have permission to publish')
      return
    }
    
    if (!(await hasGitHubToken())) {
      toast.error('Configure GitHub token in Settings first')
      setActiveTab('settings')
      return
    }
    
    if (!activeSite) {
      toast.error('No site selected')
      return
    }

    // Require confirmation before publishing (Chain A4)
    setShowPublishConfirm(true)
  }

  const executePublish = async (mode: PublishMode = 'branch', customMessage?: string) => {
    if (!activeSite) return
    
    setShowPublishConfirm(false)
    setIsPublishing(true)
    
    // Build site config for the active site/satellite
    const [owner, repo] = activeSite.repo.split('/')
    const dataPath = activeSatellite 
      ? `${activeSatellite.path}${activeSatellite.dataPath}`
      : activeSite.dataPath
    const siteId = activeSatellite?.id || activeSite.id
    
    const result = await publishToGitHub({
      owner,
      repo,
      dataPath,
      siteId
    }, mode, customMessage || undefined)
    setIsPublishing(false)
    
    if (result.success) {
      // Show warning if PR creation failed (branch still pushed)
      if (result.warning) {
        toast.warning(result.warning, { duration: 8000 })
      }

      if (result.mode === 'branch' && result.pullRequestUrl) {
        toast.success(
          `Changes pushed to branch "${result.branch}". PR created for review.`,
          { duration: 8000 }
        )
      } else if (result.mode === 'branch') {
        toast.success(
          `Changes pushed to branch "${result.branch}". Merge to publish.`,
          { duration: 6000 }
        )
      } else {
        toast.success(`Published to ${activeSatellite?.name || activeSite.name}!`)
      }
    } else {
      toast.error(result.error || 'Failed to publish')
    }
  }

  const activeItem = navItems.find(item => item.id === activeTab)

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <DashboardOverview onNavigate={guardedSetActiveTab} />
      case 'content': return <ContentManager />
      case 'about': return <AboutManager />
      case 'links': return <LinksManager />
      case 'profile': return <ProfileManager />
      case 'honor-flag-bar': return <HonorFlagBarManager />
      case 'offerings': return <OfferingsManager />
      case 'investor': return <InvestorManager />
      case 'projects': return <EnhancedProjectsManager />
      case 'court': return <EnhancedCourtManager />
      case 'inbox': return <AdminInbox />
      case 'documents': return <DocumentsManager />
      case 'case-jackets': return <CaseJacketManager />
      case 'upload': return <UploadQueueManager />
      case 'staging': return <StagingReviewManager />
      case 'filing-types': return <FilingTypesManager />
      case 'templates': return <TemplatesManager />
      case 'hero-media': return <HeroMediaManager />
      case 'assets': return <AssetScanner />
      case 'asset-policy': return <AssetUsagePolicyManager />
      case 'visual-modules': return <VisualModulesManager />
      case 'evident': return <EvidentManager />
      case 'sites': return <SitesManager />
      case 'workspaces': return <WorkspaceManager />
      case 'devtools': return <DevToolsPanel />
      case 'law-firm': return <LawFirmShowcaseManager siteId={activeClientSite?.type === 'law-firm' ? activeClientSiteId ?? undefined : undefined} />
      case 'smb-template': return <SMBTemplateManager siteId={activeClientSite?.type === 'small-business' ? activeClientSiteId ?? undefined : undefined} />
      case 'agency': return <AgencyFrameworkManager siteId={activeClientSite?.type === 'agency' ? activeClientSiteId ?? undefined : undefined} />
      case 'client-sites': return <ClientSiteManager onNavigateToSite={(siteId, siteType) => {
        setActiveClientSiteId(siteId)
        const tabMap: Record<string, string> = { 'law-firm': 'law-firm', 'small-business': 'smb-template', agency: 'agency' }
        guardedSetActiveTab(tabMap[siteType] ?? 'client-sites')
      }} />
      case 'governance': return <GovernancePanel />
      case 'style-editor': return <StyleEditorManager />
      case 'theme': return <ThemeManager />
      case 'settings': return <SettingsManager />
      case 'security': return <SecurityManager />
      case 'session-security': return <SecuritySettings userId={currentUser?.id ?? 'unknown'} userRole={(currentUser?.role as any) ?? 'viewer'} />
      case 'runtime-policy': return <PolicyViewer userId={currentUser?.id ?? 'unknown'} userRole={(currentUser?.role as any) ?? 'viewer'} />
      case 'deployments': return <DeploymentsPanel siteId={activeSite?.id || 'founder-hub'} />
      case 'provenance': return <ProvenancePanel />
      case 'incidents': return <IncidentDashboard />
      case 'audit-integrity': return <AuditIntegrity />
      case 'audit': return <AuditLog />
      case 'leads': return <AdminLeadsViewer />
      default: return <DashboardOverview onNavigate={guardedSetActiveTab} />
    }
  }

  return (
    <WorkspaceSiteProvider>
    <WorkspaceSiteSync />
    <div className="min-h-screen bg-background flex" style={{ paddingTop: 'var(--honor-bar-height, 64px)' }}>
      {/* Sidebar — hidden on mobile, quick actions bar used instead */}
      <aside className={cn(
        'hidden lg:flex sticky h-screen border-r border-border/50 bg-card/50 backdrop-blur-sm flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )} style={{ top: 'var(--honor-bar-height, 64px)', height: 'calc(100vh - var(--honor-bar-height, 64px))' }}>
        {/* Sidebar header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight truncate">Control Center</h1>
                  <Badge variant={permissions.isFounderMode ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                    {permissions.isFounderMode ? 'FOUNDER' : 'OPS'}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {currentUser?.email} • {permissions.role}
                </p>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 shrink-0"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <CaretRight className={cn('h-4 w-4 transition-transform', sidebarCollapsed ? '' : 'rotate-180')} />
            </Button>
          </div>
        </div>

        {/* Site Picker */}
        <div className="p-2 border-b border-border/50 space-y-1">
          <WorkspaceSiteSwitcher />
          <SitePicker collapsed={sidebarCollapsed} />
        </div>

        {/* Nav items */}
        <SidebarNav
          items={filteredNavItems}
          categories={visibleCategories}
          activeTab={activeTab}
          collapsed={sidebarCollapsed}
          onSelect={guardedSetActiveTab}
        />

        {/* Mode Toggle */}
        {!sidebarCollapsed && (
          <div className="px-3 py-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => permissions.isFounderMode ? activateOpsMode() : activateFounderMode()}
              className="w-full text-xs justify-start gap-2"
            >
              {permissions.isFounderMode ? '↑ Switch to Ops Mode' : '↓ Switch to Founder Mode'}
            </Button>
          </div>
        )}

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border/50 space-y-1.5">
          {canPublish && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={handlePublish}
              disabled={isPublishing}
              className={cn('w-full gap-2 text-xs', sidebarCollapsed ? 'px-0 justify-center' : 'justify-start')}
            >
              <GithubLogo className="h-4 w-4 shrink-0" weight={isPublishing ? 'light' : 'bold'} />
              {!sidebarCollapsed && (isPublishing ? 'Publishing...' : 'Publish Changes')}
            </Button>
          )}
          {canExport && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSave}
                disabled={isSaving}
                className={cn('w-full gap-2 text-xs border-blue-500/30 text-blue-500 hover:bg-blue-500/10', sidebarCollapsed ? 'px-0 justify-center' : 'justify-start')}
              >
                <FloppyDisk className="h-4 w-4 shrink-0" weight={isSaving ? 'light' : 'bold'} />
                {!sidebarCollapsed && (isSaving ? 'Saving...' : 'Save to Files')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  downloadDataFiles()
                  toast.success('Data files downloaded!')
                }}
                className={cn('w-full gap-2 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10', sidebarCollapsed ? 'px-0 justify-center' : 'justify-start')}
              >
                <Export className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && 'Export Data'}
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onExit}
            className={cn('w-full gap-2 text-xs', sidebarCollapsed ? 'px-0 justify-center' : 'justify-start')}
          >
            <House className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && 'Public Site'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className={cn('w-full gap-2 text-xs text-muted-foreground', sidebarCollapsed ? 'px-0 justify-center' : 'justify-start')}
          >
            <SignOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar drawer overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-card border-r border-border shadow-xl flex flex-col">
            {/* Mobile sidebar header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight truncate">Control Center</h1>
                  <Badge variant={permissions.isFounderMode ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0">
                    {permissions.isFounderMode ? 'FOUNDER' : 'OPS'}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {currentUser?.email} • {permissions.role}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Mobile nav items */}
            <SidebarNav
              items={filteredNavItems}
              categories={visibleCategories}
              activeTab={activeTab}
              onSelect={(tabId) => { guardedSetActiveTab(tabId); setMobileSidebarOpen(false) }}
            />
            {/* Mobile sidebar footer */}
            <div className="p-3 border-t border-border/50 space-y-1.5">
              <Button variant="ghost" size="sm" onClick={() => { onExit(); setMobileSidebarOpen(false) }} className="w-full gap-2 text-xs justify-start">
                <House className="h-4 w-4 shrink-0" /> Public Site
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full gap-2 text-xs text-muted-foreground justify-start">
                <SignOut className="h-4 w-4 shrink-0" /> Logout
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content + optional side panels */}
      <main className="flex-1 min-w-0 flex">
        {/* Editor content area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <header className="sticky z-30 border-b border-border/50 bg-background/90 backdrop-blur-xl" style={{ top: 'var(--honor-bar-height, 64px)' }}>
            <div className="flex items-center justify-between h-14 px-4 lg:px-6">
              <div className="flex items-center gap-3">
                {/* Mobile menu toggle */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="lg:hidden h-8 w-8"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <List className="h-5 w-5" />
                </Button>
                {activeItem && (
                  <div className="flex items-center gap-2 min-w-0">
                    <activeItem.icon className="h-5 w-5 text-primary shrink-0" weight="duotone" />
                    <div className="flex items-center gap-1.5 min-w-0">
                      {activeItem.category !== 'Overview' && (
                        <>
                          <span className="text-xs text-muted-foreground hidden sm:inline">{activeItem.category}</span>
                          <CaretRight className="h-3 w-3 text-muted-foreground/50 shrink-0 hidden sm:inline" />
                        </>
                      )}
                      <h2 className="text-base font-semibold truncate">{activeItem.label}</h2>
                    </div>
                    {/* Favorite toggle */}
                    {activeItem.id !== 'overview' && (
                      <button
                        onClick={() => toggleFavorite(activeItem.id)}
                        className="text-muted-foreground hover:text-amber-500 transition-colors"
                        title={isFavorite(activeItem.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className="h-3.5 w-3.5" weight={isFavorite(activeItem.id) ? 'fill' : 'regular'} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                  className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-md border border-border/50 bg-muted/30 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <MagnifyingGlass className="h-3.5 w-3.5" />
                  <span>Search...</span>
                  <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    Ctrl K
                  </kbd>
                </button>
                <Button variant="outline" size="sm" onClick={onExit} className="text-xs gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  View Site
                </Button>
              </div>
            </div>
          </header>

          {/* Favorites bar (when user has favorites) */}
          {favorites.length > 0 && (
            <div className="border-b border-border/30 bg-muted/20 px-4 lg:px-6 py-1.5 hidden lg:flex items-center gap-1 overflow-x-auto">
              <Star className="h-3 w-3 text-amber-500 shrink-0 mr-1" weight="fill" />
              {favorites.map(favId => {
                const favItem = navItems.find(n => n.id === favId)
                if (!favItem) return null
                const FavIcon = favItem.icon
                return (
                  <button
                    key={favId}
                    onClick={() => guardedSetActiveTab(favId)}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
                      activeTab === favId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <FavIcon className="h-3 w-3" weight="regular" />
                    {favItem.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Page content — extra bottom padding on mobile for Quick Actions bar */}
          <div className="flex-1 p-6 lg:p-8 max-w-6xl pb-24 lg:pb-8">
            {/* Dangerous Actions Warning Banner */}
            {flags.dangerousActions && (
              <div
                role="alert"
                className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                <Warning className="h-5 w-5 shrink-0 text-red-500" weight="fill" />
                <div className="min-w-0">
                  <span className="font-semibold">Dangerous Actions Enabled</span>
                  <span className="mx-1.5 text-red-500/60">&#x2022;</span>
                  <span className="text-red-400/80">Bulk delete, data wipe, and other destructive operations are unlocked. Disable when not in active use.</span>
                </div>
              </div>
            )}
            {/* B26: Legacy auth migration banner */}
            {currentUser && (
              <MigrationBanner userEmail={currentUser.email} />
            )}
            <Suspense fallback={<ModuleLoader />}>
              {renderContent()}
            </Suspense>
          </div>

          {/* Editor Toolbar — sticky bottom bar with save/undo/redo/status */}
          <Suspense fallback={null}>
            <EditorToolbar
              isDirty={globalDirty}
              isSaving={isSaving}
              canUndo={historyState.canUndo}
              canRedo={historyState.canRedo}
              undoLabel={historyState.undoLabel}
              redoLabel={historyState.redoLabel}
              onSave={handleSave}
              onUndo={() => {
                const entry = historyStore.undo()
                if (entry) toast.info(`Undone: ${entry.label}`)
              }}
              onRedo={() => {
                const entry = historyStore.redo()
                if (entry) toast.info(`Redone: ${entry.label}`)
              }}
              onTogglePreview={() => setPreviewOpen(p => !p)}
              onToggleHistory={() => setHistoryOpen(h => !h)}
              onToggleShortcuts={() => setShortcutsOpen(s => !s)}
              isPreviewOpen={previewOpen}
              isHistoryOpen={historyOpen}
            />
          </Suspense>
        </div>

        {/* History Timeline Panel — side panel */}
        {historyOpen && (
          <Suspense fallback={null}>
            <HistoryTimeline onClose={() => setHistoryOpen(false)} />
          </Suspense>
        )}

        {/* Preview Panel — side-by-side preview */}
        {previewOpen && (
          <Suspense fallback={null}>
            <PreviewPanel
              isDirty={globalDirty}
              onClose={() => setPreviewOpen(false)}
            />
          </Suspense>
        )}
      </main>

      {/* Mobile Quick Actions Bar (Chain A5) */}
      <Suspense fallback={null}>
        <MobileQuickActions
          onNavigate={guardedSetActiveTab}
          onPublish={handlePublish}
          onPreview={onExit}
          isPublishing={isPublishing}
          canPublish={canPublish}
        />
      </Suspense>

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        items={filteredNavItems}
        categories={visibleCategories}
        onSelect={guardedSetActiveTab}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        shortcuts={shortcuts}
      />

      {/* Publish Dialog — choose Direct to Main or Branch + PR */}
      <Dialog open={showPublishConfirm} onOpenChange={(open) => { setShowPublishConfirm(open); if (!open) setPublishMessage('') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GithubLogo className="h-5 w-5" weight="bold" />
              Publish Changes
            </DialogTitle>
            <DialogDescription>
              Push data changes to &ldquo;{activeSatellite?.name || activeSite?.name || 'Founder-Hub'}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Optional commit message */}
            <div className="space-y-1.5">
              <label htmlFor="commit-msg" className="text-xs font-medium text-muted-foreground">
                Commit message <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <input
                id="commit-msg"
                type="text"
                value={publishMessage}
                onChange={e => setPublishMessage(e.target.value)}
                placeholder="Describe your changes..."
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>
            <Button
              className="w-full justify-start gap-3 h-auto py-3"
              variant="default"
              onClick={() => executePublish('direct', publishMessage)}
              disabled={isPublishing}
            >
              <Rocket className="h-5 w-5 shrink-0" weight="bold" />
              <div className="text-left">
                <span className="font-semibold text-sm">Commit to Main</span>
                <p className="text-xs font-normal opacity-80">Push directly — deploys immediately via GitHub Pages.</p>
              </div>
            </Button>
            <Button
              className="w-full justify-start gap-3 h-auto py-3"
              variant="outline"
              onClick={() => executePublish('branch', publishMessage)}
              disabled={isPublishing}
            >
              <TreeStructure className="h-5 w-5 shrink-0" weight="bold" />
              <div className="text-left">
                <span className="font-semibold text-sm">Branch + Pull Request</span>
                <p className="text-xs font-normal opacity-70">Create a review branch — merge later.</p>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => { setShowPublishConfirm(false); setPublishMessage('') }}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Route Leave Guard Dialog */}
      <GuardDialog />
    </div>
    </WorkspaceSiteProvider>
  )
}
