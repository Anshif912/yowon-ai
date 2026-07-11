import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Maximize2, Minimize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

/* ── Types ── */
interface ArchNode {
  id: string
  label: string
  type: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'ai' | 'service' | 'gateway' | 'storage'
  layer?: string
  health?: number
  risk?: string
  complexity?: number
  connections?: number
  description?: string
  technology?: string
}

interface ArchEdge {
  source: string
  target: string
  label?: string
  type?: 'sync' | 'async' | 'data' | 'auth'
}

interface ArchitectureData {
  nodes: ArchNode[]
  edges: ArchEdge[]
}

interface Props {
  data?: ArchitectureData
  height?: number
  fullscreen?: boolean
  onFullscreenToggle?: () => void
}

/* ── Color map per node type ── */
const NODE_COLORS: Record<string, string> = {
  frontend:       '#3B82F6',
  backend:        '#8B5CF6',
  database:       '#10B981',
  infrastructure: '#F97316',
  ai:             '#00E5FF',
  service:        '#A855F7',
  gateway:        '#EAB308',
  storage:        '#6366F1',
}

const CLUSTER_COLORS: Record<string, string> = {
  'Frontend':       'rgba(59,130,246,0.12)',
  'Backend':        'rgba(139,92,246,0.12)',
  'Database':       'rgba(16,185,129,0.12)',
  'Infrastructure': 'rgba(249,115,22,0.10)',
  'AI':             'rgba(0,229,255,0.10)',
}

/* ── Demo data if none provided ── */
const DEMO_DATA: ArchitectureData = {
  nodes: [
    { id: 'client',   label: 'Web Client',     type: 'frontend',       layer: 'Frontend',        health: 95, complexity: 3, description: 'React SPA with TypeScript', technology: 'React + Vite' },
    { id: 'cdn',      label: 'CDN',             type: 'infrastructure', layer: 'Infrastructure',  health: 99, complexity: 1, description: 'Edge content distribution', technology: 'CloudFlare' },
    { id: 'gateway',  label: 'API Gateway',     type: 'gateway',        layer: 'Backend',         health: 92, complexity: 4, description: 'Rate limiting & auth proxy', technology: 'NGINX' },
    { id: 'auth',     label: 'Auth Service',    type: 'service',        layer: 'Backend',         health: 98, complexity: 3, description: 'JWT auth & role management', technology: 'FastAPI' },
    { id: 'api',      label: 'Core API',        type: 'backend',        layer: 'Backend',         health: 88, complexity: 7, description: 'Main application API server', technology: 'FastAPI' },
    { id: 'ai',       label: 'AI Engine',       type: 'ai',             layer: 'AI',              health: 85, complexity: 9, description: 'LLM orchestration & CrewAI', technology: 'Python + OGL' },
    { id: 'db',       label: 'PostgreSQL',      type: 'database',       layer: 'Database',        health: 96, complexity: 5, description: 'Primary relational store', technology: 'PostgreSQL 15' },
    { id: 'cache',    label: 'Redis Cache',     type: 'database',       layer: 'Database',        health: 99, complexity: 2, description: 'Session & hot data cache', technology: 'Redis 7' },
    { id: 'storage',  label: 'Object Store',    type: 'storage',        layer: 'Infrastructure',  health: 100, complexity: 1, description: 'File & artifact storage', technology: 'S3-compatible' },
    { id: 'queue',    label: 'Task Queue',      type: 'infrastructure', layer: 'Infrastructure',  health: 93, complexity: 4, description: 'Async task distribution', technology: 'Celery + Redis' },
  ],
  edges: [
    { source: 'client',  target: 'cdn',     type: 'sync'  },
    { source: 'client',  target: 'gateway', type: 'sync'  },
    { source: 'cdn',     target: 'client',  type: 'data'  },
    { source: 'gateway', target: 'auth',    type: 'auth'  },
    { source: 'gateway', target: 'api',     type: 'sync'  },
    { source: 'api',     target: 'db',      type: 'data'  },
    { source: 'api',     target: 'cache',   type: 'sync'  },
    { source: 'api',     target: 'ai',      type: 'async' },
    { source: 'api',     target: 'queue',   type: 'async' },
    { source: 'ai',      target: 'db',      type: 'data'  },
    { source: 'queue',   target: 'storage', type: 'data'  },
    { source: 'auth',    target: 'cache',   type: 'sync'  },
  ]
}

