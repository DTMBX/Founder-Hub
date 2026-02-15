# xTx396 Hub PRD — Trinity Layout Edition

A premium one-page personal landing site for Devon Tyler Barber (xTx396) with **Trinity Layout** — an intelligent audience-triage navigation system that instantly routes three distinct audiences (Investors, Lawyers, Friends/Supporters) into tailored content pathways while preserving a single, elegant landing page experience.

**Latest Update**: Implemented Trinity Layout refactor with three distinct audience pathways accessible from the hero section. Visitors click large, prominent glass buttons (Investors | Legal/Court | About/Friends) to instantly filter content to their needs. Active pathway displays as a badge with "Return to Overview" option. Navigation dynamically updates to show only relevant sections per pathway.

**Experience Qualities**:
1. **Triage-Driven & Intentional** - Within 5 seconds, visitors identify which pathway applies to them and access focused, relevant content without wading through irrelevant sections
2. **Audience-Specific** - Investors see Projects + Roadmap + Traction; Lawyers see Court section with organized documentation; Friends see personal mission + updates + simple contact
3. **Elegant & Reversible** - Switching between pathways is simple with visual mode indicators; "Return to Overview" button allows exploration of full site
4. **Clean & Professional** - Maximum content width ~1000px, generous vertical spacing, dark high-contrast theme with glassmorphism buttons, restrained typography

**Complexity Level**: Complex Application (advanced functionality with audience-driven content routing)
This comprehensive dual-interface application now features Trinity Layout audience triage, sophisticated scroll storytelling, glassmorphism design system, lazy loading strategies, responsive layout flows, admin dashboard with authentication, role-based access control, advanced content management, batch document processing with optional OCR, metadata extraction pipeline, automated naming rules engine, staging and review workflows, project customization with live preview, case management with timeline support, document type taxonomy (filing types), scriptable batch utilities, chain-of-custody tracking, attorney review notes, contingency checklists, and a polished public-facing site with pathway-driven content filtering and dynamic section rendering.

## Essential Features

### Trinity Selector (Audience Triage)
- **Functionality**: Three large, prominent glass buttons in hero section for instant audience routing: Investors | Legal/Court | About/Friends
- **Purpose**: Enable visitors to identify their pathway and access focused, relevant content within 5 seconds
- **Trigger**: Visitor lands on hero section and sees three clear pathway options
- **Progression**: Read positioning → identify relevant pathway → click Trinity button → scroll to focused content section → explore pathway-specific materials → optional "Return to Overview" to see full site
- **Success criteria**: Trinity buttons obvious within first screen, mobile stacked layout, clicking filters visible sections, active pathway badge displays, return to overview works

### Pathway Content Filtering
- **Functionality**: Dynamic section visibility based on selected pathway: Investors (Projects + Proof + Contact), Legal (Court + Contact), About (Contact only beyond hero)
- **Purpose**: Reduce cognitive load by showing only relevant sections per audience type while maintaining single-page architecture
- **Trigger**: User clicks Trinity selector button
- **Progression**: Select pathway → content filters instantly → navigation updates to show only visible sections → mode indicator badge appears in corner → browse focused content → click "Return to Overview" to reset
- **Success criteria**: Filtering instant, navigation updates, sections hide/show correctly, mode is reversible, no separate sites created

### Visual Mode Indicators
- **Functionality**: Small badge near top-right shows active pathway (e.g., "Investors Mode", "Legal / Court Mode") with "Return to Overview" button
- **Purpose**: Maintain context awareness and provide easy pathway exit
- **Trigger**: User selects a pathway from Trinity selector
- **Progression**: Pathway selected → badge appears with mode name → user sees filtered content → clicks "Return to Overview" → badge disappears, all sections visible
- **Success criteria**: Badge visible but unobtrusive, clearly labeled, return button works, badge disappears in overview mode

