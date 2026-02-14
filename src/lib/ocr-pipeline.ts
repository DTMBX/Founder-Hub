import { PDFMetadata } from './types'

export interface OCRFieldExtraction {
  value: string
  confidence: number
  source: 'pattern' | 'location' | 'context' | 'stamp'
  reasoning: string
  alternativeMatches?: Array<{ value: string; confidence: number }>
}

export interface OCRExtractionResult {
  extractedText: string
  extractionConfidence: number
  fields: {
    docket?: OCRFieldExtraction
    caseNumber?: OCRFieldExtraction
    courtName?: OCRFieldExtraction
    filingDate?: OCRFieldExtraction
    documentType?: OCRFieldExtraction
    parties?: OCRFieldExtraction
    judge?: OCRFieldExtraction
  }
  courtStampDetection: {
    present: boolean
    confidence: number
    region?: { x: number; y: number; width: number; height: number; page: number }
    stampType?: 'filed' | 'received' | 'certified' | 'unknown'
  }
  metadata: {
    processingTime: number
    pageCount?: number
    textDensity?: number
    documentQuality?: 'excellent' | 'good' | 'fair' | 'poor'
  }
}

export class OCRPipeline {
  private static readonly DOCKET_PATTERNS = [
    /(?:docket|case)\s*(?:no\.?|number|#)?\s*:?\s*([A-Z]{1,3}[-\s]?\d{2,4}[-\s]?\d{2,6}[-\s]?[A-Z]?)/gi,
    /([A-Z]{1,3}[-\s]?\d{2,4}[-\s]?\d{2,6})/gi,
  ]

  private static readonly DATE_PATTERNS = [
    /(?:filed|received|entered|dated)(?:\s+on)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
    /(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/gi,
  ]

  private static readonly COURT_PATTERNS = [
    /(?:in\s+the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:superior|supreme|district|circuit|appellate)\s+court/gi,
    /(?:superior|supreme|district|circuit|appellate)\s+court\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /united\s+states\s+district\s+court/gi,
  ]

  private static readonly DOCUMENT_TYPE_KEYWORDS = {
    complaint: ['complaint', 'petition', 'plaintiff'],
    motion: ['motion', 'moves', 'moving'],
    order: ['order', 'ordered', 'adjudged'],
    certification: ['certification', 'certifies', 'certified'],
    brief: ['brief', 'memorandum of law'],
    transcript: ['transcript', 'court reporter', 'proceedings'],
    exhibit: ['exhibit', 'attachment'],
    notice: ['notice of'],
    answer: ['answer', 'defendant responds'],
    opposition: ['opposition', 'response in opposition'],
  }

  private static readonly COURT_STAMP_INDICATORS = [
    'filed',
    'received',
    'clerk',
    'certified',
    'seal',
    'stamp',
  ]

  static async processDocument(
    file: File,
    options: {
      extractText?: boolean
      detectStamp?: boolean
      extractFields?: boolean
    } = {}
  ): Promise<OCRExtractionResult> {
    const startTime = Date.now()

    const extractedText = options.extractText !== false 
      ? await this.simulateTextExtraction(file) 
      : ''

    const result: OCRExtractionResult = {
      extractedText,
      extractionConfidence: 0.85,
      fields: {},
      courtStampDetection: {
        present: false,
        confidence: 0,
      },
      metadata: {
        processingTime: 0,
        documentQuality: 'good',
      },
    }

    if (options.extractFields !== false && extractedText) {
      result.fields = this.extractFields(extractedText, file.name)
    }

    if (options.detectStamp !== false && extractedText) {
      result.courtStampDetection = this.detectCourtStamp(extractedText)
    }

    result.metadata.processingTime = Date.now() - startTime
    result.metadata.textDensity = extractedText.length / 1000

    return result
  }

  private static async simulateTextExtraction(file: File): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500))

    const filename = file.name.toLowerCase()
    let text = `SUPERIOR COURT OF NEW JERSEY\nLAW DIVISION: ESSEX COUNTY\n\n`

    if (filename.includes('complaint')) {
      text += `DEVON TYLER BARBER,\n  Plaintiff,\n\nv.\n\nDocket No.: ESX-L-001234-23\n\nCIVIL ACTION\n\nCOMPLAINT\n\n`
      text += `Filed: 03/15/2023\n\nThe plaintiff hereby files this complaint...\n`
    } else if (filename.includes('motion')) {
      text += `Docket No.: ESX-L-001234-23\n\nMOTION FOR SUMMARY JUDGMENT\n\nFiled: 06/20/2023\n\n`
      text += `The moving party respectfully moves this Court...\n`
    } else if (filename.includes('order')) {
      text += `Docket No.: ESX-L-001234-23\n\nORDER\n\nEntered: 08/05/2023\n\n`
      text += `This matter having come before the Court, IT IS HEREBY ORDERED...\n`
    } else if (filename.includes('certification')) {
      text += `Docket No.: ESX-L-001234-23\n\nCERTIFICATION OF DEVON TYLER BARBER\n\n`
      text += `Filed: 05/10/2023\n\nI, Devon Tyler Barber, of full age, hereby certify...\n`
    } else {
      text += `Docket No.: ESX-L-001234-23\n\nFiled: ${new Date().toLocaleDateString()}\n\n`
      text += `[Document content extracted from ${file.name}]\n`
    }

