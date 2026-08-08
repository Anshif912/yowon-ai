/**
 * BackgroundParticleField — Mission Control Atmospheric Layering
 *
 * Layer 1: Dark radial space gradient (#06070A → #0B1018 → #050608)
 * Layer 2: Soft blurred cyan bloom behind Core (< 8% opacity)
 * Layer 3: Quiet intelligence dust (280 soft circular particles, 3-5% opacity)
 * Layer 4: Very faint concentric radar rings (< 6% opacity)
 * Layer 5: Vignette halo around viewport edges
 */

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from 'framer-motion'

/* ── Soft Gaussian Particle Texture ──────────────────────────── */
function createParticleTexture(): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!

  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
  g.addColorStop(0.3, 'rgba(255, 255, 255, 0.5)')
  g.addColorStop(0.7, 'rgba(255, 255, 255, 0.12)')
  g.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

/* ── Layer 3: Quiet Ambient Intelligence Dust ────────────────── */
function AmbientIntelligenceDust() {
  const pointsRef = useRef<THREE.Points>(null)
  const COUNT = 280

  const texture = useMemo(() => createParticleTexture(), [])

  const { positions, velocities, colors, geometry } = useMemo(() => {
    const positions  = new Float32Array(COUNT * 3)
    const velocities = new Float32Array(COUNT * 3)
    const colors     = new Float32Array(COUNT * 3)

    const palette = [
      new THREE.Color('#31E6FF'),
      new THREE.Color('#31E6FF'),
      new THREE.Color('#10B981'),
      new THREE.Color('#8B5CF6'),
      new THREE.Color('#F5A623'),
    ]

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const angle  = Math.random() * Math.PI * 2
      const radius = 20 + Math.random() * 55

      positions[i3 + 0] = Math.cos(angle) * radius
      positions[i3 + 1] = Math.sin(angle) * radius * 0.7
      positions[i3 + 2] = (Math.random() - 0.5) * 16

      const speed = 0.015 + Math.random() * 0.025
      velocities[i3 + 0] = speed
      velocities[i3 + 1] = radius
      velocities[i3 + 2] = angle

      const col = palette[Math.floor(Math.random() * palette.length)]
      colors[i3 + 0] = col.r
      colors[i3 + 1] = col.g
      colors[i3 + 2] = col.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3))

    return { positions, velocities, colors, geometry }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const dt = Math.min(delta, 0.05)

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const speed  = velocities[i3 + 0]
      const radius = velocities[i3 + 1]
      let angle    = velocities[i3 + 2]

      angle += speed * dt * 0.12
      velocities[i3 + 2] = angle

      positions[i3 + 0] = Math.cos(angle) * radius
      positions[i3 + 1] = Math.sin(angle) * radius * 0.7
    }

    geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={1.6}
        map={texture}
        vertexColors
        transparent
        opacity={0.04}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ── Layer 4: Faint Radar Rings ──────────────────────────────── */
function RadarRings() {
  const groupRef = useRef<THREE.Group>(null)

  const ringGeometries = useMemo(() => {
    const defs = [
      { r: 25, seg: 140, skip: 6,  phase: 0.0 },
      { r: 40, seg: 180, skip: 10, phase: 1.2 },
      { r: 56, seg: 220, skip: 7,  phase: 0.6 },
      { r: 74, seg: 260, skip: 14, phase: 2.1 },
    ]

    return defs.map(def => {
      const pts: number[] = []
      for (let i = 0; i < def.seg; i++) {
        if (i % def.skip === 0) continue
        const arc = 0.76
        const a1  = (i / def.seg) * Math.PI * 2 + def.phase
        const a2  = ((i + arc) / def.seg) * Math.PI * 2 + def.phase

        pts.push(def.r * Math.cos(a1), def.r * Math.sin(a1) * 0.85, 0)
        pts.push(def.r * Math.cos(a2), def.r * Math.sin(a2) * 0.85, 0)
      }
      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      return geom
    })
  }, [])

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color      : '#31E6FF',
        transparent: true,
        opacity    : 0.04,
        blending   : THREE.AdditiveBlending,
        depthWrite : false,
      }),
    [],
  )

  useFrame(state => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.children.forEach((child, idx) => {
      const dir   = idx % 2 === 0 ? 1 : -1
      const speed = 0.003 + idx * 0.0015
      child.rotation.z = t * speed * dir
    })
  })

  return (
    <group ref={groupRef}>
      {ringGeometries.map((geom, idx) => (
        <lineSegments key={`radar-${idx}`} geometry={geom} material={material} />
      ))}
    </group>
  )
}

/* ─────────────────────────────────────────────────────────────
   Exported Mission Control Background
───────────────────────────────────────────────────────────── */
export default function BackgroundParticleField() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    >
      {/* Layer 1: Dark Radial Gradient (#06070A → #0B1018 → #050608) */}
      <div
        style={{
          position  : 'absolute',
          inset     : 0,
          background: 'radial-gradient(ellipse at 50% 48%, #0B1018 0%, #06070A 55%, #050608 100%)',
        }}
      />

      {/* Layer 2: Soft Blurred Cyan Bloom behind Core (< 8% opacity) */}
      <div
        style={{
          position    : 'absolute',
          top         : '50%',
          left        : '50%',
          transform   : 'translate(-50%, -52%)',
          width       : 520,
          height      : 520,
          borderRadius: '50%',
          background  : 'radial-gradient(circle at center, rgba(49, 230, 255, 0.07) 0%, rgba(16, 185, 129, 0.02) 45%, transparent 70%)',
          filter      : 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Layer 3 & 4: WebGL Dust & Radar Rings */}
      <Canvas
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 75], fov: 52 }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.2]}
      >
        <AmbientIntelligenceDust />
        <RadarRings />
      </Canvas>

      {/* Layer 5: Soft Vignette around viewport edges */}
      <div
        style={{
          position     : 'absolute',
          inset        : 0,
          background   : 'radial-gradient(ellipse at center, transparent 60%, rgba(5, 6, 8, 0.75) 100%)',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  )
}
