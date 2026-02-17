#!/usr/bin/env node
/**
 * XTX396 Site Generator
 * 
 * Generates customized site clones from the XTX396 template.
 * Each site gets its own configuration and can be deployed independently.
 * 
 * Usage:
 *   node scripts/generate-site.mjs --name "My Site" --domain mysite.com --admin admin@mysite.com
 *   node scripts/generate-site.mjs --preset law-firm --name "Smith Legal" --domain smithlegal.com
 *   node scripts/generate-site.mjs --list-presets
 */

import { promises as fs } from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import crypto from 'crypto'

// ============================================================================
// PRESETS - Predefined configurations for common site types
// ============================================================================

const PRESETS = {
  'law-firm': {
    name: 'Law Firm',
    description: 'Professional legal services site with case intake forms',
    colors: {
      primary: '#1a365d',      // Navy blue
      secondary: '#744210',    // Gold/bronze
      accent: '#c05621'
    },
    features: ['intake-forms', 'case-tracker', 'document-portal'],
    pages: ['practice-areas', 'attorneys', 'case-results', 'testimonials'],
    settings: {
      enableBilling: true,
      enableLeads: true,
      leadCategories: ['Personal Injury', 'Family Law', 'Criminal Defense', 'Estate Planning']
    }
  },
  'contractor': {
    name: 'Contractor/Trades',
    description: 'Construction and trades service site with quote requests',
    colors: {
      primary: '#2d3748',
      secondary: '#dd6b20',
      accent: '#38a169'
    },
    features: ['quote-forms', 'project-gallery', 'service-areas'],
    pages: ['services', 'gallery', 'about', 'contact'],
    settings: {
      enableBilling: false,
      enableLeads: true,
      leadCategories: ['Estimate Request', 'Emergency Service', 'General Inquiry']
    }
  },
  'medical': {
    name: 'Medical Practice',
    description: 'Healthcare provider site with appointment scheduling',
    colors: {
      primary: '#2c5282',
      secondary: '#276749',
      accent: '#3182ce'
    },
    features: ['appointment-booking', 'patient-portal', 'insurance-info'],
    pages: ['services', 'providers', 'patient-resources', 'locations'],
    settings: {
      enableBilling: true,
      enableLeads: true,
      leadCategories: ['New Patient', 'Appointment', 'Insurance Question', 'Referral']
    }
  },
  'nonprofit': {
    name: 'Nonprofit Organization',
    description: 'Community organization site with donation support',
    colors: {
      primary: '#553c9a',
      secondary: '#38a169',
      accent: '#d69e2e'
    },
    features: ['donation-forms', 'volunteer-signup', 'event-calendar'],
    pages: ['mission', 'programs', 'get-involved', 'impact'],
    settings: {
      enableBilling: false,
      enableLeads: true,
      leadCategories: ['Volunteer', 'Donation Inquiry', 'Partnership', 'Media']
    }
  },
  'basic': {
    name: 'Basic Business',
    description: 'Simple professional business presence',
    colors: {
      primary: '#2d3748',
      secondary: '#4a5568',
      accent: '#3182ce'
    },
    features: ['contact-form'],
    pages: ['about', 'services', 'contact'],
    settings: {
      enableBilling: false,
      enableLeads: true,
      leadCategories: ['General Inquiry', 'Service Request']
    }
  },
  'ecommerce': {
    name: 'E-Commerce Store',
    description: 'Online store with Stripe payments and product catalog',
    colors: {
      primary: '#1a202c',
      secondary: '#e53e3e',
      accent: '#48bb78'
    },
    features: ['product-catalog', 'stripe-checkout', 'cart', 'order-tracking'],
    pages: ['shop', 'products', 'cart', 'checkout', 'account'],
    settings: {
      enableBilling: true,
      enableLeads: true,
      enableEcommerce: true,
      leadCategories: ['Order Support', 'Product Question', 'Returns', 'Wholesale']
    }
  },
  'restaurant': {
    name: 'Restaurant/Food Service',
    description: 'Restaurant or food business with menu and ordering',
    colors: {
      primary: '#7c2d12',
      secondary: '#ea580c',
      accent: '#16a34a'
    },
    features: ['menu-display', 'online-ordering', 'reservations', 'gallery'],
    pages: ['menu', 'order', 'reservations', 'about', 'gallery'],
    settings: {
      enableBilling: true,
      enableLeads: true,
      leadCategories: ['Catering', 'Private Events', 'Feedback', 'Job Application']
    }
  },
  'real-estate': {
    name: 'Real Estate',
    description: 'Real estate agent or agency with property listings',
    colors: {
      primary: '#1e3a5f',
      secondary: '#3b82f6',
      accent: '#10b981'
    },
    features: ['property-listings', 'search-filters', 'virtual-tours', 'contact-forms'],
    pages: ['listings', 'buy', 'sell', 'agents', 'resources'],
    settings: {
      enableBilling: false,
      enableLeads: true,
      leadCategories: ['Buyer Inquiry', 'Seller Inquiry', 'Property Valuation', 'Schedule Showing']
    }
  }
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEMPLATE_DIR = process.cwd()
const OUTPUT_BASE = path.join(process.cwd(), '..', 'generated-sites')

// Files/folders to exclude from copying
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.env',
  '.env.local',
  '*.log',
  'generated-sites'
]

