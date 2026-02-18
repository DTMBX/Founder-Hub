/**
 * apps/sitegen/wizard/PublishReadinessGate.ts
 *
 * Fail-closed readiness check that runs before any publish attempt.
 * Every condition must pass — a single failure blocks the publish.
 *
 * This gate is independent of UI and can be invoked from CLI, API, or test.
 */
import {
  type WizardState,
  WIZARD_STEPS,
  STEP_DATA_KEYS,
  STEP_SCHEMAS,
  type WizardStepId,
} from './WizardSchema.js'
import {
  validateBlueprintQuality,
  type BlueprintForQuality,
} from '../blueprints/validateBlueprintQuality.js'

// ─── Types ───────────────────────────────────────────────────────────

export interface ReadinessCheck {
  readonly id: string
  readonly label: string
  readonly passed: boolean
  readonly message: string
}

export interface ReadinessResult {
  readonly ready: boolean
  readonly checks: readonly ReadinessCheck[]
  readonly blockers: readonly string[]
}

// ─── Gate ─────────────────────────────────────────────────────────────

/**
 * Evaluate publish readiness for a wizard state + its resolved blueprint.
 * Fail-closed: returns `ready: false` if ANY check fails.
 */
export function evaluatePublishReadiness(
  state: WizardState,
  blueprint: BlueprintForQuality | null,
): ReadinessResult {
  const checks: ReadinessCheck[] = []

  // 1. All wizard steps completed
  for (const step of WIZARD_STEPS) {
    const dataKey = STEP_DATA_KEYS[step]
    const hasData = state[dataKey] !== undefined
    checks.push({
      id: `step-${step}`,
      label: `Step "${step}" completed`,
      passed: hasData,
      message: hasData ? 'Completed.' : `Step "${step}" has not been completed.`,
    })
  }

  // 2. All step data passes Zod validation
  for (const step of WIZARD_STEPS) {
    const dataKey = STEP_DATA_KEYS[step]
    const data = state[dataKey]
    if (data !== undefined) {
      const schema = STEP_SCHEMAS[step]
      const result = schema.safeParse(data)
      checks.push({
        id: `valid-${step}`,
        label: `Step "${step}" data valid`,
        passed: result.success,
        message: result.success
          ? 'Valid.'
          : `Validation errors: ${(result as { success: false; error: { issues: { message: string }[] } }).error.issues.map((i: { message: string }) => i.message).join(', ')}`,
      })
    }
  }

  // 3. Blueprint resolved and quality-valid
  if (blueprint) {
    const quality = validateBlueprintQuality(blueprint)
    checks.push({
      id: 'blueprint-quality',
      label: 'Blueprint passes quality standard',
      passed: quality.valid,
      message: quality.valid
        ? 'Blueprint quality validated.'
        : `Blueprint quality errors: ${quality.errors.map(e => e.message).join('; ')}`,
    })
  } else {
    checks.push({
      id: 'blueprint-quality',
      label: 'Blueprint passes quality standard',
      passed: false,
      message: 'No blueprint resolved — cannot validate quality.',
    })
  }

  // 4. Preview was viewed
  const previewData = state.preview
  const previewViewed = previewData?.previewViewed === true
  checks.push({
    id: 'preview-viewed',
    label: 'Preview viewed by operator',
    passed: previewViewed,
    message: previewViewed
      ? `Preview viewed at ${new Date(previewData!.previewTimestamp).toISOString()}.`
      : 'Operator must view the watermarked preview before publishing.',
  })

  // 5. Publish target selected and confirmed
  const publishData = state.publish
  const publishConfirmed = publishData?.confirmed === true && !!publishData?.targetId
  checks.push({
    id: 'publish-confirmed',
    label: 'Publish confirmed with target',
    passed: publishConfirmed,
    message: publishConfirmed
      ? `Publishing to "${publishData!.targetId}".`
      : 'Publish target must be selected and confirmed.',
  })

  // 6. Business info present
  const infoPresent = !!state.businessInfo?.businessName && !!state.businessInfo?.email
  checks.push({
    id: 'business-info',
    label: 'Business information provided',
    passed: infoPresent,
    message: infoPresent
      ? 'Business name and email present.'
      : 'Business name and email are required.',
  })

  // Aggregate
  const blockers = checks.filter(c => !c.passed).map(c => c.message)

  return {
    ready: blockers.length === 0,
    checks,
    blockers,
  }
}

/**
 * Quick boolean check — delegates to evaluatePublishReadiness.
 */
export function isReadyToPublish(
  state: WizardState,
  blueprint: BlueprintForQuality | null,
): boolean {
  return evaluatePublishReadiness(state, blueprint).ready
}
