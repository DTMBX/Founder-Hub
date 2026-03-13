import React from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

// Validate env vars at startup — fails fast on misconfiguration
import './config/env'

// Initialize localStorage-based KV storage
import './lib/local-storage-kv'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { Toaster } from './components/ui/sonner'
import { SiteProvider } from './lib/site-context'
import { MotionProvider } from './lib/motion-context'

import "./main.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <MotionProvider>
      <SiteProvider>
        <App />
        <Toaster position="top-right" richColors />
      </SiteProvider>
    </MotionProvider>
  </ErrorBoundary>
)

// Report Core Web Vitals (async — zero impact on load)
import('./lib/web-vitals').then(m => m.reportWebVitals())

// Dev-only accessibility audit overlay via axe-core
if (import.meta.env.DEV) {
  import('@axe-core/react').then((axe) => {
    import('react-dom').then((ReactDOM) => {
      axe.default(React, ReactDOM, 1000)
    })
  })
}