// ============================================================================
// UTILITIES
// ============================================================================

function generateSecurePassword(length = 24) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length)
}

function generateSiteId(domain) {
  return domain.replace(/\./g, '-').toLowerCase()
}

function shouldExclude(filePath) {
  const name = path.basename(filePath)
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '.*'))
      return regex.test(name)
    }
    return name === pattern
  })
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (shouldExclude(srcPath)) continue
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

async function replaceInFile(filePath, replacements) {
  try {
    let content = await fs.readFile(filePath, 'utf8')
    for (const [search, replace] of Object.entries(replacements)) {
      content = content.replaceAll(search, replace)
    }
    await fs.writeFile(filePath, content, 'utf8')
  } catch (err) {
    // Skip binary files or unreadable files
    if (err.code !== 'ENOENT') {
      console.warn(`  Warning: Could not process ${filePath}`)
    }
  }
}

// ============================================================================
// MAIN GENERATOR
// ============================================================================

async function generateSite(options) {
  const {
    name,
    domain,
    adminEmail,
    adminPassword = generateSecurePassword(),
    preset = 'basic',
    outputDir
  } = options

  const siteId = generateSiteId(domain)
  const presetConfig = PRESETS[preset] || PRESETS['basic']
  const sitePath = outputDir || path.join(OUTPUT_BASE, siteId)

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║            XTX396 SITE GENERATOR                             ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  console.log(`📋 Site Configuration:`)
  console.log(`   Name:     ${name}`)
  console.log(`   Domain:   ${domain}`)
  console.log(`   Site ID:  ${siteId}`)
  console.log(`   Preset:   ${preset} (${presetConfig.name})`)
  console.log(`   Admin:    ${adminEmail}`)
  console.log(`   Output:   ${sitePath}\n`)

  // Step 1: Copy template
  console.log('📁 Copying template files...')
  await copyDirectory(TEMPLATE_DIR, sitePath)
  console.log('   ✓ Template copied\n')

  // Step 2: Create .env file
  console.log('🔧 Creating environment configuration...')
  const envContent = `# ============================================================================
# ${name} - Site Configuration
# Generated: ${new Date().toISOString()}
# Preset: ${preset}
# ============================================================================

# ─── SITE IDENTITY ──────────────────────────────────────────────────────────
VITE_SITE_ID=${siteId}
VITE_SITE_NAME=${name}
VITE_SITE_TAGLINE=${presetConfig.description}
VITE_SITE_DOMAIN=${domain}

# ─── BUSINESS DETAILS (UPDATE THESE) ────────────────────────────────────────
VITE_BUSINESS_LEGAL_NAME=${name}
VITE_BUSINESS_PHONE=
VITE_BUSINESS_EMAIL=${adminEmail}
VITE_ADDRESS_STREET=
VITE_ADDRESS_CITY=
VITE_ADDRESS_STATE=
VITE_ADDRESS_ZIP=
VITE_BUSINESS_HOURS=Mon-Fri 9am-5pm

# ─── ADMIN CREDENTIALS ──────────────────────────────────────────────────────
VITE_ADMIN_EMAIL=${adminEmail}
VITE_ADMIN_PASSWORD=${adminPassword}

# ─── SEO CONFIGURATION ──────────────────────────────────────────────────────
VITE_SEO_TITLE=${name}
VITE_SEO_DESCRIPTION=${presetConfig.description}
VITE_SEO_KEYWORDS=${presetConfig.pages?.join(',') || ''}
VITE_SCHEMA_TYPE=LocalBusiness
VITE_SCHEMA_PRICE_RANGE=$$

# ─── THEME & STYLING ────────────────────────────────────────────────────────
VITE_THEME_PRESET=${preset}
VITE_COLOR_PRIMARY=${presetConfig.colors.primary}
VITE_COLOR_SECONDARY=${presetConfig.colors.secondary}
VITE_COLOR_ACCENT=${presetConfig.colors.accent}
VITE_COLOR_BACKGROUND=#0a0a0a
VITE_COLOR_FOREGROUND=#fafafa

# Effects (glassmorphism, animations enabled by default)
VITE_EFFECT_GLASS=true
VITE_EFFECT_ANIMATIONS=true
VITE_EFFECT_PARTICLES=false
VITE_EFFECT_GRADIENTS=true
VITE_EFFECT_SHADOWS=true
VITE_LAYOUT_NO_WHITESPACE=false
VITE_LAYOUT_MAX_WIDTH=1400px

# ─── CONTACT FORM ───────────────────────────────────────────────────────────
VITE_CONTACT_ENDPOINT=/api/contact
VITE_CONTACT_EMAIL_TO=${adminEmail}
VITE_CONTACT_SUCCESS=Thank you! We'll be in touch within 24 hours.
VITE_LEAD_CATEGORIES=${presetConfig.settings.leadCategories.join(',')}

# ─── E-COMMERCE / STRIPE (Enable & Configure) ──────────────────────────────
VITE_ENABLE_ECOMMERCE=false
VITE_STRIPE_ENABLED=false
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_CURRENCY=usd
VITE_STRIPE_SUCCESS_URL=/checkout/success
VITE_STRIPE_CANCEL_URL=/checkout/cancel
VITE_PRODUCTS_COLUMNS=3

# ─── FEATURE FLAGS ──────────────────────────────────────────────────────────
VITE_ENABLE_BILLING=${presetConfig.settings.enableBilling}
VITE_ENABLE_LEADS=${presetConfig.settings.enableLeads}
VITE_ENABLE_BLOG=false
VITE_ENABLE_GALLERY=${presetConfig.features?.includes('project-gallery') || presetConfig.features?.includes('gallery') || false}
VITE_ENABLE_TESTIMONIALS=true
VITE_ENABLE_FAQ=false
VITE_ENABLE_ADMIN=true
VITE_ENABLE_AUDIT=true

# ─── ANALYTICS (Add your IDs) ───────────────────────────────────────────────
VITE_GA_ID=
VITE_FB_PIXEL_ID=
`
  await fs.writeFile(path.join(sitePath, '.env'), envContent)
  console.log('   ✓ .env file created\n')

  // Step 3: Update CNAME
  console.log('🌐 Setting up domain...')
  await fs.writeFile(path.join(sitePath, 'CNAME'), domain)
  console.log('   ✓ CNAME updated\n')

  // Step 4: Update package.json
  console.log('📦 Updating package.json...')
  const packageJsonPath = path.join(sitePath, 'package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
  packageJson.name = siteId
  packageJson.description = `${name} - Generated from XTX396 template`
  packageJson.homepage = `https://${domain}`
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('   ✓ package.json updated\n')

  // Step 5: Update runtime.config.json
  console.log('⚙️  Updating runtime config...')
  const runtimeConfigPath = path.join(sitePath, 'runtime.config.json')
  try {
    const runtimeConfig = JSON.parse(await fs.readFile(runtimeConfigPath, 'utf8'))
    runtimeConfig.siteName = name
    runtimeConfig.domain = domain
    runtimeConfig.siteId = siteId
    runtimeConfig.preset = preset
    await fs.writeFile(runtimeConfigPath, JSON.stringify(runtimeConfig, null, 2))
    console.log('   ✓ runtime.config.json updated\n')
  } catch {
    console.log('   ⚠ No runtime.config.json found, skipping\n')
  }

  // Step 6: Initialize git (optional)
  console.log('🗄️  Initializing git repository...')
  try {
    execSync('git init', { cwd: sitePath, stdio: 'pipe' })
    execSync('git add -A', { cwd: sitePath, stdio: 'pipe' })
    execSync(`git commit -m "Initial site generation from XTX396 template"`, { cwd: sitePath, stdio: 'pipe' })
    console.log('   ✓ Git repository initialized\n')
  } catch (err) {
    console.log('   ⚠ Git initialization skipped\n')
  }

  // Summary
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║                    SITE GENERATED SUCCESSFULLY               ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')

  console.log('📂 Site location:', sitePath)
  console.log('\n🔐 Admin Credentials (SAVE THESE):')
  console.log(`   Email:    ${adminEmail}`)
  console.log(`   Password: ${adminPassword}`)
  
  console.log('\n📋 Next Steps:')
  console.log(`   1. cd "${sitePath}"`)
  console.log('   2. npm install')
  console.log('   3. npm run dev          # Local development')
  console.log('   4. npm run build        # Production build')
  console.log('   5. Configure DNS for ' + domain)
  console.log('   6. Deploy to hosting (Netlify, Vercel, GitHub Pages)\n')

  return {
    sitePath,
    siteId,
    adminEmail,
    adminPassword,
    preset
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2)
  const options = {}
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg === '--list-presets' || arg === '-l') {
      options.listPresets = true
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--name' || arg === '-n') {
      options.name = args[++i]
    } else if (arg === '--domain' || arg === '-d') {
      options.domain = args[++i]
    } else if (arg === '--admin' || arg === '-a') {
      options.adminEmail = args[++i]
    } else if (arg === '--password' || arg === '-p') {
      options.adminPassword = args[++i]
    } else if (arg === '--preset') {
      options.preset = args[++i]
    } else if (arg === '--output' || arg === '-o') {
      options.outputDir = args[++i]
    }
  }
  
  return options
}

