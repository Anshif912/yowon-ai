import { useRef, useState, useCallback, useEffect, type ElementType } from 'react'
import './LineSidebar.css'

const FALLOFF_CURVES = {
  linear: (p: number) => p,
  smooth: (p: number) => p * p * (3 - 2 * p),
  sharp: (p: number) => p * p * p
}

export interface SidebarItem {
  id: string
  label: string
  icon?: ElementType
}

interface LineSidebarProps {
  items: SidebarItem[]
  activeSection: string
  onNavigate: (id: string) => void
  collapsed?: boolean
  accentColor?: string
  textColor?: string
  markerColor?: string
  showIndex?: boolean
  showMarker?: boolean
  proximityRadius?: number
  maxShift?: number
  falloff?: 'linear' | 'smooth' | 'sharp'
  markerLength?: number
  markerGap?: number
  tickScale?: number
  scaleTick?: boolean
  itemGap?: number
  fontSize?: number
  smoothing?: number
  className?: string
}

const LineSidebar = ({
  items,
  activeSection,
  onNavigate,
  collapsed = false,
  accentColor = '#22d3ee', // Cyan-400 for YOWON AI
  textColor = '#94a3b8', // Slate-400 YOWON text muted
  markerColor = '#334155', // Slate-700 YOWON border
  showIndex = true,
  showMarker = true,
  proximityRadius = 120,
  maxShift = 20,
  falloff = 'smooth',
  markerLength = 40,
  markerGap = 8,
  tickScale = 0.5,
  scaleTick = true,
  itemGap = 16,
  fontSize = 0.9,
  smoothing = 120,
  className = ''
}: LineSidebarProps) => {
  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<Array<HTMLLIElement | null>>([])
  const targetsRef = useRef<number[]>([])
  const currentRef = useRef<number[]>([])
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef(0)
  const activeIndex = items.findIndex(item => item.id === activeSection)
  const activeIndexRef = useRef(activeIndex)
  const smoothingRef = useRef(smoothing)

  activeIndexRef.current = activeIndex
  smoothingRef.current = smoothing

  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05)
    lastRef.current = now
    const tau = Math.max(smoothingRef.current, 1) / 1000
    const k = 1 - Math.exp(-dt / tau)

    let moving = false
    const elements = itemRefs.current
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i]
      if (!el) continue
      const target = Math.max(targetsRef.current[i] || 0, activeIndexRef.current === i ? 1 : 0)
      const cur = currentRef.current[i] || 0
      const next = cur + (target - cur) * k
      const settled = Math.abs(target - next) < 0.0015
      const value = settled ? target : next
      currentRef.current[i] = value
      el.style.setProperty('--effect', value.toFixed(4))
      if (!settled) moving = true
    }

    rafRef.current = moving ? requestAnimationFrame(runFrame) : null
  }, [])

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(runFrame)
  }, [runFrame])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement>) => {
      const list = listRef.current
      if (!list) return
      const rect = list.getBoundingClientRect()
      const pointerY = e.clientY - rect.top
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear
      const elements = itemRefs.current
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i]
        if (!el) continue
        const center = el.offsetTop + el.offsetHeight / 2
        const distance = Math.abs(pointerY - center)
        targetsRef.current[i] = ease(Math.max(0, 1 - distance / proximityRadius))
      }
      startLoop()
    },
    [falloff, proximityRadius, startLoop]
  )

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0)
    startLoop()
  }, [startLoop])

  useEffect(() => {
    startLoop()
  }, [activeIndex, startLoop])

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    },
    []
  )

  return (
    <nav
      className={`line-sidebar${showMarker ? ' line-sidebar--markers' : ''}${scaleTick ? ' line-sidebar--scale-tick' : ''}${collapsed ? ' line-sidebar--collapsed' : ''}${className ? ` ${className}` : ''}`}
      style={{
        // Typecast custom properties to avoid TypeScript warnings
        '--accent-color': accentColor,
        '--text-color': textColor,
        '--marker-color': markerColor,
        '--marker-length': `${markerLength}px`,
        '--marker-gap': `${markerGap}px`,
        '--tick-scale': tickScale,
        '--max-shift': `${collapsed ? 0 : maxShift}px`,
        '--item-gap': `${itemGap}px`,
        '--font-size': `${fontSize}rem`,
        '--smoothing': `${smoothing}ms`
      } as React.CSSProperties}
    >
      <ul
        ref={listRef}
        className="line-sidebar__list w-full"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {items.map((item, index) => {
          const Icon = item.icon
          const active = activeIndex === index
          return (
            <li
              key={item.id}
              ref={el => {
                itemRefs.current[index] = el
              }}
              className={`line-sidebar__item flex items-center justify-start ${active ? 'line-sidebar__item--active' : ''}`}
              aria-current={active ? 'true' : undefined}
              onClick={() => onNavigate(item.id)}
            >
              {showMarker && <span className="line-sidebar__marker" aria-hidden="true" />}
              <span className="line-sidebar__label flex items-center gap-2">
                {showIndex && !collapsed && (
                  <span className="line-sidebar__index font-mono">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                {Icon && (
                  <Icon
                    size={16}
                    className={`line-sidebar__icon shrink-0 ${active ? 'text-cyan-300' : 'text-yowon-muted'}`}
                  />
                )}
                {!collapsed && (
                  <span className="line-sidebar__text font-display font-medium text-xs sm:text-sm">
                    {item.label}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default LineSidebar
