/**
 * User roles hierarchy (highest to lowest):
 * - owner: Full system access, production deploys, user management
 * - admin: Operations + deploy to preview/staging, no prod deploys
 * - editor: Content editing only, no destructive actions
 * - support: Read-only + ticket notes, no edits
 */
export type UserRole = 'owner' | 'admin' | 'editor' | 'support'

export interface User {
  id: string
  email: string
  passwordHash: string
  passwordSalt?: string          // PBKDF2 salt — absent = legacy SHA-256
  role: UserRole
  twoFactorEnabled?: boolean
  twoFactorSecret?: string       // AES-256-GCM encrypted ('enc:' prefix)
  twoFactorBackupCodes?: string[]
  // Hardware keyfile authentication
  keyfileEnabled?: boolean       // Require keyfile for login
  keyfileHash?: string           // Hash of keyfile secret for verification
  keyfileId?: string             // ID of active keyfile
  // Account status
  requiresPasswordChange?: boolean // Force password change on next login
  lastLogin: number
  createdAt: number
}

export interface Session {
  userId: string
  expiresAt: number
}

export interface HeroMediaSettings {
  videoUrl?: string
  posterUrl?: string
  overlayIntensity: number
  vignetteEnabled: boolean
  textAlignment: 'left' | 'center'
  headlineText: string
  subheadText: string
  ctaPrimary?: { label: string; url: string }
  ctaSecondary?: { label: string; url: string }
  motionMode: 'full' | 'reduced' | 'off'
  autoContrast: boolean
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
  heroMedia?: HeroMediaSettings
  // Stripe Integration
  stripePublishableKey?: string
  stripeEnabled?: boolean
  stripeSuccessUrl?: string
  stripeCancelUrl?: string
}

export type SectionType = 'hero' | 'projects' | 'now' | 'court' | 'proof' | 'contact' | 'about' | 'offerings'

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

// ─── Offerings / Mercantile ───────────────────────────────────

export type OfferingCategory = 'digital' | 'service' | 'whitelabel' | 'subscription' | 'barter'
export type OfferingPricing = 'free' | 'paid' | 'donation' | 'contact' | 'trade'
export type OfferingVisibility = 'public' | 'unlisted' | 'private'

export interface OfferingPriceTier {
  id: string
  name: string
  price: number // in cents, 0 for free
  currency: 'USD' | 'EUR' | 'GBP'
  description?: string
  features?: string[]
  stripePaymentLink?: string // Direct payment link (recommended for static sites)
  stripeProductId?: string // Stripe Product ID (e.g., prod_xxx)
  stripePriceId?: string // Stripe Price ID for Checkout API (e.g., price_xxx)
  isRecurring?: boolean
  recurringInterval?: 'month' | 'year'
}

