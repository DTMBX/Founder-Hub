import type { AssetMetadata, AssetCategory, AssetSuggestion, AssetUsageReport } from './asset-types'

const IMAGE_ASSETS = import.meta.glob('../assets/images/*.{svg,png,jpg,jpeg,webp}', { eager: true, import: 'default' }) as Record<string, string>
const VIDEO_ASSETS = import.meta.glob('../assets/video/*.{mp4,webm}', { eager: true, import: 'default' }) as Record<string, string>

export async function scanAssets(): Promise<AssetMetadata[]> {
  const assets: AssetMetadata[] = []
  
  const allAssets = { ...IMAGE_ASSETS, ...VIDEO_ASSETS }
  
  for (const [path, url] of Object.entries(allAssets)) {
    const fileName = path.split('/').pop() || ''
    const format = fileName.split('.').pop()?.toLowerCase() as AssetMetadata['format']
    
    const asset: AssetMetadata = {
      id: generateAssetId(path),
      fileName,
      filePath: path,
      format,
      category: categorizeAsset(fileName, path),
      fileSize: 0,
      tags: generateTags(fileName),
      themeSuitability: inferThemeSuitability(fileName),
      usageIntent: inferUsageIntent(fileName, format),
      colorTreatment: 'original',
      allowedAudiences: ['all'],
      whereUsed: [],
      uploadedAt: Date.now(),
      lastModified: Date.now(),
    }
    
    try {
      if (format && format !== 'mp4') {
        const dimensions = await getImageDimensions(url)
        asset.dimensions = dimensions
      }
      
      const blob = await fetch(url).then(r => r.blob())
      asset.fileSize = blob.size
    } catch (e) {
      console.warn(`Failed to load asset: ${path}`, e)
    }
    
    assets.push(asset)
  }
  
  return assets
}

function generateAssetId(path: string): string {
  return btoa(path).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16)
}

function categorizeAsset(fileName: string, path: string): AssetCategory {
  const lowerName = fileName.toLowerCase()
  
  if (lowerName.includes('flag') || 
      lowerName.includes('gadsden') || 
      lowerName.includes('betsy') ||
      lowerName.includes('ross') ||
      lowerName.includes('appeal') ||
      lowerName.includes('gonzales') ||
      lowerName.includes('pow') ||
      lowerName.includes('mia') ||
      lowerName.includes('us-flag')) {
    return 'flags'
  }
  
  if (lowerName.includes('logo') || 
      lowerName.includes('evident') ||
      lowerName.includes('brand') ||
      lowerName.includes('mark')) {
    return 'logos'
  }
  
  if (lowerName.includes('map') || 
      lowerName.includes('states') ||
      lowerName.includes('geography')) {
    return 'maps'
  }
  
  if (lowerName.includes('icon') || lowerName.includes('symbol')) {
    return 'icons'
  }
  
  if (lowerName.includes('bg') || 
      lowerName.includes('background') ||
      lowerName.includes('texture')) {
    return 'backgrounds'
  }
  
  return 'other'
}

function generateTags(fileName: string): string[] {
  const tags: string[] = []
  const lowerName = fileName.toLowerCase()
  
  const tagMap: Record<string, string> = {
    'gadsden': 'Gadsden Flag',
    'betsy': 'Betsy Ross Flag',
    'ross': 'Betsy Ross Flag',
    'appeal': 'Appeal to Heaven',
    'gonzales': 'Come and Take It',
    'pow': 'POW/MIA',
    'mia': 'POW/MIA',
    'us-flag': 'US Flag',
    '50': '50 Stars',
    '13': '13 Colonies',
    'logo': 'Logo',
    'evident': 'EVIDENT',
    'map': 'Map',
    'states': 'US States',
    'dark': 'Dark Variant',
    'light': 'Light Variant',
  }
  
  for (const [keyword, tag] of Object.entries(tagMap)) {
    if (lowerName.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag)
    }
  }
  
  return tags
}

function inferThemeSuitability(fileName: string): 'light' | 'dark' | 'both' {
  const lowerName = fileName.toLowerCase()
  
  if (lowerName.includes('dark')) return 'dark'
  if (lowerName.includes('light')) return 'light'
  
  return 'both'
}

