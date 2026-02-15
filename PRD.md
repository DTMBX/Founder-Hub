# xTx396 Hub PRD — Trinity Layout Edition

A premium one-page personal landing site for Devon Tyler Barber (xTx396) with **Trinity Layout** — an intelligent audience-triage navigation system that instantly routes three distinct audiences (Investors, Lawyers, Friends/Supporters) into tailored content pathways while preserving a single, elegant landing page experience.

**Latest Update**: Fully implemented **Asset Management System** with intelligent asset scanner, audience-based usage policies, and visual module controls. Features include: automated asset discovery and categorization (Flags, Logos, Maps, Icons, Backgrounds), metadata tagging with theme suitability and usage intent, smart placement suggestions with confidence scoring, usage policy manager controlling which assets appear in Investor/Legal/Friends pathways, hero accent integration with opacity and blend mode controls, Heritage Flags gallery module (optional, Friends-mode by default), EVIDENT® brand mark management with monochrome variants, USA Map Spotlight with optional animations (outline draw, pulse, gradient sweep) respecting reduced-motion preferences, reusable asset components (FlagBadge, LogoMark, WatermarkBackground, DividerMotif, MapSpotlight), performance guardrails warning on oversized assets, SVG sanitization for security, asset usage reports showing where-used references, and visual restraint defaults ensuring flags/heritage imagery remain subtle accents rather than dominant backgrounds. Hero Video Background system remains active with USA flag video, full-bleed overlay system, glassmorphism CTAs, and comprehensive motion/accessibility controls. Trinity Layout audience triage fully operational with pathway-driven asset rendering rules.

**Experience Qualities**:
1. **Triage-Driven & Intentional** - Within 5 seconds, visitors identify which pathway applies to them and access focused, relevant content without wading through irrelevant sections
2. **Audience-Specific** - Investors see Projects + Roadmap + Traction; Lawyers see Court section with organized documentation; Friends see personal mission + updates + simple contact
3. **Elegant & Reversible** - Switching between pathways is simple with visual mode indicators; "Return to Overview" button allows exploration of full site
4. **Clean & Professional** - Maximum content width ~1000px, generous vertical spacing, dark high-contrast theme with glassmorphism buttons, restrained typography

**Complexity Level**: Complex Application (advanced functionality with audience-driven content routing)
This comprehensive dual-interface application now features Trinity Layout audience triage, sophisticated scroll storytelling, glassmorphism design system, lazy loading strategies, responsive layout flows, intelligent asset management system with automated scanning and audience-based usage policies, visual module controls for heritage flags and map animations, admin dashboard with authentication, role-based access control, advanced content management, batch document processing with optional OCR, metadata extraction pipeline, automated naming rules engine, staging and review workflows, project customization with live preview, case management with timeline support, document type taxonomy (filing types), scriptable batch utilities, chain-of-custody tracking, attorney review notes, contingency checklists, and a polished public-facing site with pathway-driven content filtering, dynamic section rendering, and tasteful asset integration respecting visual restraint principles.

## Essential Features

### Asset Scanner (Admin Tool)
- **Functionality**: Automated discovery and indexing of all uploaded/static assets (SVG, PNG, JPG, WebP, MP4) with categorization by type: Flags, Logos/Marks, Icons, Backgrounds, Maps, Other
- **Purpose**: Provide comprehensive visibility into all visual assets and enable intelligent metadata management without manual file hunting
- **Trigger**: Admin clicks "Scan Assets" in Assets tab or system auto-scans on first admin visit
- **Progression**: Click scan → system discovers assets via glob imports → extracts metadata (dimensions, file size, format) → infers category and tags from filename patterns → displays asset grid with preview cards → admin clicks asset → edit metadata panel opens → save changes
- **Success criteria**: 
  - Scans complete in <5 seconds for typical asset counts (<100 assets)
  - All SVG, PNG, JPG, WebP, MP4 formats detected correctly
  - Categories auto-assigned with 80%+ accuracy
  - Filename-based tagging generates relevant keywords
  - Shows filename, dimensions, format, size for each asset
  - Preserves existing metadata on re-scan (merge strategy)
  - No build breaks from scanning process
  - Dashboard cards show: Total Assets, Used on Landing, Unused Assets, Oversized warnings

### Asset Tagging & Metadata
- **Functionality**: Admin can tag assets with category, theme suitability (dark/light/both), usage intent (hero/accent/watermark/icon/gallery/divider), color treatment (original/monochrome-white/monochrome-muted/accent-tinted), licensing notes, source notes; can set "Primary brand mark" and "Secondary marks"
- **Purpose**: Enable context-aware asset rendering and intelligent placement decisions based on documented metadata
- **Trigger**: Admin selects asset in Asset Scanner, edits metadata in right panel
- **Progression**: Select asset → edit category/theme/intent dropdowns → add licensing and source notes → toggle brand mark flags → save → metadata persists to KV storage
- **Success criteria**: All metadata fields editable, dropdowns populated with correct options, brand mark toggles work, licensing/source notes support freeform text, changes save instantly, metadata preserved across scans

