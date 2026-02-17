import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { useInitializeDocumentTypes } from '@/lib/initialize-document-types'
import { downloadDataFiles } from '@/lib/local-storage-kv'
import { publishToGitHub, hasGitHubToken } from '@/lib/github-sync'
import { useSite } from '@/lib/site-context'
import { toast } from 'sonner'
import { usePermissions, FOUNDER_MODE_ROUTES } from '@/lib/route-guards'
import { useFeatureFlags, activateFounderMode, activateOpsMode } from '@/lib/feature-flags'
import {
  SignOut, Article, FolderOpen, Scales, FilePdf, CloudArrowUp, 
  MagnifyingGlass, Palette, ClockCounterClockwise, Gear, Stack, 
  Certificate, ClipboardText, Tray, ShieldCheck, VideoCamera, 
  Image, Flag, Sparkle, ArrowLeft, CaretRight, House, Briefcase,
  UserCircle, LinkSimple, IdentificationBadge, FlagBanner, Export, GithubLogo, ShoppingBag, TrendUp, TreeStructure, Globe,
  Buildings, Storefront, Kanban, UsersFour
} from '@phosphor-icons/react'
import ContentManager from './ContentManager'
import EnhancedProjectsManager from './EnhancedProjectsManager'
import EnhancedCourtManager from './EnhancedCourtManager'
import DocumentsManager from './DocumentsManager'
import AdminInbox from './AdminInbox'
import UploadQueueManager from './UploadQueueManager'
import StagingReviewManager from './StagingReviewManager'
import FilingTypesManager from './FilingTypesManager'
import TemplatesManager from './TemplatesManager'
import HeroMediaManager from './HeroMediaManager'
import ThemeManager from './ThemeManager'
import SettingsManager from './SettingsManager'
import SecurityManager from './SecurityManager'
import AuditLog from './AuditLog'
import AssetScanner from './AssetScanner'
import AssetUsagePolicyManager from './AssetUsagePolicyManager'
import VisualModulesManager from './VisualModulesManager'
import CaseJacketManager from './CaseJacketManager'
import AboutManager from './AboutManager'
import LinksManager from './LinksManager'
import ProfileManager from './ProfileManager'
import HonorFlagBarManager from './HonorFlagBarManager'
import OfferingsManager from './OfferingsManager'
import InvestorManager from './InvestorManager'
import EvidentManager from './EvidentManager'
import SitePicker from './SitePicker'
import SitesManager from './SitesManager'
import LawFirmShowcaseManager from './LawFirmShowcaseManager'
import SMBTemplateManager from './SMBTemplateManager'
import AgencyFrameworkManager from './AgencyFrameworkManager'
import ClientSiteManager from './ClientSiteManager'
import { useClientSites } from '@/hooks/use-client-sites'
import { AdminLeadsViewer } from '@/leads'
import { cn } from '@/lib/utils'

interface AdminDashboardProps {
  onExit: () => void
}

interface NavItem {
  id: string
  label: string
  icon: any
  category: string
}

const navItems: NavItem[] = [
  // XTX396 Site
  { id: 'content', label: 'Content', icon: Article, category: 'XTX396 Site' },
  { id: 'about', label: 'About / Updates', icon: UserCircle, category: 'XTX396 Site' },
  { id: 'links', label: 'Links', icon: LinkSimple, category: 'XTX396 Site' },
  { id: 'profile', label: 'Profile & Emails', icon: IdentificationBadge, category: 'XTX396 Site' },
  { id: 'hero-media', label: 'Hero Media', icon: VideoCamera, category: 'XTX396 Site' },
  { id: 'visual-modules', label: 'Visual Modules', icon: Sparkle, category: 'XTX396 Site' },
  { id: 'honor-flag-bar', label: 'Honor Flag Bar', icon: FlagBanner, category: 'XTX396 Site' },
  // Investor & Trade
  { id: 'investor', label: 'Investor Section', icon: TrendUp, category: 'Investor & Trade' },
  { id: 'offerings', label: 'Offerings', icon: ShoppingBag, category: 'Investor & Trade' },
  // Evident Platform
  { id: 'evident', label: 'Evident Dashboard', icon: Globe, category: 'Evident Platform' },
  { id: 'sites', label: 'Sites & Repos', icon: TreeStructure, category: 'Evident Platform' },
  // Frameworks (Private)
  { id: 'client-sites', label: 'Client Sites', icon: Globe, category: 'Frameworks' },
  { id: 'law-firm', label: 'Law Firm Showcase', icon: Buildings, category: 'Frameworks' },
  { id: 'smb-template', label: 'SMB Template', icon: Storefront, category: 'Frameworks' },
  { id: 'agency', label: 'Agency Framework', icon: Kanban, category: 'Frameworks' },
  // Case Management
  { id: 'projects', label: 'Projects', icon: FolderOpen, category: 'Case Management' },
  { id: 'court', label: 'Court Cases', icon: Scales, category: 'Case Management' },
  { id: 'documents', label: 'Documents', icon: FilePdf, category: 'Case Management' },
  { id: 'case-jackets', label: 'Case Jackets', icon: Briefcase, category: 'Case Management' },
  { id: 'filing-types', label: 'Filing Types', icon: Certificate, category: 'Case Management' },
  { id: 'templates', label: 'Templates', icon: ClipboardText, category: 'Case Management' },
  // Assets & Uploads
  { id: 'inbox', label: 'Inbox', icon: Tray, category: 'Assets' },
  { id: 'upload', label: 'Upload Queue', icon: CloudArrowUp, category: 'Assets' },
  { id: 'staging', label: 'Staging Review', icon: Stack, category: 'Assets' },
  { id: 'assets', label: 'Asset Scanner', icon: Image, category: 'Assets' },
  { id: 'asset-policy', label: 'Usage Policy', icon: Flag, category: 'Assets' },
  // System
  { id: 'theme', label: 'Theme', icon: Palette, category: 'System' },
  { id: 'settings', label: 'Site Settings', icon: Gear, category: 'System' },
  { id: 'security', label: 'Security', icon: ShieldCheck, category: 'System' },
  { id: 'audit', label: 'Audit Log', icon: ClockCounterClockwise, category: 'System' },
  { id: 'leads', label: 'Leads', icon: UsersFour, category: 'System' },
]

