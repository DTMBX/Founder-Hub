/**
 * Preview Generator Script
 *
 * Generates preview videos and thumbnails for marketing offer pages.
 * Uses Playwright to record site previews in headless Chrome.
 *
 * Usage:
 *   node scripts/generate-previews.mjs [--offer=<offerId>] [--force] [--debug]
 *
 * Dependencies:
 *   - playwright (dev dependency)
 *   - Dev server running or will spin one up
 */

import { chromium } from 'playwright'
import { createServer } from 'vite'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── Configuration ───────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_DIR = join(__dirname, '..')
const OUTPUT_DIR = join(ROOT_DIR, 'public', 'previews')
const DEFAULT_PORT = 5173

// Import preview definitions dynamically (ESM)
const PREVIEW_DEFS_PATH = join(ROOT_DIR, 'src', 'previews', 'previewDefs.ts')

// Generator version for cache invalidation
const GENERATOR_VERSION = '1.0.0'

// ─── Parse CLI Arguments ─────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    offerIds: [],
    force: false,
    debug: false,
    headless: true,
    baseUrl: null,
    skipServer: false,
  }

  for (const arg of args) {
    if (arg.startsWith('--offer=')) {
      options.offerIds.push(arg.replace('--offer=', ''))
    } else if (arg === '--force') {
      options.force = true
    } else if (arg === '--debug') {
      options.debug = true
      options.headless = false
    } else if (arg === '--headed') {
      options.headless = false
    } else if (arg.startsWith('--base-url=')) {
      options.baseUrl = arg.replace('--base-url=', '')
      options.skipServer = true
    } else if (arg === '--skip-server') {
      options.skipServer = true
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Preview Generator - Generate preview videos for marketing offers

Usage:
  node scripts/generate-previews.mjs [options]

Options:
  --offer=<id>      Generate only for specific offer ID (can repeat)
  --force           Regenerate even if artifacts exist
  --debug           Enable debug mode (headed browser, verbose logs)
  --headed          Run browser in headed mode
  --base-url=<url>  Use existing server instead of spinning up Vite
  --skip-server     Don't start Vite server (use existing on :5173)
  --help, -h        Show this help

Examples:
  node scripts/generate-previews.mjs
  node scripts/generate-previews.mjs --offer=law-firm-72-hour-launch
  node scripts/generate-previews.mjs --force --debug
  node scripts/generate-previews.mjs --base-url=http://localhost:4173
      `)
      process.exit(0)
    }
  }

  return options
}

// ─── Logging ─────────────────────────────────────────────────

let debugMode = false

function log(msg) {
  console.log(`[preview-gen] ${msg}`)
}

function debug(msg) {
  if (debugMode) {
    console.log(`[preview-gen:debug] ${msg}`)
  }
}

function error(msg) {
  console.error(`[preview-gen:ERROR] ${msg}`)
}

// ─── Server Management ───────────────────────────────────────

async function startDevServer(port = DEFAULT_PORT) {
  log(`Starting Vite dev server on port ${port}...`)
  
  const server = await createServer({
    root: ROOT_DIR,
    server: {
      port,
      strictPort: true,
    },
    logLevel: debugMode ? 'info' : 'warn',
  })
  
  await server.listen()
  log(`Dev server running at http://localhost:${port}`)
  
  return server
}

async function waitForServer(baseUrl, maxAttempts = 30) {
  log(`Waiting for server at ${baseUrl}...`)
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) {
        log('Server is ready')
        return true
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  
  throw new Error(`Server at ${baseUrl} not responding after ${maxAttempts} seconds`)
}

// ─── Demo Site Generation ────────────────────────────────────

/**
 * Generate a deterministic site ID for a scene.
 * Uses offerId + sceneId + seed to ensure reproducibility.
 */
function generateSiteId(offerId, sceneId, seedOverride) {
  const seed = seedOverride || `${offerId}-${sceneId}`
  // Create a short hash-like ID
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hashStr = Math.abs(hash).toString(36).padStart(6, '0').slice(0, 6)
  return `demo-${hashStr}`
}

/**
 * Create a demo site in local storage via page context.
 * This injects the site into localStorage so the preview route can render it.
 */
async function createDemoSiteInBrowser(page, scene, offerId, baseUrl) {
  const siteId = generateSiteId(offerId, scene.sceneId, scene.seedOverride)
  
  debug(`Creating demo site: ${siteId} for scene ${scene.sceneId}`)
  
  // Navigate to the app first to have access to localStorage
  await page.goto(baseUrl)
  await page.waitForLoadState('networkidle')
  
  // Create a minimal site record that the preview system can render
  // The actual rendering will use the preset/vertical system
  const siteData = {
    siteId,
    type: scene.siteType,
    name: `Demo ${scene.label}`,
    slug: siteId,
    status: 'demo',
    visibility: 'demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    branding: {
      primaryColor: '#1a365d',
      secondaryColor: '#c7a44a',
    },
    seo: {
      title: `${scene.label} Demo`,
      description: `Preview of ${scene.label} site template`,
    },
    // Type-specific minimal config
    config: scene.siteType === 'law-firm' ? {
      firmName: `${scene.label} Law`,
      primaryColor: '#1a365d',
      accentColor: '#c7a44a',
      intakeFormEnabled: false,
      intakeFields: [],
      seo: { sitemapEnabled: false },
    } : scene.siteType === 'small-business' ? {
      businessName: `${scene.label} Business`,
      primaryColor: '#10b981',
      accentColor: '#3b82f6',
    } : {
      agencyName: `${scene.label} Agency`,
      primaryColor: '#8b5cf6',
      accentColor: '#ec4899',
    },
    // Add arrays based on type
    ...(scene.siteType === 'law-firm' ? {
      caseResults: [],
      attorneys: [],
      practiceAreas: [],
      testimonials: [],
      blogPosts: [],
      intakeSubmissions: [],
    } : scene.siteType === 'small-business' ? {
      services: [],
      teamMembers: [],
      testimonials: [],
      galleryImages: [],
      blogPosts: [],
      promotions: [],
      businessHours: [],
    } : {
      projects: [],
      teamMembers: [],
      clients: [],
      testimonials: [],
      blogPosts: [],
    }),
    // Metadata for preview system
    _previewMeta: {
      verticalId: scene.verticalId,
      presetId: scene.presetId,
      offerId,
      sceneId: scene.sceneId,
    },
  }
  
  // Inject into localStorage
  await page.evaluate((data) => {
    const { siteId, siteData } = data
    
    // Get or create sites array
    const existingSites = JSON.parse(localStorage.getItem('Founder-Hub-sites') || '[]')
    
    // Remove existing demo with same ID if exists
    const filtered = existingSites.filter(s => s.siteId !== siteId)
    filtered.push(siteData)
    
    localStorage.setItem('Founder-Hub-sites', JSON.stringify(filtered))
    
    // Also store individually for quick lookup
    localStorage.setItem(`Founder-Hub-site-${siteId}`, JSON.stringify(siteData))
    
    return true
  }, { siteId, siteData })
  
  debug(`Demo site ${siteId} created in localStorage`)
  
  return {
    siteId,
    previewPath: `#preview/${siteId}`,
  }
}

