import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, CornerDownRight, Home, X } from 'lucide-react'

interface MindMapNode {
  id: string
  label: string
  type: 'repo' | 'subsystem' | 'capability' | 'service' | 'module' | 'class' | 'method'
  children?: MindMapNode[]
  color?: string
  description?: string
  lines?: number
}

interface Props {
  data?: MindMapNode
  height?: number
}

const TYPE_COLORS: Record<string, string> = {
  repo:       '#00E5FF',
  subsystem:  '#3B82F6',
  capability: '#8B5CF6',
  service:    '#A855F7',
  module:     '#10B981',
  class:      '#F97316',
  method:     '#EAB308',
}

const DEMO_DATA: MindMapNode = {
  id: 'root',
  label: 'Repository',
  type: 'repo',
  description: 'Top-level system',
  children: [
    {
      id: 'frontend', label: 'Frontend', type: 'subsystem',
      children: [
        { id: 'ui', label: 'UI System', type: 'capability',
          children: [
            { id: 'components', label: 'Components', type: 'module', lines: 3400 },
            { id: 'pages', label: 'Pages', type: 'module', lines: 8200 },
          ]
        },
        { id: 'state', label: 'State', type: 'capability',
          children: [
            { id: 'query', label: 'React Query', type: 'module', lines: 400 },
          ]
        },
      ]
    },
    {
      id: 'backend', label: 'Backend', type: 'subsystem',
      children: [
        { id: 'api', label: 'API Layer', type: 'capability',
          children: [
            { id: 'routes', label: 'Routes', type: 'module', lines: 1200 },
            { id: 'auth', label: 'Auth', type: 'module', lines: 600 },
          ]
        },
        { id: 'models', label: 'Data Models', type: 'capability',
          children: [
            { id: 'orm', label: 'ORM Models', type: 'module', lines: 900 },
          ]
        },
      ]
    },
    {
      id: 'ai', label: 'AI Engine', type: 'subsystem',
      children: [
        { id: 'agents', label: 'Agent Network', type: 'capability',
          children: [
            { id: 'crew', label: 'CrewAI', type: 'module', lines: 1500 },
            { id: 'llm', label: 'LLM Clients', type: 'module', lines: 700 },
          ]
        },
        { id: 'analysis', label: 'Static Analysis', type: 'capability',
          children: [
            { id: 'ast', label: 'AST Parser', type: 'module', lines: 2100 },
          ]
        },
      ]
    },
  ]
}

/* ── Radial layout engine ── */
function layoutTree(node: MindMapNode, cx: number, cy: number, depth: number, angleStart: number, angleEnd: number): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()
  const RADII = [0, 95, 175, 245, 295]
  const r = RADII[Math.min(depth, RADII.length - 1)]
  const angle = (angleStart + angleEnd) / 2
  const x = depth === 0 ? cx : cx + r * Math.cos(angle)
  const y = depth === 0 ? cy : cy + r * Math.sin(angle)
  positions.set(node.id, { x, y })

  if (node.children?.length) {
    const span = angleEnd - angleStart || Math.PI * 2
    const step = span / node.children.length
    node.children.forEach((child, i) => {
      const childPositions = layoutTree(child, cx, cy, depth + 1, angleStart + i * step, angleStart + (i + 1) * step)
      childPositions.forEach((pos, id) => positions.set(id, pos))
    })
  }

  return positions
}

/* ── Flatten tree ── */
function flattenTree(node: MindMapNode): MindMapNode[] {
  const result: MindMapNode[] = [node]
  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenTree(child))
    }
  }
  return result
}

/* ── Collect all edges ── */
function collectEdges(node: MindMapNode): Array<[string, string]> {
  const edges: Array<[string, string]> = []
  if (node.children) {
    for (const child of node.children) {
      edges.push([node.id, child.id])
      edges.push(...collectEdges(child))
    }
  }
  return edges
}

