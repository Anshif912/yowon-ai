import { useState, useMemo } from 'react'
import { Layers, Search, ChevronRight, Server, Database, Globe, Cpu, Shield, Box } from 'lucide-react'
import { DashboardSection } from './DashboardSection'
import { ErrorBoundary } from './ErrorBoundary'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'

interface ArchitectureGraphPanelProps {
  projectId: string
  onSelectNode?: (nodeName: string) => void
}

export function ArchitectureGraphPanel({ projectId, onSelectNode }: ArchitectureGraphPanelProps) {
  return (
    <ErrorBoundary name="Architecture Graph Panel">
      <ArchitectureContent projectId={projectId} onSelectNode={onSelectNode} />
    </ErrorBoundary>
  )
}

// Layer definitions — ordered top-to-bottom as in real system diagrams
const LAYER_CONFIG = [
  { key: 'frontend',       label: 'Frontend / Client',   color: '#3B82F6', bg: 'rgba(59,130,246,0.07)',   icon: Globe,   types: ['frontend', 'ui', 'client'] },
  { key: 'gateway',        label: 'API Gateway',          color: '#EAB308', bg: 'rgba(234,179,8,0.07)',    icon: Shield,  types: ['gateway', 'controller', 'router'] },
  { key: 'service',        label: 'Business Services',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.07)',   icon: Server,  types: ['service', 'backend', 'subsystem'] },
  { key: 'database',       label: 'Data Layer',           color: '#10B981', bg: 'rgba(16,185,129,0.07)',   icon: Database,types: ['database', 'cache', 'storage'] },
  { key: 'infrastructure', label: 'Infrastructure',       color: '#F97316', bg: 'rgba(249,115,22,0.07)',   icon: Cpu,     types: ['infrastructure', 'deployment', 'container'] },
]

function getLayerForEntity(type: string) {
  for (const layer of LAYER_CONFIG) {
    if (layer.types.includes(type.toLowerCase())) return layer
  }
  return LAYER_CONFIG[2] // default to service layer
}

