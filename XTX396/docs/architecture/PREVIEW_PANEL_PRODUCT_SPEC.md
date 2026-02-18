# Preview Panel Product Specification

> Architecture Planning — Session C  
> Status: PLANNING ONLY — no implementation  
> Date: 2026-02-18

---

## 1. Overview

The **Visitor Preview Panel** is a public-facing interface that allows
prospective clients to configure a demo website, see a live watermarked
preview, and optionally request a sales follow-up. It replaces the
existing video-montage-based preview with an interactive, real-time
experience.

**Core promise:** A visitor can see what their site would look like —
without signing up, without exposing source code, and without creating
anything permanent.

---

## 2. User Flow

```
┌─────────────────────────────────────────────────────────┐
│  VISITOR LANDS ON /preview (or /demo)                   │
│                                                         │
│  1. SELECT SITE TYPE                                    │
│     ○ Law Firm   ○ Small Business   ○ Agency            │
│                                                         │
│  2. SELECT BUSINESS TYPE (filtered by site type)        │
│     ○ Personal Injury  ○ Criminal Defense  ○ ...        │
│                                                         │
│  3. ENTER BASICS                                        │
│     Business Name: [____________]                       │
│     Tagline:       [____________] (optional)            │
│                                                         │
│  4. CHOOSE PRESET                                       │
│     [Classic Authority] [Modern Edge] [Warm Trust] ...  │
│     (visual thumbnails, click to select)                │
│                                                         │
│  5. OPTIONAL: ADJUST COLORS                             │
│     Primary: [color picker]                             │
│     Accent:  [color picker]                             │
│     (contrast ratio validated in real time)             │
│                                                         │
│  6. GENERATE PREVIEW                                    │
│     [Generate My Demo Site →]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  PREVIEW EXPERIENCE (split layout)                      │
│                                                         │
│  ┌─────────────┬───────────────────────────────────┐    │
│  │ LEFT PANEL  │  RIGHT PANEL                      │    │
│  │ (config)    │  (live preview iframe)             │    │
│  │             │                                    │    │
│  │ Business:   │  ┌──────────────────────────────┐  │    │
│  │ [Smith Law] │  │                              │  │    │
│  │             │  │  WATERMARKED PREVIEW          │  │    │
│  │ Preset:     │  │  ┌────────────────────────┐  │  │    │
│  │ [Classic ▼] │  │  │ Smith & Associates     │  │  │    │
│  │             │  │  │                        │  │  │    │
│  │ Colors:     │  │  │  DEMO — Not for        │  │  │    │
│  │ ■ ■ ■      │  │  │  production use         │  │  │    │
│  │             │  │  │                        │  │  │    │
│  │ Pages:      │  │  └────────────────────────┘  │  │    │
│  │ ○ Home      │  │                              │  │    │
│  │ ○ About     │  │  [responsive toggle]         │  │    │
│  │ ○ Services  │  │  [📱] [💻] [🖥]             │  │    │
│  │ ○ Contact   │  │                              │  │    │
│  │             │  └──────────────────────────────┘  │    │
│  │ [Share ↗]   │                                    │    │
│  │ [Request    │                                    │    │
│  │  Follow-up] │                                    │    │
│  └─────────────┴───────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Input Form Specification

### 3.1 Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Site Type | Radio group (3 options) | Yes | Must be one of `law-firm`, `small-business`, `agency` |
| Business Type | Radio group (filtered) | Yes | Must match selected site type |
| Business Name | Text | Yes | 2–80 characters, no HTML, no URLs |
| Tagline | Text | No | 0–120 characters, no HTML |
| Preset | Card selector | Yes | Must exist in preset registry |
| Primary Color | Color picker | No | Must pass WCAG 2.1 AA contrast against white |
| Accent Color | Color picker | No | Must pass WCAG 2.1 AA contrast against white |

### 3.2 Form Behavior

- Business Type options update dynamically when Site Type changes
- Preset options update dynamically when Business Type changes
- Color pickers show real-time contrast ratio feedback
- Form validates on blur (per field) and on submit (all fields)
- All inputs are sanitized (HTML stripped, trimmed, normalized)

### 3.3 Anti-Abuse

- No file uploads
- No rich text
- No URL fields
- Maximum input payload: 2 KB
- CAPTCHA or proof-of-work challenge before "Generate" (see
  RISK_ABUSE_MODEL_PREVIEW.md)

---

## 4. Preview Frame Specification

### 4.1 Rendering

The preview renders inside a sandboxed iframe:

```html
<iframe
  src="{preview-url}"
  sandbox="allow-scripts allow-same-origin"
  referrerpolicy="no-referrer"
  loading="lazy"
  title="Demo site preview"