// ─── Recording Helpers ───────────────────────────────────────

/**
 * Scroll the page smoothly from start to end position.
 */
async function performScroll(page, startPct, endPct, durationMs) {
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight)
  const viewportHeight = await page.evaluate(() => window.innerHeight)
  const maxScroll = scrollHeight - viewportHeight
  
  const startY = Math.floor(maxScroll * startPct)
  const endY = Math.floor(maxScroll * endPct)
  
  // Set initial position
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), startY)
  await page.waitForTimeout(100)
  
  // Smooth scroll to end
  const steps = 30
  const stepDuration = durationMs / steps
  const stepDistance = (endY - startY) / steps
  
  for (let i = 0; i <= steps; i++) {
    const y = startY + (stepDistance * i)
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
    await page.waitForTimeout(stepDuration)
  }
}

/**
 * Take a screenshot of the current page state.
 */
async function captureScreenshot(page, outputPath) {
  await page.screenshot({
    path: outputPath,
    type: 'png',
    fullPage: false,
  })
  debug(`Screenshot saved: ${outputPath}`)
}

// ─── Scene Recording ─────────────────────────────────────────

/**
 * Record a single scene.
 * Returns scene metadata.
 */
async function recordScene(context, scene, offerId, baseUrl, outputDir) {
  const sceneDir = join(outputDir, 'scenes')
  mkdirSync(sceneDir, { recursive: true })
  
  const durationSeconds = scene.durationSeconds || 2.0
  const durationMs = durationSeconds * 1000
  
  // Create page with video recording
  const page = await context.newPage({
    recordVideo: {
      dir: sceneDir,
      size: { width: 1280, height: 720 },
    },
  })
  
  try {
    // Create demo site
    const { siteId, previewPath } = await createDemoSiteInBrowser(page, scene, offerId, baseUrl)
    
    // Navigate to preview
    const previewUrl = `${baseUrl}/${previewPath}`
    debug(`Navigating to ${previewUrl}`)
    await page.goto(previewUrl)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500) // Let animations settle
    
    // Perform camera motion
    const scrollStart = scene.scrollStart ?? 0
    const scrollEnd = scene.scrollEnd ?? 0.4
    
    if (scene.cameraMotion === 'scroll-down' || !scene.cameraMotion) {
      await performScroll(page, scrollStart, scrollEnd, durationMs - 200)
    } else if (scene.cameraMotion === 'scroll-up') {
      await performScroll(page, scrollEnd, scrollStart, durationMs - 200)
    } else if (scene.cameraMotion === 'pan-hero') {
      // Subtle pan in hero area
      await performScroll(page, 0, 0.15, durationMs - 200)
    } else {
      // Static: just wait
      await page.waitForTimeout(durationMs - 200)
    }
    
    // Capture screenshot at end of scene
    const thumbPath = join(outputDir, 'thumbs', `${scene.sceneId}.png`)
    mkdirSync(dirname(thumbPath), { recursive: true })
    
    // Reset to start position for good thumbnail
    await page.evaluate((pct) => {
      const scrollHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      const maxScroll = scrollHeight - viewportHeight
      window.scrollTo({ top: maxScroll * pct, behavior: 'instant' })
    }, scrollStart)
    await page.waitForTimeout(200)
    
    await captureScreenshot(page, thumbPath)
    
    // Close page to finalize video
    await page.close()
    
    // Get video path
    const video = page.video()
    const videoPath = video ? await video.path() : null
    
    return {
      sceneId: scene.sceneId,
      label: scene.label,
      presetId: scene.presetId,
      verticalId: scene.verticalId,
      siteType: scene.siteType,
      generatedSiteId: siteId,
      recordedAt: new Date().toISOString(),
      durationSeconds,
      thumbnailFilename: `thumbs/${scene.sceneId}.png`,
      videoFilename: videoPath ? `scenes/${videoPath.split(/[/\\]/).pop()}` : null,
    }
  } catch (err) {
    error(`Failed to record scene ${scene.sceneId}: ${err.message}`)
    await page.close()
    throw err
  }
}

