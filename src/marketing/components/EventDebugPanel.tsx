/**
 * Event Debug Panel
 *
 * Debug overlay for viewing tracked events in development/demo mode.
 * Only visible when ?debug=1 is in the URL.
 */

import { useState, useEffect } from 'react'
import { X, Bug, RefreshCw, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { getDebugData, getEventTracker, type TrackingEvent } from '../event-tracker'

// ─── Types ───────────────────────────────────────────────────

export interface EventDebugPanelProps {
  /** Force show panel (ignores ?debug=1 requirement) */
  forceShow?: boolean
  /** Custom className */
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function EventDebugPanel({ forceShow = false, className }: EventDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [sessionId, setSessionId] = useState('')
  
  // Check for ?debug=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shouldShow = forceShow || params.has('debug') || params.get('debug') === '1'
    setIsVisible(shouldShow)
  }, [forceShow])
  
  // Load events and set up polling
  useEffect(() => {
    if (!isVisible) return
    
    const loadEvents = () => {
      const data = getDebugData()
      setEvents(data.events)
      setSessionId(data.sessionId)
    }
    
    loadEvents()
    const interval = setInterval(loadEvents, 1000)
    
    return () => clearInterval(interval)
  }, [isVisible])
  
  if (!isVisible) return null
  
  const handleClear = () => {
    getEventTracker().clearBuffer()
    setEvents([])
  }
  
  const handleExport = () => {
    const json = getEventTracker().exportEvents()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `events-${sessionId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleRefresh = () => {
    const data = getDebugData()
    setEvents(data.events)
  }
  
  // Minimized view
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          'w-12 h-12 rounded-full',
          'bg-yellow-500 text-black shadow-lg',
          'flex items-center justify-center',
          'hover:bg-yellow-400 transition-colors',
          className
        )}
        title="Open debug panel"
      >
        <Bug className="w-6 h-6" />
        {events.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {events.length}
          </span>
        )}
      </button>
    )
  }
  
  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'w-96 max-h-[70vh]',
        'bg-background border border-border rounded-lg shadow-2xl',
        'flex flex-col overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-yellow-500/10">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-yellow-600" />
          <span className="font-medium text-sm">Event Debug</span>
          <Badge variant="secondary" className="text-xs">
            {events.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh} title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleExport} title="Export">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear} title="Clear">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)} title="Minimize">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Session Info */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-b">
        Session: <code className="bg-muted px-1 rounded">{sessionId.slice(0, 20)}...</code>
      </div>
      
      {/* Event List */}
      <ScrollArea className="flex-1 max-h-80">
        <div className="p-2 space-y-1">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No events tracked yet
            </div>
          ) : (
            [...events].reverse().map((event, i) => (
              <EventRow key={`${event.timestamp}-${i}`} event={event} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ─── Event Row ───────────────────────────────────────────────

function EventRow({ event }: { event: TrackingEvent }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const time = new Date(event.timestamp).toLocaleTimeString()
  const eventColor = getEventColor(event.eventName)
  
  return (
    <div
      className={cn(
        'p-2 rounded text-xs',
        'bg-muted/50 hover:bg-muted cursor-pointer',
        'transition-colors'
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('w-2 h-2 rounded-full', eventColor)} />
          <span className="font-medium">{event.eventName}</span>
        </div>
        <span className="text-muted-foreground">{time}</span>
      </div>
      
      {isExpanded && (
        <pre className="mt-2 p-2 bg-background rounded text-[10px] overflow-auto">
          {JSON.stringify(event.properties, null, 2)}
        </pre>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────

function getEventColor(eventName: string): string {
  if (eventName.includes('click') || eventName.includes('cta')) {
    return 'bg-green-500'
  }
  if (eventName.includes('view') || eventName.includes('page')) {
    return 'bg-blue-500'
  }
  if (eventName.includes('video')) {
    return 'bg-purple-500'
  }
  if (eventName.includes('form') || eventName.includes('lead')) {
    return 'bg-orange-500'
  }
  return 'bg-gray-500'
}

export default EventDebugPanel
