#!/usr/bin/env node
/**
 * XTX396 Site Manager
 * 
 * Central management tool for tracking and managing all generated sites.
 * Maintains a registry of sites with their configurations and status.
 * 
 * Usage:
 *   node scripts/site-manager.mjs list                    # List all sites
 *   node scripts/site-manager.mjs status <site-id>        # Check site status
 *   node scripts/site-manager.mjs update-all              # Update all sites from template
 *   node scripts/site-manager.mjs deploy <site-id>        # Deploy a specific site
 */

import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const REGISTRY_PATH = path.join(process.cwd(), '..', 'site-registry.json')
const GENERATED_SITES_DIR = path.join(process.cwd(), '..', 'generated-sites')

// ============================================================================
// REGISTRY MANAGEMENT
// ============================================================================

async function loadRegistry() {
  try {
    const data = await fs.readFile(REGISTRY_PATH, 'utf8')
    return JSON.parse(data)
  } catch {
    return { sites: [], lastUpdated: null }
  }
}

async function saveRegistry(registry) {
  registry.lastUpdated = new Date().toISOString()
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2))
}

async function registerSite(siteData) {
  const registry = await loadRegistry()
  
  // Check if site already exists
  const existingIndex = registry.sites.findIndex(s => s.siteId === siteData.siteId)
  if (existingIndex >= 0) {
    registry.sites[existingIndex] = { ...registry.sites[existingIndex], ...siteData, updatedAt: new Date().toISOString() }
  } else {
    registry.sites.push({
      ...siteData,
      createdAt: new Date().toISOString(),
      status: 'created'
    })
  }
  
  await saveRegistry(registry)
  return registry
}

// ============================================================================
// SITE DISCOVERY
// ============================================================================

async function discoverSites() {
  const sites = []
  
  try {
    const entries = await fs.readdir(GENERATED_SITES_DIR, { withFileTypes: true })
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      
      const sitePath = path.join(GENERATED_SITES_DIR, entry.name)
      
      try {
        // Try to read .env for site info
        const envPath = path.join(sitePath, '.env')
        const envContent = await fs.readFile(envPath, 'utf8')
        
        const siteInfo = {
          siteId: entry.name,
          path: sitePath
        }
        
        // Parse env vars
        for (const line of envContent.split('\n')) {
          const match = line.match(/^(VITE_\w+)=(.+)$/)
          if (match) {
            const [, key, value] = match
            if (key === 'VITE_SITE_NAME') siteInfo.name = value
            if (key === 'VITE_SITE_DOMAIN') siteInfo.domain = value
            if (key === 'VITE_ADMIN_EMAIL') siteInfo.adminEmail = value
          }
        }
        
        sites.push(siteInfo)
      } catch {
        // Site without .env - still add basic info
        sites.push({
          siteId: entry.name,
          path: sitePath,
          name: entry.name,
          status: 'unknown'
        })
      }
    }
  } catch {
    // No generated-sites directory yet
  }
  
  return sites
}

// ============================================================================
// COMMANDS
// ============================================================================

async function listSites() {
  const registry = await loadRegistry()
  const discovered = await discoverSites()
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║              XTX396 SITE MANAGER - SITE LIST                 ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')
  
  if (discovered.length === 0) {
    console.log('  No sites found. Generate one with:\n')
    console.log('    node scripts/generate-site.mjs --name "My Site" --domain mysite.com --admin admin@mysite.com\n')
    return
  }
  
  console.log(`  Found ${discovered.length} site(s):\n`)
  console.log('  ┌─────────────────────┬─────────────────────────┬────────────────────────────┐')
  console.log('  │ Site ID             │ Name                    │ Domain                     │')
  console.log('  ├─────────────────────┼─────────────────────────┼────────────────────────────┤')
  
  for (const site of discovered) {
    const id = (site.siteId || '-').padEnd(19).slice(0, 19)
    const name = (site.name || '-').padEnd(23).slice(0, 23)
    const domain = (site.domain || '-').padEnd(26).slice(0, 26)
    console.log(`  │ ${id} │ ${name} │ ${domain} │`)
  }
  
  console.log('  └─────────────────────┴─────────────────────────┴────────────────────────────┘\n')
}

