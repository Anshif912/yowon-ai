/**
 * AnimatedGrid — Ambient Glow Orbs
 *
 * The 3D perspective grid has been replaced by the Strands WebGL background.
 * This component now renders only two large ambient glow orbs that provide
 * soft colour context beneath the Strands canvas.
 *
 * z-index: -25 (between Strands at -30 and aurora at -20)
 * pointer-events: none, contains: paint
 */
export default function AnimatedGrid() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1, contain: 'paint' }}
    >
      {/* Cyan ambient orb — top-left */}
      <div
        style={{
          position:   'absolute',
          top:        '-10%',
          left:       '10%',
          width:      '650px',
          height:     '650px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,245,255,0.60) 0%, transparent 70%)',
          filter:     'blur(120px)',
          opacity:    0.07,
          mixBlendMode: 'screen',
          willChange: 'transform',
        }}
      />
      {/* Violet ambient orb — bottom-right */}
      <div
        style={{
          position:   'absolute',
          bottom:     '-5%',
          right:      '8%',
          width:      '700px',
          height:     '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.65) 0%, transparent 70%)',
          filter:     'blur(130px)',
          opacity:    0.07,
          mixBlendMode: 'screen',
          willChange: 'transform',
        }}
      />
    </div>
  )
}
