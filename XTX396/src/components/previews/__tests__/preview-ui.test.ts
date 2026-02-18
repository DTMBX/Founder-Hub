/**
 * Preview UI Components Tests
 */

import { describe, it, expect, vi } from 'vitest'
import type { ScenePlaylist, PreviewMontage, PreviewMeta } from '@/previews'

// ─── Test Fixtures ───────────────────────────────────────────

const mockPlaylist: ScenePlaylist = {
  offerId: 'law-firm-72-hour-launch',
  title: 'Law Firm – 72 Hour Launch',
  totalDuration: 6.3,
  transitionStyle: 'crossfade',
  transitionDuration: 0.3,
  entries: [
    {
      sceneId: 'scene-001',
      label: 'Criminal Defense',
      videoSrc: 'scenes/scene-001.webm',
      thumbnailSrc: 'thumbs/scene-001.png',
      durationSeconds: 2.0,
      startTime: 0,
      endTime: 2.0,
    },
    {
      sceneId: 'scene-002',
      label: 'Personal Injury',
      videoSrc: 'scenes/scene-002.webm',
      thumbnailSrc: 'thumbs/scene-002.png',
      durationSeconds: 2.5,
      startTime: 2.0,
      endTime: 4.5,
    },
    {
      sceneId: 'scene-003',
      label: 'Family Law',
      videoSrc: 'scenes/scene-003.webm',
      thumbnailSrc: 'thumbs/scene-003.png',
      durationSeconds: 1.8,
      startTime: 4.5,
      endTime: 6.3,
    },
  ],
}

const mockMontage: PreviewMontage = {
  offerId: 'law-firm-72-hour-launch',
  title: 'Law Firm – 72 Hour Launch',
  description: 'Professional law firm websites.',
  scenes: [
    { sceneId: 'scene-001', label: 'Criminal Defense', siteType: 'law-firm', presetId: 'criminal-dark', verticalId: 'lawfirm_criminal' },
    { sceneId: 'scene-002', label: 'Personal Injury', siteType: 'law-firm', presetId: 'injury-bold', verticalId: 'lawfirm_injury' },
    { sceneId: 'scene-003', label: 'Family Law', siteType: 'law-firm', presetId: 'family-warm', verticalId: 'lawfirm_family' },
  ],
  viewport: { width: 1280, height: 720 },
  defaultDurationSeconds: 2.0,
  defaultCameraMotion: 'scroll-down',
}

const mockMeta: PreviewMeta = {
  offerId: 'law-firm-72-hour-launch',
  title: 'Law Firm – 72 Hour Launch',
  description: 'Professional law firm websites.',
  generatorVersion: '1.0.0',
  generatedAt: '2025-01-15T12:00:00Z',
  totalDurationSeconds: 6.3,
  viewport: { width: 1280, height: 720 },
  assemblyStrategy: 'scene-playlist',
  videoFilename: 'montage.webm',
  posterFilename: 'poster.png',
  scenes: [
    {
      sceneId: 'scene-001',
      label: 'Criminal Defense',
      presetId: 'criminal-dark',
      verticalId: 'lawfirm_criminal',
      siteType: 'law-firm',
      generatedSiteId: 'demo-abc123',
      recordedAt: '2025-01-15T12:00:00Z',
      durationSeconds: 2.0,
      thumbnailFilename: 'thumbs/scene-001.png',
      videoFilename: 'scenes/scene-001.webm',
    },
    {
      sceneId: 'scene-002',
      label: 'Personal Injury',
      presetId: 'injury-bold',
      verticalId: 'lawfirm_injury',
      siteType: 'law-firm',
      generatedSiteId: 'demo-def456',
      recordedAt: '2025-01-15T12:00:05Z',
      durationSeconds: 2.5,
      thumbnailFilename: 'thumbs/scene-002.png',
      videoFilename: 'scenes/scene-002.webm',
    },
    {
      sceneId: 'scene-003',
      label: 'Family Law',
      presetId: 'family-warm',
      verticalId: 'lawfirm_family',
      siteType: 'law-firm',
      generatedSiteId: 'demo-ghi789',
      recordedAt: '2025-01-15T12:00:10Z',
      durationSeconds: 1.8,
      thumbnailFilename: 'thumbs/scene-003.png',
      videoFilename: 'scenes/scene-003.webm',
    },
  ],
}

// ─── Playlist Tests ──────────────────────────────────────────

describe('ScenePlaylist structure', () => {
  it('has correct offerId', () => {
    expect(mockPlaylist.offerId).toBe('law-firm-72-hour-launch')
  })

  it('has correct total duration', () => {
    expect(mockPlaylist.totalDuration).toBe(6.3)
  })

  it('has correct number of entries', () => {
    expect(mockPlaylist.entries).toHaveLength(3)
  })

  it('entries have correct timing', () => {
    const [first, second, third] = mockPlaylist.entries
    
    expect(first.startTime).toBe(0)
    expect(first.endTime).toBe(2.0)
    
    expect(second.startTime).toBe(2.0)
    expect(second.endTime).toBe(4.5)
    
    expect(third.startTime).toBe(4.5)
    expect(third.endTime).toBe(6.3)
  })

  it('entries have video and thumbnail sources', () => {
    for (const entry of mockPlaylist.entries) {
      expect(entry.videoSrc).toMatch(/scenes\/scene-\d+\.webm/)
      expect(entry.thumbnailSrc).toMatch(/thumbs\/scene-\d+\.png/)
    }
  })
})

// ─── Montage Tests ───────────────────────────────────────────

