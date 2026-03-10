/**
 * ContentEditorShell.tsx — Generic editor shell for registry-backed content.
 *
 * Renders grouped fields from the content registry using FieldRenderer,
 * with integrated save/reset toolbar, dirty indicator, and validation.
 *
 * Use for singleton modules (About, Profile, Investor Settings) where
 * the field layout is uniform. Collections with custom CRUD UI can
 * use useContentEditor directly and render their own layout.
 *
 * Usage:
 *   <ContentEditorShell registryId="about" />
 *   <ContentEditorShell registryId="profile" header={<CustomHeader />} />
 */

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FloppyDisk, ArrowCounterClockwise, Warning, Check, CircleNotch } from '@phosphor-icons/react'
import { useContentEditor, type ContentEditor } from '@/hooks/use-content-editor'
import { useAiDraft } from '@/hooks/use-ai-draft'
import { persistToFile, isLocalhost } from '@/lib/local-storage-kv'
import FieldRenderer from './FieldRenderer'
import AiDraftProposal from './AiDraftProposal'
import { useState, useCallback } from 'react'

// ─── Props ──────────────────────────────────────────────────────────────────

interface ContentEditorShellProps {
  /** Registry id to load fields and data */
  registryId: string
  /**
   * Optional external editor instance. When provided, the shell re-uses it
   * instead of creating its own — avoids duplicate useKV state for the same
   * key (e.g. AboutManager passes one editor to both fields and UpdatesSection).
   */
  editor?: ContentEditor<Record<string, unknown>>
  /** Optional header slot rendered above the fields */
  header?: React.ReactNode
  /** Optional footer slot rendered below the fields (before toolbar) */
  footer?: React.ReactNode
  /** Additional children rendered inside the editor */
  children?: React.ReactNode
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContentEditorShell({
  registryId,
  editor: externalEditor,
  header,
  footer,
  children,
}: ContentEditorShellProps) {
  const internalEditor = useContentEditor(registryId)
  const editor = externalEditor || internalEditor
  const ai = useAiDraft(registryId, editor)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [isPersisting, setIsPersisting] = useState(false)

  const handleSave = useCallback(async () => {
    if (!editor.isDirty) return
    setIsSaving(true)
    try {
      await editor.save()
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 3000)
    } finally {
      setIsSaving(false)
    }
  }, [editor])

  /** Force-persist to disk even when not dirty (re-save current state to file) */
  const handlePersistToFile = useCallback(async () => {
    if (!isLocalhost()) return
    setIsPersisting(true)
    try {
      await persistToFile(editor.key)
      setShowSaved(true)
      setTimeout(() => setShowSaved(false), 3000)
    } finally {
      setIsPersisting(false)
    }
  }, [editor.key])

  const handleReset = useCallback(() => {
    editor.reset()
  }, [editor])

  const handleFieldChange = useCallback(
    (key: string, value: unknown) => {
      editor.setField(key, value)
    },
    [editor]
  )

  const handleSuggest = useCallback(
    (fieldKey: string, mode: 'rewrite' | 'variants') => {
      ai.suggest(fieldKey, mode)
    },
    [ai]
  )

  return (
    <div className="space-y-6">
      {/* Save indicator with persist status */}
      {showSaved && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-4 duration-300">
          {editor.lastPersistOk === false ? (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 px-3 py-1.5">
              <Warning className="h-3.5 w-3.5 mr-1.5" weight="fill" />
              Saved to browser — file write failed (is dev server running?)
            </Badge>
          ) : (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/40 px-3 py-1.5">
              <Check className="h-3.5 w-3.5 mr-1.5" weight="bold" />
              {editor.lastPersistOk ? 'Saved to disk' : 'Saved'}
            </Badge>
          )}
        </div>
      )}

      {/* Validation error banner */}
      {editor.validationError && (
        <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm text-amber-400">
          <Warning className="h-4 w-4 shrink-0 mt-0.5" weight="fill" />
          <div className="min-w-0">
            <span className="font-medium">Validation Issue</span>
            <p className="text-xs text-amber-400/80 mt-0.5">{editor.validationError}</p>
          </div>
        </div>
      )}

      {/* Optional header */}
      {header}

      {/* AI Proposal Panel — shown above fields when a proposal is active */}
      <AiDraftProposal
        status={ai.status}
        proposal={ai.proposal}
        error={ai.error}
        onAccept={ai.accept}
        onDismiss={ai.dismiss}
      />

      {/* Grouped fields */}
      {Array.from(editor.fieldGroups).map(([groupName, fields]) => (
        <Card key={groupName} className="p-6 bg-card/50 border-border/50">
          <h3 className="text-lg font-semibold mb-1">{groupName}</h3>
          <div className="space-y-5 mt-4">
            {fields.map((field) => (
              <FieldRenderer
                key={field.key}
                field={field}
                value={editor.getField(field.key)}
                onChange={handleFieldChange}
                onSuggest={handleSuggest}
                aiLoading={ai.isLoading && ai.proposal?.fieldKey === field.key}
              />
            ))}
          </div>
        </Card>
      ))}

      {/* Optional children */}
      {children}

      {/* Optional footer */}
      {footer}

      {/* Action bar */}
      {editor.fields.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {editor.isDirty ? (
              <Badge variant="outline" className="text-amber-400 border-amber-500/40">
                Unsaved changes
              </Badge>
            ) : (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-green-500" /> Up to date
              </span>
            )}
            {editor.lastSavedAt && (
              <span>Last saved {editor.lastSavedAt.toLocaleTimeString()}</span>
            )}
            {editor.lastPersistOk === false && !editor.isDirty && (
              <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-[10px]">
                Browser only
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!editor.isDirty}
            >
              <ArrowCounterClockwise className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            {isLocalhost() && !editor.isDirty && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePersistToFile}
                disabled={isPersisting}
                className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
              >
                <FloppyDisk className="h-3.5 w-3.5 mr-1.5" />
                {isPersisting ? 'Writing...' : 'Save to File'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!editor.isDirty || isSaving || !!editor.validationError}
            >
              {isSaving ? (
                <CircleNotch className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <FloppyDisk className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
