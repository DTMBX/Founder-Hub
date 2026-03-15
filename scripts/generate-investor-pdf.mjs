/**
 * generate-investor-pdf.mjs
 *
 * Renders scripts/investor-onesheet.html to a US Letter PDF using Puppeteer.
 * Output: public/downloads/devon-tyler-barber-overview.pdf
 *
 * Run:  node scripts/generate-investor-pdf.mjs
 *
 * Requires: puppeteer (installed as devDependency)
 */

import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const HTML_PATH = resolve(__dirname, 'investor-onesheet.html')
const OUT_DIR = resolve(ROOT, 'public/downloads')
const OUT_PATH = resolve(OUT_DIR, 'devon-tyler-barber-overview.pdf')

mkdirSync(OUT_DIR, { recursive: true })

async function generate() {
  let puppeteer
  try {
    puppeteer = await import('puppeteer')
  } catch {
    console.warn('⚠ puppeteer not installed — skipping PDF generation')
    console.warn('  Install with: npm i -D puppeteer')
    return
  }

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    const fileUrl = pathToFileURL(HTML_PATH).href
    await page.goto(fileUrl, { waitUntil: 'networkidle0' })

    await page.pdf({
      path: OUT_PATH,
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    console.log(`✔ Investor PDF → ${OUT_PATH}`)
  } finally {
    await browser.close()
  }
}

generate().catch((err) => {
  console.error('PDF generation failed:', err.message)
  process.exit(1)
})
