import { useState, useEffect, lazy, Suspense } from 'react'
import PublicSite from './components/PublicSite'
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
  | 'not-found'

function App() {
  const [view, setView] = useState<View>('public')
  const [caseId, setCaseId] = useState<string>('')
  const [siteSlug, setSiteSlug] = useState<string>('')
  const [sitePreviewId, setSitePreviewId] = useState<string>('')
  const [legalSlug, setLegalSlug] = useState<string>('')
  const { isAuthenticated, isLoading, needsFirstRunSetup } = useAuth()
  
  useInitializeSampleData()

  useEffect(() => {
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
    } else if (hash === 'privacy' || hash === 'terms') {
      setLegalSlug(hash)
      setView('legal')
    } else if (hash && hash !== 'projects' && hash !== 'about' && hash !== 'contact' && hash !== 'proof-of-work') {
      // Unrecognized hash route — show 404
      setView('not-found')
    }
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
      <PublicSite onAdminClick={handleNavigateToAdmin} onNavigateToCase={handleNavigateToCase} />
      <Suspense fallback={null}><DevCustomizer /></Suspense>
    </>
  )
}

export default App
