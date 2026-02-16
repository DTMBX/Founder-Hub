/**
 * Law Firm Vertical Packs
 *
 * Defines vertical configurations for different law practice types.
 * Each vertical provides specialized defaults, copy templates, and
 * section configurations appropriate for the practice area.
 */

import type { VerticalPack, BusinessType } from './verticals.types'

// ─── Helper: Base Law Firm Sections ──────────────────────────

const baseLawFirmSections = {
  enabledSections: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'contact'],
  sectionOrder: ['hero', 'about', 'practiceAreas', 'attorneys', 'caseResults', 'testimonials', 'faq', 'blog', 'contact'],
  heroStyle: 'solid' as const,
  showTrustBadges: true,
  showUrgencyBanner: false,
}

// ─── Helper: Base Law Firm Structured Data ───────────────────

const baseLegalStructuredData = {
  '@context': 'https://schema.org' as const,
  '@type': 'LegalService',
  name: '{{firmName}}',
  description: '{{description}}',
  telephone: '{{phone}}',
  email: '{{email}}',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '{{address}}',
  },
  url: '{{website}}',
  priceRange: '$$',
}

// ─── General Law Firm ────────────────────────────────────────

export const VERTICAL_LAWFIRM_GENERAL: VerticalPack = {
  id: 'lawfirm_general',
  label: 'General Practice',
  description: 'Full-service law firm covering multiple practice areas',
  siteType: 'law-firm',
  icon: 'scales',

  recommendedPresets: ['lawfirm-classic-navy', 'lawfirm-modern-slate', 'lawfirm-executive-burgundy'],
  defaultPreset: 'lawfirm-classic-navy',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Experienced Legal Counsel You Can Trust',
        'Dedicated Attorneys Fighting for Your Rights',
        'Results-Driven Legal Representation',
        'Your Trusted Legal Advocates',
      ],
    },
    heroSubheadline: {
      variants: [
        'Serving clients with integrity and dedication for over {{yearsInBusiness}} years.',
        'Providing comprehensive legal solutions tailored to your needs.',
        'Committed to achieving the best possible outcomes for our clients.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{firmName}} is a full-service law firm committed to providing exceptional legal representation across a wide range of practice areas.',
        'At {{firmName}}, we combine deep legal expertise with a client-centered approach to deliver outstanding results.',
        'Founded on principles of integrity and excellence, {{firmName}} has been serving clients with distinction.',
      ],
    },
    ctaText: {
      variants: ['Schedule a Consultation', 'Contact Us Today', 'Get Legal Help Now', 'Request a Case Review'],
    },
    ctaSecondaryText: {
      variants: ['Learn More About Our Services', 'View Our Practice Areas', 'Meet Our Attorneys'],
    },
    faqQuestions: [
      { question: 'What areas of law do you practice?', answerTemplate: 'We provide comprehensive legal services across multiple practice areas including {{practiceAreas}}.' },
      { question: 'How do I schedule a consultation?', answerTemplate: 'You can schedule a consultation by calling our office at {{phone}} or by using the contact form on this page.' },
      { question: 'What should I bring to my initial consultation?', answerTemplate: 'Please bring any relevant documents, correspondence, and a summary of your legal matter.' },
      { question: 'Do you offer payment plans?', answerTemplate: 'We offer flexible fee arrangements. Please contact us to discuss options that work for your situation.' },
    ],
    trustBadges: {
      variants: ['Trusted Legal Counsel', 'Client-Focused Advocacy', 'Proven Track Record', 'Personalized Attention'],
    },
    contactHeader: {
      variants: ['Contact Our Legal Team', 'Get in Touch', 'Schedule Your Consultation'],
    },
    servicesHeader: {
      variants: ['Our Practice Areas', 'Legal Services', 'How We Can Help'],
    },
  },

  sectionDefaults: {
    ...baseLawFirmSections,
    galleryStyle: 'grid',
    contactStyle: 'intake',
  },

  trustBadges: [
    { id: 'bar-member', label: 'State Bar Member', defaultEnabled: true },
    { id: 'free-consultation', label: 'Free Initial Consultation', defaultEnabled: true },
    { id: 'confidential', label: 'Confidential & Secure', defaultEnabled: true },
    { id: 'responsive', label: '24/7 Availability', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{firmName}} | {{tagline}}',
    descriptionPattern: '{{firmName}} provides {{practiceAreas}} legal services in {{location}}. Contact us for a consultation.',
    schemaType: 'LegalService',
    ogTextPattern: '{{firmName}} - Trusted Legal Counsel',
  },

  structuredDataTemplate: baseLegalStructuredData,

  fieldRequirements: [
    { field: 'firmName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'legal-general',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'consultation',
  phoneEmphasis: 0.7,
}

// ─── Criminal Defense ────────────────────────────────────────

export const VERTICAL_LAWFIRM_CRIMINAL: VerticalPack = {
  id: 'lawfirm_criminal',
  label: 'Criminal Defense',
  description: 'Criminal defense attorneys protecting your rights and freedom',
  siteType: 'law-firm',
  icon: 'shield',

  recommendedPresets: ['lawfirm-classic-navy', 'lawfirm-modern-slate'],
  defaultPreset: 'lawfirm-classic-navy',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Aggressive Criminal Defense When You Need It Most',
        'Protecting Your Rights, Defending Your Future',
        'Experienced Criminal Defense Attorneys',
        'Fight Back with Proven Legal Defense',
      ],
    },
    heroSubheadline: {
      variants: [
        'Available 24/7. Call now for immediate legal assistance.',
        'We fight for every client. No case is too complex.',
        'Your freedom is our priority. Contact us immediately.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{firmName}} provides aggressive criminal defense representation for clients facing serious charges.',
        'When your freedom is at stake, {{firmName}} delivers the vigorous defense you deserve.',
        'Our criminal defense attorneys have successfully defended clients facing charges ranging from misdemeanors to serious felonies.',
      ],
    },
    ctaText: {
      variants: ['Call Now for Immediate Help', 'Get Emergency Legal Help', 'Speak to an Attorney Now', 'Free Case Evaluation'],
    },
    ctaSecondaryText: {
      variants: ['Learn About Your Rights', 'View Our Case Results', 'Understand the Process'],
    },
    faqQuestions: [
      { question: 'What should I do if I\'ve been arrested?', answerTemplate: 'Exercise your right to remain silent and contact an attorney immediately. Do not speak to police without legal representation.' },
      { question: 'Do you handle felony and misdemeanor cases?', answerTemplate: 'Yes, we defend clients against all criminal charges including felonies, misdemeanors, DUI/DWI, and more.' },
      { question: 'Can you help if I\'ve already been charged?', answerTemplate: 'Absolutely. Contact us immediately so we can begin building your defense strategy.' },
      { question: 'What are your fees?', answerTemplate: 'We offer competitive fee structures and payment plans. Contact us for a confidential fee consultation.' },
    ],
    trustBadges: {
      variants: ['24/7 Availability', 'Aggressive Defense', 'Confidential Consultation', 'Proven Results'],
    },
    contactHeader: {
      variants: ['Get Immediate Legal Help', 'Contact Us 24/7', 'Speak to a Defense Attorney'],
    },
    servicesHeader: {
      variants: ['Criminal Defense Services', 'Cases We Handle', 'Our Defense Practice'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'practiceAreas', 'attorneys', 'contact'],
    sectionOrder: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'faq', 'contact'],
    heroStyle: 'solid',
    galleryStyle: 'grid',
    contactStyle: 'intake',
    showTrustBadges: true,
    showUrgencyBanner: true,  // Criminal defense emphasizes urgency
  },

  trustBadges: [
    { id: '24-7', label: 'Available 24/7', defaultEnabled: true },
    { id: 'free-consultation', label: 'Free Case Evaluation', defaultEnabled: true },
    { id: 'confidential', label: 'Confidential', defaultEnabled: true },
    { id: 'aggressive', label: 'Aggressive Defense', defaultEnabled: true },
  ],

  seoDefaults: {
    titlePattern: '{{firmName}} | Criminal Defense Attorneys',
    descriptionPattern: 'Aggressive criminal defense representation in {{location}}. Available 24/7. Call {{phone}} for immediate legal help.',
    schemaType: 'LegalService',
    schemaProperties: { areaServed: '{{location}}' },
    ogTextPattern: 'Criminal Defense - Available 24/7',
  },

  structuredDataTemplate: {
    ...baseLegalStructuredData,
    '@type': 'Attorney',
    knowsAbout: ['Criminal Defense', 'DUI Defense', 'Felony Defense'],
  },

  fieldRequirements: [
    { field: 'firmName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'legal-criminal',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'urgent',
  phoneEmphasis: 1.0,  // Maximum phone emphasis for emergency calls
}

// ─── Personal Injury ─────────────────────────────────────────

export const VERTICAL_LAWFIRM_PERSONAL_INJURY: VerticalPack = {
  id: 'lawfirm_personal_injury',
  label: 'Personal Injury',
  description: 'Personal injury attorneys fighting for maximum compensation',
  siteType: 'law-firm',
  icon: 'medical',

  recommendedPresets: ['lawfirm-modern-slate', 'lawfirm-classic-navy'],
  defaultPreset: 'lawfirm-modern-slate',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Injured? Get the Compensation You Deserve',
        'Fighting for Injury Victims Since {{foundedYear}}',
        'Personal Injury Attorneys Who Fight for You',
        'You Deserve Justice. We\'ll Fight for It.',
      ],
    },
    heroSubheadline: {
      variants: [
        'No fees unless we recover compensation for you.',
        'Millions recovered for our clients. Let us help you too.',
        'Free case evaluation. We handle all types of injury cases.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{firmName}} has recovered millions of dollars for injured clients and their families.',
        'Our personal injury attorneys fight tirelessly to ensure you receive full and fair compensation.',
        'At {{firmName}}, we understand the physical, emotional, and financial toll injuries take on families.',
      ],
    },
    ctaText: {
      variants: ['Get Your Free Case Evaluation', 'No Fee Unless We Win', 'Start Your Free Consultation', 'See What Your Case Is Worth'],
    },
    ctaSecondaryText: {
      variants: ['View Our Case Results', 'Learn About the Process', 'Read Client Stories'],
    },
    faqQuestions: [
      { question: 'How much does it cost to hire your firm?', answerTemplate: 'We work on a contingency fee basis — you pay nothing unless we recover compensation for you.' },
      { question: 'What types of injury cases do you handle?', answerTemplate: 'We handle all personal injury matters including auto accidents, slip and fall, medical malpractice, and more.' },
      { question: 'How long do I have to file a claim?', answerTemplate: 'Statutes of limitations vary. Contact us immediately to ensure your rights are protected.' },
      { question: 'What is my case worth?', answerTemplate: 'Case values depend on many factors. Contact us for a free evaluation of your specific situation.' },
    ],
    trustBadges: {
      variants: ['No Fee Unless We Win', 'Millions Recovered', 'Free Case Review', 'Compassionate Advocacy'],
    },
    contactHeader: {
      variants: ['Get Your Free Case Evaluation', 'Injured? Contact Us Now', 'Start Your Claim Today'],
    },
    servicesHeader: {
      variants: ['Cases We Handle', 'Types of Injury Cases', 'Personal Injury Services'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'practiceAreas', 'caseResults', 'attorneys', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'caseResults', 'practiceAreas', 'attorneys', 'testimonials', 'faq', 'contact'],
    heroStyle: 'gradient',
    galleryStyle: 'grid',
    contactStyle: 'intake',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'no-fee', label: 'No Fee Unless We Win', defaultEnabled: true },
    { id: 'millions', label: 'Millions Recovered', defaultEnabled: true },
    { id: 'free-consult', label: 'Free Consultation', defaultEnabled: true },
    { id: 'contingency', label: 'Contingency Fee Basis', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{firmName}} | Personal Injury Attorneys',
    descriptionPattern: 'Injured in {{location}}? {{firmName}} fights for maximum compensation. No fee unless we win. Call {{phone}}.',
    schemaType: 'LegalService',
    schemaProperties: { areaServed: '{{location}}' },
    ogTextPattern: 'Personal Injury - No Fee Unless We Win',
  },

  structuredDataTemplate: {
    ...baseLegalStructuredData,
    '@type': 'Attorney',
    knowsAbout: ['Personal Injury', 'Auto Accidents', 'Medical Malpractice', 'Workers Compensation'],
  },

  fieldRequirements: [
    { field: 'firmName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'legal-injury',
  galleryStyle: 'grid',
  heroImageStyle: 'gradient',
  ctaStyle: 'consultation',
  phoneEmphasis: 0.8,
}

// ─── Family Law ──────────────────────────────────────────────

export const VERTICAL_LAWFIRM_FAMILY: VerticalPack = {
  id: 'lawfirm_family',
  label: 'Family Law',
  description: 'Compassionate family law attorneys guiding you through difficult times',
  siteType: 'law-firm',
  icon: 'family',

  recommendedPresets: ['lawfirm-minimal-white', 'lawfirm-modern-slate'],
  defaultPreset: 'lawfirm-minimal-white',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Compassionate Family Law Representation',
        'Protecting Families Through Difficult Times',
        'Family Law Attorneys Who Understand',
        'Guiding You Through Family Legal Matters',
      ],
    },
    heroSubheadline: {
      variants: [
        'Sensitive, experienced legal guidance for your family\'s future.',
        'We help families navigate divorce, custody, and more with dignity.',
        'Confidential consultations. Compassionate representation.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{firmName}} provides compassionate and effective legal representation for all family law matters.',
        'We understand that family legal issues are deeply personal. Our attorneys guide you with sensitivity and skill.',
        'At {{firmName}}, we prioritize your family\'s well-being while protecting your legal rights.',
      ],
    },
    ctaText: {
      variants: ['Schedule a Private Consultation', 'Discuss Your Situation', 'Get Confidential Help', 'Book a Consultation'],
    },
    ctaSecondaryText: {
      variants: ['Learn About Our Approach', 'Understand Your Options', 'Read Client Testimonials'],
    },
    faqQuestions: [
      { question: 'How long does divorce typically take?', answerTemplate: 'Timelines vary depending on complexity and whether the divorce is contested. We can discuss your specific situation in a consultation.' },
      { question: 'How is child custody determined?', answerTemplate: 'Courts prioritize the best interests of the child. We advocate vigorously for favorable custody arrangements.' },
      { question: 'Do you handle prenuptial agreements?', answerTemplate: 'Yes, we assist with prenuptial and postnuptial agreements to protect your interests.' },
      { question: 'Are consultations confidential?', answerTemplate: 'Absolutely. All consultations are completely confidential and protected by attorney-client privilege.' },
    ],
    trustBadges: {
      variants: ['Confidential & Discreet', 'Compassionate Approach', 'Experienced Advocates', 'Family-Focused'],
    },
    contactHeader: {
      variants: ['Schedule a Private Consultation', 'Let\'s Talk About Your Situation', 'Contact Us Confidentially'],
    },
    servicesHeader: {
      variants: ['Family Law Services', 'How We Help Families', 'Our Practice Areas'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'faq', 'contact'],
    heroStyle: 'image',
    galleryStyle: 'grid',
    contactStyle: 'appointment',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'confidential', label: 'Confidential', defaultEnabled: true },
    { id: 'compassionate', label: 'Compassionate Approach', defaultEnabled: true },
    { id: 'experienced', label: 'Experienced Team', defaultEnabled: true },
    { id: 'child-focused', label: 'Child-Focused', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{firmName}} | Family Law Attorneys',
    descriptionPattern: 'Compassionate family law representation in {{location}}. Divorce, custody, support & more. Call {{phone}} for a confidential consultation.',
    schemaType: 'LegalService',
    ogTextPattern: 'Family Law - Compassionate Representation',
  },

  structuredDataTemplate: {
    ...baseLegalStructuredData,
    '@type': 'Attorney',
    knowsAbout: ['Family Law', 'Divorce', 'Child Custody', 'Child Support', 'Prenuptial Agreements'],
  },

  fieldRequirements: [
    { field: 'firmName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'legal-family',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'booking',
  phoneEmphasis: 0.6,
}

// ─── Immigration Law ─────────────────────────────────────────

export const VERTICAL_LAWFIRM_IMMIGRATION: VerticalPack = {
  id: 'lawfirm_immigration',
  label: 'Immigration Law',
  description: 'Immigration attorneys helping families and businesses navigate the system',
  siteType: 'law-firm',
  icon: 'globe',

  recommendedPresets: ['lawfirm-modern-slate', 'lawfirm-classic-navy'],
  defaultPreset: 'lawfirm-modern-slate',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Your Path to Immigration Success',
        'Experienced Immigration Attorneys',
        'Navigating Immigration Together',
        'Immigration Solutions That Work',
      ],
    },
    heroSubheadline: {
      variants: [
        'Helping families and businesses achieve their immigration goals.',
        'Dedicated to guiding you through the complex immigration process.',
        'Comprehensive immigration services for individuals and employers.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{firmName}} provides comprehensive immigration services to help individuals and families achieve their American dream.',
        'Our immigration attorneys have helped thousands of clients successfully navigate the U.S. immigration system.',
        'At {{firmName}}, we understand the challenges of immigration. We\'re here to guide you every step of the way.',
      ],
    },
    ctaText: {
      variants: ['Schedule Your Immigration Consultation', 'Start Your Immigration Journey', 'Book an Appointment', 'Get Immigration Help'],
    },
    ctaSecondaryText: {
      variants: ['Check Your Eligibility', 'Learn About Our Services', 'View Success Stories'],
    },
    faqQuestions: [
      { question: 'What immigration services do you offer?', answerTemplate: 'We handle all immigration matters including family visas, employment visas, green cards, citizenship, and deportation defense.' },
      { question: 'How long does the immigration process take?', answerTemplate: 'Timelines vary significantly by case type. We can provide specific estimates during your consultation.' },
      { question: 'Do you offer services in other languages?', answerTemplate: 'Yes, our team can assist clients in multiple languages. Please inquire about language availability.' },
      { question: 'What documents do I need for my consultation?', answerTemplate: 'Please bring identification, any immigration documents you have, and a list of questions about your case.' },
    ],
    trustBadges: {
      variants: ['Multilingual Staff', 'Thousands Helped', 'Personalized Attention', 'Experienced Team'],
    },
    contactHeader: {
      variants: ['Schedule Your Immigration Consultation', 'Start Your Journey', 'Contact Our Immigration Team'],
    },
    servicesHeader: {
      variants: ['Immigration Services', 'How We Can Help', 'Our Practice Areas'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'faq', 'contact'],
    heroStyle: 'gradient',
    galleryStyle: 'grid',
    contactStyle: 'appointment',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'multilingual', label: 'Multilingual Staff', defaultEnabled: true },
    { id: 'thousands-helped', label: 'Thousands Helped', defaultEnabled: true },
    { id: 'experienced', label: 'Experienced Attorneys', defaultEnabled: true },
    { id: 'personalized', label: 'Personalized Service', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{firmName}} | Immigration Attorneys',
    descriptionPattern: 'Immigration attorneys in {{location}} helping with visas, green cards, citizenship & more. Call {{phone}} for a consultation.',
    schemaType: 'LegalService',
    ogTextPattern: 'Immigration Law - Your Path Forward',
  },

  structuredDataTemplate: {
    ...baseLegalStructuredData,
    '@type': 'Attorney',
    knowsAbout: ['Immigration Law', 'Visa Applications', 'Green Cards', 'Citizenship', 'Deportation Defense'],
  },

  fieldRequirements: [
    { field: 'firmName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'legal-immigration',
  galleryStyle: 'grid',
  heroImageStyle: 'gradient',
  ctaStyle: 'booking',
  phoneEmphasis: 0.7,
}

// ─── Real Estate Law ─────────────────────────────────────────

export const VERTICAL_LAWFIRM_REAL_ESTATE: VerticalPack = {
  id: 'lawfirm_real_estate',
  label: 'Real Estate Law',
  description: 'Real estate attorneys for transactions, disputes, and development',
  siteType: 'law-firm',
  icon: 'building',

  recommendedPresets: ['lawfirm-executive-burgundy', 'lawfirm-classic-navy'],
  defaultPreset: 'lawfirm-executive-burgundy',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Trusted Real Estate Legal Counsel',
        'Protecting Your Property Interests',
        'Real Estate Attorneys You Can Rely On',
        'Expert Real Estate Legal Services',
      ],
    },
    heroSubheadline: {
      variants: [
        'Guiding transactions, resolving disputes, and protecting investments.',
        'From closings to litigation, we handle all real estate matters.',
        'Experienced counsel for buyers, sellers, developers, and investors.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{firmName}} provides comprehensive real estate legal services for individuals, businesses, and developers.',
        'Our real estate attorneys bring decades of experience to every transaction and dispute.',
        'At {{firmName}}, we protect our clients\' property interests with meticulous attention to detail.',
      ],
    },
    ctaText: {
      variants: ['Schedule a Consultation', 'Discuss Your Transaction', 'Get Legal Guidance', 'Contact Our Team'],
    },
    ctaSecondaryText: {
      variants: ['Learn About Our Services', 'View Our Expertise', 'Read Client Reviews'],
    },
    faqQuestions: [
      { question: 'What real estate services do you provide?', answerTemplate: 'We handle residential and commercial transactions, title issues, disputes, development, and landlord-tenant matters.' },
      { question: 'Do you handle commercial real estate?', answerTemplate: 'Yes, we represent clients in all types of commercial real estate transactions and disputes.' },
      { question: 'How much do your services cost?', answerTemplate: 'Fees vary by service type. We offer competitive rates and can provide estimates during an initial consultation.' },
      { question: 'Can you help with title issues?', answerTemplate: 'Absolutely. We regularly resolve title defects, boundary disputes, and lien issues.' },
    ],
    trustBadges: {
      variants: ['Experienced Counsel', 'Transaction Expertise', 'Detail-Oriented', 'Trusted Advisors'],
    },
    contactHeader: {
      variants: ['Discuss Your Real Estate Needs', 'Contact Our Real Estate Team', 'Schedule a Consultation'],
    },
    servicesHeader: {
      variants: ['Real Estate Services', 'Our Expertise', 'How We Can Help'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'faq', 'contact'],
    heroStyle: 'image',
    galleryStyle: 'grid',
    contactStyle: 'simple',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'experienced', label: 'Experienced Counsel', defaultEnabled: true },
    { id: 'detail', label: 'Detail-Oriented', defaultEnabled: true },
    { id: 'trusted', label: 'Trusted Advisors', defaultEnabled: true },
    { id: 'responsive', label: 'Responsive Service', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{firmName}} | Real Estate Attorneys',
    descriptionPattern: 'Real estate attorneys in {{location}} for transactions, disputes & development. Call {{phone}} for experienced legal counsel.',
    schemaType: 'LegalService',
    ogTextPattern: 'Real Estate Law - Trusted Counsel',
  },

  structuredDataTemplate: {
    ...baseLegalStructuredData,
    '@type': 'Attorney',
    knowsAbout: ['Real Estate Law', 'Property Transactions', 'Title Issues', 'Commercial Real Estate'],
  },

  fieldRequirements: [
    { field: 'firmName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'legal-realestate',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'consultation',
  phoneEmphasis: 0.6,
}

// ─── Civil Rights Law ────────────────────────────────────────

export const VERTICAL_LAWFIRM_CIVIL_RIGHTS: VerticalPack = {
  id: 'lawfirm_civil_rights',
  label: 'Civil Rights',
  description: 'Civil rights attorneys fighting for justice and equality',
  siteType: 'law-firm',
  icon: 'justice',

  recommendedPresets: ['lawfirm-classic-navy', 'lawfirm-minimal-white'],
  defaultPreset: 'lawfirm-classic-navy',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Fighting for Your Constitutional Rights',
        'Civil Rights Attorneys Committed to Justice',
        'Protecting Your Rights Under the Law',
        'Standing Up for Justice',
      ],
    },
    heroSubheadline: {
      variants: [
        'Dedicated to protecting civil liberties and fighting discrimination.',
        'When your rights are violated, we fight back.',
        'Experienced advocates for civil rights and constitutional protections.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{firmName}} is dedicated to protecting civil rights and fighting against discrimination and injustice.',
        'Our attorneys have a proven track record of holding wrongdoers accountable for civil rights violations.',
        'At {{firmName}}, we believe everyone deserves equal treatment under the law. We fight to make that a reality.',
      ],
    },
    ctaText: {
      variants: ['Report a Rights Violation', 'Get Legal Help', 'Schedule a Consultation', 'Contact Our Team'],
    },
    ctaSecondaryText: {
      variants: ['Learn About Your Rights', 'View Our Case History', 'Understand the Process'],
    },
    faqQuestions: [
      { question: 'What types of civil rights cases do you handle?', answerTemplate: 'We handle discrimination, excessive force, wrongful arrest, employment discrimination, and other civil rights matters.' },
      { question: 'How do I know if my rights were violated?', answerTemplate: 'Contact us to discuss your situation. We can help determine if a civil rights violation occurred.' },
      { question: 'What damages can I recover?', answerTemplate: 'Depending on your case, you may be entitled to compensatory damages, punitive damages, and attorney fees.' },
      { question: 'Is there a time limit to file a claim?', answerTemplate: 'Yes, strict deadlines apply. Contact us as soon as possible to protect your rights.' },
    ],
    trustBadges: {
      variants: ['Committed to Justice', 'Experienced Advocates', 'Fighting for Equality', 'Results-Driven'],
    },
    contactHeader: {
      variants: ['Report a Rights Violation', 'Contact Our Civil Rights Team', 'Get Justice'],
    },
    servicesHeader: {
      variants: ['Civil Rights Practice Areas', 'Cases We Handle', 'How We Fight for You'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'practiceAreas', 'caseResults', 'attorneys', 'contact'],
    sectionOrder: ['hero', 'about', 'practiceAreas', 'caseResults', 'attorneys', 'testimonials', 'faq', 'contact'],
    heroStyle: 'solid',
    galleryStyle: 'grid',
    contactStyle: 'intake',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'justice', label: 'Committed to Justice', defaultEnabled: true },
    { id: 'advocates', label: 'Experienced Advocates', defaultEnabled: true },
    { id: 'equality', label: 'Fighting for Equality', defaultEnabled: true },
    { id: 'results', label: 'Proven Results', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{firmName}} | Civil Rights Attorneys',
    descriptionPattern: 'Civil rights attorneys in {{location}} fighting discrimination and protecting constitutional rights. Contact us for help.',
    schemaType: 'LegalService',
    ogTextPattern: 'Civil Rights - Fighting for Justice',
  },

  structuredDataTemplate: {
    ...baseLegalStructuredData,
    '@type': 'Attorney',
    knowsAbout: ['Civil Rights', 'Discrimination', 'Constitutional Law', 'Police Misconduct'],
  },

  fieldRequirements: [
    { field: 'firmName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'legal-civilrights',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'standard',
  phoneEmphasis: 0.7,
}

// ─── Business Law ────────────────────────────────────────────

export const VERTICAL_LAWFIRM_BUSINESS: VerticalPack = {
  id: 'lawfirm_business',
  label: 'Business Law',
  description: 'Business attorneys advising on formation, contracts, and disputes',
  siteType: 'law-firm',
  icon: 'briefcase',

  recommendedPresets: ['lawfirm-executive-burgundy', 'lawfirm-modern-slate'],
  defaultPreset: 'lawfirm-executive-burgundy',

  copyTemplates: {
    heroHeadline: {
      variants: [
        'Strategic Business Legal Counsel',
        'Business Attorneys Who Understand Business',
        'Legal Partners for Your Success',
        'Protecting Your Business Interests',
      ],
    },
    heroSubheadline: {
      variants: [
        'From startups to established enterprises, we provide strategic legal guidance.',
        'Comprehensive business law services tailored to your needs.',
        'Experienced counsel for transactions, disputes, and everything in between.',
      ],
    },
    aboutIntro: {
      variants: [
        '{{firmName}} provides comprehensive business legal services to companies of all sizes.',
        'Our business attorneys combine legal expertise with practical business sense to deliver effective solutions.',
        'At {{firmName}}, we serve as trusted legal advisors to businesses across industries.',
      ],
    },
    ctaText: {
      variants: ['Schedule a Business Consultation', 'Discuss Your Legal Needs', 'Contact Our Business Team', 'Get Legal Counsel'],
    },
    ctaSecondaryText: {
      variants: ['View Our Services', 'Learn About Our Approach', 'Read Client Success Stories'],
    },
    faqQuestions: [
      { question: 'What business legal services do you offer?', answerTemplate: 'We handle entity formation, contracts, employment matters, M&A, commercial disputes, and regulatory compliance.' },
      { question: 'Do you work with startups?', answerTemplate: 'Yes, we work with businesses at all stages, from formation through growth and exit.' },
      { question: 'How do you structure your fees?', answerTemplate: 'We offer flexible fee arrangements including hourly, flat fee, and retainer options depending on the engagement.' },
      { question: 'Can you help with contract disputes?', answerTemplate: 'Absolutely. We handle all types of commercial disputes through negotiation, arbitration, and litigation.' },
    ],
    trustBadges: {
      variants: ['Strategic Counsel', 'Business-Minded', 'Experienced Team', 'Trusted Partners'],
    },
    contactHeader: {
      variants: ['Discuss Your Business Needs', 'Contact Our Business Team', 'Schedule a Consultation'],
    },
    servicesHeader: {
      variants: ['Business Legal Services', 'How We Help Businesses', 'Our Practice Areas'],
    },
  },

  sectionDefaults: {
    enabledSections: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'contact'],
    sectionOrder: ['hero', 'about', 'practiceAreas', 'attorneys', 'testimonials', 'faq', 'contact'],
    heroStyle: 'image',
    galleryStyle: 'grid',
    contactStyle: 'simple',
    showTrustBadges: true,
    showUrgencyBanner: false,
  },

  trustBadges: [
    { id: 'strategic', label: 'Strategic Counsel', defaultEnabled: true },
    { id: 'business-minded', label: 'Business-Minded', defaultEnabled: true },
    { id: 'experienced', label: 'Experienced Team', defaultEnabled: true },
    { id: 'trusted', label: 'Trusted Partners', defaultEnabled: false },
  ],

  seoDefaults: {
    titlePattern: '{{firmName}} | Business Attorneys',
    descriptionPattern: 'Business attorneys in {{location}} for contracts, disputes, formation & more. Strategic legal counsel for your business. Call {{phone}}.',
    schemaType: 'LegalService',
    ogTextPattern: 'Business Law - Strategic Counsel',
  },

  structuredDataTemplate: {
    ...baseLegalStructuredData,
    '@type': 'Attorney',
    knowsAbout: ['Business Law', 'Contracts', 'Corporate Formation', 'Mergers and Acquisitions', 'Commercial Litigation'],
  },

  fieldRequirements: [
    { field: 'firmName', required: true, minLength: 2, maxLength: 100 },
    { field: 'phone', required: true, pattern: '^[\\d\\s\\-\\(\\)\\+]+$' },
    { field: 'email', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' },
  ],

  mediaCategory: 'legal-business',
  galleryStyle: 'grid',
  heroImageStyle: 'photo',
  ctaStyle: 'consultation',
  phoneEmphasis: 0.5,
}

// ─── Export All Law Firm Verticals ───────────────────────────

export const LAWFIRM_VERTICALS: VerticalPack[] = [
  VERTICAL_LAWFIRM_GENERAL,
  VERTICAL_LAWFIRM_CRIMINAL,
  VERTICAL_LAWFIRM_PERSONAL_INJURY,
  VERTICAL_LAWFIRM_FAMILY,
  VERTICAL_LAWFIRM_IMMIGRATION,
  VERTICAL_LAWFIRM_REAL_ESTATE,
  VERTICAL_LAWFIRM_CIVIL_RIGHTS,
  VERTICAL_LAWFIRM_BUSINESS,
]

/**
 * Get a law firm vertical by business type ID.
 */
export function getLawFirmVertical(businessType: BusinessType): VerticalPack | null {
  return LAWFIRM_VERTICALS.find(v => v.id === businessType) ?? null
}