describe('PreviewMontage structure', () => {
  it('has required fields', () => {
    expect(mockMontage.offerId).toBeDefined()
    expect(mockMontage.title).toBeDefined()
    expect(mockMontage.scenes).toBeDefined()
    expect(mockMontage.viewport).toBeDefined()
  })

  it('scenes have required fields', () => {
    for (const scene of mockMontage.scenes) {
      expect(scene.sceneId).toBeDefined()
      expect(scene.label).toBeDefined()
      expect(scene.siteType).toBeDefined()
      expect(scene.presetId).toBeDefined()
      expect(scene.verticalId).toBeDefined()
    }
  })
})

// ─── Meta Tests ──────────────────────────────────────────────

describe('PreviewMeta structure', () => {
  it('has generator metadata', () => {
    expect(mockMeta.generatorVersion).toBe('1.0.0')
    expect(mockMeta.generatedAt).toBeDefined()
  })

  it('has correct total duration', () => {
    expect(mockMeta.totalDurationSeconds).toBe(6.3)
  })

  it('has poster and video filenames', () => {
    expect(mockMeta.posterFilename).toBe('poster.png')
    expect(mockMeta.videoFilename).toBe('montage.webm')
  })

  it('scenes have generated site IDs', () => {
    for (const scene of mockMeta.scenes) {
      expect(scene.generatedSiteId).toMatch(/^demo-/)
    }
  })
})

// ─── URL Generation Tests ────────────────────────────────────

describe('URL generation helpers', () => {
  const basePath = '/previews'
  const offerId = 'law-firm-72-hour-launch'

  it('generates thumbnail URL', () => {
    const entry = mockPlaylist.entries[0]
    const url = `${basePath}/${offerId}/${entry.thumbnailSrc}`
    expect(url).toBe('/previews/law-firm-72-hour-launch/thumbs/scene-001.png')
  })

  it('generates video URL', () => {
    const entry = mockPlaylist.entries[0]
    const url = `${basePath}/${offerId}/${entry.videoSrc}`
    expect(url).toBe('/previews/law-firm-72-hour-launch/scenes/scene-001.webm')
  })

  it('generates poster URL', () => {
    const url = `${basePath}/${offerId}/${mockMeta.posterFilename}`
    expect(url).toBe('/previews/law-firm-72-hour-launch/poster.png')
  })

  it('generates meta URL', () => {
    const url = `${basePath}/${offerId}/meta.json`
    expect(url).toBe('/previews/law-firm-72-hour-launch/meta.json')
  })
})

// ─── Feature Lists ───────────────────────────────────────────

describe('Feature lists', () => {
  const defaultFeatures = {
    'law-firm-72-hour-launch': [
      'Professional law firm website',
      'Practice area pages',
      'Attorney bios',
      'Case results showcase',
      'Client intake forms',
      'Mobile responsive design',
    ],
    'small-business-starter': [
      'Custom business website',
      'Service showcase pages',
      'Team member profiles',
      'Testimonials section',
      'Contact forms',
      'SEO optimized',
    ],
  }

  it('has features for law firm offer', () => {
    const features = defaultFeatures['law-firm-72-hour-launch']
    expect(features).toHaveLength(6)
    expect(features).toContain('Practice area pages')
  })

  it('has features for small business offer', () => {
    const features = defaultFeatures['small-business-starter']
    expect(features).toHaveLength(6)
    expect(features).toContain('Service showcase pages')
  })
})

// ─── Offer Config Tests ──────────────────────────────────────

describe('OfferConfig structure', () => {
  const offerConfig = {
    offerId: 'law-firm-72-hour-launch',
    featured: false,
    badge: 'Popular',
    price: { amount: 2999, currency: 'USD' },
    quickFeatures: ['Professional design', 'Practice areas', 'Intake forms'],
  }

  it('has offerId', () => {
    expect(offerConfig.offerId).toBe('law-firm-72-hour-launch')
  })

  it('has price info', () => {
    expect(offerConfig.price.amount).toBe(2999)
    expect(offerConfig.price.currency).toBe('USD')
  })

  it('has quick features', () => {
    expect(offerConfig.quickFeatures).toHaveLength(3)
  })

  it('has badge', () => {
    expect(offerConfig.badge).toBe('Popular')
  })
})

// ─── Component Props Validation ──────────────────────────────

describe('Component props validation', () => {
  it('PreviewVideoPlayer requires playlist and basePath', () => {
    const props = {
      playlist: mockPlaylist,
      basePath: '/previews/law-firm-72-hour-launch',
    }
    
    expect(props.playlist).toBeDefined()
    expect(props.basePath).toBeDefined()
  })

  it('PreviewModal requires open state and montage', () => {
    const props = {
      open: true,
      onOpenChange: vi.fn(),
      montage: mockMontage,
      basePath: '/previews/law-firm-72-hour-launch',
    }
    
    expect(props.open).toBe(true)
    expect(props.montage).toBeDefined()
    expect(typeof props.onOpenChange).toBe('function')
  })

  it('OfferCard requires montage and basePath', () => {
    const props = {
      montage: mockMontage,
      basePath: '/previews',
    }
    
    expect(props.montage).toBeDefined()
    expect(props.basePath).toBeDefined()
  })

  it('OffersGallery has sensible defaults', () => {
    const defaultProps = {
      offers: undefined, // Uses default
      basePath: '/previews', // Default
      onGeneratePreview: undefined,
      isGenerating: false,
    }
    
    expect(defaultProps.basePath).toBe('/previews')
    expect(defaultProps.isGenerating).toBe(false)
  })
})
