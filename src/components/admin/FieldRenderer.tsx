/**
 * FieldRenderer.tsx — Reusable field renderer for typed content modules.
 *
 * Given a FieldDef + current value + onChange callback, renders the
 * appropriate UI control. Replaces per-module hand-rolled field JSX.
 *
 * Supported field kinds:
 *  text, textarea, number, boolean, select, url, image, tags, date
 */

import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Plus, Trash, ArrowUp, ArrowDown, MagicWand } from '@phosphor-icons/react'
import type { FieldDef } from '@/lib/content-registry'

// ─── Props ──────────────────────────────────────────────────────────────────

export interface FieldRendererProps {
  field: FieldDef
  value: unknown
  onChange: (key: string, value: unknown) => void
  /** Optional: override the auto-generated id */
  id?: string
  disabled?: boolean
  /** Optional: AI suggest callback — rendered as a wand button for eligible fields */
  onSuggest?: (fieldKey: string, mode: 'rewrite' | 'variants') => void
  /** Whether an AI suggestion is currently loading for this field */
  aiLoading?: boolean
}

// ─── Tag Editor (for 'tags' kind) ───────────────────────────────────────────

function TagEditor({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FieldDef
  value: string[]
  onChange: (key: string, value: string[]) => void
  disabled?: boolean
}) {
  const [newTag, setNewTag] = useState('')

  const addTag = useCallback(() => {
    const trimmed = newTag.trim()
    if (!trimmed) return
    if (value.includes(trimmed)) return
    onChange(field.key, [...value, trimmed])
    setNewTag('')
  }, [newTag, value, onChange, field.key])

  const removeTag = useCallback((index: number) => {
    onChange(field.key, value.filter((_, i) => i !== index))
  }, [value, onChange, field.key])

  const moveTag = useCallback((index: number, direction: 'up' | 'down') => {
    const arr = [...value]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= arr.length) return
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    onChange(field.key, arr)
  }, [value, onChange, field.key])

  return (
    <div className="space-y-2">
      {/* Existing tags */}
      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map((tag, index) => (
            <div key={`${tag}-${index}`} className="flex items-center gap-2 group">
              <Badge variant="secondary" className="text-sm px-3 py-1.5 flex-1 justify-start">
                {tag}
              </Badge>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => moveTag(index, 'up')}
                  disabled={disabled || index === 0}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => moveTag(index, 'down')}
                  disabled={disabled || index === value.length - 1}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                  onClick={() => removeTag(index)}
                  disabled={disabled}
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add tag */}
      <div className="flex gap-2">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder={field.placeholder || 'Add item...'}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          className="flex-1"
          disabled={disabled}
        />
        <Button onClick={addTag} size="sm" disabled={disabled || !newTag.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  )
}

// ─── Main Renderer ──────────────────────────────────────────────────────────

export default function FieldRenderer({
  field,
  value,
  onChange,
  id: customId,
  disabled = false,
  onSuggest,
  aiLoading = false,
}: FieldRendererProps) {
  const fieldId = customId || `field-${field.key}`

  // Fields eligible for AI suggestions
  const canSuggest =
    onSuggest && !disabled && (field.kind === 'text' || field.kind === 'textarea' || field.kind === 'tags')

  // Wrapper for label + description + control + suggest button
  const wrap = (control: React.ReactNode) => (
    <div className="space-y-1.5">
      {field.kind !== 'boolean' && (
        <div className="flex items-start justify-between gap-2">
          <div>
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
            )}
          </div>
          {canSuggest && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                onClick={() => onSuggest(field.key, 'rewrite')}
                disabled={aiLoading}
                title="AI: Suggest Rewrite"
              >
                <MagicWand className="h-3.5 w-3.5" weight="duotone" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                onClick={() => onSuggest(field.key, 'variants')}
                disabled={aiLoading}
                title="AI: Suggest Variants"
              >
                <MagicWand className="h-3.5 w-3.5" weight="fill" />
              </Button>
            </div>
          )}
        </div>
      )}
      {control}
    </div>
  )

  switch (field.kind) {
    case 'text':
      return wrap(
        <Input
          id={fieldId}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )

    case 'textarea':
      return wrap(
        <Textarea
          id={fieldId}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows || 3}
          className="resize-none"
          disabled={disabled}
        />
      )

    case 'number':
      return wrap(
        <Input
          id={fieldId}
          type="number"
          value={(value as number) ?? 0}
          onChange={(e) => onChange(field.key, parseFloat(e.target.value) || 0)}
          min={field.min}
          max={field.max}
          step={field.step}
          disabled={disabled}
        />
      )

    case 'boolean':
      return (
        <div className="flex items-center justify-between py-1">
          <div>
            <Label htmlFor={fieldId} className="text-sm font-medium cursor-pointer">
              {field.label}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
            )}
          </div>
          <Switch
            id={fieldId}
            checked={!!value}
            onCheckedChange={(checked) => onChange(field.key, checked)}
            disabled={disabled}
          />
        </div>
      )

    case 'select':
      return wrap(
        <Select
          value={(value as string) ?? ''}
          onValueChange={(v) => onChange(field.key, v)}
          disabled={disabled}
        >
          <SelectTrigger id={fieldId}>
            <SelectValue placeholder={field.placeholder || 'Select...'} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case 'url':
      return wrap(
        <Input
          id={fieldId}
          type="url"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder || 'https://...'}
          disabled={disabled}
        />
      )

    case 'image':
      return wrap(
        <div className="space-y-2">
          <Input
            id={fieldId}
            type="url"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder || 'Image URL...'}
            disabled={disabled}
          />
          {typeof value === 'string' && value.startsWith('http') && (
            <div className="rounded-md overflow-hidden border border-border/50 bg-muted/20 max-w-[200px]">
              <img
                src={value}
                alt={field.label}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          )}
        </div>
      )

    case 'tags':
      return wrap(
        <TagEditor
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          disabled={disabled}
        />
      )

    case 'date':
      return wrap(
        <Input
          id={fieldId}
          type="month"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )

    default:
      return wrap(
        <Input
          id={fieldId}
          value={String(value ?? '')}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )
  }
}