export interface Offering {
  id: string
  title: string
  slug: string
  summary: string
  description: string
  category: OfferingCategory
  pricingType: OfferingPricing
  priceTiers: OfferingPriceTier[]
  donationSuggestions?: number[] // suggested donation amounts in cents
  gratuityEnabled?: boolean
  tags: string[]
  icon?: string
  coverImage?: string
  gallery?: string[]
  deliverables?: string[]
  includes?: string[]
  requirements?: string
  turnaround?: string
  featured: boolean
  order: number
  visibility: OfferingVisibility
  externalUrl?: string // link to external checkout/landing page
  downloadUrl?: string // for digital products
  contactCTA?: string // custom contact button text
  stripeProductId?: string
  createdAt: number
  updatedAt: number
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

export interface FilingType {
  id: string
  name: string
  sortOrder: number
  defaultNamingToken: string
  icon?: string
  color?: string
  defaultVisibility?: PDFVisibility
  createdAt: number
  updatedAt: number
}

export interface ExtractedField {
  value: string
  confidence: number
  source: 'pattern' | 'location' | 'context' | 'stamp' | 'filename'
  reasoning: string
  sourceSnippet?: string
  pageNumber?: number
  alternativeMatches?: Array<{ value: string; confidence: number }>
}

export interface ProceduralSignal {
  type: 'motion_type' | 'relief_requested' | 'hearing_scheduled' | 'deadline_set' | 'order_entered' | 'service_required' | 'response_due' | 'other'
  value: string
  confidence: number
  sourceSnippet?: string
  pageNumber?: number
}

export interface KeyDate {
  date: string
  label: string
  confidence: number
  sourceSnippet?: string
  pageNumber?: number
}

export interface KeyEntity {
  name: string
  role: 'judge' | 'attorney' | 'party' | 'witness' | 'expert' | 'clerk' | 'other'
  confidence: number
}

export type AnalysisStatus = 'none' | 'draft' | 'reviewed' | 'published'

export interface DocumentAnalysis {
  id: string
  docId: string
  version: number
  generatedAt: number
  confidence: number
  summary: string
  proceduralSignals: ProceduralSignal[]
  keyDates: KeyDate[]
  keyEntities: KeyEntity[]
  issues: string[]
  suggestedTags: string[]
  questionsForCounsel: string[]
  missingContextFlags: string[]
  adminReviewedBy?: string
  adminReviewedAt?: number
  adminNotes?: string
  status: AnalysisStatus
  previousVersionId?: string
}

export interface TimelineHighlight {
  date: string
  event: string
  significance: string
  linkedDocId?: string
}

export interface FilingChecklist {
  filingType: string
  present: boolean
  docIds?: string[]
  notes?: string
}

export interface CaseAnalysis {
  id: string
  caseId: string
  version: number
  generatedAt: number
  postureSummary: string
  timelineHighlights: TimelineHighlight[]
  keyFilingsChecklist: FilingChecklist[]
  missingDocsChecklist: string[]
  counselQuestions: string[]
  damagesInjuriesAnalysis?: string
  keyEvidenceHighlights?: string[]
  proceduralPosture: string
  adminReviewStatus: AnalysisStatus
  adminReviewedBy?: string
  adminReviewedAt?: number
  adminNotes?: string
  visibility: CaseVisibility
  previousVersionId?: string
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
  filingTypeId?: string
  filingDate?: string
  filingDateConfirmed: boolean
  tags: string[]
  visibility: PDFVisibility
  stage: PDFStage
  featured: boolean
  fileSize: number
  pageCount?: number
  ocrStatus: OCRStatus
  ocrTextRef?: string
  extractedFields?: {
    docket?: ExtractedField
    filingDate?: ExtractedField
    courtName?: ExtractedField
    documentType?: ExtractedField
    parties?: ExtractedField
    caseNumber?: ExtractedField
  }
  metadata: PDFMetadata
  sourceNotes?: string
  orderInCase?: number
  shareToken?: string
  analysisStatus: AnalysisStatus
  notesVisibility: CaseVisibility
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
  | 'login_failed'
  | 'login_2fa_required'
  | 'login_2fa_failed'
  | 'password_changed'
  | 'password_change_failed'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'backup_code_used'
  | 'backup_codes_regenerated'
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
  | 'create_offering'
  | 'update_offering'
  | 'delete_offering'
  | 'password_migrated'
  | 'login_keyfile_required'
  | 'login_keyfile_failed'
  | 'backup_code_failed'
  | 'recovery_phrase_used'
  | 'recovery_phrase_failed'
  | 'keyfile_setup_failed'
  | 'keyfile_enabled'
  | 'keyfile_disabled'
  // Archive/Restore actions (Chain A4)
  | 'archive_site'
  | 'archive_satellite'
  | 'archive_document'
  | 'archive_case'
  | 'archive_offering'
  | 'restore_site'
  | 'restore_satellite'
  | 'restore_document'
  | 'restore_project'
  | 'restore_case'
  | 'restore_offering'
  | 'permanent_delete_site'
  | 'permanent_delete_satellite'
  | 'permanent_delete_document'
  | 'permanent_delete_project'
  | 'permanent_delete_case'
  | 'permanent_delete_offering'
  | 'archive_cleanup'
  | 'destructive_action_confirmed'

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

// ─── Investor Section ─────────────────────────────────────────

export interface InvestorMetric {
  id: string
  label: string
  value: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: string
  order: number
}

export interface InvestorMilestone {
  id: string
  date: string
  title: string
  description?: string
  status: 'completed' | 'in-progress' | 'upcoming'
  order: number
}

export interface InvestorDocument {
  id: string
  title: string
  description?: string
  type: 'pitch-deck' | 'executive-summary' | 'financials' | 'one-pager' | 'media-kit' | 'other'
  url: string
  fileSize?: string
  updatedAt: number
  order: number
}

export interface InvestorFAQ {
  id: string
  question: string
  answer: string
  order: number
}

export interface InvestmentTier {
  id: string
  name: string
  minAmount: number
  maxAmount?: number
  equity?: string
  perks: string[]
  available: boolean
  order: number
}

export interface InvestorData {
  // Section visibility (auto-hide if empty)
  pitchVideoUrl?: string
  pitchVideoThumbnail?: string
  
