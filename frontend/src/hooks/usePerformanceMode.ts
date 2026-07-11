/**
 * YOWON AI — Performance Mode Detection Hook
 *
 * Automatically determines the optimal rendering quality tier based on:
 *   1. navigator.getBattery() — battery saver mode
 *   2. navigator.hardwareConcurrency — CPU core count
 *   3. devicePixelRatio + screen resolution — GPU load estimate
 *   4. WebGL renderer string — detects integrated vs discrete GPU
 *   5. navigator.connection — saves-data or slow network flag
 *
 * Tiers:
 *   ultra    — Discrete GPU, plugged in, high DPR
 *   high     — Good hardware, not on battery
 *   medium   — Integrated GPU or mid-range hardware
 *   low      — Low-end hardware or mobile
 *   battery  — Battery saver active
 */

import { useState, useEffect, useCallback } from 'react'

export type PerformanceTier = 'ultra' | 'high' | 'medium' | 'low' | 'battery'

export interface PerformanceConfig {
  tier: PerformanceTier
  /** Target strands count (strand segments rendered) */
  strandCount: number
  /** Glow intensity multiplier */
  glowMultiplier: number
  /** Whether noise overlay is rendered */
  noiseEnabled: boolean
  /** Target FPS cap */
  targetFps: number
  /** Canvas device pixel ratio cap */
  maxDpr: number
  /** Whether blur filters on glass cards are active */
  blurEnabled: boolean
}

const TIER_CONFIGS: Record<PerformanceTier, PerformanceConfig> = {
  ultra: {
    tier:          'ultra',
    strandCount:   180,
    glowMultiplier: 1.0,
    noiseEnabled:  true,
    targetFps:     60,
    maxDpr:        2.5,
    blurEnabled:   true,
  },
  high: {
    tier:          'high',
    strandCount:   140,
    glowMultiplier: 0.85,
    noiseEnabled:  true,
    targetFps:     60,
    maxDpr:        2,
    blurEnabled:   true,
  },
  medium: {
    tier:          'medium',
    strandCount:   90,
    glowMultiplier: 0.65,
    noiseEnabled:  false,
    targetFps:     60,
    maxDpr:        1.5,
    blurEnabled:   true,
  },
  low: {
    tier:          'low',
    strandCount:   50,
    glowMultiplier: 0.45,
    noiseEnabled:  false,
    targetFps:     30,
    maxDpr:        1,
    blurEnabled:   false,
  },
  battery: {
    tier:          'battery',
    strandCount:   30,
    glowMultiplier: 0.30,
    noiseEnabled:  false,
    targetFps:     24,
    maxDpr:        1,
    blurEnabled:   false,
  },
}

/** Detect GPU tier via WebGL renderer string */
function detectGpuTier(): 'discrete' | 'integrated' | 'unknown' {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    if (!gl) return 'unknown'
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    if (!ext) return 'unknown'
    const renderer = (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string).toLowerCase()
    // Clean up
    const loseCtx = gl.getExtension('WEBGL_lose_context')
    loseCtx?.loseContext()
    canvas.remove()

    // Keywords that indicate discrete / high-end GPUs
    const discreteKeywords = ['nvidia', 'rtx', 'gtx', 'radeon rx', 'arc ', 'vega']
    // Keywords that indicate integrated / low-end GPUs
    const integratedKeywords = ['intel', 'iris', 'hd graphics', 'uhd', 'mali', 'adreno', 'apple m', 'llvmpipe', 'swiftshader', 'mesa']

    if (discreteKeywords.some(k => renderer.includes(k))) return 'discrete'
    if (integratedKeywords.some(k => renderer.includes(k))) return 'integrated'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/** Check if device is in battery saver mode */
async function isBatterySaver(): Promise<boolean> {
  try {
    const nav = navigator as unknown as { getBattery?: () => Promise<{ charging: boolean; level: number }> }
    if (typeof nav.getBattery === 'function') {
      const battery = await nav.getBattery()
      // Battery saver = not charging AND battery below 20%
      return !battery.charging && battery.level < 0.20
    }
  } catch {
    // Not supported
  }
  return false
}

/** Rough mobile detection */
function isMobileDevice(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/** Compute initial tier synchronously (fast path) */
function computeInitialTier(): PerformanceTier {
  const mobile = isMobileDevice()
  if (mobile) return 'low'

  const dpr    = window.devicePixelRatio ?? 1
  const cores  = navigator.hardwareConcurrency ?? 2
  const width  = window.screen.width * dpr
  const gpu    = detectGpuTier()

  // connection type check
  const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (conn?.saveData) return 'low'

  if (gpu === 'discrete' && cores >= 8 && dpr >= 1.5) return 'ultra'
  if (gpu === 'discrete' || (cores >= 6 && width >= 2560)) return 'high'
  if (gpu === 'integrated' && cores >= 4) return 'medium'
  if (cores <= 2 || width < 1280) return 'low'

  return 'medium'
}

export function usePerformanceMode(): PerformanceConfig {
  const [config, setConfig] = useState<PerformanceConfig>(() => {
    const tier = computeInitialTier()
    return TIER_CONFIGS[tier]
  })

  // Async upgrade: check battery after mount
  const checkBattery = useCallback(async () => {
    const batterySaver = await isBatterySaver()
    if (batterySaver) {
      setConfig(TIER_CONFIGS['battery'])
      return
    }
    // Re-confirm tier with battery info available
    const tier = computeInitialTier()
    setConfig(TIER_CONFIGS[tier])
  }, [])

  useEffect(() => {
    checkBattery()

    // Listen to battery changes
    let battery: { addEventListener: (e: string, fn: () => void) => void; removeEventListener: (e: string, fn: () => void) => void } | null = null

    const handleBatteryChange = () => { checkBattery() }

    ;(async () => {
      try {
        const nav = navigator as unknown as { getBattery?: () => Promise<{ addEventListener: (e: string, fn: () => void) => void; removeEventListener: (e: string, fn: () => void) => void }> }
        if (typeof nav.getBattery === 'function') {
          battery = await nav.getBattery()
          battery?.addEventListener('chargingchange', handleBatteryChange)
          battery?.addEventListener('levelchange', handleBatteryChange)
        }
      } catch {
        // ignore
      }
    })()

    return () => {
      battery?.removeEventListener('chargingchange', handleBatteryChange)
      battery?.removeEventListener('levelchange', handleBatteryChange)
    }
  }, [checkBattery])

  return config
}

export { TIER_CONFIGS }
