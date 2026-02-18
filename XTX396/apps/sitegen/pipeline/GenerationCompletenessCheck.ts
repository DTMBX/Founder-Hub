/**
 * apps/sitegen/pipeline/GenerationCompletenessCheck.ts
 *
 * Fail-closed verification that a generated site artifact is complete.
 * Every required page, section, compliance block, and integrity hash
 * must be present before the artifact is releasing for publish.
 *
 * This runs AFTER the pipeline produces a result and BEFORE publish is allowed.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface GeneratedPage {
  readonly slug: string
  readonly title: string
  readonly html: string
  readonly sections: readonly string[]
}

export interface GeneratedArtifact {
  readonly siteId: string
  readonly blueprintId: string
  readonly pages: readonly GeneratedPage[]
  readonly complianceBlocks: readonly string[]
  readonly integrityHash: string
  readonly watermarkApplied: boolean
  readonly generatedAt: number
}

export interface CompletenessCheck {
  readonly id: string
  readonly label: string
  readonly passed: boolean
  readonly message: string
}

export interface CompletenessResult {
  readonly complete: boolean
  readonly artifactId: string
  readonly checks: readonly CompletenessCheck[]
  readonly blockers: readonly string[]
}

// ─── Blueprint Requirements (passed in from blueprint JSON) ──────────

export interface BlueprintRequirements {
  readonly requiredPageSlugs: readonly string[]
  readonly requiredSectionIds: readonly string[]
  readonly requiredComplianceTypes: readonly string[]
  readonly minPages: number
  readonly minSections: number
  readonly requireWatermark: boolean
}

// ─── Completeness Checker ────────────────────────────────────────────

/**
 * Verify a generated artifact against its blueprint's requirements.
 * Fail-closed: any missing requirement blocks publish.
 * Does not short-circuit — returns all errors.
 */
export function checkGenerationCompleteness(
  artifact: GeneratedArtifact,
  requirements: BlueprintRequirements,
): CompletenessResult {
  const checks: CompletenessCheck[] = []

  // 1. Required pages present
  const pageSlugs = new Set(artifact.pages.map(p => p.slug))
  for (const slug of requirements.requiredPageSlugs) {
    const present = pageSlugs.has(slug)
    checks.push({
      id: `page-${slug}`,
      label: `Page "${slug}" present`,
      passed: present,
      message: present ? 'Present.' : `Required page "${slug}" is missing from generated output.`,
    })
  }

  // 2. Minimum page count
  const pageCountOk = artifact.pages.length >= requirements.minPages
  checks.push({
    id: 'page-count',
    label: `Minimum pages (${requirements.minPages})`,
    passed: pageCountOk,
    message: pageCountOk
      ? `${artifact.pages.length} pages generated.`
      : `Only ${artifact.pages.length} pages generated, minimum is ${requirements.minPages}.`,
  })

  // 3. Required sections present (across all pages)
  const allSections = new Set(artifact.pages.flatMap(p => p.sections))
  for (const sectionId of requirements.requiredSectionIds) {
    const present = allSections.has(sectionId)
    checks.push({
      id: `section-${sectionId}`,
      label: `Section "${sectionId}" present`,
      passed: present,
      message: present ? 'Present.' : `Required section "${sectionId}" is missing from generated output.`,
    })
  }

  // 4. Minimum section count
  const sectionCountOk = allSections.size >= requirements.minSections
  checks.push({
    id: 'section-count',
    label: `Minimum sections (${requirements.minSections})`,
    passed: sectionCountOk,
    message: sectionCountOk
      ? `${allSections.size} unique sections generated.`
      : `Only ${allSections.size} sections generated, minimum is ${requirements.minSections}.`,
  })

  // 5. Compliance blocks
  const complianceSet = new Set(artifact.complianceBlocks)
  for (const cType of requirements.requiredComplianceTypes) {
    const present = complianceSet.has(cType)
    checks.push({
      id: `compliance-${cType}`,
      label: `Compliance "${cType}" present`,
      passed: present,
      message: present ? 'Present.' : `Required compliance block "${cType}" is missing.`,
    })
  }

  // 6. Integrity hash present and non-empty
  const hashValid = !!artifact.integrityHash && artifact.integrityHash.length >= 8
  checks.push({
    id: 'integrity-hash',
    label: 'Integrity hash present',
    passed: hashValid,
    message: hashValid
      ? `Hash: ${artifact.integrityHash.slice(0, 16)}...`
      : 'Integrity hash is missing or too short.',
  })

  // 7. Watermark applied (if required)
  if (requirements.requireWatermark) {
    checks.push({
      id: 'watermark',
      label: 'Watermark applied',
      passed: artifact.watermarkApplied,
      message: artifact.watermarkApplied
        ? 'Watermark confirmed.'
        : 'Watermark was not applied. Preview artifacts must be watermarked.',
    })
  }

  // 8. Page HTML non-empty
  for (const page of artifact.pages) {
    const hasContent = page.html.trim().length > 0
    checks.push({
      id: `html-${page.slug}`,
      label: `Page "${page.slug}" has HTML content`,
      passed: hasContent,
      message: hasContent ? 'Has content.' : `Page "${page.slug}" has empty HTML.`,
    })
  }

  // 9. Generation timestamp validity
  const tsValid = artifact.generatedAt > 0 && artifact.generatedAt <= Date.now() + 60_000
  checks.push({
    id: 'timestamp',
    label: 'Generation timestamp valid',
    passed: tsValid,
    message: tsValid
      ? `Generated at ${new Date(artifact.generatedAt).toISOString()}.`
      : 'Generation timestamp is invalid or in the future.',
  })

  // 10. Site ID present
  const siteIdOk = !!artifact.siteId && artifact.siteId.length > 0
  checks.push({
    id: 'site-id',
    label: 'Site ID present',
    passed: siteIdOk,
    message: siteIdOk ? `Site: ${artifact.siteId}` : 'Site ID is missing.',
  })

  // 11. Blueprint ID matches
  const bpIdOk = !!artifact.blueprintId && artifact.blueprintId.length > 0
  checks.push({
    id: 'blueprint-id',
    label: 'Blueprint ID present',
    passed: bpIdOk,
    message: bpIdOk ? `Blueprint: ${artifact.blueprintId}` : 'Blueprint ID is missing.',
  })

  const blockers = checks.filter(c => !c.passed).map(c => c.message)

  return {
    complete: blockers.length === 0,
    artifactId: artifact.siteId,
    checks,
    blockers,
  }
}

/**
 * Quick boolean check — delegates to checkGenerationCompleteness.
 */
export function isGenerationComplete(
  artifact: GeneratedArtifact,
  requirements: BlueprintRequirements,
): boolean {
  return checkGenerationCompleteness(artifact, requirements).complete
}

/**
 * Extract BlueprintRequirements from a blueprint JSON for use with the checker.
 */
export function extractRequirements(blueprint: {
  required_pages: readonly { slug: string }[]
  required_sections: readonly { id: string }[]
  compliance_blocks: readonly { type: string }[]
  content_requirements: { min_pages: number; min_sections: number }
  demo_watermark_profile: { enabled: boolean }
}): BlueprintRequirements {
  return {
    requiredPageSlugs: blueprint.required_pages.map(p => p.slug),
    requiredSectionIds: blueprint.required_sections.map(s => s.id),
    requiredComplianceTypes: [...new Set(blueprint.compliance_blocks.map(b => b.type))],
    minPages: blueprint.content_requirements.min_pages,
    minSections: blueprint.content_requirements.min_sections,
    requireWatermark: blueprint.demo_watermark_profile.enabled,
  }
}