### Public Landing Page
- **Functionality**: Single-page scrolling site with sections for Hero, Projects, Court Cases, Proof/Press, and Contact/CTA
- **Purpose**: Present a credible, polished personal brand to investors, recruiters, and collaborators
- **Trigger**: Visitor navigates to xTx396.online/.info/.com
- **Progression**: Land on hero → scroll or click nav anchor → read section content → engage with CTAs or case materials → contact/schedule
- **Success criteria**: Page loads in <2s, all sections visible, responsive on mobile, investor mode toggle works

### Sticky Navigation with Anchors
- **Functionality**: Top navigation bar with anchor links (Home, Projects, Court, Proof, Contact) and optional Investor Mode toggle
- **Purpose**: Enable quick navigation and simplified investor-focused view
- **Trigger**: Page scroll or nav click
- **Progression**: Click anchor → smooth scroll to section, Toggle investor mode → hide non-essential sections
- **Success criteria**: Smooth scrolling works, mobile hamburger menu functional, investor mode filters correctly

### Court Case Management (Public View)
- **Functionality**: Display case cards in grid, open case detail modal with metadata, timeline, and PDF documents
- **Purpose**: Provide transparent access to court accountability materials
- **Trigger**: Visitor scrolls to Court section or clicks case card
- **Progression**: View case grid → click case → navigate to Case Jacket page → explore documents/timeline/details → preview PDFs → share link
- **Success criteria**: Cases display with correct metadata, Case Jacket loads fast, PDFs load in viewer, visibility rules enforced, stable shareable URLs

### Case Jacket (Dedicated Case Review Workspace)
- **Functionality**: Full-page professional case review interface with document table, timeline, metadata panel, filters, search, and PDF preview
- **Purpose**: Provide attorneys and stakeholders with fast, scannable litigation review workspace to understand posture, timeline, and key filings
- **Trigger**: Click case card from Court section or navigate to shareable case URL
- **Progression**: Navigate to case → see header with breadcrumb → review featured docs → filter/search document table → sort by date/type → preview PDF in right pane → export case index
- **Success criteria**: Loads fast (<2s), document table sortable, filters responsive, search works across titles/text, PDF preview doesn't block table, shareable URL stable, keyboard accessible, mobile usable with tab navigation

### Case Jacket Layout
- **Desktop**: Two-pane layout with left sidebar (metadata + timeline + filters), main pane (document table with featured strip), optional collapsible right pane for PDF preview
- **Mobile**: Stacked sections with sticky "Docs / Timeline / Details" tab bar for quick navigation
- **Header**: Case title, court, docket, status badge, last updated, copy link, export buttons, breadcrumb back to Court section
- **Success criteria**: Responsive layout works on all screens, tabs functional on mobile, sidebar scrollable independently

### PDF Document System (Public View)
- **Functionality**: In-app PDF viewer with thumbnails, metadata display, and shareable links
- **Purpose**: Allow document preview without forced downloads, controlled sharing
- **Trigger**: User clicks PDF in case detail or navigates to unlisted share link
- **Progression**: Click PDF → viewer opens → browse pages → copy share link or download
- **Success criteria**: PDFs render correctly, visibility rules enforced, share links work for unlisted docs

### Admin Authentication
- **Functionality**: Secure login with email/password, rate limiting, session management, optional 2FA
- **Purpose**: Protect admin dashboard from unauthorized access
- **Trigger**: Navigate to /admin route
- **Progression**: Enter credentials → validate → rate limit check → create session → redirect to dashboard
- **Success criteria**: Invalid login blocked, lockout after failures, sessions expire properly, 2FA works

### Admin Content Editor
- **Functionality**: Edit all public site text, links, sections via forms with autosave and publish workflow
- **Purpose**: Update site content without code changes or redeployment
- **Trigger**: Admin clicks section to edit in dashboard
- **Progression**: Navigate to Content → select section → edit fields → autosave draft → preview → publish
- **Success criteria**: Changes persist, drafts save automatically, preview shows changes, publish updates public site

### Admin Project Management
- **Functionality**: Create/edit/reorder project cards with title, summary, tech stack, links
- **Purpose**: Showcase portfolio work to visitors
- **Trigger**: Admin navigates to Projects section in dashboard
- **Progression**: Click Add Project → fill form → add links → set order → enable/disable → publish
- **Success criteria**: Projects appear on public site in correct order, all fields editable, can be hidden

