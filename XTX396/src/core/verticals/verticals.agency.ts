/**
 * Agency Vertical Packs
 *
 * Defines vertical configurations for different agency types.
 * Each vertical provides specialized defaults, copy templates, and
 * section configurations appropriate for the agency category.
 */

import type { VerticalPack, BusinessType } from './verticals.types'

// ─── Helper: Base Agency Sections ────────────────────────────

const baseAgencySections = {
  enabledSections: ['hero', 'about', 'services', 'portfolio', 'team', 'testimonials', 'contact'],
  sectionOrder: ['hero', 'about', 'services', 'portfolio', 'team', 'testimonials', 'process', 'faq', 'contact'],
  heroStyle: 'gradient' as const,
  showTrustBadges: true,
  showUrgencyBanner: false,
}

// ─── Helper: Base Agency Structured Data ─────────────────────

const baseAgencyStructuredData = {
  '@context': 'https://schema.org' as const,
  '@type': 'ProfessionalService',
  name: '{{agencyName}}',
  description: '{{description}}',
  telephone: '{{phone}}',
  email: '{{email}}',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '{{address}}',
  },
  url: '{{website}}',
}

// ─── General Agency ──────────────────────────────────────────

export const VERTICAL_AGENCY_GENERAL: VerticalPack = {
  id: 'agency_general',
  label: 'General Agency',
  description: 'Full-service creative and professional agency',
  siteType: 'agency',
  icon: 'building',

  recommendedPresets: ['agency-minimal-dark', 'agency-bold-modern', 'agency-creative-gradient'],
  defaultPreset: 'agency-minimal-dark',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'We Build Brands That Matter',
        'Ideas That Inspire. Results That Deliver.',
        'Your Vision. Our Expertise.',
        'Creative Solutions. Real Results.',
      ],
    },
    heroSubheadline: {
      variants: [
        'Full-service agency delivering strategy, design, and development.',
        'Transforming ideas into exceptional experiences.',
        'We partner with ambitious brands to achieve extraordinary results.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{agencyName}} is a full-service agency that combines creative thinking with strategic execution.',
        'We believe great work comes from true partnership. That\'s why we invest in understanding your business.',
        'Our team brings diverse expertise to every project, delivering work that moves the needle.',
      ],
    },
    ctaText: {
      variants: ['Start a Project', 'Let\'s Talk', 'Get in Touch', 'Work With Us'],
    },
    ctaSecondaryText: {
      variants: ['View Our Work', 'See Our Process', 'Meet the Team'],
    },
    faqQuestions: [
      { question: 'What services do you offer?', answerTemplate: 'We offer a full range of services including {{services}}.' },
      { question: 'How do you price projects?', answerTemplate: 'We provide custom quotes based on project scope. Contact us to discuss your needs.' },
      { question: 'What is your process?', answerTemplate: 'We follow a collaborative process that includes discovery, strategy, execution, and optimization.' },
      { question: 'How long do projects typically take?', answerTemplate: 'Timelines vary by scope. We provide accurate estimates after understanding your project.' },
    ],
    trustBadges: {
      variants: ['Award-Winning Work', 'Strategic Partners', 'Results-Driven', 'Full-Service Agency'],
    },
    contactHeader: {
      variants: ['Start a Project', 'Let\'s Create Together', 'Get in Touch'],
    },
    servicesHeader: {
      variants: ['Our Services', 'What We Do', 'How We Help'],
    },
  },

  sectionDefaults: {
    ...baseAgencySections,
    galleryStyle: 'masonry',
    contactStyle: 'project',
  },

  trustBadges: [
    { id: 'award', label: 'Award-Winning', defaultEnabled: true },
    { id: 'strategic', label: 'Strategic Partners', defaultEnabled: true },
    { id: 'results', label: 'Results-Driven', defaultEnabled: true },
    { id: 'full-service', label: 'Full-Service', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{agencyName}} | {{tagline}}',
    descriptionPattern: '{{agencyName}} is a full-service agency offering {{services}}. We help brands achieve extraordinary results.',
    schemaType: 'ProfessionalService',
    ogTextPattern: '{{agencyName}} - We Build Brands',
  },

  structuredDataTemplate: baseAgencyStructuredData,

  fieldRequirements: [
    { field: 'agencyName', required: true, minLength: 2, maxLength: 100 },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'agency-general',
  galleryStyle: 'masonry',
  heroImageStyle: 'gradient',
  ctaStyle: 'project',
  phoneEmphasis: 0.3,
}