export default function KnowledgeMindMap({ data, height = 460 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(700)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<string[]>(['Repository'])

  const root = data || DEMO_DATA
  const cx = w / 2
  const cy = height / 2

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(e.contentRect.width)
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const positions = layoutTree(root, cx, cy, 0, -Math.PI / 2, Math.PI * 1.5)
  const allNodes = flattenTree(root)
  const allEdges = collectEdges(root)

  const selectedNode = allNodes.find(n => n.id === selectedId)

  const nodeRadius = (node: MindMapNode) => {
    const sizes: Record<string, number> = {
      repo: 32, subsystem: 24, capability: 18, service: 14, module: 12, class: 10, method: 8
    }
    return sizes[node.type] || 10
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 font-mono text-[10px]">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={10} className="text-zinc-700" />}
            <span className={i === breadcrumb.length - 1 ? 'text-zinc-200' : 'text-zinc-500'}>{crumb}</span>
          </span>
        ))}
      </div>

      <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden" style={{ height, background: 'radial-gradient(ellipse at center, rgba(15,18,28,1) 0%, rgba(5,7,10,1) 100%)' }}>
        <svg width="100%" height="100%" style={{ display: 'block' }}>
          <defs>
            {Object.entries(TYPE_COLORS).map(([type, color]) => (
              <radialGradient key={type} id={`mm-grad-${type}`} cx="35%" cy="30%">
                <stop offset="0%" stopColor={color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={color} stopOpacity="0.25" />
              </radialGradient>
            ))}
          </defs>

          {/* Edges */}
          {allEdges.map(([srcId, tgtId]) => {
            const src = positions.get(srcId)
            const tgt = positions.get(tgtId)
            if (!src || !tgt) return null
            const srcNode = allNodes.find(n => n.id === srcId)!
            const tgtNode = allNodes.find(n => n.id === tgtId)!
            const color = TYPE_COLORS[tgtNode.type] || '#ffffff'
            const isHighlighted = hoveredId === srcId || hoveredId === tgtId || selectedId === srcId || selectedId === tgtId

            // Curved bezier toward center
            const midX = (src.x + tgt.x) / 2 + (cx - (src.x + tgt.x) / 2) * 0.3
            const midY = (src.y + tgt.y) / 2 + (cy - (src.y + tgt.y) / 2) * 0.3

            return (
              <path
                key={`${srcId}-${tgtId}`}
                d={`M${src.x},${src.y} Q${midX},${midY} ${tgt.x},${tgt.y}`}
                fill="none"
                stroke={isHighlighted ? color : 'rgba(255,255,255,0.07)'}
                strokeWidth={isHighlighted ? 1.5 : 1}
                opacity={isHighlighted ? 0.7 : 0.4}
              />
            )
          })}

          {/* Nodes */}
          {allNodes.map(node => {
            const pos = positions.get(node.id)
            if (!pos) return null
            const r = nodeRadius(node)
            const color = TYPE_COLORS[node.type] || '#6366F1'
            const isSelected = selectedId === node.id
            const isHovered = hoveredId === node.id
            const isConnected = allEdges.some(([s, t]) => s === selectedId || t === selectedId
              ? s === node.id || t === node.id : false)

            return (
              <g
                key={node.id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedId(isSelected ? null : node.id)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Outer ring */}
                {(isSelected || isHovered) && (
                  <circle cx={pos.x} cy={pos.y} r={r + 6} fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
                )}
                {/* Node */}
                <circle
                  cx={pos.x} cy={pos.y} r={r}
                  fill={`url(#mm-grad-${node.type})`}
                  stroke={color}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeOpacity={isSelected ? 1 : 0.5}
                />
                {/* Label */}
                <text
                  x={pos.x} y={r > 16 ? pos.y : pos.y + r + 10}
                  textAnchor="middle"
                  dominantBaseline={r > 16 ? 'middle' : 'auto'}
                  fontSize={r > 20 ? 9 : 7}
                  fontFamily="Inter, sans-serif"
                  fontWeight="600"
                  fill={r > 16 ? '#F4F4F5' : (isHovered ? '#D4D4D8' : '#71717A')}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.label.length > 12 ? node.label.slice(0, 11) + '…' : node.label}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="absolute top-3 right-3 bg-[#05070a]/80 border border-white/5 rounded-xl p-3 backdrop-blur-sm space-y-1.5">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[8px] font-mono uppercase text-zinc-600 tracking-wider">{type}</span>
            </div>
          ))}
        </div>

        {/* Selected node inspector */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              className="floating-inspector"
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
            >
              <div className="floating-inspector-header">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[selectedNode.type] }} />
                  <span className="text-xs font-bold text-white">{selectedNode.label}</span>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                  <X size={12} />
                </button>
              </div>
              <div className="floating-inspector-body text-[10px]">
                <div className="flex justify-between border-b border-white/[0.04] py-1">
                  <span className="text-zinc-500">Type</span>
                  <span className="text-zinc-200 font-medium capitalize">{selectedNode.type}</span>
                </div>
                {selectedNode.lines && (
                  <div className="flex justify-between border-b border-white/[0.04] py-1">
                    <span className="text-zinc-500">Lines</span>
                    <span className="text-zinc-200 font-mono">{selectedNode.lines.toLocaleString()}</span>
                  </div>
                )}
                {selectedNode.children && (
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Children</span>
                    <span className="text-zinc-200 font-mono">{selectedNode.children.length}</span>
                  </div>
                )}
                {selectedNode.description && (
                  <p className="text-zinc-500 mt-1 leading-relaxed">{selectedNode.description}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