### Admin Case Management
- **Functionality**: Create/edit court cases with docket number, court, status, dates, summary, PDFs
- **Purpose**: Manage court accountability content with full control over visibility and organization
- **Trigger**: Admin navigates to Court section in dashboard
- **Progression**: Click Add Case → fill metadata → set status → attach PDFs → set visibility → reorder → publish
- **Success criteria**: Cases display correctly, metadata accurate, PDFs attached, visibility enforced, ordering works

### Admin PDF Upload & Management
- **Functionality**: Upload PDFs, set metadata, assign to cases, control visibility (Private/Unlisted/Public), with advanced OCR pipeline for automated field extraction
- **Purpose**: Control document access and sharing with granular visibility rules while accelerating metadata entry through intelligent suggestions
- **Trigger**: Admin uploads PDF in Media section or within case editor
- **Progression**: Select file → validate size/type → upload → OCR extracts fields → review confidence scores → accept/override suggestions → assign case → set visibility → save
- **Success criteria**: Upload validates properly, OCR processes documents, confidence scores displayed accurately, suggestions are helpful, files stored securely, visibility rules enforced, share links generate

### Advanced OCR Pipeline with Confidence Scores
- **Functionality**: Automated extraction of docket numbers, document types, filing dates, court names, parties, and court stamp detection with confidence scoring for each field
- **Purpose**: Accelerate document metadata entry while maintaining accuracy through human oversight and confidence transparency
- **Trigger**: PDF uploaded with OCR enabled (default on)
- **Progression**: Upload PDF → OCR processes text → Extract structured fields using pattern matching and context analysis → Assign confidence scores (high 85%+, medium 65-84%, low <65%) → Display suggestions with reasoning → Admin reviews and accepts/overrides → Fields populate form
- **Success criteria**: 
  - Docket numbers extracted with 85%+ accuracy for standard formats
  - Document types classified correctly 80%+ of the time
  - Filing dates identified with context (near "filed"/"received" keywords)
  - Court stamps detected with visual region indication
  - Confidence scores reflect actual reliability
  - Alternative matches shown when multiple possibilities exist
  - Processing completes within 2-3 seconds per document
  - Admin can always override any suggestion
  - Reasoning/explanation provided for each extraction

### OCR Field Extraction Details
- **Docket Number Extraction**: Multiple pattern matching (ESX-L-001234-23, etc.), context-aware (near "docket"/"case" keywords), filename analysis, alternative matches displayed
- **Document Type Classification**: Keyword analysis (complaint, motion, order, certification, etc.), position weighting (header vs body), filename analysis, multi-tier confidence scoring
- **Filing Date Extraction**: Context patterns ("filed on", "received", "entered"), multiple date format support (MM/DD/YYYY, Month DD, YYYY), proximity to stamp indicators, fallback to generic dates with lower confidence
- **Court Name Extraction**: Pattern matching (Superior Court, District Court, etc.), jurisdiction identification, header position weighting
- **Court Stamp Detection**: Multiple indicator keywords (filed, received, clerk, certified), stamp type classification (filed/received/certified), region localization, confidence based on multiple signals
- **Party Names**: Pattern matching (Plaintiff v. Defendant format), multiple party extraction
- **Processing Metadata**: Processing time tracking, text density analysis, document quality assessment, page count extraction

### Staging Review with Automated Suggestions
- **Functionality**: Review extracted OCR fields with confidence scores, one-click acceptance of suggestions, intelligent case linking based on docket matches, collapsible suggestions panel
- **Purpose**: Provide efficient review workflow that balances automation with human oversight
- **Trigger**: Documents move from upload queue to staging
- **Progression**: Open staging document → view automated field suggestions panel → see confidence scores with color coding → read extraction reasoning → click to accept high-confidence suggestions → manually override or refine low-confidence fields → link to matching case by docket → publish
- **Success criteria**:
  - All extracted fields visible with confidence scores
  - Color-coded badges (green/yellow/orange) for quick assessment
  - Reasoning text explains why field was suggested
  - One-click apply for each suggestion
  - Automatic case linking when docket matches existing case
  - Court stamp indicator clearly visible
  - Confidence legend explains scoring tiers
  - Collapsed/expanded state persists per document
  - Works smoothly on mobile with touch interactions

