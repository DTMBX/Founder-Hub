import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { House, FolderOpen, Scales, Newspaper, PaperPlaneRight, List } from '@phosphor-icons/react'
import { Section } from '@/lib/types'
import { useActiveSection } from '@/hooks/use-active-section'
import { cn } from '@/lib/utils'

interface NavigationProps {
  sections: Section[]
  investorMode: boolean
  onToggleInvestorMode: () => void
  showInvestorToggle?: boolean
  onAdminClick: () => void
}

const sectionIcons: Record<string, any> = {
  hero: House,
  projects: FolderOpen,
  court: Scales,
  proof: Newspaper,
  contact: PaperPlaneRight
}

export default function Navigation({ 
  sections, 
  investorMode, 
  onToggleInvestorMode,
  showInvestorToggle,
  onAdminClick
}: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  
  const sectionIds = sections.map(s => s.type)
  const activeSection = useActiveSection(sectionIds)

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
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      const offsetPosition = elementPosition - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      
      window.history.pushState(null, '', `#${sectionId}`)
      setMobileOpen(false)
    }
  }

  const navLinks = sections.map(section => {
    const Icon = sectionIcons[section.type]
    return {
      label: section.title,
      id: section.type,
      icon: Icon
    }
  })

  return (
    <nav 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg' 
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => scrollToSection('hero')}
            className="text-lg font-bold tracking-tight hover:text-accent transition-colors font-mono"
          >
            xTx396
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md',
                  activeSection === link.id
                    ? 'text-foreground bg-accent/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/5'
                )}
              >
                {link.label}
                {activeSection === link.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full" />
                )}
              </button>
            ))}

            {showInvestorToggle && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                <Switch
                  id="investor-mode"
                  checked={investorMode}
                  onCheckedChange={onToggleInvestorMode}
                />
                <Label htmlFor="investor-mode" className="text-sm cursor-pointer">
                  Investor Mode
                </Label>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onAdminClick}
              className="text-xs ml-2"
            >
              Admin
            </Button>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <List className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background/95 backdrop-blur-xl">
              <div className="flex flex-col gap-2 mt-8">
                {navLinks.map(link => {
                  const Icon = link.icon
                  const isActive = activeSection === link.id
                  return (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className={cn(
                        'flex items-center gap-3 text-left px-3 py-3 rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-accent/20 text-foreground'
                          : 'hover:bg-accent/10 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      <span className="font-medium">{link.label}</span>
                    </button>
                  )
                })}

                {showInvestorToggle && (
                  <div className="flex items-center justify-between px-3 py-3 mt-4 border-t border-border pt-4">
                    <Label htmlFor="investor-mode-mobile" className="text-sm">
                      Investor Mode
                    </Label>
                    <Switch
                      id="investor-mode-mobile"
                      checked={investorMode}
                      onCheckedChange={onToggleInvestorMode}
                    />
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={onAdminClick}
                  className="mt-4"
                >
                  Admin Portal
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
