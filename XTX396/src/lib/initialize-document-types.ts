import { useEffect } from 'react'
import { useKV } from '@/lib/local-storage-kv'
import { DocumentType } from '@/lib/types'

export function useInitializeDocumentTypes() {
  const [documentTypes, setDocumentTypes] = useKV<DocumentType[]>('founder-hub-document-types', [])

  useEffect(() => {
    if (!documentTypes || documentTypes.length === 0) {
      const defaultTypes: DocumentType[] = [
        {
          id: 'complaint',
          name: 'Complaint',
          defaultToken: 'CMPL',
          defaultVisibility: 'unlisted',
          color: '#ef4444',
          order: 0
        },
        {
          id: 'motion',
          name: 'Motion',
          defaultToken: 'MTN',
          defaultVisibility: 'unlisted',
          color: '#f59e0b',
          order: 1
        },
        {
          id: 'order',
          name: 'Order',
          defaultToken: 'ORD',
          defaultVisibility: 'unlisted',
          color: '#10b981',
          order: 2
        },
        {
          id: 'certification',
          name: 'Certification',
          defaultToken: 'CERT',
          defaultVisibility: 'unlisted',
          color: '#3b82f6',
          order: 3
        },
        {
          id: 'exhibit',
          name: 'Exhibit',
          defaultToken: 'EX',
          defaultVisibility: 'private',
          color: '#8b5cf6',
          order: 4
        },
        {
          id: 'transcript',
          name: 'Transcript',
          defaultToken: 'TR',
          defaultVisibility: 'private',
          color: '#ec4899',
          order: 5
        },
        {
          id: 'opra',
          name: 'OPRA Response',
          defaultToken: 'OPRA',
          defaultVisibility: 'unlisted',
          color: '#06b6d4',
          order: 6
        },
        {
          id: 'notice',
          name: 'Notice',
          defaultToken: 'NOT',
          defaultVisibility: 'unlisted',
          color: '#84cc16',
          order: 7
        },
        {
          id: 'decision',
          name: 'Decision',
          defaultToken: 'DEC',
          defaultVisibility: 'unlisted',
          color: '#f97316',
          order: 8
        },
        {
          id: 'other',
          name: 'Other',
          defaultToken: 'OTH',
          defaultVisibility: 'private',
          color: '#6b7280',
          order: 9
        }
      ]
      setDocumentTypes(defaultTypes)
    }
  }, [])
}
