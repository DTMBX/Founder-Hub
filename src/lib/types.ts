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
  order: number
  enabled: boolean
  featured: boolean
}

export interface ProjectLink {
  label: string
  url: string
  type: 'repo' | 'demo' | 'docs' | 'other'
}

export type CaseStatus = 'active' | 'settled' | 'pending' | 'closed' | 'dismissed'
export type CaseVisibility = 'public' | 'unlisted' | 'private'

export interface Case {
  id: string
  title: string
  docket: string
  court: string
  stage: string
  dateRange: string
  summary: string
  description: string
  tags: string[]
  status: CaseStatus
  order: number
  visibility: CaseVisibility
  featured: boolean
  sourceNotes?: string
  timeline?: TimelineEvent[]
  lastUpdated: number
}

export interface TimelineEvent {
  date: string
  description: string
}

export type PDFVisibility = 'public' | 'unlisted' | 'private'

export interface PDFAsset {
  id: string
  fileUrl: string
  title: string
  description: string
  caseId?: string
  tags: string[]
  visibility: PDFVisibility
  featured: boolean
  fileSize: number
  pageCount?: number
  sourceNotes?: string
  createdAt: number
  updatedAt: number
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
  | 'create_case'
  | 'update_case'
  | 'delete_case'
  | 'upload_pdf'
  | 'update_pdf'
  | 'delete_pdf'
  | 'update_settings'
  | 'update_theme'
  | 'publish_changes'
  | 'update_section'

export interface AuditEvent {
  id: string
  userId: string
  userEmail: string
  action: AuditAction
  details: string
  entityType?: string
  entityId?: string
  timestamp: number
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
