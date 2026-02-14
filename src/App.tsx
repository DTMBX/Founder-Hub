import { useState } from 'react'
import PublicSite from './components/PublicSite'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminLogin from './components/admin/AdminLogin'
import { useAuth } from './lib/auth'

function App() {
  const [view, setView] = useState<'public' | 'admin'>('public')
  const { isAuthenticated, isLoading } = useAuth()

  if (view === 'admin') {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return <AdminLogin onBack={() => setView('public')} />
    }

    return <AdminDashboard onExit={() => setView('public')} />
  }

  return <PublicSite onAdminClick={() => setView('admin')} />
}

export default App
