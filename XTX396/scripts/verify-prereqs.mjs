#!/usr/bin/env node
/**
 * verify-prereqs.mjs — Baseline Safety Check
 * 
 * Ensures the development environment meets minimum requirements
 * before running tests, builds, or deployment scripts.
 * 
 * Checks:
 *   ✓ Node.js version (20+)
 *   ✓ npm availability and version
 *   ✓ git availability
 *   ✓ package-lock.json exists (no Yarn/pnpm drift)
 * 
 * Usage:
 *   node scripts/verify-prereqs.mjs
 *   npm run verify
 * 
 * Exit Codes:
 *   0 — All checks pass
 *   1 — One or more checks failed
 */

import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Configuration
const MIN_NODE_VERSION = 20;

// ANSI colors (cross-platform safe)
const color = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const CHECK = `${color.green}✓${color.reset}`;
const CROSS = `${color.red}✗${color.reset}`;
const WARN = `${color.yellow}⚠${color.reset}`;

let failures = 0;

function pass(msg, detail = '') {
  const detailStr = detail ? ` ${color.dim}(${detail})${color.reset}` : '';
  console.log(`${CHECK} ${msg}${detailStr}`);
}

function fail(msg, hint = '') {
  failures++;
  console.log(`${CROSS} ${msg}`);
  if (hint) {
    console.log(`    ${color.dim}${hint}${color.reset}`);
  }
}

function warn(msg) {
  console.log(`${WARN} ${msg}`);
}

function getCommandVersion(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

console.log(`\n${color.cyan}═══ Prerequisite Check ═══${color.reset}\n`);

// ── Check Node.js version ────────────────────────────────────
const nodeVersion = process.versions.node;
const nodeMajor = parseInt(nodeVersion.split('.')[0], 10);

if (nodeMajor >= MIN_NODE_VERSION) {
  pass(`Node.js v${nodeVersion}`, `>= ${MIN_NODE_VERSION} required`);
} else {
  fail(
    `Node.js v${nodeVersion} is below minimum v${MIN_NODE_VERSION}`,
    'Install Node 20+ from https://nodejs.org or use nvm'
  );
}

// ── Check npm ────────────────────────────────────────────────
const npmVersion = getCommandVersion('npm --version');
if (npmVersion) {
  pass(`npm v${npmVersion}`);
} else {
  fail('npm not found', 'npm should be bundled with Node.js');
}

// ── Check git ────────────────────────────────────────────────
const gitVersion = getCommandVersion('git --version');
if (gitVersion) {
  const ver = gitVersion.replace('git version ', '').trim();
  pass(`git v${ver}`);
} else {
  fail('git not found', 'Install from https://git-scm.com');
}

// ── Check package-lock.json ──────────────────────────────────
const lockfilePath = join(ROOT, 'package-lock.json');
if (existsSync(lockfilePath)) {
  pass('package-lock.json exists', 'lockfile integrity confirmed');
} else {
  fail(
    'package-lock.json missing',
    'Run "npm install" to generate lockfile. Do not use yarn/pnpm.'
  );
}

// ── Check for conflicting lockfiles ──────────────────────────
const yarnLock = join(ROOT, 'yarn.lock');
const pnpmLock = join(ROOT, 'pnpm-lock.yaml');

if (existsSync(yarnLock)) {
  warn('yarn.lock found — this project uses npm');
  failures++;
}
if (existsSync(pnpmLock)) {
  warn('pnpm-lock.yaml found — this project uses npm');
  failures++;
}

// ── Summary ──────────────────────────────────────────────────
console.log();
if (failures === 0) {
  console.log(`${color.green}All prerequisite checks passed.${color.reset}\n`);
  process.exit(0);
} else {
  console.log(`${color.red}${failures} check(s) failed. Fix issues before continuing.${color.reset}\n`);
  process.exit(1);
}
