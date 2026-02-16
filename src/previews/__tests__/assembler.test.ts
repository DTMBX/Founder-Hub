/**
 * Montage Assembler Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createScenePlaylist,
  generateFfmpegConcatList,
  generateFfmpegFilterComplex,
  calculateAssemblyStats,
  createMontageMetadata,
  getAssemblyPaths,
  validateAssemblyInputs,
  selectAssemblyStrategy,
  selectPosterScene,
  createExportManifest,
  DEFAULT_ASSEMBLY_OPTIONS,
} from '../assembler'
import type { PreviewMontage, SceneMeta, PreviewMeta } from '../preview.types'

// ─── Test Fixtures ───────────────────────────────────────────

const mockSceneMetas: SceneMeta[] = [
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
]

const mockMontage: PreviewMontage = {
  offerId: 'law-firm-72-hour-launch',
  title: 'Law Firm – 72 Hour Launch',
  description: 'Professional law firm websites.',
  scenes: [
    { sceneId: 'scene-001', label: 'Criminal Defense', siteType: 'law-firm', presetId: 'criminal-dark', verticalId: 'lawfirm_criminal' },
    { sceneId: 'scene-002', label: 'Personal Injury', siteType: 'law-firm', presetId: 'injury-bold', verticalId: 'lawfirm_injury' },
    { sceneId: 'scene-003', label: 'Family Law', siteType: 'law-firm', presetId: 'family-warm', verticalId: 'lawfirm_family', cameraMotion: 'pan-hero' },
  ],
  viewport: { width: 1280, height: 720 },
  defaultDurationSeconds: 2.0,
  defaultCameraMotion: 'scroll-down',
}

// ─── Default Options ─────────────────────────────────────────

describe('DEFAULT_ASSEMBLY_OPTIONS', () => {
  it('has sensible defaults', () => {
    expect(DEFAULT_ASSEMBLY_OPTIONS.strategy).toBe('scene-playlist')
    expect(DEFAULT_ASSEMBLY_OPTIONS.transitionStyle).toBe('crossfade')
    expect(DEFAULT_ASSEMBLY_OPTIONS.transitionDuration).toBe(0.3)
    expect(DEFAULT_ASSEMBLY_OPTIONS.outputFormat).toBe('webm')
    expect(DEFAULT_ASSEMBLY_OPTIONS.quality).toBe(80)
  })
})

// ─── Playlist Generation ─────────────────────────────────────

describe('createScenePlaylist', () => {
  it('creates playlist with correct structure', () => {
    const playlist = createScenePlaylist(mockMontage, mockSceneMetas)
    
    expect(playlist.offerId).toBe('law-firm-72-hour-launch')
    expect(playlist.title).toBe('Law Firm – 72 Hour Launch')
    expect(playlist.entries).toHaveLength(3)
  })

  it('calculates correct timing', () => {
    const playlist = createScenePlaylist(mockMontage, mockSceneMetas)
    
    expect(playlist.entries[0].startTime).toBe(0)
    expect(playlist.entries[0].endTime).toBe(2.0)
    
    expect(playlist.entries[1].startTime).toBe(2.0)
    expect(playlist.entries[1].endTime).toBe(4.5)
    
    expect(playlist.entries[2].startTime).toBe(4.5)
    expect(playlist.entries[2].endTime).toBe(6.3)
  })

  it('calculates total duration', () => {
    const playlist = createScenePlaylist(mockMontage, mockSceneMetas)
    expect(playlist.totalDuration).toBe(6.3)
  })

  it('includes transition style', () => {
    const playlist = createScenePlaylist(mockMontage, mockSceneMetas, {
      transitionStyle: 'slide-left',
      transitionDuration: 0.5,
    })
    
    expect(playlist.transitionStyle).toBe('slide-left')
    expect(playlist.transitionDuration).toBe(0.5)
  })

  it('uses default transition values', () => {
    const playlist = createScenePlaylist(mockMontage, mockSceneMetas)
    
    expect(playlist.transitionStyle).toBe('crossfade')
    expect(playlist.transitionDuration).toBe(0.3)
  })

  it('maps video and thumbnail sources', () => {
    const playlist = createScenePlaylist(mockMontage, mockSceneMetas)
    
    expect(playlist.entries[0].videoSrc).toBe('scenes/scene-001.webm')
    expect(playlist.entries[0].thumbnailSrc).toBe('thumbs/scene-001.png')
  })
})

// ─── FFmpeg Concat ───────────────────────────────────────────

describe('generateFfmpegConcatList', () => {
  it('generates concat demuxer format', () => {
    const list = generateFfmpegConcatList(mockSceneMetas)
    
    expect(list).toContain("file 'scenes/scene-001.webm'")
    expect(list).toContain("duration 2")
    expect(list).toContain("file 'scenes/scene-002.webm'")
    expect(list).toContain("duration 2.5")
  })

  it('handles empty array', () => {
    const list = generateFfmpegConcatList([])
    expect(list).toBe('')
  })

  it('skips scenes without video', () => {
    const scenesWithMissing: SceneMeta[] = [
      { ...mockSceneMetas[0] },
      { ...mockSceneMetas[1], videoFilename: null },
      { ...mockSceneMetas[2] },
    ]
    
    const list = generateFfmpegConcatList(scenesWithMissing)
    expect(list).not.toContain('scene-002')
  })
})

describe('generateFfmpegFilterComplex', () => {
  it('generates simple concat for single scene', () => {
    const filter = generateFfmpegFilterComplex([mockSceneMetas[0]])
    expect(filter).toBe('[0:v][0:a]concat=n=1:v=1:a=0[outv]')
  })

  it('generates xfade for multiple scenes', () => {
    const filter = generateFfmpegFilterComplex(mockSceneMetas, 0.3)
    
    expect(filter).toContain('xfade')
    expect(filter).toContain('transition=fade')
    expect(filter).toContain('duration=0.3')
  })

  it('includes offset based on scene duration', () => {
    const filter = generateFfmpegFilterComplex(mockSceneMetas, 0.3)
    // First scene is 2.0s, offset should be 2.0 - 0.3 = 1.7
    expect(filter).toContain('offset=1.7')
  })
})

// ─── Assembly Statistics ─────────────────────────────────────

describe('calculateAssemblyStats', () => {
  it('calculates correct statistics', () => {
    const stats = calculateAssemblyStats(mockSceneMetas, 5000, 1024000)
    
    expect(stats.totalScenes).toBe(3)
    expect(stats.successfulScenes).toBe(3)
    expect(stats.failedScenes).toBe(0)
    expect(stats.totalDurationSeconds).toBe(6.3)
    expect(stats.assemblyTimeMs).toBe(5000)
    expect(stats.outputSizeBytes).toBe(1024000)
  })

  it('counts failed scenes', () => {
    const scenesWithFailed: SceneMeta[] = [
      { ...mockSceneMetas[0] },
      { ...mockSceneMetas[1], videoFilename: null },
      { ...mockSceneMetas[2], videoFilename: null },
    ]
    
    const stats = calculateAssemblyStats(scenesWithFailed, 3000, 512000)
    
    expect(stats.successfulScenes).toBe(1)
    expect(stats.failedScenes).toBe(2)
  })
})

// ─── Meta Generation ─────────────────────────────────────────

describe('createMontageMetadata', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates metadata with all fields', () => {
    const meta = createMontageMetadata(
      mockMontage,
      mockSceneMetas,
      DEFAULT_ASSEMBLY_OPTIONS,
      'montage.webm'
    )
    
    expect(meta.offerId).toBe('law-firm-72-hour-launch')
    expect(meta.title).toBe('Law Firm – 72 Hour Launch')
    expect(meta.description).toBe('Professional law firm websites.')
    expect(meta.generatedAt).toBe('2025-01-15T12:00:00.000Z')
    expect(meta.totalDurationSeconds).toBe(6.3)
    expect(meta.viewport).toEqual({ width: 1280, height: 720 })
    expect(meta.assemblyStrategy).toBe('scene-playlist')
    expect(meta.videoFilename).toBe('montage.webm')
    expect(meta.posterFilename).toBe('poster.png')
    expect(meta.scenes).toHaveLength(3)
  })
})

// ─── Path Utilities ──────────────────────────────────────────

describe('getAssemblyPaths', () => {
  it('generates all paths', () => {
    const paths = getAssemblyPaths('/output', 'law-firm-launch', 'webm')
    
    expect(paths.outputDir).toBe('/output/law-firm-launch')
    expect(paths.videoFile).toBe('/output/law-firm-launch/montage.webm')
    expect(paths.posterFile).toBe('/output/law-firm-launch/poster.png')
    expect(paths.metaFile).toBe('/output/law-firm-launch/meta.json')
    expect(paths.playlistFile).toBe('/output/law-firm-launch/playlist.json')
    expect(paths.concatListFile).toBe('/output/law-firm-launch/concat.txt')
    expect(paths.thumbsDir).toBe('/output/law-firm-launch/thumbs')
    expect(paths.scenesDir).toBe('/output/law-firm-launch/scenes')
  })

  it('uses mp4 format', () => {
    const paths = getAssemblyPaths('/output', 'test', 'mp4')
    expect(paths.videoFile).toBe('/output/test/montage.mp4')
  })
})

// ─── Validation ──────────────────────────────────────────────

describe('validateAssemblyInputs', () => {
  it('returns empty array for valid inputs', () => {
    const errors = validateAssemblyInputs(mockMontage, mockSceneMetas)
    expect(errors).toHaveLength(0)
  })

  it('reports missing offerId', () => {
    const invalid = { ...mockMontage, offerId: '' }
    const errors = validateAssemblyInputs(invalid, mockSceneMetas)
    expect(errors).toContain('Montage offerId is required')
  })

  it('reports empty scenes', () => {
    const errors = validateAssemblyInputs(mockMontage, [])
    expect(errors).toContain('At least one recorded scene is required')
  })

  it('reports scene count mismatch', () => {
    const errors = validateAssemblyInputs(mockMontage, [mockSceneMetas[0]])
    expect(errors.some(e => e.includes('Scene count mismatch'))).toBe(true)
  })

  it('reports missing thumbnails', () => {
    const scenesNoThumb: SceneMeta[] = [
      { ...mockSceneMetas[0], thumbnailFilename: '' },
      { ...mockSceneMetas[1] },
      { ...mockSceneMetas[2], thumbnailFilename: '' },
    ]
    
    const errors = validateAssemblyInputs(mockMontage, scenesNoThumb)
    expect(errors.some(e => e.includes('missing thumbnails'))).toBe(true)
  })
})

// ─── Strategy Selection ──────────────────────────────────────

describe('selectAssemblyStrategy', () => {
  it('returns single-run for single scene', () => {
    const strategy = selectAssemblyStrategy([mockSceneMetas[0]], 'ffmpeg-concat', true)
    expect(strategy).toBe('single-run')
  })

  it('falls back from ffmpeg-concat without ffmpeg', () => {
    const strategy = selectAssemblyStrategy(mockSceneMetas, 'ffmpeg-concat', false)
    expect(strategy).toBe('scene-playlist')
  })

  it('falls back when not all scenes have videos', () => {
    const scenesNoVideo: SceneMeta[] = [
      { ...mockSceneMetas[0] },
      { ...mockSceneMetas[1], videoFilename: null },
    ]
    
    const strategy = selectAssemblyStrategy(scenesNoVideo, 'ffmpeg-concat', true)
    expect(strategy).toBe('scene-playlist')
  })

  it('uses preferred strategy when valid', () => {
    expect(selectAssemblyStrategy(mockSceneMetas, 'scene-playlist', true)).toBe('scene-playlist')
    expect(selectAssemblyStrategy(mockSceneMetas, 'ffmpeg-concat', true)).toBe('ffmpeg-concat')
  })
})

// ─── Poster Selection ────────────────────────────────────────

describe('selectPosterScene', () => {
  it('returns null for empty scenes', () => {
    const scene = selectPosterScene(mockMontage, [])
    expect(scene).toBeNull()
  })

  it('prefers scene with pan-hero motion', () => {
    const scene = selectPosterScene(mockMontage, mockSceneMetas)
    expect(scene?.sceneId).toBe('scene-003') // Has pan-hero
  })

  it('falls back to first scene if no pan-hero', () => {
    const montageNoPanHero: PreviewMontage = {
      ...mockMontage,
      scenes: mockMontage.scenes.map(s => ({ ...s, cameraMotion: 'scroll-down' as const })),
    }
    
    const scene = selectPosterScene(montageNoPanHero, mockSceneMetas)
    expect(scene?.sceneId).toBe('scene-001')
  })
})

// ─── Export Manifest ─────────────────────────────────────────

describe('createExportManifest', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates manifest with totals', () => {
    const meta: PreviewMeta = {
      offerId: 'test-offer',
      title: 'Test Montage',
      description: 'Test',
      generatorVersion: '1.0.0',
      generatedAt: '2025-01-15T12:00:00Z',
      totalDurationSeconds: 6.3,
      viewport: { width: 1280, height: 720 },
      assemblyStrategy: 'scene-playlist',
      videoFilename: 'montage.webm',
      posterFilename: 'poster.png',
      scenes: mockSceneMetas,
    }
    
    const manifest = createExportManifest([meta])
    
    expect(manifest.totalMontages).toBe(1)
    expect(manifest.totalScenes).toBe(3)
    expect(manifest.totalDurationSeconds).toBe(6.3)
  })

  it('determines status correctly', () => {
    const complete: PreviewMeta = {
      offerId: 'complete',
      title: 'Complete',
      generatorVersion: '1.0.0',
      generatedAt: '2025-01-15T12:00:00Z',
      totalDurationSeconds: 4.0,
      viewport: { width: 1280, height: 720 },
      assemblyStrategy: 'scene-playlist',
      videoFilename: 'montage.webm',
      posterFilename: 'poster.png',
      scenes: mockSceneMetas,
    }
    
    const partial: PreviewMeta = {
      ...complete,
      offerId: 'partial',
      title: 'Partial',
      scenes: [
        { ...mockSceneMetas[0] },
        { ...mockSceneMetas[1], videoFilename: null },
      ],
    }
    
    const failed: PreviewMeta = {
      ...complete,
      offerId: 'failed',
      title: 'Failed',
      scenes: [
        { ...mockSceneMetas[0], videoFilename: null },
        { ...mockSceneMetas[1], videoFilename: null },
      ],
    }
    
    const manifest = createExportManifest([complete, partial, failed])
    
    expect(manifest.montages.find(m => m.offerId === 'complete')?.status).toBe('complete')
    expect(manifest.montages.find(m => m.offerId === 'partial')?.status).toBe('partial')
    expect(manifest.montages.find(m => m.offerId === 'failed')?.status).toBe('failed')
  })
})
