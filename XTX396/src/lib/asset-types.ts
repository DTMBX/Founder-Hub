export type AssetCategory = 'flags' | 'logos' | 'icons' | 'backgrounds' | 'maps' | 'other'

export type ThemeSuitability = 'light' | 'dark' | 'both'

export type UsageIntent = 'hero' | 'accent' | 'watermark' | 'icon' | 'gallery' | 'divider' | 'background'

export type ColorTreatment = 'original' | 'monochrome-white' | 'monochrome-muted' | 'accent-tinted'

export type AudienceMode = 'investors' | 'legal' | 'friends' | 'all'

export interface AssetMetadata {
  id: string
  fileName: string
  filePath: string
  format: 'svg' | 'png' | 'jpg' | 'webp' | 'mp4'
  category: AssetCategory
  dimensions?: { width: number; height: number }
  fileSize: number
  
  tags: string[]
  themeSuitability: ThemeSuitability
  usageIntent: UsageIntent[]
  colorTreatment: ColorTreatment
  
  licensingNotes?: string
  sourceNotes?: string
  
  isPrimaryBrandMark?: boolean
  isSecondaryBrandMark?: boolean
  
  allowedAudiences: AudienceMode[]
  
  whereUsed: string[]
  
  uploadedAt: number
  lastModified: number
}

export interface UsagePolicy {
  publicFlags: string[]
  restrictedFlags: string[]
  audienceSpecificFlags: {
    investors: string[]
    legal: string[]
    friends: string[]
  }
}

export interface HeroAccentSettings {
  enabled: boolean
  assetId?: string
  position: 'corner-left' | 'corner-right' | 'watermark' | 'full-background'
  opacity: number
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay'
}

export interface FlagGallerySettings {
  enabled: boolean
  enabledForAudiences: AudienceMode[]
  title: string
  description: string
  flagAssetIds: string[]
}

export interface MapSpotlightSettings {
  enabled: boolean
  assetId?: string
  animationType: 'outline' | 'pulse' | 'gradient' | 'none'
  animationSpeed: number
  animationIntensity: number
  placement: 'hero' | 'about' | 'footer'
  respectReducedMotion: boolean
}

export interface AssetSuggestion {
  assetId: string
  suggestion: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  type: 'placement' | 'optimization' | 'warning'
}

export interface AssetUsageReport {
  totalAssets: number
  usedOnPublicLanding: string[]
  usedInCourtSection: string[]
  unusedAssets: string[]
  oversizedAssets: string[]
  categoryBreakdown: Record<AssetCategory, number>
}

export interface VisualSet {
  id: string
  name: string
  description: string
  assetOverrides: Record<string, string>
  enabledAssets: string[]
  disabledAssets: string[]
}
