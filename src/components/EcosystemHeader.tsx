import { ArrowSquareOut, CaretDown, MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

import { satellites } from '@/config/projects'

/**
 * EcosystemHeader — slim top bar linking all Evident satellite apps.
 *
 * Designed to be embedded at the very top of any page in the ecosystem.
 * Uses the canonical satellite registry from config/projects.ts.
 */
export function EcosystemHeader() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close dropdown on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <div
      className="bg-zinc-950 text-zinc-400 text-xs border-b border-zinc-800"
      role="navigation"
      aria-label="Evident ecosystem"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
        {/* Left: Wordmark */}
        <a
          href="https://www.xtx396.com"
          className="flex items-center gap-1.5 font-semibold tracking-wide text-zinc-300 hover:text-white transition-colors"
          rel="noopener noreferrer"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-emerald-600 text-[9px] font-bold text-white leading-none">
            E
          </span>
          Evident
        </a>

        {/* Center: Search trigger */}
        <button
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
          }}
          className="hidden sm:flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-0.5 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
          aria-label="Search (Ctrl+K)"
        >
          <MagnifyingGlass size={12} />
          <span className="text-[11px]">Search</span>
          <kbd className="ml-2 rounded border border-zinc-800 bg-zinc-900 px-1 py-px text-[9px] font-mono">⌘K</kbd>
        </button>

        {/* Right: Satellite dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            aria-expanded={open}
            aria-haspopup="true"
          >
            Apps
            <CaretDown
              size={12}
              weight="bold"
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {open && (
            <div
              className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
              role="menu"
            >
              {satellites.map((app) => (
                <a
                  key={app.id}
                  href={app.canonicalUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-zinc-800 transition-colors"
                >
                  <span>
                    <span className="block text-sm text-zinc-200">{app.name}</span>
                    <span className="block text-[11px] text-zinc-500 leading-tight">
                      {app.summary.length > 60
                        ? app.summary.slice(0, 60) + '…'
                        : app.summary}
                    </span>
                  </span>
                  <ArrowSquareOut size={14} className="shrink-0 text-zinc-500" />
                </a>
              ))}

              <div className="border-t border-zinc-700 mt-1 pt-1 px-3 py-1.5">
                <span className="text-[10px] text-zinc-600 tracking-wide uppercase">
                  Powered by Evident Technologies
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
