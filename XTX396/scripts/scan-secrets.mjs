#!/usr/bin/env node
/**
 * Secret Scanner Script
 * Chain A3 — Pre-commit and CI secret detection
 * 
 * Usage:
 *   node scripts/scan-secrets.mjs              # Scan all staged files
 *   node scripts/scan-secrets.mjs --all        # Scan all tracked files
 *   node scripts/scan-secrets.mjs file1 file2  # Scan specific files
 * 
 * Exit codes:
 *   0 - No secrets detected
 *   1 - Secrets detected (blocks commit)
 */

import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

// ─── Secret Patterns ─────────────────────────────────────────
// Same patterns as redaction.ts, compiled for scanning

const SECRET_PATTERNS = [
  // GitHub tokens
  { regex: /ghp_[a-zA-Z0-9]{36}/g, label: 'GitHub PAT (classic)' },
  { regex: /github_pat_[a-zA-Z0-9_]{22,}/g, label: 'GitHub PAT (fine-grained)' },
  { regex: /gho_[a-zA-Z0-9]{36}/g, label: 'GitHub OAuth Token' },
  { regex: /ghs_[a-zA-Z0-9]{36}/g, label: 'GitHub Server Token' },
  { regex: /ghr_[a-zA-Z0-9]{36}/g, label: 'GitHub Refresh Token' },
  
  // Stripe keys
  { regex: /sk_(test|live)_[a-zA-Z0-9]{24,}/g, label: 'Stripe Secret Key' },
  { regex: /rk_(test|live)_[a-zA-Z0-9]{24,}/g, label: 'Stripe Restricted Key' },
  { regex: /whsec_[a-zA-Z0-9]{24,}/g, label: 'Stripe Webhook Secret' },
  
  // AWS
  { regex: /AKIA[0-9A-Z]{16}/g, label: 'AWS Access Key ID' },
  
  // JWT (full token)
  { regex: /eyJ[a-zA-Z0-9_-]{30,}\.eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{30,}/g, label: 'JWT Token' },
  
  // Generic patterns
  { regex: /api[_-]?key\s*[:=]\s*["']([a-zA-Z0-9_-]{20,})["']/gi, label: 'API Key' },
  { regex: /secret[_-]?key\s*[:=]\s*["']([a-zA-Z0-9_-]{20,})["']/gi, label: 'Secret Key' },
  
  // Private keys
  { regex: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g, label: 'Private Key' },
  
  // Connection strings with passwords
  { regex: /(:\/\/[^:]+):([^@\s]{8,})@/g, label: 'Password in Connection String' },
  
  // Common password patterns in code
  { regex: /password\s*[:=]\s*["']([^"']+)["']/gi, label: 'Hardcoded Password' },
]

// ─── File Exclusions ─────────────────────────────────────────

const EXCLUDED_PATHS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.husky',
  'scripts/scan-secrets.mjs',  // This file
  '.env.example',
  'README.md',
  'CHANGELOG.md',
]

const EXCLUDED_EXTENSIONS = [
  '.lock',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.mp4',
  '.webm',
  '.mov',
]

function shouldScan(filePath) {
  // Skip excluded paths
  for (const excluded of EXCLUDED_PATHS) {
    if (filePath.includes(excluded)) return false
  }
  
  // Skip binary extensions
  for (const ext of EXCLUDED_EXTENSIONS) {
    if (filePath.endsWith(ext)) return false
  }
  
  return true
}

// ─── Scanner ─────────────────────────────────────────────────

function scanFile(filePath) {
  if (!existsSync(filePath)) return []
  if (!shouldScan(filePath)) return []
  
  const findings = []
  
  try {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      
      for (const pattern of SECRET_PATTERNS) {
        // Reset regex
        pattern.regex.lastIndex = 0
        
        let match
        while ((match = pattern.regex.exec(line)) !== null) {
          findings.push({
            file: filePath,
            line: lineIndex + 1,
            column: match.index + 1,
            pattern: pattern.label,
            // Redact the actual secret in output
            snippet: redactMatch(line, match.index, match[0].length),
          })
        }
        
        pattern.regex.lastIndex = 0
      }
    }
  } catch (err) {
    // Skip files that can't be read (binary, etc.)
  }
  
  return findings
}

function redactMatch(line, start, length) {
  const before = line.slice(Math.max(0, start - 10), start)
  const after = line.slice(start + length, start + length + 10)
  return `${before}[SECRET_REDACTED]${after}`
}

// ─── Git Integration ─────────────────────────────────────────

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' })
    return output.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function getAllTrackedFiles() {
  try {
    const output = execSync('git ls-files', { encoding: 'utf-8' })
    return output.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

// ─── Main ────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2)
  
  let filesToScan = []
  
  if (args.includes('--all')) {
    console.log('🔍 Scanning all tracked files for secrets...\n')
    filesToScan = getAllTrackedFiles()
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    console.log('🔍 Scanning specified files for secrets...\n')
    filesToScan = args
  } else {
    console.log('🔍 Scanning staged files for secrets...\n')
    filesToScan = getStagedFiles()
  }
  
  if (filesToScan.length === 0) {
    console.log('✓ No files to scan.\n')
    process.exit(0)
  }
  
  const allFindings = []
  
  for (const file of filesToScan) {
    const findings = scanFile(file)
    allFindings.push(...findings)
  }
  
  if (allFindings.length === 0) {
    console.log(`✓ Scanned ${filesToScan.length} files. No secrets detected.\n`)
    process.exit(0)
  }
  
  // Report findings
  console.log('⚠️  SECRETS DETECTED!\n')
  console.log('The following potential secrets were found:\n')
  
  for (const finding of allFindings) {
    console.log(`  📁 ${finding.file}:${finding.line}:${finding.column}`)
    console.log(`     Pattern: ${finding.pattern}`)
    console.log(`     Context: ${finding.snippet}`)
    console.log('')
  }
  
  console.log(`\n❌ Found ${allFindings.length} potential secret(s) in ${filesToScan.length} file(s).`)
  console.log('   Please remove secrets before committing.\n')
  console.log('   If this is a false positive, consider:')
  console.log('   - Moving the value to an environment variable')
  console.log('   - Using the secret vault for encrypted storage')
  console.log('   - Adding to .gitignore if it\'s a local config file\n')
  
  process.exit(1)
}

main()