### Smart Usage Rules & Policies
- **Functionality**: "Usage Policy" settings page where admin configures: (a) which flags allowed on public pages, (b) which restricted to personal/private views, (c) whether flag imagery appears in investor/legal/friends pathways; provides audience-specific asset enablement
- **Purpose**: Prevent visual/political overload in investor and legal contexts while allowing richer heritage visuals in friends mode
- **Trigger**: Admin navigates to Usage Policy tab
- **Progression**: View flag asset list → toggle Public/Restricted per flag → enable/disable per audience (Investors/Legal/Friends) → see guidance cards explaining best practices → changes apply immediately to public site rendering
- **Success criteria**: Each flag has Public/Restricted toggle, audience pathway buttons (Investors/Legal/Friends) show enabled state, changes respected in public site asset components, visual defaults favor restraint (most flags off for Investors/Legal), Friends mode allows richer visuals

### Visual Restraint Defaults
- **Functionality**: By default, flag assets used only as subtle accents (small badges, faint watermarks, divider motifs) rather than dominant backgrounds; toggles prevent political/identity visuals from overpowering attorney/investor readability
- **Purpose**: Maintain professional credibility and readability for business audiences while preserving optional heritage expression
- **Trigger**: Public site renders assets according to usage policies
- **Progression**: Asset components check audience mode → apply usage policy rules → render with restrained defaults (low opacity, small size, grayscale treatment where appropriate) → investor/legal pathways show minimal branding
- **Success criteria**: Default flag rendering is subtle (opacity <20% for watermarks, small badge sizes), investor mode shows minimal flag imagery, legal mode most restrained, friends mode can show richer visuals, admin can override per asset

### Hero Accent Asset Integration
- **Functionality**: Admin can select optional "Hero Accent Asset" (small flag corner mark or faint watermark) that sits behind hero text with strong overlay controls (position, opacity 5-50%, blend mode); ensures white text contrast always passes high-contrast requirements
- **Purpose**: Add subtle brand personality to hero without compromising readability
- **Trigger**: Admin enables Hero Accent in Visual Modules tab
- **Progression**: Enable hero accent → select asset from dropdown → choose position (corner-left/corner-right/watermark/full-background) → adjust opacity slider → select blend mode → preview changes → save
- **Success criteria**: Hero accent renders with correct position, opacity adjustable 5-50%, blend modes (normal/multiply/screen/overlay) work, white text remains readable (WCAG AA compliant), mobile rendering stable, disabled by default

### Heritage Flags Gallery Module
- **Functionality**: Optional section module "Heritage Flags" enabled only in Friends/Supporters mode by default; displays clean curated gallery with flag previews, captions, and minimal copy; kept off for Investor/Legal unless admin explicitly enables
- **Purpose**: Provide dedicated space for heritage/patriotic expression without cluttering business-focused pathways
- **Trigger**: Admin enables Flag Gallery in Visual Modules, selects flags to display, configures title/description
- **Progression**: Enable gallery → set title and description → select flags from asset list (checkboxes) → configure enabled audiences → save → gallery renders in public site when audience mode matches
- **Success criteria**: Gallery section appears only when enabled and audience matches, displays selected flags in grid (2 cols mobile, 3 cols desktop), flag cards show preview image and tags, animation on scroll (fade-up stagger), Friends mode default, Investor/Legal hidden unless overridden

### EVIDENT® Brand Integration
- **Functionality**: Dedicated "Brands & Ventures" module can feature EVIDENT® logos and marks; logo usage control includes monochrome/flat variants for dark theme, clear spacing rules, consistent sizing across devices
- **Purpose**: Professional presentation of brand ventures with consistent logo treatment
- **Trigger**: Admin uploads/tags EVIDENT logos in Asset Scanner, uses in content modules
- **Progression**: Upload logo variants (color, dark, light) → tag as Primary/Secondary brand marks → set color treatment per context → use LogoMark component in sections → logo renders with appropriate variant for theme
- **Success criteria**: Logo variants support monochrome-white and monochrome-muted treatments, sizing consistent (sm/md/lg/xl), spacing respected, dark theme shows appropriate variant, components pull from asset metadata

