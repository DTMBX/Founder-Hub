import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { AuditEvent } from '@/lib/types'
import { decryptAuditLog } from '@/lib/auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AuditLog() {
  const [rawLog] = useKV<(AuditEvent | string)[]>('founder-hub-audit-log', [])
  const [events, setEvents] = useState<AuditEvent[]>([])

  useEffect(() => {
    if (rawLog && rawLog.length > 0) {
      decryptAuditLog(rawLog).then(setEvents)
    } else {
      setEvents([])
    }
  }, [rawLog])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Audit Log</h2>
        <p className="text-muted-foreground">Track all admin actions and changes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Chronological log of all admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity logged yet.</p>
          ) : (
            <div className="space-y-3">
              {events.slice(0, 50).map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{event.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{event.details}</p>
                    <p className="text-xs text-muted-foreground">by {event.userEmail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
