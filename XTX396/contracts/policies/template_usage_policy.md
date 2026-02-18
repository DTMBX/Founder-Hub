# Template Usage Policy

**Chain:** B14 — Client Onboarding + Billing Ops  
**Phase:** P2 — Contract Templates  
**Status:** Active  
**Effective:** 2026-02-17  

---

## Purpose

Governs the use, customization, and execution of contract templates.

## Available Templates

| Template | File | Use Case |
|----------|------|----------|
| MSA | `contracts/templates/MSA_template.md` | Master service agreement |
| SOW | `contracts/templates/SOW_template.md` | Statement of work |
| NDA Lite | `contracts/templates/NDA_lite_template.md` | Mutual NDA |

## Rules

1. **No execution without review.** Templates contain placeholder values
   (`{{...}}`) and must be reviewed by qualified counsel before execution.

2. **All placeholders must be filled.** A document with unfilled placeholders
   must not be signed or delivered to a client.

3. **Version control.** Template modifications must be versioned and committed
   with a clear change description.

4. **Audit trail.** When a template is used to create a client-facing document,
   the source template version and date must be recorded.

5. **No legal advice.** These templates do not constitute legal advice. They
   are operational starting points for professional engagements.

## Placeholder Validation

Templates use `{{PLACEHOLDER_NAME}}` syntax. A linter check validates that:

- All placeholders follow the naming convention (`UPPER_SNAKE_CASE`)
- No placeholder is duplicated with inconsistent usage
- Required placeholders are documented

## Customization

When customizing a template for a specific engagement:

- Create a copy in the engagement-specific directory
- Fill all placeholders
- Record the source template version
- Obtain legal review before delivery
