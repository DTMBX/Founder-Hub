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
import { Plus, Pencil, Trash, X, GithubLogo, Globe, BookOpen, Link as LinkIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

export default function ProjectsManager() {
  const [projects, setProjects] = useKV<Project[]>('founder-hub-projects', [])
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
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

  const handleSave = async () => {
    if (!editingProject) return
    
    if (!editingProject.title.trim()) {
      toast.error('Project title is required')
      return
    }

    setProjects(currentProjects => {
      const existing = currentProjects?.find(p => p.id === editingProject.id)
      if (existing) {
        return (currentProjects || []).map(p => p.id === editingProject.id ? editingProject : p)
      } else {
        return [...(currentProjects || []), editingProject]
      }
    })

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'update_project',
        `Updated project: ${editingProject.title}`,
        'project',
        editingProject.id
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Projects</h2>
          <p className="text-muted-foreground">Manage your portfolio projects.</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects?.sort((a, b) => a.order - b.order).map(project => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.title || 'Untitled Project'}</CardTitle>
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
                </div>
                <Switch checked={project.enabled} onCheckedChange={(checked) => {
                  setProjects(currentProjects =>
                    (currentProjects || []).map(p => p.id === project.id ? { ...p, enabled: checked } : p)
                  )
                }} />
              </div>
            </CardHeader>
            <CardFooter className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEdit(project)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(project.id)} className="gap-2 text-destructive">
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}

        {(!projects || projects.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No projects yet. Add your first project to get started.</p>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject?.title ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-title">Title</Label>
                <Input
                  id="project-title"
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  placeholder="Project Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-summary">Summary</Label>
                <Textarea
                  id="project-summary"
                  value={editingProject.summary}
                  onChange={(e) => setEditingProject({ ...editingProject, summary: e.target.value })}
                  placeholder="Brief description"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Full Description</Label>
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
                                      <SelectItem value="repo">
                                        <div className="flex items-center gap-2">
                                          <GithubLogo className="h-4 w-4" />
                                          Repository
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="demo">
                                        <div className="flex items-center gap-2">
                                          <Globe className="h-4 w-4" />
                                          Demo
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="docs">
                                        <div className="flex items-center gap-2">
                                          <BookOpen className="h-4 w-4" />
                                          Docs
                                        </div>
                                      </SelectItem>
                                      <SelectItem value="other">
                                        <div className="flex items-center gap-2">
                                          <LinkIcon className="h-4 w-4" />
                                          Other
                                        </div>
                                      </SelectItem>
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

              <div className="flex items-center justify-between pt-2 border-t">
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
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
