/**
 * Lead Capture Modal
 *
 * Modal form for capturing leads with email validation.
 * Can be triggered from CTAs throughout the marketing pages.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Mail, User, Building, Globe, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useFocusTrap, useKeyboardShortcut, useAnnounce } from '@/marketing/hooks'
import { track, MARKETING_EVENTS } from '@/marketing/event-tracker'
import { getLeadService } from './service'
import type { LeadCaptureInput, LeadSource } from './types'

// ─── Types ───────────────────────────────────────────────────

export interface LeadCaptureModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Close callback */
  onClose: () => void
  /** Success callback with lead ID */
  onSuccess?: (leadId: string) => void
  /** Error callback */
  onError?: (error: Error) => void
  /** Lead source */
  source?: LeadSource
  /** Pre-fill data */
  prefill?: Partial<LeadCaptureInput>
  /** Modal title */
  title?: string
  /** Modal description */
  description?: string
  /** Submit button text */
  submitLabel?: string
  /** Show optional fields */
  showOptionalFields?: boolean
  /** Vertical context (for qualification) */
  vertical?: string
}

// ─── Component ───────────────────────────────────────────────

export function LeadCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  source = 'website_form',
  prefill,
  title = 'Get Started',
  description = 'Enter your email to receive a personalized preview.',
  submitLabel = 'Get My Preview',
  showOptionalFields = true,
  vertical,
}: LeadCaptureModalProps) {
  const [email, setEmail] = useState(prefill?.email ?? '')
  const [firstName, setFirstName] = useState(prefill?.firstName ?? '')
  const [company, setCompany] = useState(prefill?.company ?? '')
  const [website, setWebsite] = useState(prefill?.website ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const emailInputRef = useRef<HTMLInputElement>(null)
  const { containerRef } = useFocusTrap<HTMLDivElement>({
    enabled: isOpen,
    onEscape: onClose,
  })
  const { announce } = useAnnounce()
  
  // Track modal open
  useEffect(() => {
    if (isOpen) {
      track(MARKETING_EVENTS.LEAD_FORM_OPENED, { source })
      emailInputRef.current?.focus()
    }
  }, [isOpen, source])
  
  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false)
      setError(null)
    }
  }, [isOpen])
  
  // Close on Escape
  useKeyboardShortcut({
    key: 'Escape',
    onTrigger: onClose,
    enabled: isOpen,
  })
  
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!validateEmail(email)) {
        setError('Please enter a valid email address')
        announce('Please enter a valid email address')
        return
      }
      
      setIsSubmitting(true)
      setError(null)
      
      track(MARKETING_EVENTS.LEAD_FORM_SUBMITTED, { source, email })
      
      try {
        const leadService = getLeadService()
        const lead = await leadService.capture({
          email,
          firstName: firstName || undefined,
          company: company || undefined,
          website: website || undefined,
          source,
          vertical,
        })
        
        setIsSuccess(true)
        announce('Success! Check your email for next steps.')
        track(MARKETING_EVENTS.LEAD_FORM_COMPLETED, { source, leadId: lead.id })
        
        onSuccess?.(lead.id)
        
        // Auto-close after success
        setTimeout(() => {
          onClose()
        }, 2000)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError('Something went wrong. Please try again.')
        announce('Something went wrong. Please try again.')
        onError?.(error)
        track(MARKETING_EVENTS.LEAD_FORM_ERROR, { source, error: error.message })
      } finally {
        setIsSubmitting(false)
      }
    },
    [email, firstName, company, website, source, vertical, onSuccess, onClose, onError, announce]
  )
  
  if (!isOpen) return null
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full max-w-md mx-4 bg-card rounded-xl shadow-2xl',
          'border border-border',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6">
          {isSuccess ? (
            /* Success state */
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2">You&apos;re In!</h2>
              <p className="text-muted-foreground">
                Check your email for next steps.
              </p>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit}>
              <h2 id="lead-modal-title" className="text-2xl font-bold mb-2">
                {title}
              </h2>
              <p className="text-muted-foreground mb-6">{description}</p>
              
              {/* Email (required) */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lead-email" className="text-sm font-medium">
                    Email *
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      ref={emailInputRef}
                      id="lead-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="pl-10"
                      required
                      autoComplete="email"
                      aria-invalid={!!error}
                    />
                  </div>
                </div>
                
                {showOptionalFields && (
                  <>
                    {/* First Name */}
                    <div>
                      <Label htmlFor="lead-name" className="text-sm font-medium">
                        First Name
                      </Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="lead-name"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Jane"
                          className="pl-10"
                          autoComplete="given-name"
                        />
                      </div>
                    </div>
                    
                    {/* Company */}
                    <div>
                      <Label htmlFor="lead-company" className="text-sm font-medium">
                        Company
                      </Label>
                      <div className="relative mt-1">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="lead-company"
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Acme Inc."
                          className="pl-10"
                          autoComplete="organization"
                        />
                      </div>
                    </div>
                    
                    {/* Website */}
                    <div>
                      <Label htmlFor="lead-website" className="text-sm font-medium">
                        Current Website (optional)
                      </Label>
                      <div className="relative mt-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="lead-website"
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://example.com"
                          className="pl-10"
                          autoComplete="url"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                {/* Error message */}
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                
                {/* Submit */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    submitLabel
                  )}
                </Button>
                
                {/* Privacy note */}
                <p className="text-xs text-muted-foreground text-center">
                  We respect your privacy. Unsubscribe anytime.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeadCaptureModal
