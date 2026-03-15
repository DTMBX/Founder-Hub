import { useState, useEffect, lazy, Suspense } from 'react'
import PublicSite from './components/PublicSite'
import { EcosystemHeader } from './components/EcosystemHeader'
import { SearchModal } from './components/SearchModal'
import { useAuth } from './lib/auth'
import { useInitializeSampleData } from './lib/initialize-sample-data'

const DevToolbar = lazy(() => import('./components/DevToolbar'))
const DevCustomizer = lazy(() => import('./components/DevCustomizer'))

// Route-level code splitting — these views are not needed on initial load
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'))
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'))
const FirstRunSetup = lazy(() => import('./components/admin/FirstRunSetup'))
const CaseJacket = lazy(() => import('./components/CaseJacket'))
const CheckoutResult = lazy(() => import('./components/CheckoutResult'))
const SiteRouter = lazy(() => import('./components/sites/SiteRouter'))
const OfferingPage = lazy(() => import('./marketing').then(m => ({ default: m.OfferingPage })))
const StudioPreview = lazy(() => import('./components/dev/StudioPreview'))
const LegalPage = lazy(() => import('./components/LegalPage'))
const AboutPage = lazy(() => import('./components/pages/AboutPage'))
const ProjectsIndexPage = lazy(() => import('./components/pages/ProjectsIndexPage'))
const ProjectPage = lazy(() => import('./components/pages/ProjectPage'))
const AccountabilityPage = lazy(() => import('./components/pages/AccountabilityPage'))
const InvestPage = lazy(() => import('./components/pages/InvestPage'))
const EvidentPage = lazy(() => import('./components/pages/EvidentPage'))
const TillersteadPage = lazy(() => import('./components/pages/TillersteadPage'))
const DataPage = lazy(() => import('./components/pages/DataPage'))
const DeveloperPage = lazy(() => import('./components/pages/DeveloperPage'))
const ActivityPage = lazy(() => import('./components/pages/ActivityPage'))
const IntelligencePage = lazy(() => import('./components/pages/IntelligencePage'))
const EvidentSitePage = lazy(() => import('./components/pages/EvidentSitePage'))
const BlogPage = lazy(() => import('./components/pages/BlogPage'))
const BlogPostPage = lazy(() => import('./components/pages/BlogPostPage'))
const EvidentDemoPage = lazy(() => import('./components/pages/EvidentDemoPage'))
const HealthPage = lazy(() => import('./components/pages/HealthPage'))
const SystemStatusPage = lazy(() => import('./components/pages/SystemStatusPage'))

type View =
  | 'public'
  | 'admin'
  | 'case-jacket'
  | 'checkout-success'
  | 'checkout-cancel'
  | 'site'
  | 'site-preview'
  | 'studio-preview'
  | 'offerings'
  | 'legal'
  | 'about'
  | 'projects-index'
  | 'project-detail'
  | 'accountability'
  | 'invest'
  | 'evident'
  | 'tillerstead'
  | 'data'
  | 'developers'
  | 'activity'
  | 'intelligence'
  | 'evident-site'
  | 'blog'
  | 'blog-post'
  | 'evident-demo'
  | 'health'
  | 'system-status'
  | 'not-found'

