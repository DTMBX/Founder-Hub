/**
 * Centralized Framer Motion Animation Variants
 *
 * Shared across all components for consistent entrance/exit/hover
 * animations. All respect the motion context system.
 */

import type { Variants, Transition } from 'framer-motion'

// ── Shared Easing Curves ─────────────────────────────────────

/** Smooth entrance easing — slow start, fast middle, soft landing */
const easeOut: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Spring-like bounce for interactive elements */
const easeSpring: [number, number, number, number] = [0.34, 1.56, 0.64, 1]

/** Gentle deceleration for natural motion */
const easeDecel: [number, number, number, number] = [0.0, 0.0, 0.2, 1]

export { easeOut, easeSpring, easeDecel }

// ── Section Entrance Variants ────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: easeDecel },
  },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: easeOut },
  },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
}

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
}

// ── Container / Stagger Variants ─────────────────────────────

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOut },
  },
}

// ── Interactive Variants ─────────────────────────────────────

export const hoverLift: Variants = {
  rest: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.02,
    transition: { duration: 0.25, ease: easeDecel },
  },
}

export const tapScale: Variants = {
  rest: { scale: 1 },
  tap: { scale: 0.97 },
}

export const glowHover: Variants = {
  rest: { boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)' },
  hover: {
    boxShadow: '0 0 20px 4px oklch(0.65 0.17 155 / 0.15)',
    transition: { duration: 0.3 },
  },
}

// ── Page / Route Transition ──────────────────────────────────

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeDecel },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2 },
  },
}

// ── Viewport Trigger Config ──────────────────────────────────

export const viewportOnce = { once: true, margin: '-80px' as const }

// ── Transition Presets ───────────────────────────────────────

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
}

export const smoothTransition: Transition = {
  duration: 0.4,
  ease: easeOut,
}
