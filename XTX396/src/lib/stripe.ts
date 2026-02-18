import { loadStripe, Stripe } from '@stripe/stripe-js'
import { kv } from './local-storage-kv'
import { SiteSettings, OfferingPriceTier } from './types'

let stripePromise: Promise<Stripe | null> | null = null
let cachedPublishableKey: string | null = null

/**
 * Get or initialize the Stripe instance
 */
export async function getStripe(): Promise<Stripe | null> {
  const settings = await kv.get<SiteSettings>('founder-hub-settings')
  
  if (!settings?.stripeEnabled || !settings?.stripePublishableKey) {
    console.warn('[Stripe] Not enabled or missing publishable key')
    return null
  }

  // Reinitialize if key changed
  if (cachedPublishableKey !== settings.stripePublishableKey) {
    stripePromise = loadStripe(settings.stripePublishableKey)
    cachedPublishableKey = settings.stripePublishableKey
  }

  if (!stripePromise) {
    stripePromise = loadStripe(settings.stripePublishableKey)
    cachedPublishableKey = settings.stripePublishableKey
  }
  
  return stripePromise
}

/**
 * Check if Stripe is configured and enabled
 */
export async function isStripeEnabled(): Promise<boolean> {
  const settings = await kv.get<SiteSettings>('founder-hub-settings')
  return !!(settings?.stripeEnabled && settings?.stripePublishableKey)
}

/**
 * Get Stripe checkout URLs from settings
 */
export async function getCheckoutUrls(): Promise<{ successUrl: string; cancelUrl: string }> {
  const settings = await kv.get<SiteSettings>('founder-hub-settings')
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  
  return {
    successUrl: settings?.stripeSuccessUrl 
      ? `${baseUrl}${settings.stripeSuccessUrl}` 
      : `${baseUrl}/checkout/success`,
    cancelUrl: settings?.stripeCancelUrl 
      ? `${baseUrl}${settings.stripeCancelUrl}` 
      : `${baseUrl}/checkout/cancel`,
  }
}

/**
 * Redirect to Stripe Checkout for a price tier
 * For static sites, uses Payment Links or constructs checkout URL
 */
export async function redirectToCheckout(tier: OfferingPriceTier, offeringTitle: string): Promise<{ success: boolean; error?: string }> {
  try {
    // If tier has a direct payment link, use that (no API needed)
    if (tier.stripePaymentLink) {
      window.location.href = tier.stripePaymentLink
      return { success: true }
    }

    // If tier has a Stripe Price ID, attempt embedded checkout
    if (tier.stripePriceId) {
      const stripe = await getStripe()
      if (!stripe) {
        return { 
          success: false, 
          error: 'Stripe is not configured. Please set up Stripe in Settings.' 
        }
      }

      const { successUrl, cancelUrl } = await getCheckoutUrls()

      // Use initEmbeddedCheckout for newer Stripe.js versions
      // For client-only mode, Stripe requires using Payment Links or a backend
      // As a fallback, try the deprecated method if available
      try {
        const stripeAny = stripe as any
        if (typeof stripeAny.redirectToCheckout === 'function') {
          const { error } = await stripeAny.redirectToCheckout({
            lineItems: [{ price: tier.stripePriceId, quantity: 1 }],
            mode: tier.isRecurring ? 'subscription' : 'payment',
            successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: cancelUrl,
          })

          if (error) {
            console.error('[Stripe] Checkout error:', error)
            return { success: false, error: error.message }
          }
          return { success: true }
        }
      } catch (e) {
        console.warn('[Stripe] redirectToCheckout not available:', e)
      }

      // Fallback: For Price ID without Payment Links, user needs to use Payment Links instead
      // This is because client-side checkout with Price IDs requires Stripe Checkout Sessions (server-side)
      return { 
        success: false, 
        error: 'Price ID checkout requires a Payment Link. Please create a Payment Link for this price in your Stripe Dashboard and add it to the offering.' 
      }
    }

    // No payment method configured
    return { 
      success: false, 
      error: 'No payment method configured for this tier. Please add a Stripe Payment Link.' 
    }

  } catch (err) {
    console.error('[Stripe] Checkout error:', err)
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred' 
    }
  }
}

/**
 * Format price display with currency
 */
export function formatStripePrice(cents: number, currency: string = 'USD'): string {
  if (cents === 0) return 'Free'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Check if a price tier has payment configured
 * Payment Links are preferred for static sites (no backend required)
 */
export function hasPriceTierPayment(tier: OfferingPriceTier): boolean {
  // Payment Links work without a backend - prioritize these
  return !!tier.stripePaymentLink
}

/**
 * Check if tier has any payment configuration (including Price IDs that need backend)
 */
export function hasPriceTierPaymentConfig(tier: OfferingPriceTier): boolean {
  return !!(tier.stripePriceId || tier.stripePaymentLink)
}
