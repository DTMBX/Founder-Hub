# Billing Operations

**Chain:** B14 — Client Onboarding + Billing Ops  
**Phase:** P4  

---

## Overview

Append-only billing ledger with invoice lifecycle management, integrity
hashing, and pluggable payment adapters.

## Invoice Lifecycle

```
draft → issued → paid
                → overdue → paid
                          → disputed
              → void
```

## Components

| File | Purpose |
|------|---------|
| `ops/billing/models/Invoice.ts` | Invoice model, hashing, computation |
| `ops/billing/ledger/BillingLedger.ts` | Append-only ledger + lifecycle ops |
| `ops/billing/adapters/PaymentAdapter.ts` | Payment adapter interface |
| `ops/billing/adapters/LocalManualAdapter.ts` | Offline manual adapter |

## Integrity

- Invoices hashed at creation (SHA-256 over ID, client, line items, total, date)
- Every status transition creates an append-only ledger entry
- Ledger entries are individually hashed
- `verifyLedger()` validates all entry hashes

## Payment Adapters

The `PaymentAdapter` interface supports multiple backends:

| Adapter | Status | Use Case |
|---------|--------|----------|
| `LocalManualAdapter` | Active | Manual payment recording |
| Stripe | Planned | Online card/ACH |
| PayPal | Planned | Online payments |
