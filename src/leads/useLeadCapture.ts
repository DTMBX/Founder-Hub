/**
 * Lead Capture Hook
 *
 * React hook for managing lead capture modal state and callbacks.
 */

import { useState, useCallback } from 'react'
import type { LeadSource, LeadCaptureInput } from './types'

// ─── Types ───────────────────────────────────────────────────

export interface UseLeadCaptureOptions {
  /** Lead source */
  source?: LeadSource
  /** Pre-fill data */
  prefill?: Partial<LeadCaptureInput>
  /** Callback when lead is captured */
  onSuccess?: (leadId: string) => void
  /** Callback when capture fails */
  onError?: (error: Error) => void
  /** Vertical context */
  vertical?: string
}

export interface UseLeadCaptureResult {
  /** Whether the modal is open */
  isOpen: boolean
  /** Open the modal */
  open: () => void
  /** Close the modal */
  close: () => void
  /** Toggle the modal */
  toggle: () => void
  /** ID of the most recently captured lead */
  capturedLeadId: string | null
  /** Modal props to spread */
  modalProps: {
    isOpen: boolean
    onClose: () => void
    onSuccess: (leadId: string) => void
    onError: (error: Error) => void
    source: LeadSource
    prefill: Partial<LeadCaptureInput>
    vertical?: string
  }
}

// ─── Hook ────────────────────────────────────────────────────

export function useLeadCapture(
  options: UseLeadCaptureOptions = {}
): UseLeadCaptureResult {
  const {
    source = 'website_form',
    prefill = {},
    onSuccess,
    onError,
    vertical,
  } = options
  
  const [isOpen, setIsOpen] = useState(false)
  const [capturedLeadId, setCapturedLeadId] = useState<string | null>(null)
  
  const open = useCallback(() => {
    setIsOpen(true)
  }, [])
  
  const close = useCallback(() => {
    setIsOpen(false)
  }, [])
  
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])
  
  const handleSuccess = useCallback(
    (leadId: string) => {
      setCapturedLeadId(leadId)
      onSuccess?.(leadId)
    },
    [onSuccess]
  )
  
  const handleError = useCallback(
    (error: Error) => {
      onError?.(error)
    },
    [onError]
  )
  
  return {
    isOpen,
    open,
    close,
    toggle,
    capturedLeadId,
    modalProps: {
      isOpen,
      onClose: close,
      onSuccess: handleSuccess,
      onError: handleError,
      source,
      prefill,
      vertical,
    },
  }
}

export default useLeadCapture
