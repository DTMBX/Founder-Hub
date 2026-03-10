/**
 * KeyboardShortcutsDialog — Modal showing all available keyboard shortcuts.
 * Triggered by pressing '?' or clicking a help icon in the toolbar.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatShortcut, type Shortcut } from '@/lib/keyboard-shortcuts'
import { Keyboard } from '@phosphor-icons/react'

interface KeyboardShortcutsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcuts: Pick<Shortcut, 'key' | 'ctrl' | 'shift' | 'alt' | 'label' | 'category'>[]
}

export default function KeyboardShortcutsDialog({
  open,
  onOpenChange,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  // Group shortcuts by category
  const grouped = shortcuts.reduce<Record<string, typeof shortcuts>>((acc, s) => {
    const cat = s.category || 'General'
    ;(acc[cat] ??= []).push(s)
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" weight="duotone" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {category}
              </h3>
              <div className="space-y-1">
                {items.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{s.label}</span>
                    <kbd className="inline-flex h-6 items-center rounded border border-border bg-muted px-2 font-mono text-[11px] font-medium text-muted-foreground">
                      {formatShortcut(s)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Press <kbd className="inline px-1 py-0.5 rounded border border-border bg-muted text-[10px] font-mono">?</kbd> to toggle this dialog
        </p>
      </DialogContent>
    </Dialog>
  )
}
