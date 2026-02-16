/**
 * Skip Links
 *
 * Accessible skip links for keyboard navigation.
 * Visible only on focus for screen reader and keyboard users.
 */

import { SKIP_LINKS } from '../a11y.config'

export interface SkipLinksProps {
  /** Custom skip links (defaults to SKIP_LINKS config) */
  links?: typeof SKIP_LINKS
}

/**
 * Skip links for keyboard navigation.
 * Place at the top of the page, before main content.
 *
 * Styled to be invisible until focused.
 */
export function SkipLinks({ links = SKIP_LINKS }: SkipLinksProps) {
  return (
    <nav aria-label="Skip navigation" className="skip-links">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="skip-link"
          onClick={(e) => {
            e.preventDefault()
            const target = document.getElementById(link.id)
            if (target) {
              target.focus()
              target.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        >
          {link.label}
        </a>
      ))}
      <style>{`
        .skip-links {
          position: absolute;
          top: 0;
          left: 0;
          z-index: 9999;
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
        }
        
        .skip-link {
          position: absolute;
          transform: translateY(-100%);
          padding: 0.75rem 1rem;
          background: var(--color-background, #000);
          color: var(--color-foreground, #fff);
          text-decoration: none;
          font-weight: 500;
          border-radius: 0.25rem;
          opacity: 0;
          transition: transform 0.15s ease, opacity 0.15s ease;
        }
        
        .skip-link:focus {
          position: relative;
          transform: translateY(0);
          opacity: 1;
          outline: 2px solid var(--color-primary, #3b82f6);
          outline-offset: 2px;
        }
      `}</style>
    </nav>
  )
}

export default SkipLinks
