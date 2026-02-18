# Admin Minimal Navigation Spec

> Chain A1 Deliverable — Admin Panel Hardening Audit  
> Generated: 2025-01-XX  
> Status: SPEC COMPLETE — Awaiting Implementation

---

## Design Philosophy

The admin panel navigation should reflect the principle: **access granted, not pressure applied**.

Two operational modes are defined:

1. **Founder Mode** — Mobile-first, minimal, daily ops only
2. **Ops Mode** — Full navigation, role-gated, desktop experience

---

## Founder Mode (Mobile-First Nav)

### Purpose

Founder Mode surfaces only P0 (daily) actions. Designed for:
- Mobile devices (primary)
- Quick daily checks
- Reduced cognitive load
- Minimal attack surface

### Navigation Structure (6 items)

```
┌─────────────────────────────────┐
│  [Logo]     FOUNDER MODE    [≡] │
├─────────────────────────────────┤
│                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │ 📝  │  │ 📥  │  │ 👥  │     │
│  │Content│ │Inbox│  │Leads│     │
│  └─────┘  └─────┘  └─────┘     │
│                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐     │
│  │ 🌐  │  │ 📁  │  │ 📤  │     │
│  │Sites│  │Projects│Upload│     │
│  └─────┘  └─────┘  └─────┘     │
│                                 │
├─────────────────────────────────┤
│  [View Site]      [Full Admin]  │
└─────────────────────────────────┘
```

### Route Mapping

| Position | Label | Route | Component | Rationale |
|----------|-------|-------|-----------|-----------|
| 1 | Content | `#admin/content` | ContentManager | Daily content updates |
| 2 | Inbox | `#admin/inbox` | AdminInbox | Daily communications |
| 3 | Leads | `#admin/leads` | LeadsManager | Daily lead management |
| 4 | Sites | `#admin/sites` | SitesManager | Site status checks |
| 5 | Projects | `#admin/projects` | ProjectsManager | Project tracking |
| 6 | Upload | `#admin/upload` | UploadQueueManager | Document intake |

### Footer Actions (2 items)

| Action | Behavior |
|--------|----------|
| View Site | Exit admin, view public site |
| Full Admin | Elevate to Ops Mode (requires confirmation) |

### Restrictions in Founder Mode

- No publish action (requires Ops Mode)
- No export action (requires Ops Mode)
- No settings access (requires Ops Mode)
- No security configuration (requires Ops Mode)
- No destructive actions available

---

## Ops Mode (Full Admin Nav)

### Purpose

Ops Mode provides full administrative capabilities. Designed for:
- Desktop experience (primary)
- Weekly maintenance
- Configuration changes
- Role-gated access

### Navigation Structure (7 categories, 29 routes)

```
┌──────────────────────────────────────────────────┐
│  [Logo]           OPS MODE              [User ▾] │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│ ▼ XTX396   │  [Main Content Area]               │
│   Content  │                                     │
│   About    │                                     │
│   Links    │                                     │
│   Profile  │                                     │
│   Hero     │                                     │
│   Modules  │                                     │
│   Honor    │                                     │
│            │                                     │
│ ▼ Trade    │                                     │
│   Investor │                                     │
│   Offerings│                                     │
│            │                                     │
│ ▼ Platform │                                     │
│   Evident  │                                     │
│   Sites    │                                     │
│            │                                     │
│ ▼ Framework│                                     │
│   Clients  │                                     │
│   Law Firm │                                     │
│   SMB      │                                     │
│   Agency   │                                     │
│            │                                     │
│ ▼ Cases    │                                     │
│   Projects │                                     │
│   Court    │                                     │
│   Docs     │                                     │
│   Jackets  │                                     │
│   Filings  │                                     │
│   Templates│                                     │
│            │                                     │
│ ▼ Assets   │                                     │
│   Inbox    │                                     │
│   Upload   │                                     │
│   Staging  │                                     │
│   Media    │                                     │
│   Policy   │                                     │
│            │                                     │
│ ▼ System   │                                     │
│   Theme    │                                     │
│   Settings │                                     │
│   Security │                                     │
│   Audit    │                                     │
│   Leads    │                                     │
│            │                                     │
├────────────┴─────────────────────────────────────┤
│ [Publish ⚠]  [Export]  [Site]  [Founder] [Exit] │
└──────────────────────────────────────────────────┘
```

### Category Breakdown with Role Gates

#### Category: XTX396 Site
| Route | Min Role | Notes |
|-------|----------|-------|
| Content | editor | Primary content |
| About | editor | Bio/about page |
| Links | editor | External links |
| Profile | editor | Profile settings |
| Hero Media | admin | Hero section |
| Visual Modules | admin | Module config |
| Honor Flag Bar | admin | Flag bar config |

#### Category: Investor & Trade
| Route | Min Role | Notes |
|-------|----------|-------|
| Investor | admin | Investor relations |
| Offerings | admin | Investment content |

#### Category: Evident Platform
| Route | Min Role | Notes |
|-------|----------|-------|
| Evident | editor | Platform content |
| Sites | admin | Multi-site config |