const categories = ['XTX396 Site', 'Investor & Trade', 'Evident Platform', 'Frameworks', 'Case Management', 'Assets', 'System']

export default function AdminDashboard({ onExit }: AdminDashboardProps) {
  const { logout, currentUser } = useAuth()
  const { activeSite, activeSatellite } = useSite()
  const [activeTab, setActiveTab] = useState('content')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const { activeSite: activeClientSite, activeSiteId: activeClientSiteId, sites: clientSites, setActiveSiteId: setActiveClientSiteId } = useClientSites()
  
  // RBAC & Feature Flags
  const permissions = usePermissions()
  const { flags } = useFeatureFlags()
  
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
    })
    setIsPublishing(false)
    
    if (result.success) {
      toast.success(`Published to ${activeSatellite?.name || activeSite.name}!`)
    } else {
      toast.error(result.error || 'Failed to publish')
    }
  }

  const activeItem = navItems.find(item => item.id === activeTab)

  const renderContent = () => {
    switch (activeTab) {
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
      case 'law-firm': return <LawFirmShowcaseManager siteId={activeClientSite?.type === 'law-firm' ? activeClientSiteId ?? undefined : undefined} />
      case 'smb-template': return <SMBTemplateManager siteId={activeClientSite?.type === 'small-business' ? activeClientSiteId ?? undefined : undefined} />
      case 'agency': return <AgencyFrameworkManager siteId={activeClientSite?.type === 'agency' ? activeClientSiteId ?? undefined : undefined} />
      case 'client-sites': return <ClientSiteManager onNavigateToSite={(siteId, siteType) => {
        setActiveClientSiteId(siteId)
        const tabMap: Record<string, string> = { 'law-firm': 'law-firm', 'small-business': 'smb-template', agency: 'agency' }
        setActiveTab(tabMap[siteType] ?? 'client-sites')
      }} />
      case 'theme': return <ThemeManager />
      case 'settings': return <SettingsManager />
      case 'security': return <SecurityManager />
      case 'audit': return <AuditLog />
      case 'leads': return <AdminLeadsViewer />
      default: return <ContentManager />
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        'sticky top-0 h-screen border-r border-border/50 bg-card/50 backdrop-blur-sm flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
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
        <div className="p-2 border-b border-border/50">
          <SitePicker collapsed={sidebarCollapsed} />
        </div>

        {/* Nav items */}
        <ScrollArea className="flex-1 py-2">
          <div className="px-2 space-y-4">
            {visibleCategories.map(category => {
              const items = filteredNavItems.filter(item => item.category === category)
              if (items.length === 0) return null
              return (
                <div key={category}>
                  {!sidebarCollapsed && (
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold px-3 mb-1">
                      {category}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {items.map(item => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-lg transition-all duration-150 text-sm',
                            sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2',
                            isActive 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                          )}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <Icon className="h-4 w-4 shrink-0" weight={isActive ? 'fill' : 'regular'} />
                          {!sidebarCollapsed && <span className="truncate font-medium">{item.label}</span>}
                        </button>
                      )
                    })}
                  </div>
                  {category !== visibleCategories[visibleCategories.length - 1] && !sidebarCollapsed && (
                    <Separator className="mt-3 opacity-50" />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>

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
              {!sidebarCollapsed && (isPublishing ? 'Publishing...' : 'Publish to Live')}
            </Button>
          )}
          {canExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (!canExport) {
                  toast.error('You do not have permission to export data')
                  return
                }
                downloadDataFiles()
                toast.success('Data files downloaded! Copy to public/data/ and commit to deploy.')
              }}
              className={cn('w-full gap-2 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10', sidebarCollapsed ? 'px-0 justify-center' : 'justify-start')}
            >
              <Export className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && 'Export Data'}
            </Button>
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

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-xl">
          <div className="flex items-center justify-between h-14 px-6">
            <div className="flex items-center gap-3">
              {activeItem && (
                <>
                  <activeItem.icon className="h-5 w-5 text-primary" weight="duotone" />
                  <h2 className="text-base font-semibold">{activeItem.label}</h2>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onExit} className="text-xs gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                View Site
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 lg:p-8 max-w-6xl">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
