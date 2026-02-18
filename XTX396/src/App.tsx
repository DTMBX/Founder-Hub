import { useState, useEffect } from 'react'
import PublicSite from './components/PublicSite'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminLogin from './components/admin/AdminLogin'
import ProviderLogin from './components/admin/ProviderLogin'
import CaseJacket from './components/CaseJacket'
import CheckoutResult from './components/CheckoutResult'
import SiteRouter from './components/sites/SiteRouter'
import { OfferingPage } from './marketing'
import { useAuth } from './lib/auth'
import { useAuthProvider, getEffectiveAuthMode } from './lib/auth-provider'
import { useInitializeSampleData } from './lib/initialize-sample-data'
import HonorFlagBar from './components/HonorFlagBar'
import { useHonorBarSettings } from './hooks/use-honor-bar-settings'

type View =
  | 'public'
  | 'admin'
  | 'case-jacket'
  | 'checkout-success'
  | 'checkout-cancel'
  | 'site'
  | 'site-preview'
  | 'offerings'

function App() {
  const [view, setView] = useState<View>('public')
  const [caseId, setCaseId] = useState<string>('')
  const [siteSlug, setSiteSlug] = useState<string>('')
  const [sitePreviewId, setSitePreviewId] = useState<string>('')
  const { isAuthenticated, isLoading } = useAuth()
  const authProvider = useAuthProvider()
  const authMode = getEffectiveAuthMode()
  const honorBarSettings = useHonorBarSettings()
  
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
    } else if (hash === 'checkout/success') {
      setView('checkout-success')
    } else if (hash === 'checkout/cancel') {
      setView('checkout-cancel')
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

  // ─── View Resolver ──────────────────────────────────────────
  // All views render below the HonorFlagBar layout root.
  const renderView = () => {
    // Public site via slug: #s/{slug}
    if (view === 'site' && siteSlug) {
      return <SiteRouter slug={siteSlug} mode="public" onBack={handleBackToPublic} />
    }

    // Admin preview via siteId: #preview/{siteId}
    if (view === 'site-preview' && sitePreviewId) {
      return <SiteRouter siteId={sitePreviewId} mode="preview" onBack={handleBackToPublic} />
    }

    if (view === 'checkout-success') {
      return <CheckoutResult status="success" onBack={handleBackToPublic} />
    }

    if (view === 'checkout-cancel') {
      return <CheckoutResult status="cancel" onBack={handleBackToPublic} />
    }

    if (view === 'case-jacket' && caseId) {
      return <CaseJacket caseId={caseId} onBack={handleBackToPublic} />
    }

    if (view === 'admin') {
      // Determine effective auth state based on auth mode
      const effectiveLoading = authMode === 'supabase' ? authProvider.isLoading : isLoading
      const effectiveAuth = authMode === 'supabase' ? authProvider.isAuthenticated : isAuthenticated

      if (effectiveLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )
      }

      if (!effectiveAuth) {
        // Use provider login when Supabase is configured; legacy login otherwise
        if (authMode === 'supabase') {
          return <ProviderLogin onBack={handleBackToPublic} />
        }
        return <AdminLogin onBack={handleBackToPublic} />
      }

      return <AdminDashboard onExit={handleBackToPublic} />
    }

    if (view === 'offerings') {
      return <OfferingPage />
    }

    return <PublicSite onAdminClick={handleNavigateToAdmin} onNavigateToCase={handleNavigateToCase} />
  }

  return (
    <>
      <HonorFlagBar {...honorBarSettings} />
      {renderView()}
    </>
  )
}

export default App