async function showStatus(siteId) {
  const discovered = await discoverSites()
  const site = discovered.find(s => s.siteId === siteId)
  
  if (!site) {
    console.error(`\n❌ Site "${siteId}" not found\n`)
    process.exit(1)
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║              SITE STATUS                                     ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')
  
  console.log(`  Site ID:     ${site.siteId}`)
  console.log(`  Name:        ${site.name || 'N/A'}`)
  console.log(`  Domain:      ${site.domain || 'N/A'}`)
  console.log(`  Admin:       ${site.adminEmail || 'N/A'}`)
  console.log(`  Path:        ${site.path}`)
  
  // Check for node_modules
  try {
    await fs.access(path.join(site.path, 'node_modules'))
    console.log(`  Deps:        ✓ Installed`)
  } catch {
    console.log(`  Deps:        ✗ Not installed (run npm install)`)
  }
  
  // Check for dist folder
  try {
    await fs.access(path.join(site.path, 'dist'))
    console.log(`  Build:       ✓ Built`)
  } catch {
    console.log(`  Build:       ✗ Not built (run npm run build)`)
  }
  
  // Check git status
  try {
    const gitStatus = execSync('git status --porcelain', { cwd: site.path, stdio: 'pipe' }).toString()
    if (gitStatus.trim()) {
      console.log(`  Git:         ⚠ Uncommitted changes`)
    } else {
      console.log(`  Git:         ✓ Clean`)
    }
  } catch {
    console.log(`  Git:         ✗ Not a git repo`)
  }
  
  console.log('')
}

async function deploySite(siteId) {
  const discovered = await discoverSites()
  const site = discovered.find(s => s.siteId === siteId)
  
  if (!site) {
    console.error(`\n❌ Site "${siteId}" not found\n`)
    process.exit(1)
  }
  
  console.log('\n📦 Deploying ' + site.name + '...\n')
  
  try {
    // Install deps if needed
    try {
      await fs.access(path.join(site.path, 'node_modules'))
    } catch {
      console.log('  Installing dependencies...')
      execSync('npm install', { cwd: site.path, stdio: 'inherit' })
    }
    
    // Build
    console.log('\n  Building site...')
    execSync('npm run build', { cwd: site.path, stdio: 'inherit' })
    
    console.log('\n✓ Build complete!')
    console.log(`\n  Deploy the ${path.join(site.path, 'dist')} folder to your hosting provider.\n`)
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

async function syncRegistry() {
  const discovered = await discoverSites()
  const registry = await loadRegistry()
  
  console.log('\n🔄 Syncing site registry...\n')
  
  for (const site of discovered) {
    await registerSite(site)
    console.log(`  ✓ ${site.siteId}`)
  }
  
  console.log(`\n✓ Registry synced with ${discovered.length} site(s)\n`)
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const [command, ...args] = process.argv.slice(2)
  
  switch (command) {
    case 'list':
    case 'ls':
      await listSites()
      break
      
    case 'status':
      if (!args[0]) {
        console.error('\n❌ Usage: site-manager.mjs status <site-id>\n')
        process.exit(1)
      }
      await showStatus(args[0])
      break
      
    case 'deploy':
      if (!args[0]) {
        console.error('\n❌ Usage: site-manager.mjs deploy <site-id>\n')
        process.exit(1)
      }
      await deploySite(args[0])
      break
      
    case 'sync':
      await syncRegistry()
      break
      
    default:
      console.log(`
XTX396 Site Manager
===================

Commands:
  list, ls              List all generated sites
  status <site-id>      Show status of a specific site
  deploy <site-id>      Build and prepare site for deployment
  sync                  Sync discovered sites to registry

Examples:
  node scripts/site-manager.mjs list
  node scripts/site-manager.mjs status mysite-com
  node scripts/site-manager.mjs deploy mysite-com
`)
  }
}

main()
