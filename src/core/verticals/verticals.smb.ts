/**
 * Small Business Vertical Packs
 *
 * Defines vertical configurations for different small business types.
 * Each vertical provides specialized defaults, copy templates, and
 * section configurations appropriate for the business category.
 */

import type { VerticalPack, BusinessType } from './verticals.types'

// ─── Helper: Base SMB Sections ───────────────────────────────

const baseSMBSections = {
  enabledSections: ['hero', 'about', 'services', 'gallery', 'testimonials', 'contact'],
  sectionOrder: ['hero', 'about', 'services', 'gallery', 'team', 'testimonials', 'faq', 'contact'],
  heroStyle: 'image' as const,
  showTrustBadges: true,
  showUrgencyBanner: false,
}

// ─── Helper: Base SMB Structured Data ────────────────────────

const baseSMBStructuredData = {
  '@context': 'https://schema.org' as const,
  '@type': 'LocalBusiness',
  name: '{{businessName}}',
  description: '{{description}}',
  telephone: '{{phone}}',
  email: '{{email}}',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '{{address}}',
  },
  url: '{{website}}',
}

// ─── Contractor / Home Services ──────────────────────────────

export const VERTICAL_SMB_CONTRACTOR: VerticalPack = {
  id: 'smb_contractor',
  label: 'Contractor / Home Services',
  description: 'Home improvement, construction, and trade services',
  siteType: 'small-business',
  icon: 'hammer',

  recommendedPresets: ['smb-contractor-blue', 'smb-professional-gray'],
  defaultPreset: 'smb-contractor-blue',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Quality Craftsmanship You Can Trust',
        'Professional Home Services Done Right',
        'Your Home Improvement Experts',
        'Built on Quality. Driven by Trust.',
      ],
    },
    heroSubheadline: {
      variants: [
        'Licensed, insured, and committed to excellence.',
        'Serving {{location}} homeowners for over {{yearsInBusiness}} years.',
        'From repairs to renovations, we do it all.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{businessName}} has been providing quality home services to {{location}} residents for over {{yearsInBusiness}} years.',
        'As a family-owned business, we treat every project as if it were our own home.',
        'Our skilled team delivers professional workmanship backed by honest pricing.',
      ],
    },
    ctaText: {
      variants: ['Get a Free Quote', 'Request an Estimate', 'Book a Consultation', 'Call for Pricing'],
    },
    ctaSecondaryText: {
      variants: ['View Our Work', 'See Our Services', 'Read Reviews'],
    },
    faqQuestions: [
      { question: 'Are you licensed and insured?', answerTemplate: 'Yes, we are fully licensed and insured for all work we perform.' },
      { question: 'Do you offer free estimates?', answerTemplate: 'Absolutely! Contact us to schedule a free on-site estimate.' },
      { question: 'What areas do you serve?', answerTemplate: 'We serve {{location}} and surrounding communities.' },
      { question: 'Do you guarantee your work?', answerTemplate: 'Yes, we stand behind our work with a satisfaction guarantee.' },
    ],
    trustBadges: {
      variants: ['Licensed & Insured', 'Free Estimates', 'Satisfaction Guaranteed', 'Locally Owned'],
    },
    contactHeader: {
      variants: ['Get Your Free Quote', 'Request an Estimate', 'Contact Us Today'],
    },
    servicesHeader: {
      variants: ['Our Services', 'What We Do', 'How We Can Help'],
    },
  },

  sectionDefaults: {
    ...baseSMBSections,
    galleryStyle: 'before-after',  // Contractors benefit from before/after
    contactStyle: 'estimate',
  },

  trustBadges: [
    { id: 'licensed', label: 'Licensed & Insured', defaultEnabled: true },
    { id: 'free-estimate', label: 'Free Estimates', defaultEnabled: true },
    { id: 'guarantee', label: 'Satisfaction Guaranteed', defaultEnabled: true },
    { id: 'local', label: 'Locally Owned', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{businessName}} | {{tagline}}',
    descriptionPattern: '{{businessName}} provides professional {{services}} in {{location}}. Licensed & insured. Free estimates. Call {{phone}}.',
    schemaType: 'HomeAndConstructionBusiness',
    ogTextPattern: '{{businessName}} - Quality Craftsmanship',
  },

  structuredDataTemplate: {
    ...baseSMBStructuredData,
    '@type': 'HomeAndConstructionBusiness',
    priceRange: '$$',
  },

  fieldRequirements: [
    { field: 'businessName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
  ],

  mediaCategory: 'smb-contractor',
  galleryStyle: 'before-after',
  heroImageStyle: 'photo',
  ctaStyle: 'estimate',
  phoneEmphasis: 0.8,
}

