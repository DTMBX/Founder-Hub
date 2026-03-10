/**
 * EditorPanel — File browser + code editor for the DevCustomizer.
 * Reads/writes files across workspace repos via the Vite workspace API plugin.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  workspaceApi,
  type DirEntry,
  type RepoInfo,
  type SearchHit,
} from '@/lib/workspace-api'
import {
  FolderOpen,
  File,
  CaretRight,
  FloppyDisk,
  ArrowCounterClockwise,
  MagnifyingGlass,
  ArrowLeft,
  Code,
  FileTs,
  FileCss,
  FileHtml,
  FileJs,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import Editor, { type OnMount } from '@monaco-editor/react'
import { getAiStatus, codeComplete, explainCode, type AiStatus } from '@/lib/ai-service'

// ─── File Icon helper ───────────────────────────────────────────────────────

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return <FileTs className="h-3.5 w-3.5 text-blue-400" />
    case 'js':
    case 'jsx':
      return <FileJs className="h-3.5 w-3.5 text-yellow-400" />
    case 'css':
      return <FileCss className="h-3.5 w-3.5 text-purple-400" />
    case 'html':
      return <FileHtml className="h-3.5 w-3.5 text-orange-400" />
    case 'json':
      return <Code className="h-3.5 w-3.5 text-green-400" />
    default:
      return <File className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function extToLang(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'css':
      return 'css'
    case 'html':
      return 'html'
    case 'json':
      return 'json'
    case 'md':
      return 'markdown'
    case 'yml':
    case 'yaml':
      return 'yaml'
    default:
      return 'text'
  }
}

/** Map file extension to Monaco language ID */
function extToMonacoLang(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts': return 'typescript'
    case 'tsx': return 'typescriptreact'
    case 'js': return 'javascript'
    case 'jsx': return 'javascriptreact'
    case 'css': return 'css'
    case 'html': return 'html'
    case 'json': return 'json'
    case 'md': return 'markdown'
    case 'yml': case 'yaml': return 'yaml'
    case 'sh': case 'bash': return 'shell'
    case 'py': return 'python'
    case 'toml': return 'ini'
    default: return 'plaintext'
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EditorPanel() {
  const [repos, setRepos] = useState<RepoInfo[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [entries, setEntries] = useState<DirEntry[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([])
  const [loadingDir, setLoadingDir] = useState(false)

  // Editor state
  const [openFile, setOpenFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const monacoRef = useRef<Parameters<OnMount>[0] | null>(null)

  // AI state
  const [aiStatus, setAiStatus] = useState<AiStatus>({ available: false, model: null, models: [] })
  const [aiExplaining, setAiExplaining] = useState(false)
  const [aiOutput, setAiOutput] = useState<string | null>(null)

  // Search state
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)

  // Load repos on mount + check AI
  useEffect(() => {
    workspaceApi.repos().then(setRepos).catch(() => {
      toast.error('Workspace API unavailable — restart dev server')
    })
    getAiStatus().then(setAiStatus)
  }, [])

  // Track dirty state
  useEffect(() => {
    setDirty(fileContent !== originalContent)
  }, [fileContent, originalContent])

  const navigateTo = useCallback(async (dirPath: string) => {
    setLoadingDir(true)
    try {
      const items = await workspaceApi.list(dirPath)
      setEntries(items)
      setCurrentPath(dirPath)
      setBreadcrumbs(dirPath.split('/').filter(Boolean))
    } catch (e: unknown) {
      toast.error(errMsg(e))
    } finally {
      setLoadingDir(false)
    }
  }, [])

  const openFileAtPath = useCallback(async (filePath: string) => {
    try {
      const { content } = await workspaceApi.read(filePath)
      setOpenFile(filePath)
      setFileContent(content)
      setOriginalContent(content)
      // Focus textarea after render
      setTimeout(() => textareaRef.current?.focus(), 50)
    } catch (e: unknown) {
      toast.error(errMsg(e))
    }
  }, [])

  const saveFile = useCallback(async () => {
    if (!openFile || !dirty) return
    setSaving(true)
    try {
      await workspaceApi.write(openFile, fileContent)
      setOriginalContent(fileContent)
      toast.success(`Saved ${openFile.split('/').pop()}`)
    } catch (e: unknown) {
      toast.error(`Save failed: ${errMsg(e)}`)
    } finally {
      setSaving(false)
    }
  }, [openFile, fileContent, dirty])

  const revertFile = () => {
    setFileContent(originalContent)
  }

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !currentPath) return
    const repo = currentPath.split('/')[0]
    setSearching(true)
    try {
      const { results } = await workspaceApi.search(searchQuery, repo)
      setSearchResults(results)
    } catch (e: unknown) {
      toast.error(errMsg(e))
    } finally {
      setSearching(false)
    }
  }, [searchQuery, currentPath])

  // Keyboard shortcuts inside editor
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's' && openFile) {
        e.preventDefault()
        saveFile()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [openFile, saveFile])

  // ─── File Open View ───────────────────────────────────────────────────

  if (openFile) {
    const fileName = openFile.split('/').pop() || openFile
    const lang = extToLang(fileName)

    return (
      <div className="flex flex-col h-full max-h-[60vh]">
        {/* Editor header */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-card/30">
          <button
            onClick={() => setOpenFile(null)}
            className="p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium truncate flex items-center gap-1">
              {fileIcon(fileName)}
              {fileName}
              {dirty && <span className="text-amber-400 ml-1">*</span>}
            </p>
            <p className="text-[9px] text-muted-foreground font-mono truncate">
              {openFile}
            </p>
          </div>
          <span className="text-[9px] text-muted-foreground/50 font-mono mr-1">
            {lang}
          </span>
          <button
            onClick={revertFile}
            disabled={!dirty}
            className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
            title="Revert changes"
          >
            <ArrowCounterClockwise className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={saveFile}
            disabled={!dirty || saving}
            className={cn(
              'px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1',
              dirty
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-card/40 text-muted-foreground',
            )}
            title="Save (Ctrl+S)"
          >
            <FloppyDisk className="h-3 w-3" />
            {saving ? '…' : 'Save'}
          </button>
          {aiStatus.available && (
            <button
              onClick={async () => {
                const editor = monacoRef.current
                if (!editor) return
                const selection = editor.getModel()?.getValueInRange(editor.getSelection()!)
                const code = selection || fileContent.slice(0, 4000)
                if (!code.trim()) return
                setAiExplaining(true)
                setAiOutput(null)
                try {
                  const explanation = await explainCode(code, lang)
                  setAiOutput(explanation)
                } catch (e: unknown) {
                  toast.error(errMsg(e))
                } finally {
                  setAiExplaining(false)
                }
              }}
              disabled={aiExplaining}
              className="px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30"
              title="Ask AI to explain selected code (or first 4000 chars)"
            >
              <Code className="h-3 w-3" />
              {aiExplaining ? '…' : 'Explain'}
            </button>
          )}
        </div>

        {/* AI output panel */}
        {aiOutput && (
          <div className="px-3 py-2 border-b border-border/40 bg-primary/5 max-h-32 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-medium text-primary">AI Explanation</span>
              <button
                onClick={() => setAiOutput(null)}
                className="text-[9px] text-muted-foreground hover:text-foreground"
              >
                dismiss
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{aiOutput}</p>
          </div>
        )}

        {/* Code editor — Monaco */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            language={extToMonacoLang(fileName)}
            value={fileContent}
            onChange={(value) => setFileContent(value || '')}
            onMount={(editor) => {
              monacoRef.current = editor
              // Ctrl+S save shortcut inside Monaco
              editor.addCommand(
                // eslint-disable-next-line no-bitwise
                2048 | 49, // KeyMod.CtrlCmd | KeyCode.KeyS
                () => saveFile(),
              )
            }}
            theme="vs-dark"
            options={{
              fontSize: 12,
              lineHeight: 18,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 8, bottom: 8 },
              suggest: { showWords: true },
              quickSuggestions: true,
            }}
          />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 border-t border-border text-[9px] text-muted-foreground bg-card/20">
          <span>{fileContent.split('\n').length} lines</span>
          <div className="flex items-center gap-2">
            {aiStatus.available && (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                AI
              </span>
            )}
            <span>{dirty ? 'Modified' : 'Saved'}</span>
          </div>
        </div>
      </div>
    )
  }

  // ─── Search results view ──────────────────────────────────────────────

  if (searchMode && searchResults.length > 0) {
    return (
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSearchMode(false)
              setSearchResults([])
            }}
            className="p-1 rounded hover:bg-accent/10 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <p className="text-xs font-medium">
            {searchResults.length} results for &ldquo;{searchQuery}&rdquo;
          </p>
        </div>

        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {searchResults.map((hit, i) => (
            <button
              key={i}
              onClick={() => openFileAtPath(hit.file)}
              className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent/10 transition-colors"
            >
              <p className="text-[10px] font-mono text-blue-400 truncate">
                {hit.file}:{hit.line}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {hit.text}
              </p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ─── File Browser View ────────────────────────────────────────────────

  return (
    <div className="p-3 space-y-2">
      {/* Search bar */}
      <div className="flex gap-1">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search files…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full h-7 rounded-md border border-border/40 bg-card/40 pl-7 pr-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <button
          onClick={() => {
            setSearchMode(true)
            handleSearch()
          }}
          disabled={!searchQuery.trim() || !currentPath || searching}
          className="px-2 h-7 rounded-md bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 disabled:opacity-30"
        >
          {searching ? '…' : 'Go'}
        </button>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-0.5 text-[10px] overflow-x-auto">
          <button
            onClick={() => {
              setCurrentPath('')
              setEntries([])
              setBreadcrumbs([])
            }}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            repos
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-0.5 shrink-0">
              <CaretRight className="h-2.5 w-2.5 text-muted-foreground/50" />
              <button
                onClick={() =>
                  navigateTo(breadcrumbs.slice(0, i + 1).join('/'))
                }
                className={cn(
                  'hover:text-foreground',
                  i === breadcrumbs.length - 1
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground',
                )}
              >
                {crumb}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      {loadingDir ? (
        <p className="text-xs text-muted-foreground animate-pulse py-4 text-center">
          Loading…
        </p>
      ) : currentPath === '' ? (
        // Repo list
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Workspace Repos
          </p>
          {repos
            .filter((r) => r.exists)
            .map((repo) => (
              <button
                key={repo.key}
                onClick={() => navigateTo(repo.key)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-xs hover:bg-accent/10 transition-colors group"
              >
                <FolderOpen className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-medium flex-1">{repo.key}</span>
                <CaretRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            ))}
        </div>
      ) : (
        // Directory listing
        <div className="space-y-0.5">
          {entries.map((entry) => (
            <button
              key={entry.name}
              onClick={() => {
                const newPath = `${currentPath}/${entry.name}`
                if (entry.isDir) navigateTo(newPath)
                else openFileAtPath(newPath)
              }}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left text-[11px] hover:bg-accent/10 transition-colors group"
            >
              {entry.isDir ? (
                <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              ) : (
                fileIcon(entry.name)
              )}
              <span className="flex-1 truncate">{entry.name}</span>
              {entry.size !== undefined && (
                <span className="text-[9px] text-muted-foreground/50 font-mono">
                  {entry.size > 1024
                    ? `${(entry.size / 1024).toFixed(0)}K`
                    : `${entry.size}B`}
                </span>
              )}
              {entry.isDir && (
                <CaretRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
              )}
            </button>
          ))}
          {entries.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Empty directory
            </p>
          )}
        </div>
      )}
    </div>
  )
}
