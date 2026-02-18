/**
 * Verify Preview Artifacts
 *
 * Validates that preview artifacts were generated correctly.
 * Used in CI to verify the preview generation step succeeded.
 *
 * Usage:
 *   node scripts/verify-previews.mjs [--strict]
 *
 * Exit codes:
 *   0 - All verifications passed
 *   1 - Some verifications failed (with --strict)
 *   0 - Some verifications failed (without --strict, just warnings)
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Configuration ───────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_DIR = join(__dirname, '..')
const PREVIEWS_DIR = join(ROOT_DIR, 'public', 'previews')

// Expected offer IDs
const EXPECTED_OFFERS = [
  'law-firm-72-hour-launch',
  'small-business-starter',
  'digital-agency-pro',
  'premium-full-service',
]

// ─── Parse CLI Arguments ─────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    strict: args.includes('--strict'),
    quiet: args.includes('--quiet'),
    help: args.includes('--help') || args.includes('-h'),
  }
}

// ─── Logging ─────────────────────────────────────────────────

const log = {
  info: (msg) => console.log(`[verify] ${msg}`),
  warn: (msg) => console.warn(`[verify:WARN] ${msg}`),
  error: (msg) => console.error(`[verify:ERROR] ${msg}`),
  success: (msg) => console.log(`[verify:OK] ${msg}`),
}

// ─── Verification Checks ─────────────────────────────────────

/**
 * Check if previews directory exists.
 */
function checkPreviewsDir() {
  if (!existsSync(PREVIEWS_DIR)) {
    return { ok: false, message: `Previews directory not found: ${PREVIEWS_DIR}` }
  }
  return { ok: true, message: `Previews directory exists` }
}

/**
 * Check for expected offer directories.
 */
function checkOfferDirectories() {
  const missing = []
  const present = []
  
  for (const offerId of EXPECTED_OFFERS) {
    const offerDir = join(PREVIEWS_DIR, offerId)
    if (existsSync(offerDir)) {
      present.push(offerId)
    } else {
      missing.push(offerId)
    }
  }
  
  if (missing.length > 0) {
    return {
      ok: false,
      message: `Missing offer directories: ${missing.join(', ')}`,
      present,
      missing,
    }
  }
  
  return {
    ok: true,
    message: `All ${present.length} offer directories present`,
    present,
    missing: [],
  }
}

/**
 * Validate meta.json for an offer.
 */
function validateMeta(offerId) {
  const metaPath = join(PREVIEWS_DIR, offerId, 'meta.json')
  
  if (!existsSync(metaPath)) {
    return { ok: false, message: `meta.json missing` }
  }
  
  try {
    const content = readFileSync(metaPath, 'utf8')
    const meta = JSON.parse(content)
    
    const errors = []
    
    if (!meta.offerId) errors.push('missing offerId')
    if (!meta.title) errors.push('missing title')
    if (!meta.generatorVersion) errors.push('missing generatorVersion')
    if (!meta.generatedAt) errors.push('missing generatedAt')
    if (!meta.scenes || !Array.isArray(meta.scenes)) errors.push('missing or invalid scenes')
    if (!meta.posterFilename) errors.push('missing posterFilename')
    
    if (errors.length > 0) {
      return { ok: false, message: `meta.json invalid: ${errors.join(', ')}`, meta }
    }
    
    return { ok: true, message: `meta.json valid (${meta.scenes?.length || 0} scenes)`, meta }
  } catch (err) {
    return { ok: false, message: `meta.json parse error: ${err.message}` }
  }
}

/**
 * Check for poster image.
 */
function checkPoster(offerId) {
  const posterPath = join(PREVIEWS_DIR, offerId, 'poster.png')
  
  if (!existsSync(posterPath)) {
    return { ok: false, message: `poster.png missing` }
  }
  
  const stats = statSync(posterPath)
  if (stats.size < 1000) {
    return { ok: false, message: `poster.png too small (${stats.size} bytes)` }
  }
  
  return { ok: true, message: `poster.png exists (${Math.round(stats.size / 1024)}KB)` }
}

/**
 * Check for thumbnail images.
 */
function checkThumbnails(offerId, expectedCount) {
  const thumbsDir = join(PREVIEWS_DIR, offerId, 'thumbs')
  
  if (!existsSync(thumbsDir)) {
    return { ok: false, message: `thumbs/ directory missing`, count: 0 }
  }
  
  const files = readdirSync(thumbsDir).filter(f => f.endsWith('.png'))
  
  if (files.length === 0) {
    return { ok: false, message: `no thumbnails found`, count: 0 }
  }
  
  if (expectedCount && files.length < expectedCount) {
    return {
      ok: false,
      message: `only ${files.length}/${expectedCount} thumbnails found`,
      count: files.length,
    }
  }
  
  return { ok: true, message: `${files.length} thumbnails found`, count: files.length }
}