    text += `\n[Simulated OCR extraction - In production, this would be real PDF text extraction]`

    return text
  }

  private static extractFields(
    text: string,
    filename: string
  ): OCRExtractionResult['fields'] {
    return {
      docket: this.extractDocket(text, filename),
      filingDate: this.extractFilingDate(text, filename),
      courtName: this.extractCourtName(text),
      documentType: this.extractDocumentType(text, filename),
      parties: this.extractParties(text),
      caseNumber: this.extractCaseNumber(text),
    }
  }

  private static extractDocket(text: string, filename: string): OCRFieldExtraction | undefined {
    const matches: Array<{ value: string; confidence: number; source: string }> = []

    for (const pattern of this.DOCKET_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags)
      let match
      while ((match = regex.exec(text)) !== null) {
        const value = match[1] || match[0]
        const cleanValue = value.replace(/\s+/g, '-').toUpperCase()
        
        const contextBefore = text.substring(Math.max(0, match.index - 50), match.index)
        const hasContext = /docket|case/i.test(contextBefore)
        
        matches.push({
          value: cleanValue,
          confidence: hasContext ? 0.92 : 0.75,
          source: hasContext ? 'context' : 'pattern',
        })
      }
    }

    const filenameMatch = filename.match(/([A-Z]{2,3}[-\s]?[A-Z]?[-\s]?\d{6}[-\s]?\d{2})/i)
    if (filenameMatch) {
      matches.push({
        value: filenameMatch[1].replace(/\s+/g, '-').toUpperCase(),
        confidence: 0.88,
        source: 'filename',
      })
    }

    if (matches.length === 0) return undefined

    matches.sort((a, b) => b.confidence - a.confidence)
    const best = matches[0]
    const alternatives = matches.slice(1, 3).map(m => ({ 
      value: m.value, 
      confidence: m.confidence 
    }))

    return {
      value: best.value,
      confidence: best.confidence,
      source: best.source as any,
      reasoning: best.source === 'context' 
        ? 'Found near "docket" or "case" keyword with matching pattern'
        : best.source === 'filename'
        ? 'Extracted from filename using docket pattern'
        : 'Matched docket number pattern in document text',
      alternativeMatches: alternatives.length > 0 ? alternatives : undefined,
    }
  }

  private static extractFilingDate(text: string, filename: string): OCRFieldExtraction | undefined {
    const matches: Array<{ value: string; confidence: number; source: string }> = []

    const filedPattern = /(?:filed|received|entered)(?:\s+on)?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi
    let match
    while ((match = filedPattern.exec(text)) !== null) {
      matches.push({
        value: this.normalizeDateString(match[1]),
        confidence: 0.95,
        source: 'context',
      })
    }

    const monthPattern = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/gi
    while ((match = monthPattern.exec(text)) !== null) {
      const dateStr = `${match[1]} ${match[2]}, ${match[3]}`
      matches.push({
        value: dateStr,
        confidence: 0.88,
        source: 'pattern',
      })
    }

    const genericDatePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g
    let genericCount = 0
    while ((match = genericDatePattern.exec(text)) !== null && genericCount < 3) {
      matches.push({
        value: this.normalizeDateString(match[1]),
        confidence: 0.65,
        source: 'pattern',
      })
      genericCount++
    }

    if (matches.length === 0) return undefined

    matches.sort((a, b) => b.confidence - a.confidence)
    const best = matches[0]
    const alternatives = matches.slice(1, 3).map(m => ({ 
      value: m.value, 
      confidence: m.confidence 
    }))

    return {
      value: best.value,
      confidence: best.confidence,
      source: best.source as any,
      reasoning: best.source === 'context'
        ? 'Found next to "filed", "received", or "entered" keyword'
        : 'Matched date pattern in document',
      alternativeMatches: alternatives.length > 0 ? alternatives : undefined,
    }
  }

  private static extractCourtName(text: string): OCRFieldExtraction | undefined {
    const matches: Array<{ value: string; confidence: number }> = []

    for (const pattern of this.COURT_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags)
      let match
      while ((match = regex.exec(text)) !== null) {
        const value = match[0].trim()
        const isAtTop = match.index < 500
        matches.push({
          value,
          confidence: isAtTop ? 0.92 : 0.78,
        })
      }
    }

    if (matches.length === 0) return undefined

    matches.sort((a, b) => b.confidence - a.confidence)
    const best = matches[0]

    return {
      value: best.value,
      confidence: best.confidence,
      source: 'pattern',
      reasoning: best.confidence > 0.85
        ? 'Court name found in header area with standard format'
        : 'Court name matched standard pattern',
    }
  }

  private static extractDocumentType(text: string, filename: string): OCRFieldExtraction | undefined {
    const lowerText = text.toLowerCase()
    const lowerFilename = filename.toLowerCase()

    const scores: Array<{ type: string; confidence: number; source: string }> = []

    for (const [docType, keywords] of Object.entries(this.DOCUMENT_TYPE_KEYWORDS)) {
      let textScore = 0
      let filenameScore = 0

      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          const firstOccurrence = lowerText.indexOf(keyword)
          if (firstOccurrence < 500) {
            textScore = Math.max(textScore, 0.90)
          } else if (firstOccurrence < 1500) {
            textScore = Math.max(textScore, 0.75)
          } else {
            textScore = Math.max(textScore, 0.60)
          }
        }

        if (lowerFilename.includes(keyword)) {
          filenameScore = Math.max(filenameScore, 0.85)
        }
      }

      if (textScore > 0) {
        scores.push({
          type: docType.charAt(0).toUpperCase() + docType.slice(1),
          confidence: textScore,
          source: 'text',
        })
      }

      if (filenameScore > 0) {
        scores.push({
          type: docType.charAt(0).toUpperCase() + docType.slice(1),
          confidence: filenameScore,
          source: 'filename',
        })
      }
    }

    if (scores.length === 0) return undefined

    scores.sort((a, b) => b.confidence - a.confidence)
    const best = scores[0]
    const alternatives = scores.slice(1, 3)
      .filter(s => s.type !== best.type)
      .map(s => ({ value: s.type, confidence: s.confidence }))

    return {
      value: best.type,
      confidence: best.confidence,
      source: best.source as any,
      reasoning: best.source === 'text'
        ? `Document type keywords found in text content`
        : `Document type detected from filename`,
      alternativeMatches: alternatives.length > 0 ? alternatives : undefined,
    }
  }

  private static extractParties(text: string): OCRFieldExtraction | undefined {
    const vsPattern = /([A-Z][A-Z\s,\.]+)\s+(?:v\.|vs\.|versus)\s+([A-Z][A-Z\s,\.]+)/i
    const match = text.match(vsPattern)

    if (!match) return undefined

    const plaintiff = match[1].trim()
    const defendant = match[2].trim()
    const value = `${plaintiff} v. ${defendant}`

    return {
      value,
      confidence: 0.82,
      source: 'pattern',
      reasoning: 'Party names extracted using v./vs./versus pattern',
    }
  }

  private static extractCaseNumber(text: string): OCRFieldExtraction | undefined {
    const caseNumPattern = /case\s+(?:no\.?|number)\s*:?\s*(\d{1,2}[-\s]?[A-Z]{2,4}[-\s]?\d{4,6})/gi
    const match = caseNumPattern.exec(text)

    if (!match) return undefined

    return {
      value: match[1].trim(),
      confidence: 0.85,
      source: 'pattern',
      reasoning: 'Case number found with "case no." or "case number" label',
    }
  }

  private static detectCourtStamp(text: string): OCRExtractionResult['courtStampDetection'] {
    const lowerText = text.toLowerCase()
    let stampScore = 0
    let stampType: 'filed' | 'received' | 'certified' | 'unknown' = 'unknown'

    for (const indicator of this.COURT_STAMP_INDICATORS) {
      if (lowerText.includes(indicator)) {
        stampScore += 0.25
        
        if (indicator === 'filed' && stampType === 'unknown') {
          stampType = 'filed'
        } else if (indicator === 'received' && stampType === 'unknown') {
          stampType = 'received'
        } else if (indicator === 'certified' && stampType === 'unknown') {
          stampType = 'certified'
        }
      }
    }

    const dateNearStamp = /(?:filed|received).*?\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i.test(text)
    if (dateNearStamp) {
      stampScore += 0.3
    }

    const present = stampScore > 0.4
    const confidence = Math.min(stampScore, 1.0)

    return {
      present,
      confidence: present ? confidence : 0,
      stampType: present ? stampType : undefined,
      region: present ? { x: 50, y: 50, width: 200, height: 100, page: 0 } : undefined,
    }
  }

  private static normalizeDateString(dateStr: string): string {
    const parts = dateStr.split(/[\/\-]/)
    if (parts.length === 3) {
      const [month, day, year] = parts
      const fullYear = year.length === 2 ? `20${year}` : year
      return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${fullYear}`
    }
    return dateStr
  }

  static getConfidenceLevel(confidence: number): {
    level: 'high' | 'medium' | 'low'
    color: string
    label: string
  } {
    if (confidence >= 0.85) {
      return { level: 'high', color: 'text-green-400', label: 'High Confidence' }
    } else if (confidence >= 0.65) {
      return { level: 'medium', color: 'text-yellow-400', label: 'Medium Confidence' }
    } else {
      return { level: 'low', color: 'text-orange-400', label: 'Low Confidence' }
    }
  }
}
