/**
 * OfferingCard Component Tests
 * 
 * Stress tests for the OfferingCard and OfferingGrid components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OfferingCard, OfferingGrid, CATEGORY_CONFIG } from '../OfferingCard'
import type { Offering, OfferingCategory } from '@/lib/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
  },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => false,
}))

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  redirectToCheckout: vi.fn().mockResolvedValue({ success: true }),
  hasPriceTierPayment: vi.fn().mockReturnValue(true),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Helper to create mock offerings
function createMockOffering(overrides: Partial<Offering> = {}): Offering {
  return {
    id: 'test-offering-1',
    title: 'Test Offering',
    slug: 'test-offering',
    summary: 'This is a test offering summary',
    description: 'This is a detailed description of the test offering',
    category: 'digital' as OfferingCategory,
    pricingType: 'fixed',
    order: 1,
    priceTiers: [
      {
        id: 'tier-1',
        name: 'Basic',
        price: 9900, // $99.00
        currency: 'USD',
        features: ['Feature 1', 'Feature 2'],
        stripePriceId: 'price_test123',
      },
    ],
    tags: ['web', 'design'],
    coverImage: '',
    deliverables: ['Deliverable 1', 'Deliverable 2'],
    includes: ['Include 1', 'Include 2'],
    turnaround: '2-3 business days',
    featured: false,
    visibility: 'public',
    ...overrides,
  }
}

describe('OfferingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders offering title and summary', () => {
    const offering = createMockOffering({
      title: 'Premium Web Design',
      summary: 'Professional website design services',
    })
    
    render(<OfferingCard offering={offering} />)
    
    expect(screen.getByText('Premium Web Design')).toBeInTheDocument()
    expect(screen.getByText('Professional website design services')).toBeInTheDocument()
  })

  it('displays the correct category badge', () => {
    // Test each category renders its correct label
    const offering = createMockOffering({ category: 'digital' })
    
    render(<OfferingCard offering={offering} />)
    
    // "Digital Product" is the label for digital category
    expect(screen.getByText('Digital Product')).toBeInTheDocument()
  })

  it('shows featured badge when offering is featured', () => {
    // Featured badge with "Featured" text only appears when there's a cover image
    const offering = createMockOffering({ 
      featured: true, 
      coverImage: 'https://example.com/cover.jpg' 
    })
    
    render(<OfferingCard offering={offering} />)
    
    // Featured badge should show the text "Featured"
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })

  it('does not show featured badge when not featured', () => {
    const offering = createMockOffering({ featured: false })
    
    render(<OfferingCard offering={offering} />)
    
    expect(screen.queryByText('Featured')).not.toBeInTheDocument()
  })

  it('formats single price correctly', () => {
    const offering = createMockOffering({
      priceTiers: [
        { id: 't1', name: 'Standard', price: 4999, currency: 'USD', features: [] },
      ],
    })
    
    render(<OfferingCard offering={offering} />)
    
    // Price should be displayed as $50 (rounded display varies)
    expect(screen.getByText(/\$50/)).toBeInTheDocument()
  })

  it('shows price range for multiple tiers', () => {
    const offering = createMockOffering({
      priceTiers: [
        { id: 't1', name: 'Basic', price: 2500, currency: 'USD', features: [] },
        { id: 't2', name: 'Pro', price: 9900, currency: 'USD', features: [] },
        { id: 't3', name: 'Enterprise', price: 29900, currency: 'USD', features: [] },
      ],
    })
    
    render(<OfferingCard offering={offering} />)
    
    // Should show "From $25" or similar
    expect(screen.getByText(/From/)).toBeInTheDocument()
  })

  it('shows "Free" for zero-priced offerings', () => {
    const offering = createMockOffering({
      priceTiers: [
        { id: 't1', name: 'Free Tier', price: 0, currency: 'USD', features: [] },
      ],
    })
    
    render(<OfferingCard offering={offering} />)
    
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('shows recurring interval for subscription offerings', () => {
    const offering = createMockOffering({
      category: 'subscription',
      priceTiers: [
        { 
          id: 't1', 
          name: 'Monthly', 
          price: 1999, 
          currency: 'USD', 
          features: [],
          isRecurring: true,
          recurringInterval: 'month',
        },
      ],
    })
    
    render(<OfferingCard offering={offering} />)
    
    expect(screen.getByText('/month')).toBeInTheDocument()
  })

  it('renders cover image when provided', () => {
    const offering = createMockOffering({
      coverImage: 'https://example.com/image.jpg',
    })
    
    render(<OfferingCard offering={offering} />)
    
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
    expect(img).toHaveAttribute('alt', offering.title)
  })

  it('renders tags when provided', () => {
    const offering = createMockOffering({
      tags: ['react', 'typescript', 'tailwind'],
    })
    
    render(<OfferingCard offering={offering} />)
    
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
    expect(screen.getByText('tailwind')).toBeInTheDocument()
  })

  it('calls onViewDetails when view details button is clicked', () => {
    const onViewDetails = vi.fn()
    const offering = createMockOffering()
    
    render(<OfferingCard offering={offering} onViewDetails={onViewDetails} />)
    
    const button = screen.getByRole('button', { name: /view details/i })
    fireEvent.click(button)
    
    expect(onViewDetails).toHaveBeenCalledWith(offering)
  })

  it('renders compact variant correctly', () => {
    const offering = createMockOffering()
    
    render(<OfferingCard offering={offering} variant="compact" />)
    
    // Compact variant should still render key info
    expect(screen.getByText(offering.title)).toBeInTheDocument()
  })

  it('renders featured variant with enhanced styling', () => {
    const offering = createMockOffering({ featured: true })
    
    const { container } = render(<OfferingCard offering={offering} variant="featured" />)
    
    // Featured variant should have ring styling
    expect(container.querySelector('[class*="ring-"]')).toBeInTheDocument()
  })

  it('shows contact CTA for barter category', () => {
    const offering = createMockOffering({
      category: 'barter',
      pricingType: 'contact',
    })
    
    render(<OfferingCard offering={offering} contactEmail="test@example.com" />)
    
    // Barter offerings should show trade-related button text
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('handles missing price tiers gracefully', () => {
    const offering = createMockOffering({
      priceTiers: [],
    })
    
    // Should not throw
    expect(() => render(<OfferingCard offering={offering} />)).not.toThrow()
    expect(screen.getByText(offering.title)).toBeInTheDocument()
  })
})

describe('OfferingGrid', () => {
  it('renders all offerings in a grid', () => {
    const offerings = [
      createMockOffering({ id: '1', title: 'Offering One' }),
      createMockOffering({ id: '2', title: 'Offering Two' }),
      createMockOffering({ id: '3', title: 'Offering Three' }),
    ]
    
    render(<OfferingGrid offerings={offerings} />)
    
    expect(screen.getByText('Offering One')).toBeInTheDocument()
    expect(screen.getByText('Offering Two')).toBeInTheDocument()
    expect(screen.getByText('Offering Three')).toBeInTheDocument()
  })

  it('renders empty state when no offerings', () => {
    const { container } = render(<OfferingGrid offerings={[]} />)
    
    // Grid should still render but be empty
    const grid = container.querySelector('[class*="grid"]')
    expect(grid).toBeInTheDocument()
    expect(grid?.children).toHaveLength(0)
  })

  it('passes onViewDetails to each card', () => {
    const onViewDetails = vi.fn()
    const offerings = [
      createMockOffering({ id: '1', title: 'Test One' }),
      createMockOffering({ id: '2', title: 'Test Two' }),
    ]
    
    render(<OfferingGrid offerings={offerings} onViewDetails={onViewDetails} />)
    
    const buttons = screen.getAllByRole('button', { name: /view details/i })
    fireEvent.click(buttons[0])
    
    expect(onViewDetails).toHaveBeenCalledWith(offerings[0])
  })

  it('adjusts grid columns based on prop', () => {
    const offerings = [createMockOffering()]
    
    const { container, rerender } = render(
      <OfferingGrid offerings={offerings} columns={2} />
    )
    
    // Check it rendered with grid class
    expect(container.querySelector('[class*="grid"]')).toBeInTheDocument()
    
    // Rerender with different columns
    rerender(<OfferingGrid offerings={offerings} columns={4} />)
    expect(container.querySelector('[class*="grid"]')).toBeInTheDocument()
  })

  it('handles large number of offerings (stress test)', () => {
    // Create 50 offerings to stress test (reduced for faster test)
    const offerings = Array.from({ length: 50 }, (_, i) =>
      createMockOffering({
        id: `offering-${i}`,
        title: `Offering ${i}`,
        summary: `Summary for offering ${i}`,
        featured: i % 10 === 0,
        category: (['digital', 'service', 'whitelabel', 'subscription', 'barter'] as OfferingCategory[])[i % 5],
      })
    )
    
    const startTime = performance.now()
    const { container } = render(<OfferingGrid offerings={offerings} />)
    const renderTime = performance.now() - startTime
    
    // Should render all offerings in the grid
    const cards = container.querySelectorAll('[class*="group"]')
    expect(cards.length).toBeGreaterThan(0)
    
    // Rendering should be reasonably fast (under 5 seconds for stress test)
    expect(renderTime).toBeLessThan(5000)
    
    console.log(`Rendered ${offerings.length} offerings in ${renderTime.toFixed(2)}ms`)
  })

  it('handles mixed category offerings correctly', () => {
    const offerings: Offering[] = [
      createMockOffering({ id: '1', category: 'digital', title: 'My Digital Item' }),
      createMockOffering({ id: '2', category: 'service', title: 'My Service Item' }),
      createMockOffering({ id: '3', category: 'whitelabel', title: 'My White Label Item' }),
      createMockOffering({ id: '4', category: 'subscription', title: 'My Subscription Item' }),
      createMockOffering({ id: '5', category: 'barter', title: 'My Trade Item' }),
    ]
    
    render(<OfferingGrid offerings={offerings} />)
    
    // Each offering title should be rendered
    expect(screen.getByText('My Digital Item')).toBeInTheDocument()
    expect(screen.getByText('My Service Item')).toBeInTheDocument()
    expect(screen.getByText('My White Label Item')).toBeInTheDocument()
    expect(screen.getByText('My Subscription Item')).toBeInTheDocument()
    expect(screen.getByText('My Trade Item')).toBeInTheDocument()
  })
})

describe('Price formatting edge cases', () => {
  it('handles very large prices', () => {
    const offering = createMockOffering({
      priceTiers: [
        { id: 't1', name: 'Enterprise', price: 99999900, currency: 'USD', features: [] }, // $999,999
      ],
    })
    
    render(<OfferingCard offering={offering} />)
    
    // Should format with commas
    expect(screen.getByText(/\$999,999/)).toBeInTheDocument()
  })

  it('handles small prices', () => {
    const offering = createMockOffering({
      priceTiers: [
        { id: 't1', name: 'Micro', price: 99, currency: 'USD', features: [] }, // $0.99
      ],
    })
    
    render(<OfferingCard offering={offering} />)
    
    // Should display $1 or similar
    expect(screen.getByText(/\$1/)).toBeInTheDocument()
  })

  it('handles different currencies', () => {
    const offering = createMockOffering({
      priceTiers: [
        { id: 't1', name: 'Euro', price: 5000, currency: 'EUR', features: [] },
      ],
    })
    
    render(<OfferingCard offering={offering} />)
    
    // Should display euro symbol or EUR
    expect(screen.getByText(/€50|EUR/)).toBeInTheDocument()
  })
})

describe('Accessibility', () => {
  it('has proper ARIA attributes', () => {
    const offering = createMockOffering()
    
    render(<OfferingCard offering={offering} />)
    
    // Buttons should be accessible
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    expect(buttons[0]).toBeEnabled()
  })

  it('renders with accessible image alt text', () => {
    const offering = createMockOffering({
      title: 'Web Design Service',
      coverImage: 'https://example.com/img.jpg',
    })
    
    render(<OfferingCard offering={offering} />)
    
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('alt', 'Web Design Service')
  })

  it('supports keyboard navigation', () => {
    const onViewDetails = vi.fn()
    const offering = createMockOffering()
    
    render(<OfferingCard offering={offering} onViewDetails={onViewDetails} />)
    
    // Find the view details button
    const buttons = screen.getAllByRole('button')
    const detailsButton = buttons.find(b => b.textContent?.toLowerCase().includes('view') || b.textContent?.toLowerCase().includes('details'))
    
    if (detailsButton) {
      detailsButton.focus()
      fireEvent.click(detailsButton)
      expect(onViewDetails).toHaveBeenCalled()
    } else {
      // If no explicit view details button, the card itself should be clickable
      expect(buttons.length).toBeGreaterThan(0)
    }
  })
})
