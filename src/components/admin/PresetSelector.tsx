/**
 * Preset Selector
 *
 * Admin UI component for selecting and applying design presets.
 * Shows available presets for a site type with previews and descriptions.
 */

import { useState, useCallback } from 'react'
import type { SiteType, NormalizedSiteData } from '@/lib/types'
import {
  getPresetsForType,
  applyPreset,
  type Preset,
} from '@/core/presets'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Palette,
  Check,
  CircleNotch,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// ─── Props ───────────────────────────────────────────────────

interface PresetSelectorProps {
  /** The site type to show presets for. */
  siteType: SiteType
  /** Current preset ID if one is applied. */
  currentPresetId?: string
  /** Callback when a preset is selected. Receives the preset ID. */
  onApply: (presetId: string) => Promise<void>
  /** Whether an operation is in progress. */
  loading?: boolean
}

// ─── Component ───────────────────────────────────────────────

export function PresetSelector({
  siteType,
  currentPresetId,
  onApply,
  loading = false,
}: PresetSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(currentPresetId ?? null)
  const [applying, setApplying] = useState(false)

  const presets = getPresetsForType(siteType)

  const handleApply = useCallback(async () => {
    if (!selected) return
    setApplying(true)
    try {
      await onApply(selected)
      toast.success('Preset applied successfully')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply preset')
    } finally {
      setApplying(false)
    }
  }, [selected, onApply])

  const currentPreset = presets.find((p) => p.presetId === currentPresetId)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        <Palette className="h-4 w-4" weight="duotone" />
        {currentPreset ? currentPreset.label : 'Choose Preset'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" weight="duotone" />
              Design Presets
            </DialogTitle>
            <DialogDescription>
              Select a design preset to apply to your site. This will update colors, fonts, and section defaults.
              Your business content will not be affected.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 max-h-[400px] overflow-y-auto">
            {presets.map((preset) => {
              const isSelected = selected === preset.presetId
              const isCurrent = currentPresetId === preset.presetId
              const primaryColor = preset.tokens.colors?.primaryColor ?? '#1a365d'
              const secondaryColor = preset.tokens.colors?.secondaryColor ?? '#c7a44a'

              return (
                <button
                  key={preset.presetId}
                  type="button"
                  className={`
                    relative text-left p-4 rounded-lg border-2 transition-all
                    ${isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/40'
                    }
                  `}
                  onClick={() => setSelected(preset.presetId)}
                >
                  {/* Color swatch preview */}
                  <div className="flex gap-1 mb-3">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: primaryColor }}
                      title="Primary color"
                    />
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: secondaryColor }}
                      title="Secondary color"
                    />
                  </div>

                  {/* Label + badges */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{preset.label}</span>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" weight="bold" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={!selected || applying || selected === currentPresetId}
              className="gap-2"
            >
              {applying ? (
                <>
                  <CircleNotch className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <ArrowsClockwise className="h-4 w-4" />
                  Apply Preset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Inline Preset Selector (Compact) ────────────────────────

interface InlinePresetSelectorProps {
  siteType: SiteType
  currentPresetId?: string
  onApply: (presetId: string) => Promise<void>
}

/**
 * Compact inline preset selector for use in site cards.
 */
export function InlinePresetSelector({
  siteType,
  currentPresetId,
  onApply,
}: InlinePresetSelectorProps) {
  const [applying, setApplying] = useState<string | null>(null)
  const presets = getPresetsForType(siteType)

  const handleApply = useCallback(async (presetId: string) => {
    setApplying(presetId)
    try {
      await onApply(presetId)
      toast.success('Preset applied')
    } catch {
      toast.error('Failed to apply preset')
    } finally {
      setApplying(null)
    }
  }, [onApply])

  return (
    <div className="flex gap-1">
      {presets.slice(0, 3).map((preset) => {
        const isCurrent = currentPresetId === preset.presetId
        const isApplying = applying === preset.presetId
        const primaryColor = preset.tokens.colors?.primaryColor ?? '#1a365d'

        return (
          <button
            key={preset.presetId}
            type="button"
            className={`
              w-6 h-6 rounded border-2 transition-all
              ${isCurrent ? 'border-primary ring-1 ring-primary/30' : 'border-transparent hover:border-primary/50'}
            `}
            style={{ backgroundColor: primaryColor }}
            onClick={() => handleApply(preset.presetId)}
            disabled={isApplying}
            title={preset.label}
          >
            {isCurrent && (
              <Check className="h-3 w-3 text-white mx-auto" weight="bold" />
            )}
            {isApplying && (
              <CircleNotch className="h-3 w-3 text-white mx-auto animate-spin" />
            )}
          </button>
        )
      })}
    </div>
  )
}
