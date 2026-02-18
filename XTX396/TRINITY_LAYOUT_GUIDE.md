# Trinity Layout Implementation Guide

## Overview
The Trinity Layout refactors the xTx396 Founder Hub into a triage-driven navigation system that instantly routes three distinct audiences—**Investors**, **Lawyers**, and **Friends/Supporters**—into tailored content pathways while preserving a single, elegant one-page landing.

## Architecture

### Core Concept
Instead of a traditional "scroll through everything" approach, the Trinity Layout provides:
1. **Hero + Trinity Selector**: Large, prominent glass buttons immediately under the hero positioning
2. **Pathway Filtering**: Dynamic content filtering based on audience selection
3. **Visual Mode Indicators**: Subtle badge showing active pathway with "Return to Overview" option
4. **Reversible Navigation**: Easy switching between pathways and full site view

### Audience Pathways

#### 1. Investors Pathway
**Visible Sections:**
- Hero (with Trinity selector)
- Projects (product cards, tech stack, links)
- Proof & Accountability (media mentions, verified milestones)
- Contact (with investor-specific CTAs)

**Hidden Sections:**
- Court & Accountability (legal detail)
- About (personal narrative)

**Purpose:** Focus on business potential, traction, roadmap, and market opportunity without legal complexity

#### 2. Legal / Court Pathway
**Visible Sections:**
- Hero (with Trinity selector)
- Court & Accountability (case cards, organized documents, posture summary)
- Contact (with counsel intake CTA)

**Hidden Sections:**
- Projects (product detail)
- Proof (press mentions)
- About (personal updates)

**Purpose:** Provide attorneys with fast, scannable litigation review workspace emphasizing documentation hygiene, dates, and professional structure

#### 3. About / Friends Pathway
**Visible Sections:**
- Hero (with Trinity selector)
- About (mission, values, current focus, updates)
- Contact (simple contact links)

**Hidden Sections:**
- Projects (technical product detail)
- Court (legal materials)
- Proof (formal accountability)

**Purpose:** Lighter, human-focused content showing personal mission and current focus without cluttering with investor/legal detail

## Implementation Details

### Trinity Selector UI
**Location:** Immediately below hero title and tagline

**Layout:**
- Desktop: Three equal-width columns, side-by-side
- Mobile: Stacked large buttons with full width

**Button Design:**
- Glass buttons with strong contrast (glassPrimary variant for emphasis)
- Icon + label + subtitle format
- Min height 120px mobile, 140px desktop
- Icons: ChartLineUp (Investors), Scales (Legal), UsersFour (About)

**Interaction:**
- Click → filters content → scrolls to relevant section
- Hover: Lift + border brighten effect
- Mobile: Immediate pressed state

### Pathway State Management
```typescript
type TrinityPathway = 'all' | 'investors' | 'legal' | 'about'
const [pathway, setPathway] = useState<TrinityPathway>('all')
```

**State Transitions:**
- Default: `'all'` (full site visible)
- Trinity button click: Set to selected pathway
- "Return to Overview" click: Reset to `'all'`

### Content Filtering Logic
```typescript
const getVisibleSections = () => {
  const enabled = sections?.filter(s => s.enabled).sort((a, b) => a.order - b.order) || []
  
  if (pathway === 'all') return enabled

  if (pathway === 'investors') {
    return enabled.filter(s => 
      s.type === 'hero' || s.type === 'projects' || 
      s.type === 'proof' || s.type === 'contact'
    )
  }

  if (pathway === 'legal') {
    return enabled.filter(s => 
      s.type === 'hero' || s.type === 'court' || s.type === 'contact'
    )
  }

  if (pathway === 'about') {
    return enabled.filter(s => 
      s.type === 'hero' || s.type === 'contact'
    )
  }

  return enabled
}
```

**Special Case:** About section is only visible in 'about' or 'all' pathways (personal narrative content)

### Visual Mode Indicator
**Location:** Fixed, top-right corner below navigation

**Components:**
- Badge: Shows pathway label (e.g., "Investors Mode")
- Button: "Return to Overview" with X icon

**Styling:**
- Backdrop blur with card background
- Accent border for prominence
- Fixed positioning (z-index 40)
- Hidden in 'all' mode

**Mobile Behavior:**
- Scales to smaller size
- Remains visible and accessible
- Touch-friendly tap target

### Navigation Updates
**Dynamic Nav Links:** Navigation component receives filtered sections and only displays anchors for visible sections

**Active Section Indicator:** Highlights current section with underline and background tint

**Mobile Menu:** Sheet drawer updates to show only visible sections

## User Experience Flow

### Happy Path: Investor Visit
1. Land on hero → see name + positioning
2. Identify as investor → see three clear Trinity buttons
3. Click "Investors" → content filters, scroll to Projects
4. Badge appears: "Investors Mode" with "Return to Overview"
5. Browse Projects → Proof → Contact
6. Court section not visible (no cognitive distraction)
7. Click "Return to Overview" → see full site if curious

### Happy Path: Attorney Visit
1. Land on hero → identify as attorney/counsel
2. Click "Legal / Court" → filters to Court section
3. Badge appears: "Legal / Court Mode"
4. Browse case cards → click case → navigate to Case Jacket
5. Review documents, timeline, metadata
6. Optional: Return to overview to see founder background