// ─── Restaurant / Food Service ───────────────────────────────

export const VERTICAL_SMB_RESTAURANT: VerticalPack = {
  id: 'smb_restaurant',
  label: 'Restaurant / Food Service',
  description: 'Restaurants, cafes, and food service businesses',
  siteType: 'small-business',
  icon: 'utensils',

  recommendedPresets: ['smb-warm-restaurant', 'smb-modern-cafe'],
  defaultPreset: 'smb-warm-restaurant',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Experience Authentic Flavors',
        'Where Every Meal is a Celebration',
        'Fresh. Local. Delicious.',
        'Taste the Difference',
      ],
    },
    heroSubheadline: {
      variants: [
        'Serving {{location}} with passion since {{foundedYear}}.',
        'Fresh ingredients, family recipes, unforgettable taste.',
        'Join us for an unforgettable dining experience.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{businessName}} brings authentic flavors and warm hospitality to {{location}}.',
        'Our kitchen uses fresh, locally-sourced ingredients to create memorable dishes.',
        'From family gatherings to special occasions, we make every meal an experience.',
      ],
    },
    ctaText: {
      variants: ['View Our Menu', 'Make a Reservation', 'Order Online', 'Book a Table'],
    },
    ctaSecondaryText: {
      variants: ['See Our Hours', 'View Gallery', 'Read Reviews'],
    },
    faqQuestions: [
      { question: 'Do you take reservations?', answerTemplate: 'Yes! Call us at {{phone}} or book online to reserve your table.' },
      { question: 'Do you offer takeout or delivery?', answerTemplate: 'Yes, we offer both takeout and delivery options.' },
      { question: 'Do you accommodate dietary restrictions?', answerTemplate: 'We offer options for various dietary needs. Please let your server know about any restrictions.' },
      { question: 'Do you host private events?', answerTemplate: 'Yes, we can accommodate private parties and events. Contact us for details.' },
    ],
    trustBadges: {
      variants: ['Fresh Ingredients', 'Family Owned', 'Dine-In & Takeout', 'Reservations Welcome'],
    },
    contactHeader: {
      variants: ['Visit Us', 'Make a Reservation', 'Contact {{businessName}}'],
    },
    servicesHeader: {
      variants: ['Our Menu', 'What We Serve', 'Dining Options'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'menu', 'gallery', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'menu', 'gallery', 'testimonials', 'faq', 'contact'],
    heroStyle: 'image',
    galleryStyle: 'grid',
    contactStyle: 'hours',  // Restaurants emphasize hours
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'fresh', label: 'Fresh Ingredients', defaultEnabled: true },
    { id: 'family', label: 'Family Owned', defaultEnabled: true },
    { id: 'takeout', label: 'Takeout Available', defaultEnabled: true },
    { id: 'reservations', label: 'Reservations', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{businessName}} | Restaurant in {{location}}',
    descriptionPattern: '{{businessName}} serves delicious {{cuisine}} in {{location}}. Fresh ingredients, warm hospitality. Call {{phone}} for reservations.',
    schemaType: 'Restaurant',
    ogTextPattern: '{{businessName}} - Authentic Flavors',
  },

  structuredDataTemplate: {
    ...baseSMBStructuredData,
    '@type': 'Restaurant',
    servesCuisine: '{{cuisine}}',
    priceRange: '$$',
    acceptsReservations: true,
  },

  fieldRequirements: [
    { field: 'businessName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
  ],

  mediaCategory: 'smb-restaurant',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'booking',
  phoneEmphasis: 0.7,
}

// ─── Medical / Healthcare ────────────────────────────────────

