/**
 * Dynamic Contact Form
 * 
 * Renders contact form fields based on site configuration.
 * Supports validation, honeypot spam protection, and custom fields.
 */

import React, { useState } from 'react'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { contactConfig, type ContactField } from '@/config/site.config'
import { useFormSubmit, type FormSource } from '@/hooks/use-form-submit'
import { cn } from '@/lib/utils'

interface ContactFormProps {
  className?: string
  onSuccess?: () => void
  customFields?: ContactField[]
  submitLabel?: string
  compact?: boolean
  source?: FormSource
}

export function ContactForm({
  className,
  onSuccess,
  customFields,
  submitLabel = 'Send Message',
  compact = false,
  source = 'general',
}: ContactFormProps) {
  const fields = customFields || contactConfig.fields
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [honeypot, setHoneypot] = useState('') // Spam trap
  const { status, errorMessage, submit, reset } = useFormSubmit(source)
  const isSubmitting = status === 'submitting'
  const submitted = status === 'success'
  
  const validateField = (field: ContactField, value: string | boolean): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`
    }
    
    if (typeof value === 'string' && value) {
      // Email validation
      if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address'
      }
      
      // Phone validation (US format)
      if (field.type === 'phone' && !/^[\d\s\-\(\)\+]+$/.test(value)) {
        return 'Please enter a valid phone number'
      }
      
      // Max length
      if (field.maxLength && value.length > field.maxLength) {
        return `Maximum ${field.maxLength} characters allowed`
      }
      
      // Custom regex validation
      if (field.validation && !new RegExp(field.validation).test(value)) {
        return `Please enter a valid ${field.label.toLowerCase()}`
      }
    }
    
    return null
  }
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.log('[ContactForm] Honeypot triggered, ignoring submission')
      return
    }
    
    // Validate all fields
    const newErrors: Record<string, string> = {}
    for (const field of fields) {
      const error = validateField(field, formData[field.name] as string | boolean)
      if (error) {
        newErrors[field.name] = error
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    const fd = new FormData(e.currentTarget)
    await submit(fd)
    onSuccess?.()
  }
  
  const updateField = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev
        return rest
      })
    }
  }
  
  if (submitted) {
    return (
      <GlassCard className={cn('p-8 text-center', className)}>
        <div className="text-4xl mb-4">✓</div>
        <h3 className="text-xl font-semibold mb-2">Message Sent</h3>
        <p className="text-muted-foreground">{contactConfig.successMessage}</p>
        <button onClick={reset} className="mt-4 text-sm text-primary hover:text-primary/80 underline">Send another message</button>
      </GlassCard>
    )
  }
  
  const renderField = (field: ContactField) => {
    const value = formData[field.name] || ''
    const error = errors[field.name]
    const commonProps = {
      id: field.name,
      placeholder: field.placeholder,
      required: field.required,
      'aria-invalid': !!error,
      'aria-describedby': error ? `${field.name}-error` : undefined,
    }
    
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            value={value as string}
            onChange={e => updateField(field.name, e.target.value)}
            maxLength={field.maxLength}
            rows={compact ? 3 : 5}
            className="bg-background/50 border-border/50"
          />
        )
        
      case 'select':
        return (
          <Select
            value={value as string}
            onValueChange={v => updateField(field.name, v)}
          >
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
        
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value as boolean}
              onCheckedChange={v => updateField(field.name, !!v)}
            />
            <label htmlFor={field.name} className="text-sm">
              {field.placeholder || field.label}
            </label>
          </div>
        )
        
      default:
        return (
          <Input
            {...commonProps}
            type={field.type === 'phone' ? 'tel' : field.type}
            value={value as string}
            onChange={e => updateField(field.name, e.target.value)}
            maxLength={field.maxLength}
            className="bg-background/50 border-border/50"
          />
        )
    }
  }
  
  return (
    <GlassCard className={cn('p-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot field - hidden from users, bots will fill it */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor={contactConfig.honeypotField}>Website</label>
          <input
            type="text"
            id={contactConfig.honeypotField}
            name={contactConfig.honeypotField}
            value={honeypot}
            onChange={e => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        
        {/* Dynamic fields */}
        {fields.map(field => (
          <div key={field.name} className="space-y-2">
            {field.type !== 'checkbox' && (
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            )}
            {renderField(field)}
            {errors[field.name] && (
              <p id={`${field.name}-error`} className="text-sm text-red-500">
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}
        
        {(errors._form || errorMessage) && (
          <p className="text-sm text-red-500 text-center">{errors._form || errorMessage}</p>
        )}
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          size={compact ? 'default' : 'lg'}
        >
          {isSubmitting ? 'Sending...' : submitLabel}
        </Button>
      </form>
    </GlassCard>
  )
}

export default ContactForm
