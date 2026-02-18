/**
 * apps/sitegen/wizard/WizardStateMachine.ts
 *
 * Linear state machine for the Operator Wizard.
 * Steps proceed in fixed order — no branches, no dead ends.
 * Each step must be validated before advancing.
 *
 * Invariants:
 * - Operator cannot skip steps
 * - Operator cannot revisit steps beyond the previous step
 * - All step data is validated via Zod before transition
 * - The machine is deterministic: same input → same state
 */
import {
  WIZARD_STEPS,
  STEP_SCHEMAS,
  STEP_DATA_KEYS,
  type WizardStepId,
  type WizardState,
} from './WizardSchema.js'

// ─── Types ───────────────────────────────────────────────────────────

export interface StepTransitionResult {
  readonly success: boolean
  readonly state: WizardState
  readonly errors: readonly string[]
}

// ─── Factory ─────────────────────────────────────────────────────────

/** Create a fresh wizard state positioned at the first step. */
export function createWizardState(): WizardState {
  return {
    currentStep: WIZARD_STEPS[0],
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function stepIndex(step: WizardStepId): number {
  return WIZARD_STEPS.indexOf(step)
}

/** Check whether a given step ID is a valid wizard step. */
export function isValidStep(step: string): step is WizardStepId {
  return (WIZARD_STEPS as readonly string[]).includes(step)
}

// ─── Advance ─────────────────────────────────────────────────────────

/**
 * Attempt to advance the wizard from `currentStep` to the next step.
 * Validates the step data with the appropriate Zod schema.
 * Returns an immutable result — never mutates the input state.
 */
export function advanceStep(
  state: WizardState,
  stepData: unknown,
): StepTransitionResult {
  const currentIdx = stepIndex(state.currentStep)

  // Already at the final step — cannot advance further
  if (currentIdx >= WIZARD_STEPS.length - 1) {
    return {
      success: false,
      state,
      errors: ['Already at the final step. Use confirmPublish to complete the wizard.'],
    }
  }

  // Validate step data against the schema for the current step
  const schema = STEP_SCHEMAS[state.currentStep]
  const parsed = schema.safeParse(stepData)

  if (!parsed.success) {
    const messages = parsed.error.issues.map(
      (issue: { path: (string | number)[]; message: string }) =>
        `${issue.path.join('.')}: ${issue.message}`,
    )
    return { success: false, state, errors: messages }
  }

  const dataKey = STEP_DATA_KEYS[state.currentStep]
  const nextStep = WIZARD_STEPS[currentIdx + 1]

  const newState: WizardState = {
    ...state,
    [dataKey]: parsed.data,
    currentStep: nextStep,
  }

  return { success: true, state: newState, errors: [] }
}

// ─── Go Back ─────────────────────────────────────────────────────────

/**
 * Move the wizard back one step. Does not clear the data for the step
 * being left (allows operator to return and see what they entered).
 * Cannot go back from the first step.
 */
export function goBackStep(state: WizardState): StepTransitionResult {
  const currentIdx = stepIndex(state.currentStep)

  if (currentIdx <= 0) {
    return {
      success: false,
      state,
      errors: ['Already at the first step.'],
    }
  }

  const prevStep = WIZARD_STEPS[currentIdx - 1]
  return {
    success: true,
    state: { ...state, currentStep: prevStep },
    errors: [],
  }
}

// ─── Step Completeness Query ─────────────────────────────────────────

/**
 * Returns which steps have been completed (have valid data stored).
 * Useful for rendering a progress indicator.
 */
export function completedSteps(state: WizardState): readonly WizardStepId[] {
  const completed: WizardStepId[] = []
  for (const step of WIZARD_STEPS) {
    const dataKey = STEP_DATA_KEYS[step]
    if (state[dataKey] !== undefined) {
      completed.push(step)
    }
  }
  return completed
}

/**
 * Return the percentage of steps completed, 0–100.
 */
export function wizardProgress(state: WizardState): number {
  const done = completedSteps(state).length
  // Final step (publish) counts as completion only when confirmed
  return Math.round((done / WIZARD_STEPS.length) * 100)
}

/**
 * Whether the wizard has been fully completed (all steps including publish).
 */
export function isWizardComplete(state: WizardState): boolean {
  return completedSteps(state).length === WIZARD_STEPS.length
}
