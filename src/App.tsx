import { useState, useEffect } from 'react'
import PublicSite from './components/PublicSite'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminLogin from './components/admin/AdminLogin'
import CaseJacket from './components/CaseJacket'
import { useAuth } from './lib/auth'
import { useInitializeSampleData } from './lib/initialize-sample-data'
import { isLocalhost } from './lib/local-storage-kv'

type View = 'public' | 'admin' | 'case-jacket'

function App() {
  const [view, setView] = useState<View>('public')
  const [caseId, setCaseId] = useState<string>('')
  const { isAuthenticated, isLoading } = useAuth()
  const adminAllowed = isLocalhost()
  
  useInitializeSampleData()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash.startsWith('case/')) {
      const id = hash.split('/')[1]
      if (id) {
        setCaseId(id)
        setView('case-jacket')
      }
    } else if (hash === 'admin' && adminAllowed) {
      setView('admin')
    }
  }, [adminAllowed])

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
    if (!adminAllowed) {
      console.warn('Admin panel is only available on localhost')
      return
    }
    setView('admin')
    window.location.hash = 'admin'
  }

  if (view === 'case-jacket' && caseId) {
    return <CaseJacket caseId={caseId} onBack={handleBackToPublic} />
  }

  if (view === 'admin' && adminAllowed) {
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

  return <PublicSite onAdminClick={adminAllowed ? handleNavigateToAdmin : undefined} onNavigateToCase={handleNavigateToCase} />
}

export default App
