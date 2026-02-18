/**
 * VoiceNotes — Voice-to-Text Input Component
 *
 * Uses Web Speech API for voice input:
 * - Real-time transcription
 * - Visual feedback during recording
 * - Mobile-optimized UI
 * - Fallback for unsupported browsers
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Mic, MicOff, Square, Send, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VoiceNoteStatus } from '@/pwa/types'

// ─── Types ─────────────────────────────────────────────────

export interface VoiceNotesProps {
  onTranscript: (text: string) => void
  onCancel?: () => void
  placeholder?: string
  maxDuration?: number // milliseconds
  className?: string
  autoStart?: boolean
}

// ─── Speech Recognition Types ──────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

// ─── Hook ──────────────────────────────────────────────────

function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false)
  const [status, setStatus] = useState<VoiceNoteStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'
    }

    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  const start = useCallback(() => {
    if (!recognitionRef.current) return

    setError(null)
    setTranscript('')
    setInterimTranscript('')

    recognitionRef.current.onstart = () => {
      setStatus('listening')
    }

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let final = ''
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      if (final) {
        setTranscript((prev) => prev + final)
      }
      setInterimTranscript(interim)
    }

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Voice] Recognition error:', event.error)
      setError(event.error)
      setStatus('error')
    }

    recognitionRef.current.onend = () => {
      if (status === 'listening') {
        setStatus('idle')
      }
    }

    try {
      recognitionRef.current.start()
    } catch (e) {
      console.error('[Voice] Start failed:', e)
      setError('Failed to start')
      setStatus('error')
    }
  }, [status])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setStatus('idle')
    setInterimTranscript('')
  }, [])

  const reset = useCallback(() => {
    recognitionRef.current?.abort()
    setStatus('idle')
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  return {
    isSupported,
    status,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
    fullTranscript: transcript + interimTranscript,
  }
}

// ─── Component ─────────────────────────────────────────────

export function VoiceNotes({
  onTranscript,
  onCancel,
  placeholder = 'Tap the mic to start recording...',
  maxDuration = 60000, // 1 minute default
  className,
  autoStart = false,
}: VoiceNotesProps) {
  const {
    isSupported,
    status,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
    fullTranscript,
  } = useSpeechRecognition()

  const timerRef = useRef<number | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)

  // Auto-start if specified
  useEffect(() => {
    if (autoStart && isSupported) {
      start()
    }
  }, [autoStart, isSupported, start])

  // Recording timer
  useEffect(() => {
    if (status === 'listening') {
      setRecordingTime(0)
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stop()
            return prev
          }
          return prev + 1000
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [status, maxDuration, stop])

  const handleSubmit = useCallback(() => {
    if (fullTranscript.trim()) {
      onTranscript(fullTranscript.trim())
      reset()
    }
  }, [fullTranscript, onTranscript, reset])

  const handleCancel = useCallback(() => {
    reset()
    onCancel?.()
  }, [reset, onCancel])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Unsupported browser fallback
  if (!isSupported) {
    return (
      <div
        className={cn(
          'p-4 bg-zinc-800 rounded-xl border border-zinc-700 text-center',
          className
        )}
      >
        <MicOff className="h-8 w-8 mx-auto mb-2 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          Voice input is not supported in your browser.
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Try Chrome, Safari, or Edge on mobile.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden',
        className
      )}
    >
      {/* Transcript Display */}
      <div className="p-4 min-h-[120px] max-h-[200px] overflow-y-auto">
        {fullTranscript ? (
          <p className="text-zinc-100 leading-relaxed">
            {transcript}
            {interimTranscript && (
              <span className="text-zinc-400">{interimTranscript}</span>
            )}
          </p>
        ) : (
          <p className="text-zinc-500 text-sm">{placeholder}</p>
        )}

        {error && (
          <p className="text-red-400 text-sm mt-2">
            Error: {error}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 p-3 bg-zinc-900/50 border-t border-zinc-700">
        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Recording Status / Mic Button */}
        <div className="flex items-center gap-3">
          {status === 'listening' && (
            <span className="text-sm text-amber-500 font-mono">
              {formatTime(recordingTime)}
            </span>
          )}

          <button
            onClick={status === 'listening' ? stop : start}
            className={cn(
              'relative w-14 h-14 rounded-full flex items-center justify-center',
              'transition-all duration-200 active:scale-95',
              status === 'listening'
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-black'
            )}
            aria-label={status === 'listening' ? 'Stop recording' : 'Start recording'}
          >
            {status === 'listening' ? (
              <>
                {/* Pulsing animation */}
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                <Square className="h-5 w-5 relative z-10" />
              </>
            ) : status === 'processing' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={!fullTranscript.trim()}
          className={cn(
            'p-2 rounded-lg transition-colors',
            fullTranscript.trim()
              ? 'text-amber-500 hover:bg-amber-500/10'
              : 'text-zinc-600 cursor-not-allowed'
          )}
          aria-label="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// ─── Inline Voice Button ───────────────────────────────────

export interface VoiceButtonProps {
  onTranscript: (text: string) => void
  className?: string
}

export function VoiceButton({ onTranscript, className }: VoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'p-2 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-800',
          'transition-colors',
          className
        )}
        aria-label="Voice input"
      >
        <Mic className="h-5 w-5" />
      </button>

      {/* Voice Input Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md m-4 mb-[env(safe-area-inset-bottom)]">
            <VoiceNotes
              autoStart
              onTranscript={(text) => {
                onTranscript(text)
                setIsOpen(false)
              }}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}

export default VoiceNotes
