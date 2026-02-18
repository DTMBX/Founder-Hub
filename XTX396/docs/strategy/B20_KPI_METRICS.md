# B20 KPI Metrics — Revenue Engine Dashboard

> Last updated: 2026-02-17
> Classification: Internal — Strategy
> Version: 1.0

---

## Purpose

Define the key performance indicators for the B20 Revenue Engine.
These metrics track the effectiveness of inbound authority content,
outbound targeting, and pipeline progression. All metrics are
factual measurements — no vanity metrics, no inflated reporting.

---

## 1. Inbound Metrics

### Inbound Conversion Rate

**Definition:** Percentage of trust portal visitors who submit the
email capture form and download at least one document.

**Formula:** `(form submissions / unique page views) × 100`

**Target:** 5–10%

**Data source:** Trust portal analytics events (`trust_form_submitted`
/ `trust_page_view`)

**Reporting frequency:** Weekly

---

### Security Packet Downloads

**Definition:** Total number of security overview packets downloaded
or delivered per reporting period.

**Formula:** Count of `security_packet_download` events

**Target:** 10+ per month (initial launch period)

**Breakdown:**
- Portal downloads (self-service)
- Email deliveries (outbound-triggered)
- Manual deliveries (sales-initiated)

**Data source:** OpsAuditLogger events

**Reporting frequency:** Weekly

---

### Article Engagement

**Definition:** Unique visitors to SEO authority articles who spend
more than 60 seconds on page.

**Formula:** `(engaged visitors / total visitors) × 100`

**Target:** 40%+ engagement rate

**Data source:** Server-side analytics (no third-party tracking)

**Reporting frequency:** Monthly

---

## 2. Outbound Metrics

### Outbound Reply Rate

**Definition:** Percentage of outbound email sequences that receive
at least one reply (any sentiment).

**Formula:** `(sequences with reply / sequences sent) × 100`

**Target:** 8–12%

**Breakdown by email:**
- Email 1 reply rate (target: 3–5%)
- Email 2 reply rate (target: 2–3%)
- Email 3 packet request rate (target: 1–3%)
- Email 4 walkthrough booking rate (target: 0.5–1.5%)

**Data source:** Email sequence tracking (reply detection only,
no open tracking)

**Reporting frequency:** Weekly

---

### Outbound-to-Qualified Rate

**Definition:** Percentage of outbound-sourced leads that reach
Sales Qualified Lead (SQL) status (score 60+).

**Formula:** `(SQLs from outbound / total outbound leads) × 100`

**Target:** 2–4%

**Data source:** LeadModel + lead scoring system

**Reporting frequency:** Monthly

---

## 3. Pipeline Metrics

### Technical Call Conversion Rate

**Definition:** Percentage of technical walkthroughs that advance
to Procurement Review stage.

**Formula:** `(procurement reviews / walkthroughs completed) × 100`

**Target:** 30–50%

**Data source:** CRM pipeline stage transitions

**Reporting frequency:** Monthly

---

### Time to Close

**Definition:** Average number of days from Lead creation to
Closed Won.

**Formula:** `avg(closed_won_date - lead_created_date)`

**Target:** 100 days (see CRM pipeline velocity targets)

**Breakdown by stage:**

| Stage Transition | Target Days |
|---|---|
| Lead → Security Packet Sent | 3 |
| Packet Sent → Technical Call | 7 |
| Technical Call → Review Complete | 1 |
| Review Complete → Procurement | 14 |
| Procurement → Pilot | 30 |
| Pilot → Closed Won | 45 |

**Data source:** CRM pipeline timestamps

**Reporting frequency:** Monthly

---

### Pipeline Velocity

**Definition:** Dollar-weighted rate at which deals move through
the pipeline.

**Formula:** `(number of SQLs × avg deal value × win rate) / avg sales cycle length`

**Initial baseline:** Establish after first 3 months of pipeline data

**Data source:** CRM pipeline + revenue records

**Reporting frequency:** Monthly

---

### Win Rate

**Definition:** Percentage of opportunities that reach Closed Won
(out of opportunities that reached Technical Review or later).

**Formula:** `(closed won / (closed won + closed lost after technical review)) × 100`

**Target:** 20–30% (adjusted as data accumulates)

**Data source:** CRM pipeline outcomes

**Reporting frequency:** Quarterly

---

## 4. Operational Health Metrics

### Lead Response Time

**Definition:** Average time from lead creation to first meaningful
contact (not auto-acknowledgment).

**Formula:** `avg(first_contact_timestamp - lead_created_timestamp)`

**Target:** Under 24 hours for inbound; under 48 hours for outbound

---

### Packet Delivery Time

**Definition:** Average time from packet request to packet delivery.

**Formula:** `avg(packet_delivered_timestamp - packet_requested_timestamp)`

**Target:** Under 4 hours for portal requests; under 24 hours for
NDA-required deliveries

---

### Loss Reason Distribution

**Definition:** Categorized breakdown of Closed Lost reasons.

**Categories:**
- SOC 2 required at signing
- On-premises required
- Budget
- Competitor selected
- No response / went silent
- Not a fit (other)

**Data source:** CRM Closed Lost records (reason required)

**Reporting frequency:** Monthly

---

## 5. Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  B20 Revenue Engine — KPI Dashboard                         │
├──────────────────────┬──────────────────────────────────────┤
│  INBOUND             │  OUTBOUND                            │
│  ┌────────────────┐  │  ┌──────────────────┐               │
│  │ Conversion: X% │  │  │ Reply Rate: X%   │               │
│  │ Downloads: N   │  │  │ SQL Rate: X%     │               │
│  │ Engagement: X% │  │  │ Sequences: N     │               │
│  └────────────────┘  │  └──────────────────┘               │
├──────────────────────┴──────────────────────────────────────┤
│  PIPELINE                                                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│  │Lead │►│Pkt  │►│Call │►│Rev  │►│Proc │►│Pilot│►│Won  │ │
│  │ N   │ │ N   │ │ N   │ │ N   │ │ N   │ │ N   │ │ N   │ │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │
│                                                              │
│  Win Rate: X%  │  Avg Close: N days  │  Velocity: $X/day   │
├──────────────────────────────────────────────────────────────┤
│  HEALTH                                                      │
│  Response Time: Xh  │  Packet Delivery: Xh                  │
│  Loss Reasons: [distribution chart]                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Reporting Rules

1. All metrics are computed from system data — no manual adjustments
2. Targets are reviewed quarterly and adjusted based on actuals
3. Metrics that consistently miss targets trigger process review,
   not target inflation
4. No vanity metrics (impressions, likes, follower counts) are
   included in this dashboard
5. All data sources are audit-logged

---

*Measure what matters. Report what is true. Adjust based on evidence.*
