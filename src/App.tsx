import { useState, useEffect } from 'react'
import PublicSite from './components/PublicSite'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminLogin from './components/admin/AdminLogin'
import CaseJacket from './components/CaseJacket'
import CheckoutResult from './components/CheckoutResult'
import { useAuth } from './lib/auth'
import { useInitializeSampleData } from './lib/initialize-sample-data'

type View = 'public' | 'admin' | 'case-jacket' | 'checkout-success' | 'checkout-cancel'

function App() {
  const [view, setView] = useState<View>('public')
  const [caseId, setCaseId] = useState<string>('')
  const { isAuthenticated, isLoading } = useAuth()
  
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
    if (hash.startsWith('case/')) {
      const id = hash.split('/')[1]
      if (id) {
        setCaseId(id)
        setView('case-jacket')
      }
    } else if (hash === 'admin') {
      setView('admin')
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
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return <AdminLogin onBack={handleBackToPublic} />
    }

    return <AdminDashboard onExit={handleBackToPublic} />
  }

  return <PublicSite onAdminClick={handleNavigateToAdmin} onNavigateToCase={handleNavigateToCase} />
}

export default App
