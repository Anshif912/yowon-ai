/**
 * YOWON AI — Motion Design System
 *
 * Centralised motion tokens used by Framer Motion variants, CSS transitions,
 * and animation utilities throughout the application.
 *
 * Categories:
 *  - duration:  raw numbers in seconds
 *  - ease:      cubic-bezier arrays for Framer Motion
 *  - spring:    Framer Motion spring configs
 *  - variants:  pre-built Framer Motion variant maps
 */

// ---------------------------------------------------------------------------
// Duration tokens
// ---------------------------------------------------------------------------
export const duration = {
  instant:  0.08,
  fast:     0.15,
  medium:   0.28,
  slow:     0.50,
  slower:   0.75,
  page:     0.40,
} as const

// ---------------------------------------------------------------------------
// Easing tokens
// ---------------------------------------------------------------------------
export const ease = {
  /** Standard smooth in-out */
  smooth:   [0.4, 0, 0.2, 1] as const,
  /** Enter / reveal */
  enter:    [0, 0, 0.2, 1]   as const,
  /** Exit / dismiss */
  exit:     [0.4, 0, 1, 1]   as const,
  /** Snappy micro-interactions */
  snappy:   [0.22, 1, 0.36, 1] as const,
  /** Linear — for continuous loops */
  linear:   'linear'           as const,
} as const

// ---------------------------------------------------------------------------
// Spring tokens
// ---------------------------------------------------------------------------
export const spring = {
  gentle: { type: 'spring', stiffness: 200, damping: 30, mass: 1     } as const,
  snappy: { type: 'spring', stiffness: 400, damping: 35, mass: 0.75  } as const,
  bouncy: { type: 'spring', stiffness: 500, damping: 28, mass: 0.8   } as const,
  stiff:  { type: 'spring', stiffness: 600, damping: 40, mass: 1     } as const,
  slow:   { type: 'spring', stiffness: 120, damping: 25, mass: 1.2   } as const,
} as const

// ---------------------------------------------------------------------------
// Pre-built Framer Motion variant maps
// ---------------------------------------------------------------------------

/** Fade up — standard card / section entrance */
export const fadeUp = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      delay: i * 0.06,
      duration: duration.slow,
      ease: ease.enter,
    },
  }),
} as const

/** Fade in — simple opacity entrance */
export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: {
      delay: i * 0.05,
      duration: duration.medium,
      ease: ease.smooth,
    },
  }),
} as const

/** Scale in — modal / dialog entrance */
export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.96, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: duration.medium, ease: ease.snappy },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    filter: 'blur(4px)',
    transition: { duration: duration.fast, ease: ease.exit },
  },
} as const

/** Slide in from left — sidebar / drawer */
export const slideInLeft = {
  hidden:  { opacity: 0, x: -24, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: spring.snappy,
  },
  exit: {
    opacity: 0,
    x: -16,
    transition: { duration: duration.fast, ease: ease.exit },
  },
} as const

/** Hover glow — applied to glass cards */
export const hoverGlow = {
  rest: {
    boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 4px 20px rgba(0,0,0,0.25)',
    y: 0,
  },
  hover: {
    boxShadow: '0 0 0 1px rgba(0,229,255,0.15), 0 24px 70px rgba(0,0,0,0.50), 0 0 40px rgba(0,229,255,0.08)',
    y: -2,
    transition: { duration: duration.fast, ease: ease.smooth },
  },
} as const

/** Press feedback — applied to buttons */
export const pressFeedback = {
  tap: { scale: 0.97, transition: { duration: duration.instant } },
} as const

// ---------------------------------------------------------------------------
// CSS transition value helpers (for `style={{ transition }}` usage)
// ---------------------------------------------------------------------------
export const cssTransition = {
  fast:   `all ${duration.fast}s cubic-bezier(0.4,0,0.2,1)`,
  medium: `all ${duration.medium}s cubic-bezier(0.4,0,0.2,1)`,
  slow:   `all ${duration.slow}s cubic-bezier(0.4,0,0.2,1)`,
  colors: `color ${duration.fast}s ease, background-color ${duration.fast}s ease, border-color ${duration.fast}s ease`,
  shadow: `box-shadow ${duration.medium}s cubic-bezier(0.4,0,0.2,1)`,
} as const