/* ── Layout engine: concentric layers ── */
function computeLayout(nodes: ArchNode[], width: number, height: number) {
  const cx = width / 2
  const cy = height / 2

  // Group by layer
  const layers: Record<string, ArchNode[]> = {}
  for (const n of nodes) {
    const l = n.layer || 'Other'
    if (!layers[l]) layers[l] = []
    layers[l].push(n)
  }

  const layerOrder = ['Frontend', 'Backend', 'AI', 'Database', 'Infrastructure', 'Other']
  const radii = [0, 100, 185, 255, 310, 370]

  const positions: Record<string, { x: number; y: number }> = {}

  for (let li = 0; li < layerOrder.length; li++) {
    const layerName = layerOrder[li]
    const layerNodes = layers[layerName] || []
    const r = radii[li] || 370
    if (r === 0 && layerNodes.length) {
      // Center node (if any)
      positions[layerNodes[0].id] = { x: cx, y: cy }
    } else {
      layerNodes.forEach((n, i) => {
        const angle = (i / layerNodes.length) * Math.PI * 2 - Math.PI / 2
        positions[n.id] = {
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle),
        }
      })
    }
  }

  return positions
}

/* ── Edge colors ── */
const EDGE_COLORS: Record<string, string> = {
  sync:  'rgba(0,229,255,0.35)',
  async: 'rgba(168,85,247,0.35)',
  data:  'rgba(16,185,129,0.35)',
  auth:  'rgba(239,68,68,0.35)',
}