  // Traction Metrics
  metrics: InvestorMetric[]
  
  // Roadmap / Milestones
  milestones: InvestorMilestone[]
  
  // Downloadable Documents
  documents: InvestorDocument[]
  
  // FAQ
  faqs: InvestorFAQ[]
  
  // Investment Opportunity
  investmentTiers: InvestmentTier[]
  raisingAmount?: number
  raisingCurrency?: 'USD' | 'EUR' | 'GBP'
  useOfFunds?: string
  expectedROI?: string
  
  // Calendar / Meeting
  calendlyUrl?: string
  meetingCTA?: string
  
  // Contact
  investorEmail?: string
  investorPhone?: string
}

// ─── Multi-Site Management ──────────────────────────────────────

export interface SatelliteApp {
  id: string
  name: string
  path: string           // Relative path within worktree (e.g., "apps/civics-hierarchy")
  dataPath: string       // Data folder path (e.g., "/public/data")
  enabled: boolean
  description?: string
  archived?: boolean     // Soft delete flag
  archivedAt?: string    // ISO timestamp of archive
}

export interface ManagedSite {
  id: string
  name: string
  description?: string
  repo: string           // GitHub repo (e.g., "DTMBX/EVIDENT")
  dataPath: string       // Data folder path (e.g., "/public/data")
  localPath: string      // Local filesystem path
  type: 'primary' | 'worktree'
  enabled: boolean
  satellites?: SatelliteApp[]
  archived?: boolean     // Soft delete flag
  archivedAt?: string    // ISO timestamp of archive
  archivedBy?: string    // Who archived it
  archiveReason?: string // Why it was archived
}

export interface SitesConfig {
  sites: ManagedSite[]
  activeSiteId: string
}

// ─── Law Firm Case Display (Client Showcase) ─────────────────

export interface CaseResult {
  id: string
  title: string
  practiceArea: string
  resultType: 'verdict' | 'settlement' | 'dismissal' | 'acquittal' | 'award' | 'other'
  amount?: number                // in cents
  currency?: 'USD' | 'EUR' | 'GBP'
  date: string                   // ISO date
  court?: string
  jurisdiction?: string
  summary: string
  description?: string
  isConfidential?: boolean       // suppress amount, show "Confidential" 
  featured: boolean
  order: number
  tags: string[]
}

export interface AttorneyProfile {
  id: string
  name: string
  title: string                  // e.g., "Partner", "Senior Associate"
  barNumber?: string
  jurisdictions: string[]
  practiceAreas: string[]
  education: Array<{ school: string; degree: string; year?: string }>
  bio: string
  photoUrl?: string
  email?: string
  phone?: string
  linkedIn?: string
  featured: boolean
  order: number
}

export interface PracticeArea {
  id: string
  name: string
  slug: string
  icon?: string
  description: string
  keyPoints: string[]
  caseResultIds?: string[]       // link to CaseResult entries
  order: number
}

export interface ClientTestimonial {
  id: string
  clientName: string             // or "Anonymous"
  clientTitle?: string
  quote: string
  rating?: number                // 1-5
  practiceArea?: string
  date?: string
  featured: boolean
  order: number
}

// Law firm blog / insights for SEO and content marketing
export interface LawFirmBlogPost {
  id: string
  title: string
  slug: string
  author: string                 // attorney id or name
  practiceArea?: string
  content: string                // markdown or HTML
  excerpt: string
  featuredImageUrl?: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string           // ISO date
  createdAt: string
  updatedAt: string
  seoTitle?: string
  seoDescription?: string
  order: number
}

// Contact / intake form submissions log
export interface LawFirmIntakeSubmission {
  id: string
  fields: Record<string, string> // field id → value
  submittedAt: string
  ipHash?: string                // hashed for audit, not PII
  status: 'new' | 'reviewed' | 'contacted' | 'converted' | 'dismissed'
  assignedTo?: string            // attorney id
  notes?: string
}

// SEO configuration per page
export interface LawFirmSEOConfig {
  globalTitle?: string           // "Firm Name | Tagline"
  globalDescription?: string
  ogImageUrl?: string
  twitterHandle?: string
  googleSiteVerification?: string
  schemaOrgType?: string         // LocalBusiness, LegalService, Attorney, etc.
  localBusinessSchema?: {
    name: string
    address: string
    phone: string
    priceRange?: string
    geo?: { lat: number; lng: number }
    openingHours?: string[]
  }
  robotsTxt?: string
  sitemapEnabled: boolean
  analyticsId?: string           // Google Analytics
  gtmId?: string                 // Google Tag Manager
}

export interface LawFirmConfig {
  firmName: string
  tagline?: string
  description?: string
  logoUrl?: string
  logoLightUrl?: string
  primaryColor?: string
  accentColor?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  barAssociations?: string[]
  foundedYear?: string
  disclaimer?: string            // Required legal disclaimer
  privacyPolicyUrl?: string
  intakeFormEnabled: boolean
  intakeFields: Array<{
    id: string
    label: string
    type: 'text' | 'email' | 'phone' | 'select' | 'textarea'
    required: boolean
    options?: string[]           // for select type
  }>
  seo: LawFirmSEOConfig
  officeLocations?: Array<{
    id: string
    name: string
    address: string
    phone?: string
    email?: string
    isPrimary: boolean
    mapEmbedUrl?: string
  }>
  headerLinks?: Array<{ label: string; href: string; order: number }>
  footerLinks?: Array<{ label: string; href: string; order: number }>
}

export interface LawFirmShowcaseData {
  config: LawFirmConfig
  caseResults: CaseResult[]
  attorneys: AttorneyProfile[]
  practiceAreas: PracticeArea[]
  testimonials: ClientTestimonial[]
  blogPosts: LawFirmBlogPost[]
  intakeSubmissions: LawFirmIntakeSubmission[]
  visibility: 'private' | 'unlisted' | 'demo'  // never 'public' until client deploys
}

// ─── Small Business Web Template Framework ───────────────────

export interface SMBServiceItem {
  id: string
  name: string
  description: string
  icon?: string
  price?: string
  imageUrl?: string
  ctaText?: string               // "Book Now", "Learn More"
  ctaUrl?: string
  featured: boolean
  order: number
}

export interface SMBTeamMember {
  id: string
  name: string
  role: string
  bio?: string
  photoUrl?: string
  email?: string
  linkedIn?: string
  order: number
}

export interface SMBFaq {
  id: string
  question: string
  answer: string
  category?: string
  order: number
}

// Promotion / special offer
export interface SMBPromotion {
  id: string
  title: string
  description: string
  code?: string                  // promo code
  discountText?: string          // "20% off", "$50 off"
  validFrom?: string
  validUntil?: string
  active: boolean
  order: number
}

// Blog / news post for SMB
export interface SMBBlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featuredImageUrl?: string
  category?: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string
  createdAt: string
  updatedAt: string
  order: number
}

// Contact form submission
export interface SMBContactSubmission {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  service?: string               // which service they inquired about
  submittedAt: string
  status: 'new' | 'read' | 'replied' | 'archived'
  notes?: string
}

// SEO for SMB
export interface SMBSEOConfig {
  siteTitle?: string
  siteDescription?: string
  ogImageUrl?: string
  schemaType?: string            // LocalBusiness, Restaurant, etc.
  localBusinessSchema?: {
    name: string
    address: string
    phone: string
    priceRange?: string
    geo?: { lat: number; lng: number }
    openingHours?: string[]
    servesCuisine?: string       // for restaurants
  }
  googleSiteVerification?: string
  analyticsId?: string
  gtmId?: string
  sitemapEnabled: boolean
  robotsNoindex?: boolean
}

export interface SMBTemplateConfig {
  businessName: string
  industry: string
  tagline?: string
  description?: string
  logoUrl?: string
  primaryColor?: string
  accentColor?: string
  fontHeading?: string
  fontBody?: string
  address?: string
  phone?: string
  email?: string
  hours?: string
  mapEmbedUrl?: string
  analyticsId?: string
  socialLinks?: Record<string, string>
  seo: SMBSEOConfig
  sections: {
    hero: boolean
    services: boolean
    about: boolean
    team: boolean
    testimonials: boolean
    faq: boolean
    contact: boolean
    gallery: boolean
    blog: boolean
    promotions: boolean
    map: boolean
  }
  heroStyle?: 'image' | 'video' | 'gradient' | 'split'
  heroImageUrl?: string
  heroVideoUrl?: string
  ctaText?: string
  ctaUrl?: string
}

export interface SMBTemplateData {
  config: SMBTemplateConfig
  services: SMBServiceItem[]
  team: SMBTeamMember[]
  testimonials: ClientTestimonial[]   // reused from law firm
  faqs: SMBFaq[]
  galleryImages: Array<{ id: string; url: string; alt: string; caption?: string; order: number }>
  promotions: SMBPromotion[]
  blogPosts: SMBBlogPost[]
  contactSubmissions: SMBContactSubmission[]
}

// ─── Agency Framework (White-Label, Unbranded) ───────────────

export type AgencyProjectStatus = 'discovery' | 'design' | 'development' | 'review' | 'launched' | 'maintenance'

export interface AgencyClientProject {
  id: string
  clientName: string
  projectName?: string
  templateType: 'law-firm' | 'small-business' | 'custom' | 'landing-page'
  status: AgencyProjectStatus
  domain?: string
  startDate: string
  launchDate?: string
  notes?: string
  repoUrl?: string
  budget: number                 // in cents
  hoursEstimated: number
  hoursUsed: number
  deliverables: string[]
  contactEmail?: string
  contactPhone?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface AgencyPipelineLead {
  id: string
  contactName: string
  company?: string
  email: string
  phone?: string
  serviceInterest: string        // which offering they inquired about
  budget?: string
  timeline?: string
  notes?: string
  status: 'new' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost'
  source?: string                // referral, ads, organic, etc.
  followUpDate?: string          // next follow-up
  createdAt: string              // ISO date string
}

// Invoice / billing for agency
export interface AgencyInvoice {
  id: string
  projectId: string              // links to AgencyClientProject
  clientName: string
  invoiceNumber: string
  amount: number                 // in cents
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issuedDate: string
  dueDate: string
  paidDate?: string
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number            // in cents
    total: number                // in cents
  }>
  notes?: string
  paymentMethod?: string
}

// Proposal template for sending to leads
export interface AgencyProposal {
  id: string
  leadId?: string
  projectId?: string
  title: string
  clientName: string
  scope: string                  // markdown description
  deliverables: string[]
  timeline: string
  investment: number             // in cents
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  validUntil?: string
  createdAt: string
  sentAt?: string
  notes?: string
}

// Time log entry for hours tracking
export interface AgencyTimeEntry {
  id: string
  projectId: string
  description: string
  hours: number
  date: string
  category: 'discovery' | 'design' | 'development' | 'review' | 'meeting' | 'admin'
  billable: boolean
}

// Agency settings
export interface AgencyConfig {
  agencyName?: string            // blank = white label
  defaultHourlyRate: number      // in cents
  currency: string
  invoicePrefix: string          // e.g., "INV-"
  proposalPrefix: string         // e.g., "PROP-"
  taxRate?: number               // percentage
  paymentTerms: string           // "Net 30", "Due on receipt"
  bankDetails?: string
  notificationEmail?: string
}

export interface AgencyFrameworkData {
  config: AgencyConfig
  projects: AgencyClientProject[]
  pipeline: AgencyPipelineLead[]
  invoices: AgencyInvoice[]
  proposals: AgencyProposal[]
  timeEntries: AgencyTimeEntry[]
  brandingRemoved: true           // sentinel — confirms no personal branding
}

// ─── Multi-Tenant Site Registry ──────────────────────────────

export type SiteType = 'law-firm' | 'small-business' | 'agency'

export type SiteStatus = 'draft' | 'demo' | 'private' | 'unlisted' | 'public'

/**
 * Site lifecycle state machine.
 * DRAFT → PREVIEW → STAGING → LIVE
 * Valid transitions:
 *   draft → preview
 *   preview → staging | draft
 *   staging → live | preview
 *   live → staging (via rollback)
 */
export type SiteState = 'draft' | 'preview' | 'staging' | 'live'

export interface SiteSummary {
  siteId: string
  type: SiteType
  name: string
  slug: string
  status: SiteStatus
  domain?: string
  createdAt: string              // ISO 8601
  updatedAt: string              // ISO 8601
  // CP1: Versioning & State (optional for backwards compat)
  state?: SiteState              // Lifecycle state (defaults to 'draft')
  currentVersionId?: string      // Active version being edited
  liveVersionId?: string         // Version currently deployed as live
  lastDeploymentId?: string      // Most recent deployment record
  deploymentCount?: number       // Total number of deployments
}

// ─── Site Versioning (CP1) ───────────────────────────────────

/**
 * Immutable snapshot of site configuration and content.
 * Used for audit trail, rollback, and deployment tracking.
 * NEVER contains secrets (GitHub tokens, Stripe keys, passwords).
 */
export interface SiteVersion {
  versionId: string
  siteId: string
  /** Normalized snapshot (config + content, no secrets) */
  snapshotData: SiteVersionSnapshot
  /** SHA-256 hash of canonical JSON(snapshotData) */
  dataHash: string
  createdAt: string              // ISO 8601
  createdBy: string              // userId or 'system'
  /** Optional human label, e.g., "v1.2.0", "Pre-launch" */
  label?: string
  notes?: string
}

/**
 * Minimal snapshot payload for version storage.
 * Pulled from NormalizedSiteData but stripped of secrets.
 */
export interface SiteVersionSnapshot {
  type: SiteType
  name: string
  slug: string
  domain?: string
  /** Branding tokens */
  branding?: SiteCoreBranding
  /** SEO metadata */
  seo?: SiteCoreSEO
  /** Template/preset reference */
  presetId?: string
  /** Serialized content blocks (varies by type) */
  contentBlocks: Record<string, unknown>
  /** Theme overrides */
  themeTokens?: Record<string, string>
}

// ─── Deployments (CP1) ────────────────────────────────────────

export type DeploymentEnvironment = 'preview' | 'staging' | 'production'

export type DeploymentStatus =
  | 'pending'
  | 'building'
  | 'deploying'
  | 'success'
  | 'failed'
  | 'rolled-back'
  | 'cancelled'

export interface DeploymentLog {
  timestamp: string              // ISO 8601
  level: 'info' | 'warn' | 'error'
  message: string
}

/**
 * Record of a deployment attempt.
 * Tracks version, environment, status, and build artifacts.
 */
export interface Deployment {
  deploymentId: string
  siteId: string
  versionId: string
  environment: DeploymentEnvironment
  status: DeploymentStatus
  /** Git commit SHA if pushed */
  commitSha?: string
  /** Build artifact hash */
  buildHash?: string
  /** Preview/staging URL */
  previewUrl?: string
  startedAt: string              // ISO 8601
  completedAt?: string           // ISO 8601
  deployedBy: string             // userId
  approvedBy?: string            // userId (for staging → prod)
  /** Bounded log entries (max 200) */
  logs: DeploymentLog[]
  errorMessage?: string
}

// ─── Canonical Site Core Schema ──────────────────────────────

/**
 * Shared base for all site data payloads.
 * Every site type extends SiteCore to normalize common fields.
 */
export interface SiteCoreBranding {
  primaryColor: string
  secondaryColor?: string
  logo?: string
  favicon?: string
}

export interface SiteCoreSEO {
  title: string
  description: string
  ogImage?: string
}

export interface SiteCore {
  siteId: string
  name: string
  slug: string
  status: SiteStatus
  domain?: string
  branding: SiteCoreBranding
  seo: SiteCoreSEO
  createdAt: string
  updatedAt: string
}

/**
 * Law firm site data extending SiteCore.
 */
export interface LawFirmSiteData extends SiteCore {
  type: 'law-firm'
  config: LawFirmConfig
  caseResults: CaseResult[]
  attorneys: AttorneyProfile[]
  practiceAreas: PracticeArea[]
  testimonials: ClientTestimonial[]
  blogPosts: LawFirmBlogPost[]
  intakeSubmissions: LawFirmIntakeSubmission[]
  visibility: 'private' | 'unlisted' | 'demo'
}

/**
 * SMB site data extending SiteCore.
 */
export interface SMBSiteData extends SiteCore {
  type: 'small-business'
  config: SMBTemplateConfig
  services: SMBServiceItem[]
  team: SMBTeamMember[]
  testimonials: ClientTestimonial[]
  faqs: SMBFaq[]
  galleryImages: Array<{ id: string; url: string; alt: string; caption?: string; order: number }>
  promotions: SMBPromotion[]
  blogPosts: SMBBlogPost[]
  contactSubmissions: SMBContactSubmission[]
}

/**
 * Agency site data extending SiteCore.
 */
export interface AgencySiteData extends SiteCore {
  type: 'agency'
  config: AgencyConfig
  projects: AgencyClientProject[]
  pipeline: AgencyPipelineLead[]
  invoices: AgencyInvoice[]
  proposals: AgencyProposal[]
  timeEntries: AgencyTimeEntry[]
  brandingRemoved: true
}

/** Union of all normalized site data payloads. */
export type NormalizedSiteData = LawFirmSiteData | SMBSiteData | AgencySiteData

/** Union of all site data payloads (includes legacy shapes). */
export type SiteData = LawFirmShowcaseData | SMBTemplateData | AgencyFrameworkData | NormalizedSiteData

/** Map SiteType → normalized data shape for type-safe retrieval */
export interface SiteDataMap {
  'law-firm': LawFirmSiteData
  'small-business': SMBSiteData
  'agency': AgencySiteData
}

/** Map SiteType → legacy data shape (pre-normalization) */
export interface LegacySiteDataMap {
  'law-firm': LawFirmShowcaseData
  'small-business': SMBTemplateData
  'agency': AgencyFrameworkData
}

// ─── Contract / Document System ──────────────────────────────

export type ContractStatus = 'draft' | 'exported' | 'sent' | 'signed'

export interface ContractSummary {
  docId: string
  type: string
  title: string
  status: ContractStatus
  updatedAt: string
  templateVersion: string
}

export interface ContractDoc {
  docId: string
  siteId: string
  type: string
  templateId: string
  templateVersion: string
  fields: Record<string, string>
  createdAt: string
  updatedAt: string
}

// ─── Export System (Immutable) ────────────────────────────────

export type ExportKind = 'pdf' | 'docx'
export type ExportStatus = 'generated' | 'signed'

export interface ExportSummary {
  exportId: string
  docId: string
  kind: ExportKind
  sha256: string
  createdAt: string
  status: ExportStatus
}

export interface ExportRecord {
  exportId: string
  docId: string
  siteId: string
  kind: ExportKind
  sha256: string
  createdAt: string
  fileRef: string
  signedFileRef?: string
  signedSha256?: string
  status: ExportStatus
}

// ─── Site Audit Trail (Append-Only) ──────────────────────────

/** Site-level audit event, distinct from the admin AuditEvent. */
export interface SiteAuditEvent {
  eventId: string
  at: string                     // ISO 8601
  actor: string
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown>
}
