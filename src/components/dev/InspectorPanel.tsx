/**
 * InspectorPanel.tsx — Section inspector with draft-based editing.
 *
 * Reacts to useStudioSelection() and renders editable fields for the
 * currently selected section. Uses draft-commit pattern: local changes
 * are applied only when the operator clicks "Apply", validated through
 * Zod schemas, and recorded in history-store.
 *
 * Config fields (title, enabled, investorRelevant) are available for all sections.
 * Content fields are available only when registry editableFields are defined.
 * Undo/Redo buttons apply history entries to actual KV storage.
 */

import { useSectionInspector } from '@/lib/use-section-inspector'
import { useStudioPermissions } from '@/lib/studio-permissions'
import { BooleanField, ContentFieldControl } from './field-controls'
import { cn } from '@/lib/utils'
import {
  ArrowCounterClockwise, ArrowClockwise, FloppyDisk,
  ArrowUUpLeft, Warning, CheckCircle, Lock,
} from '@phosphor-icons/react'

// ─── Main Panel ─────────────────────────────────────────────────────────────

export default function InspectorPanel() {
  const {
    sectionId,
    sectionType,
    label,
    kvKey,
    editableFields,
    configDraft,
    contentDraft,
    isDirty,
    validationError,
    apply,
    reset,
    setConfigField,
    setContentField,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
  } = useSectionInspector()
  const perms = useStudioPermissions()
  const canEdit = perms.can('studio:edit-props')
  const canUndoRedo = perms.can('studio:undo-redo')

  // ── No selection state ──

  if (!sectionId) {
    return (
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground text-center py-4">
          Select a section to inspect and edit its properties.
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

  // ── Section info header ──

  return (
    <div className="p-3 space-y-3">
      {/* Section header */}
      <div className="rounded-lg bg-card/40 border border-border/30 p-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{label || sectionType}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{sectionType}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>id: {sectionId}</span>
          {kvKey && <span>• kv: {kvKey}</span>}
        </div>
      </div>

      {/* Config fields — always shown, editable only with permission */}
      {configDraft && (
        <fieldset className="space-y-2" disabled={!canEdit}>
          <legend className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Section Config {!canEdit && <Lock className="inline h-2.5 w-2.5 ml-1 text-muted-foreground/40" />}
          </legend>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground">Title</label>
            <input
              type="text"
              value={configDraft.title}
              onChange={e => setConfigField('title', e.target.value)}
              className="w-full px-2 py-1.5 text-xs rounded-md border border-border/40 bg-card/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <BooleanField
            label="Enabled"
            checked={configDraft.enabled}
            onChange={v => setConfigField('enabled', v)}
          />

          <BooleanField
            label="Investor Relevant"
            checked={configDraft.investorRelevant}
            onChange={v => setConfigField('investorRelevant', v)}
          />
        </fieldset>
      )}

      {/* Content editable fields — only if registry has them */}
      {editableFields.length > 0 && contentDraft && (
        <fieldset className="space-y-2 pt-1 border-t border-border/20" disabled={!canEdit}>
          <legend className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Content Fields {!canEdit && <Lock className="inline h-2.5 w-2.5 ml-1 text-muted-foreground/40" />}
          </legend>
          {editableFields.map(field => (
            <div key={field.key}>
              <ContentFieldControl
                field={field}
                value={contentDraft[field.key]}
                onChange={v => setContentField(field.key, v)}
              />
              {field.description && (
                <p className="text-[10px] text-muted-foreground/50 mt-0.5 px-0.5">{field.description}</p>
              )}
            </div>
          ))}
        </fieldset>
      )}

      {/* No content fields message */}
      {editableFields.length === 0 && (
        <p className="text-[10px] text-muted-foreground/60 italic py-1">
          No content fields available for this section type.
          {kvKey && ' Edit content in the admin panel.'}
        </p>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Warning className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-400">{validationError}</p>
        </div>
      )}

      {/* Apply / Reset */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={canEdit ? apply : undefined}
          disabled={!isDirty || !canEdit}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg transition-colors',
            isDirty && canEdit
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-card/30 text-muted-foreground/40 cursor-not-allowed'
          )}
          title={!canEdit ? perms.why('studio:edit-props') : undefined}
        >
          {!canEdit ? <Lock className="h-3.5 w-3.5" /> : isDirty ? <FloppyDisk className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
          {!canEdit ? 'Read-Only' : isDirty ? 'Apply' : 'Saved'}
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
        canUndo={canUndo && canUndoRedo}
        canRedo={canRedo && canUndoRedo}
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
