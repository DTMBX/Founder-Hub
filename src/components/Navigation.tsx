import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { House, FolderOpen, Scales, Newspaper, PaperPlaneRight, List, UserCircle, ShoppingBag, ShieldCheck, type IconProps } from '@phosphor-icons/react'
import { Section } from '@/lib/types'
import { useActiveSection } from '@/hooks/use-active-section'
import { cn } from '@/lib/utils'

// Import height constants for scroll offset calculations
import { HONOR_BAR_HEIGHT_DESKTOP, HONOR_BAR_HEIGHT_MOBILE } from './HonorFlagBar'

interface NavigationProps {
  sections: Section[]
  onAdminClick?: () => void
  activePathway?: string
}

const sectionIcons: Record<string, React.ComponentType<IconProps>> = {
  hero: House,
  projects: FolderOpen,
  offerings: ShoppingBag,
  services: ShoppingBag,
  about: UserCircle,
  governance: ShieldCheck,
  court: Scales,
  proof: Newspaper,
  contact: PaperPlaneRight
}

/** Consistent nav labels matching the hero CTA grid */
const NAV_LABELS: Record<string, string> = {
  about: 'About Devon',
  projects: 'What I Build',
  court: 'Court & Accountability',
  contact: 'Invest & Connect',
}

export default function Navigation({ 
  sections, 
  onAdminClick,
  activePathway
}: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const sectionIds = (sections || []).map(s => s.type)
  const activeSection = useActiveSection(sectionIds)

  const pathwayAccent = activePathway === 'investors' ? 'emerald' : activePathway === 'legal' ? 'amber' : activePathway === 'about' ? 'purple' : activePathway === 'marketplace' ? 'rose' : null

  // Track mobile state for responsive positioning
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Use responsive honor bar height
  const honorBarHeight = isMobile ? HONOR_BAR_HEIGHT_MOBILE : HONOR_BAR_HEIGHT_DESKTOP

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      // Account for sticky header + honor bar when scrolling to sections
      const headerOffset = 64 + honorBarHeight
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
      window.history.pushState(null, '', `#${sectionId}`)
      setMobileOpen(false)
    }
  }

  const navLinks = (sections || [])
    .filter(s => s.type !== 'hero')
    .map(section => {
      const Icon = sectionIcons[section.type]
      return { label: NAV_LABELS[section.type] || section.title, id: section.type, icon: Icon }
    })

  return (
    <nav 
      aria-label="Main navigation"
      className={cn(
        'fixed left-0 right-0 z-50 transition-all duration-300',
        isScrolled 
          ? 'bg-background/95 backdrop-blur-xl border-b border-border shadow-lg translate-y-0 opacity-100' 
          : '-translate-y-full opacity-0 pointer-events-none'
      )}
      style={{
        // Nav sits directly below the honor bar with no gap
        top: `${honorBarHeight}px`
      }}
    >
      {/* Pathway accent line */}
      {pathwayAccent && isScrolled && (
        <div className={cn(
          'absolute bottom-0 left-0 right-0 h-[2px] transition-all duration-500',
          pathwayAccent === 'emerald' && 'bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent',
          pathwayAccent === 'amber' && 'bg-gradient-to-r from-transparent via-amber-500/60 to-transparent',
          pathwayAccent === 'purple' && 'bg-gradient-to-r from-transparent via-purple-500/60 to-transparent'
        )} />
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1200px]">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => scrollToSection('hero')}
            className={cn(
              'text-base font-bold tracking-tight transition-colors font-mono',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm',
              isScrolled ? 'text-foreground hover:text-foreground/80' : 'text-foreground/90 hover:text-foreground'
            )}
          >
            Devon Tyler
          </button>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-0.5 list-none" role="list">
            {navLinks.map(link => (
              <li key={link.id}>
                <button
                  onClick={() => scrollToSection(link.id)}
                  aria-current={activeSection === link.id ? 'page' : undefined}
                  className={cn(
                    'relative px-3.5 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    activeSection === link.id
                      ? 'text-foreground bg-foreground/15' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-foreground/10'
                  )}
                >
                  {link.label}
                  {activeSection === link.id && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-foreground/80" aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}

            {onAdminClick && (
              <li className="ml-3 pl-3 border-l border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAdminClick}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                >
                  Admin
                </Button>
              </li>
            )}
          </ul>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-foreground/90 hover:bg-foreground/10" aria-label="Open navigation menu" aria-expanded={mobileOpen}>
                <List className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background/95 backdrop-blur-xl border-l border-border/50">
              <ul className="flex flex-col gap-1 mt-8 list-none" role="list">
                {navLinks.map(link => {
                  const Icon = link.icon
                  const isActive = activeSection === link.id
                  return (
                    <li key={link.id}>
                      <button
                        onClick={() => scrollToSection(link.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg transition-all duration-200',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          isActive
                            ? 'bg-accent/15 text-foreground font-medium'
                            : 'hover:bg-accent/5 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {Icon && <Icon className="h-5 w-5" weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />}
                        <span>{link.label}</span>
                      </button>
                    </li>
                  )
                })}

                {onAdminClick && (
                  <li className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={onAdminClick}
                      className="w-full"
                      size="sm"
                    >
                      Admin Portal
                    </Button>
                  </li>
                )}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