### Admin Theme Customization
- **Functionality**: Edit color palette, typography, spacing, borders, shadows with live preview
- **Purpose**: Customize brand identity without touching code
- **Trigger**: Admin navigates to Theme section
- **Progression**: Select color token → pick color → see preview → adjust fonts → tweak spacing → restore defaults or publish
- **Success criteria**: Changes preview instantly, all tokens editable, restore defaults works, changes persist

### Admin Domain & SEO Controls
- **Functionality**: Set primary domain, configure redirects, edit meta tags, upload social preview image
- **Purpose**: Manage multi-domain setup and search/social appearance
- **Trigger**: Admin navigates to Domains/SEO section
- **Progression**: Set primary domain → configure redirects → edit meta tags → upload preview image → save
- **Success criteria**: Domain config displays, meta tags update, social preview shows correctly

### Admin Audit Log
- **Functionality**: View chronological log of all admin actions (who/what/when)
- **Purpose**: Track changes and maintain accountability for content updates
- **Trigger**: Admin navigates to Audit Log section
- **Progression**: View log → filter by user/action/date → export if needed
- **Success criteria**: All actions logged with timestamp and user, filterable, readable format

### Premium Scroll Storytelling
- **Functionality**: Scroll progress indicator, active section tracking in navigation, smooth anchor scrolling with URL hash updates, back-to-top button
- **Purpose**: Create engaging scroll-based narrative that guides visitors through content with visual feedback
- **Trigger**: User scrolls page or clicks navigation anchors
- **Progression**: Scroll page → progress bar updates → nav highlights active section → back-to-top appears → click anchor → smooth scroll with offset → URL updates
- **Success criteria**: Progress bar accurate, active section detection works, smooth scrolling respects reduced motion, back-to-top fades appropriately

### Glassmorphism Design System
- **Functionality**: Glass button variants (Primary, Accent, Ghost, Solid), glass card components with intensity levels, frosted surfaces with blur and translucency
- **Purpose**: Modern, premium aesthetic with high contrast and readability while maintaining visual sophistication
- **Trigger**: Rendered throughout UI for buttons, cards, navigation, modals
- **Progression**: User interacts with glass elements → see hover lift and border brighten → press for scale feedback → focus shows clear ring
- **Success criteria**: All glass elements maintain high contrast, backdrop blur supported or falls back gracefully, intensity levels configurable

### Motion & Accessibility Controls
- **Functionality**: Global motion settings (Full/Reduced/Off), respects OS reduced-motion preference, extra contrast mode, GPU-optimized animations
- **Purpose**: Ensure accessibility for users with motion sensitivity while allowing those who enjoy animations to experience them fully
- **Trigger**: System preference detection or admin settings application
- **Progression**: User visits site → motion preference detected → animations adjust accordingly → admin can override in settings
- **Success criteria**: Reduced motion disables nonessential animations, extra contrast increases legibility, all animations under 400ms, no scroll jank

### Responsive Layout Flow
- **Functionality**: Distinct desktop vs mobile layouts with different spacing, grids, and interaction patterns; desktop uses wider gutters and sticky nav; mobile uses stacked cards and larger tap targets
- **Purpose**: Optimize experience for each device class rather than just scaling the same layout
- **Trigger**: Viewport size detection
- **Progression**: Load on mobile → see stacked cards and bottom sheet modals → load on desktop → see multi-column grids and centered modals
- **Success criteria**: Mobile layout feels native with proper tap targets, desktop uses available space effectively, transitions smooth between breakpoints

### Lazy Loading Strategy
- **Functionality**: Intersection observers for section reveals, lazy-loaded images and PDF previews, skeleton placeholders, viewport-aware loading
- **Purpose**: Improve initial page load performance while ensuring smooth experience as user scrolls
- **Trigger**: User scrolls near content that hasn't loaded yet
- **Progression**: Initial load shows hero and first section → scroll down → intersection observer triggers → content fades in → heavy elements load only when needed
- **Success criteria**: First content appears quickly, smooth progressive loading, no layout shift, admin can configure preload strategies

