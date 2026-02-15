import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { 
  Case, 
  PDFAsset, 
  FilingType, 
  Project, 
  Section,
  ReviewNotes,
  ContingencyChecklistItem 
} from '@/lib/types'

export function useInitializeSampleData() {
  const [cases, setCases] = useKV<Case[]>('founder-hub-cases', [])
  const [pdfs, setPdfs] = useKV<PDFAsset[]>('founder-hub-pdfs', [])
  const [filingTypes, setFilingTypes] = useKV<FilingType[]>('founder-hub-filing-types', [])
  const [sections, setSections] = useKV<Section[]>('founder-hub-sections', [])
  const [projects, setProjects] = useKV<Project[]>('founder-hub-projects', [])
  const [aboutContent, setAboutContent] = useKV<{
    mission: string
    currentFocus: string
    values: string[]
    updates: Array<{ date: string; title: string; content: string }>
  }>('founder-hub-about', {
    mission: '',
    currentFocus: '',
    values: [],
    updates: []
  })

  useEffect(() => {
    if (!filingTypes || filingTypes.length === 0) {
      const defaultFilingTypes: FilingType[] = [
        {
          id: 'complaint',
          name: 'Complaint',
          sortOrder: 0,
          defaultNamingToken: 'CMPL',
          icon: '📋',
          color: '#ef4444',
          defaultVisibility: 'unlisted',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'certification',
          name: 'Certification/Affidavit',
          sortOrder: 1,
          defaultNamingToken: 'CERT',
          icon: '✍️',
          color: '#3b82f6',
          defaultVisibility: 'unlisted',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'motion',
          name: 'Motion',
          sortOrder: 2,
          defaultNamingToken: 'MTN',
          icon: '⚖️',
          color: '#f59e0b',
          defaultVisibility: 'unlisted',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'opposition',
          name: 'Opposition',
          sortOrder: 3,
          defaultNamingToken: 'OPP',
          icon: '🔄',
          color: '#8b5cf6',
          defaultVisibility: 'unlisted',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'reply',
          name: 'Reply',
          sortOrder: 4,
          defaultNamingToken: 'RPL',
          icon: '💬',
          color: '#06b6d4',
          defaultVisibility: 'unlisted',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'order',
          name: 'Order',
          sortOrder: 5,
          defaultNamingToken: 'ORD',
          icon: '⚡',
          color: '#10b981',
          defaultVisibility: 'unlisted',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'notice',
          name: 'Notice',
          sortOrder: 6,
          defaultNamingToken: 'NOT',
          icon: '📢',
          color: '#84cc16',
          defaultVisibility: 'unlisted',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'exhibit',
          name: 'Exhibit',
          sortOrder: 7,
          defaultNamingToken: 'EX',
          icon: '📎',
          color: '#ec4899',
          defaultVisibility: 'private',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'transcript',
          name: 'Transcript',
          sortOrder: 8,
          defaultNamingToken: 'TR',
          icon: '📝',
          color: '#f97316',
          defaultVisibility: 'private',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'opra',
          name: 'OPRA/Records',
          sortOrder: 9,
          defaultNamingToken: 'OPRA',
          icon: '🗂️',
          color: '#14b8a6',
          defaultVisibility: 'unlisted',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]
      setFilingTypes(defaultFilingTypes)
    }
  }, [filingTypes, setFilingTypes])

  useEffect(() => {
    if (!sections || sections.length === 0) {
      const defaultSections: Section[] = [
        { id: 'hero', type: 'hero', title: 'Hero', content: '', order: 0, enabled: true, investorRelevant: true },
        { id: 'about', type: 'about', title: 'About', content: '', order: 1, enabled: true, investorRelevant: false },
        { id: 'projects', type: 'projects', title: 'Projects', content: '', order: 2, enabled: true, investorRelevant: true },
        { id: 'court', type: 'court', title: 'Court & Accountability', content: '', order: 3, enabled: true, investorRelevant: false },
        { id: 'proof', type: 'proof', title: 'Press & Proof', content: '', order: 4, enabled: true, investorRelevant: true },
        { id: 'contact', type: 'contact', title: 'Contact', content: '', order: 5, enabled: true, investorRelevant: true },
      ]
      setSections(defaultSections)
    }
  }, [sections, setSections])

  useEffect(() => {
    if (!aboutContent || !aboutContent.mission || aboutContent.values.length === 0) {
      const defaultAboutContent = {
        mission: 'Forging transformative solutions at the intersection of technology, home improvement, transparency, and justice.',
        currentFocus: 'Building civic technology, home improvement platforms, and legal infrastructure that increase transparency and empower communities.',
        values: ['Integrity', 'Stewardship', 'Fortitude', 'Veracity'],
        updates: [
          {
            date: '2025-02',
            title: 'Foundation Launch',
            content: 'Establishing xTx396 as a comprehensive founder hub showcasing projects, court accountability, and investment opportunities.'
          }
        ]
      }
      setAboutContent(defaultAboutContent)
    }
  }, [aboutContent, setAboutContent])

  useEffect(() => {
    if (!projects || projects.length === 0) {
      const defaultProjects: Project[] = [
        {
          id: 'evident-tech',
          title: 'Evident Technologies',
          summary: 'AI-powered litigation support and evidence analysis platform',
          description: 'Advanced document intelligence system for legal professionals, featuring OCR, automated metadata extraction, and case management tools.',
          tags: ['Legal Tech', 'AI', 'Document Analysis'],
          techStack: ['TypeScript', 'React', 'Node.js', 'OpenAI', 'PostgreSQL'],
          links: [
            { label: 'Documentation', url: '#', type: 'docs' }
          ],
          order: 0,
          enabled: true,
          featured: true,
          status: 'active',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]
      setProjects(defaultProjects)
    }
  }, [projects, setProjects])

  useEffect(() => {
    if ((!cases || cases.length === 0) && filingTypes && filingTypes.length > 0) {
      const reviewNotes: ReviewNotes = {
        damagesInjuries: 'Civil rights violation claims related to unlawful detention and use of force. Documented injuries include physical trauma and ongoing emotional distress.',
        keyEvidenceSources: 'Body-worn camera footage (BWC), arrest reports, medical records, witness statements, internal affairs investigation documents.',
        deadlinesLimitations: 'NJ Civil Rights Act 2-year statute of limitations. Notice of Tort Claim filed within statutory period. Discovery ongoing.',
        reliefSought: 'Compensatory and punitive damages, attorney fees, declaratory relief, and injunctive relief regarding police policies and training.',
        notes: 'Strong evidence package with BWC footage supporting plaintiff claims. Multiple corroborating witnesses. Defendant responses pending.'
      }

      const contingencyChecklist: ContingencyChecklistItem[] = [
        { id: 'c1', label: 'Liability clearly established', checked: true, notes: 'BWC footage and witness statements support claims' },
        { id: 'c2', label: 'Damages documented and quantifiable', checked: true, notes: 'Medical records and expert reports available' },
        { id: 'c3', label: 'Statute of limitations satisfied', checked: true, notes: 'NTC filed timely, complaint filed within SOL' },
        { id: 'c4', label: 'No major procedural defects', checked: true, notes: 'All filings proper and timely' },
        { id: 'c5', label: 'Collectible defendant', checked: true, notes: 'Municipal defendant with insurance' },
        { id: 'c6', label: 'Strong settlement potential', checked: false, notes: 'Early stages, discovery needed' },
        { id: 'c7', label: 'Trial-ready evidence', checked: false, notes: 'Additional expert depositions pending' }
      ]

      const sampleCase: Case = {
        id: 'demo-case-001',
        title: 'Sample v. Municipality',
        docket: 'L-1234-23',
        court: 'Superior Court of New Jersey, Law Division',
        jurisdiction: 'New Jersey',
        parties: 'John Sample (Plaintiff) v. Township of Example (Defendant)',
        stage: 'Discovery',
        status: 'active',
        dateRange: '2023 - Present',
        filingDate: '2023-06-15',
        lastUpdate: '2024-12-20',
        summary: 'Civil rights action arising from alleged unlawful detention and excessive force during traffic stop.',
        description: 'This case involves claims under the New Jersey Civil Rights Act and federal 42 U.S.C. § 1983 for alleged violations of constitutional rights during a traffic stop and subsequent arrest.',
        tags: ['Civil Rights', 'Excessive Force', 'Municipal Liability', 'NJ CRA'],
        order: 0,
        visibility: 'public',
        featured: true,
        featuredDocIds: ['pdf-001', 'pdf-002', 'pdf-005'],
        sourceNotes: 'Documents obtained via public records requests and court filings.',
        timeline: [
          {
            id: 't1',
            date: '2023-01-15',
            title: 'Incident Date',
            description: 'Traffic stop and arrest',
            order: 0
          },
          {
            id: 't2',
            date: '2023-02-10',
            title: 'Notice of Tort Claim Filed',
            description: 'Statutory notice provided to municipality',
            order: 1
          },
          {
            id: 't3',
            date: '2023-06-15',
            title: 'Complaint Filed',
            description: 'Civil rights action initiated in Superior Court',
            order: 2
          },
          {
            id: 't4',
            date: '2023-08-20',
            title: 'Answer Filed',
            description: 'Defendant filed responsive pleading',
            order: 3
          },
          {
            id: 't5',
            date: '2023-10-05',
            title: 'Discovery Conference',
            description: 'Initial case management conference held',
            order: 4
          },
          {
            id: 't6',
            date: '2024-03-12',
            title: 'Key Evidence Produced',
            description: 'BWC footage and IA investigation documents provided',
            order: 5
          }
        ],
        overview: 'Federal and state civil rights claims arising from alleged constitutional violations during police encounter. Plaintiff seeks compensatory and punitive damages for unlawful detention, excessive force, and related claims. Discovery is ongoing with key evidence including body-worn camera footage and internal affairs investigations.',
        reviewNotes,
        contingencyChecklist,
        lastUpdated: Date.now(),
        createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000
      }

      const samplePDFs: PDFAsset[] = [
        {
          id: 'pdf-001',
          caseId: 'demo-case-001',
          title: 'Verified Complaint',
          description: 'Initial complaint alleging civil rights violations under NJ CRA and 42 U.S.C. § 1983',
          fileUrl: '#',
          filingTypeId: 'complaint',
          documentType: 'Complaint',
          filingDate: '2023-06-15',
          filingDateConfirmed: true,
          visibility: 'public',
          stage: 'published',
          featured: true,
          tags: ['Initial Pleading', 'Civil Rights', 'Verified'],
          pageCount: 45,
          fileSize: 2458624,
          metadata: {
            originalFilename: 'Sample_v_Municipality_Complaint.pdf',
            checksum: 'sha256-abc123def456...'
          },
          ocrStatus: 'completed',
          analysisStatus: 'none',
          notesVisibility: 'private',
          createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 180 * 24 * 60 * 60 * 1000
        },
        {
          id: 'pdf-002',
          caseId: 'demo-case-001',
          title: 'Certification of Plaintiff',
          description: 'Sworn certification detailing events and injuries',
          fileUrl: '#',
          filingTypeId: 'certification',
          documentType: 'Certification',
          filingDate: '2023-06-15',
          filingDateConfirmed: true,
          visibility: 'public',
          stage: 'published',
          featured: true,
          tags: ['Sworn Statement', 'Evidence'],
          pageCount: 8,
          fileSize: 458624,
          metadata: {
            originalFilename: 'Sample_Certification.pdf',
            checksum: 'sha256-cert789...'
          },
          ocrStatus: 'completed',
          analysisStatus: 'none',
          notesVisibility: 'private',
          createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 180 * 24 * 60 * 60 * 1000
        },
        {
          id: 'pdf-003',
          caseId: 'demo-case-001',
          title: 'Answer and Affirmative Defenses',
          description: 'Defendant municipality\'s responsive pleading',
          fileUrl: '#',
          filingTypeId: 'motion',
          documentType: 'Answer',
          filingDate: '2023-08-20',
          filingDateConfirmed: true,
          visibility: 'public',
          stage: 'published',
          featured: false,
          tags: ['Responsive Pleading', 'Defenses'],
          pageCount: 22,
          fileSize: 1258624,
          metadata: {
            originalFilename: 'Answer_and_Defenses.pdf',
            checksum: 'sha256-ans456...'
          },
          ocrStatus: 'completed',
          analysisStatus: 'none',
          notesVisibility: 'private',
          createdAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 150 * 24 * 60 * 60 * 1000
        },
        {
          id: 'pdf-004',
          caseId: 'demo-case-001',
          title: 'Case Management Order',
          description: 'Court order establishing discovery deadlines and trial date',
          fileUrl: '#',
          filingTypeId: 'order',
          documentType: 'Order',
          filingDate: '2023-10-05',
          filingDateConfirmed: true,
          visibility: 'public',
          stage: 'published',
          featured: false,
          tags: ['Scheduling', 'Deadlines'],
          pageCount: 4,
          fileSize: 258624,
          metadata: {
            originalFilename: 'CMO_2023-10-05.pdf',
            checksum: 'sha256-cmo789...'
          },
          ocrStatus: 'completed',
          analysisStatus: 'none',
          notesVisibility: 'private',
          createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 120 * 24 * 60 * 60 * 1000
        },
        {
          id: 'pdf-005',
          caseId: 'demo-case-001',
          title: 'Notice of OPRA Production',
          description: 'Notice of production of body-worn camera footage and internal affairs documents',
          fileUrl: '#',
          filingTypeId: 'notice',
          documentType: 'Notice',
          filingDate: '2024-03-12',
          filingDateConfirmed: true,
          visibility: 'public',
          stage: 'published',
          featured: true,
          tags: ['Discovery', 'OPRA', 'BWC'],
          pageCount: 3,
          fileSize: 158624,
          metadata: {
            originalFilename: 'OPRA_Production_Notice.pdf',
            checksum: 'sha256-opra123...'
          },
          ocrStatus: 'completed',
          analysisStatus: 'none',
          notesVisibility: 'private',
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 30 * 24 * 60 * 60 * 1000
        },
        {
          id: 'pdf-006',
          caseId: 'demo-case-001',
          title: 'Motion to Compel Discovery',
          description: 'Plaintiff motion seeking additional discovery responses',
          fileUrl: '#',
          filingTypeId: 'motion',
          documentType: 'Motion',
          filingDate: '2024-05-10',
          filingDateConfirmed: true,
          visibility: 'unlisted',
          stage: 'published',
          featured: false,
          tags: ['Discovery', 'Motion'],
          pageCount: 12,
          fileSize: 658624,
          metadata: {
            originalFilename: 'Motion_to_Compel.pdf',
            checksum: 'sha256-mtc456...'
          },
          ocrStatus: 'completed',
          analysisStatus: 'none',
          notesVisibility: 'private',
          createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 20 * 24 * 60 * 60 * 1000
        },
        {
          id: 'pdf-007',
          caseId: 'demo-case-001',
          title: 'Expert Report - Use of Force',
          description: 'Police practices expert report analyzing incident',
          fileUrl: '#',
          filingTypeId: 'exhibit',
          documentType: 'Exhibit',
          filingDate: '2024-08-15',
          filingDateConfirmed: true,
          visibility: 'unlisted',
          stage: 'published',
          featured: false,
          tags: ['Expert', 'Evidence', 'Use of Force'],
          pageCount: 67,
          fileSize: 3258624,
          metadata: {
            originalFilename: 'Expert_Report_UOF.pdf',
            checksum: 'sha256-exp789...'
          },
          ocrStatus: 'completed',
          analysisStatus: 'none',
          notesVisibility: 'private',
          createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
          updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000
        }
      ]

      setCases([sampleCase])
      setPdfs(samplePDFs)
    }
  }, [cases, pdfs, filingTypes, setCases, setPdfs])
}
