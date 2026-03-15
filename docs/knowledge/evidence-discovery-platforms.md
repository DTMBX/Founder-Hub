# Evidence Discovery Platforms

## Overview

Evidence discovery platforms in the Evident ecosystem focus on making public records searchable, verifiable, and linkable. The flagship tool is the DOJ Document Library (Epstein Library), which serves a dual purpose: a genuine public-service resource for accessing released DOJ documents and a live demonstration of Evident's e-discovery capabilities.

## DOJ Document Library (Epstein Library)

### Purpose

The DOJ Document Library at library.xtx396.com is built around the publicly released Epstein case documents from the U.S. Department of Justice. It provides a searchable, structured interface to these records — court filings, depositions, flight logs, and related disclosures — making them accessible to people who are not lawyers or legal researchers.

The library also functions as a production showcase for Evident's e-discovery tooling. Every feature visible to the public — ingestion, indexing, search, verification — runs on the same platform available to Evident clients, proving the tools work at scale on real-world documents.

### How It Works

1. **Ingestion** — Documents are added to the library with metadata: title, source, date filed, category, and a plain-language summary. For the Epstein library, source material comes from DOJ releases, court docket entries, and FOIA responses.
2. **Indexing** — Each document is categorized by type (court filing, deposition, flight log, correspondence) and tagged with relevant entities, dates, and topics.
3. **Search** — Users can search by keyword, category, date range, entity name, or source institution.
4. **Verification** — Every document links to its original DOJ source URL or court filing reference so users can verify authenticity independently.

### Dual Role: Public Service + E-Discovery Demo

The library is not a mock dataset or a toy example. It indexes real documents of genuine public interest. This dual role means:

- **Public service** — Anyone can search, read, and verify Epstein-related DOJ documents without paywalls or legal databases.
- **Platform demo** — Prospective Evident clients see exactly how the e-discovery tools handle ingestion, OCR, search, and cross-referencing on a non-trivial corpus.

### Document Categories

Documents are organized into categories specific to the Epstein case corpus:

- Court filings and docket entries
- Depositions and witness statements
- Flight logs and travel records
- DOJ and FBI correspondence
- FOIA responses and redaction logs
- Institutional disclosures and related records

## Integration with Other Tools

### Civics Hierarchy

Documents that reference specific government agencies or offices can be cross-referenced with the Civics Hierarchy. This lets users trace a document from its content to the authority that produced it.

### Informed Consent

Consent-related documents (medical forms, institutional agreements) indexed in the Document Library can be referenced by the Informed Consent tool to provide context for what a user is being asked to sign.

### Accountability Portal

The Court & Accountability page on devon-tyler.com aggregates Document Library entries alongside case records and governance documentation into a unified transparency view.

## Technical Implementation

- **Frontend**: React + TypeScript single-page application
- **Hosting**: GitHub Pages with custom domain (library.xtx396.com)
- **Repository**: DTMBX/epstein-library-evid
- **E-Discovery Engine**: Evident's ingestion, OCR, and indexing pipeline
- **Data Storage**: Client-side with optional export to JSON/CSV
- **Search**: Client-side full-text search over indexed metadata and entity tags
- **Structured Data**: JSON-LD SoftwareApplication schema for search engine discovery

## Future Development

Planned enhancements include:

- Bulk document import from new DOJ release batches
- OCR pipeline for scanned/redacted PDFs with confidence scoring
- Timeline visualization for case progression and document chronology
- Entity graph linking people, locations, and organizations across documents
- Cross-library linking between Evident ecosystem applications
- API endpoints for programmatic access to the document index