// ─── Montage Generation ──────────────────────────────────────

/**
 * Generate preview artifacts for a single montage.
 */
async function generateMontage(montage, browser, baseUrl, options) {
  const { force } = options
  const outputDir = join(OUTPUT_DIR, montage.offerId)
  const metaPath = join(outputDir, 'meta.json')
  
  // Check if already generated (skip if not forced)
  if (!force && existsSync(metaPath)) {
    log(`Skipping ${montage.offerId} (already exists, use --force to regenerate)`)
    return null
  }
  
  log(`Generating preview for: ${montage.title}`)
  
  // Clean output directory
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true })
  }
  mkdirSync(outputDir, { recursive: true })
  mkdirSync(join(outputDir, 'thumbs'), { recursive: true })
  mkdirSync(join(outputDir, 'scenes'), { recursive: true })
  
  // Create browser context with viewport
  const context = await browser.newContext({
    viewport: {
      width: montage.viewport.width,
      height: montage.viewport.height,
    },
    deviceScaleFactor: montage.viewport.deviceScaleFactor || 1,
    isMobile: montage.viewport.isMobile || false,
  })
  
  const sceneMetas = []
  let totalDuration = 0
  
  try {
    // Record each scene
    for (let i = 0; i < montage.scenes.length; i++) {
      const scene = montage.scenes[i]
      log(`  Recording scene ${i + 1}/${montage.scenes.length}: ${scene.label}`)
      
      const sceneMeta = await recordScene(
        context,
        scene,
        montage.offerId,
        baseUrl,
        outputDir,
      )
      
      sceneMetas.push(sceneMeta)
      totalDuration += sceneMeta.durationSeconds
    }
    
    // Use first scene thumbnail as poster
    const posterSrc = join(outputDir, 'thumbs', `${montage.scenes[0].sceneId}.png`)
    const posterDest = join(outputDir, 'poster.png')
    if (existsSync(posterSrc)) {
      const { copyFileSync } = await import('node:fs')
      copyFileSync(posterSrc, posterDest)
      debug(`Poster created from first scene thumbnail`)
    }
    
    // Write metadata
    const meta = {
      offerId: montage.offerId,
      title: montage.title,
      description: montage.description,
      generatorVersion: GENERATOR_VERSION,
      generatedAt: new Date().toISOString(),
      totalDurationSeconds: totalDuration,
      viewport: montage.viewport,
      assemblyStrategy: 'scene-playlist', // Using scene playlist for now
      videoFilename: null, // Will be set after assembly
      posterFilename: 'poster.png',
      scenes: sceneMetas,
    }
    
    writeFileSync(metaPath, JSON.stringify(meta, null, 2))
    log(`  Meta written: ${metaPath}`)
    
    return meta
  } finally {
    await context.close()
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const options = parseArgs()
  debugMode = options.debug
  
  log('Preview Generator starting...')
  debug(`Options: ${JSON.stringify(options)}`)
  
  // Dynamically import preview definitions
  // We need to use tsx or compile first, so for now we'll hard-code the definitions
  // In production, this would be compiled or use dynamic import with tsx
  const PREVIEW_MONTAGES = [
    {
      offerId: 'law-firm-72-hour-launch',
      title: 'Law Firm – 72 Hour Launch',
      description: 'Professional law firm websites for every practice area.',
      defaultDurationSeconds: 1.8,
      viewport: { width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false },
      defaultCameraMotion: 'scroll-down',
      scenes: [
        { sceneId: 'scene-001', label: 'Criminal Defense', siteType: 'law-firm', verticalId: 'lawfirm_criminal', presetId: 'criminal-defense-dark', scrollEnd: 0.35 },
        { sceneId: 'scene-002', label: 'Personal Injury', siteType: 'law-firm', verticalId: 'lawfirm_personal_injury', presetId: 'personal-injury-bold', scrollEnd: 0.4 },
        { sceneId: 'scene-003', label: 'Family Law', siteType: 'law-firm', verticalId: 'lawfirm_family', presetId: 'family-law-warm', scrollEnd: 0.35 },
        { sceneId: 'scene-004', label: 'Immigration', siteType: 'law-firm', verticalId: 'lawfirm_immigration', presetId: 'immigration-hope', scrollEnd: 0.4 },
        { sceneId: 'scene-005', label: 'Civil Rights', siteType: 'law-firm', verticalId: 'lawfirm_civil_rights', presetId: 'civil-rights-justice', scrollEnd: 0.35 },
        { sceneId: 'scene-006', label: 'Business Law', siteType: 'law-firm', verticalId: 'lawfirm_business', presetId: 'business-law-corporate', scrollEnd: 0.4 },
      ],
    },
    {
      offerId: 'small-business-starter',
      title: 'Small Business Starter',
      description: 'Professional websites for local businesses.',
      defaultDurationSeconds: 2.0,
      viewport: { width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false },
      defaultCameraMotion: 'scroll-down',
      scenes: [
        { sceneId: 'scene-007', label: 'Contractor', siteType: 'small-business', verticalId: 'smb_contractor', presetId: 'smb-friendly-modern', scrollEnd: 0.4 },
        { sceneId: 'scene-008', label: 'Restaurant', siteType: 'small-business', verticalId: 'smb_restaurant', presetId: 'smb-warm-artisan', scrollEnd: 0.45 },
        { sceneId: 'scene-009', label: 'Medical Practice', siteType: 'small-business', verticalId: 'smb_medical', presetId: 'smb-clean-professional', scrollEnd: 0.35 },
        { sceneId: 'scene-010', label: 'Salon & Spa', siteType: 'small-business', verticalId: 'smb_salon', presetId: 'smb-elegant-minimal', scrollEnd: 0.4 },
        { sceneId: 'scene-011', label: 'Auto Shop', siteType: 'small-business', verticalId: 'smb_auto', presetId: 'smb-bold-vibrant', scrollEnd: 0.4 },
        { sceneId: 'scene-012', label: 'Retail Store', siteType: 'small-business', verticalId: 'smb_retail', presetId: 'smb-friendly-modern', scrollEnd: 0.35 },
      ],
    },
    {
      offerId: 'digital-agency-pro',
      title: 'Digital Agency Pro',
      description: 'Showcase your agency with a modern portfolio site.',
      defaultDurationSeconds: 2.2,
      viewport: { width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false },
      defaultCameraMotion: 'scroll-down',
      scenes: [
        { sceneId: 'scene-013', label: 'Dark Studio', siteType: 'agency', verticalId: 'agency_general', presetId: 'agency-dark-studio', cameraMotion: 'pan-hero', scrollEnd: 0.3 },
        { sceneId: 'scene-014', label: 'Creative Gradient', siteType: 'agency', verticalId: 'agency_design', presetId: 'agency-creative-gradient', scrollEnd: 0.4 },
        { sceneId: 'scene-015', label: 'Corporate Blue', siteType: 'agency', verticalId: 'agency_marketing', presetId: 'agency-corporate-blue', scrollEnd: 0.35 },
        { sceneId: 'scene-016', label: 'Light Minimal', siteType: 'agency', verticalId: 'agency_development', presetId: 'agency-light-minimal', scrollEnd: 0.4 },
      ],
    },
    {
      offerId: 'premium-full-service',
      title: 'Premium Full-Service',
      description: 'The complete package. All features. Premium support.',
      defaultDurationSeconds: 1.5,
      viewport: { width: 1280, height: 720, deviceScaleFactor: 1, isMobile: false },
      defaultCameraMotion: 'scroll-down',
      scenes: [
        { sceneId: 'scene-017', label: 'Executive Law', siteType: 'law-firm', verticalId: 'lawfirm_general', presetId: 'lawfirm-executive-burgundy', cameraMotion: 'pan-hero' },
        { sceneId: 'scene-018', label: 'Professional SMB', siteType: 'small-business', verticalId: 'smb_medical', presetId: 'smb-clean-professional' },
        { sceneId: 'scene-019', label: 'Creative Agency', siteType: 'agency', verticalId: 'agency_design', presetId: 'agency-creative-gradient', cameraMotion: 'pan-hero' },
        { sceneId: 'scene-020', label: 'Modern Law', siteType: 'law-firm', verticalId: 'lawfirm_personal_injury', presetId: 'lawfirm-modern-slate' },
        { sceneId: 'scene-021', label: 'Artisan Business', siteType: 'small-business', verticalId: 'smb_restaurant', presetId: 'smb-warm-artisan' },
        { sceneId: 'scene-022', label: 'Dark Portfolio', siteType: 'agency', verticalId: 'agency_general', presetId: 'agency-dark-studio', cameraMotion: 'pan-hero', scrollEnd: 0.25 },
      ],
    },
  ]
  
  // Filter montages if specific offers requested
  let montagesToGenerate = PREVIEW_MONTAGES
  if (options.offerIds.length > 0) {
    montagesToGenerate = PREVIEW_MONTAGES.filter(m => 
      options.offerIds.includes(m.offerId)
    )
    if (montagesToGenerate.length === 0) {
      error(`No montages found for offer IDs: ${options.offerIds.join(', ')}`)
      process.exit(1)
    }
  }
  
  log(`Will generate ${montagesToGenerate.length} montage(s)`)
  
  // Ensure output directory exists
  mkdirSync(OUTPUT_DIR, { recursive: true })
  
  // Start or connect to server
  let server = null
  const baseUrl = options.baseUrl || `http://localhost:${DEFAULT_PORT}`
  
  if (!options.skipServer && !options.baseUrl) {
    try {
      server = await startDevServer(DEFAULT_PORT)
    } catch (err) {
      log('Could not start dev server, assuming one is already running')
      debug(`Server error: ${err.message}`)
    }
  }
  
  // Wait for server
  await waitForServer(baseUrl)
  
  // Launch browser
  log('Launching browser...')
  const browser = await chromium.launch({
    headless: options.headless,
  })
  
  const results = []
  
  try {
    for (const montage of montagesToGenerate) {
      const meta = await generateMontage(montage, browser, baseUrl, options)
      if (meta) {
        results.push(meta)
      }
    }
    
    log(`\nGeneration complete!`)
    log(`Generated: ${results.length} montage(s)`)
    log(`Output: ${OUTPUT_DIR}`)
    
  } finally {
    await browser.close()
    
    if (server) {
      log('Shutting down dev server...')
      await server.close()
    }
  }
}

// Run
main().catch(err => {
  error(err.message)
  console.error(err.stack)
  process.exit(1)
})