function ArchitectureContent({ projectId, onSelectNode }: { projectId: string; onSelectNode?: (n: string) => void }) {
  const context = useSharedIntelligenceContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null)

  const rkm = context.rkm

  // Bucket entities into layers
  const layers = useMemo(() => {
    if (!rkm) return []
    const buckets: Record<string, typeof LAYER_CONFIG[0] & { nodes: any[] }> = {}
    LAYER_CONFIG.forEach(l => { buckets[l.key] = { ...l, nodes: [] } })

    Object.values(rkm.entities).forEach(entity => {
      const layer = getLayerForEntity(entity.type)
      if (!buckets[layer.key]) buckets[layer.key] = { ...layer, nodes: [] }
      buckets[layer.key].nodes.push(entity)
    })

    return LAYER_CONFIG
      .map(l => buckets[l.key])
      .filter(l => l.nodes.length > 0)
  }, [rkm])

  const filteredLayers = useMemo(() => {
    if (!searchTerm) return layers
    return layers.map(l => ({
      ...l,
      nodes: l.nodes.filter(n => n.label.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(l => l.nodes.length > 0)
  }, [layers, searchTerm])

  const totalNodes = layers.reduce((s, l) => s + l.nodes.length, 0)

  const getConnections = (nodeId: string) => {
    if (!rkm) return { out: [], in: [] }
    const outs = rkm.relationships
      .filter(r => r.source === nodeId)
      .map(r => ({ id: r.target, label: r.label || 'calls', entity: rkm.entities[r.target] }))
      .filter(r => r.entity)
      .slice(0, 5)
    const ins = rkm.relationships
      .filter(r => r.target === nodeId)
      .map(r => ({ id: r.source, label: r.label || 'called by', entity: rkm.entities[r.source] }))
      .filter(r => r.entity)
      .slice(0, 5)
    return { out: outs, in: ins }
  }

  if (!rkm || totalNodes === 0) {
    return (
      <DashboardSection id="architecture" title="Architecture View" icon={Layers}>
        <div className="p-10 text-center space-y-3 font-mono text-[10px] text-zinc-500">
          <Layers size={24} className="mx-auto text-zinc-600" />
          <p className="text-white font-bold text-xs">No Architecture Data Available</p>
          <p>The backend architectural analysis did not return layered entities.</p>
        </div>
      </DashboardSection>
    )
  }

  return (
    <DashboardSection id="architecture" title="Architecture View" icon={Layers}>
      <div className="space-y-5 font-mono text-[10px] text-white">

        {/* Stats strip */}
        <div className="grid grid-cols-5 gap-2">
          {LAYER_CONFIG.map(layer => {
            const count = layers.find(l => l.key === layer.key)?.nodes.length || 0
            const Icon = layer.icon
            return (
              <div
                key={layer.key}
                className="flex items-center gap-2 p-2.5 rounded-xl border"
                style={{ borderColor: count > 0 ? layer.color + '40' : 'rgba(255,255,255,0.04)', background: count > 0 ? layer.bg : 'transparent' }}
              >
                <Icon size={13} style={{ color: count > 0 ? layer.color : '#52525b' }} />
                <div>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: count > 0 ? layer.color : '#52525b' }}>
                    {layer.label.split(' / ')[0]}
                  </p>
                  <p className="font-bold text-white">{count}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="w-full bg-white/[0.02] border border-white/[0.07] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50"
            placeholder="Search components, services, layers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Layered Architecture Diagram */}
        <div className="space-y-3">
          {filteredLayers.map((layer, layerIdx) => {
            const Icon = layer.icon
            return (
              <div key={layer.key} className="rounded-2xl border overflow-hidden" style={{ borderColor: layer.color + '25' }}>
                {/* Layer Header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 border-b"
                  style={{ background: layer.bg, borderColor: layer.color + '20' }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{ background: layer.color + '20', border: `1px solid ${layer.color}40` }}
                  >
                    <Icon size={12} style={{ color: layer.color }} />
                  </div>
                  <span className="font-bold text-white text-[11px]">{layer.label}</span>
                  <span
                    className="ml-auto text-[9px] px-2 py-0.5 rounded-full"
                    style={{ color: layer.color, background: layer.color + '15' }}
                  >
                    {layer.nodes.length} {layer.nodes.length === 1 ? 'component' : 'components'}
                  </span>

                  {/* Downward arrow to next layer */}
                  {layerIdx < filteredLayers.length - 1 && (
                    <span className="text-zinc-700 text-[10px] ml-2">↓</span>
                  )}
                </div>

                {/* Component Cards */}
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {layer.nodes.map(node => {
                    const isExpanded = expandedNodeId === node.id
                    const connections = isExpanded ? getConnections(node.id) : { out: [], in: [] }
                    const health = node.health ?? 75
                    const healthColor = health >= 80 ? '#10b981' : health >= 60 ? '#f59e0b' : '#ef4444'

                    return (
                      <div key={node.id}>
                        <div
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer hover:bg-white/[0.03] transition-all"
                          style={{
                            borderColor: isExpanded ? layer.color + '50' : 'rgba(255,255,255,0.05)',
                            background: isExpanded ? layer.bg : 'rgba(255,255,255,0.01)',
                          }}
                          onClick={() => {
                            setExpandedNodeId(isExpanded ? null : node.id)
                            if (onSelectNode) onSelectNode(node.label)
                          }}
                        >
                          <Box size={11} style={{ color: layer.color }} className="shrink-0" />
                          <span className="text-xs font-semibold text-white truncate flex-1" title={node.label}>
                            {node.label}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${health}%`, background: healthColor }} />
                            </div>
                            <span className="text-[9px]" style={{ color: healthColor }}>{health}%</span>
                          </div>
                          <ChevronRight
                            size={11}
                            className="text-zinc-600 shrink-0 transition-transform"
                            style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}
                          />
                        </div>

                        {/* Expanded connections */}
                        {isExpanded && (connections.out.length > 0 || connections.in.length > 0) && (
                          <div className="mt-1 ml-3 p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] space-y-1">
                            {node.summary && (
                              <p className="text-[9px] text-zinc-500 mb-2 font-sans">{node.summary}</p>
                            )}
                            {connections.out.map((c, i) => {
                              const targetLayer = getLayerForEntity(c.entity?.type || '')
                              return (
                                <div key={i} className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                                  <span className="text-blue-400">→</span>
                                  <span style={{ color: targetLayer.color }}>{c.entity?.label || c.id}</span>
                                  <span className="text-zinc-700">({c.label})</span>
                                </div>
                              )
                            })}
                            {connections.in.map((c, i) => {
                              const srcLayer = getLayerForEntity(c.entity?.type || '')
                              return (
                                <div key={i} className="flex items-center gap-1.5 text-[9px] text-zinc-500">
                                  <span className="text-violet-400">←</span>
                                  <span style={{ color: srcLayer.color }}>{c.entity?.label || c.id}</span>
                                  <span className="text-zinc-700">({c.label})</span>
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
            )
          })}
        </div>

        <p className="text-[9px] text-zinc-600 text-center">
          {totalNodes} components across {layers.length} architectural layers · Click any component to expand its connections
        </p>
      </div>
    </DashboardSection>
  )
}
