import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { House, FolderOpen, Scales, Newspaper, PaperPlaneRight, List } from '@phosphor-icons/react'
import { Section } from '@/lib/types'

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-card/95 backdrop-blur-lg border-b border-border shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => scrollToSection('hero')}
            className="text-lg font-bold tracking-tight hover:text-accent transition-colors"
          >
            xTx396
          </button>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
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
              className="text-xs"
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
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map(link => {
                  const Icon = link.icon
                  return (
                    <button
                      key={link.id}
                      onClick={() => scrollToSection(link.id)}
                      className="flex items-center gap-3 text-left px-2 py-2 rounded-lg hover:bg-accent/10 transition-colors"
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      <span className="font-medium">{link.label}</span>
                    </button>
                  )
                })}

                {showInvestorToggle && (
                  <div className="flex items-center justify-between px-2 py-2 mt-4 border-t border-border pt-4">
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
