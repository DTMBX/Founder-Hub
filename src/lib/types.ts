export type UserRole = 'owner' | 'editor' | 'viewer'

export interface User {
  id: string
  email: string
  role: UserRole
  twoFactorEnabled: boolean
  createdAt: number
}

export interface Session {
  userId: string
  expiresAt: number
}

export interface SiteSettings {
  siteName: string
  tagline: string
  description: string
  primaryDomain: string
  domainRedirects: string[]
  socialPreviewImage?: string
  analyticsEnabled: boolean
  indexingEnabled: boolean
  investorModeAvailable: boolean
  motionLevel?: 'full' | 'reduced' | 'off'
  glassIntensity?: 'low' | 'medium' | 'high'
  gradientUsage?: 'off' | 'accent' | 'enhanced'
  contrastMode?: 'standard' | 'extra'
}

export type SectionType = 'hero' | 'projects' | 'now' | 'court' | 'proof' | 'contact'

export interface Section {
  id: string
  type: SectionType
  title: string
  content: string
  order: number
  enabled: boolean
  investorRelevant: boolean
}

export interface Link {
  id: string
  label: string
  url: string
  icon?: string
  category: string
  order: number
}

export interface Project {
  id: string
  title: string
  summary: string
  description: string
  tags: string[]
  techStack: string[]
  links: ProjectLink[]
  heroMedia?: {
    type: 'image' | 'video'
    url: string
  }
  order: number
  enabled: boolean
  featured: boolean
  status: 'active' | 'paused' | 'archived'
  customization?: {
    icon?: string
    accentColor?: string
    badgeText?: string
  }
  createdAt: number
  updatedAt: number
}

export interface ProjectLink {
  label: string
  url: string
  type: 'repo' | 'demo' | 'docs' | 'other'
}

export type CaseStatus = 'active' | 'settled' | 'pending' | 'closed' | 'dismissed'
export type CaseVisibility = 'public' | 'unlisted' | 'private'

export interface ReviewNotes {
  damagesInjuries?: string
  keyEvidenceSources?: string
  deadlinesLimitations?: string
  reliefSought?: string
  notes?: string
}

export interface ContingencyChecklistItem {
  id: string
  label: string
  checked: boolean
  notes?: string
}

export interface Case {
  id: string
  title: string
  docket: string
  court: string
  jurisdiction?: string
  parties?: string
  stage: string
  status: CaseStatus
  dateRange: string
  filingDate?: string
  lastUpdate?: string
  summary: string
  description: string
  tags: string[]
  order: number
  visibility: CaseVisibility
  featured: boolean
  featuredDocIds?: string[]
  sourceNotes?: string
  timeline?: TimelineEvent[]
  overview?: string
  publicDisclosureOverride?: string
  reviewNotes?: ReviewNotes
  contingencyChecklist?: ContingencyChecklistItem[]
  lastUpdated: number
  createdAt: number
}

export interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  order: number
}

export type PDFVisibility = 'public' | 'unlisted' | 'private'
export type PDFStage = 'staging' | 'published' | 'archived'
export type OCRStatus = 'none' | 'pending' | 'completed' | 'failed'

export interface DocumentType {
  id: string
  name: string
  defaultToken: string
  defaultVisibility: PDFVisibility
  color?: string
  order: number
}

export interface PDFMetadata {
  originalFilename: string
  displayFilename?: string
  checksum: string
  fileCreationDate?: string
  fileModDate?: string
  dimensions?: { width: number; height: number }
  extractedText?: string
  extractionConfidence?: number
  courtStampPresent?: boolean
  courtStampRegion?: { x: number; y: number; width: number; height: number; page: number }
  suggestedDocType?: string
  suggestedDocTypeConfidence?: number
  suggestedFilingDate?: string
  suggestedFilingDateConfidence?: number
  suggestedDocket?: string
  suggestedDocketConfidence?: number
}

export interface PDFAsset {
  id: string
  fileUrl: string
  title: string
  description: string
  caseId?: string
  documentType?: string
  filingDate?: string
  tags: string[]
  visibility: PDFVisibility
  stage: PDFStage
  featured: boolean
  fileSize: number
  pageCount?: number
  ocrStatus: OCRStatus
  metadata: PDFMetadata
  sourceNotes?: string
  orderInCase?: number
  shareToken?: string
  createdAt: number
  updatedAt: number
  uploadedBy?: string
}

export interface UploadQueueItem {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'paused'
  progress: number
  checksum?: string
  validationErrors?: string[]
  metadata?: Partial<PDFMetadata>
  stagingData?: Partial<PDFAsset>
}

export interface PageViewEvent {
  timestamp: number
  path: string
  referrer?: string
  section?: string
}

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'create_project'
  | 'update_project'
  | 'delete_project'
  | 'duplicate_project'
  | 'archive_project'
  | 'create_case'
  | 'update_case'
  | 'delete_case'
  | 'upload_pdf'
  | 'batch_upload_pdf'
  | 'update_pdf'
  | 'delete_pdf'
  | 'stage_pdf'
  | 'publish_pdf'
  | 'apply_naming_rules'
  | 'run_ocr'
  | 'extract_metadata'
  | 'optimize_pdf'
  | 'bulk_action'
  | 'update_settings'
  | 'update_theme'
  | 'publish_changes'
  | 'update_section'
  | 'create_document_type'
  | 'update_document_type'

export interface AuditEvent {
  id: string
  userId: string
  userEmail: string
  action: AuditAction
  details: string
  entityType?: string
  entityId?: string
  metadata?: {
    inputs?: any
    outputs?: any
    errors?: string[]
  }
  timestamp: number
}

export interface NamingRule {
  id: string
  name: string
  template: string
  tokens: string[]
  enabled: boolean
  order: number
}

export interface BulkAction {
  id: string
  type: 'rename' | 'reorder' | 'extract_metadata' | 'run_ocr' | 'optimize' | 'assign_case' | 'set_visibility' | 'add_tags'
  status: 'pending' | 'running' | 'completed' | 'failed'
  targetIds: string[]
  parameters: Record<string, any>
  results?: {
    success: number
    failed: number
    errors?: string[]
  }
  startedAt?: number
  completedAt?: number
  createdBy: string
}

export interface ThemeSettings {
  background: string
  foreground: string
  card: string
  cardForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  ring: string
  radius: number
}

export interface ContentDraft {
  entityType: string
  entityId: string
  content: any
  lastSaved: number
}