/**
 * Check for scene videos (optional).
 */
function checkScenes(offerId) {
  const scenesDir = join(PREVIEWS_DIR, offerId, 'scenes')
  
  if (!existsSync(scenesDir)) {
    return { ok: true, message: `scenes/ directory not present (optional)`, count: 0 }
  }
  
  const files = readdirSync(scenesDir).filter(f => f.endsWith('.webm') || f.endsWith('.mp4'))
  
  return { ok: true, message: `${files.length} scene videos found`, count: files.length }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const options = parseArgs()
  
  if (options.help) {
    console.log(`
Verify Preview Artifacts

Usage:
  node scripts/verify-previews.mjs [options]

Options:
  --strict    Exit with error code 1 if any verification fails
  --quiet     Only show errors
  --help, -h  Show this help

Exit codes:
  0 - All verifications passed (or non-strict mode)
  1 - Some verifications failed (strict mode only)
    `)
    process.exit(0)
  }
  
  log.info('Verifying preview artifacts...\n')
  
  let totalChecks = 0
  let passedChecks = 0
  let failedChecks = 0
  const results = []
  
  // Check previews directory
  const dirCheck = checkPreviewsDir()
  totalChecks++
  if (dirCheck.ok) {
    passedChecks++
    if (!options.quiet) log.success(dirCheck.message)
  } else {
    failedChecks++
    log.error(dirCheck.message)
    
    if (options.strict) {
      log.error(`\nVerification failed (${failedChecks} errors)`)
      process.exit(1)
    } else {
      log.warn(`\nPreview artifacts not generated yet (expected in CI)`)
      process.exit(0)
    }
  }
  
  // Check offer directories
  const offersCheck = checkOfferDirectories()
  totalChecks++
  if (offersCheck.ok) {
    passedChecks++
    if (!options.quiet) log.success(offersCheck.message)
  } else {
    failedChecks++
    log.warn(offersCheck.message)
  }
  
  // Check each present offer
  for (const offerId of offersCheck.present || []) {
    log.info(`\nChecking ${offerId}:`)
    
    // Meta
    const metaCheck = validateMeta(offerId)
    totalChecks++
    if (metaCheck.ok) {
      passedChecks++
      if (!options.quiet) log.success(`  ${metaCheck.message}`)
    } else {
      failedChecks++
      log.error(`  ${metaCheck.message}`)
    }
    
    // Poster
    const posterCheck = checkPoster(offerId)
    totalChecks++
    if (posterCheck.ok) {
      passedChecks++
      if (!options.quiet) log.success(`  ${posterCheck.message}`)
    } else {
      failedChecks++
      log.warn(`  ${posterCheck.message}`)
    }
    
    // Thumbnails
    const thumbCheck = checkThumbnails(offerId, metaCheck.meta?.scenes?.length)
    totalChecks++
    if (thumbCheck.ok) {
      passedChecks++
      if (!options.quiet) log.success(`  ${thumbCheck.message}`)
    } else {
      failedChecks++
      log.warn(`  ${thumbCheck.message}`)
    }
    
    // Scenes (optional)
    const scenesCheck = checkScenes(offerId)
    totalChecks++
    if (scenesCheck.ok) {
      passedChecks++
      if (!options.quiet && scenesCheck.count > 0) log.success(`  ${scenesCheck.message}`)
    }
    
    results.push({
      offerId,
      meta: metaCheck.ok,
      poster: posterCheck.ok,
      thumbs: thumbCheck.count,
      scenes: scenesCheck.count,
    })
  }
  
  // Summary
  console.log('\n' + '─'.repeat(50))
  log.info(`Verification complete:`)
  log.info(`  Total checks: ${totalChecks}`)
  log.info(`  Passed: ${passedChecks}`)
  log.info(`  Failed: ${failedChecks}`)
  
  if (results.length > 0) {
    console.log('\nOffer Summary:')
    console.log('─'.repeat(50))
    console.log('Offer ID                        | Meta | Poster | Thumbs')
    console.log('─'.repeat(50))
    for (const r of results) {
      console.log(
        `${r.offerId.padEnd(31)} | ${r.meta ? '✓' : '✗'}    | ${r.poster ? '✓' : '✗'}      | ${r.thumbs}`
      )
    }
  }
  
  if (failedChecks > 0 && options.strict) {
    log.error(`\nVerification failed with ${failedChecks} error(s)`)
    process.exit(1)
  }
  
  if (failedChecks > 0) {
    log.warn(`\nSome checks failed (non-strict mode, continuing)`)
    process.exit(0)
  }
  
  log.success('\nAll verifications passed!')
}

main().catch(err => {
  log.error(err.message)
  process.exit(1)
})