export const VERTICAL_SMB_MEDICAL: VerticalPack = {
  id: 'smb_medical',
  label: 'Medical / Healthcare',
  description: 'Medical practices, clinics, and healthcare providers',
  siteType: 'small-business',
  icon: 'medical',

  recommendedPresets: ['smb-medical-blue', 'smb-clean-white'],
  defaultPreset: 'smb-medical-blue',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Compassionate Care for You and Your Family',
        'Your Health is Our Priority',
        'Quality Healthcare Close to Home',
        'Trusted Medical Care in {{location}}',
      ],
    },
    heroSubheadline: {
      variants: [
        'Dedicated healthcare professionals serving our community.',
        'Comprehensive care with a personal touch.',
        'Accepting new patients. Same-day appointments available.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{businessName}} provides compassionate, comprehensive healthcare to patients of all ages.',
        'Our team of dedicated professionals is committed to your health and well-being.',
        'We combine modern medicine with personalized attention to deliver exceptional care.',
      ],
    },
    ctaText: {
      variants: ['Schedule an Appointment', 'Book Online', 'Request an Appointment', 'Call to Schedule'],
    },
    ctaSecondaryText: {
      variants: ['View Our Services', 'Meet Our Team', 'Patient Resources'],
    },
    faqQuestions: [
      { question: 'Are you accepting new patients?', answerTemplate: 'Yes, we are currently accepting new patients. Contact us to schedule your first appointment.' },
      { question: 'What insurance do you accept?', answerTemplate: 'We accept most major insurance plans. Please contact our office to verify your coverage.' },
      { question: 'Do you offer telemedicine?', answerTemplate: 'Yes, we offer telemedicine appointments for qualifying visits.' },
      { question: 'What are your office hours?', answerTemplate: 'Please see our contact section for current office hours or call {{phone}}.' },
    ],
    trustBadges: {
      variants: ['Accepting New Patients', 'Most Insurance Accepted', 'Same-Day Appointments', 'Compassionate Care'],
    },
    contactHeader: {
      variants: ['Schedule Your Appointment', 'Contact Our Office', 'Get in Touch'],
    },
    servicesHeader: {
      variants: ['Our Services', 'Healthcare Services', 'How We Can Help'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'services', 'team', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'services', 'team', 'testimonials', 'faq', 'contact'],
    heroStyle: 'gradient',
    galleryStyle: 'grid',
    contactStyle: 'appointment',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'new-patients', label: 'Accepting New Patients', defaultEnabled: true },
    { id: 'insurance', label: 'Most Insurance Accepted', defaultEnabled: true },
    { id: 'same-day', label: 'Same-Day Appointments', defaultEnabled: false },
    { id: 'compassionate', label: 'Compassionate Care', defaultEnabled: true },
  ],

  seoDefaults: {
    titlePattern: '{{businessName}} | Healthcare in {{location}}',
    descriptionPattern: 'Compassionate healthcare in {{location}}. {{businessName}} offers {{services}}. Accepting new patients. Call {{phone}}.',
    schemaType: 'MedicalBusiness',
    ogTextPattern: '{{businessName}} - Quality Healthcare',
  },

  structuredDataTemplate: {
    ...baseSMBStructuredData,
    '@type': 'MedicalBusiness',
    medicalSpecialty: '{{specialty}}',
    priceRange: '$$$',
  },

  fieldRequirements: [
    { field: 'businessName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
  ],

  mediaCategory: 'smb-medical',
  galleryStyle: 'grid',
  heroImageStyle: 'gradient',
  ctaStyle: 'booking',
  phoneEmphasis: 0.8,
}

// ─── Salon / Beauty ──────────────────────────────────────────

