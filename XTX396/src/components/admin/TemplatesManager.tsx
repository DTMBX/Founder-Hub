import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ClipboardText, CheckCircle, Info } from '@phosphor-icons/react'
import { 
  DEFAULT_REVIEW_NOTES_TEMPLATES, 
  DEFAULT_CONTINGENCY_CHECKLIST_TEMPLATES,
  ReviewNotesTemplate,
  ContingencyChecklistTemplate
} from '@/lib/templates'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

export default function TemplatesManager() {
  const [selectedReviewTemplate, setSelectedReviewTemplate] = useState<ReviewNotesTemplate | null>(null)
  const [selectedChecklistTemplate, setSelectedChecklistTemplate] = useState<ContingencyChecklistTemplate | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Case Review Templates</h2>
        <p className="text-muted-foreground">
          Pre-configured templates for attorney review notes and contingency evaluation checklists.
        </p>
      </div>

      <Tabs defaultValue="review-notes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review-notes">Review Notes Templates</TabsTrigger>
          <TabsTrigger value="checklists">Contingency Checklists</TabsTrigger>
        </TabsList>

        <TabsContent value="review-notes" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardText className="h-5 w-5" />
                Attorney Review Notes Templates
              </CardTitle>
              <CardDescription>
                Templates provide structured starting points for documenting case details, evidence, and evaluation notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEFAULT_REVIEW_NOTES_TEMPLATES.map(template => (
                <Card key={template.id} className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          {template.id === 'template-blank' && (
                            <Badge variant="outline" className="text-xs">Empty</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {template.template.damagesInjuries && (
                            <Badge variant="secondary">Damages/Injuries</Badge>
                          )}
                          {template.template.keyEvidenceSources && (
                            <Badge variant="secondary">Evidence Sources</Badge>
                          )}
                          {template.template.deadlinesLimitations && (
                            <Badge variant="secondary">Deadlines</Badge>
                          )}
                          {template.template.reliefSought && (
                            <Badge variant="secondary">Relief Sought</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReviewTemplate(template)}
                      >
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">How to use templates</p>
                    <p>
                      When editing a case in Court Manager, navigate to the <strong>Review</strong> tab and select "Apply Template" 
                      to populate review notes with a structured starting point. All fields remain editable after applying a template.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklists" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Contingency Evaluation Checklists
              </CardTitle>
              <CardDescription>
                Structured checklists help attorneys systematically evaluate case merit and contingency fit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEFAULT_CONTINGENCY_CHECKLIST_TEMPLATES.map(template => (
                <Card key={template.id} className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{template.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {template.items.length} {template.items.length === 1 ? 'item' : 'items'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {template.description}
                        </p>
                        {template.items.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Sample items:</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5 ml-4">
                              {template.items.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="list-disc">{item.label}</li>
                              ))}
                              {template.items.length > 3 && (
                                <li className="list-none italic">+ {template.items.length - 3} more...</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedChecklistTemplate(template)}
                      >
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">How to use checklists</p>
                    <p>
                      When editing a case in Court Manager, navigate to the <strong>Checklist</strong> tab and select "Apply template" 
                      to populate the contingency checklist. Each item can be checked off and annotated as you evaluate the case.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedReviewTemplate} onOpenChange={() => setSelectedReviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedReviewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedReviewTemplate && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedReviewTemplate.description}</p>
              
              <Separator />

              <div className="space-y-4">
                {selectedReviewTemplate.template.damagesInjuries && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Damages/Injuries</h4>
                    <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                      {selectedReviewTemplate.template.damagesInjuries}
                    </div>
                  </div>
                )}

                {selectedReviewTemplate.template.keyEvidenceSources && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Key Evidence Sources</h4>
                    <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                      {selectedReviewTemplate.template.keyEvidenceSources}
                    </div>
                  </div>
                )}

                {selectedReviewTemplate.template.deadlinesLimitations && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Deadlines/Limitations</h4>
                    <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                      {selectedReviewTemplate.template.deadlinesLimitations}
                    </div>
                  </div>
                )}

                {selectedReviewTemplate.template.reliefSought && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Relief Sought</h4>
                    <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                      {selectedReviewTemplate.template.reliefSought}
                    </div>
                  </div>
                )}

                {selectedReviewTemplate.template.notes && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Additional Notes</h4>
                    <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
                      {selectedReviewTemplate.template.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedChecklistTemplate} onOpenChange={() => setSelectedChecklistTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedChecklistTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedChecklistTemplate && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedChecklistTemplate.description}</p>
              
              <Separator />

              {selectedChecklistTemplate.items.length > 0 ? (
                <div className="space-y-3">
                  {selectedChecklistTemplate.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-md">
                      <CheckCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.label}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>This is an empty template. Add custom checklist items as needed.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
