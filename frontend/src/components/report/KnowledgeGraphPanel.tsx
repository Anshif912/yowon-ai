import React, { useState } from 'react'
import { Cpu } from 'lucide-react'
import { useKnowledgeGraph } from './queries'
import { DashboardSection } from './DashboardSection'
import { GraphSkeleton } from './Skeletons'
import { ErrorBoundary, PanelErrorFallback } from './ErrorBoundary'
import { RepositoryIntelligenceWrapper } from './RepositoryIntelligenceWrapper'
import { api } from '../../api/api'

interface KnowledgeGraphPanelProps {
  projectId: string
}

function KnowledgeGraphContent({ projectId }: { projectId: string }) {
  const [search, setSearch] = useState('')
  const [tech, setTech] = useState('')
  const [lang, setLang] = useState('')
  const [layer, setLayer] = useState('')
  const [collapse, setCollapse] = useState(false)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  
  const [pathSource, setPathSource] = useState('')
  const [pathTarget, setPathTarget] = useState('')
  const [pathResult, setPathResult] = useState<any>(null)

  const { data: kgData, isLoading, isError, error, refetch } = useKnowledgeGraph(projectId, search, tech, lang, layer, collapse)

  const findShortestPath = async () => {
    if (!pathSource || !pathTarget) return
    try {
      const res = await api.get(`/projects/${projectId}/knowledge-graph/path?source=${encodeURIComponent(pathSource)}&target=${encodeURIComponent(pathTarget)}`)
      setPathResult(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  if (isLoading) {
    return <GraphSkeleton />
  }

  if (isError) {
    return <PanelErrorFallback name="Knowledge Graph" error={error} refetch={refetch} />
  }

  const knowledgeGraph = kgData?.success ? kgData.data : kgData

  return (
    <DashboardSection id="knowledge-graph" title="Knowledge Graph" icon={Cpu} accent="amber">
      <div className="glass-card min-h-[600px] flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4 font-mono">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-yowon-muted">Autonomous Project Knowledge Graph</p>
            <h4 className="text-white text-xs font-mono mt-1">Navigate classes, functions, files, and Docker configurations.</h4>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search nodes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 font-mono w-40"
            />
            
            <select
              value={layer}
              onChange={(e) => setLayer(e.target.value)}
              className="bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono bg-yowon-bg"
            >
              <option value="">All Layers</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="database">Database</option>
            </select>

            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-white/[0.03] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono bg-yowon-bg"
            >
              <option value="">All Languages</option>
              <option value="py">Python</option>
              <option value="ts">TypeScript</option>
              <option value="js">JavaScript</option>
              <option value="tsx">TSX</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-yowon-muted font-mono cursor-pointer select-none">
              <input
                type="checkbox"
                checked={collapse}
                onChange={(e) => setCollapse(e.target.checked)}
                className="accent-amber-500 rounded"
              />
              Collapse Folders
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-4 font-mono">
          <span className="text-xs font-mono text-yowon-muted">Pathfinder:</span>
          <input
            type="text"
            placeholder="Source Node ID..."
            value={pathSource}
            onChange={(e) => setPathSource(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 font-mono w-48"
          />
          <span className="text-xs font-mono text-yowon-muted">to</span>
          <input
            type="text"
            placeholder="Target Node ID..."
            value={pathTarget}
            onChange={(e) => setPathTarget(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 font-mono w-48"
          />
          <button
            onClick={findShortestPath}
            className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-mono px-3 py-1 rounded-lg transition-colors font-bold"
          >
            Trace Dependency Path
          </button>
          {pathResult && (
            <button
              onClick={() => { setPathResult(null); setPathSource(''); setPathTarget('') }}
              className="text-[10px] font-mono text-red-400 hover:underline ml-2"
            >
              Clear Path
            </button>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 border border-white/5 bg-black/40 rounded-xl relative overflow-hidden min-h-[400px] flex items-center justify-center">
            {knowledgeGraph?.nodes ? (
              <svg className="w-full h-full min-h-[450px]" style={{ cursor: 'grab' }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255, 255, 255, 0.25)" />
                  </marker>
                  <marker id="path-arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                  </marker>
                </defs>
                
                <g>
                  {knowledgeGraph.edges.map((edge: any, idx: number) => {
                    const total = knowledgeGraph.nodes.length || 1
                    const srcIdx = knowledgeGraph.nodes.findIndex((n: any) => n.id === edge.source)
                    const tgtIdx = knowledgeGraph.nodes.findIndex((n: any) => n.id === edge.target)
                    
                    const srcAngle = (srcIdx / total) * 2 * Math.PI
                    const tgtAngle = (tgtIdx / total) * 2 * Math.PI
                    
                    const sx = 250 + 180 * Math.cos(srcAngle)
                    const sy = 220 + 150 * Math.sin(srcAngle)
                    const tx = 250 + 180 * Math.cos(tgtAngle)
                    const ty = 220 + 150 * Math.sin(tgtAngle)
                    
                    const isPathEdge = pathResult?.edges?.some(
                      (pe: any) => pe.source === edge.source && pe.target === edge.target
                    )

                    return (
                      <line
                        key={`edge-${idx}`}
                        x1={sx}
                        y1={sy}
                        x2={tx}
                        y2={ty}
                        stroke={isPathEdge ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'}
                        strokeWidth={isPathEdge ? 2.5 : 1}
                        markerEnd={isPathEdge ? "url(#path-arrow)" : "url(#arrow)"}
                      />
                    )
                  })}
                </g>
                
                <g>
                  {knowledgeGraph.nodes.map((node: any, idx: number) => {
                    const total = knowledgeGraph.nodes.length || 1
                    const angle = (idx / total) * 2 * Math.PI
                    const x = 250 + 180 * Math.cos(angle)
                    const y = 220 + 150 * Math.sin(angle)
                    
                    const isSelected = selectedNode?.id === node.id
                    const isPathNode = pathResult?.nodes?.some((pn: any) => pn.id === node.id)
                    
                    let color = '#a1a1aa'
                    if (node.type === 'file') color = '#38bdf8'
                    else if (node.type === 'class') color = '#a78bfa'
                    else if (node.type === 'function') color = '#34d399'
                    else if (node.type === 'api') color = '#f472b6'
                    else if (node.type === 'model') color = '#fbbf24'
                    else if (node.type === 'library') color = '#f87171'
                    else if (node.type === 'docker_service') color = '#22c55e'

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${x}, ${y})`}
                        onClick={() => setSelectedNode(node)}
                        style={{ cursor: 'pointer' }}
                      >
                        <circle
                          r={isSelected ? 10 : 7}
                          fill={color}
                          stroke={isPathNode ? '#ffffff' : (isSelected ? '#fbbf24' : 'none')}
                          strokeWidth={2}
                          className="transition-all duration-300"
                        />
                        <text
                          y={isSelected ? 20 : 16}
                          textAnchor="middle"
                          fill="#e4e4e7"
                          fontSize={isSelected ? '10px' : '8px'}
                          fontFamily="monospace"
                          className="pointer-events-none select-none bg-black/40 px-1"
                        >
                          {node.label}
                        </text>
                      </g>
                    )
                  })}
                </g>
              </svg>
            ) : (
              <div className="text-yowon-muted text-xs font-mono">No knowledge graph nodes available.</div>
            )}
            <div className="absolute bottom-3 left-3 flex gap-4 text-[9px] font-mono text-yowon-muted bg-black/50 p-2 rounded-lg border border-white/5">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#38bdf8]" />File</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a78bfa]" />Class</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#34d399]" />Function</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#fbbf24]" />Model</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f87171]" />Library</div>
            </div>
          </div>

          <div className="lg:col-span-1 border border-white/5 bg-white/[0.01] rounded-xl p-4 flex flex-col justify-between font-mono text-xs overflow-y-auto max-h-[500px]">
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {selectedNode.type.toUpperCase()}
                  </span>
                  <h5 className="text-white font-bold text-sm mt-2 break-all">{selectedNode.label}</h5>
                  <p className="text-[10px] text-yowon-muted mt-1 break-all font-mono">ID: {selectedNode.id}</p>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <span className="text-yowon-muted text-[10px] block">Description:</span>
                  <p className="text-white/80 mt-1 leading-relaxed">{selectedNode.metadata?.description || "No description provided."}</p>
                </div>

                {selectedNode.metadata?.layer && (
                  <div className="border-t border-white/5 pt-3">
                    <span className="text-yowon-muted text-[10px] block">Architecture Layer:</span>
                    <span className="text-cyan-400 mt-1 block capitalize">{selectedNode.metadata.layer}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-yowon-muted py-12 text-center text-xs">Select a node in the graph to inspect AST metadata.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardSection>
  )
}

export default function KnowledgeGraphPanel({ projectId }: KnowledgeGraphPanelProps) {
  return (
    <ErrorBoundary name="Knowledge Graph Panel">
      <RepositoryIntelligenceWrapper projectId={projectId}>
        <KnowledgeGraphContent projectId={projectId} />
      </RepositoryIntelligenceWrapper>
    </ErrorBoundary>
  )
}
