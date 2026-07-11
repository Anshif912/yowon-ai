import { useState, useMemo } from 'react'
import { Brain, Search, ChevronRight, Box, Layers, Code2, Zap, Package } from 'lucide-react'
import { DashboardSection } from './DashboardSection'
import { ErrorBoundary } from './ErrorBoundary'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'

interface KnowledgeGraphPanelProps {
  projectId: string
  onSelectNode?: (nodeName: string) => void
}

export default function KnowledgeGraphPanel({ projectId, onSelectNode }: KnowledgeGraphPanelProps) {
  return (
    <ErrorBoundary name="Knowledge Graph Panel">
      <KnowledgeGraphContent projectId={projectId} onSelectNode={onSelectNode} />
    </ErrorBoundary>
  )
}

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  subsystem:  { color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  icon: Layers,  label: 'Subsystem'  },
  module:     { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: Box,     label: 'Module'     },
  class:      { color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',   icon: Code2,   label: 'Class'      },
  function:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  icon: Zap,     label: 'Function'   },
  package:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: Package, label: 'Package'    },
}

function KnowledgeGraphContent({ projectId, onSelectNode }: { projectId: string; onSelectNode?: (name: string) => void }) {
  const context = useSharedIntelligenceContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const rkm = context.rkm

  const allNodes = useMemo(() => {
    if (!rkm) return []
    const allowed = ['subsystem', 'module', 'class', 'function', 'package']
    return Object.values(rkm.entities)
      .filter(e => allowed.includes(e.type))
      .sort((a, b) => {
        const order = ['subsystem', 'module', 'class', 'package', 'function']
        return order.indexOf(a.type) - order.indexOf(b.type)
      })
  }, [rkm])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allNodes.forEach(n => { counts[n.type] = (counts[n.type] || 0) + 1 })
    return counts
  }, [allNodes])

  const filtered = useMemo(() => {
    return allNodes.filter(n => {
      const matchType = !selectedType || n.type === selectedType
      const matchSearch = !searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase())
      return matchType && matchSearch
    })
  }, [allNodes, searchTerm, selectedType])

  const getEdgesForNode = (nodeId: string) => {
    if (!rkm) return []
    return rkm.relationships.filter(r => r.source === nodeId || r.target === nodeId).slice(0, 6)
  }

  const getNodeLabel = (id: string) => {
    if (!rkm) return id
    return rkm.entities[id]?.label || id
  }

  if (!rkm || allNodes.length === 0) {
    return (
      <DashboardSection id="knowledge" title="Knowledge Map" icon={Brain}>
        <div className="p-10 text-center space-y-3 font-mono text-[10px] text-zinc-500">
          <Brain size={24} className="mx-auto text-zinc-600" />
          <p className="text-white font-bold text-xs">No Knowledge Data Available</p>
          <p>The syntax parser could not traverse AST structures. Verify codebase folders are accessible.</p>
        </div>
      </DashboardSection>
    )
  }

  return (
    <DashboardSection id="knowledge" title="Knowledge Map" icon={Brain}>
      <div className="space-y-5 font-mono text-[10px] text-white">

        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
            const count = typeCounts[type] || 0
            const Icon = cfg.icon
            const isActive = selectedType === type
            return (
              <button
                key={type}
                onClick={() => setSelectedType(isActive ? null : type)}
                className="flex flex-col items-start p-3 rounded-xl border transition-all text-left"
                style={{
                  borderColor: isActive ? cfg.color : 'rgba(255,255,255,0.06)',
                  background: isActive ? cfg.bg : 'rgba(255,255,255,0.01)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={12} style={{ color: cfg.color }} />
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                <span className="text-2xl font-bold text-white">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              className="w-full bg-white/[0.02] border border-white/[0.07] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
              placeholder="Search modules, classes, functions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          {selectedType && (
            <button
              onClick={() => setSelectedType(null)}
              className="text-[9px] text-zinc-400 hover:text-white border border-white/10 rounded px-2 py-1.5 transition-colors"
            >
              Clear filter
            </button>
          )}
          <span className="text-[9px] text-zinc-600 whitespace-nowrap">{filtered.length} entries</span>
        </div>

        {/* Node Table */}
        <div className="border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-0 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02] text-[9px] text-zinc-500 uppercase tracking-widest">
            <div className="col-span-1">Type</div>
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Purpose</div>
            <div className="col-span-2">Health</div>
            <div className="col-span-2">Connections</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.03] max-h-[500px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-600">No results match your search.</div>
            )}
            {filtered.map(node => {
              const cfg = TYPE_CONFIG[node.type] || TYPE_CONFIG['module']
              const Icon = cfg.icon
              const edges = getEdgesForNode(node.id)
              const isExpanded = expandedId === node.id
              const health = node.health ?? 70
              const healthColor = health >= 80 ? '#10b981' : health >= 60 ? '#f59e0b' : '#ef4444'

              return (
                <div key={node.id}>
                  <div
                    className="grid grid-cols-12 gap-0 px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors items-center"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : node.id)
                      if (onSelectNode) onSelectNode(node.label)
                    }}
                  >
                    {/* Type badge */}
                    <div className="col-span-1">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                        style={{ background: cfg.bg }}
                        title={cfg.label}
                      >
                        <Icon size={11} style={{ color: cfg.color }} />
                      </span>
                    </div>

                    {/* Name */}
                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      <ChevronRight
                        size={11}
                        className="text-zinc-600 shrink-0 transition-transform"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      />
                      <span className="font-semibold text-white truncate text-xs" title={node.label}>
                        {node.label}
                      </span>
                    </div>

                    {/* Purpose */}
                    <div className="col-span-3 text-zinc-500 truncate pr-2" title={(node as any).summary || (node as any).purpose || '—'}>
                      {(node as any).summary || (node as any).purpose || <span className="text-zinc-700">—</span>}
                    </div>

                    {/* Health bar */}
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${health}%`, background: healthColor }}
                        />
                      </div>
                      <span className="text-[9px] shrink-0" style={{ color: healthColor }}>{health}%</span>
                    </div>

                    {/* Edge count */}
                    <div className="col-span-2 text-zinc-500">
                      <span className="text-[9px] font-mono">{edges.length} links</span>
                    </div>
                  </div>

                  {/* Expanded: show relationships */}
                  {isExpanded && edges.length > 0 && (
                    <div className="px-10 pb-3 space-y-1.5 bg-white/[0.01]">
                      {edges.map((edge, i) => {
                        const otherNodeId = edge.source === node.id ? edge.target : edge.source
                        const direction = edge.source === node.id ? '→' : '←'
                        const otherNode = rkm?.entities[otherNodeId]
                        const otherCfg = otherNode ? (TYPE_CONFIG[otherNode.type] || TYPE_CONFIG['module']) : TYPE_CONFIG['module']
                        return (
                          <div key={i} className="flex items-center gap-2 text-[9px] text-zinc-500">
                            <span className="text-cyan-500">{direction}</span>
                            <span className="text-[8px] px-1 rounded" style={{ color: otherCfg.color, background: otherCfg.bg }}>
                              {otherNode?.type || 'node'}
                            </span>
                            <span className="text-zinc-400">{getNodeLabel(otherNodeId)}</span>
                            {edge.label && (
                              <span className="text-zinc-700 italic">({edge.label})</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-[9px] text-zinc-600 text-center">
          Click any row to expand its dependency links · Total relationships: {rkm.relationships.length}
        </p>
      </div>
    </DashboardSection>
  )
}
