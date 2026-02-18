# B22 — Phase Gates

Each phase must pass all applicable gates before commit.

## Gate Definitions

| Gate | Check | Command |
|------|-------|---------|
| A | TypeScript compiles (no new errors) | `npx tsc --noEmit` (B22 files tested via vitest) |
| B | Tests pass | `npx vitest run ops/publish/__tests__/` |
| C | Secret scan clean | `npx vitest run` — no secrets in source |
| D | Schema validation | JSON schemas parse without error |
| E | Publish simulation tests | All 3 targets mocked end-to-end |

## Per-Phase Gates

| Phase | A | B | C | D | E |
|-------|---|---|---|---|---|
| P0 | — | — | ✓ | — | — |
| P1 | ✓ | ✓ | ✓ | ✓ | — |
| P2 | ✓ | ✓ | ✓ | — | partial |
| P3 | ✓ | ✓ | ✓ | — | partial |
| P4 | ✓ | ✓ | ✓ | ✓ | partial |
| P5 | ✓ | ✓ | ✓ | — | — |
| P6 | ✓ | ✓ | ✓ | — | — |
| P7 | ✓ | ✓ | ✓ | — | — |
| P8 | ✓ | ✓ | ✓ | — | — |
| P9 | ✓ | ✓ | ✓ | ✓ | ✓ |

## Pass Criteria

- **No new test failures** — pre-existing failures (feature-flags, policy-engine) are baseline
- **No secrets in committed files** — grep for PAT, key, token patterns
- **JSON schemas valid** — `JSON.parse()` succeeds
- **All publish targets produce deterministic output** — same input → same manifest hash
