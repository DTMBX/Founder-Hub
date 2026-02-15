import { ReviewNotes, ContingencyChecklistItem } from './types'

export interface ReviewNotesTemplate {
  id: string
  name: string
  description: string
  template: ReviewNotes
  createdAt: number
  updatedAt: number
}

export interface ContingencyChecklistTemplate {
  id: string
  name: string
  description: string
  items: Omit<ContingencyChecklistItem, 'id' | 'checked'>[]
  createdAt: number
  updatedAt: number
}

export const DEFAULT_REVIEW_NOTES_TEMPLATES: ReviewNotesTemplate[] = [
  {
    id: 'template-civil-rights',
    name: 'Civil Rights Case',
    description: 'Template for civil rights violations, excessive force, and constitutional claims',
    template: {
      damagesInjuries: '[Describe physical injuries, emotional distress, economic losses, and impact on plaintiff]',
      keyEvidenceSources: '[List: BWC footage, medical records, witness statements, expert reports, internal affairs docs, etc.]',
      deadlinesLimitations: '[Note statute of limitations date, notice requirements, discovery deadlines, and time-sensitive issues]',
      reliefSought: '[Specify: compensatory damages, punitive damages, injunctive relief, attorney fees, etc.]',
      notes: '[Additional observations, settlement discussions, liability analysis, or strategic considerations]'
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template-personal-injury',
    name: 'Personal Injury Case',
    description: 'Template for motor vehicle accidents, premises liability, and general negligence',
    template: {
      damagesInjuries: '[Describe nature and extent of injuries, medical treatment, prognosis, disability, pain and suffering]',
      keyEvidenceSources: '[List: accident reports, medical records, scene photos, expert opinions, witness statements, etc.]',
      deadlinesLimitations: '[Note statute of limitations, insurance policy limits, lien resolution deadlines]',
      reliefSought: '[Specify: economic damages (medical bills, lost wages), non-economic damages (pain/suffering), other relief]',
      notes: '[Liability analysis, comparative negligence issues, insurance coverage, settlement posture]'
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template-employment',
    name: 'Employment Litigation',
    description: 'Template for discrimination, retaliation, wrongful termination, and wage claims',
    template: {
      damagesInjuries: '[Describe economic harm (lost wages, benefits), emotional distress, reputational damage, career impact]',
      keyEvidenceSources: '[List: personnel files, emails, witness statements, performance reviews, company policies, etc.]',
      deadlinesLimitations: '[Note EEOC/NJLAD filing dates, statute of limitations, arbitration agreements, notice requirements]',
      reliefSought: '[Specify: back pay, front pay, compensatory damages, punitive damages, reinstatement, attorney fees]',
      notes: '[Pattern and practice evidence, comparator evidence, pretext analysis, settlement considerations]'
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template-contract-dispute',
    name: 'Contract Dispute',
    description: 'Template for breach of contract, business disputes, and commercial litigation',
    template: {
      damagesInjuries: '[Describe economic losses, lost profits, consequential damages, cost to cure/replace]',
      keyEvidenceSources: '[List: contracts, correspondence, invoices, financial records, expert valuations, etc.]',
      deadlinesLimitations: '[Note statute of limitations, contractual notice/cure provisions, arbitration clauses]',
      reliefSought: '[Specify: compensatory damages, specific performance, declaratory relief, attorney fees if contractual]',
      notes: '[Breach analysis, defenses, mitigation efforts, liquidated damages clauses, settlement history]'
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template-blank',
    name: 'Blank Template',
    description: 'Empty template for custom attorney review notes',
    template: {
      damagesInjuries: '',
      keyEvidenceSources: '',
      deadlinesLimitations: '',
      reliefSought: '',
      notes: ''
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
]

export const DEFAULT_CONTINGENCY_CHECKLIST_TEMPLATES: ContingencyChecklistTemplate[] = [
  {
    id: 'template-standard-contingency',
    name: 'Standard Contingency Evaluation',
    description: 'General checklist for evaluating contingency case merit',
    items: [
      { label: 'Liability clearly established or provable', notes: 'Review evidence supporting fault/breach/violation' },
      { label: 'Damages substantial and documented', notes: 'Verify medical records, financial losses, or other quantifiable harm' },
      { label: 'Collectible defendant with assets or insurance', notes: 'Confirm defendant solvency, insurance coverage, or municipal liability' },
      { label: 'Statute of limitations satisfied', notes: 'Verify timely filing and any tolling/notice requirements' },
      { label: 'No major procedural defects or jurisdictional issues', notes: 'Check venue, jurisdiction, service, pleadings' },
      { label: 'Strong settlement potential or trial viability', notes: 'Assess case strength, comparable verdicts, settlement history' },
      { label: 'Client credible and cooperative', notes: 'Evaluate client as witness and willingness to participate' },
      { label: 'Cost-benefit analysis favorable', notes: 'Litigation costs vs. expected recovery, expert needs, timeline' }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template-civil-rights-contingency',
    name: 'Civil Rights Case Checklist',
    description: 'Specialized checklist for civil rights and § 1983 cases',
    items: [
      { label: 'Constitutional violation clearly articulated', notes: 'Identify specific rights violated and applicable precedent' },
      { label: 'Clearly established law at time of incident', notes: 'Overcome qualified immunity with on-point case law' },
      { label: 'Physical injury or significant harm documented', notes: 'Verify damages meet compensability threshold' },
      { label: 'Municipal policy/custom or supervisory liability', notes: 'Establish basis for entity liability beyond individual officers' },
      { label: 'Video or strong corroborating evidence', notes: 'BWC, surveillance, witnesses to support claims' },
      { label: 'Notice requirements met (tort claim, etc.)', notes: 'Verify statutory notice timelines satisfied' },
      { label: 'Defendant has insurance or indemnification', notes: 'Confirm collectibility through municipal coverage' },
      { label: 'No credibility issues with plaintiff', notes: 'Criminal history, prior claims, inconsistent statements reviewed' }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template-personal-injury-contingency',
    name: 'Personal Injury Case Checklist',
    description: 'Checklist for motor vehicle accidents and premises liability',
    items: [
      { label: 'Clear liability or strong negligence case', notes: 'Police report, witness statements, or obvious fault' },
      { label: 'Significant injuries requiring medical treatment', notes: 'Emergency care, surgery, ongoing treatment documented' },
      { label: 'Defendant adequately insured', notes: 'Confirm policy limits sufficient for damages' },
      { label: 'Comparative negligence minimal or absent', notes: 'Evaluate plaintiff conduct and potential defenses' },
      { label: 'Medical causation established', notes: 'Link injuries to incident with medical documentation' },
      { label: 'Economic damages exceed policy limits or substantial', notes: 'Medical bills, lost wages, future care needs' },
      { label: 'Timely investigation and evidence preservation', notes: 'Scene photos, medical records, witness contacts secured' },
      { label: 'Client willing to pursue treatment and comply', notes: 'Client follows medical advice and attends appointments' }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template-employment-contingency',
    name: 'Employment Case Checklist',
    description: 'Checklist for discrimination, retaliation, and wrongful termination',
    items: [
      { label: 'Protected class or protected activity established', notes: 'Verify basis for discrimination/retaliation claim' },
      { label: 'Adverse employment action clearly documented', notes: 'Termination, demotion, harassment, or other tangible harm' },
      { label: 'Temporal proximity or causal connection shown', notes: 'Timeline supports inference of discriminatory/retaliatory motive' },
      { label: 'Comparator evidence or pattern and practice', notes: 'Similarly situated employees treated more favorably' },
      { label: 'Pretext for legitimate reason demonstrated', notes: 'Employer rationale shown to be false or pretextual' },
      { label: 'Economic damages quantifiable', notes: 'Back pay, front pay, benefits calculable' },
      { label: 'Administrative prerequisites satisfied', notes: 'EEOC/NJLAD charge filed timely, right-to-sue received' },
      { label: 'Employer solvent or insured', notes: 'Verify defendant ability to pay judgment' }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'template-blank-checklist',
    name: 'Blank Checklist',
    description: 'Empty checklist for custom evaluation criteria',
    items: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
]

export function getReviewNotesTemplate(templateId: string): ReviewNotesTemplate | undefined {
  return DEFAULT_REVIEW_NOTES_TEMPLATES.find(t => t.id === templateId)
}

export function getContingencyChecklistTemplate(templateId: string): ContingencyChecklistTemplate | undefined {
  return DEFAULT_CONTINGENCY_CHECKLIST_TEMPLATES.find(t => t.id === templateId)
}

export function applyReviewNotesTemplate(templateId: string): ReviewNotes | null {
  const template = getReviewNotesTemplate(templateId)
  if (!template) return null
  return { ...template.template }
}

export function applyContingencyChecklistTemplate(templateId: string): ContingencyChecklistItem[] | null {
  const template = getContingencyChecklistTemplate(templateId)
  if (!template) return null
  
  return template.items.map((item, index) => ({
    id: `checklist_${Date.now()}_${index}`,
    label: item.label,
    checked: false,
    notes: item.notes
  }))
}
