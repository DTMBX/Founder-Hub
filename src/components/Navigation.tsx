import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { House, FolderOpen, Scales, Newspaper, PaperPlaneRight, List, UserCircle, ShoppingBag } from '@phosphor-icons/react'
import { Section } from '@/lib/types'
import { useActiveSection } from '@/hooks/use-active-section'
import { cn } from '@/lib/utils'

interface NavigationProps {
  sections: Section[]
  investorMode: boolean
  onToggleInvestorMode: () => void
  showInvestorToggle?: boolean
  onAdminClick?: () => void
  activePathway?: string
}

const sectionIcons: Record<string, any> = {
  hero: House,
  projects: FolderOpen,
  offerings: ShoppingBag,
  about: UserCircle,
  court: Scales,
  proof: Newspaper,
  contact: PaperPlaneRight
}

export default function Navigation({ 
  sections, 
  onAdminClick,
  activePathway
}: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const sectionIds = (sections || []).map(s => s.type)
  const activeSection = useActiveSection(sectionIds)

  const pathwayAccent = activePathway === 'investors' ? 'emerald' : activePathway === 'legal' ? 'amber' : activePathway === 'about' ? 'purple' : null

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 96
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
      return { label: section.title, id: section.type, icon: Icon }
    })

  return (
    <nav 
      className={cn(
        'fixed left-0 right-0 z-50 transition-all duration-500',
        'top-[18px] sm:top-[20px] md:top-[24px]',
        isScrolled 
          ? 'bg-background/85 backdrop-blur-2xl border-b border-border/40 shadow-sm' 
          : 'bg-transparent'
      )}
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => scrollToSection('hero')}
            className={cn(
              'text-base font-bold tracking-tight transition-colors font-mono',
              isScrolled ? 'text-foreground hover:text-accent' : 'text-white/90 hover:text-white'
            )}
          >
            xTx396
          </button>

          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={cn(
                  'relative px-3.5 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
                  activeSection === link.id
                    ? isScrolled 
                      ? 'text-foreground bg-accent/10' 
                      : 'text-white bg-white/10'
                    : isScrolled
                      ? 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
                {activeSection === link.id && (
                  <span className={cn(
                    'absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full',
                    isScrolled ? 'bg-accent' : 'bg-white/80'
                  )} />
                )}
              </button>
            ))}

            {onAdminClick && (
              <div className="ml-3 pl-3 border-l border-border/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onAdminClick}
                  className={cn(
                    'text-xs font-medium',
                    isScrolled ? '' : 'text-white/60 hover:text-white hover:bg-white/10'
                  )}
                >
                  Admin
                </Button>
              </div>
            )}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className={cn(
                isScrolled ? '' : 'text-white/90 hover:bg-white/10'
              )}>
                <List className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background/95 backdrop-blur-xl border-l border-border/50">
              <div className="flex flex-col gap-1 mt-8">
                {navLinks.map(link => {
                  const Icon = link.icon
                  const isActive = activeSection === link.id
                  return (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className={cn(
                        'flex items-center gap-3 text-left px-4 py-3 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-accent/15 text-foreground font-medium'
                          : 'hover:bg-accent/5 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" weight={isActive ? 'fill' : 'regular'} />}
                      <span>{link.label}</span>
                    </button>
                  )
                })}

                {onAdminClick && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={onAdminClick}
                      className="w-full"
                      size="sm"
                    >
                      Admin Portal
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
