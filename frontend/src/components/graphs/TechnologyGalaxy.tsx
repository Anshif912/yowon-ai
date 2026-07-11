import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface TechNode {
  id: string
  label: string
  category: 'language' | 'framework' | 'tool' | 'database' | 'cloud' | 'ai'
  confidence?: number
  files?: number
  color?: string
}

interface Props {
  nodes?: TechNode[]
  height?: number
}

const CATEGORY_COLORS: Record<string, string> = {
  language:  '#3B82F6',
  framework: '#8B5CF6',
  tool:      '#F97316',
  database:  '#10B981',
  cloud:     '#06B6D4',
  ai:        '#00E5FF',
}

const DEMO_NODES: TechNode[] = [
  { id: 'python',     label: 'Python',       category: 'language',  confidence: 98, files: 42 },
  { id: 'typescript', label: 'TypeScript',   category: 'language',  confidence: 95, files: 38 },
  { id: 'react',      label: 'React',        category: 'framework', confidence: 97, files: 28 },
  { id: 'fastapi',    label: 'FastAPI',      category: 'framework', confidence: 94, files: 18 },
  { id: 'crewai',     label: 'CrewAI',       category: 'ai',        confidence: 90, files: 12 },
  { id: 'postgres',   label: 'PostgreSQL',   category: 'database',  confidence: 99, files: 8  },
  { id: 'redis',      label: 'Redis',        category: 'database',  confidence: 92, files: 6  },
  { id: 'vite',       label: 'Vite',         category: 'tool',      confidence: 96, files: 4  },
  { id: 'docker',     label: 'Docker',       category: 'cloud',     confidence: 88, files: 3  },
  { id: 'tailwind',   label: 'Tailwind',     category: 'tool',      confidence: 95, files: 22 },
  { id: 'celery',     label: 'Celery',       category: 'framework', confidence: 85, files: 5  },
  { id: 'ogl',        label: 'OGL / WebGL',  category: 'framework', confidence: 82, files: 3  },
]

/* Map ring index from category */
const RING_BY_CATEGORY: Record<string, number> = {
  language:  1,
  framework: 2,
  ai:        2,
  database:  3,
  cloud:     3,
  tool:      4,
}

