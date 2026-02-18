# B23 — Blueprint Starter Pack + Operator Wizard Completion

## Purpose

Enable a non-technical operator to generate a professional, business-appropriate
website in under 10 minutes — with correct components, pages, disclaimers,
watermarked preview, and safe publish defaults.

## Phase Plan

| Phase | Title | Deliverables |
|-------|-------|-------------|
| P0 | Baseline + Catalog Read | Plan docs, gap analysis |
| P1 | Blueprint Quality Standard | Quality validation, required/complementary sets |
| P2 | Blueprint Starter Pack | Upgraded 5 blueprints + demo content fixtures |
| P3 | Operator Wizard Completion | Step-by-step wizard models (no dead ends) |
| P4 | Preview Wow Factor | Curated heroes, watermark enforcement, device toggles |
| P5 | Generation Completeness | Fail-closed checks on all required artifacts |
| P6 | Template Safe Subset | Preview-safe asset allowlist, blocked routes |
| P7 | Handoff Package | Demo-to-paid conversion package generator |
| P8 | Final Posture + Demo Script | Changelog, posture doc, operator/visitor demos |

## Constraints

- Fail-closed: missing content or failed validation blocks publish
- Safe Mode ON by default; demo outputs watermarked
- No secrets in repo; adapters mock by default
- Deterministic generation: same inputs → same hashes
- Blueprints declare and include required component set
- Operators cannot free-edit structure; curated options only

## Dependencies

- B21: Blueprint schema, catalog, component registry, pipeline
- B22: Publish targets (Hosted, ZIP, GitHub PR), audit, safety controls

## Branch

`feature/b23-blueprints-wizard`
