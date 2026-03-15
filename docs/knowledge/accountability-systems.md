# Accountability Systems

## Overview

Accountability systems within the Evident ecosystem are tools that create verifiable records of decisions, actions, and resource flows. They are designed so that any claim made by an institution or individual can be checked against the documented record.

## Architecture

### Layered Transparency

Each accountability tool operates at a different layer:

| Layer | Tool | What It Tracks |
|-------|------|----------------|
| Government structure | Civics Hierarchy | Who holds authority and where it comes from |
| Public records | Document Library | Court filings, government reports, public disclosures |
| Personal rights | Informed Consent | What an individual has agreed to and when |
| Resource flows | Essential Goods Ledger | Distribution of essential goods across programs |
| Project delivery | Contractor Command Center | Job progress, change orders, before/after evidence |

### Shared Principles

All accountability tools share:

- **Timestamped entries** — every record has a creation date and modification history
- **Source attribution** — every document links to its original source or filing
- **Category indexing** — records are organized by type for structured discovery
- **Export capability** — data can be extracted for legal proceedings or public reporting

## Court & Accountability Portal

The Court & Accountability page on devon-tyler.com aggregates the transparency tools into a single public-facing portal. It is organized around four pillars:

1. **Public Case Records** — indexed court filings and case outcomes
2. **Evidence & Documentation** — exhibits, communications logs, and supporting materials
3. **Transparency Tools** — open-source platforms for decision tracing and claim verification
4. **Governance & Oversight** — published policies, change management logs, and audit trails

## Design Decisions

### Why Client-Side Only

All accountability tools run entirely in the browser with no backend server. This is intentional:

- No server means no single point of failure or censorship
- Data is stored in the user's browser (localStorage) or exported as files
- Hosting on GitHub Pages means the deployment is verifiable by anyone
- No authentication required for read access to public information

### Why Hash-Based Routing

Hash-based routing (`/#about`, `/#project/evident-platform`) is used instead of path-based routing because:

- GitHub Pages serves a single `index.html` for all paths
- No server-side rewrite rules needed
- Deep links work without 404 fallback configuration
- Compatible with static hosting on any CDN