export const VERTICAL_SMB_SALON: VerticalPack = {
  id: 'smb_salon',
  label: 'Salon / Beauty',
  description: 'Hair salons, spas, and beauty services',
  siteType: 'small-business',
  icon: 'scissors',

  recommendedPresets: ['smb-beauty-pink', 'smb-elegant-gold'],
  defaultPreset: 'smb-beauty-pink',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Your Beauty, Our Passion',
        'Where Style Meets Excellence',
        'Experience the Art of Beauty',
        'Look Your Best. Feel Your Best.',
      ],
    },
    heroSubheadline: {
      variants: [
        'Expert stylists dedicated to making you shine.',
        'Personalized beauty services in a relaxing atmosphere.',
        'Book your transformation today.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{businessName}} is a premier salon dedicated to helping you look and feel your best.',
        'Our talented team of stylists brings creativity and expertise to every appointment.',
        'Step into {{businessName}} and experience beauty services tailored just for you.',
      ],
    },
    ctaText: {
      variants: ['Book an Appointment', 'Schedule Your Visit', 'Book Now', 'Get Gorgeous'],
    },
    ctaSecondaryText: {
      variants: ['View Our Services', 'Meet Our Stylists', 'See Our Work'],
    },
    faqQuestions: [
      { question: 'How do I book an appointment?', answerTemplate: 'You can book online, call us at {{phone}}, or walk in during business hours.' },
      { question: 'Do you take walk-ins?', answerTemplate: 'Yes, we welcome walk-ins based on availability. Appointments are recommended.' },
      { question: 'What products do you use?', answerTemplate: 'We use high-quality professional products to ensure the best results.' },
      { question: 'Do you offer gift cards?', answerTemplate: 'Yes! Gift cards are available for purchase at our salon or online.' },
    ],
    trustBadges: {
      variants: ['Expert Stylists', 'Premium Products', 'Walk-Ins Welcome', 'Relaxing Atmosphere'],
    },
    contactHeader: {
      variants: ['Book Your Appointment', 'Visit Us', 'Contact {{businessName}}'],
    },
    servicesHeader: {
      variants: ['Our Services', 'Beauty Services', 'What We Offer'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'services', 'gallery', 'team', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'services', 'gallery', 'team', 'testimonials', 'faq', 'contact'],
    heroStyle: 'image',
    galleryStyle: 'grid',
    contactStyle: 'booking',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'expert', label: 'Expert Stylists', defaultEnabled: true },
    { id: 'premium', label: 'Premium Products', defaultEnabled: true },
    { id: 'walkins', label: 'Walk-Ins Welcome', defaultEnabled: true },
    { id: 'relaxing', label: 'Relaxing Atmosphere', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{businessName}} | Salon in {{location}}',
    descriptionPattern: '{{businessName}} offers expert {{services}} in {{location}}. Book your appointment today. Call {{phone}}.',
    schemaType: 'BeautySalon',
    ogTextPattern: '{{businessName}} - Beauty Excellence',
  },

  structuredDataTemplate: {
    ...baseSMBStructuredData,
    '@type': 'BeautySalon',
    priceRange: '$$',
  },

  fieldRequirements: [
    { field: 'businessName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
  ],

  mediaCategory: 'smb-salon',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'booking',
  phoneEmphasis: 0.6,
}

// ─── Auto Services ───────────────────────────────────────────

export const VERTICAL_SMB_AUTO: VerticalPack = {
  id: 'smb_auto',
  label: 'Auto Services',
  description: 'Auto repair, detailing, and automotive services',
  siteType: 'small-business',
  icon: 'car',

  recommendedPresets: ['smb-auto-red', 'smb-industrial-gray'],
  defaultPreset: 'smb-auto-red',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Expert Auto Care You Can Trust',
        'Keep Your Vehicle Running Strong',
        'Professional Auto Services',
        'Your Trusted Mechanic in {{location}}',
      ],
    },
    heroSubheadline: {
      variants: [
        'Honest service at fair prices.',
        'ASE-certified technicians ready to help.',
        'From oil changes to major repairs, we do it all.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{businessName}} has been keeping {{location}} vehicles on the road for over {{yearsInBusiness}} years.',
        'Our certified technicians deliver honest, reliable auto service at fair prices.',
        'We treat your car like our own, providing quality work you can depend on.',
      ],
    },
    ctaText: {
      variants: ['Schedule Service', 'Get a Quote', 'Book an Appointment', 'Call for Service'],
    },
    ctaSecondaryText: {
      variants: ['View Our Services', 'See Our Specials', 'Read Reviews'],
    },
    faqQuestions: [
      { question: 'Do you offer free estimates?', answerTemplate: 'Yes, we provide free estimates for most services.' },
      { question: 'What brands do you service?', answerTemplate: 'We service all makes and models, both domestic and import.' },
      { question: 'Do you offer warranty on repairs?', answerTemplate: 'Yes, we stand behind our work with a warranty on parts and labor.' },
      { question: 'Can I wait while my car is serviced?', answerTemplate: 'Yes, we have a comfortable waiting area, or we can arrange alternative transportation.' },
    ],
    trustBadges: {
      variants: ['Certified Technicians', 'All Makes & Models', 'Warranty on Work', 'Fair Pricing'],
    },
    contactHeader: {
      variants: ['Schedule Your Service', 'Bring Your Car In', 'Contact Us'],
    },
    servicesHeader: {
      variants: ['Our Services', 'Auto Services', 'What We Do'],
    },
  },

  sectionDefaults: {
    ...baseSMBSections,
    galleryStyle: 'grid',
    contactStyle: 'appointment',
  },

  trustBadges: [
    { id: 'certified', label: 'Certified Technicians', defaultEnabled: true },
    { id: 'all-makes', label: 'All Makes & Models', defaultEnabled: true },
    { id: 'warranty', label: 'Warranty on Work', defaultEnabled: true },
    { id: 'fair', label: 'Fair Pricing', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{businessName}} | Auto Repair in {{location}}',
    descriptionPattern: 'Trusted auto repair in {{location}}. {{businessName}} offers {{services}}. Certified technicians. Call {{phone}}.',
    schemaType: 'AutoRepair',
    ogTextPattern: '{{businessName}} - Trusted Auto Care',
  },

  structuredDataTemplate: {
    ...baseSMBStructuredData,
    '@type': 'AutoRepair',
    priceRange: '$$',
  },

  fieldRequirements: [
    { field: 'businessName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
  ],

  mediaCategory: 'smb-auto',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'booking',
  phoneEmphasis: 0.8,
}

