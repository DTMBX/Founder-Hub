/**
 * Pipeline Step: Scaffold
 *
 * Takes a validated input + blueprint and produces a ScaffoldResult:
 * an ordered list of pages, each with sections, ready for rendering.
 */

import type {
  GenerationInput,
  ScaffoldResult,
  ScaffoldedPage,
  ScaffoldedSection,
  ScaffoldMetadata,
} from './types'

// ─── Blueprint Shape (minimal for scaffolding) ──────────────

interface BlueprintPage {
  readonly slug: string
  readonly title: string
  readonly template: string
  readonly required_sections?: readonly string[]
}

interface BlueprintSection {
  readonly id: string
  readonly label: string
  readonly component: string
  readonly order?: number
  readonly required?: boolean
}

interface BlueprintForScaffold {
  readonly id: string
  readonly version: string
  readonly required_pages: readonly BlueprintPage[]
  readonly required_sections: readonly BlueprintSection[]
}

// ─── Scaffold ────────────────────────────────────────────────

/**
 * Scaffolds pages and sections from the blueprint definition,
 * merging any operator-provided page content.
 */
export function scaffold(
  input: GenerationInput,
  blueprint: BlueprintForScaffold,
): ScaffoldResult {
  const now = input.requestedAt || new Date().toISOString()

  // Build section index
  const sectionIndex = new Map<string, BlueprintSection>()
  for (const s of blueprint.required_sections) {
    sectionIndex.set(s.id, s)
  }

  // Build pages
  const pages: ScaffoldedPage[] = blueprint.required_pages.map((bp) => {
    const userContent = input.pageContent?.[bp.slug]

    // Determine which sections go on this page
    const pageSectionIds = bp.required_sections ?? []
    const sections: ScaffoldedSection[] = pageSectionIds
      .map((sId) => {
        const def = sectionIndex.get(sId)
        if (!def) return null
        const content =
          userContent?.sections?.[sId] ?? userContent?.body ?? ''
        return {
          id: def.id,
          component: def.component,
          order: def.order ?? 0,
          content,
          required: def.required !== false,
        } satisfies ScaffoldedSection
      })
      .filter((s): s is ScaffoldedSection => s !== null)
      .sort((a, b) => a.order - b.order)

    return {
      slug: bp.slug,
      title: userContent?.title ?? bp.title,
      template: bp.template,
      sections,
    } satisfies ScaffoldedPage
  })

  const metadata: ScaffoldMetadata = {
    blueprintId: blueprint.id,
    blueprintVersion: blueprint.version,
    presetId: input.presetId ?? 'default',
    businessName: input.businessName,
    generatedAt: now,
  }

  return { pages, metadata }
}
