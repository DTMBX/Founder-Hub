# Beginner's Guide to Editing Your Site

This guide helps you make common edits without deep coding knowledge.

---

## Quick Reference: What File Controls What

| What you want to edit | File location |
|----------------------|---------------|
| **Site name, tagline, contact info** | `src/config/site.config.ts` |
| **Homepage hero section** | `src/components/sections/HeroSection.tsx` |
| **About section** | `src/components/sections/AboutSection.tsx` |
| **Contact section emails** | `src/components/sections/ContactSection.tsx` |
| **Services/Offerings** | Admin panel at `/admin` → Offerings Manager |
| **Projects** | Admin panel at `/admin` → Projects Manager |
| **Navigation links** | `src/components/Navigation.tsx` |
| **Footer** | Look for footer in `src/components/` |
| **Marketing offers (pricing)** | `src/marketing/offers.config.ts` |

---

## How to Make Text Edits

### Step 1: Find the text

1. Open VS Code
2. Press `Ctrl+Shift+F` to search all files
3. Type the exact text you want to change
4. Click on the result to open that file

### Step 2: Edit the text

Look for text inside quotes like:
```tsx
<h1>This is a heading</h1>
<p>This is a paragraph</p>
```

Just change the text between the tags.

### Step 3: Save and preview

1. Press `Ctrl+S` to save
2. Your browser should auto-refresh (if dev server is running)
3. If not, run `npm run dev` in terminal

---

## Common Edits (Copy-Paste Examples)

### Change Contact Emails

Open `src/components/sections/ContactSection.tsx`

Find these lines near the top:
```tsx
const PRIMARY_EMAIL = 'hello@xtx396.com'

const DEFAULT_EMAILS: ProfessionalEmail[] = [
  { label: 'Legal Services', email: 'legal@xtx396.com', ...
```

Change the email addresses to your own.

---

### Change Hero Section Text

Open `src/components/sections/HeroSection.tsx`

Look for text like:
```tsx
<h1>Your Main Headline</h1>
<p>Your tagline or description</p>
```

---

### Change Site Name & Info

Open `src/config/site.config.ts`

Edit these values:
```tsx
name: 'Your Site Name',
tagline: 'Your Tagline',
```

---

## Using the Admin Panel

Many things can be edited without touching code:

1. Start dev server: `npm run dev`
2. Go to `http://localhost:5175/admin`
3. Use these managers:
   - **Offerings Manager** → Edit services/products
   - **Projects Manager** → Edit portfolio items
   - **Content Manager** → Edit page content
   - **Settings Manager** → Site settings

---

## File Types Explained

| Extension | What it is | How to edit |
|-----------|-----------|-------------|
| `.tsx` | React component (page/section) | Edit text between `<tags>` |
| `.ts` | TypeScript config/logic | Edit values in quotes |
| `.css` | Styles | Edit colors, sizes, spacing |
| `.md` | Markdown docs | Plain text with formatting |
| `.json` | Data/config | Edit values in quotes |

---

## Common Patterns

### Text in JSX (React)
```tsx
// This is a comment
<h1 className="text-4xl">Your Heading</h1>
<p className="text-muted">Your paragraph text here</p>
<a href="mailto:you@email.com">Contact Me</a>
```

### Config Objects
```tsx
const config = {
  name: 'Change this text',
  email: 'your@email.com',
  enabled: true,  // true or false
  count: 5,       // numbers don't need quotes
}
```

### Arrays (Lists)
```tsx
const items = [
  'First item',
  'Second item',
  'Third item',
]
```

---

## Tips

1. **Always save** (`Ctrl+S`) before checking your changes
2. **Don't delete** brackets `{}`, parentheses `()`, or quotes `''`
3. **Match quotes** - if you open with `'`, close with `'`
4. **Check the browser console** (F12) if something breaks
5. **Git commit often** so you can undo mistakes

---

## If You Break Something

### Option 1: Undo in VS Code
Press `Ctrl+Z` multiple times to undo recent changes

### Option 2: Discard file changes
```bash
git checkout -- path/to/file.tsx
```

### Option 3: Reset to last commit
```bash
git checkout .
```

---

## Running the Site Locally

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Need Help?

- **VS Code shortcuts**: `Ctrl+P` to quick-open files
- **Search in file**: `Ctrl+F`
- **Search all files**: `Ctrl+Shift+F`
- **Go to line**: `Ctrl+G`
- **Undo**: `Ctrl+Z`
- **Save**: `Ctrl+S`
