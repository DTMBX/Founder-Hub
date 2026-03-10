/**
 * StructurePanel.tsx — Section structure editor for the DevCustomizer.
 *
 * Provides a sortable list of sections with drag-to-reorder via @dnd-kit,
 * add/remove controls, and integration with the studio selection store.
 * All mutations flow through useSectionStructure → KV → history-store.
 *
 * Hero section is pinned at the top and cannot be dragged or removed.
 */

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSectionStructure } from '@/lib/use-section-structure'
import { useStudioSelection } from '@/lib/use-studio-selection'
import { SECTION_REGISTRY } from '@/registry/sections'
import { cn } from '@/lib/utils'
import {
  DotsSixVertical, Plus, Trash, EyeSlash, Star,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Section } from '@/lib/types'

// ─── Sortable Item ──────────────────────────────────────────────────────────

function SortableSectionItem({
  section,
  isSelected,
  onSelect,
  onRemove,
}: {
  section: Section
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const registry = SECTION_REGISTRY[section.type]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer',
        isDragging && 'opacity-50 border-primary/40 bg-primary/5 z-10',
        isSelected && !isDragging && 'bg-emerald-500/10 border-emerald-500/30',
        !isSelected && !isDragging && 'border-transparent hover:bg-accent/10',
      )}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground/50 hover:text-muted-foreground"
        tabIndex={-1}
      >
        <DotsSixVertical className="h-3.5 w-3.5" />
      </button>

      {/* Label */}
      <span className="flex-1 truncate text-xs font-medium">
        {registry?.label || section.title}
      </span>

      {/* Type badge */}
      <span className="text-[10px] text-muted-foreground font-mono">
        {section.type}
      </span>

      {/* Disabled indicator */}
      {!section.enabled && (
        <EyeSlash className="h-3 w-3 text-amber-500 shrink-0" />
      )}

      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-red-400 transition-all"
        title="Remove section"
      >
        <Trash className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Static Hero Row ────────────────────────────────────────────────────────

function HeroRow({ isSelected, onSelect }: {
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg border text-sm cursor-pointer',
        isSelected ? 'bg-emerald-500/10 border-emerald-500/30' : 'border-transparent hover:bg-accent/10',
      )}
      onClick={onSelect}
    >
      <Star className="h-3.5 w-3.5 text-amber-500 shrink-0 ml-0.5" weight="fill" />
      <span className="flex-1 truncate text-xs font-medium">Hero</span>
      <span className="text-[10px] text-muted-foreground font-mono">hero</span>
      <span className="text-[10px] text-muted-foreground/50">pinned</span>
    </div>
  )
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

export default function StructurePanel() {
  const {
    orderedSections,
    moveSection,
    addSection,
    removeSection,
    selectSection,
    addableTypes,
  } = useSectionStructure()
  const selection = useStudioSelection()
  const [showAddMenu, setShowAddMenu] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Split hero from sortable sections
  const heroSection = orderedSections.find(s => s.type === 'hero')
  const sortableSections = orderedSections.filter(s => s.type !== 'hero')

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Map back to full orderedSections indices (includes hero)
    const fromIndex = orderedSections.findIndex(s => s.id === active.id)
    const toIndex = orderedSections.findIndex(s => s.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return

    const error = moveSection(fromIndex, toIndex)
    if (error) toast.error(error.message)
  }

  const handleRemove = (sectionId: string) => {
    const section = orderedSections.find(s => s.id === sectionId)
    if (!section) return
    if (!confirm(`Remove "${section.title}"? This can be undone via history.`)) return

    const error = removeSection(sectionId)
    if (error) toast.error(error.message)
    else toast.success(`Removed "${section.title}"`)
  }

  const handleAdd = (type: string) => {
    const error = addSection(type)
    if (error) {
      toast.error(error.message)
    } else {
      const registry = SECTION_REGISTRY[type]
      toast.success(`Added "${registry?.label || type}"`)
    }
    setShowAddMenu(false)
  }

  return (
    <div className="p-2 space-y-2">
      <p className="text-[10px] text-muted-foreground px-1">
        Drag to reorder sections. Hero is always pinned at top.
      </p>

      {/* Hero — static, non-sortable */}
      {heroSection && (
        <HeroRow
          isSelected={selection.sectionId === heroSection.id}
          onSelect={() => selectSection(heroSection.id)}
        />
      )}

      {/* Sortable section list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableSections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortableSections.map(section => (
            <SortableSectionItem
              key={section.id}
              section={section}
              isSelected={selection.sectionId === section.id}
              onSelect={() => selectSection(section.id)}
              onRemove={() => handleRemove(section.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add section control */}
      <div className="relative pt-1">
        <button
          onClick={() => setShowAddMenu(prev => !prev)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Section
        </button>

        {showAddMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-background/95 backdrop-blur-lg shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
            {addableTypes.length > 0 ? (
              addableTypes.map(entry => (
                <button
                  key={entry.type}
                  onClick={() => handleAdd(entry.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-accent/10 transition-colors"
                >
                  <span className="flex-1">{entry.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{entry.type}</span>
                </button>
              ))
            ) : (
              <p className="p-3 text-[10px] text-muted-foreground text-center">
                All available section types are already present.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Section count */}
      <p className="text-[10px] text-muted-foreground text-center">
        {orderedSections.length} section{orderedSections.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
