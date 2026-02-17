# B15-P0 — Existing Apps & Tools Inventory

## Purpose

Catalog of all tool-like assets across the Evident ecosystem. This
inventory informs the ToolManifest schema (B15-P1) and migration plan
(B15-P4).

---

## 1. Standalone Apps (`Evident/apps/`)

| App | Stack | Description |
| --- | ----- | ----------- |
| **civics-hierarchy** | Vite + React + TS | Interactive legal education — Constitution, case law, federal register, treaties, citation library |
| **epstein-library-evid** | Vite + React + TS | DOJ data research library — documents, entities, graph, search, annotations, audit log |
| **essential-goods-ledg** | Vite + React + TS | Essential goods price-tracking ledger — data connectors, quality monitoring, RBAC |
| **geneva-bible-study-t** | Vite + React + TS + Capacitor | Geneva Bible study — verse navigation, keyword search, notes, reading plans |

All four share: `package.json`, `components.json`, `runtime.config.json`,
`theme.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`.

---

## 2. Developer Tools (`Evident/tools/`)

36 scripts across PowerShell, JavaScript, and Python:

| Category | Count | Examples |
| -------- | ----- | -------- |
| Build / Deploy | 4 | `20-deploy.ps1`, `00-doctor.ps1` |
| CSS Transform | 5 | `bem-to-kebab.js`, `normalize-custom-props.js` |
| Validation | 4 | `validate-cases-yaml.cjs`, `validate-files.js` |
| Forensic | 2 | `extract-court-stamp.js`, `extract_court_stamp_ocr.py` |
| Backup | 2 | `backup-repo.ps1`, `daily-backup.ps1` |
| Setup | 4 | `setup-github-cli.ps1`, `setup-oh-my-posh.ps1` |
| Utility | 15 | `check-links.js`, `generate-checksums.js`, etc. |

---

## 3. Chat Tools (`Evident/services/chat_tools.py`)

12 OpenAI function-calling tools:

1. `search_legal_documents`
2. `get_case_details`
3. `search_cases`
4. `get_case_management_info`
5. `get_evidence_items`
6. `search_evidence`
7. `check_privilege`
8. `upload_media`
9. `get_media_processing_status`
10. `analyze_document`
11. `create_case_collection`
12. `get_statistics`

Implementations: `services/tool_implementations.py` (663 lines)

---

## 4. eDiscovery Algorithms (`Evident/algorithms/`)

13 modules registered via `algorithms/registry.py`:

| Algorithm | Purpose |
| --------- | ------- |
| `access_anomaly` | Access pattern anomaly detection |
| `bates_generator` | Bates number generation |
| `bulk_dedup` | Bulk deduplication |
| `integrity_sweep` | Integrity verification sweep |
| `provenance_graph` | Provenance chain graph builder |
| `redaction_verify` | Redaction completeness check |
| `replay` | Evidence replay |
| `sealed_export` | Court-grade sealed export |
| `timeline_alignment` | Cross-source timeline alignment |

---

## 5. Backend Services (`Evident/services/`)

34 services. Key tool-like entries:

| Service | Purpose |
| ------- | ------- |
| `forensic_video_processor` | Forensic video processing |
| `forensic_media_service` | Forensic media analysis |
| `evidence_processor` | Evidence processing pipeline |
| `hashing_service` | Hash generation/verification |
| `document_processing_service` | Document OCR/processing |
| `court_grade_discovery_service` | Court-grade discovery |
| `ediscovery_service` | eDiscovery orchestration |
| `violation_detection_service` | Violation detection |

---

## 6. AI Pipeline (`Evident/src/ai/`)

12 modules covering smart tools, chat, and pipeline orchestration.

---

## 7. HTML Templates (`Evident/templates/`)

11 tool-like interfaces: document review workspace, event timeline viewer,
algorithm dashboard, replay dashboard, privilege log, batch upload,
legal library search.

---

## 8. Government API Services (`Evident/auth/`)

| Service | Purpose |
| ------- | ------- |
| `government_sources` | Congress.gov, Federal Register, Archives.gov |
| `government_documents_importer` | Document import pipeline |
| `legal_library_service` | Legal library search |
| `legal_library_importer` | Data import |

---

## Summary

| Category | Count |
| -------- | ----- |
| Standalone apps | 4 |
| Developer tools | 36 |
| Chat tools | 12 |
| eDiscovery algorithms | 13 |
| Backend services | 34 |
| AI pipeline modules | 12 |
| HTML templates | 11 |
| Government services | 4 |
| **Total** | **~126** |

## Migration Priority (for B15-P4)

1. **Standalone apps** — Already structured, need manifest only
2. **Chat tools** — Well-defined function schemas
3. **eDiscovery algorithms** — Registered via registry pattern
4. **Developer tools** — Varied formats, lower priority