// ─── Design Agency ───────────────────────────────────────────

export const VERTICAL_AGENCY_DESIGN: VerticalPack = {
  id: 'agency_design',
  label: 'Design Agency',
  description: 'Graphic design, branding, and visual identity agency',
  siteType: 'agency',
  icon: 'palette',

  recommendedPresets: ['agency-creative-gradient', 'agency-minimal-dark'],
  defaultPreset: 'agency-creative-gradient',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Design That Speaks',
        'Visual Identity. Brand Impact.',
        'Where Creativity Meets Strategy',
        'Design-Driven Brand Solutions',
      ],
    },
    heroSubheadline: {
      variants: [
        'We craft visual identities that connect and convert.',
        'From concept to completion, design excellence at every step.',
        'Beautiful design with purpose and precision.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{agencyName}} is a design studio passionate about creating visual experiences that resonate.',
        'We believe design has the power to transform businesses. Our work proves it.',
        'Our designers bring a unique blend of creativity and strategic thinking to every project.',
      ],
    },
    ctaText: {
      variants: ['Request a Quote', 'Start Your Project', 'Let\'s Design Together', 'Get in Touch'],
    },
    ctaSecondaryText: {
      variants: ['View Portfolio', 'See Our Work', 'Meet Our Designers'],
    },
    faqQuestions: [
      { question: 'What design services do you offer?', answerTemplate: 'We offer branding, visual identity, web design, print design, and more.' },
      { question: 'Do you provide brand guidelines?', answerTemplate: 'Yes, comprehensive brand guidelines are part of our branding packages.' },
      { question: 'How long does a branding project take?', answerTemplate: 'Branding projects typically take 4-8 weeks depending on scope and complexity.' },
      { question: 'Can you work with existing brand assets?', answerTemplate: 'Absolutely. We can refresh, evolve, or build upon your existing brand.' },
    ],
    trustBadges: {
      variants: ['Creative Excellence', 'Strategic Design', 'Brand Specialists', 'Award-Winning'],
    },
    contactHeader: {
      variants: ['Let\'s Create', 'Start Your Design Project', 'Tell Us About Your Vision'],
    },
    servicesHeader: {
      variants: ['Design Services', 'What We Create', 'Our Expertise'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'services', 'portfolio', 'process', 'team', 'contact'],
    sectionOrder: ['hero', 'about', 'portfolio', 'services', 'process', 'team', 'testimonials', 'contact'],
    heroStyle: 'gradient',
    galleryStyle: 'masonry',
    contactStyle: 'project',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'creative', label: 'Creative Excellence', defaultEnabled: true },
    { id: 'strategic', label: 'Strategic Design', defaultEnabled: true },
    { id: 'brand', label: 'Brand Specialists', defaultEnabled: true },
    { id: 'award', label: 'Award-Winning', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{agencyName}} | Design Agency',
    descriptionPattern: '{{agencyName}} — a design agency specializing in {{services}}. We create visual identities that connect.',
    schemaType: 'ProfessionalService',
    ogTextPattern: '{{agencyName}} - Design That Speaks',
  },

  structuredDataTemplate: {
    ...baseAgencyStructuredData,
    '@type': 'ProfessionalService',
    knowsAbout: ['Graphic Design', 'Branding', 'Visual Identity', 'Web Design'],
  },

  fieldRequirements: [
    { field: 'agencyName', required: true, minLength: 2, maxLength: 100 },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'agency-design',
  galleryStyle: 'masonry',
  heroImageStyle: 'gradient',
  ctaStyle: 'project',
  phoneEmphasis: 0.2,
}

