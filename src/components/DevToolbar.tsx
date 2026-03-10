import { useState } from 'react'
import { isLocalhost } from '@/lib/local-storage-kv'
import { cn } from '@/lib/utils'
import {
  Wrench, X, Pencil, ShoppingBag, FolderOpen, UserCircle,
  Scales, Newspaper, PaperPlaneRight, TrendUp, Gear, Export,
  ArrowSquareOut
} from '@phosphor-icons/react'

interface QuickLink {
  label: string
  icon: React.ElementType
  adminTab: string
  jsonFile?: string
}

const quickLinks: QuickLink[] = [
  { label: 'Services / Offerings', icon: ShoppingBag, adminTab: 'offerings', jsonFile: 'offerings.json' },
  { label: 'Projects', icon: FolderOpen, adminTab: 'projects', jsonFile: 'projects.json' },
  { label: 'About / Updates', icon: UserCircle, adminTab: 'about', jsonFile: 'about.json' },
  { label: 'Court Cases', icon: Scales, adminTab: 'court', jsonFile: 'court-cases.json' },
  { label: 'Proof & Press', icon: Newspaper, adminTab: 'links', jsonFile: 'links.json' },
  { label: 'Contact Links', icon: PaperPlaneRight, adminTab: 'profile', jsonFile: 'contact-links.json' },
  { label: 'Investor Section', icon: TrendUp, adminTab: 'investor', jsonFile: 'investor.json' },
  { label: 'Section Order', icon: Pencil, adminTab: 'content', jsonFile: 'sections.json' },
  { label: 'Site Settings', icon: Gear, adminTab: 'settings', jsonFile: 'settings.json' },
]

export default function DevToolbar() {
  const [isOpen, setIsOpen] = useState(false)

  // Only render on localhost
  if (!isLocalhost()) return null

  const goToAdmin = (tab: string) => {
    window.location.hash = 'admin'
    // Store the desired tab so AdminDashboard can pick it up
    sessionStorage.setItem('dev-admin-tab', tab)
    window.location.reload()
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-4 right-4 z-[9999] p-3 rounded-full shadow-lg transition-all duration-200',
          'bg-primary text-primary-foreground hover:scale-105 active:scale-95',
          isOpen && 'rotate-90'
        )}
        aria-label="Developer toolbar"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
      </button>

      {/* Quick-edit panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-[9998] w-72 rounded-xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold">Dev Quick Edit</p>
            <p className="text-xs text-muted-foreground">localhost only — click to open admin panel</p>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {quickLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.adminTab}
                  onClick={() => goToAdmin(link.adminTab)}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left text-sm hover:bg-accent/10 transition-colors group"
                >
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                  <span className="flex-1 truncate">{link.label}</span>
                  {link.jsonFile && (
                    <span className="text-[10px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {link.jsonFile}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="p-2 border-t border-border space-y-1">
            <button
              onClick={() => goToAdmin('content')}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              <ArrowSquareOut className="h-4 w-4" />
              Open Full Admin Dashboard
            </button>
            <button
              onClick={() => {
                // Export all data files
                import('@/lib/local-storage-kv').then(mod => mod.downloadDataFiles())
              }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent/10 transition-colors"
            >
              <Export className="h-4 w-4" />
              Export Data for Commit
            </button>
          </div>
        </div>
      )}
    </>
  )
}