// ─── Retail Store ────────────────────────────────────────────

export const VERTICAL_SMB_RETAIL: VerticalPack = {
  id: 'smb_retail',
  label: 'Retail Store',
  description: 'Retail shops and storefronts',
  siteType: 'small-business',
  icon: 'store',

  recommendedPresets: ['smb-retail-vibrant', 'smb-minimal-modern'],
  defaultPreset: 'smb-retail-vibrant',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Discover Something Special',
        'Your Local Destination for {{products}}',
        'Quality Products. Local Service.',
        'Shop Local. Shop {{businessName}}.',
      ],
    },
    heroSubheadline: {
      variants: [
        'Curated selection, personal service.',
        'Visit us today or shop online.',
        'Supporting our community since {{foundedYear}}.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{businessName}} is your go-to destination for {{products}} in {{location}}.',
        'We\'re passionate about bringing quality products and exceptional service to our community.',
        'As a locally-owned shop, we take pride in every customer we serve.',
      ],
    },
    ctaText: {
      variants: ['Shop Now', 'Visit Our Store', 'Browse Products', 'Explore Our Selection'],
    },
    ctaSecondaryText: {
      variants: ['Find Us', 'See What\'s New', 'View Hours'],
    },
    faqQuestions: [
      { question: 'What are your store hours?', answerTemplate: 'Please see our contact section for current hours or call {{phone}}.' },
      { question: 'Do you offer online shopping?', answerTemplate: 'Contact us for information about ordering and shipping options.' },
      { question: 'Do you accept returns?', answerTemplate: 'Yes, we have a fair return policy. Ask in-store for details.' },
      { question: 'Do you offer gift wrapping?', answerTemplate: 'Yes, complimentary gift wrapping is available on most purchases.' },
    ],
    trustBadges: {
      variants: ['Locally Owned', 'Quality Selection', 'Personal Service', 'Community Focused'],
    },
    contactHeader: {
      variants: ['Visit Us', 'Find Our Store', 'Get in Touch'],
    },
    servicesHeader: {
      variants: ['What We Offer', 'Our Products', 'Shop Categories'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'products', 'gallery', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'products', 'gallery', 'testimonials', 'faq', 'contact'],
    heroStyle: 'image',
    galleryStyle: 'grid',
    contactStyle: 'hours',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'local', label: 'Locally Owned', defaultEnabled: true },
    { id: 'quality', label: 'Quality Selection', defaultEnabled: true },
    { id: 'service', label: 'Personal Service', defaultEnabled: true },
    { id: 'community', label: 'Community Focused', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{businessName}} | {{products}} in {{location}}',
    descriptionPattern: 'Shop {{products}} at {{businessName}} in {{location}}. Quality selection, personal service. Visit us today.',
    schemaType: 'Store',
    ogTextPattern: '{{businessName}} - Shop Local',
  },

  structuredDataTemplate: {
    ...baseSMBStructuredData,
    '@type': 'Store',
    priceRange: '$$',
  },

  fieldRequirements: [
    { field: 'businessName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
  ],

  mediaCategory: 'smb-retail',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'standard',
  phoneEmphasis: 0.5,
}

