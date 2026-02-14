import { 
  DocumentAnalysis, 
  CaseAnalysis, 
  PDFAsset, 
  Case,
  ProceduralSignal,
  KeyDate,
  KeyEntity,
  TimelineHighlight,
  FilingChecklist
} from './types'

export class AnalysisGenerator {
  static async generateDocumentAnalysis(
    doc: PDFAsset,
    extractedText: string
  ): Promise<DocumentAnalysis> {
    const prompt = `You are a legal document analyst. Analyze the following court document and extract structured information.

Document Title: ${doc.title}
Document Type: ${doc.documentType || 'Unknown'}
Filing Date: ${doc.filingDate || 'Unknown'}
Extracted Text (first 3000 chars):
${extractedText.substring(0, 3000)}

Provide a structured analysis including:
1. A brief neutral summary (2-3 sentences)
2. Procedural signals (motion type, relief requested, deadlines, etc.)
3. Key dates mentioned in the document
4. Key entities (judges, attorneys, parties)
5. Legal issues or claims identified
6. Suggested tags for categorization
7. Questions an attorney should investigate
8. Any missing context or unclear elements

Return your response as a JSON object with the following structure:
{
  "summary": "Brief 2-3 sentence summary",
  "proceduralSignals": [{"type": "motion_type|relief_requested|hearing_scheduled|etc", "value": "description", "confidence": 0.0-1.0, "sourceSnippet": "relevant text"}],
  "keyDates": [{"date": "YYYY-MM-DD", "label": "description", "confidence": 0.0-1.0, "sourceSnippet": "relevant text"}],
  "keyEntities": [{"name": "name", "role": "judge|attorney|party|witness|expert", "confidence": 0.0-1.0}],
  "issues": ["issue 1", "issue 2"],
  "suggestedTags": ["tag1", "tag2"],
  "questionsForCounsel": ["question 1", "question 2"],
  "missingContextFlags": ["flag 1", "flag 2"]
}`

    try {
      const response = await window.spark.llm(prompt, 'gpt-4o', true)
      const parsed = JSON.parse(response)

      const analysis: DocumentAnalysis = {
        id: `analysis_${doc.id}_${Date.now()}`,
        docId: doc.id,
        version: 1,
        generatedAt: Date.now(),
        confidence: 0.75,
        summary: parsed.summary || 'No summary generated',
        proceduralSignals: (parsed.proceduralSignals || []).map((s: any) => ({
          type: s.type || 'other',
          value: s.value || '',
          confidence: s.confidence || 0.5,
          sourceSnippet: s.sourceSnippet
        })),
        keyDates: (parsed.keyDates || []).map((d: any) => ({
          date: d.date || '',
          label: d.label || '',
          confidence: d.confidence || 0.5,
          sourceSnippet: d.sourceSnippet
        })),
        keyEntities: (parsed.keyEntities || []).map((e: any) => ({
          name: e.name || '',
          role: e.role || 'other',
          confidence: e.confidence || 0.5
        })),
        issues: parsed.issues || [],
        suggestedTags: parsed.suggestedTags || [],
        questionsForCounsel: parsed.questionsForCounsel || [],
        missingContextFlags: parsed.missingContextFlags || [],
        status: 'draft'
      }

      return analysis
    } catch (error) {
      console.error('Error generating document analysis:', error)
      throw new Error('Failed to generate document analysis')
    }
  }

  static async generateCaseAnalysis(
    caseData: Case,
    documents: PDFAsset[],
    documentAnalyses: DocumentAnalysis[]
  ): Promise<CaseAnalysis> {
    const docSummaries = documentAnalyses
      .map(a => `- ${documents.find(d => d.id === a.docId)?.title || 'Unknown'}: ${a.summary}`)
      .join('\n')

    const prompt = `You are a legal case analyst. Analyze the following case and its documents to provide a comprehensive case brief for attorney review.

Case Title: ${caseData.title}
Docket: ${caseData.docket}
Court: ${caseData.court}
Status: ${caseData.status}
Case Summary: ${caseData.summary}

Document Analyses:
${docSummaries}

Provide a structured case analysis including:
1. Procedural posture summary (current status and how we got here)
2. Timeline highlights (major events with significance)
3. Key filings checklist (which filing types are present)
4. Missing documents checklist (what should be obtained)
5. Questions for counsel to investigate
6. Damages/injuries analysis (if relevant)
7. Key evidence highlights

Return your response as a JSON object with the following structure:
{
  "postureSummary": "Current procedural status",
  "proceduralPosture": "Detailed posture explanation",
  "timelineHighlights": [{"date": "YYYY-MM-DD", "event": "event description", "significance": "why this matters"}],
  "keyFilingsChecklist": [{"filingType": "Complaint|Motion|Order|etc", "present": true|false, "notes": "additional context"}],
  "missingDocsChecklist": ["doc type 1", "doc type 2"],
  "counselQuestions": ["question 1", "question 2"],
  "damagesInjuriesAnalysis": "Analysis of damages or injuries claimed",
  "keyEvidenceHighlights": ["evidence item 1", "evidence item 2"]
}`

    try {
      const response = await window.spark.llm(prompt, 'gpt-4o', true)
      const parsed = JSON.parse(response)

      const analysis: CaseAnalysis = {
        id: `case_analysis_${caseData.id}_${Date.now()}`,
        caseId: caseData.id,
        version: 1,
        generatedAt: Date.now(),
        postureSummary: parsed.postureSummary || 'No posture summary available',
        proceduralPosture: parsed.proceduralPosture || parsed.postureSummary || '',
        timelineHighlights: (parsed.timelineHighlights || []).map((h: any) => ({
          date: h.date || '',
          event: h.event || '',
          significance: h.significance || '',
          linkedDocId: undefined
        })),
        keyFilingsChecklist: (parsed.keyFilingsChecklist || []).map((c: any) => ({
          filingType: c.filingType || '',
          present: c.present !== false,
          notes: c.notes
        })),
        missingDocsChecklist: parsed.missingDocsChecklist || [],
        counselQuestions: parsed.counselQuestions || [],
        damagesInjuriesAnalysis: parsed.damagesInjuriesAnalysis,
        keyEvidenceHighlights: parsed.keyEvidenceHighlights || [],
        adminReviewStatus: 'draft',
        visibility: 'private'
      }

      return analysis
    } catch (error) {
      console.error('Error generating case analysis:', error)
      throw new Error('Failed to generate case analysis')
    }
  }

  static getConfidenceColor(confidence: number): string {
    if (confidence >= 0.85) return 'text-green-400 bg-green-400/10 border-green-400/30'
    if (confidence >= 0.65) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
    return 'text-orange-400 bg-orange-400/10 border-orange-400/30'
  }

  static getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.85) return 'High Confidence'
    if (confidence >= 0.65) return 'Medium Confidence'
    return 'Low Confidence'
  }

  static getStatusColor(status: 'none' | 'draft' | 'reviewed' | 'published'): string {
    switch (status) {
      case 'none': return 'text-muted-foreground bg-muted border-border'
      case 'draft': return 'text-orange-400 bg-orange-400/10 border-orange-400/30'
      case 'reviewed': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'published': return 'text-green-400 bg-green-400/10 border-green-400/30'
    }
  }

  static getStatusLabel(status: 'none' | 'draft' | 'reviewed' | 'published'): string {
    switch (status) {
      case 'none': return 'No Analysis'
      case 'draft': return 'Draft - Unreviewed'
      case 'reviewed': return 'Reviewed'
      case 'published': return 'Published'
    }
  }
}
