import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

// Initialize localStorage-based KV storage
import './lib/local-storage-kv'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { Toaster } from './components/ui/sonner'
import { SiteProvider } from './lib/site-context'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <SiteProvider>
      <App />
      <Toaster position="top-right" richColors />
    </SiteProvider>
  </ErrorBoundary>
)