export default function TechnologyGalaxy({ nodes, height = 460 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(700)
  const [tick, setTick] = useState(0)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)

  const techNodes = nodes || DEMO_NODES

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(e.contentRect.width)
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Animation ticker
  useEffect(() => {
    if (paused) return
    let raf: number
    let frame = 0
    const animate = () => {
      frame++
      setTick(frame)
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [paused])

  const cx = w / 2
  const cy = height / 2
  const maxR = Math.min(cx, cy) - 40

  // Build ring groups
  const rings: Record<number, TechNode[]> = {}
  for (const n of techNodes) {
    const ring = RING_BY_CATEGORY[n.category] || 3
    if (!rings[ring]) rings[ring] = []
    rings[ring].push(n)
  }

  // Node positions with orbital animation
  const positions: Array<{ node: TechNode; x: number; y: number; r: number; ring: number }> = []
  const ringRadii = [0, maxR * 0.28, maxR * 0.55, maxR * 0.78, maxR]
  const orbitSpeeds = [0, 0.00008, 0.00005, 0.00003, 0.00002]

  for (const [ringStr, ringNodes] of Object.entries(rings)) {
    const ring = parseInt(ringStr)
    const radius = ringRadii[ring] ?? ringRadii[3]
    const speed = orbitSpeeds[ring] ?? 0.00003
    const baseAngle = (tick * speed * 2 * Math.PI)

    ringNodes.forEach((node, i) => {
      const angleOffset = (i / ringNodes.length) * 2 * Math.PI
      const angle = baseAngle + angleOffset
      const nodeR = ring === 1 ? 28 : ring === 2 ? 22 : 16

      if (ring === 0) {
        positions.push({ node, x: cx, y: cy, r: 36, ring })
      } else {
        positions.push({
          node,
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
          r: nodeR,
          ring,
        })
      }
    })
  }

  return (
    <div ref={containerRef} className="w-full" style={{ height }}>
      <svg
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        onMouseEnter={() => hoveredId && setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <defs>
          <radialGradient id="galaxy-bg" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(20,25,40,1)" />
            <stop offset="100%" stopColor="rgba(5,7,10,1)" />
          </radialGradient>
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <radialGradient key={cat} id={`tech-grad-${cat}`} cx="35%" cy="30%">
              <stop offset="0%" stopColor={color} stopOpacity="0.95" />
              <stop offset="100%" stopColor={color} stopOpacity="0.3" />
            </radialGradient>
          ))}
          <filter id="star-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width="100%" height="100%" fill="url(#galaxy-bg)" rx="16" />

        {/* Star field */}
        {Array.from({ length: 60 }, (_, i) => {
          const seed = i * 2.718
          const sx = (((seed * 127.1) % 1 + 1) % 1) * w
          const sy = (((seed * 311.7) % 1 + 1) % 1) * height
          const sr = (((seed * 74.9) % 1 + 1) % 1) * 1.5 + 0.3
          const op = (((seed * 53.2) % 1 + 1) % 1) * 0.4 + 0.1
          return <circle key={i} cx={sx} cy={sy} r={sr} fill="white" opacity={op} />
        })}

        {/* Orbit rings */}
        {[1, 2, 3, 4].map(ring => {
          const r = ringRadii[ring] ?? 0
          return (
            <circle key={ring}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
          )
        })}

        {/* Spoke lines from center to ring-1 nodes */}
        {positions.filter(p => p.ring === 1).map(({ node, x, y }) => (
          <line key={`spoke-${node.id}`}
            x1={cx} y1={cy}
            x2={x} y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        ))}

        {/* Tech nodes */}
        {positions.map(({ node, x, y, r }) => {
          const color = CATEGORY_COLORS[node.category] || '#6366F1'
          const isHovered = hoveredId === node.id
          return (
            <g
              key={node.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => { setHoveredId(node.id); setPaused(true) }}
              onMouseLeave={() => { setHoveredId(null); setPaused(false) }}
            >
              {/* Glow */}
              {isHovered && (
                <circle cx={x} cy={y} r={r + 10} fill={color} opacity="0.12" />
              )}
              {/* Halo */}
              <circle cx={x} cy={y} r={r + 3} fill="none" stroke={color} strokeWidth="1" opacity={isHovered ? 0.6 : 0.2} />
              {/* Node body */}
              <circle
                cx={x} cy={y} r={r}
                fill={`url(#tech-grad-${node.category})`}
                stroke={color}
                strokeWidth={isHovered ? 2 : 1.5}
                strokeOpacity={isHovered ? 1 : 0.55}
                filter={isHovered ? 'url(#star-glow)' : undefined}
              />
              {/* Confidence arc */}
              {node.confidence && (
                <circle
                  cx={x} cy={y} r={r - 5}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                  strokeDasharray={`${(node.confidence / 100) * 2 * Math.PI * (r - 5)} 999`}
                  strokeLinecap="round"
                  transform={`rotate(-90,${x},${y})`}
                  opacity="0.5"
                />
              )}
              {/* Label */}
              <text
                x={x} y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={r > 25 ? 10 : 8}
                fontFamily="Inter, sans-serif"
                fontWeight="700"
                fill="#F4F4F5"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {node.label.length > 8 ? node.label.slice(0, 7) + '…' : node.label}
              </text>
              {/* Confidence below on hover */}
              {isHovered && node.confidence && (
                <text
                  x={x} y={y + r + 14}
                  textAnchor="middle"
                  fontSize={8}
                  fontFamily="JetBrains Mono, monospace"
                  fill={color}
                  style={{ pointerEvents: 'none' }}
                >
                  {node.confidence}%
                </text>
              )}
            </g>
          )
        })}

        {/* Center core node */}
        <g>
          <circle cx={cx} cy={cy} r={38} fill="rgba(0,229,255,0.08)" />
          <circle cx={cx} cy={cy} r={30}
            fill="rgba(5,7,10,0.95)"
            stroke="rgba(0,229,255,0.5)"
            strokeWidth="1.5"
          />
          <text x={cx} y={cy - 5} textAnchor="middle" fontSize={7} fontFamily="JetBrains Mono, monospace" fill="rgba(0,229,255,0.7)" letterSpacing="0.15em">
            CORE
          </text>
          <text x={cx} y={cy + 6} textAnchor="middle" fontSize={8} fontFamily="Space Grotesk, sans-serif" fontWeight="700" fill="#F4F4F5">
            REPO
          </text>
        </g>

        {/* Category legend */}
        <g transform={`translate(12, ${height - 12 - Object.keys(CATEGORY_COLORS).length * 16})`}>
          {Object.entries(CATEGORY_COLORS).map(([cat, color], i) => (
            <g key={cat} transform={`translate(0, ${i * 16})`}>
              <circle r={4} cx={4} cy={4} fill={color} opacity="0.8" />
              <text x={12} y={8} fontSize={8} fontFamily="JetBrains Mono, monospace" fill="rgba(255,255,255,0.35)" letterSpacing="0.1em">
                {cat.toUpperCase()}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
