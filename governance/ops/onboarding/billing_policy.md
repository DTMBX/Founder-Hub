# Billing Policy

**Chain:** B14 — Client Onboarding + Billing Ops  
**Phase:** P4  
**Status:** Active  
**Effective:** 2026-02-17  

---

## Purpose

Governs invoice creation, payment recording, and ledger integrity.

## Requirements

1. All invoices must be created through the BillingLedger service
2. Invoices must be reviewed before issuing to clients
3. Every status transition is recorded in the append-only ledger
4. Ledger entries must not be deleted, modified, or reordered
5. Invoice hashes must pass integrity verification at any time
6. Payment processing requires an explicit adapter selection
7. Voiding requires a documented reason

## Payment Terms

| Engagement Type | Default Terms | Late Fee |
|----------------|--------------|----------|
| eDiscovery | Net 30 | Per MSA |
| SMB Consulting | Net 15 | Per SOW |
| Public Tools | Prepaid | N/A |

## Dispute Resolution

1. Client files dispute through designated contact
2. Invoice marked as disputed in ledger
3. Review period: 30 calendar days
4. Resolution recorded with outcome and actor
