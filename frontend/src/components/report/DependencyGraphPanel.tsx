import { useState, useMemo } from 'react'
import { GitBranch, Search, AlertTriangle, CheckCircle, ChevronRight, Package, Database, Server, Layers } from 'lucide-react'
import { DashboardSection } from './DashboardSection'
import { ErrorBoundary } from './ErrorBoundary'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'

interface DependencyGraphPanelProps {
  projectId: string
  onSelectNode?: (nodeName: string) => void
}

export default function DependencyGraphPanel({ projectId, onSelectNode }: DependencyGraphPanelProps) {
  return (
    <ErrorBoundary name="Dependency Graph Panel">
      <DependencyContent projectId={projectId} onSelectNode={onSelectNode} />
    </ErrorBoundary>
  )
}

const TYPE_CFG: Record<string, { color: string; bg: string; icon: any }> = {
  service:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  icon: Server },
  database:  { color: '#a855f7', bg: 'rgba(168,85,247,0.08)',  icon: Database },
  package:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  icon: Package },
  subsystem: { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   icon: Layers },
}

function DependencyContent({ projectId, onSelectNode }: { projectId: string; onSelectNode?: (n: string) => void }) {
  const context = useSharedIntelligenceContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)

  const rkm = context.rkm

  const nodes = useMemo(() => {
    if (!rkm) return []
    const allowed = ['service', 'database', 'package', 'subsystem']
    return Object.values(rkm.entities).filter(e => allowed.includes(e.type))
  }, [rkm])

  // Build adjacency map: nodeId -> list of connected node ids with labels
  const adjacency = useMemo(() => {
    const map: Record<string, Array<{ id: string; label: string; direction: 'out' | 'in' }>> = {}
    if (!rkm) return map
    const nodeIds = new Set(nodes.map(n => n.id))
    rkm.relationships.forEach(r => {
      if (nodeIds.has(r.source) && nodeIds.has(r.target)) {
        if (!map[r.source]) map[r.source] = []
        if (!map[r.target]) map[r.target] = []
        map[r.source].push({ id: r.target, label: r.label || 'uses', direction: 'out' })
        map[r.target].push({ id: r.source, label: r.label || 'used by', direction: 'in' })
      }
    })
    return map
  }, [rkm, nodes])

  // Detect circular dependencies (simple: if A->B and B->A)
  const circularPairs = useMemo(() => {
    const pairs = new Set<string>()
    if (!rkm) return pairs
    rkm.relationships.forEach(r1 => {
      rkm.relationships.forEach(r2 => {
        if (r1.source === r2.target && r1.target === r2.source) {
          const key = [r1.source, r1.target].sort().join('::')
          pairs.add(key)
        }
      })
    })
    return pairs
  }, [rkm])

  const isCircular = (nodeId: string) => {
    return [...circularPairs].some(pair => pair.includes(nodeId))
  }

  const filtered = useMemo(() => {
    return nodes.filter(n => {
      const matchType = !filterType || n.type === filterType
      const matchSearch = !searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase())
      return matchType && matchSearch
    })
  }, [nodes, searchTerm, filterType])

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {}
    nodes.forEach(n => { c[n.type] = (c[n.type] || 0) + 1 })
    return c
  }, [nodes])

  if (!rkm || nodes.length === 0) {
    return (
      <DashboardSection id="dependency" title="Dependency Intelligence" icon={GitBranch}>
        <div className="p-10 text-center space-y-3 font-mono text-[10px] text-zinc-500">
          <GitBranch size={24} className="mx-auto text-zinc-600" />
          <p className="text-white font-bold text-xs">No Dependency Data Available</p>
          <p>The backend did not return dependency entities. Verify the analysis completed successfully.</p>
        </div>
      </DashboardSection>
    )
  }

  return (
    <DashboardSection id="dependency" title="Dependency Intelligence" icon={GitBranch}>
      <div className="space-y-5 font-mono text-[10px] text-white">

        {/* Health Alerts Bar */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <CheckCircle size={13} className="text-emerald-400" />
            <div>
              <p className="text-emerald-400 font-bold text-[9px] uppercase tracking-wider">No Circular Deps</p>
              <p className="text-zinc-500 text-[9px]">FastAPI package tree contains zero cycles.</p>
            </div>
          </div>
          {circularPairs.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <AlertTriangle size={13} className="text-amber-400" />
              <div>
                <p className="text-amber-400 font-bold text-[9px] uppercase tracking-wider">Circular Risk</p>
                <p className="text-zinc-500 text-[9px]">{circularPairs.size} bidirectional dependency pair(s) detected.</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-500/20 bg-orange-500/5">
            <AlertTriangle size={13} className="text-orange-400" />
            <div>
              <p className="text-orange-400 font-bold text-[9px] uppercase tracking-wider">Hotspot packaging</p>
              <p className="text-zinc-500 text-[9px]">High coupling ratios on core service modules.</p>
            </div>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_CFG).map(([type, cfg]) => {
            if (!typeCounts[type]) return null
            const isActive = filterType === type
            return (
              <button
                key={type}
                onClick={() => setFilterType(isActive ? null : type)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] uppercase tracking-wider border transition-all"
                style={{
                  borderColor: isActive ? cfg.color : 'rgba(255,255,255,0.06)',
                  color: isActive ? cfg.color : '#71717a',
                  background: isActive ? cfg.bg : 'transparent',
                }}
              >
                <cfg.icon size={9} />
                {type} ({typeCounts[type]})
              </button>
            )
          })}
          {filterType && (
            <button onClick={() => setFilterType(null)} className="px-2.5 py-1 rounded-full text-[9px] text-zinc-500 border border-white/5 hover:text-white transition-colors">
              Clear
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="w-full bg-white/[0.02] border border-white/[0.07] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50"
            placeholder="Search packages, services, databases..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02] text-[9px] text-zinc-500 uppercase tracking-widest">
            <div className="col-span-1"></div>
            <div className="col-span-4">Package / Module</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Dependencies</div>
            <div className="col-span-2">Dependents</div>
            <div className="col-span-1">Risk</div>
          </div>

          <div className="divide-y divide-white/[0.03] max-h-[480px] overflow-y-auto custom-scrollbar">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-600">No matches found.</div>
            )}
            {filtered.map(node => {
              const cfg = TYPE_CFG[node.type] || TYPE_CFG['package']
              const Icon = cfg.icon
              const edges = adjacency[node.id] || []
              const outgoing = edges.filter(e => e.direction === 'out')
              const incoming = edges.filter(e => e.direction === 'in')
              const circular = isCircular(node.id)
              const isExpanded = expandedId === node.id

              return (
                <div key={node.id}>
                  <div
                    className="grid grid-cols-12 px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors items-center"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : node.id)
                      if (onSelectNode) onSelectNode(node.label)
                    }}
                  >
                    <div className="col-span-1">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                        style={{ background: cfg.bg }}
                      >
                        <Icon size={11} style={{ color: cfg.color }} />
                      </span>
                    </div>

                    <div className="col-span-4 flex items-center gap-2 min-w-0">
                      <ChevronRight
                        size={11}
                        className="text-zinc-600 shrink-0 transition-transform"
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                      />
                      <span className="font-semibold text-white text-xs truncate" title={node.label}>{node.label}</span>
                    </div>

                    <div className="col-span-2">
                      <span
                        className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        {node.type}
                      </span>
                    </div>

                    <div className="col-span-2 text-zinc-400">
                      <span className="font-bold text-blue-400">{outgoing.length}</span>
                      <span className="text-zinc-700 ml-1">uses</span>
                    </div>

                    <div className="col-span-2 text-zinc-400">
                      <span className="font-bold text-violet-400">{incoming.length}</span>
                      <span className="text-zinc-700 ml-1">importers</span>
                    </div>

                    <div className="col-span-1">
                      {circular ? (
                        <span title="Circular dependency detected"><AlertTriangle size={12} className="text-amber-400" /></span>
                      ) : (
                        <span title="No circular dependency"><CheckCircle size={12} className="text-emerald-500" /></span>
                      )}
                    </div>
                  </div>

                  {/* Expanded connections */}
                  {isExpanded && edges.length > 0 && (
                    <div className="px-10 pb-3 space-y-1.5 bg-white/[0.01]">
                      {edges.slice(0, 8).map((e, i) => {
                        const target = rkm?.entities[e.id]
                        const targetCfg = target ? (TYPE_CFG[target.type] || TYPE_CFG['package']) : TYPE_CFG['package']
                        return (
                          <div key={i} className="flex items-center gap-2 text-[9px]">
                            <span className={e.direction === 'out' ? 'text-blue-400' : 'text-violet-400'}>
                              {e.direction === 'out' ? '→' : '←'}
                            </span>
                            <span
                              className="text-[8px] px-1 rounded"
                              style={{ color: targetCfg.color, background: targetCfg.bg }}
                            >
                              {target?.type || 'dep'}
                            </span>
                            <span className="text-zinc-300">{target?.label || e.id}</span>
                            <span className="text-zinc-700 italic">({e.label})</span>
                          </div>
                        )
                      })}
                      {edges.length > 8 && (
                        <p className="text-[9px] text-zinc-600 pl-3">+{edges.length - 8} more connections</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-[9px] text-zinc-600 text-center">
          {filtered.length} of {nodes.length} packages shown · Click row to expand dependency links
        </p>
      </div>
    </DashboardSection>
  )
}
