# New Site Artifacts — B21-P4

> Defines the deterministic site generation pipeline and its output artifacts.

---

## Pipeline Steps

```
validate → scaffold → render → watermark → hash → store
```

Every step is **pure and deterministic** — same input always yields same
output. No randomness, no external API calls, no side effects until the
final store step.

### 1. Validate (fail-closed)

Checks operator input against the blueprint's `content_requirements`.
If any requirement is unmet, the pipeline halts and returns errors.

### 2. Scaffold

Builds the page/section tree from the blueprint definition.
Merges any operator-provided custom content (titles, body text, sections).

### 3. Render

Produces HTML for each scaffolded page. Generates base CSS, JS, and a
`manifest.json` asset. All content is HTML-escaped to prevent injection.

### 4. Watermark

Injects a demo watermark overlay into every page (controlled by the
blueprint's `demo_watermark_profile`). The watermark is `aria-hidden`
and pointer-events disabled.

### 5. Hash

Computes SHA-256 hashes for every page and asset. Produces a
`manifestHash` — the SHA-256 of sorted, concatenated artifact hashes.
This ensures tamper detection and reproducibility.

### 6. Store

Persists the generated site record via a pluggable `StorageAdapter`.
Default adapter is in-memory (for testing); production adapters connect
to KV or database backends.

## Files

| File | Purpose |
|------|---------|
| `apps/sitegen/pipeline/types.ts` | All pipeline data types |
| `apps/sitegen/pipeline/validate.ts` | Input validation (fail-closed) |
| `apps/sitegen/pipeline/scaffold.ts` | Page/section scaffolding |
| `apps/sitegen/pipeline/render.ts` | HTML rendering |
| `apps/sitegen/pipeline/watermark.ts` | Watermark injection |
| `apps/sitegen/pipeline/hash.ts` | SHA-256 hashing |
| `apps/sitegen/pipeline/store.ts` | Storage adapter + persistence |
| `apps/sitegen/pipeline/pipeline.ts` | Orchestrator |
| `apps/sitegen/pipeline/__tests__/pipeline.test.ts` | Tests |

## Output Structure

A generated site produces:

```
/{slug}.html          — One HTML file per blueprint page
/assets/styles.css    — Generated CSS
/assets/main.js       — Base JavaScript
/manifest.json        — Build manifest (blueprint, version, pages, timestamp)
```

## Manifest Hash

The manifest hash is computed as:

```
SHA-256(sorted artifact hashes joined with ':')
```

This makes the hash:
- **Deterministic** — same artifacts always produce the same hash
- **Order-independent** — artifacts sorted by path before hashing
- **Tamper-evident** — any change to any artifact changes the manifest hash

## Invariants

1. Pipeline halts on first validation failure (fail-closed)
2. Same input always produces byte-identical output
3. Every artifact has a SHA-256 hash
4. Manifest hash covers all artifacts
5. HTML content is escaped (no raw injection)
6. Watermark is `aria-hidden` and non-interactive
7. All timestamps are ISO 8601
