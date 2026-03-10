/**
 * CollectionPanel.tsx — Collection editor for array-of-object datasets.
 *
 * Selection-driven: reacts to useStudioSelection() and shows a collection
 * editor when the selected section has a supported array KV dataset.
 *
 * Uses draft-commit pattern consistent with InspectorPanel:
 *   - All mutations (add, remove, reorder, edit fields) are local to draft
 *   - Apply validates the full array and commits to KV + history
 *   - Reset discards all draft changes
 *   - Undo/Redo restores previous collection states
 *
 * Reuses shared field controls from field-controls.tsx.
 */

import { useCollectionEditor } from '@/lib/use-collection-editor'
import { ContentFieldControl } from './field-controls'
import { cn } from '@/lib/utils'
import {
  ArrowCounterClockwise, ArrowClockwise, FloppyDisk,
  ArrowUUpLeft, Warning, CheckCircle, Plus, Trash,
  CaretUp, CaretDown, CaretRight,
} from '@phosphor-icons/react'

// ─── Main Panel ─────────────────────────────────────────────────────────────

export default function CollectionPanel() {
  const {
    isCollectionSection,
    collection,
    kvKey,
    items,
    selectedItemIndex,
    isDirty,
    validationError,
    selectItem,
    setItemField,
    addItem,
    removeItem,
    moveItem,
    apply,
    reset,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
    itemFields,
  } = useCollectionEditor()

  // ── No collection section selected ──

  if (!isCollectionSection || !collection) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground text-center py-4">
          Select a section with collection data to edit items.
        </p>
        <p className="text-[10px] text-muted-foreground/50 text-center">
          Supported: Projects, Offerings, Proof Links, Contact Links
        </p>
        <UndoRedoBar
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={performUndo}
          onRedo={performRedo}
        />
      </div>
    )
  }

  const selectedItem = selectedItemIndex !== null ? items[selectedItemIndex] : null

  return (
    <div className="p-3 space-y-3">
      {/* Collection header */}
      <div className="rounded-lg bg-card/40 border border-border/30 p-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{collection.label}</span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {items.length} {items.length === 1 ? collection.itemLabel : `${collection.itemLabel}s`}
          </span>
        </div>
        {kvKey && (
          <div className="text-[10px] text-muted-foreground">kv: {kvKey}</div>
        )}
      </div>

      {/* Item list */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Items
          </span>
          {collection.allowAddRemove && (
            <button
              onClick={addItem}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add {collection.itemLabel}
            </button>
          )}
        </div>

        {items.length === 0 && (
          <p className="text-[10px] text-muted-foreground/50 italic py-2 text-center">
            No items yet. {collection.allowAddRemove && `Click "Add ${collection.itemLabel}" to create one.`}
          </p>
        )}

        <div className="max-h-[200px] overflow-y-auto space-y-0.5">
          {items.map((item, index) => {
            const title = String(item[collection.titleField] || `${collection.itemLabel} ${index + 1}`)
            const isSelected = selectedItemIndex === index
            return (
              <div
                key={String(item[collection.idField] || index)}
                className={cn(
                  'flex items-center gap-1 rounded-md transition-colors',
                  isSelected
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-accent/5 border border-transparent'
                )}
              >
                <button
                  onClick={() => selectItem(isSelected ? null : index)}
                  className="flex-1 flex items-center gap-1.5 px-2 py-1.5 text-left min-w-0"
                >
                  <CaretRight className={cn(
                    'h-3 w-3 shrink-0 text-muted-foreground transition-transform',
                    isSelected && 'rotate-90 text-primary'
                  )} />
                  <span className="text-xs truncate">{title}</span>
                </button>

                {/* Reorder + delete controls */}
                <div className="flex items-center gap-0.5 pr-1 shrink-0">
                  {collection.allowReorder && (
                    <>
                      <button
                        onClick={() => moveItem(index, index - 1)}
                        disabled={index === 0}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move up"
                      >
                        <CaretUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveItem(index, index + 1)}
                        disabled={index === items.length - 1}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        aria-label="Move down"
                      >
                        <CaretDown className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {collection.allowAddRemove && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-0.5 text-muted-foreground hover:text-red-400 transition-colors"
                      aria-label={`Remove ${title}`}
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected item editor */}
      {selectedItem && (
        <fieldset className="space-y-2 pt-1 border-t border-border/20">
          <legend className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Edit {collection.itemLabel}
          </legend>
          {itemFields.map(field => (
            <div key={field.key}>
              <ContentFieldControl
                field={field}
                value={selectedItem[field.key]}
                onChange={v => setItemField(field.key, v)}
              />
              {field.description && (
                <p className="text-[10px] text-muted-foreground/50 mt-0.5 px-0.5">{field.description}</p>
              )}
            </div>
          ))}
        </fieldset>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Warning className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-400 break-all">{validationError}</p>
        </div>
      )}

      {/* Apply / Reset */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={apply}
          disabled={!isDirty}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors',
            isDirty
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-card/30 text-muted-foreground/40 cursor-not-allowed'
          )}
        >
          {isDirty ? <FloppyDisk className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
          {isDirty ? 'Apply' : 'Saved'}
        </button>
        <button
          onClick={reset}
          disabled={!isDirty}
          className={cn(
            'px-3 py-1.5 text-xs rounded-lg transition-colors',
            isDirty
              ? 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
              : 'text-muted-foreground/30 cursor-not-allowed'
          )}
        >
          <ArrowUUpLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Undo / Redo */}
      <UndoRedoBar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={performUndo}
        onRedo={performRedo}
      />
    </div>
  )
}

// ─── Undo/Redo Bar ──────────────────────────────────────────────────────────

function UndoRedoBar({ canUndo, canRedo, onUndo, onRedo }: {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}) {
  return (
    <div className="flex items-center gap-1 pt-1 border-t border-border/20">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={cn(
          'flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] rounded-lg transition-colors',
          canUndo
            ? 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
            : 'text-muted-foreground/30 cursor-not-allowed'
        )}
      >
        <ArrowCounterClockwise className="h-3 w-3" />
        Undo
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={cn(
          'flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] rounded-lg transition-colors',
          canRedo
            ? 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
            : 'text-muted-foreground/30 cursor-not-allowed'
        )}
      >
        <ArrowClockwise className="h-3 w-3" />
        Redo
      </button>
    </div>
  )
}