## Edge Case Handling

- **Invalid Login Attempts**: Rate limiting with exponential backoff, account lockout after 5 failures, password reset flow
- **PDF Upload Failures**: Size limit validation (10MB), file type checking, clear error messages with guidance
- **Broken External Links**: Admin dashboard shows link checker warnings, manual review prompt
- **Domain Misconfiguration**: Checklist screen with current status hints, doesn't break site if DNS not set
- **Concurrent Edits**: Last-write-wins with timestamps, audit log tracks all changes
- **Missing Required Fields**: Form validation with inline errors, prevent publish if critical fields empty
- **PDF Visibility Breach Attempts**: Server-side enforcement, authentication checks on all document routes
- **Session Expiration**: Auto-save drafts before logout, graceful redirect to login with return URL
- **Mobile Admin Usage**: Responsive dashboard layout, touch-friendly controls, simplified mobile nav
- **Empty States**: Helpful prompts when no projects/cases/PDFs exist yet, guide admin to add first item
- **Case Jacket Not Found**: Show "Case not found" message with back button if case ID invalid or case is private
- **Missing Document Metadata**: Handle cases where filing date or doc type is undefined, fall back to upload date with clear label
- **Large Document Sets**: Lazy-load document rows, paginate or virtualize if >100 documents, maintain scroll position
- **PDF Preview Failures**: Show fallback "Open in new tab" if preview can't load, never block document table
- **Search with No Results**: Show clear "No documents match" message with suggestion to clear filters
- **Duplicate Document Names**: Warn in staging, allow manual override, never silently overwrite

## Design Direction

The design should evoke confidence, clarity, and calm professionalism - a refined digital presence that feels product-grade rather than portfolio-busy. Think midnight workspace: sophisticated dark theme with precise typography, generous breathing room, and intentional motion that guides without distracting. The aesthetic should signal credibility to investors while maintaining transparency through organized documentation.

## Color Selection

A dark-first professional palette with deep blues and electric accents that project authority and modernity.

- **Primary Color**: Electric Blue `oklch(0.65 0.24 250)` - Commands attention for CTAs and key actions, signals innovation and trust
- **Secondary Colors**: 
  - Deep Navy `oklch(0.15 0.04 250)` for primary background - sophisticated, professional
  - Slate Blue `oklch(0.25 0.06 250)` for elevated surfaces - subtle hierarchy
  - Soft Blue-Gray `oklch(0.45 0.05 250)` for muted elements
- **Accent Color**: Cyan `oklch(0.75 0.15 200)` - Sharp highlight for hover states and active elements
- **Foreground/Background Pairings**:
  - Deep Navy Background `oklch(0.15 0.04 250)`: White text `oklch(0.98 0 0)` - Ratio 13.8:1 ✓
  - Slate Blue Surface `oklch(0.25 0.06 250)`: White text `oklch(0.98 0 0)` - Ratio 11.2:1 ✓
  - Electric Blue Primary `oklch(0.65 0.24 250)`: Deep Navy text `oklch(0.15 0.04 250)` - Ratio 5.1:1 ✓
  - Cyan Accent `oklch(0.75 0.15 200)`: Deep Navy text `oklch(0.15 0.04 250)` - Ratio 6.8:1 ✓

## Font Selection

Typography should convey precision and modernity while maintaining excellent readability for both quick scanning and detailed reading.

- **Primary**: Inter Variable for UI, navigation, and body text - clean, highly legible, professional
- **Display**: Space Grotesk for section headers and hero text - distinctive geometric character with technical edge
- **Mono**: JetBrains Mono for docket numbers, case IDs, and code references - precise and authoritative

**Typographic Hierarchy**:
- H1 (Hero Name): Space Grotesk Bold/56px/tight tracking (-0.02em)
- H2 (Section Headers): Space Grotesk SemiBold/36px/tight tracking (-0.01em)
- H3 (Card Titles): Inter SemiBold/20px/normal tracking
- Body (Descriptions): Inter Regular/16px/relaxed leading (1.6)
- Small (Metadata): Inter Medium/14px/normal leading (1.5)
- Mono (Dockets): JetBrains Mono Medium/14px/normal tracking