### Asset-Aware Theming
- **Functionality**: For each SVG/logo/flag, store recommended color treatment (original/monochrome-white/monochrome-muted/accent-tinted); admin chooses per context with previews against dark/light backgrounds
- **Purpose**: Ensure assets display appropriately across theme contexts without manual CSS tweaking
- **Trigger**: Admin sets color treatment in asset metadata
- **Progression**: Edit asset → select color treatment dropdown → treatment applies CSS filters (brightness-0 invert for white, grayscale for muted, hue-rotate for tinted) → asset components respect treatment setting
- **Success criteria**: Four color treatments supported, CSS filters correctly applied, previews accurate, treatment persists across renders, dark theme defaults to appropriate treatments

### USA Map Spotlight Widget
- **Functionality**: Toggleable "USA Map Spotlight" widget with subtle animated highlight (gentle outline draw, pulsing dots, or sweeping gradient stroke); used as decorative element behind section header or in About/Friends mode; placement options (hero/about/footer)
- **Purpose**: Add geographic/patriotic decorative element without overwhelming content
- **Trigger**: Admin enables Map Spotlight in Visual Modules
- **Progression**: Enable map → select map asset → choose animation type (outline/pulse/gradient/none) → adjust speed and intensity → select placement → enable/disable reduced motion respect → save → map renders in specified section
- **Success criteria**: Map renders with selected animation, animations short (2-4s), reduced-motion setting pauses animations, placement options work (hero/about/footer), intensity adjustable 10-100%, default disabled

### Animation Controls
- **Functionality**: USA map animation optional, short, respectful of reduced-motion settings; admin controls: animation on/off, type (outline/pulse/gradient), speed (1-10s), intensity (10-100%), placement (hero/about/footer)
- **Purpose**: Provide engaging visual interest while respecting accessibility and performance constraints
- **Trigger**: Admin configures Map Spotlight settings
- **Progression**: Adjust animation controls → preview behavior → save → public site respects reduced-motion preference (auto-pause if detected)
- **Success criteria**: Animation disabled if reduced-motion detected, speed and intensity adjustable, animations GPU-optimized, no jank on scroll, intersection observer triggers animation only when visible

### Performance Guardrails
- **Functionality**: Asset Scanner warns on oversized images (>500KB) and recommends optimized formats; site lazy-loads non-critical imagery; SVGs sanitized to remove scripts/dangerous elements
- **Purpose**: Maintain fast page load and prevent security/performance issues from heavy or malicious assets
- **Trigger**: Asset scan analyzes file sizes, SVG upload triggers sanitization
- **Progression**: Scan detects oversized asset → displays warning badge and suggestion → admin sees "Consider optimizing" message → SVG upload parses content → removes script tags and event handlers → stores sanitized version
- **Success criteria**: Assets >500KB flagged with warnings, suggestions actionable, lazy loading works (intersection observer), SVGs stripped of scripts/onclick/onload attributes, no XSS vulnerabilities from SVG uploads

### Accessibility
- **Functionality**: Decorative assets have aria-hidden behavior; meaningful images have alt text fields in admin; no flashing/rapid animations; all animations respect reduced-motion preference
- **Purpose**: Ensure asset system meets WCAG AA accessibility standards
- **Trigger**: Asset components render with accessibility attributes
- **Progression**: Decorative asset → aria-hidden="true" applied → meaningful asset → alt text from metadata → rapid animation → disabled if reduced-motion detected
- **Success criteria**: All decorative assets aria-hidden, alt text fields available in admin, no animations >3 flashes per second, reduced-motion fully respected, keyboard navigation works

### Asset Component Library
- **Functionality**: Reusable components FlagBadge, LogoMark, WatermarkBackground, DividerMotif, MapSpotlight; each pulls from asset index and respects audience mode rules
- **Purpose**: Provide consistent, policy-aware asset rendering throughout application
- **Trigger**: Developer/admin uses asset components in sections
- **Progression**: Import component → pass asset metadata → component applies sizing, filters, positioning → checks audience mode and usage policy → renders appropriately or hides
- **Success criteria**: All five components implemented, props for size/treatment/position work, audience mode filtering automatic, lazy loading enabled, components work in all sections

### Audience-Mode Asset Rules
- **Functionality**: Investor mode uses minimal branding accents and EVIDENT® marks only where relevant; Legal mode uses most restrained visuals (focus on case jacket clarity); Friends mode can show richer heritage/flag visuals; admin can override per page/module
- **Purpose**: Tailor visual density to audience expectations and context
- **Trigger**: User selects audience pathway or admin sets default mode
- **Progression**: Audience mode set → asset components query usage policy → filter assets based on allowed audiences → render only approved assets for that mode
- **Success criteria**: Investor mode shows <3 flag/heritage assets, Legal mode shows minimal decoration, Friends mode shows full gallery when enabled, overrides work per section, mode badge indicates active filtering

