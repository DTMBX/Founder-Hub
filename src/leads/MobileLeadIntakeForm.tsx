/**
 * Mobile Lead Intake Form
 *
 * Mobile-first lead capture form with:
 * - Large touch targets
 * - File attachment support (photos/docs)
 * - Project type selection
 * - Validation feedback
 * - Integrates with automation service
 */

import { useState, useCallback, useRef } from 'react'
import {
  User,
  Phone,
  Mail,
  Briefcase,
  FileText,
  Upload,
  X,
  CheckCircle,
  Loader2,
  Camera,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { getLeadService } from './service'
import { getLeadAutomationService } from './lead-automation.service'
import type { LeadCaptureInput, LeadSource, LeadAttachment } from './types'

// ─── Types ───────────────────────────────────────────────────

export interface MobileLeadIntakeFormProps {
  /** Form submission callback */
  onSuccess?: (leadId: string) => void
  /** Error callback */
  onError?: (error: Error) => void
  /** Lead source */
  source?: LeadSource
  /** Project types to show */
  projectTypes?: string[]
  /** Max file size in MB */
  maxFileSizeMb?: number
  /** Allowed file types */
  allowedFileTypes?: string[]
  /** Show file upload */
  enableAttachments?: boolean
  /** Custom class */
  className?: string
}

// ─── Default Project Types ───────────────────────────────────

const DEFAULT_PROJECT_TYPES = [
  'Website Design',
  'Website Redesign',
  'E-commerce',
  'Web Application',
  'Mobile App',
  'Maintenance',
  'Other',
]

const DEFAULT_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// ─── Component ───────────────────────────────────────────────

export function MobileLeadIntakeForm({
  onSuccess,
  onError,
  source = 'website_form',
  projectTypes = DEFAULT_PROJECT_TYPES,
  maxFileSizeMb = 10,
  allowedFileTypes = DEFAULT_FILE_TYPES,
  enableAttachments = true,
  className,
}: MobileLeadIntakeFormProps) {
  // Form state
  const [formData, setFormData] = useState<LeadCaptureInput>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    source,
  })
  const [projectType, setProjectType] = useState('')
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<LeadAttachment[]>([])

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Validation ────────────────────────────────────────────

  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validatePhone = (phone: string): boolean =>
    !phone || /^[\d\s\-+()]{7,}$/.test(phone)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address'
    }

    if (!formData.firstName) {
      newErrors.firstName = 'Name is required'
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ─── File Handling ─────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files) return

      setUploadError(null)

      for (const file of Array.from(files)) {
        // Validate file type
        if (!allowedFileTypes.includes(file.type)) {
          setUploadError(`File type not supported: ${file.name}`)
          continue
        }

        // Validate file size
        if (file.size > maxFileSizeMb * 1024 * 1024) {
          setUploadError(`File too large: ${file.name} (max ${maxFileSizeMb}MB)`)
          continue
        }

        // Convert to base64 data URI for local storage
        const reader = new FileReader()
        reader.onload = () => {
          const attachment: LeadAttachment = {
            id: crypto.randomUUID(),
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            url: reader.result as string,
            uploadedAt: new Date().toISOString(),
            uploadedBy: formData.email || 'anonymous',
          }
          setAttachments((prev) => [...prev, attachment])
        }
        reader.readAsDataURL(file)
      }

      // Reset input
      e.target.value = ''
    },
    [formData.email, maxFileSizeMb, allowedFileTypes],
  )

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ─── Form Submission ───────────────────────────────────────

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!validate()) return

      setIsSubmitting(true)

      try {
        const leadService = getLeadService()

        // Create lead
        const lead = await leadService.capture({
          ...formData,
          projectDescription: notes || undefined,
        })

        // Update with additional fields
        await leadService.update(lead.id, {
          projectType: projectType || undefined,
          attachments: attachments.length > 0 ? attachments : undefined,
        })

        // Trigger automation
        try {
          const automationService = getLeadAutomationService()
          await automationService.onLeadCreated(lead)
        } catch (automationError) {
          // Log but don't fail the submission
          console.warn('[MobileLeadIntakeForm] Automation error:', automationError)
        }

        setIsSuccess(true)
        onSuccess?.(lead.id)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Submission failed')
        setErrors({ submit: error.message })
        onError?.(error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, projectType, notes, attachments, onSuccess, onError],
  )

  // ─── Field Update Helper ───────────────────────────────────

  const updateField = <K extends keyof LeadCaptureInput>(
    field: K,
    value: LeadCaptureInput[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // ─── Success State ─────────────────────────────────────────

  if (isSuccess) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center px-6 py-12 text-center',
          className,
        )}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">
          Thanks for reaching out!
        </h3>
        <p className="text-muted-foreground">
          We've received your inquiry and will get back to you within 24 hours.
        </p>
      </div>
    )
  }

  // ─── Form Render ───────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-5 px-4 py-6', className)}
    >
      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-muted-foreground" />
            First Name *
          </Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            placeholder="John"
            className={cn(
              'h-12 text-base',
              errors.firstName && 'border-red-500 focus:ring-red-500',
            )}
            autoComplete="given-name"
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm font-medium">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            placeholder="Doe"
            className="h-12 text-base"
            autoComplete="family-name"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="john@example.com"
          className={cn(
            'h-12 text-base',
            errors.email && 'border-red-500 focus:ring-red-500',
          )}
          autoComplete="email"
          inputMode="email"
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium">
          <Phone className="h-4 w-4 text-muted-foreground" />
          Phone
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="(555) 123-4567"
          className={cn(
            'h-12 text-base',
            errors.phone && 'border-red-500 focus:ring-red-500',
          )}
          autoComplete="tel"
          inputMode="tel"
        />
        {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
      </div>

      {/* Company */}
      <div className="space-y-2">
        <Label htmlFor="company" className="flex items-center gap-2 text-sm font-medium">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          Company
        </Label>
        <Input
          id="company"
          type="text"
          value={formData.company}
          onChange={(e) => updateField('company', e.target.value)}
          placeholder="Acme Inc."
          className="h-12 text-base"
          autoComplete="organization"
        />
      </div>

      {/* Project Type */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Project Type
        </Label>
        <div className="flex flex-wrap gap-2">
          {projectTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setProjectType(type === projectType ? '' : type)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-colors',
                projectType === type
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-foreground hover:border-primary/50',
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          Tell us about your project
        </Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe your project, goals, timeline..."
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Attachments */}
      {enableAttachments && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Camera className="h-4 w-4 text-muted-foreground" />
            Attachments
          </Label>

          {/* File input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedFileTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 h-12"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>

          {/* Upload error */}
          {uploadError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {uploadError}
            </div>
          )}

          {/* Attachment list */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {attachment.mimeType.startsWith('image/') ? (
                      <img
                        src={attachment.url}
                        alt={attachment.filename}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {attachment.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="ml-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Remove ${attachment.filename}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit error */}
      {errors.submit && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {errors.submit}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-14 w-full text-lg font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Sending...
          </>
        ) : (
          'Submit Inquiry'
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        We'll respond within 24 hours. Your information is secure and never shared.
      </p>
    </form>
  )
}