></iframe>
```

- The iframe loads a fully rendered HTML page from the generation
  pipeline
- The page is self-contained (inline CSS, no external dependencies)
- JavaScript is limited to scroll and responsive behavior
- No forms are functional
- No external network requests

### 4.2 Watermark

The watermark is a CSS overlay applied to every page:

```css
.evident-watermark::after {
  content: "DEMO — Not for production use";
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(2rem, 5vw, 4rem);
  color: oklch(0.5 0 0 / 0.12);
  transform: rotate(-30deg);
  pointer-events: none;
  z-index: 9999;
  user-select: none;
}
```

The watermark:
- Covers the entire viewport (repeating pattern for large pages)
- Is not removable via DevTools without modifying the HTML source
- Does not interfere with readability at 12% opacity
- Is present on every page of the preview
- Is baked into the HTML, not injected client-side

### 4.3 Responsive Toggle

Three preview widths:
- Mobile: 375px (iPhone SE)
- Tablet: 768px (iPad)
- Desktop: 1280px (standard)

The iframe container resizes; the iframe content responds via standard
media queries. The toggle is a segmented control above the preview
frame.

### 4.4 Page Navigation

The left panel lists available pages (Home, About, Services, Contact).
Clicking a page updates the iframe `src` to the corresponding route
within the preview. Navigation does not trigger a new generation — all
pages are pre-generated.

---

## 5. Post-Preview Actions

### 5.1 Share Link

After generation, a shareable URL is created:

```
https://xtx396.com/preview/{sessionToken}
```

- Token is signed (HMAC-SHA256) with server secret
- Token expires in 24 hours
- Token is single-use for share (can be viewed multiple times)
- No authentication required to view

### 5.2 Request Follow-Up

A minimal contact form (available only after preview generation):

| Field | Type | Required |
|-------|------|----------|
| Email | Email | Yes |
| Phone | Tel | No |
| Notes | Textarea | No (max 500 chars) |

Submission:
- Rate-limited (3 requests per email per 24 hours)
- Stored as a lead in the leads system
- Audit-logged: `preview_followup_requested`
- Confirmation shown to user; no email auto-response

### 5.3 What Visitors Do NOT Get

- No download of the generated site
- No access to source code or template files
- No ability to edit the preview after generation
- No creation of an account
- No access to admin or configuration panels
- No persistent storage of their data beyond the lead submission

---

## 6. Accessibility Requirements

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All form fields and controls keyboard-accessible |
| Screen reader | All inputs labeled, preview iframe has `title`, live regions for status |
| Color contrast | All text meets WCAG 2.1 AA (4.5:1 body, 3:1 large) |
| Reduced motion | `prefers-reduced-motion` disables transitions in preview |
| Focus visible | Focus rings on all interactive elements |
| Error messages | Associated with fields via `aria-describedby` |
| Language | `lang="en"` on all generated pages |

---

## 7. Analytics Events (Privacy-Safe)

| Event | Data Captured |
|-------|---------------|
| `preview_page_loaded` | timestamp, referrer domain (not full URL) |
| `preview_type_selected` | site type, business type |
| `preview_generated` | preset selected, generation duration |
| `preview_page_navigated` | page route viewed in preview |
| `preview_shared` | share link created (no PII) |
| `preview_followup_requested` | timestamp only (email stored separately in leads) |
| `preview_abandoned` | last step reached before exit |

No cookies. No fingerprinting. No third-party scripts. All events are
first-party, append-only, aggregated daily.

---

## 8. States & Error Handling

| State | UI |
|-------|-----|
| Initial | Form displayed, preview area shows placeholder illustration |
| Generating | Form locked, spinner in preview area, "Generating your preview..." |
| Generated | Split layout: form (editable) + preview (iframe) |
| Error | Inline error banner, form remains editable, retry button |
| Rate Limited | "Too many requests. Try again in X minutes." |
| Expired | "This preview has expired. Generate a new one." |
| Offline | "Preview generation requires an internet connection." |

---

## Non-Goals

- This spec does NOT define the admin's view of generated previews.
- This spec does NOT define a "save and resume later" workflow.
- This spec does NOT define payment or conversion flows.
- This spec does NOT define A/B testing of preview experiences.
