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
  subtitle: 'Founder & technologist building tools that bring clarity to complexity—from civic infrastructure to custom digital solutions.',
  
  // Call-to-action buttons
  buttons: {
    primary: {
      text: 'Explore Projects',
      link: '#projects',
    },
    secondary: {
      text: 'Get in Touch',
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
  mission: 'I build technology that solves real problems—platforms that make complex systems accessible, transparent, and actionable.',
  
  // Current focus description
  currentFocus: 'Currently focused on civic technology infrastructure, custom web development for businesses, and tools that bridge the gap between technical capability and everyday usability.',
  
  // Core values (displayed as badges)
  coreValues: [
    'Clarity',
    'Ownership', 
    'Reliability',
    'Results',
  ],
}

// ============================================================================
// CONTACT SECTION
// ============================================================================

export const contactContent = {
  // Section title
  title: 'Start a Conversation',
  
  // Section description
  description: 'Have a project in mind or want to explore working together? Reach out directly.',
  
  // Primary email (shown prominently)
  primaryEmail: 'hello@devon-tyler.com',
  
  // Department emails
  emails: [
    {
      label: 'Project Inquiries',
      email: 'hello@devon-tyler.com',
      description: 'New projects & general questions',
    },
    {
      label: 'Partnerships',
      email: 'partner@devon-tyler.com',
      description: 'Business collaborations & ventures',
    },
    {
      label: 'Investment',
      email: 'invest@devon-tyler.com',
      description: 'Funding opportunities & investor relations',
    },
  ],
}

// ============================================================================
// PROJECTS SECTION
// ============================================================================

export const projectsContent = {
  // Section title
  title: 'Current Work',
  
  // Section description
  description: 'From custom business websites to civic technology platforms, I ship solutions that work. Each project is built with clean code, full ownership, and long-term maintainability in mind.',
}

// ============================================================================
// FOOTER
// ============================================================================

export const footerContent = {
  // Copyright text (year is auto-generated)
  copyrightName: 'Devon Tyler Barber',
  
  // Disclaimer text
  disclaimer: 'Professional services and information. Results depend on individual circumstances.',
  
  // Quick links in footer
  links: [
    { label: 'About', href: '#about' },
    { label: 'Work', href: '#projects' },
    { label: 'Contact', href: '#contact' },
  ],
}

// ============================================================================
// SEO & META (for search engines)
// ============================================================================

export const seoContent = {
  // Page title (shows in browser tab)
  pageTitle: 'Devon Tyler Barber | Founder & Technologist',
  
  // Meta description (shows in Google results)
  metaDescription: 'Custom web development, civic technology platforms, and digital infrastructure. Clean code, full ownership, real results.',
  
  // Keywords (comma-separated)
  keywords: 'web development, custom websites, business websites, civic technology, digital infrastructure',
}
