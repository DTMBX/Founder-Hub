import { useCallback, useRef, useState } from 'react'

export type FormSource = 'tillerstead' | 'evident' | 'general'
export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_API_URL as string | undefined

/**
 * Hook for submitting contact/inquiry forms.
 *
 * When VITE_CONTACT_API_URL is configured, submissions are POSTed to
 * the Cloudflare Worker. Otherwise, the form data is logged to console
 * and the hook reports success so the UI still transitions correctly.
 *
 * Includes honeypot value and page-load timestamp for bot detection.
 */
export function useFormSubmit(source: FormSource) {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const loadedAt = useRef(Date.now())

  const submit = useCallback(async (formData: FormData) => {
    // Honeypot check client-side
    const honeypotFields = ['company_url', 'website']
    for (const field of honeypotFields) {
      if (formData.get(field)) return
    }

    setStatus('submitting')
    setErrorMessage('')

    const payload: Record<string, string | number> = { source }
    formData.forEach((value, key) => {
      if (!honeypotFields.includes(key) && typeof value === 'string') {
        payload[key] = value
      }
    })
    payload._loaded_at = loadedAt.current

    if (!CONTACT_ENDPOINT) {
      // No backend configured — log locally and succeed
      console.info('[FormSubmit] No VITE_CONTACT_API_URL configured. Submission data:', payload)
      setStatus('success')
      return
    }

    try {
      const res = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json() as { ok: boolean; message: string }

      if (data.ok) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(data.message || 'Submission failed. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    }
  }, [source])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage('')
    loadedAt.current = Date.now()
  }, [])

  return { status, errorMessage, submit, reset }
}
