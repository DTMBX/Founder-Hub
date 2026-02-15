import { useState } from 'react'
import { useSite } from '@/lib/site-context'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { 
  Globe, CaretDown, Check, Folder, TreeStructure, 
  CircleNotch, Warning
} from '@phosphor-icons/react'

interface SitePickerProps {
  collapsed?: boolean
}

export default function SitePicker({ collapsed = false }: SitePickerProps) {
  const { 
    sites, 
    activeSite, 
    activeSatellite, 
    setActiveSite, 
    setActiveSatellite, 
    loading 
  } = useSite()
  const [open, setOpen] = useState(false)

  if (loading) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 text-muted-foreground',
        collapsed && 'justify-center px-0'
      )}>
        <CircleNotch className="h-4 w-4 animate-spin" />
        {!collapsed && <span className="text-xs">Loading...</span>}
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 text-muted-foreground',
        collapsed && 'justify-center px-0'
      )}>
        <Warning className="h-4 w-4" />
        {!collapsed && <span className="text-xs">No sites</span>}
      </div>
    )
  }

  const displayName = activeSatellite 
    ? activeSatellite.name 
    : activeSite?.name || 'Select Site'

  const displayIcon = activeSatellite 
    ? <Folder className="h-4 w-4" weight="duotone" />
    : <Globe className="h-4 w-4" weight="duotone" />

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            'w-full justify-start gap-2 text-left font-normal',
            collapsed && 'w-10 px-0 justify-center'
          )}
        >
          {displayIcon}
          {!collapsed && (
            <>
              <span className="flex-1 truncate text-sm">{displayName}</span>
              <CaretDown className="h-3 w-3 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          {sites.filter(s => s.enabled).map((site) => (
            <div key={site.id}>
              <CommandGroup heading={site.name}>
                {/* Main site entry */}
                <CommandItem
                  onSelect={() => {
                    setActiveSite(site.id)
                    setActiveSatellite(null)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Globe className="mr-2 h-4 w-4" weight="duotone" />
                  <div className="flex-1">
                    <span className="font-medium">{site.name}</span>
                    {site.description && (
                      <p className="text-[10px] text-muted-foreground">{site.description}</p>
                    )}
                  </div>
                  {activeSite?.id === site.id && !activeSatellite && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>

                {/* Satellite apps */}
                {site.satellites && site.satellites.filter(s => s.enabled).length > 0 && (
                  <>
                    <div className="px-2 py-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <TreeStructure className="h-3 w-3" />
                        Satellite Apps
                      </span>
                    </div>
                    {site.satellites.filter(s => s.enabled).map((satellite) => (
                      <CommandItem
                        key={satellite.id}
                        onSelect={() => {
                          setActiveSite(site.id)
                          setActiveSatellite(satellite.id)
                          setOpen(false)
                        }}
                        className="cursor-pointer pl-6"
                      >
                        <Folder className="mr-2 h-4 w-4" weight="duotone" />
                        <span className="flex-1">{satellite.name}</span>
                        {activeSite?.id === site.id && activeSatellite?.id === satellite.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </>
                )}
              </CommandGroup>
              <CommandSeparator />
            </div>
          ))}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
