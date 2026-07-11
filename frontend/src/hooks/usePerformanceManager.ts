/**
 * YOWON AI — GPU Performance Manager Hook
 *
 * Automatically checks device hardware, battery state, network conditions,
 * and user preferences to adjust WebGL rendering quality and CSS filters.
 */

import { useState, useEffect, useCallback } from 'react'

export type PerformanceTier = 'ultra' | 'high' | 'medium' | 'low' | 'battery'

export interface PerformanceConfig {
  tier:            PerformanceTier
  strandCount:     number    // Particle/strand count
  glowMultiplier:  number    // Volumetric glow intensity
  noiseEnabled:    boolean   // Render noise layers
  blurEnabled:     boolean   // Render backdrop blurs on glass cards
  targetFps:       number    // Cap rendering framerate
  maxDpr:          number    // Resolution scale cap
  distortionLimit: number    // Mouse interaction distortion strength
}

export const PERFORMANCE_TIERS: Record<PerformanceTier, PerformanceConfig> = {
  ultra: {
    tier:            'ultra',
    strandCount:     180,
    glowMultiplier:  1.0,
    noiseEnabled:    true,
    blurEnabled:     true,
    targetFps:       60,
    maxDpr:          2.5,
    distortionLimit: 8,
  },
  high: {
    tier:            'high',
    strandCount:     140,
    glowMultiplier:  0.85,
    noiseEnabled:    true,
    blurEnabled:     true,
    targetFps:       60,
    maxDpr:          2.0,
    distortionLimit: 6,
  },
  medium: {
    tier:            'medium',
    strandCount:     90,
    glowMultiplier:  0.65,
    noiseEnabled:    false,
    blurEnabled:     true,
    targetFps:       45,
    maxDpr:          1.5,
    distortionLimit: 4,
  },
  low: {
    tier:            'low',
    strandCount:     40,
    glowMultiplier:  0.45,
    noiseEnabled:    false,
    blurEnabled:     false,
    targetFps:       30,
    maxDpr:          1.0,
    distortionLimit: 2,
  },
  battery: {
    tier:            'battery',
    strandCount:     25,
    glowMultiplier:  0.30,
    noiseEnabled:    false,
    blurEnabled:     false,
    targetFps:       25,
    maxDpr:          1.0,
    distortionLimit: 0,
  },
}

/** Detect hardware class via WebGL debug renderer */
function detectHardwareClass(): 'discrete' | 'integrated' | 'low' {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return 'low'
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ext) return 'integrated'
    const renderer = (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string).toLowerCase()
    
    // Cleanup WebGL context immediately
    const loseCtx = gl.getExtension('WEBGL_lose_context')
    loseCtx?.loseContext()
    canvas.remove()

    const discreteGpus = ['nvidia', 'rtx', 'gtx', 'radeon rx', 'arc ', 'vega']
    const integratedGpus = ['intel', 'iris', 'hd graphics', 'uhd', 'mali', 'adreno', 'apple m', 'llvmpipe', 'swiftshader']

    if (discreteGpus.some(k => renderer.includes(k))) return 'discrete'
    if (integratedGpus.some(k => renderer.includes(k))) return 'integrated'
    return 'low'
  } catch {
    return 'low'
  }
}

/** Check if device battery saver is active */
async function checkBatterySaver(): Promise<boolean> {
  try {
    const nav = navigator as any
    if (nav.getBattery) {
      const battery = await nav.getBattery()
      return !battery.charging && battery.level < 0.20
    }
  } catch {
    // Battery API not supported
  }
  return false
}

export function usePerformanceManager(): PerformanceConfig {
  const [config, setConfig] = useState<PerformanceConfig>(() => {
    // Fast path: compute initial synchronous config
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (isMobile) return PERFORMANCE_TIERS['low']

    const cores = navigator.hardwareConcurrency || 4
    const gpu = detectHardwareClass()

    if (gpu === 'discrete' && cores >= 8) return PERFORMANCE_TIERS['ultra']
    if (gpu === 'discrete' || cores >= 6) return PERFORMANCE_TIERS['high']
    if (gpu === 'integrated' && cores >= 4) return PERFORMANCE_TIERS['medium']
    return PERFORMANCE_TIERS['low']
  })

  const syncState = useCallback(async () => {
    const battery = await checkBatterySaver()
    if (battery) {
      setConfig(PERFORMANCE_TIERS['battery'])
      return
    }

    const reducedMotion = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
    if (reducedMotion) {
      setConfig(PERFORMANCE_TIERS['low'])
      return
    }
  }, [])

  useEffect(() => {
    syncState()

    let batteryInstance: any = null
    const handler = () => { syncState() }

    ;(async () => {
      try {
        const nav = navigator as any
        if (nav.getBattery) {
          batteryInstance = await nav.getBattery()
          batteryInstance.addEventListener('chargingchange', handler)
          batteryInstance.addEventListener('levelchange', handler)
        }
      } catch {
        // ignore
      }
    })()

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', handler)

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('chargingchange', handler)
        batteryInstance.removeEventListener('levelchange', handler)
      }
      motionQuery.removeEventListener('change', handler)
    }
  }, [syncState])

  return config
}
