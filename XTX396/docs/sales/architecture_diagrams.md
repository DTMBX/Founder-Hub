# Architecture Diagram Pack

> Evident Technologies — System Architecture Reference
>
> Text-based architectural descriptions for sales and procurement review.
> No infrastructure IP addresses, hostnames, or credentials disclosed.

---

## 1. Tenant Isolation Layer

```
┌─────────────────────────────────────────────────┐
│                  INBOUND REQUEST                 │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           TenantContextMiddleware               │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Extract  │→ │ Validate │→ │ Check Status │  │
│  │ Tenant ID│  │ Format   │  │ (active?)    │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                 │
│  DENY: empty ID, unknown tenant, suspended      │
│  ALLOW: valid, active tenant only               │
└──────────────────────┬──────────────────────────┘
                       │ (tenant context attached)
                       ▼
┌─────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER               │
│                                                 │
│  assertSameTenant() at every data boundary      │
└─────────────────────────────────────────────────┘
```

**Key properties:**

- Fail-closed: requests without valid tenant context are rejected
- Middleware processes every request before business logic
- Cross-tenant access structurally prevented at data layer
- Suspended tenants denied immediately

---

## 2. ToolHub Architecture

```
┌────────────────────────────────────────────┐
│              BRAND REGISTRY                │
│  ┌──────────────┐  ┌──────────────┐       │
│  │ evident.json │  │ xtx396.json  │  ...  │
│  └──────┬───────┘  └──────┬───────┘       │
└─────────┼──────────────────┼──────────────┘
          │                  │
          ▼                  ▼
┌────────────────────────────────────────────┐
│              MANIFEST REGISTRY             │
│                                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐     │
│  │ Tool A  │ │ Tool B  │ │ Tool C  │ ... │
│  │ v1.2.0  │ │ v2.0.1  │ │ v1.0.0  │     │
│  └────┬────┘ └────┬────┘ └────┬────┘     │
└───────┼────────────┼──────────┼───────────┘
        │            │          │
        ▼            ▼          ▼
┌────────────────────────────────────────────┐
│                 TOOLHUB                    │
│                                            │
│  Search → Filter → Access Check → Launch   │
│                                            │
│  ┌──────────────────────────────────┐      │
│  │ HIGHLIGHT TOOLS                  │      │
│  │ Risk-scored, curated selection   │      │
│  └──────────────────────────────────┘      │
└────────────────────────────────────────────┘
```

**Key properties:**

- Versioned tool manifests with capability declarations
- Tenant-scoped brand isolation
- Access checks before tool launch
- Curated highlights with editorial control

---

## 3. Audit Pipeline

```
┌──────────────┐
│ SYSTEM EVENT │ (any operation)
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│         OpsAuditLogger           │
│                                  │
│  1. Generate UUID v4             │
│  2. Capture UTC timestamp        │
│  3. Identify actor               │
│  4. Assign event category        │
│  5. Hash payload (SHA-256)       │
│  6. Append to log store          │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│     APPEND-ONLY LOG STORE        │
│                                  │
│  Format: JSONL                   │
│  Retention: 2–7 years            │
│  Access: Write = system only     │
│          Read = authorized roles │
│  Deletion: prohibited            │
└──────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│      INTEGRITY VERIFICATION      │
│                                  │
│  Re-hash payload → compare       │
│  Sequential timestamp check      │
│  UUID uniqueness validation      │
└──────────────────────────────────┘
```

**Event categories:** TENANT, AUTH, ACCESS, EXPORT, BACKUP, MONITOR,
SECURITY, DEMO, ADMIN

---

## 4. Export Generation Pipeline

```
┌─────────────┐
│ RAW RECORDS │ (tenant-scoped query)
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────┐
│ 1. TENANT SCOPE VERIFICATION    │
│    Reject cross-tenant records   │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 2. DETERMINISTIC SORT           │
│    Lexicographic by record ID    │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 3. CANONICAL SERIALIZATION      │
│    Recursive key-sorted JSON     │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 4. SHA-256 HASH                 │
│    Computed over canonical form  │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 5. WATERMARK                    │
│    Tenant + timestamp + batch    │
│    + system ID + version         │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ 6. EXPORT PACKAGE               │
│    Data + hash + watermark       │
│    Verifiable by any party       │
└──────────────────────────────────┘
```

**Reproducibility:** Same input data → same hash, regardless of when
the export is generated.

---

## 5. Backup + Escrow Layer

```
┌────────────────────────────────────────────────┐
│              BACKUP SERVICE                     │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Collect  │→ │ Hash     │→ │ Bundle       │  │
│  │ Files    │  │ Per-file │  │ + Manifest   │  │
│  │          │  │ SHA-256  │  │              │  │
│  └──────────┘  └──────────┘  └──────┬───────┘  │
└─────────────────────────────────────┼───────────┘
                                      │
              ┌───────────────────────┼────────────────┐
              │                       │                │
              ▼                       ▼                ▼
┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐
│  LOCAL STORAGE   │  │  RESTORE SERVICE │  │  ESCROW SERVICE │
│                  │  │                  │  │                 │
│  Provider-based  │  │  Manifest verify │  │  Deposit        │
│  routing         │  │  Hash check      │  │  Verify         │
│                  │  │  Monthly drills   │  │  Release        │
└──────────────────┘  └──────────────────┘  │  Chain of       │
                                             │  custody        │
                                             └─────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────┐
│           ANTI-DELETION GUARD                     │
│                                                   │
│  Protected paths (glob matching)                  │
│  Mass deletion threshold (>25%)                   │
│  Override requires authorized + audited action    │
└──────────────────────────────────────────────────┘
```

---

## 6. Monitoring + SLO Enforcement

```
┌──────────────────────────────────────────────┐
│              HEALTH MONITOR                   │
│                                               │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Record Check │→ │ SHA-256 Hash Result  │  │
│  └──────────────┘  └──────────┬───────────┘  │
│                               │              │
│  ┌──────────────┐             │              │
│  │ Evaluate SLO │◄────────────┘              │
│  └──────┬───────┘                            │
│         │                                    │
│  ┌──────▼───────┐  ┌──────────────────────┐  │
│  │ Generate     │→ │ Alert Routing        │  │
│  │ Alert        │  │ warning / critical   │  │
│  └──────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────┘

SLO TARGETS:
  ┌──────────┬──────────┬──────────┐
  │ Public   │ Pro      │ Internal │
  │ 99.0%    │ 99.5%    │ 99.9%    │
  └──────────┴──────────┴──────────┘

ABUSE PROTECTION:
  ┌──────────────┐  ┌───────────────┐  ┌──────────┐
  │ Rate Limit   │→ │ Burst Detect  │→ │ Soft Ban │
  │ 60 req/min   │  │ 15 req / 5s   │  │ 10 min   │
  └──────────────┘  └───────────────┘  └──────────┘
```

---

## Diagram Index

| # | Diagram | Primary Controls |
|---|---|---|
| 1 | Tenant Isolation | TI-01, TI-02, TI-03 |
| 2 | ToolHub | Tool manifests, brand registry |
| 3 | Audit Pipeline | AU-01 through AU-05 |
| 4 | Export Pipeline | EX-01 through EX-06 |
| 5 | Backup + Escrow | BK-01 through BK-09, SP-01, SP-02 |
| 6 | Monitoring + SLO | MO-01 through MO-04, AB-01 through AB-03 |

---

*All diagrams represent currently implemented architecture. No
speculative or planned components are shown without annotation.*
