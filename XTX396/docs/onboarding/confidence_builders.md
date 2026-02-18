# Confidence Builder Publishing Hooks

## Overview

The confidence builder system manages trust-building content artifacts
through a review-gated publishing workflow. No content reaches publication
without explicit human approval.

## Content Types

| Type               | Purpose                              |
| ------------------ | ------------------------------------ |
| `case_study`       | Client engagement outcome narrative  |
| `testimonial`      | Direct client quote with consent     |
| `capability_brief` | Service capability description       |
| `compliance_badge` | Certification or compliance record   |
| `whitepaper`       | Technical or methodology document    |

## Lifecycle

```
draft → in_review → approved → published → archived
```

Each transition is explicit and recorded. Content cannot skip stages.

### Validation Rules

Before a content record is created, the request schema is validated:

- `type` must be one of the recognized types
- `title` must be non-empty
- `body` must be non-empty
- `author` must be non-empty

### Integrity

Each record includes a SHA-256 hash computed over `contentId`, `title`,
`body`, and `createdAt`. Call `verifyIntegrity(contentId)` to confirm
the record has not been modified after creation.

## Templates

Content templates are stored in `ops/automation/content/templates/`:

| Template            | Use Case              |
| ------------------- | --------------------- |
| `case_study.md`     | Client case studies   |
| `testimonial.md`    | Client testimonials   |

Templates use `{{PLACEHOLDER}}` syntax, consistent with other contract
and proposal templates.

## Files

| File | Purpose |
| ---- | ------- |
| `ops/automation/content/ContentPublisher.ts` | Core service |
| `ops/automation/content/templates/*.md` | Content templates |
| `docs/onboarding/confidence_builders.md` | This document |
