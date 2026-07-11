/**
 * YOWON AI — Theme Controller
 *
 * Defines visual parameters for the volumetric rendering engine across
 * different application pages and contexts.
 */

export interface ThemeProfile {
  colors:            string[]
  count:             number
  speed:             number
  amplitude:         number
  waviness:          number
  thickness:         number
  glow:              number
  spread:            number
  opacity:           number
  scale:             number
  blurAmount:        string
  glassTransparency: number
  noiseStrength:     number
  primaryGlow:       string
  secondaryGlow:     string
}

export type ThemeType = 'landing' | 'dashboard' | 'report' | 'graph' | 'modal' | 'presentation'

export const THEME_PROFILES: Record<ThemeType, ThemeProfile> = {
  landing: {
    colors:            ['#00F5FF', '#06B6D4', '#7C3AED'],
    count:             4,
    speed:             0.28,
    amplitude:         1.0,
    waviness:          1.0,
    thickness:         0.65,
    glow:              2.3,
    spread:            1.1,
    opacity:           0.16,
    scale:             1.8,
    blurAmount:        '24px',
    glassTransparency: 0.45,
    noiseStrength:     0.028,
    primaryGlow:       'rgba(0, 245, 255, 0.09)', // cyan
    secondaryGlow:     'rgba(124, 58, 237, 0.09)', // purple
  },
  dashboard: {
    colors:            ['#00F5FF', '#06B6D4', '#7C3AED'],
    count:             4,
    speed:             0.18,
    amplitude:         1.0,
    waviness:          1.0,
    thickness:         0.65,
    glow:              1.8,
    spread:            1.1,
    opacity:           0.09,
    scale:             1.8,
    blurAmount:        '24px',
    glassTransparency: 0.45,
    noiseStrength:     0.020,
    primaryGlow:       'rgba(0, 245, 255, 0.06)',
    secondaryGlow:     'rgba(124, 58, 237, 0.06)',
  },
  report: {
    colors:            ['#00F5FF', '#06B6D4', '#7C3AED'],
    count:             4,
    speed:             0.18,
    amplitude:         1.0,
    waviness:          1.0,
    thickness:         0.65,
    glow:              1.8,
    spread:            1.1,
    opacity:           0.05,
    scale:             1.8,
    blurAmount:        '28px',
    glassTransparency: 0.50,
    noiseStrength:     0.015,
    primaryGlow:       'rgba(0, 245, 255, 0.04)',
    secondaryGlow:     'rgba(124, 58, 237, 0.04)',
  },
  graph: {
    colors:            ['#00F5FF', '#06B6D4', '#7C3AED'],
    count:             2,
    speed:             0.18,
    amplitude:         1.0,
    waviness:          1.0,
    thickness:         0.65,
    glow:              1.4,
    spread:            1.1,
    opacity:           0.03,
    scale:             1.8,
    blurAmount:        '20px',
    glassTransparency: 0.40,
    noiseStrength:     0.010,
    primaryGlow:       'rgba(0, 245, 255, 0.02)',
    secondaryGlow:     'rgba(124, 58, 237, 0.02)',
  },
  modal: {
    colors:            ['#00F5FF', '#06B6D4', '#7C3AED'],
    count:             4,
    speed:             0.22,
    amplitude:         1.0,
    waviness:          1.0,
    thickness:         0.65,
    glow:              2.0,
    spread:            1.1,
    opacity:           0.12,
    scale:             1.8,
    blurAmount:        '32px',
    glassTransparency: 0.60,
    noiseStrength:     0.025,
    primaryGlow:       'rgba(0, 245, 255, 0.08)',
    secondaryGlow:     'rgba(124, 58, 237, 0.08)',
  },
  presentation: {
    colors:            ['#00F5FF', '#06B6D4', '#7C3AED'],
    count:             4,
    speed:             0.28,
    amplitude:         1.0,
    waviness:          1.0,
    thickness:         0.65,
    glow:              2.3,
    spread:            1.1,
    opacity:           0.16,
    scale:             1.8,
    blurAmount:        '24px',
    glassTransparency: 0.35,
    noiseStrength:     0.030,
    primaryGlow:       'rgba(0, 245, 255, 0.12)',
    secondaryGlow:     'rgba(124, 58, 237, 0.12)',
  },
}

/** Get theme type based on location pathname */
export function getThemeFromPathname(pathname: string): ThemeType {
  // If the path indicates graph page views inside reports or evaluations:
  if (
    pathname.includes('graph') ||
    pathname.includes('architecture') ||
    pathname.includes('dependency') ||
    pathname.includes('technology') ||
    pathname.includes('knowledge')
  ) {
    return 'graph'
  }

  if (pathname === '/' || pathname === '/demo') return 'landing'
  if (pathname.includes('/report/')) return 'report'
  if (pathname.includes('/projects') || pathname.includes('/leaderboard')) return 'dashboard'
  if (pathname.includes('/evaluate') || pathname.includes('/submit') || pathname.includes('/jury')) return 'dashboard'
  
  return 'dashboard'
}
