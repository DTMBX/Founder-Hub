import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/lib/auth'
import { SignOut, Article, FolderOpen, Scales, FilePdf, CloudArrowUp, ListBullets, MagnifyingGlass, Palette, Globe, ShieldCheck, ClockCounterClockwise, Database, Gear } from '@phosphor-icons/react'
import ContentManager from './ContentManager'
import EnhancedProjectsManager from './EnhancedProjectsManager'
import EnhancedCourtManager from './EnhancedCourtManager'
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
              <h1 className="text-lg font-bold">Content Control Center</h1>
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
          <ScrollArea className="w-full">
            <TabsList className="inline-flex gap-1 h-auto p-2 bg-card">
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
                <span className="hidden sm:inline">Cases</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FilePdf className="h-4 w-4" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <CloudArrowUp className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="metadata" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ListBullets className="h-4 w-4" />
                <span className="hidden sm:inline">Metadata</span>
              </TabsTrigger>
              <TabsTrigger value="search" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <MagnifyingGlass className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
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
          </ScrollArea>

          <TabsContent value="content" className="space-y-4">
            <ContentManager />
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <EnhancedProjectsManager />
          </TabsContent>

          <TabsContent value="court" className="space-y-4">
            <EnhancedCourtManager />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <MediaManager />
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <CloudArrowUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Batch Upload Queue</h3>
              <p className="text-sm mb-4">Advanced batch PDF upload with progress tracking and validation</p>
              <p className="text-xs">Coming in next iteration</p>
            </div>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <ListBullets className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Metadata & Naming Rules</h3>
              <p className="text-sm mb-4">Configure automated naming templates and extraction rules</p>
              <p className="text-xs">Coming in next iteration</p>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="text-center py-12 text-muted-foreground">
              <MagnifyingGlass className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Document Search</h3>
              <p className="text-sm mb-4">Full-text search across OCR-processed documents</p>
              <p className="text-xs">Coming in next iteration</p>
            </div>
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
