/**
 * Lead Qualification Config
 *
 * Configuration for lead qualification questions and scoring.
 */

// ─── Qualification Questions ─────────────────────────────────

export interface QualificationQuestion {
  id: string
  question: string
  type: 'select' | 'multiselect' | 'text' | 'scale'
  options?: QualificationOption[]
  required?: boolean
  helpText?: string
}

export interface QualificationOption {
  value: string
  label: string
  score: number // Points added to lead score
}

export const QUALIFICATION_QUESTIONS: QualificationQuestion[] = [
  {
    id: 'budget',
    question: 'What is your budget for this project?',
    type: 'select',
    required: true,
    options: [
      { value: 'under-1k', label: 'Under $1,000', score: 10 },
      { value: '1k-3k', label: '$1,000 - $3,000', score: 30 },
      { value: '3k-5k', label: '$3,000 - $5,000', score: 50 },
      { value: '5k-10k', label: '$5,000 - $10,000', score: 70 },
      { value: '10k-plus', label: '$10,000+', score: 100 },
      { value: 'not-sure', label: 'Not sure yet', score: 20 },
    ],
  },
  {
    id: 'timeline',
    question: 'When do you need the website launched?',
    type: 'select',
    required: true,
    options: [
      { value: 'asap', label: 'ASAP (within 2 weeks)', score: 80 },
      { value: '1-month', label: 'Within 1 month', score: 60 },
      { value: '3-months', label: 'Within 3 months', score: 40 },
      { value: 'flexible', label: 'Flexible / just exploring', score: 20 },
    ],
  },
  {
    id: 'decision-maker',
    question: 'Are you the decision maker for this project?',
    type: 'select',
    required: true,
    options: [
      { value: 'yes', label: 'Yes, I make the final decision', score: 100 },
      { value: 'part', label: 'Part of the decision-making team', score: 60 },
      { value: 'no', label: 'No, I am researching for someone else', score: 20 },
    ],
  },
  {
    id: 'current-site',
    question: 'Do you have an existing website?',
    type: 'select',
    options: [
      { value: 'no', label: 'No, this is a new site', score: 50 },
      { value: 'yes-redesign', label: 'Yes, I need a redesign', score: 60 },
      { value: 'yes-migrate', label: 'Yes, I need to migrate platforms', score: 40 },
      { value: 'yes-improve', label: 'Yes, I just need improvements', score: 30 },
    ],
  },
  {
    id: 'goals',
    question: 'What are your primary goals for the website?',
    type: 'multiselect',
    helpText: 'Select all that apply',
    options: [
      { value: 'generate-leads', label: 'Generate leads / inquiries', score: 20 },
      { value: 'sell-products', label: 'Sell products online', score: 15 },
      { value: 'booking', label: 'Accept bookings / appointments', score: 15 },
      { value: 'credibility', label: 'Establish credibility / professionalism', score: 10 },
      { value: 'information', label: 'Provide information / resources', score: 10 },
      { value: 'community', label: 'Build a community', score: 10 },
    ],
  },
]

// ─── Scoring Thresholds ──────────────────────────────────────

export const QUALIFICATION_THRESHOLDS = {
  /** Minimum score to be considered qualified */
  qualified: 150,
  /** Score for high-priority leads */
  highPriority: 250,
  /** Score for hot leads (immediate action) */
  hot: 350,
} as const

// ─── Helper Functions ────────────────────────────────────────

export function calculateLeadScore(
  answers: Record<string, string | string[]>
): number {
  let score = 0
  
  for (const question of QUALIFICATION_QUESTIONS) {
    const answer = answers[question.id]
    if (!answer) continue
    
    if (question.type === 'multiselect' && Array.isArray(answer)) {
      // Sum scores for all selected options
      for (const value of answer) {
        const option = question.options?.find((o) => o.value === value)
        if (option) {
          score += option.score
        }
      }
    } else if (typeof answer === 'string') {
      const option = question.options?.find((o) => o.value === answer)
      if (option) {
        score += option.score
      }
    }
  }
  
  return score
}

export function getLeadPriority(
  score: number
): 'low' | 'medium' | 'high' | 'hot' {
  if (score >= QUALIFICATION_THRESHOLDS.hot) return 'hot'
  if (score >= QUALIFICATION_THRESHOLDS.highPriority) return 'high'
  if (score >= QUALIFICATION_THRESHOLDS.qualified) return 'medium'
  return 'low'
}

export function isQualified(score: number): boolean {
  return score >= QUALIFICATION_THRESHOLDS.qualified
}
