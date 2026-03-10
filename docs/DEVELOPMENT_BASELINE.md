# Development Baseline

This document describes the minimum prerequisites and verification process for the Founder-Hub codebase.

## Prerequisites

| Requirement | Minimum Version | Check Command |
|-------------|-----------------|---------------|
| Node.js     | 20+             | `node -v`     |
| npm         | (bundled)       | `npm -v`      |
| git         | any             | `git --version` |

## Quick Start

```bash
# 1. Verify your environment meets requirements
npm run verify

# 2. Install dependencies
npm install

# 3. Run all checks (verify + lint + test)
npm run check
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run verify` | Check Node version, npm, git, and lockfile integrity |
| `npm run check` | Run verify + lint + test in sequence |
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

## Node Version Management

This project includes an `.nvmrc` file set to Node 20.

If you use nvm:
```bash
nvm use
```

## Package Manager

This project uses **npm only**. Do not use yarn or pnpm.

The `package-lock.json` file is tracked in git and must remain consistent. The verify script will fail if:
- `package-lock.json` is missing
- `yarn.lock` or `pnpm-lock.yaml` are present

## CI Integration

The GitHub Actions workflow runs these checks in order:
1. `npm run verify` — Prerequisite validation
2. `npm run test` — Unit and integration tests
3. `npm run build` — Production build

All checks must pass before deployment proceeds.

## Troubleshooting

### Node version mismatch
```
✗ Node.js vX.X.X is below minimum v20
```
Install Node 20+ via [nodejs.org](https://nodejs.org) or nvm:
```bash
nvm install 20
nvm use 20
```

### Missing lockfile
```
✗ package-lock.json missing
```
Run `npm install` to regenerate the lockfile.

### Conflicting lockfiles
```
⚠ yarn.lock found — this project uses npm
```
Delete the conflicting lockfile and use npm exclusively.