function App() {
  const [view, setView] = useState<View>('public')
  const [caseId, setCaseId] = useState<string>('')
  const [projectId, setProjectId] = useState<string>('')
  const [postId, setPostId] = useState<string>('')
  const [siteSlug, setSiteSlug] = useState<string>('')
  const [sitePreviewId, setSitePreviewId] = useState<string>('')
  const [legalSlug, setLegalSlug] = useState<string>('')
  const { isAuthenticated, isLoading, needsFirstRunSetup } = useAuth()
  
  useInitializeSampleData()

  const resolveHash = () => {
    const hash = window.location.hash.slice(1)
    const pathname = window.location.pathname
    
    // Handle checkout redirects (path-based for Stripe compatibility)
    if (pathname === '/checkout/success' || pathname.includes('checkout/success')) {
      setView('checkout-success')
      return
    }
    if (pathname === '/checkout/cancel' || pathname.includes('checkout/cancel')) {
      setView('checkout-cancel')
      return
    }
    
    // Handle hash-based routes
    if (hash.startsWith('s/')) {
      // Public site route: #s/{slug}
      const slug = hash.slice(2)
      if (slug) {
        setSiteSlug(slug)
        setView('site')
      }
    } else if (hash.startsWith('preview/')) {
      // Preview route: #preview/{siteId}
      const id = hash.slice(8)
      if (id) {
        setSitePreviewId(id)
        setView('site-preview')
      }
    } else if (hash.startsWith('case/')) {
      const id = hash.split('/')[1]
      if (id) {
        setCaseId(id)
        setView('case-jacket')
      }
    } else if (hash === 'admin') {
      setView('admin')
    } else if (hash === 'offerings') {
      setView('offerings')
    } else if (hash === 'studio-preview') {
      setView('studio-preview')
    } else if (hash === 'checkout/success') {
      setView('checkout-success')
    } else if (hash === 'checkout/cancel') {
      setView('checkout-cancel')
    } else if (hash === 'privacy' || hash === 'terms' || hash === 'cookie-policy') {
      setLegalSlug(hash)
      setView('legal')
    } else if (hash === 'about') {
      setView('about')
    } else if (hash === 'projects-index') {
      setView('projects-index')
    } else if (hash.startsWith('project/')) {
      const id = hash.slice(8)
      if (id) {
        setProjectId(id)
        setView('project-detail')
      }
    } else if (hash === 'accountability') {
      setView('accountability')
    } else if (hash === 'invest') {
      setView('invest')
    } else if (hash === 'evident') {
      setView('evident')
    } else if (hash === 'tillerstead') {
      setView('tillerstead')
    } else if (hash === 'data') {
      setView('data')
    } else if (hash === 'developers') {
      setView('developers')
    } else if (hash === 'activity') {
      setView('activity')
    } else if (hash === 'intelligence') {
      setView('intelligence')
    } else if (hash === 'evident-site') {
      setView('evident-site')
    } else if (hash === 'evident-demo') {
      setView('evident-demo')
    } else if (hash === 'health') {
      setView('health')
    } else if (hash === 'system-status') {
      setView('system-status')
    } else if (hash === 'blog') {
      setView('blog')
    } else if (hash.startsWith('blog/')) {
      const id = hash.slice(5)
      if (id) {
        setPostId(id)
        setView('blog-post')
      }
    } else if (hash && hash !== 'projects' && hash !== 'contact' && hash !== 'proof-of-work') {
      // Unrecognized hash route — show 404
      setView('not-found')
    } else {
      setView('public')
    }
  }

  useEffect(() => {
    resolveHash()
    window.addEventListener('hashchange', resolveHash)
    return () => window.removeEventListener('hashchange', resolveHash)
  }, [])

  const handleNavigateToCase = (id: string) => {
    setCaseId(id)
    setView('case-jacket')
    window.location.hash = `case/${id}`
  }

  const handleBackToPublic = () => {
    setView('public')
    window.location.hash = ''
  }

  const handleNavigateToAdmin = () => {
    setView('admin')
    window.location.hash = 'admin'
  }

  const handleNavigateToOfferings = () => {
    setView('offerings')
    window.location.hash = 'offerings'
  }

  const handleNavigateToAbout = () => {
    setView('about')
    window.location.hash = 'about'
  }

  const handleNavigateToProjectsIndex = () => {
    setView('projects-index')
    window.location.hash = 'projects-index'
  }

  const handleNavigateToProject = (id: string) => {
    setProjectId(id)
    setView('project-detail')
    window.location.hash = `project/${id}`
  }

  const handleNavigateToAccountability = () => {
    setView('accountability')
    window.location.hash = 'accountability'
  }

  const handleNavigateToInvest = () => {
    setView('invest')
    window.location.hash = 'invest'
  }

  const handleNavigateToEvident = () => {
    setView('evident')
    window.location.hash = 'evident'
  }

  const handleNavigateToTillerstead = () => {
    setView('tillerstead')
    window.location.hash = 'tillerstead'
  }

  const handleNavigateToBlog = () => {
    setView('blog')
    window.location.hash = 'blog'
  }

  const handleNavigateToBlogPost = (id: string) => {
    setPostId(id)
    setView('blog-post')
    window.location.hash = `blog/${id}`
  }

  // Route loading fallback
  const routeFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Loading">
      <div className="text-muted-foreground animate-pulse">Loading...</div>
    </div>
  )

  // Public site via slug: #s/{slug}
  if (view === 'site' && siteSlug) {
    return (
      <Suspense fallback={routeFallback}>
        <SiteRouter slug={siteSlug} mode="public" onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  // Admin preview via siteId: #preview/{siteId}
  if (view === 'site-preview' && sitePreviewId) {
    return (
      <Suspense fallback={routeFallback}>
        <SiteRouter siteId={sitePreviewId} mode="preview" onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'checkout-success') {
    return (
      <Suspense fallback={routeFallback}>
        <CheckoutResult status="success" onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'checkout-cancel') {
    return (
      <Suspense fallback={routeFallback}>
        <CheckoutResult status="cancel" onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'case-jacket' && caseId) {
    return (
      <Suspense fallback={routeFallback}>
        <CaseJacket caseId={caseId} onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'admin') {
    if (isLoading) {
      return routeFallback
    }

    if (needsFirstRunSetup) {
      return (
        <Suspense fallback={routeFallback}>
          <FirstRunSetup onBack={handleBackToPublic} />
        </Suspense>
      )
    }

    if (!isAuthenticated) {
      return (
        <Suspense fallback={routeFallback}>
          <AdminLogin onBack={handleBackToPublic} />
        </Suspense>
      )
    }

    return (
      <Suspense fallback={routeFallback}>
        <AdminDashboard onExit={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'offerings') {
    return (
      <Suspense fallback={routeFallback}>
        <OfferingPage />
      </Suspense>
    )
  }

  // Studio preview — clean frame for the preview iframe (no DevCustomizer)
  if (view === 'studio-preview') {
    return (
      <Suspense fallback={routeFallback}>
        <StudioPreview />
      </Suspense>
    )
  }

  if (view === 'legal' && legalSlug) {
    return (
      <Suspense fallback={routeFallback}>
        <LegalPage slug={legalSlug} onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'about') {
    return (
      <Suspense fallback={routeFallback}>
        <AboutPage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'projects-index') {
    return (
      <Suspense fallback={routeFallback}>
        <ProjectsIndexPage onBack={handleBackToPublic} onNavigateToProject={handleNavigateToProject} />
      </Suspense>
    )
  }

  if (view === 'project-detail' && projectId) {
    return (
      <Suspense fallback={routeFallback}>
        <ProjectPage projectId={projectId} onBack={handleNavigateToProjectsIndex} />
      </Suspense>
    )
  }

  if (view === 'accountability') {
    return (
      <Suspense fallback={routeFallback}>
        <AccountabilityPage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'invest') {
    return (
      <Suspense fallback={routeFallback}>
        <InvestPage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'evident') {
    return (
      <Suspense fallback={routeFallback}>
        <EvidentPage onBack={handleBackToPublic} onNavigateToProject={handleNavigateToProject} />
      </Suspense>
    )
  }

  if (view === 'tillerstead') {
    return (
      <Suspense fallback={routeFallback}>
        <TillersteadPage onBack={handleBackToPublic} onNavigateToProject={handleNavigateToProject} />
      </Suspense>
    )
  }

  if (view === 'data') {
    return (
      <Suspense fallback={routeFallback}>
        <DataPage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'developers') {
    return (
      <Suspense fallback={routeFallback}>
        <DeveloperPage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'activity') {
    return (
      <Suspense fallback={routeFallback}>
        <ActivityPage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'intelligence') {
    return (
      <Suspense fallback={routeFallback}>
        <IntelligencePage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'evident-site') {
    return (
      <Suspense fallback={routeFallback}>
        <EvidentSitePage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'evident-demo') {
    return (
      <Suspense fallback={routeFallback}>
        <EvidentDemoPage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'health') {
    return (
      <Suspense fallback={routeFallback}>
        <HealthPage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'system-status') {
    return (
      <Suspense fallback={routeFallback}>
        <SystemStatusPage onBack={handleBackToPublic} />
      </Suspense>
    )
  }

  if (view === 'blog') {
    return (
      <Suspense fallback={routeFallback}>
        <BlogPage onBack={handleBackToPublic} onNavigateToPost={handleNavigateToBlogPost} />
      </Suspense>
    )
  }

  if (view === 'blog-post' && postId) {
    return (
      <Suspense fallback={routeFallback}>
        <BlogPostPage postId={postId} onBack={handleNavigateToBlog} />
      </Suspense>
    )
  }

  if (view === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="text-lg text-muted-foreground">Page not found</p>
        <button
          onClick={handleBackToPublic}
          className="mt-4 px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go Home
        </button>
      </div>
    )
  }

  return (
    <>
      <EcosystemHeader />
      <SearchModal />
      <PublicSite onAdminClick={handleNavigateToAdmin} onNavigateToCase={handleNavigateToCase} />
      <Suspense fallback={null}><DevCustomizer /></Suspense>
    </>
  )
}

export default App
