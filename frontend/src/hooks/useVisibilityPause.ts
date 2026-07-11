/**
 * YOWON AI — Visibility Pause Hook
 *
 * Monitors document.visibilityState and returns a boolean indicating
 * whether animations should run. When the tab is hidden, all RAF loops
 * should stop to save GPU and battery power.
 *
 * Also monitors prefers-reduced-motion to unconditionally stop animation
 * when the user has requested it at the OS level.
 */

import { useState, useEffect } from 'react'

export interface VisibilityState {
  /** True when the document is visible AND motion is allowed */
  shouldAnimate: boolean
  /** True when document.visibilityState === 'hidden' */
  isHidden: boolean
  /** True when prefers-reduced-motion: reduce is active */
  prefersReduced: boolean
}

export function useVisibilityPause(): VisibilityState {
  const [state, setState] = useState<VisibilityState>(() => {
    const prefersReduced = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
    const isHidden = typeof document !== 'undefined'
      ? document.visibilityState === 'hidden'
      : false
    return {
      shouldAnimate: !prefersReduced && !isHidden,
      isHidden,
      prefersReduced,
    }
  })

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const update = () => {
      const prefersReduced = motionQuery.matches
      const isHidden = document.visibilityState === 'hidden'
      setState({
        shouldAnimate: !prefersReduced && !isHidden,
        isHidden,
        prefersReduced,
      })
    }

    // Page visibility events
    document.addEventListener('visibilitychange', update)
    // Reduced-motion media query changes
    motionQuery.addEventListener('change', update)

    // Initial sync (in case state changed between creation and mount)
    update()

    return () => {
      document.removeEventListener('visibilitychange', update)
      motionQuery.removeEventListener('change', update)
    }
  }, [])

  return state
}
