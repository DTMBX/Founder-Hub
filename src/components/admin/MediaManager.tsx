import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { PDFAsset, PDFVisibility } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilePdf, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAuth, logAudit } from '@/lib/auth'

export default function MediaManager() {
  const [pdfs, setPdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
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

  const handleSimulateUpload = async () => {
    const newPDF: PDFAsset = {
      id: `pdf_${Date.now()}`,
      fileUrl: `/pdfs/sample_${Date.now()}.pdf`,
      title: 'Sample Document',
      description: 'This is a sample PDF document',
      tags: ['sample'],
      visibility: 'private',
      featured: false,
      fileSize: 1024 * 150,
      createdAt: Date.now(),
      updatedAt: Date.now()
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

    toast.success('PDF uploaded (simulated)')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Media & PDFs</h2>
          <p className="text-muted-foreground">Manage PDF documents and case files.</p>
        </div>
        <Button onClick={handleSimulateUpload} className="gap-2">
          <FilePdf className="h-4 w-4" />
          Simulate Upload
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
          <CardDescription>PDF documents up to 10MB. Supported types: PDF only.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <FilePdf className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop PDF files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              (File upload simulated for demo - click "Simulate Upload" button above)
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
                  <CardDescription className="text-xs mt-1">{pdf.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">{pdf.visibility}</Badge>
                {pdf.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{(pdf.fileSize / 1024).toFixed(0)} KB</p>
                <p>{new Date(pdf.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDelete(pdf.id)} 
                className="w-full gap-2 text-destructive"
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
    </div>
  )
}
