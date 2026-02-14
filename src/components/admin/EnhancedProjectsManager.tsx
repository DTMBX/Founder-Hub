import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Project, ProjectLink } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Pencil, Trash, X, GithubLogo, Globe, BookOpen, Link as LinkIcon, CopySimple, Archive, Monitor, DeviceMobile, ArrowsDownUp, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

export default function EnhancedProjectsManager() {
  const [projects, setProjects] = useKV<Project[]>('founder-hub-projects', [])
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const { currentUser } = useAuth()

  const handleAdd = () => {
    const now = Date.now()
    const newProject: Project = {
      id: `proj_${now}`,
      title: '',
      summary: '',
      description: '',
      tags: [],
      techStack: [],
      links: [],
      order: (projects?.length || 0) + 1,
      enabled: true,
      featured: false,
      status: 'active',
      createdAt: now,
      updatedAt: now
    }
    setEditingProject(newProject)
    setIsDialogOpen(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setIsDialogOpen(true)
  }

  const handleDuplicate = async (project: Project) => {
    const now = Date.now()
    const duplicated: Project = {
      ...project,
      id: `proj_${now}`,
      title: `${project.title} (Copy)`,
      order: (projects?.length || 0) + 1,
      createdAt: now,
      updatedAt: now
    }
    
    setProjects(current => [...(current || []), duplicated])

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'duplicate_project',
        `Duplicated project: ${project.title}`,
        'project',
        duplicated.id
      )
    }

    toast.success('Project duplicated')
  }

  const handleArchive = async (project: Project) => {
    setProjects(current =>
      (current || []).map(p =>
        p.id === project.id ? { ...p, status: 'archived', updatedAt: Date.now() } : p
      )
    )

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'archive_project',
        `Archived project: ${project.title}`,
        'project',
        project.id
      )
    }

    toast.success('Project archived')
  }

  const handleSave = async () => {
    if (!editingProject) return
    
    if (!editingProject.title.trim()) {
      toast.error('Project title is required')
      return
    }

    const updatedProject = { ...editingProject, updatedAt: Date.now() }

    setProjects(currentProjects => {
      const existing = currentProjects?.find(p => p.id === editingProject.id)
      if (existing) {
        return (currentProjects || []).map(p => p.id === editingProject.id ? updatedProject : p)
      } else {
        return [...(currentProjects || []), updatedProject]
      }
    })

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'update_project',
        `Updated project: ${updatedProject.title}`,
        'project',
        updatedProject.id
      )
    }

    toast.success('Project saved successfully')
    setIsDialogOpen(false)
    setEditingProject(null)
  }

  const handleAddLink = () => {
    if (!editingProject) return
    const newLink: ProjectLink = {
      label: '',
      url: '',
      type: 'other'
    }
    setEditingProject({
      ...editingProject,
      links: [...editingProject.links, newLink]
    })
  }

  const handleUpdateLink = (index: number, field: keyof ProjectLink, value: string) => {
    if (!editingProject) return
    const updatedLinks = [...editingProject.links]
    updatedLinks[index] = { ...updatedLinks[index], [field]: value }
    setEditingProject({
      ...editingProject,
      links: updatedLinks
    })
  }

  const handleRemoveLink = (index: number) => {
    if (!editingProject) return
    setEditingProject({
      ...editingProject,
      links: editingProject.links.filter((_, i) => i !== index)
    })
  }

  const handleMoveUp = (projectId: string) => {
    const sortedProjects = (projects || []).sort((a, b) => a.order - b.order)
    const index = sortedProjects.findIndex(p => p.id === projectId)
    if (index <= 0) return

    const newOrder = [...sortedProjects]
    const temp = newOrder[index].order
    newOrder[index].order = newOrder[index - 1].order
    newOrder[index - 1].order = temp

    setProjects(newOrder)
    toast.success('Order updated')
  }

  const handleMoveDown = (projectId: string) => {
    const sortedProjects = (projects || []).sort((a, b) => a.order - b.order)
    const index = sortedProjects.findIndex(p => p.id === projectId)
    if (index < 0 || index >= sortedProjects.length - 1) return

    const newOrder = [...sortedProjects]
    const temp = newOrder[index].order
    newOrder[index].order = newOrder[index + 1].order
    newOrder[index + 1].order = temp

    setProjects(newOrder)
    toast.success('Order updated')
  }

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'repo': return <GithubLogo className="h-4 w-4" />
      case 'demo': return <Globe className="h-4 w-4" />
      case 'docs': return <BookOpen className="h-4 w-4" />
      default: return <LinkIcon className="h-4 w-4" />
    }
  }

  const handleDelete = async (projectId: string) => {
    setProjects(currentProjects => (currentProjects || []).filter(p => p.id !== projectId))
    
    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'delete_project',
        `Deleted project`,
        'project',
        projectId
      )
    }

    toast.success('Project deleted')
  }

  const checkContrastWarning = (project: Project): boolean => {
    if (!project.customization?.accentColor) return false
    return false
  }

  const activeProjects = (projects || []).filter(p => p.status !== 'archived')
  const archivedProjects = (projects || []).filter(p => p.status === 'archived')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Projects</h2>
          <p className="text-muted-foreground">Manage your portfolio projects with live preview and customization.</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active Projects ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.sort((a, b) => a.order - b.order).map(project => (
              <Card key={project.id} className="relative">
                {checkContrastWarning(project) && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="destructive" className="gap-1">
                      <Warning className="h-3 w-3" />
                      Contrast
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{project.title || 'Untitled Project'}</CardTitle>
                        {project.featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                        <Badge variant="outline" className="text-xs capitalize">{project.status}</Badge>
                      </div>
                      <CardDescription className="mt-1">{project.summary}</CardDescription>
                      {project.techStack && project.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.techStack.map(tech => (
                            <span key={tech} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.links && project.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.links.map((link, i) => (
                            <span key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                              {getLinkIcon(link.type)}
                              {link.label}
                            </span>
                          ))}
                        </div>
                      )}
                      {project.customization && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Custom styling applied
                        </div>
                      )}
                    </div>
                    <Switch checked={project.enabled} onCheckedChange={(checked) => {
                      setProjects(currentProjects =>
                        (currentProjects || []).map(p => p.id === project.id ? { ...p, enabled: checked } : p)
                      )
                    }} />
                  </div>
                </CardHeader>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(project)} className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(project)} className="gap-2">
                    <CopySimple className="h-4 w-4" />
                    Duplicate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleArchive(project)} className="gap-2">
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleMoveUp(project.id)} className="h-9 w-9 p-0">
                      <ArrowsDownUp className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(project.id)} className="gap-2 text-destructive ml-auto">
                    <Trash className="h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {activeProjects.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No active projects. Add your first project to get started.</p>
                  <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archivedProjects.map(project => (
              <Card key={project.id} className="opacity-60">
                <CardHeader>
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription>{project.summary}</CardDescription>
                </CardHeader>
                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProjects(current =>
                        (current || []).map(p =>
                          p.id === project.id ? { ...p, status: 'active', updatedAt: Date.now() } : p
                        )
                      )
                      toast.success('Project restored')
                    }}
                  >
                    Restore
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(project.id)} className="gap-2 text-destructive ml-auto">
                    <Trash className="h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {archivedProjects.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No archived projects.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingProject?.title ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="editor" className="h-full flex flex-col">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="preview">Live Preview</TabsTrigger>
                  <TabsTrigger value="customization">Customization</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto mt-4">
                  <TabsContent value="editor" className="space-y-4 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="project-title">Title</Label>
                      <Input
                        id="project-title"
                        value={editingProject.title}
                        onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                        placeholder="Project Name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="project-status">Status</Label>
                        <Select
                          value={editingProject.status}
                          onValueChange={(value) => setEditingProject({ ...editingProject, status: value as 'active' | 'paused' | 'archived' })}
                        >
                          <SelectTrigger id="project-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-summary">Short Pitch</Label>
                      <Textarea
                        id="project-summary"
                        value={editingProject.summary}
                        onChange={(e) => setEditingProject({ ...editingProject, summary: e.target.value })}
                        placeholder="Brief description (1-2 lines)"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-description">Longer Description</Label>
                      <Textarea
                        id="project-description"
                        value={editingProject.description}
                        onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                        placeholder="Detailed description"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-tech">Tech Stack (comma-separated)</Label>
                      <Input
                        id="project-tech"
                        value={editingProject.techStack.join(', ')}
                        onChange={(e) => setEditingProject({ ...editingProject, techStack: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="React, TypeScript, Node.js"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="project-tags">Tags (comma-separated)</Label>
                      <Input
                        id="project-tags"
                        value={editingProject.tags.join(', ')}
                        onChange={(e) => setEditingProject({ ...editingProject, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                        placeholder="web3, enterprise, mobile"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Links</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddLink} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Link
                        </Button>
                      </div>
                      
                      {editingProject.links.length === 0 ? (
                        <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
                          No links yet. Add repository, demo, or documentation links.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {editingProject.links.map((link, index) => (
                            <Card key={index} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                  <div className="flex-1 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs">Type</Label>
                                        <Select
                                          value={link.type}
                                          onValueChange={(value) => handleUpdateLink(index, 'type', value)}
                                        >
                                          <SelectTrigger className="h-9">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="repo">Repository</SelectItem>
                                            <SelectItem value="demo">Demo</SelectItem>
                                            <SelectItem value="docs">Docs</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Label</Label>
                                        <Input
                                          value={link.label}
                                          onChange={(e) => handleUpdateLink(index, 'label', e.target.value)}
                                          placeholder="View on GitHub"
                                          className="h-9"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">URL</Label>
                                      <Input
                                        value={link.url}
                                        onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                                        placeholder="https://github.com/..."
                                        className="h-9"
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveLink(index)}
                                    className="text-destructive hover:text-destructive h-9 w-9 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="project-featured"
                          checked={editingProject.featured}
                          onCheckedChange={(checked) => setEditingProject({ ...editingProject, featured: checked })}
                        />
                        <Label htmlFor="project-featured" className="text-sm">Featured Project</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="project-enabled"
                          checked={editingProject.enabled}
                          onCheckedChange={(checked) => setEditingProject({ ...editingProject, enabled: checked })}
                        />
                        <Label htmlFor="project-enabled" className="text-sm">Enabled</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="space-y-4 mt-0">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Button
                        variant={previewMode === 'desktop' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('desktop')}
                        className="gap-2"
                      >
                        <Monitor className="h-4 w-4" />
                        Desktop
                      </Button>
                      <Button
                        variant={previewMode === 'mobile' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPreviewMode('mobile')}
                        className="gap-2"
                      >
                        <DeviceMobile className="h-4 w-4" />
                        Mobile
                      </Button>
                    </div>

                    <div className={previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}>
                      <Card className="overflow-hidden">
                        <CardHeader>
                          <div className="flex items-center gap-2">
                            <CardTitle>{editingProject.title || 'Untitled Project'}</CardTitle>
                            {editingProject.featured && (
                              <Badge variant="secondary">Featured</Badge>
                            )}
                            <Badge variant="outline" className="capitalize">{editingProject.status}</Badge>
                          </div>
                          <CardDescription>{editingProject.summary || 'No summary provided'}</CardDescription>
                          {editingProject.description && (
                            <p className="text-sm text-muted-foreground mt-2">{editingProject.description}</p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {editingProject.techStack.length > 0 && (
                            <div>
                              <Label className="text-xs mb-2 block">Tech Stack</Label>
                              <div className="flex flex-wrap gap-1">
                                {editingProject.techStack.map(tech => (
                                  <Badge key={tech} variant="secondary">{tech}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {editingProject.links.length > 0 && (
                            <div>
                              <Label className="text-xs mb-2 block">Links</Label>
                              <div className="flex flex-wrap gap-2">
                                {editingProject.links.map((link, i) => (
                                  <Button key={i} variant="outline" size="sm" className="gap-2">
                                    {getLinkIcon(link.type)}
                                    {link.label || 'Link'}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="text-xs text-center text-muted-foreground mt-4">
                      Preview reflects current edits (not saved yet)
                    </div>
                  </TabsContent>

                  <TabsContent value="customization" className="space-y-4 mt-0">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium mb-4">Per-Project Styling Overrides</h3>
                        <p className="text-xs text-muted-foreground mb-4">
                          Customize this project's appearance while remaining within global theme tokens.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="custom-icon">Custom Icon (emoji or unicode)</Label>
                        <Input
                          id="custom-icon"
                          value={editingProject.customization?.icon || ''}
                          onChange={(e) => setEditingProject({
                            ...editingProject,
                            customization: { ...editingProject.customization, icon: e.target.value }
                          })}
                          placeholder="🚀"
                          maxLength={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="custom-accent">Accent Color Token (oklch format)</Label>
                        <Input
                          id="custom-accent"
                          value={editingProject.customization?.accentColor || ''}
                          onChange={(e) => setEditingProject({
                            ...editingProject,
                            customization: { ...editingProject.customization, accentColor: e.target.value }
                          })}
                          placeholder="oklch(0.65 0.24 250)"
                        />
                        {checkContrastWarning(editingProject) && (
                          <div className="text-xs text-destructive flex items-center gap-1">
                            <Warning className="h-3 w-3" />
                            Warning: Custom color may reduce contrast
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="custom-badge">Custom Badge Text</Label>
                        <Input
                          id="custom-badge"
                          value={editingProject.customization?.badgeText || ''}
                          onChange={(e) => setEditingProject({
                            ...editingProject,
                            customization: { ...editingProject.customization, badgeText: e.target.value }
                          })}
                          placeholder="NEW"
                          maxLength={20}
                        />
                      </div>

                      <div className="p-4 bg-muted rounded-md text-xs text-muted-foreground">
                        <strong>Note:</strong> Custom styling should enhance the project card without breaking the overall design system.
                        Consistency warnings will appear if overrides significantly reduce readability.
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
