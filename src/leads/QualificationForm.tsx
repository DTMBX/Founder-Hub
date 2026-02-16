/**
 * Qualification Form
 *
 * Multi-step form for qualifying leads with scoring.
 * Can be shown inline or in a modal after initial capture.
 */

import { useState, useCallback } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { track, MARKETING_EVENTS } from '@/marketing/event-tracker'
import {
  QUALIFICATION_QUESTIONS,
  calculateLeadScore,
  getLeadPriority,
  isQualified,
  type QualificationQuestion,
  type QualificationOption,
} from './qualification.config'
import { getLeadService } from './service'

// ─── Types ───────────────────────────────────────────────────

export interface QualificationFormProps {
  /** Lead ID to qualify */
  leadId: string
  /** Callback when qualification is complete */
  onComplete?: (score: number, qualified: boolean) => void
  /** Callback when user skips */
  onSkip?: () => void
  /** Custom questions (defaults to QUALIFICATION_QUESTIONS) */
  questions?: QualificationQuestion[]
  /** Show progress indicator */
  showProgress?: boolean
  /** Allow skipping */
  allowSkip?: boolean
  /** Custom className */
  className?: string
}

// ─── Question Components ─────────────────────────────────────

interface SelectQuestionProps {
  question: QualificationQuestion
  value: string | undefined
  onChange: (value: string) => void
}

function SelectQuestion({ question, value, onChange }: SelectQuestionProps) {
  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'w-full p-4 text-left rounded-lg border transition-all',
            'hover:border-primary/50 hover:bg-accent/5',
            value === option.value
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-border'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{option.label}</span>
            {value === option.value && (
              <CheckCircle className="w-5 h-5 text-primary" />
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

interface MultiSelectQuestionProps {
  question: QualificationQuestion
  value: string[]
  onChange: (value: string[]) => void
}

function MultiSelectQuestion({ question, value, onChange }: MultiSelectQuestionProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }
  
  return (
    <div className="space-y-3">
      {question.options?.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => toggleOption(option.value)}
          className={cn(
            'w-full p-4 text-left rounded-lg border transition-all',
            'hover:border-primary/50 hover:bg-accent/5',
            value.includes(option.value)
              ? 'border-primary bg-primary/5'
              : 'border-border'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-5 h-5 rounded border flex items-center justify-center',
                value.includes(option.value)
                  ? 'bg-primary border-primary text-white'
                  : 'border-border'
              )}
            >
              {value.includes(option.value) && (
                <CheckCircle className="w-3 h-3" />
              )}
            </div>
            <span className="font-medium">{option.label}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

export function QualificationForm({
  leadId,
  onComplete,
  onSkip,
  questions = QUALIFICATION_QUESTIONS,
  showProgress = true,
  allowSkip = true,
  className,
}: QualificationFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  
  const currentQuestion = questions[currentStep]
  const totalSteps = questions.length
  const isLastStep = currentStep === totalSteps - 1
  
  const currentAnswer = currentQuestion?.type === 'multiselect'
    ? (answers[currentQuestion.id] as string[]) ?? []
    : (answers[currentQuestion?.id] as string) ?? ''
  
  const canProceed = currentQuestion?.required
    ? currentQuestion.type === 'multiselect'
      ? (currentAnswer as string[]).length > 0
      : !!currentAnswer
    : true
  
  const setAnswer = (value: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }
  
  const handleNext = useCallback(async () => {
    if (!canProceed) return
    
    if (isLastStep) {
      // Submit qualification
      setIsSubmitting(true)
      
      try {
        const score = calculateLeadScore(answers)
        const qualified = isQualified(score)
        const priority = getLeadPriority(score)
        
        // Update lead with qualification data
        const leadService = getLeadService()
        await leadService.update(leadId, {
          budget: answers.budget as string,
          timeline: answers.timeline as string,
          enrichment: {
            ...(await leadService.get(leadId))?.enrichment,
            // Store raw answers for reference
          },
        })
        
        // Update status
        await leadService.updateStatus(
          leadId,
          qualified ? 'qualified' : 'unqualified',
          `Score: ${score}, Priority: ${priority}`
        )
        
        // Add activity
        await leadService.addActivity(
          leadId,
          'status_changed',
          `Qualification completed: Score ${score} (${priority})`,
          { score, priority, qualified, answers }
        )
        
        track(MARKETING_EVENTS.LEAD_FORM_COMPLETED, {
          leadId,
          score,
          priority,
          qualified,
        })
        
        setIsComplete(true)
        onComplete?.(score, qualified)
      } catch (error) {
        console.error('Qualification submission failed:', error)
      } finally {
        setIsSubmitting(false)
      }
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }, [canProceed, isLastStep, answers, leadId, onComplete])
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }
  
  const handleSkip = () => {
    track(MARKETING_EVENTS.LEAD_FORM_ABANDONED, { leadId, step: currentStep })
    onSkip?.()
  }
  
  if (isComplete) {
    const score = calculateLeadScore(answers)
    const qualified = isQualified(score)
    
    return (
      <div className={cn('text-center py-8', className)}>
        <CheckCircle className={cn(
          'w-16 h-16 mx-auto mb-4',
          qualified ? 'text-green-500' : 'text-amber-500'
        )} />
        <h3 className="text-2xl font-bold mb-2">
          {qualified ? 'Thank You!' : 'Got It!'}
        </h3>
        <p className="text-muted-foreground">
          {qualified
            ? "We'll be in touch within 24 hours with a personalized proposal."
            : "Thanks for your interest. We'll send you some resources that might help."}
        </p>
      </div>
    )
  }
  
  return (
    <div className={cn('max-w-lg mx-auto', className)}>
      {/* Progress */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Question */}
      <div className="mb-8">
        <Label className="text-xl font-semibold mb-1 block">
          {currentQuestion.question}
          {currentQuestion.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        {currentQuestion.helpText && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 mb-4">
            <Info className="w-4 h-4" />
            {currentQuestion.helpText}
          </p>
        )}
        
        <div className="mt-4">
          {currentQuestion.type === 'multiselect' ? (
            <MultiSelectQuestion
              question={currentQuestion}
              value={currentAnswer as string[]}
              onChange={setAnswer}
            />
          ) : (
            <SelectQuestion
              question={currentQuestion}
              value={currentAnswer as string}
              onChange={setAnswer}
            />
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {currentStep > 0 && (
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {allowSkip && (
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : isLastStep ? (
              'Complete'
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default QualificationForm
