export interface PostEntry {
  id: string
  title: string
  date: string // ISO 8601
  category: 'platform' | 'project' | 'ecosystem' | 'update'
  summary: string
  contentMarkdown: string
}

export const POSTS: PostEntry[] = [
  {
    id: 'evident-ediscovery-platform',
    title: 'Introducing the Evident E-Discovery Platform',
    date: '2025-05-15',
    category: 'platform',
    summary:
      'Evident Technologies launches an enterprise-grade evidence processing platform with AI-powered document analysis, chain-of-custody tracking, and full-text search across millions of records.',
    contentMarkdown: `
## A New Standard for Digital Evidence

Evident Technologies has built an enterprise-grade evidence processing platform designed for the demands of modern litigation, investigations, and regulatory compliance.

### Core Capabilities

- **Document Ingestion** — Process PDFs, emails, images, and structured data at scale with automated OCR and metadata extraction.
- **AI-Powered Analysis** — Surface patterns, key entities, and anomalies across document collections using local LLM pipelines — no data leaves your infrastructure.
- **Chain of Custody** — Every document action is cryptographically logged with tamper-evident audit trails meeting federal court standards.
- **Full-Text Search** — Sub-second search across millions of records with faceted filtering, date ranges, and Boolean operators.
- **Export & Production** — Generate Bates-stamped production sets, privilege logs, and load files in standard EDRM formats.

### Architecture

The platform is built on a modern React + TypeScript frontend with a modular microservices backend. Each satellite application in the Evident ecosystem serves a specialized function while sharing common authentication, audit, and data infrastructure.

### What's Next

We are actively onboarding pilot users for the DOJ Document Library and expanding the platform's capabilities into new document types and jurisdictions. If you work in legal technology, compliance, or investigations, [reach out](//#evident) to learn more.
    `.trim(),
  },
  {
    id: 'doj-document-library-launch',
    title: 'DOJ Document Library: Making Federal Records Accessible',
    date: '2025-05-28',
    category: 'project',
    summary:
      'The DOJ Document Library brings structured, searchable access to federal investigation records — starting with the Epstein case files — with full-text search, document categorization, and public transparency tools.',
    contentMarkdown: `
## Why This Matters

Federal investigation records are often released as bulk PDF dumps with minimal indexing, making them practically inaccessible to the public, journalists, and legal professionals who need to review them.

The DOJ Document Library changes that.

### What We Built

- **Structured Catalog** — Every document is tagged with date, source, document type, and subject entities.
- **Full-Text Search** — OCR-processed text across all records, searchable in under a second.
- **Public Access** — No login required. The library is freely accessible at [library.xtx396.com](https://library.xtx396.com).
- **Citation Support** — Permanent links for every document, suitable for legal briefs, journalism, and academic research.

### The Epstein Files

Our first collection covers the federal investigation into Jeffrey Epstein, including court filings, deposition transcripts, flight logs, and correspondence. The collection is being expanded as new records are released.

### Open Infrastructure

The platform is part of the [Evident Technologies](//#evident) ecosystem. All processing pipelines are reproducible, and we publish detailed methodology notes for every collection.

### Get Involved

If you have expertise in FOIA processing, document analysis, or legal technology and want to contribute, visit the [developer portal](//#developers) for API documentation and contribution guidelines.
    `.trim(),
  },
  {
    id: 'tillerstead-contractor-platform',
    title: 'Tillerstead: Technology-Driven Contracting for South Jersey',
    date: '2025-06-02',
    category: 'project',
    summary:
      'Tillerstead LLC launches a full-service residential and commercial contracting platform serving 9 South Jersey counties with transparent pricing, digital project tracking, and NJ HIC-licensed crews.',
    contentMarkdown: `
## Building Better in South Jersey

Tillerstead LLC is a New Jersey Home Improvement Contractor serving Atlantic, Burlington, Camden, Cape May, Cumberland, Gloucester, Mercer, Ocean, and Salem counties.

### What Makes Tillerstead Different

- **Digital Project Tracking** — Every project gets a real-time dashboard showing progress, materials, inspections, and budget status.
- **Transparent Pricing** — Itemized estimates with no hidden fees. Material costs, labor rates, and margins are all visible.
- **Licensed & Insured** — NJ HIC registered with full liability and workers' compensation coverage.
- **Quality Guarantee** — Workmanship warranty on all projects with documented inspection checklists.

### Services

- Kitchen & bathroom remodeling
- Roofing & siding
- Deck construction
- General renovation
- Commercial buildouts
- Custom residential construction

### Technology Integration

Tillerstead runs on the same infrastructure as the Evident Technologies platform. Project data, scheduling, and client communication are managed through a unified system that ensures nothing falls through the cracks.

### Request a Quote

Visit [tillerstead.com](https://tillerstead.com) or use the [project inquiry form](//#tillerstead) to describe your project and get a detailed estimate.
    `.trim(),
  },
]