#### Category: Frameworks
| Route | Min Role | Notes |
|-------|----------|-------|
| Client Sites | admin | Client site config |
| Law Firm | admin | Law firm template |
| SMB Template | admin | SMB template |
| Agency | admin | Agency framework |

#### Category: Case Management
| Route | Min Role | Notes |
|-------|----------|-------|
| Projects | editor | Project tracking |
| Court | admin | Court records |
| Documents | editor | Document library |
| Case Jackets | admin | Case organization |
| Filing Types | superadmin | System config |
| Templates | admin | Doc templates |

#### Category: Assets
| Route | Min Role | Notes |
|-------|----------|-------|
| Inbox | editor | Incoming items |
| Upload | editor | Upload queue |
| Staging | admin | Staging review |
| Media | editor | Media library |
| Asset Policy | superadmin | Usage policies |

#### Category: System
| Route | Min Role | Notes |
|-------|----------|-------|
| Theme | admin | Visual theming |
| Settings | superadmin | System settings |
| Security | superadmin | Security config |
| Audit | admin | Audit viewing |
| Leads | editor | Lead management |

### Footer Actions with Confirmation Gates

| Action | Min Role | Confirmation Required |
|--------|----------|----------------------|
| Publish to Live | admin | Typed confirmation: "PUBLISH" |
| Export Data | superadmin | Typed confirmation: "EXPORT" |
| View Site | all | None |
| Founder Mode | all | None |
| Logout | all | None |

---

## Role Hierarchy

### Proposed Roles (3 tiers)

```
superadmin
    └── admin
          └── editor
```

| Role | Capabilities |
|------|--------------|
| **superadmin** | Full access, system config, security, exports |
| **admin** | Content + config, no security/system changes |
| **editor** | Content only, no destructive actions |

### Default Assignment

- First authenticated user: `superadmin`
- Invited users: `editor` (can be promoted)

---

## Mode Switching

### Founder → Ops Mode

1. User taps "Full Admin" button
2. System displays confirmation:
   > "Switch to Ops Mode? This grants access to all admin functions."
3. User confirms
4. If 2FA not verified this session: prompt 2FA
5. Navigate to Ops Mode dashboard

### Ops → Founder Mode

1. User clicks "Founder Mode" button
2. No confirmation required (restricting access)
3. Navigate to Founder Mode dashboard

---

## Responsive Behavior

### Mobile (< 768px)

- **Founder Mode**: Default, grid nav
- **Ops Mode**: Hamburger menu, collapsible categories

### Tablet (768px – 1024px)

- **Founder Mode**: Grid nav
- **Ops Mode**: Collapsible sidebar

### Desktop (> 1024px)

- **Founder Mode**: Grid nav (optional)
- **Ops Mode**: Persistent sidebar

---

## Visual Differentiation

### Founder Mode Indicators

- Blue accent color
- "FOUNDER" badge in header
- Simplified chrome
- No warning indicators

### Ops Mode Indicators

- Amber/orange accent color
- "OPS" badge in header
- Full chrome with categories
- Warning indicators on critical actions

---

## Implementation Notes

### State Management

```typescript
type AdminMode = 'founder' | 'ops'

interface AdminState {
  mode: AdminMode
  role: 'editor' | 'admin' | 'superadmin'
  lastModeSwitch: string // ISO timestamp
  opsConfirmedAt?: string // 2FA verification timestamp
}
```

### Route Guards

```typescript
const routeGuards: Record<string, Role[]> = {
  'settings': ['superadmin'],
  'security': ['superadmin'],
  'asset-policy': ['superadmin'],
  'filing-types': ['superadmin'],
  // ... etc
}
```

### Mode Persistence

- Mode preference stored in localStorage
- Session reset returns to Founder Mode
- Ops Mode requires re-confirmation after 24h inactivity

---

## Acceptance Criteria

### Founder Mode

- [ ] Only 6 P0 routes accessible
- [ ] No destructive actions available
- [ ] No publish/export buttons visible
- [ ] Mode switch requires confirmation
- [ ] Mobile-first grid layout

### Ops Mode

- [ ] All 29 routes accessible (role-permitting)
- [ ] Role gates enforced per route
- [ ] Publish requires typed confirmation
- [ ] Export requires typed confirmation + audit log
- [ ] Side navigation with collapsible categories
- [ ] Visual distinction from Founder Mode

### Mode Switching

- [ ] Founder → Ops requires confirmation
- [ ] Founder → Ops may require 2FA verification
- [ ] Ops → Founder requires no confirmation
- [ ] Mode persists across page reloads
- [ ] Mode resets to Founder after 24h Ops inactivity

---

## Non-Negotiables

Per Chain A1 directive, the following routes **must remain accessible**:

| Route | Reason |
|-------|--------|
| Sites | Core revenue flow |
| Leads | Core revenue flow |
| Projects | Core ops flow |
| Deployments | Core ops flow |
| Audit | Compliance requirement |

These routes appear in **both** Founder Mode (simplified) and Ops Mode (full).

---

*Document generated as part of Chain A1: Admin Panel Hardening Audit*
