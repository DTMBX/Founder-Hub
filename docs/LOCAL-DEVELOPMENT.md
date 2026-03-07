# Local Development

> How to install, run, and work on this repo locally.

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 20+ | `node -v` |
| npm | 9+ (bundled with Node 20) | `npm -v` |
| git | any | `git --version` |

Use the `.nvmrc` file if you have nvm:

```bash
nvm use
```

## Install

```bash
git clone https://github.com/DTMBX/Founder-Hub.git
cd Founder-Hub
npm install
```

Verify prerequisites pass:

```bash
npm run verify
```

## Environment

Copy the example env file and edit as needed:

```bash
cp .env.example .env
```

The app runs without a `.env` file using defaults from `src/config/site.config.ts`.
Supabase credentials are only required for production auth — local dev uses
localStorage fallback automatically.

Key variables:

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SITE_NAME` | Business name shown in UI | No (default in config) |
| `VITE_SUPABASE_URL` | Supabase project URL | Production only |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | Production only |
| `VITE_THEME_PRESET` | Color theme (`default`, `law-firm`, etc.) | No |
| `VITE_ENABLE_ADMIN` | Show admin panel at `#admin` | No (default `true`) |

See `.env.example` for the full list with documentation.

## Run

```bash
npm run dev
```

Opens at **http://localhost:5175** (configured in `vite.config.ts`).

### Routes

| URL | View |
|-----|------|
| `http://localhost:5175` | Public site |
| `http://localhost:5175/#admin` | Admin dashboard |
| `http://localhost:5175/#offerings` | Offerings page |
| `http://localhost:5175/#case/{id}` | Case jacket viewer |

## Build

```bash
npm run build
```

Output goes to `dist/`. Preview the production build:

```bash
npm run preview
```

## Test

```bash
npm run test          # single run
npm run test:watch    # watch mode
```

## Lint

```bash
npm run lint
```

## Full Check

Runs verify + lint + test in sequence:

```bash
npm run check
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 5175) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Serve production build locally |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run lint` | Run ESLint |
| `npm run verify` | Check Node version, npm, git, lockfile |
| `npm run check` | verify + lint + test |
| `npm run generate:images` | Generate OG images |
| `npm run scan:secrets` | Scan for leaked secrets |
| `npm run site:generate` | Generate static site |
| `npm run site:list` | List managed sites |

## Windows + VS Code Notes

- The `kill` script in package.json uses `fuser` (Linux only). On Windows,
  close the terminal or use `Ctrl+C` to stop the dev server.
- Use PowerShell or Git Bash as your VS Code terminal.
- If `$env:GIT_DIR` is set in your PowerShell profile, clear it before running
  git commands: `$env:GIT_DIR = $null`
- The `.nvmrc` file works with nvm-windows: `nvm use 20`

## Project Structure

```text
src/
  main.tsx              ← App entry point (React root)
  main.css              ← Tailwind v4 config + color tokens (source of truth)
  index.css             ← Base styles, fonts, utility classes
  App.tsx               ← Hash-based router
  styles/theme.css      ← Radix design system scales
  components/
    ui/                 ← shadcn/ui primitives (50+)
    admin/              ← Admin dashboard modules (lazy-loaded)
    sections/           ← Public site sections (Hero, About, Court, etc.)
    forms/              ← Form components (ContactForm)
  config/
    site.config.ts      ← Site identity, SEO, theme, Stripe config
    content.config.ts   ← Editable text content (hero, about, contact, etc.)
    theme-provider.tsx  ← Theme presets and provider
  hooks/                ← Custom React hooks
  lib/                  ← Utilities, auth, storage, crypto, etc.
```

See [docs/FRONTEND-ARCHITECTURE.md](FRONTEND-ARCHITECTURE.md) for CSS architecture details.
