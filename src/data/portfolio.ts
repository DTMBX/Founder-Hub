/**
 * Tillerstead project portfolio data.
 *
 * Each project has before/after descriptions, scope, and status.
 * Image URLs will be populated when actual project photos are available.
 * Until then, placeholder slots are rendered with descriptive labels.
 */

export interface PortfolioProject {
  id: string
  title: string
  category: 'tile' | 'bathroom' | 'kitchen' | 'flooring' | 'general' | 'land'
  location: string
  year: number
  scope: string
  highlights: string[]
  beforeLabel: string
  afterLabel: string
  /** Optional image URLs — leave undefined for placeholder display */
  beforeImage?: string
  afterImage?: string
  status: 'completed' | 'in-progress' | 'planned'
}

export const PORTFOLIO_CATEGORIES = [
  { id: 'all', label: 'All Projects' },
  { id: 'tile', label: 'Tile Installation' },
  { id: 'bathroom', label: 'Bathroom Renovation' },
  { id: 'kitchen', label: 'Kitchen Remodel' },
  { id: 'flooring', label: 'Flooring' },
  { id: 'general', label: 'General Contracting' },
  { id: 'land', label: 'Land Improvement' },
] as const

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: 'shower-retile-marlton',
    title: 'Custom Tile Shower — Full Gut',
    category: 'tile',
    location: 'Marlton, NJ',
    year: 2024,
    scope: 'Complete tear-out and retile of a walk-in shower. Kerdi waterproofing system, large-format porcelain with linear drain, frameless glass enclosure coordination.',
    highlights: [
      'TCNA W244 waterproofing method',
      'Large-format 24×48 porcelain tile',
      'Linear drain with custom channel',
      'Schluter KERDI-BOARD niches',
    ],
    beforeLabel: 'Original 1990s fiberglass insert — water damage visible at base',
    afterLabel: 'TCNA-compliant custom tile shower with linear drain',
    status: 'completed',
  },
  {
    id: 'bathroom-reno-cherry-hill',
    title: 'Primary Bathroom Renovation',
    category: 'bathroom',
    location: 'Cherry Hill, NJ',
    year: 2024,
    scope: 'Full bathroom renovation including vanity replacement, heated floor installation, tile tub surround, and updated fixtures.',
    highlights: [
      'Electric radiant floor heating',
      'Marble-look porcelain surround',
      'Custom double vanity',
      'ADA-compliant grab bar placement',
    ],
    beforeLabel: 'Dated laminate floor, builder-grade vanity and fixtures',
    afterLabel: 'Heated tile floor, custom vanity, marble-look surround',
    status: 'completed',
  },
  {
    id: 'kitchen-floor-haddonfield',
    title: 'Kitchen Flooring — LVP Installation',
    category: 'flooring',
    location: 'Haddonfield, NJ',
    year: 2024,
    scope: 'Remove existing sheet vinyl, level subfloor, and install luxury vinyl plank with transitions to adjacent rooms.',
    highlights: [
      'Self-leveling compound for flat substrate',
      'Waterproof LVP with attached underlayment',
      'Custom transitions to hardwood',
      'Baseboard and quarter-round replacement',
    ],
    beforeLabel: 'Peeling sheet vinyl with visible subfloor damage',
    afterLabel: 'Level LVP flooring with clean transitions',
    status: 'completed',
  },
  {
    id: 'backsplash-moorestown',
    title: 'Kitchen Backsplash — Subway Tile',
    category: 'tile',
    location: 'Moorestown, NJ',
    year: 2024,
    scope: 'Install ceramic subway tile backsplash with decorative accent row behind range. Include outlet box extensions and grout seal.',
    highlights: [
      'Beveled subway tile in herringbone accent',
      'Color-matched grout',
      'Electrical box extensions for outlets',
      'Sealed grout for stain resistance',
    ],
    beforeLabel: 'Painted drywall behind countertop — grease staining',
    afterLabel: 'Clean subway tile with herringbone accent row',
    status: 'completed',
  },
  {
    id: 'basement-finish-medford',
    title: 'Basement Finishing',
    category: 'general',
    location: 'Medford, NJ',
    year: 2025,
    scope: 'Framing, insulation, drywall, trim, and flooring for a 600 sq ft unfinished basement space.',
    highlights: [
      'Moisture barrier and rigid foam insulation',
      'Recessed LED lighting layout',
      'Engineered hardwood on DRIcore subfloor',
      'Egress window coordination',
    ],
    beforeLabel: 'Unfinished concrete basement with exposed joists',
    afterLabel: 'Finished living space with recessed lighting and engineered hardwood',
    status: 'in-progress',
  },
  {
    id: 'land-clearing-hammonton',
    title: 'Lot Clearing & Grading',
    category: 'land',
    location: 'Hammonton, NJ',
    year: 2025,
    scope: 'Clear 2-acre lot of brush and debris, grade for drainage, install gravel driveway pad.',
    highlights: [
      'Stump grinding and brush removal',
      'Grading for positive water flow',
      'Gravel driveway pad preparation',
      'Topsoil and seed for restoration areas',
    ],
    beforeLabel: 'Overgrown lot with dense brush coverage',
    afterLabel: 'Cleared and graded lot with gravel access',
    status: 'planned',
  },
]