export default function ArchitectureCanvas({ data, height = 520, fullscreen, onFullscreenToggle }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ w: 900, h: height })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [selectedNode, setSelectedNode] = useState<ArchNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [animFrame, setAnimFrame] = useState(0)

  const graphData = data || DEMO_DATA
  const positions = computeLayout(graphData.nodes, dimensions.w, dimensions.h)

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width } = e.contentRect
        setDimensions({ w: width, h: fullscreen ? window.innerHeight - 100 : height })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [height, fullscreen])

  // Animate edges
  useEffect(() => {
    let raf: number
    let frame = 0
    const tick = () => {
      frame++
      setAnimFrame(frame)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Pan handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.graph-node-group')) return
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setPanStart({ x: pan.x, y: pan.y })
  }, [pan])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setPan({
      x: panStart.x + (e.clientX - dragStart.x),
      y: panStart.y + (e.clientY - dragStart.y),
    })
  }, [dragging, dragStart, panStart])

  const onMouseUp = useCallback(() => setDragging(false), [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)))
  }, [])

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Filter nodes
  const matchedIds = searchQuery
    ? new Set(graphData.nodes.filter(n =>
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.type.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(n => n.id))
    : null

  // Cluster backgrounds
  const clusters: Record<string, { nodes: string[] }> = {}
  for (const n of graphData.nodes) {
    const l = n.layer || 'Other'
    if (!clusters[l]) clusters[l] = { nodes: [] }
    clusters[l].nodes.push(n.id)
  }

  const nodeR = (n: ArchNode) => {
    const base = 22
    const extra = Math.min((n.connections || 1) * 2, 12)
    return base + extra
  }

  const healthColor = (h: number) => {
    if (h >= 90) return '#10B981'
    if (h >= 70) return '#EAB308'
    return '#EF4444'
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="glass-input pl-8 py-1.5 text-xs h-8"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            <ZoomIn size={14} />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            <ZoomOut size={14} />
          </button>
          <button onClick={resetView} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            <RotateCcw size={14} />
          </button>
          {onFullscreenToggle && (
            <button onClick={onFullscreenToggle} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* Graph Canvas */}
      <div
        ref={containerRef}
        className="graph-canvas-wrap relative"
        style={{ height: fullscreen ? 'calc(100vh - 200px)' : height }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="rgba(255,255,255,0.25)" />
            </marker>
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <radialGradient key={type} id={`node-grad-${type}`} cx="35%" cy="30%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.35" />
              </radialGradient>
            ))}
          </defs>

          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Cluster halo backgrounds */}
            {Object.entries(clusters).map(([name, { nodes: nodeIds }]) => {
              const pts = nodeIds.map(id => positions[id]).filter(Boolean)
              if (pts.length === 0) return null
              const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length
              const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length
              const clusterR = Math.max(70, ...nodeIds.map(id => {
                const p = positions[id]
                if (!p) return 70
                return Math.sqrt((p.x - avgX) ** 2 + (p.y - avgY) ** 2) + 60
              }))
              const color = CLUSTER_COLORS[name] || 'rgba(255,255,255,0.04)'
              return (
                <ellipse
                  key={name}
                  cx={avgX} cy={avgY}
                  rx={clusterR} ry={clusterR * 0.75}
                  fill={color}
                  className="cluster-halo"
                  style={{ animationDelay: `${Math.random() * 3}s` }}
                />
              )
            })}

            {/* Edges */}
            {graphData.edges.map((edge, i) => {
              const src = positions[edge.source]
              const tgt = positions[edge.target]
              if (!src || !tgt) return null

              const dx = tgt.x - src.x
              const dy = tgt.y - src.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const cx1 = src.x + dx * 0.35 + dy * 0.15
              const cy1 = src.y + dy * 0.35 - dx * 0.15
              const cx2 = src.x + dx * 0.65 + dy * 0.15
              const cy2 = src.y + dy * 0.65 - dx * 0.15

              const srcR = nodeR(graphData.nodes.find(n => n.id === edge.source)!)
              const tgtR = nodeR(graphData.nodes.find(n => n.id === edge.target)!)

              const color = EDGE_COLORS[edge.type || 'sync']
              const dashOffset = -(animFrame * 0.5) % 14

              const isHighlighted = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode)
              const isDimmed = matchedIds && !matchedIds.has(edge.source) && !matchedIds.has(edge.target)

              return (
                <g key={`${edge.source}-${edge.target}-${i}`} opacity={isDimmed ? 0.1 : isHighlighted ? 1 : 0.55}>
                  <path
                    d={`M${src.x},${src.y} C${cx1},${cy1} ${cx2},${cy2} ${tgt.x},${tgt.y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHighlighted ? 2 : 1.5}
                    strokeDasharray="8 6"
                    strokeDashoffset={dashOffset}
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              )
            })}

            {/* Nodes */}
            {graphData.nodes.map(node => {
              const pos = positions[node.id]
              if (!pos) return null
              const r = nodeR(node)
              const color = NODE_COLORS[node.type] || '#6366F1'
              const isSelected = selectedNode?.id === node.id
              const isHovered = hoveredNode === node.id
              const isDimmed = matchedIds && !matchedIds.has(node.id)
              const isHighlighted = matchedIds && matchedIds.has(node.id)

              return (
                <g
                  key={node.id}
                  className="graph-node-group"
                  transform={`translate(${pos.x},${pos.y})`}
                  style={{ opacity: isDimmed ? 0.15 : 1, cursor: 'pointer' }}
                  onClick={() => setSelectedNode(isSelected ? null : node)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer glow ring */}
                  {(isSelected || isHovered) && (
                    <circle
                      r={r + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth="1"
                      opacity="0.4"
                    />
                  )}
                  {/* Health arc ring */}
                  <circle
                    r={r + 4}
                    fill="none"
                    stroke={healthColor(node.health || 80)}
                    strokeWidth="2"
                    strokeDasharray={`${((node.health || 80) / 100) * (2 * Math.PI * (r + 4))} 999`}
                    strokeLinecap="round"
                    opacity="0.6"
                    transform="rotate(-90)"
                  />
                  {/* Node body */}
                  <circle
                    r={r}
                    fill={`url(#node-grad-${node.type})`}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    strokeOpacity={isSelected ? 1 : 0.7}
                  />
                  {/* Label */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(9, r * 0.4)}
                    fontFamily="Inter, sans-serif"
                    fontWeight="600"
                    fill="#F4F4F5"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {node.label.length > 10 ? node.label.slice(0, 9) + '…' : node.label}
                  </text>
                  {/* Type label below */}
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    fontSize={8}
                    fontFamily="JetBrains Mono, monospace"
                    fill={color}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                    opacity="0.8"
                    letterSpacing="0.1em"
                  >
                    {node.type.toUpperCase()}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-[#05070a]/80 border border-white/5 rounded-xl p-3 backdrop-blur-sm">
          {Object.entries(NODE_COLORS).slice(0, 5).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">{type}</span>
            </div>
          ))}
        </div>

        {/* Zoom level indicator */}
        <div className="absolute bottom-3 right-3 font-mono text-[9px] text-zinc-600 bg-[#05070a]/70 px-2 py-1 rounded-lg">
          {Math.round(zoom * 100)}%
        </div>

        {/* Floating Inspector */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              className="floating-inspector"
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="floating-inspector-header">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: NODE_COLORS[selectedNode.type], boxShadow: `0 0 8px ${NODE_COLORS[selectedNode.type]}` }}
                  />
                  <span className="text-xs font-bold text-white">{selectedNode.label}</span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="floating-inspector-body">
                {[
                  ['Type', selectedNode.type],
                  ['Technology', selectedNode.technology || '—'],
                  ['Health', `${selectedNode.health ?? '?'}%`],
                  ['Complexity', `${selectedNode.complexity ?? '?'}/10`],
                ].map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-white/[0.04] last:border-0">
                    <span className="text-[10px] text-zinc-500 font-mono">{key}</span>
                    <span className="text-[10px] text-zinc-200 font-medium">{val}</span>
                  </div>
                ))}
                {selectedNode.description && (
                  <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{selectedNode.description}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