function showHelp() {
  console.log(`
XTX396 Site Generator
=====================

Generate customized website clones for rapid deployment.

Usage:
  node scripts/generate-site.mjs [options]

Options:
  -n, --name <name>       Site name (required)
  -d, --domain <domain>   Domain name (required)
  -a, --admin <email>     Admin email address (required)
  -p, --password <pass>   Admin password (optional, auto-generated if not set)
  --preset <preset>       Use a preset configuration (see --list-presets)
  -o, --output <dir>      Output directory (optional)
  -l, --list-presets      Show available presets
  -h, --help              Show this help message

Examples:
  # Generate a law firm site
  node scripts/generate-site.mjs \\
    --name "Smith & Associates" \\
    --domain smithlaw.com \\
    --admin john@smithlaw.com \\
    --preset law-firm

  # Generate a basic business site
  node scripts/generate-site.mjs \\
    -n "My Business" \\
    -d mybusiness.com \\
    -a admin@mybusiness.com

  # List available presets
  node scripts/generate-site.mjs --list-presets
`)
}

function showPresets() {
  console.log('\nAvailable Presets:\n')
  for (const [key, preset] of Object.entries(PRESETS)) {
    console.log(`  ${key}`)
    console.log(`    ${preset.description}`)
    console.log(`    Features: ${preset.features.join(', ')}`)
    console.log(`    Pages: ${preset.pages.join(', ')}\n`)
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const options = parseArgs()
  
  if (options.help) {
    showHelp()
    process.exit(0)
  }
  
  if (options.listPresets) {
    showPresets()
    process.exit(0)
  }
  
  // Validate required options
  if (!options.name || !options.domain || !options.adminEmail) {
    console.error('\n❌ Error: Missing required options')
    console.error('   Required: --name, --domain, --admin')
    console.error('\n   Run with --help for usage information\n')
    process.exit(1)
  }
  
  try {
    await generateSite(options)
  } catch (error) {
    console.error('\n❌ Error generating site:', error.message)
    process.exit(1)
  }
}

main()