function inferUsageIntent(fileName: string, format: string): AssetMetadata['usageIntent'] {
  const lowerName = fileName.toLowerCase()
  const intents: AssetMetadata['usageIntent'] = []
  
  if (lowerName.includes('hero') || format === 'mp4' || format === 'webm') {
    intents.push('hero')
  }
  
  if (lowerName.includes('logo') || lowerName.includes('mark')) {
    intents.push('icon')
    intents.push('accent')
  }
  
  if (lowerName.includes('flag')) {
    intents.push('gallery')
    intents.push('accent')
  }
  
  if (lowerName.includes('map')) {
    intents.push('background')
    intents.push('accent')
  }
  
  if (lowerName.includes('watermark') || lowerName.includes('transparent')) {
    intents.push('watermark')
  }
  
  if (intents.length === 0) {
    intents.push('accent')
  }
  
  return intents
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = url
  })
}

export function generateSuggestions(asset: AssetMetadata): AssetSuggestion[] {
  const suggestions: AssetSuggestion[] = []
  
  if (!asset.dimensions) return suggestions
  
  const { width, height } = asset.dimensions
  const aspectRatio = width / height
  
  if (asset.fileSize > 500000) {
    suggestions.push({
      assetId: asset.id,
      suggestion: 'Consider optimizing this asset',
      reason: `File size is ${(asset.fileSize / 1024).toFixed(0)}KB. Large assets can impact performance.`,
      confidence: 'high',
      type: 'warning',
    })
  }
  
  if (asset.category === 'flags' && height > 400) {
    suggestions.push({
      assetId: asset.id,
      suggestion: 'Ideal for gallery display',
      reason: 'High resolution flag image works well in Heritage Flags gallery module',
      confidence: 'high',
      type: 'placement',
    })
  }
  
  if (asset.category === 'flags' && height <= 100) {
    suggestions.push({
      assetId: asset.id,
      suggestion: 'Ideal for badge or accent use',
      reason: 'Small dimensions make this perfect for subtle badge placements',
      confidence: 'high',
      type: 'placement',
    })
  }
  
  if (asset.category === 'logos' && asset.format === 'svg') {
    suggestions.push({
      assetId: asset.id,
      suggestion: 'Perfect for responsive branding',
      reason: 'SVG format ensures sharp display at any size',
      confidence: 'high',
      type: 'placement',
    })
  }
  
  if (asset.category === 'maps' && asset.format === 'svg') {
    suggestions.push({
      assetId: asset.id,
      suggestion: 'Enable USA Map Spotlight feature',
      reason: 'SVG maps support animation and interactive features',
      confidence: 'high',
      type: 'placement',
    })
  }
  
  if (aspectRatio > 3 || aspectRatio < 0.3) {
    suggestions.push({
      assetId: asset.id,
      suggestion: 'Ideal as divider or decorative element',
      reason: `Extreme aspect ratio (${aspectRatio.toFixed(2)}) works well as visual separator`,
      confidence: 'medium',
      type: 'placement',
    })
  }
  
  if (asset.format === 'png' && width > 2000) {
    suggestions.push({
      assetId: asset.id,
      suggestion: 'Too large for inline use',
      reason: `${width}x${height} PNG should be used sparingly or converted to optimized format`,
      confidence: 'high',
      type: 'optimization',
    })
  }
  
  return suggestions
}

export function generateUsageReport(assets: AssetMetadata[]): AssetUsageReport {
  const report: AssetUsageReport = {
    totalAssets: assets.length,
    usedOnPublicLanding: [],
    usedInCourtSection: [],
    unusedAssets: [],
    oversizedAssets: [],
    categoryBreakdown: {
      flags: 0,
      logos: 0,
      icons: 0,
      backgrounds: 0,
      maps: 0,
      other: 0,
    },
  }
  
  for (const asset of assets) {
    report.categoryBreakdown[asset.category]++
    
    if (asset.whereUsed.length === 0) {
      report.unusedAssets.push(asset.id)
    } else {
      const usageContexts = asset.whereUsed.join(' ')
      if (usageContexts.includes('landing') || usageContexts.includes('hero') || usageContexts.includes('public')) {
        report.usedOnPublicLanding.push(asset.id)
      }
      if (usageContexts.includes('court') || usageContexts.includes('case')) {
        report.usedInCourtSection.push(asset.id)
      }
    }
    
    if (asset.fileSize > 500000) {
      report.oversizedAssets.push(asset.id)
    }
  }
  
  return report
}

export function sanitizeSVG(svgContent: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgContent, 'image/svg+xml')
  
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link']
  dangerousTags.forEach(tag => {
    const elements = doc.getElementsByTagName(tag)
    Array.from(elements).forEach(el => el.remove())
  })
  
  const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover']
  const allElements = doc.getElementsByTagName('*')
  Array.from(allElements).forEach(el => {
    dangerousAttrs.forEach(attr => {
      if (el.hasAttribute(attr)) {
        el.removeAttribute(attr)
      }
    })
  })
  
  return new XMLSerializer().serializeToString(doc)
}
