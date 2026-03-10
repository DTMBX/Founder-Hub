/**
 * field-controls.tsx — Shared field editor controls for the visual builder.
 *
 * Used by both InspectorPanel (scalar section properties) and
 * CollectionPanel (array-of-object item editing). Each control
 * is driven by an EditableField descriptor from the registry.
 */

import { useState } from 'react'
import type { EditableField } from '@/registry/sections'

// ─── Scalar Field Controls ──────────────────────────────────────────────────

export function TextField({ field, value, onChange }: {
  field: EditableField
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium text-muted-foreground">{field.label}</label>
      <input
        type={field.type === 'url' ? 'url' : 'text'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full px-2 py-1.5 text-xs rounded-md border border-border/40 bg-card/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
    </div>
  )
}

export function TextareaField({ field, value, onChange }: {
  field: EditableField
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium text-muted-foreground">{field.label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        className="w-full px-2 py-1.5 text-xs rounded-md border border-border/40 bg-card/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y"
      />
    </div>
  )
}

export function NumberField({ field, value, onChange }: {
  field: EditableField
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium text-muted-foreground">{field.label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        placeholder={field.placeholder}
        className="w-full px-2 py-1.5 text-xs rounded-md border border-border/40 bg-card/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
    </div>
  )
}

export function BooleanField({ label, checked, onChange }: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/50"
      />
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </label>
  )
}

export function SelectField({ field, value, onChange }: {
  field: EditableField
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-medium text-muted-foreground">{field.label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-2 py-1.5 text-xs rounded-md border border-border/40 bg-card/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
      >
        {field.options?.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

export function TagsField({ field, value, onChange }: {
  field: EditableField
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const trimmed = input.trim()
    if (!trimmed || value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInput('')
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium text-muted-foreground">{field.label}</label>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary"
            >
              {tag}
              <button
                onClick={() => removeTag(i)}
                className="hover:text-red-400 transition-colors leading-none"
                aria-label={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          placeholder={field.placeholder || 'Add item\u2026'}
          className="flex-1 px-2 py-1 text-xs rounded-md border border-border/40 bg-card/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={addTag}
          disabled={!input.trim()}
          className="px-2 py-1 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export function ImageField({ field, value, onChange }: {
  field: EditableField
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium text-muted-foreground">{field.label}</label>
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || 'https://\u2026'}
        className="w-full px-2 py-1.5 text-xs rounded-md border border-border/40 bg-card/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
      />
      {value && (
        <div className="rounded-md overflow-hidden border border-border/20 bg-card/20">
          <img
            src={value}
            alt={field.label}
            className="w-full h-20 object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Content Field Renderer ─────────────────────────────────────────────────

export function ContentFieldControl({ field, value, onChange }: {
  field: EditableField
  value: unknown
  onChange: (v: unknown) => void
}) {
  switch (field.type) {
    case 'text':
    case 'url':
      return <TextField field={field} value={String(value ?? '')} onChange={onChange} />
    case 'textarea':
      return <TextareaField field={field} value={String(value ?? '')} onChange={onChange} />
    case 'number':
      return <NumberField field={field} value={Number(value ?? 0)} onChange={v => onChange(v)} />
    case 'boolean':
      return <BooleanField label={field.label} checked={Boolean(value)} onChange={onChange} />
    case 'select':
      return <SelectField field={field} value={String(value ?? '')} onChange={onChange} />
    case 'tags':
      return <TagsField field={field} value={Array.isArray(value) ? value as string[] : []} onChange={onChange} />
    case 'image':
      return <ImageField field={field} value={String(value ?? '')} onChange={onChange} />
    default:
      return (
        <div className="space-y-1">
          <label className="text-[10px] font-medium text-muted-foreground">{field.label}</label>
          <p className="text-xs text-muted-foreground/60 italic">
            {field.type} editor not yet supported
          </p>
        </div>
      )
  }
}
