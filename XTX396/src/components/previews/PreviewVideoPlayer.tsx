/**
 * Preview Video Player
 *
 * A video player component for preview montages.
 * Supports scene-playlist strategy with thumbnail navigation.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ScenePlaylist, PlaylistEntry } from '@/previews'

// ─── Types ───────────────────────────────────────────────────

export interface PreviewVideoPlayerProps {
  /** Playlist data for scene-based playback */
  playlist: ScenePlaylist
  /** Base path for video/thumbnail assets */
  basePath: string
  /** Poster image path */
  posterPath?: string
  /** Whether to autoplay */
  autoPlay?: boolean
  /** Whether to loop the montage */
  loop?: boolean
  /** Whether to show controls */
  showControls?: boolean
  /** Whether to show scene thumbnails */
  showThumbnails?: boolean
  /** Callback when scene changes */
  onSceneChange?: (scene: PlaylistEntry, index: number) => void
  /** Callback when playback completes */
  onComplete?: () => void
  /** Custom className */
  className?: string
}

// ─── Component ───────────────────────────────────────────────

export function PreviewVideoPlayer({
  playlist,
  basePath,
  posterPath,
  autoPlay = false,
  loop = true,
  showControls = true,
  showThumbnails = true,
  onSceneChange,
  onComplete,
  className,
}: PreviewVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  
  const currentScene = playlist.entries[currentSceneIndex]
  const hasMultipleScenes = playlist.entries.length > 1
  
  // ─── Video Source ────────────────────────────────────────────
  
  const getVideoUrl = useCallback((scene: PlaylistEntry) => {
    if (!scene.videoSrc) return null
    return `${basePath}/${scene.videoSrc}`
  }, [basePath])
  
  const getThumbnailUrl = useCallback((scene: PlaylistEntry) => {
    return `${basePath}/${scene.thumbnailSrc}`
  }, [basePath])
  
  // ─── Playback Control ────────────────────────────────────────
  
  const play = useCallback(() => {
    videoRef.current?.play()
    setIsPlaying(true)
  }, [])
  
  const pause = useCallback(() => {
    videoRef.current?.pause()
    setIsPlaying(false)
  }, [])
  
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])
  
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])
  
  // ─── Scene Navigation ────────────────────────────────────────
  
  const goToScene = useCallback((index: number) => {
    if (index < 0 || index >= playlist.entries.length) return
    
    setCurrentSceneIndex(index)
    setIsLoading(true)
    setProgress(0)
    
    const scene = playlist.entries[index]
    onSceneChange?.(scene, index)
  }, [playlist.entries, onSceneChange])
  
  const nextScene = useCallback(() => {
    const nextIndex = currentSceneIndex + 1
    
    if (nextIndex >= playlist.entries.length) {
      if (loop) {
        goToScene(0)
      } else {
        setIsPlaying(false)
        onComplete?.()
      }
    } else {
      goToScene(nextIndex)
    }
  }, [currentSceneIndex, playlist.entries.length, loop, goToScene, onComplete])
  
  const prevScene = useCallback(() => {
    const prevIndex = currentSceneIndex - 1
    if (prevIndex >= 0) {
      goToScene(prevIndex)
    } else if (loop) {
      goToScene(playlist.entries.length - 1)
    }
  }, [currentSceneIndex, loop, goToScene, playlist.entries.length])
  
  // ─── Event Handlers ──────────────────────────────────────────
  
  const handleVideoEnded = useCallback(() => {
    nextScene()
  }, [nextScene])
  
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && currentScene) {
      const video = videoRef.current
      const sceneProgress = (video.currentTime / video.duration) * 100
      setProgress(sceneProgress)
    }
  }, [currentScene])
  
  const handleLoadedData = useCallback(() => {
    setIsLoading(false)
    if (isPlaying) {
      videoRef.current?.play()
    }
  }, [isPlaying])
  
  const handleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement
    if (container?.requestFullscreen) {
      container.requestFullscreen()
    }
  }, [])
  
  // ─── Effects ─────────────────────────────────────────────────
  
  useEffect(() => {
    // Trigger scene change callback on mount
    if (currentScene) {
      onSceneChange?.(currentScene, currentSceneIndex)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  // ─── Render ──────────────────────────────────────────────────
  
  const videoUrl = currentScene ? getVideoUrl(currentScene) : null
  const posterUrl = posterPath ? `${basePath}/${posterPath}` : 
                    currentScene ? getThumbnailUrl(currentScene) : undefined
  
  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden', className)}>
      {/* Video Player */}
      <div className="relative aspect-video">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            preload="none"
            muted={isMuted}
            playsInline
            onEnded={handleVideoEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoadedData={handleLoadedData}
            onClick={togglePlayPause}
            className="w-full h-full object-cover cursor-pointer"
          />
        ) : (
          /* Fallback to thumbnail slideshow */
          <img
            src={posterUrl}
            alt={currentScene?.label || 'Preview'}
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Play/Pause Overlay */}
        {!isPlaying && !isLoading && (
          <button
            onClick={play}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            aria-label="Play video"
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-black ml-1" />
            </div>
          </button>
        )}
        
        {/* Scene Label */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-white text-sm">
          {currentScene?.label}
        </div>
        
        {/* Scene Counter */}
        {hasMultipleScenes && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 rounded text-white text-sm">
            {currentSceneIndex + 1} / {playlist.entries.length}
          </div>
        )}
      </div>
      
      {/* Controls Bar */}
      {showControls && (
        <div className="bg-black/80 px-4 py-2 flex items-center gap-2">
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayPause}
            className="text-white hover:text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          {/* Prev/Next */}
          {hasMultipleScenes && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevScene}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextScene}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
          
          {/* Progress Bar */}
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Mute */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="text-white hover:text-white hover:bg-white/20"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          
          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFullscreen}
            className="text-white hover:text-white hover:bg-white/20"
          >
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* Scene Thumbnails */}
      {showThumbnails && hasMultipleScenes && (
        <div className="bg-black/90 p-2 flex gap-2 overflow-x-auto">
          {playlist.entries.map((entry, index) => (
            <button
              key={entry.sceneId}
              onClick={() => goToScene(index)}
              className={cn(
                'flex-shrink-0 w-20 aspect-video rounded overflow-hidden border-2 transition-all',
                index === currentSceneIndex
                  ? 'border-white'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={getThumbnailUrl(entry)}
                alt={entry.label}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default PreviewVideoPlayer
