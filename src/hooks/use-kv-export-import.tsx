/**
 * useKVExportImport — Adds JSON export/import to any KV-backed manager.
 *
 * Usage:
 *   const { exportJSON, importJSON, ImportInput } = useKVExportImport(key, setValue, 'Projects')
 *   <button onClick={exportJSON}>Export</button>
 *   <ImportInput />
 */

import { useCallback, useRef } from 'react'
import { toast } from 'sonner'

export function useKVExportImport<T>(
  key: string,
  currentValue: T,
  setValue: (value: T) => void,
  label?: string,
) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const displayName = label || key

  const exportJSON = useCallback(() => {
    const json = JSON.stringify(currentValue, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${key}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${displayName}`)
  }, [currentValue, key, displayName])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!file.name.endsWith('.json')) {
        toast.error('Only .json files are supported')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as T
          setValue(data)
          toast.success(`Imported ${displayName}`)
        } catch {
          toast.error('Invalid JSON file')
        }
      }
      reader.readAsText(file)

      // Reset so the same file can be re-imported
      e.target.value = ''
    },
    [setValue, displayName],
  )

  const triggerImport = useCallback(() => {
    fileRef.current?.click()
  }, [])

  /** Hidden file input — render once in your component */
  const ImportInput = useCallback(
    () => (
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    ),
    [handleFileChange],
  )

  return { exportJSON, triggerImport, ImportInput }
}
