import { useEffect, useRef, memo } from 'react'

interface SoftAuroraProps {
  colorStops?: [string, string, string]
  speed?: number
  amplitude?: number
}

const SoftAurora = memo(function SoftAurora({
  colorStops = ['#00F5FF', '#8B5CF6', '#4F46E5'],
  speed = 0.5,
  amplitude = 1.0
}: SoftAuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Aurora blob configurations
    const blobs = [
      {
        x: width * 0.25,
        y: height * 0.25,
        r: Math.min(width, height) * 0.45,
        color: colorStops[0],
        speedX: 0.002 * speed,
        speedY: 0.0015 * speed,
        seedX: Math.random() * 100,
        seedY: Math.random() * 100,
        opacity: 0.08 * amplitude
      },
      {
        x: width * 0.75,
        y: height * 0.35,
        r: Math.min(width, height) * 0.5,
        color: colorStops[1],
        speedX: -0.0015 * speed,
        speedY: 0.0025 * speed,
        seedX: Math.random() * 100,
        seedY: Math.random() * 100,
        opacity: 0.07 * amplitude
      },
      {
        x: width * 0.5,
        y: height * 0.8,
        r: Math.min(width, height) * 0.4,
        color: colorStops[2],
        speedX: 0.001 * speed,
        speedY: -0.001 * speed,
        seedX: Math.random() * 100,
        seedY: Math.random() * 100,
        opacity: 0.05 * amplitude
      }
    ]

    let lastFrameTime = performance.now()
    let frameCount = 0
    let fps = 60
    let fpsCheckInterval = 2000 // recalculate fps every 2 seconds
    let lastFpsCheck = performance.now()
    
    // Performance throttling parameter: skip frames if frame time is slow
    let skipInterval = 1 // 1 = render every frame, 2 = render every 2nd frame (30fps lock)
    let currentFrame = 0

    const render = (time: number) => {
      currentFrame++
      
      // Calculate performance FPS for dynamic fallback
      frameCount++
      if (time - lastFpsCheck >= fpsCheckInterval) {
        fps = Math.round((frameCount * 1000) / (time - lastFpsCheck))
        frameCount = 0
        lastFpsCheck = time
        
        // Dynamic performance throttle: fallback to 30 FPS render loops on low-spec laptops
        if (fps < 45) {
          skipInterval = 2
        } else {
          skipInterval = 1
        }
      }

      if (currentFrame % skipInterval !== 0) {
        animationId = requestAnimationFrame(render)
        return
      }

      // Smooth background base fill (#07070A)
      ctx.fillStyle = '#07070a'
      ctx.fillRect(0, 0, width, height)

      // Enable standard blending
      ctx.globalCompositeOperation = 'screen'

      // Animate blobs
      blobs.forEach((blob) => {
        blob.seedX += blob.speedX
        blob.seedY += blob.speedY

        // Trigonometric wave-based slow movement
        const currentX = blob.x + Math.sin(blob.seedX) * (width * 0.08)
        const currentY = blob.y + Math.cos(blob.seedY) * (height * 0.06)

        // Draw radial gradient spot
        const grad = ctx.createRadialGradient(
          currentX,
          currentY,
          0,
          currentX,
          currentY,
          blob.r
        )

        // Color stops interpolation
        grad.addColorStop(0, blob.color)
        grad.addColorStop(0.2, blob.color)
        grad.addColorStop(1, 'transparent')

        ctx.fillStyle = grad
        ctx.globalAlpha = blob.opacity
        ctx.beginPath()
        ctx.arc(currentX, currentY, blob.r, 0, Math.PI * 2)
        ctx.fill()
      })

      lastFrameTime = time
      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
    }
  }, [colorStops, speed, amplitude])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        // Heavy blur offloaded entirely to GPU composition layer
        filter: 'blur(80px) saturate(1.4)',
        transform: 'translate3d(0, 0, 0)',
        willChange: 'transform',
        backgroundColor: '#07070a'
      }}
    />
  )
})

export default SoftAurora