## Animations

Motion should be purposeful and subtle - guiding attention without demanding it. Use physics-based easing for natural feel, respecting reduced-motion preferences throughout.

- **Scroll-triggered reveals**: Section content fades up with slight Y-translation (20px) on scroll intersection, stagger children by 50ms
- **Nav anchor jumps**: Smooth scroll with easeInOutCubic over 600ms
- **Case card interactions**: Subtle lift on hover (translateY -4px, shadow increase) with 200ms spring
- **Modal/drawer entry**: Scale from 0.96 + fade in over 250ms, backdrop blur in parallel
- **Button interactions**: Scale 0.98 on press, 150ms, color shift on hover 200ms
- **Logo reveal**: Optional stroke-dash animation on page load, 1200ms with easeOut
- **Investor mode toggle**: Section height collapse with 400ms easeInOutQuart, opacity fade
- **Admin live preview**: Color changes cross-fade 300ms, layout shifts with gentle spring

## Component Selection

**Components**:
- **Button**: Primary CTAs use solid Electric Blue with hover lift, secondary uses outline with Cyan accent
- **Card**: Project and Case cards with subtle border, hover elevation, and rounded-lg corners
- **Dialog**: Case detail modals use full-screen on mobile, centered max-w-4xl on desktop
- **Drawer**: Mobile nav hamburger and admin sidebar use Vaul drawer component
- **Input/Textarea**: Admin forms use clean inputs with floating labels, focus ring in Cyan
- **Select**: Dropdown menus for case status, visibility, ordering
- **Switch**: Investor mode toggle, section enable/disable, feature flags
- **Tabs**: Admin dashboard sections (Content, Projects, Court, Media, etc.)
- **Badge**: Case status indicators (Active, Settled, Pending) with color coding
- **Separator**: Subtle dividers between sections using thin Slate Blue lines
- **Sheet**: Side panel for admin quick edits without leaving context
- **Scroll Area**: PDF viewer page thumbnails, case document lists
- **Tooltip**: Contextual help for admin controls
- **Sonner Toast**: Success/error feedback for admin actions

**Customizations**:
- **PDF Viewer**: Custom component with page thumbnails, zoom controls, navigation
- **Logo Builder**: Custom SVG generator with monogram text and export functionality
- **Color Picker**: Custom theme editor with live preview and palette management
- **Link Checker**: Custom admin utility scanning external links for 404s
- **Audit Timeline**: Custom chronological event list with filtering

**States**:
- Buttons: default → hover (lift + brightness) → active (scale down) → disabled (opacity 0.5)
- Inputs: default → focus (cyan ring) → error (red border) → success (green border) → disabled
- Cards: default → hover (lift + shadow) → active/selected (border accent)
- Modals: closed → opening (scale up + fade) → open → closing (reverse)

**Icon Selection**:
- Navigation: House, FolderOpen, Scales, Newspaper, PaperPlane
- Actions: Plus, Pencil, Trash, Eye, EyeSlash, Copy, Download, Share
- Status: CheckCircle, Clock, XCircle, Warning, Info
- Controls: MagnifyingGlass, ArrowUp, ArrowDown, CaretDown, X
- Media: FilePdf, Upload, Image, Link

**Spacing**:
- Section padding: py-24 (96px) on desktop, py-16 (64px) on mobile
- Card gaps: gap-6 (24px) for grids
- Element padding: p-6 (24px) for cards, p-4 (16px) for compact elements
- Text margins: mb-4 (16px) between paragraphs, mb-8 (32px) between sections

**Mobile**:
- Navigation collapses to hamburger at <768px
- Case grid: 1 column on mobile, 2 at md, 3 at lg
- Section padding reduces from py-24 to py-16
- Modal/dialog becomes full-screen sheet on mobile
- Admin sidebar converts to bottom tabs or drawer
- Font sizes scale down 10-15% on mobile viewports
