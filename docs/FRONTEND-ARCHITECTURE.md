# Frontend Architecture

> Single source of truth for how CSS, tokens, and styling work in this repo.

## CSS File Responsibilities

The app loads three CSS files in this order (set in `src/main.tsx`):

```text
src/main.css        ← Tailwind v4 entry + light/dark color tokens + @theme inline
src/styles/theme.css ← Radix color scales + spacing scale + radius scale
src/index.css        ← Font wiring, base typography, utility classes, motion/a11y
```

### src/main.css — Token Source of Truth

This is the **canonical file** for all color tokens. It contains:

- `@import 'tailwindcss'` — the single Tailwind v4 entry point
- `@import './styles/theme.css'` — Radix design system scales
- `@import './index.css'` — base styles and utility classes
- `:root { }` — light-mode oklch color tokens (shadcn/ui convention)
- `.dark { }` — dark-mode oklch color tokens
- `@theme inline { }` — Tailwind v4 theme registration (maps `--color-*` to CSS vars)
- `@layer base { }` — border/outline defaults, body bg/fg

**Rule:** All color tokens (`--background`, `--primary`, `--accent`, etc.) are
defined here and nowhere else.

### src/styles/theme.css — Radix Design System

This file provides the **structured design scale** layer:

- Radix color imports (slate, blue, violet, gray — light + dark + alpha)
- `--size-scale` multiplier for proportional spacing
- `--radius-factor` multiplier for proportional border radii
- Neutral/accent/accent-secondary color mappings (Radix → CSS vars)
- Foreground, background, and focus-ring semantic tokens
- System font stacks (sans-serif, serif, monospace)
- Dark-theme background overrides

**Rule:** This file owns the **design scale system** (spacing, radii, Radix
color mappings). It does not define oklch color tokens — those live in main.css.

### src/index.css — Base Styles and Utilities

This file provides **non-token CSS** that the app needs:

- `@reference "tailwindcss"` — required for `@apply` usage without re-importing TW
- Font CSS variables (`--font-sans`, `--font-serif`, `--font-mono`)
- `--spacing` base unit
- `.extra-contrast` class (high-contrast mode overrides)
- Base typography rules (heading font, code font)
- `body::before` decorative grid overlay
- `@supports (backdrop-filter)` webkit prefix fallbacks
- `@media (prefers-reduced-motion)` animation kill-switch
- `.section-separator` gradient line
- `.animate-subtle-wave` keyframes
- SVG rendering optimization

**Rule:** This file must **not** define color tokens, `@theme` blocks, or
Tailwind imports. It uses `@reference "tailwindcss"` to access `@apply`.

## Token Cascade

```
main.css :root        → light mode colors (oklch)
main.css .dark        → dark mode colors (oklch)
main.css @theme inline → registers tokens for Tailwind utility classes
theme.css :root       → spacing scale, radius scale, Radix color mappings
index.css :root       → font families, spacing base unit
index.css .extra-contrast → high-contrast overrides
```

## Fonts

Four Google Fonts are loaded in `index.html`:

| Font | Role | CSS Variable | Used By |
|------|------|-------------|---------|
| Inter | Body text | `--font-sans` | Default for all text |
| Space Grotesk | Headings | (hardcoded in base rule) | `h1`–`h6` |
| JetBrains Mono | Code | `--font-mono` | `code`, `pre`, `.font-mono` |
| Lora | Serif accent | `--font-serif` | Available via `font-serif` utility |

## Component Styling

- **shadcn/ui primitives** (`src/components/ui/`) use Tailwind utilities + CVA variants
- **Glass components** (`glass-button.tsx`, `glass-card.tsx`) use backdrop-filter
- **Section components** use Tailwind responsive classes (`sm:`, `md:`, `lg:`)
- **Component-specific CSS:** None. All styling is utility-based via Tailwind.
  If a utility class is truly needed, add it to `index.css` at the bottom.

## Color System

- **Light mode:** White background, near-black text, neutral grays (shadcn default)
- **Dark mode:** Earth-tone palette — stone backgrounds, emerald primary, amethyst accent
- **Extra contrast:** Toggle via Settings → applies `.extra-contrast` to `<html>`
- **Radix scales:** 12-step scales (1–12) for neutral, accent, accent-secondary

## Breakpoints

| Name | Width | Use |
|------|-------|-----|
| `sm` | 640px | Landscape phones, small tablets |
| `md` | 768px | Tablets — mobile sidebar becomes sheet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |
| `coarse` | `(pointer: coarse)` | Touch devices |
| `fine` | `(pointer: fine)` | Mouse/trackpad |
| `pwa` | `(display-mode: standalone)` | PWA standalone |

## Dark Mode

Controlled via `@custom-variant dark (&:is(.dark *))` in main.css.
The `.dark` class is toggled on the root element. Components use `dark:` prefix.
Tailwind config: `darkMode: ["selector", '[data-appearance="dark"]']`.

## Adding New Styles

1. **New color token?** → Add to `:root` and `.dark` in `src/main.css`, register in `@theme inline`
2. **New utility class?** → Add to bottom of `src/index.css`
3. **New Radix color scale?** → Import in `src/styles/theme.css`, map to semantic vars
4. **New animation?** → Add `@keyframes` to `src/index.css`, respect `prefers-reduced-motion`
5. **Component styling?** → Use Tailwind utilities in the component. No separate CSS files.