// ─── Marketing Agency ────────────────────────────────────────

export const VERTICAL_AGENCY_MARKETING: VerticalPack = {
  id: 'agency_marketing',
  label: 'Marketing Agency',
  description: 'Digital marketing, SEO, and growth agency',
  siteType: 'agency',
  icon: 'chart',

  recommendedPresets: ['agency-bold-modern', 'agency-minimal-dark'],
  defaultPreset: 'agency-bold-modern',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Marketing That Drives Growth',
        'Data-Driven. Results-Focused.',
        'Grow Your Brand. Dominate Your Market.',
        'Marketing Strategies That Work',
      ],
    },
    heroSubheadline: {
      variants: [
        'Strategic marketing solutions that deliver measurable results.',
        'We turn marketing spend into business growth.',
        'Full-funnel marketing from awareness to conversion.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{agencyName}} is a results-driven marketing agency that helps brands grow.',
        'We combine data, creativity, and strategy to deliver marketing that actually works.',
        'Our team has generated millions in revenue for brands across industries.',
      ],
    },
    ctaText: {
      variants: ['Get a Free Audit', 'Request a Proposal', 'Book a Strategy Call', 'Start Growing'],
    },
    ctaSecondaryText: {
      variants: ['View Case Studies', 'See Our Results', 'Our Approach'],
    },
    faqQuestions: [
      { question: 'What marketing services do you offer?', answerTemplate: 'We offer SEO, PPC, social media, content marketing, email marketing, and more.' },
      { question: 'How do you measure success?', answerTemplate: 'We track KPIs that matter to your business: leads, revenue, ROI, and growth metrics.' },
      { question: 'What industries do you work with?', answerTemplate: 'We work across industries including {{industries}}.' },
      { question: 'What is your minimum engagement?', answerTemplate: 'We work with businesses of all sizes. Contact us to discuss your budget and goals.' },
    ],
    trustBadges: {
      variants: ['Data-Driven', 'ROI Focused', 'Full-Funnel Marketing', 'Proven Results'],
    },
    contactHeader: {
      variants: ['Let\'s Grow Together', 'Book a Strategy Call', 'Start Your Growth'],
    },
    servicesHeader: {
      variants: ['Marketing Services', 'How We Help You Grow', 'Our Capabilities'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'services', 'caseStudies', 'team', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'services', 'caseStudies', 'team', 'testimonials', 'faq', 'contact'],
    heroStyle: 'gradient',
    galleryStyle: 'grid',
    contactStyle: 'consultation',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'data', label: 'Data-Driven', defaultEnabled: true },
    { id: 'roi', label: 'ROI Focused', defaultEnabled: true },
    { id: 'full-funnel', label: 'Full-Funnel', defaultEnabled: true },
    { id: 'results', label: 'Proven Results', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{agencyName}} | Marketing Agency',
    descriptionPattern: '{{agencyName}} is a marketing agency delivering {{services}}. We drive growth with data-driven strategies.',
    schemaType: 'ProfessionalService',
    ogTextPattern: '{{agencyName}} - Marketing That Grows',
  },

  structuredDataTemplate: {
    ...baseAgencyStructuredData,
    '@type': 'ProfessionalService',
    knowsAbout: ['Digital Marketing', 'SEO', 'PPC', 'Social Media Marketing', 'Content Marketing'],
  },

  fieldRequirements: [
    { field: 'agencyName', required: true, minLength: 2, maxLength: 100 },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
    { field: 'phone', required: false, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
  ],

  mediaCategory: 'agency-marketing',
  galleryStyle: 'grid',
  heroImageStyle: 'gradient',
  ctaStyle: 'consultation',
  phoneEmphasis: 0.4,
}

// ─── Development Agency ──────────────────────────────────────