### Asset Usage Report
- **Functionality**: Dashboard card showing "Assets used on public landing," "Assets used in court section," and "Unused assets"; allows one-click to disable any asset from public rendering
- **Purpose**: Provide visibility into asset utilization and enable quick cleanup
- **Trigger**: Asset Scanner generates report on scan completion
- **Progression**: Scan assets → analyze whereUsed references → count usage by context → display report cards → admin clicks unused asset → option to disable or delete
- **Success criteria**: Report accurate, shows used/unused counts, context breakdown (landing/court) correct, one-click disable works, report updates on re-scan

### Auto-Suggestions
- **Functionality**: Asset Scanner suggests placements like "This SVG is ideal as a footer watermark" or "This PNG is too large for inline use" based on size and aspect ratio; suggestions advisory only with confidence scores (high/medium/low)
- **Purpose**: Guide admin toward optimal asset usage without enforcing rigid rules
- **Trigger**: Asset metadata analyzed during scan
- **Progression**: Scan asset → analyze dimensions, aspect ratio, file size → generate suggestions → display in Suggestions tab with confidence badges → admin reviews and acts on suggestions
- **Success criteria**: Suggestions relevant and helpful, confidence scores accurate, placement suggestions match asset characteristics, optimization warnings actionable, suggestions never auto-apply

## Essential Features (Continued)

### Trinity Selector (Audience Triage)
- **Functionality**: Three large, prominent glass buttons in hero section for instant audience routing: Investors | Legal/Court | About/Friends
- **Purpose**: Enable visitors to identify their pathway and access focused, relevant content within 5 seconds
- **Trigger**: Visitor lands on hero section and sees three clear pathway options
- **Progression**: Read positioning → identify relevant pathway → click Trinity button → scroll to focused content section → explore pathway-specific materials → optional "Return to Overview" to see full site
- **Success criteria**: Trinity buttons obvious within first screen, mobile stacked layout, clicking filters visible sections, active pathway badge displays, return to overview works

### Hero Video Background System
- **Functionality**: Full-bleed background video (e.g., USA-flag.mp4) with layered system: Video layer → dark contrast overlay → optional gradient vignette → text/content layer → CTA buttons and Trinity selector
- **Purpose**: Create premium, memorable first impression while maintaining excellent text readability and accessibility for all users including those with motion sensitivity
- **Trigger**: Page load with video autoplay (muted, looped) or poster display based on motion preferences
- **Progression**: Load poster instantly → video buffers in background → autoplay begins (if allowed) → user sees crisp white text over darkened video → optional pause/play control → CTA buttons and Trinity selector remain highly readable throughout
- **Success criteria**: 
  - White text remains readable across entire video loop on all devices
  - Video never blocks initial content display (poster shows immediately)
  - Reduced-motion users see static poster with same text styling
  - Video optimized for web (<2MB, efficient encoding, fast buffering)
  - Overlay intensity configurable (40-70% recommended)
  - Vignette provides additional edge darkening for text safety
  - Admin can configure all aspects without code changes
  - Pause/play button visible and accessible
  - Fallback to poster if video fails to load
  - Mobile: increased overlay strength for smaller screens
  - All animations disabled in reduced-motion mode

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

### Admin Hero Media Controls
- **Functionality**: Comprehensive admin panel for hero section background video configuration with controls for: video URL upload/selection, poster image URL, overlay intensity slider (0-100%), vignette toggle, text alignment (left/center), headline and subhead text editing, primary and secondary CTA button configuration (label + URL), motion mode selection (Full/Reduced/Off), and auto-contrast assist toggle
- **Purpose**: Enable complete control over hero video presentation, readability, and accessibility without touching code while providing clear guidance on best practices
- **Trigger**: Admin navigates to Hero Media section in dashboard
- **Progression**: Enter video URL → set poster image → adjust overlay intensity with live slider → toggle vignette on/off → configure text alignment → edit headline/subhead copy → add optional CTA buttons with labels and URLs → select motion mode → toggle auto-contrast → save settings → preview on public site
- **Success criteria**:
  - All hero media settings accessible in admin dashboard
  - Overlay intensity slider with percentage display (0-100%)
  - Vignette and auto-contrast toggles clearly labeled
  - Text alignment selector (left vs center)
  - CTA button configuration optional (can be left empty)
  - Motion mode dropdown: Full (always play) / Reduced (pause if reduced motion) / Off (never play)
  - Best practices guide displayed with recommendations
  - Warning shown when auto-contrast overrides manual overlay setting
  - Save/Reset buttons functional
  - Changes immediately reflected on public site
  - Mobile-friendly admin interface

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
