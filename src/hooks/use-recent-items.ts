/**
 * useRecentItems — Tracks recently visited modules and pinned favorites.
 *
 * Persists to localStorage so recents survive page refresh.
 * Favorites are manually pinned/unpinned by the user.
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'admin-recent-items'
const FAVORITES_STORAGE_KEY = 'admin-favorites'
const MAX_RECENT = 8

export interface RecentItem {
  id: string
  label: string
  category: string
  timestamp: number
}

function loadRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>(loadRecent)
  const [favorites, setFavorites] = useState<string[]>(loadFavorites)

  const trackVisit = useCallback((id: string, label: string, category: string) => {
    setRecentItems(prev => {
      const filtered = prev.filter(item => item.id !== id)
      const updated = [{ id, label, category, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  return { recentItems, favorites, trackVisit, toggleFavorite, isFavorite }
}
