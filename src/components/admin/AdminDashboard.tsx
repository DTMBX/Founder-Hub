import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth'
import { SignOut, Article, FolderOpen, Scales, Image, Palette, Globe, ChartLine, Gear, ClockCounterClockwise } from '@phosphor-icons/react'
import ContentManager from './ContentManager'
import ProjectsManager from './ProjectsManager'
import CourtManager from './CourtManager'
import MediaManager from './MediaManager'
import ThemeManager from './ThemeManager'
import SettingsManager from './SettingsManager'
import AuditLog from './AuditLog'

interface AdminDashboardProps {
  onExit: () => void
}

export default function AdminDashboard({ onExit }: AdminDashboardProps) {
  const { logout, currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('content')

  const handleLogout = async () => {
    await logout()
    onExit()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-bold">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">{currentUser?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onExit}>
                View Public Site
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <SignOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-7 gap-2 h-auto p-2 bg-card">
            <TabsTrigger value="content" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Article className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="court" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Scales className="h-4 w-4" />
              <span className="hidden sm:inline">Court</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Media</span>
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gear className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClockCounterClockwise className="h-4 w-4" />
              <span className="hidden sm:inline">Audit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <ContentManager />
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <ProjectsManager />
          </TabsContent>

          <TabsContent value="court" className="space-y-4">
            <CourtManager />
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <MediaManager />
          </TabsContent>

          <TabsContent value="theme" className="space-y-4">
            <ThemeManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <SettingsManager />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
