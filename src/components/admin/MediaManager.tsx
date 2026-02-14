import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { PDFAsset, PDFVisibility, Case } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FilePdf, Trash, Upload, Pencil } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

export default function MediaManager() {
  const [pdfs, setPdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [cases] = useKV<Case[]>('founder-hub-cases', [])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPDF, setEditingPDF] = useState<PDFAsset | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    caseId: '',
    documentType: '',
    filingDate: '',
    tags: '',
    visibility: 'private' as PDFVisibility,
    featured: false
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { currentUser } = useAuth()

  const handleDelete = async (pdfId: string) => {
    setPdfs(currentPdfs => (currentPdfs || []).filter(p => p.id !== pdfId))
    
    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'delete_pdf',
        `Deleted PDF`,
        'pdf',
        pdfId
      )
    }

    toast.success('PDF deleted')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are supported')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB')
      return
    }

    setSelectedFile(file)
    setUploadForm(prev => ({
      ...prev,
      title: prev.title || file.name.replace('.pdf', '')
    }))
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }

    if (!uploadForm.title.trim()) {
      toast.error('Title is required')
      return
    }

    const now = Date.now()
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      
      const newPDF: PDFAsset = {
        id: `pdf_${now}`,
        fileUrl: dataUrl,
        title: uploadForm.title,
        description: uploadForm.description,
        caseId: uploadForm.caseId || undefined,
        documentType: uploadForm.documentType || undefined,
        filingDate: uploadForm.filingDate || undefined,
        tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        visibility: uploadForm.visibility,
        stage: 'published',
        ocrStatus: 'none',
        featured: uploadForm.featured,
        fileSize: selectedFile.size,
        pageCount: undefined,
        metadata: {
          originalFilename: selectedFile.name,
          checksum: `sha256_${now}_${selectedFile.size}`
        },
        createdAt: now,
        updatedAt: now
      }

      setPdfs(currentPdfs => [...(currentPdfs || []), newPDF])

      if (currentUser) {
        await logAudit(
          currentUser.id,
          currentUser.email,
          'upload_pdf',
          `Uploaded PDF: ${newPDF.title}`,
          'pdf',
          newPDF.id
        )
      }

      toast.success('PDF uploaded successfully')
      setIsUploadDialogOpen(false)
      setSelectedFile(null)
      setUploadForm({
        title: '',
        description: '',
        caseId: '',
        documentType: '',
        filingDate: '',
        tags: '',
        visibility: 'private',
        featured: false
      })
    }

    reader.readAsDataURL(selectedFile)
  }

  const handleEdit = (pdf: PDFAsset) => {
    setEditingPDF(pdf)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingPDF) return

    setPdfs(currentPdfs => 
      (currentPdfs || []).map(p => 
        p.id === editingPDF.id ? { ...editingPDF, updatedAt: Date.now() } : p
      )
    )

    if (currentUser) {
      await logAudit(
        currentUser.id,
        currentUser.email,
        'update_pdf',
        `Updated PDF: ${editingPDF.title}`,
        'pdf',
        editingPDF.id
      )
    }

    toast.success('PDF updated successfully')
    setIsEditDialogOpen(false)
    setEditingPDF(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Media & PDFs</h2>
          <p className="text-muted-foreground">Manage PDF documents and case files.</p>
        </div>
        <Button onClick={() => setIsUploadDialogOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
          <CardDescription>PDF documents up to 10MB. Supported types: PDF only.</CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <FilePdf className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Click to upload PDF files
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum file size: 10MB
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pdfs?.map(pdf => (
          <Card key={pdf.id}>
            <CardHeader>
              <div className="flex items-start gap-3">
                <FilePdf className="h-8 w-8 text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{pdf.title}</CardTitle>
                  <CardDescription className="text-xs mt-1 line-clamp-2">{pdf.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">{pdf.visibility}</Badge>
                {pdf.caseId && cases?.find(c => c.id === pdf.caseId) && (
                  <Badge variant="secondary" className="text-xs">
                    {cases.find(c => c.id === pdf.caseId)?.title}
                  </Badge>
                )}
                {pdf.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {pdf.documentType && <p>Type: {pdf.documentType}</p>}
                <p>{(pdf.fileSize / 1024).toFixed(0)} KB</p>
                <p>{new Date(pdf.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleEdit(pdf)} 
                className="flex-1 gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDelete(pdf.id)} 
                className="flex-1 gap-2 text-destructive"
              >
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}

        {(!pdfs || pdfs.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No PDFs uploaded yet. Upload your first document to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload PDF Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-file">Select PDF File</Label>
              <input
                ref={fileInputRef}
                id="pdf-file"
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-title">Title *</Label>
              <Input
                id="upload-title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Document title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-description">Description</Label>
              <Textarea
                id="upload-description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upload-case">Assign to Case</Label>
                <Select
                  value={uploadForm.caseId}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, caseId: value }))}
                >
                  <SelectTrigger id="upload-case">
                    <SelectValue placeholder="Select case..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {cases?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-doctype">Document Type</Label>
                <Input
                  id="upload-doctype"
                  value={uploadForm.documentType}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, documentType: e.target.value }))}
                  placeholder="e.g., Complaint, Order"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upload-filing-date">Filing Date</Label>
                <Input
                  id="upload-filing-date"
                  type="date"
                  value={uploadForm.filingDate}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, filingDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-visibility">Visibility</Label>
                <Select
                  value={uploadForm.visibility}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, visibility: value as PDFVisibility }))}
                >
                  <SelectTrigger id="upload-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upload-tags">Tags (comma-separated)</Label>
              <Input
                id="upload-tags"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="evidence, motion, certification"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!selectedFile}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit PDF Document</DialogTitle>
          </DialogHeader>
          {editingPDF && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingPDF.title}
                  onChange={(e) => setEditingPDF({ ...editingPDF, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingPDF.description}
                  onChange={(e) => setEditingPDF({ ...editingPDF, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-case">Assign to Case</Label>
                  <Select
                    value={editingPDF.caseId || ''}
                    onValueChange={(value) => setEditingPDF({ ...editingPDF, caseId: value || undefined })}
                  >
                    <SelectTrigger id="edit-case">
                      <SelectValue placeholder="Select case..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {cases?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-doctype">Document Type</Label>
                  <Input
                    id="edit-doctype"
                    value={editingPDF.documentType || ''}
                    onChange={(e) => setEditingPDF({ ...editingPDF, documentType: e.target.value || undefined })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-filing-date">Filing Date</Label>
                  <Input
                    id="edit-filing-date"
                    type="date"
                    value={editingPDF.filingDate || ''}
                    onChange={(e) => setEditingPDF({ ...editingPDF, filingDate: e.target.value || undefined })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-visibility">Visibility</Label>
                  <Select
                    value={editingPDF.visibility}
                    onValueChange={(value) => setEditingPDF({ ...editingPDF, visibility: value as PDFVisibility })}
                  >
                    <SelectTrigger id="edit-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={editingPDF.tags.join(', ')}
                  onChange={(e) => setEditingPDF({ ...editingPDF, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
