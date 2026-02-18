/**
 * CSV Export Utilities
 *
 * Simple, deterministic CSV generation for data export.
 * Handles quoting, escaping, and various data types.
 */

// ─── Types ───────────────────────────────────────────────────

export interface CsvColumn<T> {
  /** Header label */
  header: string
  /** Key path or accessor function */
  accessor: keyof T | ((row: T) => unknown)
}

export interface ToCsvOptions<T> {
  /** Column definitions */
  columns: CsvColumn<T>[]
  /** Include header row (default: true) */
  includeHeader?: boolean
  /** Field delimiter (default: ',') */
  delimiter?: string
  /** Row separator (default: '\r\n') */
  rowSeparator?: string
}

// ─── Escaping ────────────────────────────────────────────────

/**
 * Escape a single CSV value
 * - Wrap in quotes if contains delimiter, newline, or quote
 * - Double-escape existing quotes
 */
export function escapeCsvValue(value: unknown, delimiter = ','): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  const str = typeof value === 'object'
    ? JSON.stringify(value)
    : String(value)
  
  // Check if quoting is needed
  const needsQuotes =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  
  if (needsQuotes) {
    // Double-escape quotes and wrap
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

// ─── Core Function ───────────────────────────────────────────

/**
 * Convert an array of objects to CSV string
 */
export function toCsv<T>(data: T[], options: ToCsvOptions<T>): string {
  const {
    columns,
    includeHeader = true,
    delimiter = ',',
    rowSeparator = '\r\n',
  } = options
  
  const rows: string[] = []
  
  // Header row
  if (includeHeader) {
    const headerRow = columns
      .map((col) => escapeCsvValue(col.header, delimiter))
      .join(delimiter)
    rows.push(headerRow)
  }
  
  // Data rows
  for (const item of data) {
    const values = columns.map((col) => {
      const value = typeof col.accessor === 'function'
        ? col.accessor(item)
        : item[col.accessor]
      return escapeCsvValue(value, delimiter)
    })
    rows.push(values.join(delimiter))
  }
  
  return rows.join(rowSeparator)
}

// ─── Download Helper ─────────────────────────────────────────

/**
 * Trigger a CSV file download in browser
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// ─── Quick Export ────────────────────────────────────────────

/**
 * Auto-generate columns from object keys (for quick exports)
 */
export function autoColumns<T extends Record<string, unknown>>(
  sample: T
): CsvColumn<T>[] {
  return Object.keys(sample).map((key) => ({
    header: key.replace(/([A-Z])/g, ' $1').trim(),
    accessor: key as keyof T,
  }))
}
