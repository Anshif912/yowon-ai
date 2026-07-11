import { memo, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getThemeFromPathname, THEME_PROFILES } from '../../utils/ThemeController'
import { usePerformanceManager } from '../../hooks/usePerformanceManager'
import Galaxy from './Galaxy'

// ---------------------------------------------------------------------------
// Design Constants
// ---------------------------------------------------------------------------
const BASE_COLOR = '#05070A'

// Procedural SVG noise texture base64
const NOISE_SVG = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(%23n)' opacity='1'/></svg>`

// Subtle 3% opacity cyan grid
const GRID_SVG = `data:image/svg+xml,<svg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'><g fill='none'><path stroke='rgba(0,245,255,0.03)' d='M0 0h60M0 30h60'/><path stroke='rgba(0,245,255,0.03)' d='M0 0v60M30 0v60'/></g></svg>`

export const RenderingManager = memo(function RenderingManager() {
  const location = useLocation()
  const performanceConfig = usePerformanceManager()
  
  // Resolve theme settings based on current location pathname
  const activeThemeType = getThemeFromPathname(location.pathname)
  const theme = THEME_PROFILES[activeThemeType]

  const showNoise = useMemo(() => performanceConfig.noiseEnabled, [performanceConfig.noiseEnabled])

  return (
    <>
      {/* ── Layer 0: Dark Base Color Layer (#05070A) ── */}
      <div
        aria-hidden="true"
        style={{
          position:        'fixed',
          inset:           0,
          zIndex:          -50,
          backgroundColor: BASE_COLOR,
          pointerEvents:   'none',
        }}
      />

      {/* ── Layer 1: Global Galaxy Starry Background ── */}
      <div
        aria-hidden="true"
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        -45,
          pointerEvents: 'none',
          opacity:       0.65, // Atmospheric opacity matched to demo
        }}
      >
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.2}
          glowIntensity={0.6}
          saturation={0.5}
          hueShift={240}
          starSpeed={0.3}
          transparent={true}
        />
      </div>

      {/* ── Layer 2: Very Subtle 3% Opacity Grid ── */}
      <div
        aria-hidden="true"
        style={{
          position:        'fixed',
          inset:           0,
          zIndex:          -40,
          pointerEvents:   'none',
          backgroundImage: `url("${GRID_SVG}")`,
          backgroundRepeat: 'repeat',
          backgroundSize:  '60px 60px',
        }}
      />

      {/* ── Layer 3: Subtle Ambient Glow Passes (Dynamic Lighting Engine) ── */}
      <div
        aria-hidden="true"
        style={{
          position:      'fixed',
          inset:         0,
          zIndex:        -30,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 75% 40% at 15% -5%, ${theme.primaryGlow} 0%, transparent 60%),
            radial-gradient(ellipse 65% 35% at 85% 10%, ${theme.secondaryGlow} 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, ${theme.primaryGlow} 0%, transparent 55%)
          `,
          willChange:    'transform',
          transition:    'background 0.5s ease',
        }}
      />

      {/* ── Layer 4: Procedural Noise overlay ── */}
      {showNoise && (
        <div
          aria-hidden="true"
          style={{
            position:        'fixed',
            inset:           0,
            zIndex:          -20,
            pointerEvents:   'none',
            opacity:         theme.noiseStrength,
            backgroundImage: `url("${NOISE_SVG}")`,
            backgroundRepeat: 'repeat',
            backgroundSize:  '300px 300px',
            mixBlendMode:    'overlay',
          }}
        />
      )}
    </>
  )
})

export default RenderingManager
