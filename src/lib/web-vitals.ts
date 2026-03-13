/**
 * Core Web Vitals Reporting
 *
 * Tracks CLS, FID, FCP, LCP, TTFB and reports to console in dev,
 * or to an analytics endpoint in production.
 */

import type { Metric } from 'web-vitals'

function sendToAnalytics(metric: Metric) {
  // In dev, log to console for debugging
  if (import.meta.env.DEV) {
    const color = metric.rating === 'good' ? '#0cce6b'
      : metric.rating === 'needs-improvement' ? '#ffa400'
      : '#ff4e42'
    console.log(
      `%c[Web Vitals] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`,
      `color: ${color}; font-weight: bold`
    )
    return
  }

  // In production, beacon to analytics if enabled
  const analyticsEnabled = localStorage.getItem('founder-hub:founder-hub-settings')
  if (analyticsEnabled) {
    try {
      const settings = JSON.parse(analyticsEnabled)
      if (!settings.analyticsEnabled) return
    } catch { /* ignore */ }
  }

  // Store metrics locally for the admin dashboard
  try {
    const key = 'founder-hub:web-vitals'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    existing.push({
      name: metric.name,
      value: Math.round(metric.value * 100) / 100,
      rating: metric.rating,
      timestamp: Date.now(),
    })
    // Keep only last 50 entries
    if (existing.length > 50) existing.splice(0, existing.length - 50)
    localStorage.setItem(key, JSON.stringify(existing))
  } catch { /* quota exceeded or private browsing */ }
}

export async function reportWebVitals() {
  const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals')
  onCLS(sendToAnalytics)
  onFCP(sendToAnalytics)
  onLCP(sendToAnalytics)
  onTTFB(sendToAnalytics)
  onINP(sendToAnalytics)
}
