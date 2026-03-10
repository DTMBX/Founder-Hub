/**
 * WorkspaceSiteSwitcher.tsx — Workspace site selector with dirty-state guard.
 *
 * Displays the current active site and allows switching between
 * registered workspace sites. Respects dirty-state guardrails —
 * if the editor has unsaved changes, prompts for confirmation.
 */

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CaretUpDown, Check, Globe,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useWorkspaceSite } from '@/lib/workspace-site'
import { useStudioPermissions } from '@/lib/studio-permissions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function WorkspaceSiteSwitcher() {
  const {
    activeSite,
    sites,
    switchSite,
    switchPending,
    confirmSwitch,
    cancelSwitch,
  } = useWorkspaceSite()

  const perms = useStudioPermissions()
  const canSwitch = perms.can('studio:switch-site')
  const hasMutipleSites = sites.length > 1

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={!canSwitch}
            title={!canSwitch ? perms.why('studio:switch-site') : undefined}
            className={cn(
              'h-8 gap-2 text-xs font-medium px-2',
              !hasMutipleSites && 'pointer-events-none'
            )}
          >
            <Globe className="h-3.5 w-3.5 text-primary" weight="duotone" />
            <span className="truncate max-w-[120px]">{activeSite.label}</span>
            {hasMutipleSites && (
              <CaretUpDown className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>

        {hasMutipleSites && (
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Workspace Sites
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {sites.map(site => {
              const isActive = site.siteId === activeSite.siteId
              return (
                <DropdownMenuItem
                  key={site.siteId}
                  onClick={() => switchSite(site.siteId)}
                  className="gap-2"
                >
                  <Globe className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{site.label}</span>
                      {!site.hasSchemas && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 text-muted-foreground">
                          Setup needed
                        </Badge>
                      )}
                    </div>
                    {site.domain && (
                      <span className="text-[10px] text-muted-foreground">{site.domain}</span>
                    )}
                  </div>
                  {isActive && <Check className="h-3.5 w-3.5 text-primary" weight="bold" />}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {/* Dirty-state confirmation dialog */}
      <ConfirmDialog
        open={switchPending !== null}
        onOpenChange={(open) => { if (!open) cancelSwitch() }}
        title="Unsaved Changes"
        description="You have unsaved changes. Switching sites will discard them. Continue?"
        confirmLabel="Switch Anyway"
        intent="destructive"
        onConfirm={confirmSwitch}
      />
    </>
  )
}