export const VERTICAL_AGENCY_DEVELOPMENT: VerticalPack = {
  id: 'agency_development',
  label: 'Development Agency',
  description: 'Web development, software, and digital product agency',
  siteType: 'agency',
  icon: 'code',

  recommendedPresets: ['agency-minimal-dark', 'agency-tech-blue'],
  defaultPreset: 'agency-minimal-dark',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'We Build Digital Products',
        'Code Meets Craft',
        'Engineering Excellence',
        'Digital Solutions Built to Scale',
      ],
    },
    heroSubheadline: {
      variants: [
        'Custom development for startups and enterprises.',
        'From concept to launch, we build products that perform.',
        'Web, mobile, and software development done right.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{agencyName}} is a development agency that builds digital products people love to use.',
        'Our engineering team brings technical depth and product thinking to every project.',
        'We partner with startups and enterprises to build scalable, maintainable software.',
      ],
    },
    ctaText: {
      variants: ['Discuss Your Project', 'Request a Quote', 'Let\'s Build', 'Start a Conversation'],
    },
    ctaSecondaryText: {
      variants: ['View Our Work', 'Our Tech Stack', 'Our Process'],
    },
    faqQuestions: [
      { question: 'What technologies do you use?', answerTemplate: 'We work with modern technologies including {{technologies}}.' },
      { question: 'Do you work with startups?', answerTemplate: 'Yes! We love working with startups to build MVPs and scale products.' },
      { question: 'Can you maintain and support existing projects?', answerTemplate: 'Absolutely. We offer ongoing maintenance and support packages.' },
      { question: 'How do you handle project management?', answerTemplate: 'We use agile methodologies with regular communication and transparent progress tracking.' },
    ],
    trustBadges: {
      variants: ['Modern Tech Stack', 'Agile Process', 'Scalable Solutions', 'Startup Friendly'],
    },
    contactHeader: {
      variants: ['Let\'s Build Something', 'Start Your Project', 'Get in Touch'],
    },
    servicesHeader: {
      variants: ['Development Services', 'What We Build', 'Our Expertise'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'services', 'portfolio', 'process', 'team', 'contact'],
    sectionOrder: ['hero', 'about', 'services', 'portfolio', 'process', 'team', 'testimonials', 'faq', 'contact'],
    heroStyle: 'solid',
    galleryStyle: 'grid',
    contactStyle: 'project',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'modern', label: 'Modern Tech Stack', defaultEnabled: true },
    { id: 'agile', label: 'Agile Process', defaultEnabled: true },
    { id: 'scalable', label: 'Scalable Solutions', defaultEnabled: true },
    { id: 'startup', label: 'Startup Friendly', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{agencyName}} | Development Agency',
    descriptionPattern: '{{agencyName}} — a development agency building web, mobile, and software solutions. We turn ideas into products.',
    schemaType: 'ProfessionalService',
    ogTextPattern: '{{agencyName}} - We Build Digital Products',
  },

  structuredDataTemplate: {
    ...baseAgencyStructuredData,
    '@type': 'ProfessionalService',
    knowsAbout: ['Web Development', 'Mobile Development', 'Software Engineering', 'Product Development'],
  },

  fieldRequirements: [
    { field: 'agencyName', required: true, minLength: 2, maxLength: 100 },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'agency-development',
  galleryStyle: 'grid',
  heroImageStyle: 'solid',
  ctaStyle: 'project',
  phoneEmphasis: 0.2,
}

// ─── Export All Agency Verticals ─────────────────────────────

export const AGENCY_VERTICALS: VerticalPack[] = [
  VERTICAL_AGENCY_GENERAL,
  VERTICAL_AGENCY_DESIGN,
  VERTICAL_AGENCY_MARKETING,
  VERTICAL_AGENCY_DEVELOPMENT,
]

/**
 * Get an agency vertical by business type ID.
 */
export function getAgencyVertical(businessType: BusinessType): VerticalPack | null {
  return AGENCY_VERTICALS.find(v => v.id === businessType) ?? null
}