// ─── Nonprofit Organization ──────────────────────────────────

export const VERTICAL_SMB_NONPROFIT: VerticalPack = {
  id: 'smb_nonprofit',
  label: 'Nonprofit Organization',
  description: 'Charitable organizations and community nonprofits',
  siteType: 'small-business',
  icon: 'heart',

  recommendedPresets: ['smb-nonprofit-green', 'smb-community-blue'],
  defaultPreset: 'smb-nonprofit-green',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Making a Difference Together',
        'Join Our Mission',
        'Creating Change in Our Community',
        'Together, We Can Do More',
      ],
    },
    heroSubheadline: {
      variants: [
        'Supporting {{cause}} through action and compassion.',
        'Your support makes our work possible.',
        'Join the movement. Change lives.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{businessName}} is dedicated to {{mission}} in our community and beyond.',
        'Since {{foundedYear}}, we have been working to make a positive impact.',
        'Our organization brings people together to create meaningful change.',
      ],
    },
    ctaText: {
      variants: ['Donate Now', 'Support Our Cause', 'Get Involved', 'Join Us'],
    },
    ctaSecondaryText: {
      variants: ['Learn More', 'Volunteer', 'Our Impact'],
    },
    faqQuestions: [
      { question: 'How can I donate?', answerTemplate: 'You can donate online, by mail, or by contacting us directly at {{phone}}.' },
      { question: 'Are donations tax-deductible?', answerTemplate: 'Yes, {{businessName}} is a registered 501(c)(3) organization. Donations are tax-deductible.' },
      { question: 'How can I volunteer?', answerTemplate: 'We welcome volunteers! Contact us to learn about current opportunities.' },
      { question: 'Where does my donation go?', answerTemplate: 'We are committed to transparency. Contact us for information on how funds are allocated.' },
    ],
    trustBadges: {
      variants: ['501(c)(3) Nonprofit', 'Transparent Financials', 'Community Impact', 'Volunteer Powered'],
    },
    contactHeader: {
      variants: ['Get in Touch', 'Connect With Us', 'Join Our Mission'],
    },
    servicesHeader: {
      variants: ['Our Programs', 'What We Do', 'Our Impact'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'programs', 'impact', 'team', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'programs', 'impact', 'team', 'testimonials', 'faq', 'contact'],
    heroStyle: 'gradient',
    galleryStyle: 'grid',
    contactStyle: 'donation',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: '501c3', label: '501(c)(3) Nonprofit', defaultEnabled: true },
    { id: 'transparent', label: 'Transparent Financials', defaultEnabled: true },
    { id: 'impact', label: 'Community Impact', defaultEnabled: true },
    { id: 'volunteer', label: 'Volunteer Powered', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{businessName}} | {{tagline}}',
    descriptionPattern: '{{businessName}} is dedicated to {{mission}}. Support our cause. Donate or volunteer today.',
    schemaType: 'NGO',
    ogTextPattern: '{{businessName}} - Making a Difference',
  },

  structuredDataTemplate: {
    ...baseSMBStructuredData,
    '@type': 'NGO',
    nonprofitStatus: '501(c)(3)',
  },

  fieldRequirements: [
    { field: 'businessName', required: true, minLength: 2, maxLength: 100 },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'smb-nonprofit',
  galleryStyle: 'grid',
  heroImageStyle: 'gradient',
  ctaStyle: 'donation',
  phoneEmphasis: 0.4,
}

// ─── Export All SMB Verticals ────────────────────────────────

export const SMB_VERTICALS: VerticalPack[] = [
  VERTICAL_SMB_CONTRACTOR,
  VERTICAL_SMB_RESTAURANT,
  VERTICAL_SMB_MEDICAL,
  VERTICAL_SMB_SALON,
  VERTICAL_SMB_AUTO,
  VERTICAL_SMB_RETAIL,
  VERTICAL_SMB_NONPROFIT,
]

/**
 * Get an SMB vertical by business type ID.
 */
export function getSMBVertical(businessType: BusinessType): VerticalPack | null {
  return SMB_VERTICALS.find(v => v.id === businessType) ?? null
}
