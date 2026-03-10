# Content Guide — Founder-Hub

Quick reference for editing any content on devon-tyler.com.

## Quick Start

```
npm run dev          # Start dev server (localhost:5173)
                     # Admin auto-logs in on localhost
```

Navigate to `http://localhost:5173/#admin` — you're automatically authenticated.
Or use the **wrench icon** (bottom-right) on the public site to jump directly to any admin section.

---

## Where Content Lives

| Content              | JSON File                    | Admin Panel (/#admin) | Config File (rebuild required)         |
|----------------------|------------------------------|-----------------------|----------------------------------------|
| **Services/Offerings** | `public/data/offerings.json` | Offerings             | `src/marketing/offers.config.ts`       |
| **Projects**         | `public/data/projects.json`  | Projects              | `src/config/projects.ts`               |
| **About / Mission**  | `public/data/about.json`     | About / Updates       | `src/config/content.config.ts`         |
| **Court Cases**      | `public/data/court-cases.json` | Court Cases         | —                                      |
| **Press / Proof**    | `public/data/links.json`     | Links                 | —                                      |
| **Contact**          | `public/data/contact-links.json` | Profile & Emails  | `src/config/content.config.ts`         |
| **Investor**         | `public/data/investor.json`  | Investor Section      | —                                      |
| **Section Order**    | `public/data/sections.json`  | Content               | `src/components/landing/landing.config.ts` |
| **Site Settings**    | `public/data/settings.json`  | Site Settings         | `src/config/site.config.ts`            |
| **Hero**             | `public/data/settings.json`  | Hero Media            | `src/config/content.config.ts`         |
| **FAQ**              | —                            | —                     | `src/marketing/faq.config.ts`          |
| **Honor Flag Bar**   | `public/data/honor-flag-bar*.json` | Honor Flag Bar  | —                                      |

## Two Ways to Edit

### 1. Admin Panel (Recommended)
1. Run `npm run dev`
2. Go to `http://localhost:5173/#admin` (auto-logged in)
3. Use the sidebar to navigate to the section you want
4. Edit, save — changes are live instantly on localhost
5. Click **Export Data** to download updated JSON files
6. Copy exported files to `public/data/` and commit

### 2. Direct JSON Edit
Edit files in `public/data/` directly. The dev server hot-reloads them.

```
public/data/
├── about.json              # Mission, focus, values, updates
├── contact-links.json      # Department emails
├── court-cases.json        # Legal cases
├── investor.json           # Investment data
├── links.json              # Press/proof links
├── offerings.json          # Services & pricing
├── projects.json           # Portfolio projects
├── sections.json           # Section visibility & order
├── settings.json           # Site name, domain, hero config
└── ... (55 files total)
```

---

## Offerings / Services Cards

File: `public/data/offerings.json`

Each offering has:
```jsonc
{
  "id": "unique-id",
  "title": "Service Name",
  "slug": "url-slug",
  "summary": "One-line description",
  "description": "Full description",
  "category": "service",        // digital | service | whitelabel | subscription | barter
  "pricingType": "paid",        // free | paid | donation | contact | trade
  "priceTiers": [
    {
      "id": "tier-id",
      "name": "Starter",
      "price": 99000,           // Price in CENTS ($990.00)
      "currency": "USD",
      "description": "Tier description",
      "features": ["Feature 1", "Feature 2"],
      // Optional Stripe fields:
      "stripeProductId": "prod_xxx",
      "stripePriceId": "price_xxx",
      "stripePaymentLink": "https://buy.stripe.com/xxx",
      // For subscriptions:
      "isRecurring": true,
      "recurringInterval": "month"  // month | year
    }
  ],
  "tags": ["tag1", "tag2"],
  "icon": "Code",              // Phosphor icon name
  "featured": true,
  "order": 1,
  "visibility": "public",      // public | unlisted | private
  "turnaround": "5-14 days",
  "contactCTA": "Button text"
}
```

### Add a New Service
**Admin:** Offerings → Add Offering → Fill form → Save
**JSON:** Add a new object to the array in `offerings.json`

### Edit Pricing
**Admin:** Offerings → click pencil icon → edit price tiers
**JSON:** Edit `priceTiers[].price` (value is in cents, so $99 = `9900`)

### Delete a Service
**Admin:** Offerings → click trash icon
**JSON:** Remove the object from the array

---

## Projects

File: `public/data/projects.json`

```jsonc
{
  "id": "project-id",
  "title": "Project Name",
  "summary": "Brief summary",
  "description": "Full description",
  "tags": ["react", "typescript"],
  "techStack": ["React", "Vite"],
  "links": {
    "live": "https://...",
    "source": "https://github.com/..."
  },
  "status": "active",          // active | paused | archived
  "featured": true,
  "order": 1
}
```

---

## Sections (Visibility & Order)

File: `public/data/sections.json`

```jsonc
[
  {
    "type": "about",
    "title": "About",
    "enabled": true,
    "order": 1,
    "investorRelevant": true
  }
]
```

Available section types: `hero`, `about`, `projects`, `offerings`, `contact`, `court`, `proof`, `investor`

---

## Architecture Summary

```
User visits devon-tyler.com
         │
         ▼
    index.html → main.tsx → App.tsx
         │
    ┌────┴────┐
    │ Public  │ /#admin
    │ Site    │ (auto-login on localhost)
    │         │         │
    ▼         ▼         ▼
  PublicSite  AdminDashboard
    │              │
    ▼              ▼
  LandingSections  40+ Manager panels
    │              (edit → localStorage → export JSON)
    ▼
  Section components read from useKV()
    │
    ▼
  useKV reads: localStorage (dev) OR /data/*.json (prod)
```

## Dev Toolbar

On localhost, a **wrench icon** appears at the bottom-right of the public site.
Click it to see quick links to every admin section + direct JSON file references.