### Happy Path: Friend/Supporter Visit
1. Land on hero → identify as personal connection
2. Click "About / Friends" → filters to About section
3. Badge appears: "About / Friends Mode"
4. Read mission, values, recent updates
5. See contact info (simple, human)
6. Projects and Court hidden (not relevant)

## Design Principles

### 1. Triage Within 5 Seconds
Trinity buttons must be obvious, labeled clearly, and clickable within first screen. No scrolling required to identify pathway.

### 2. Intentional, Not Gimmicky
Pathway selection feels purposeful and professional, not like a marketing trick. Content truly differs per audience.

### 3. Reversible & Transparent
Mode indicator badge + return button make current state obvious. User never feels "locked in" to a pathway.

### 4. Single Site Architecture
No separate sites, no routing changes. All pathways exist within the same one-page scroll architecture with dynamic visibility.

### 5. Mobile-First Trinity
On mobile, Trinity buttons are large, stacked, immediately accessible. Tapping is instant and satisfying.

## Performance Considerations

### Lazy Loading Strategy
All sections lazy-load based on viewport proximity. Pathway filtering doesn't impact performance—sections remain rendered but hidden.

### Smooth Scrolling
After pathway selection, smooth scroll to target section (projects for investors, court for legal, about for friends) with proper header offset.

### Animation Discipline
Trinity button interactions use subtle, fast animations (<250ms). Reduced motion respected.

## Admin Configuration (Future)

### Audience Focus Mode Toggles
Admin panel will support per-section visibility rules:
- "Show to Investors"
- "Show to Legal"
- "Show to All"

### Preview Mode
Admin can preview site in "Investor view" or "Legal view" before publishing changes

### Content Optimization Guidance
Site Auditor will flag:
- Sections with unclear audience targeting
- Overlapping content between pathways
- Missing CTAs per audience type

## Acceptance Criteria

✅ **Trinity Layout**: Within 5 seconds, a visitor can identify which pathway applies and access focused content

✅ **Pathway Filtering**: Clicking Trinity button instantly filters visible sections and updates navigation

✅ **Mode Indicator**: Active pathway displays as badge with clear "Return to Overview" option

✅ **Reversible**: Switching pathways is simple and immediate; no broken states

✅ **Mobile**: Trinity buttons stacked, large, and obvious on mobile; mode badge scales appropriately

✅ **Single Architecture**: All pathways within one-page scroll; no separate sites or routing complexity

✅ **Professional Tone**: Legal pathway emphasizes structure and documentation; no frivolous animations

✅ **Fast Load**: Pathway selection doesn't trigger loading; content already rendered

## Technical Notes

### State Persistence
Pathway selection is session-only (not persisted). Each visit starts in 'all' mode to allow fresh audience triage.

### URL Hash Support
Future enhancement: Support URL hash like `#investors` or `#legal` to deep-link to a pathway

### Analytics
Track which pathway is selected most frequently to optimize content prioritization

### Accessibility
- Keyboard navigation through Trinity buttons (Tab + Enter)
- Screen reader labels: "Select Investors pathway to view business content"
- Focus states on all interactive elements
- Reduced motion: No parallax or complex animations in pathway transitions

## Migration Notes

### From Previous "Investor Mode" Toggle
Old approach: Top-nav toggle that hid court section

New approach: Hero-level Trinity selector that explicitly routes audiences and hides multiple sections per pathway

**Benefit:** More intentional, clearer UX, supports three audiences instead of two

### Removed Features
- Investor Mode toggle in navigation (replaced by Trinity selector)
- Generic "View Projects" / "Get in Touch" hero CTAs (replaced by Trinity buttons)

### Added Features
- Trinity selector with three pathways
- About section for personal/friend content
- Visual mode indicator badge
- "Return to Overview" functionality

## Future Enhancements

### Domain-Level Configuration
Support `xtx396.com` (primary for all), `investors.xtx396.com` (auto-selects investor pathway), `legal.xtx396.com` (auto-selects legal pathway)

### Email Configuration Panel
Admin screen for catch-all email `X@xtx396.com` setup via domain provider with SPF/DKIM/DMARC guidance

### Site Auditor Tool
Automated diagnostics:
- Clarity (reading length per pathway)
- Balance (section weight per audience)
- Navigation depth
- Contrast compliance
- Broken links
- Redundant sections

### Pathway-Specific CTAs
Different contact CTAs per pathway:
- Investors: "Download Investor Packet", "Schedule Call"
- Legal: "Request Documents", "Counsel Intake"
- Friends: "Email Me", "Subscribe to Updates"

## Testing Checklist

- [ ] Trinity buttons visible on page load without scrolling
- [ ] Clicking Investors filters to Projects + Proof + Contact
- [ ] Clicking Legal filters to Court + Contact
- [ ] Clicking About filters to About + Contact
- [ ] Mode indicator badge appears after pathway selection
- [ ] "Return to Overview" restores full site view
- [ ] Navigation updates to show only visible sections
- [ ] Smooth scroll to target section after pathway selection
- [ ] Mobile: Trinity buttons stacked and tappable
- [ ] Mobile: Mode indicator scales appropriately
- [ ] Keyboard navigation works through Trinity selector
- [ ] Screen reader announces pathway selection
- [ ] Reduced motion respected in transitions
- [ ] Page load performance unchanged
- [ ] All existing sections still function within pathways
