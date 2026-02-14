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
import { Plus, Pencil, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

export default function ProjectsManager() {
  const [projects, setProjects] = useKV<Project[]>('founder-hub-projects', [])
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { currentUser } = useAuth()

  const handleAdd = () => {
    const newProject: Project = {
      id: `proj_${Date.now()}`,
      title: '',
      summary: '',
      description: '',
      tags: [],
      techStack: [],
      links: [],
      order: (projects?.length || 0) + 1,
      enabled: true,
      featured: false
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
