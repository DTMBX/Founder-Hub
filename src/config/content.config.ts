/**
 * HOMEPAGE CONTENT CONFIG
 * ========================
 * 
 * BEGINNER FRIENDLY: Just edit the text in quotes!
 * 
 * This file controls the main text content on your homepage.
 * After editing, save the file and your changes will appear.
 * 
 * TIPS:
 * - Only change text inside 'single quotes' or "double quotes"
 * - Don't delete commas, brackets, or colons
 * - Save with Ctrl+S
 */

// ============================================================================
// HERO SECTION (Top of homepage)
// ============================================================================

export const heroContent = {
  // Main headline - the big text at the top
  headline: 'Devon T. Barber',
  
  // Subtitle - appears under the headline
  subtitle: 'Building transformative solutions at the intersection of technology and justice.',
  
  // Call-to-action buttons
  buttons: {
    primary: {
      text: 'View Projects',
      link: '#projects',
    },
    secondary: {
      text: 'Contact Me',
      link: '#contact',
    },
  },
}

// ============================================================================
// ABOUT SECTION
// ============================================================================

export const aboutContent = {
  // Section title
  title: 'About',
  
  // Your mission statement
  mission: 'Forging transformative solutions at the intersection of technology, home improvement, transparency, and justice.',
  
  // Current focus description
  currentFocus: 'Building civic technology, home improvement platforms, and legal infrastructure that increase transparency and empower communities.',
  
  // Core values (displayed as badges)
  coreValues: [
    'Integrity',
    'Stewardship', 
    'Fortitude',
    'Veracity',
  ],
}

// ============================================================================
// CONTACT SECTION
// ============================================================================

export const contactContent = {
  // Section title
  title: "Let's Connect",
  
  // Section description
  description: 'Interested in collaborating or learning more? Reach out through the right channel.',
  
  // Primary email (shown prominently)
  primaryEmail: 'hello@devon-tyler.com',
  
  // Department emails
  emails: [
    {
      label: 'Legal Services',
      email: 'legal@devon-tyler.com',
      description: 'Court filings & case support',
    },
    {
      label: 'Investor Relations',
      email: 'invest@devon-tyler.com',
      description: 'Funding & partnerships',
    },
    {
      label: 'Business Development',
      email: 'partner@devon-tyler.com',
      description: 'Collaborations & contracts',
    },
  ],
}

// ============================================================================
// PROJECTS SECTION
// ============================================================================

export const projectsContent = {
  // Section title
  title: 'What I Build',
  
  // Section description
  description: 'I am actively building an MMORPG and managing multiple client web services. My work spans transformative solutions at the intersection of technology, gaming, transparency, and justice—delivering scalable, professional services for individuals, businesses, and agencies.',
}

// ============================================================================
// FOOTER
// ============================================================================

export const footerContent = {
  // Copyright text (year is auto-generated)
  copyrightName: 'XTX396',
  
  // Disclaimer text
  disclaimer: 'This site is for informational purposes only and does not constitute legal advice.',
  
  // Quick links in footer
  links: [
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ],
}

// ============================================================================
// SEO & META (for search engines)
// ============================================================================

export const seoContent = {
  // Page title (shows in browser tab)
  pageTitle: 'Devon T. Barber | Technology & Justice',
  
  // Meta description (shows in Google results)
  metaDescription: 'Professional web development, civic technology, and legal infrastructure solutions.',
  
  // Keywords (comma-separated)
  keywords: 'web development, legal technology, civic tech, justice',
}
