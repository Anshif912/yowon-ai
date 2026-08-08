import { useState } from 'react'
import { AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react'

interface RiskNode {
  repoId: string
  repoName: string
  riskName: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL'
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW'
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  category: string // e.g. "Security", "Architecture"
  primaryAgent: string
  hours: number
  score: number // 0-100 overall repo health or risk
}

interface RiskMatrixProps {
  nodes: RiskNode[]
  onNodeClick: (repoId: string) => void
  loading?: boolean
}

export default function RiskMatrix({ nodes, onNodeClick, loading }: RiskMatrixProps) {
  const [selectedNode, setSelectedNode] = useState<RiskNode | null>(null)

  if (loading) {
    return (
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="h-40 bg-zinc-800 rounded w-full" />
      </div>
    )
  }

  if (!nodes || nodes.length === 0) {
    return (
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-6 font-mono text-center space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Enterprise Risk Map
        </h3>
        <p className="text-[10px] text-zinc-500 max-w-sm mx-auto font-sans leading-relaxed">
          No evaluated repositories available yet. Run your first repository evaluation to populate the enterprise risk matrix.
        </p>
      </div>
    )
  }

  // Get color depending on severity
  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return { text: 'text-red-400', bg: 'bg-red-500', border: 'border-red-500/30' }
      case 'HIGH':
        return { text: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500/30' }
      case 'MEDIUM':
        return { text: 'text-yellow-400', bg: 'bg-yellow-500', border: 'border-yellow-500/30' }
      case 'LOW':
        return { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500/30' }
      default:
        return { text: 'text-purple-400', bg: 'bg-purple-500', border: 'border-purple-500/30' }
    }
  }

  // Plot layout coords based on Likelihood (X: Low=1, Medium=2, High=3) vs Impact (Y: Low=1, Medium=2, High=3)
  const getCoords = (likelihood: string, impact: string) => {
    const lx = likelihood === 'LOW' ? 0.2 : likelihood === 'MEDIUM' ? 0.5 : 0.8
    const iy = impact === 'LOW' ? 0.8 : impact === 'MEDIUM' ? 0.5 : 0.2
    return { x: lx * 100, y: iy * 100 }
  }

  return (
    <section className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
        Enterprise Risk Matrix
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coordinate Space Matrix */}
        <div className="lg:col-span-2 relative aspect-video bg-[#0c0d12] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-y-0 border-r border-white/[0.02]"
                style={{ left: `${(i / 3) * 100}%` }}
              />
            ))}
            {[1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-x-0 border-b border-white/[0.02]"
                style={{ top: `${(i / 3) * 100}%` }}
              />
            ))}
          </div>

          {/* Labels */}
          <div className="absolute bottom-2 left-2 text-[8px] uppercase tracking-widest text-zinc-500 select-none">
            Likelihood ➔
          </div>
          <div className="absolute top-2 left-2 text-[8px] uppercase tracking-widest text-zinc-500 origin-top-left rotate-90 select-none translate-x-4 pl-2">
            Impact ➔
          </div>

          {/* Plot nodes */}
          {nodes.map((node, idx) => {
            const coords = getCoords(node.likelihood, node.impact)
            const colors = getSeverityColor(node.severity)
            const isSelected = selectedNode?.repoId === node.repoId

            return (
              <button
                key={idx}
                onClick={() => setSelectedNode(node)}
                className={`absolute w-3 h-3 rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-10 ${
                  colors.bg
                } ${
                  isSelected
                    ? 'ring-4 ring-white/20 scale-125 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                    : 'hover:scale-110'
                }`}
                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                title={`${node.repoName}: ${node.riskName}`}
              />
            )
          })}
        </div>

        {/* Selected Details Panel */}
        <div className="bg-[#0c0d12] border border-white/[0.04] rounded-xl p-4 flex flex-col justify-between min-h-[220px]">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest block">
                  Active Risk Scorecard
                </span>
                <h4
                  onClick={() => onNodeClick(selectedNode.repoId)}
                  className="text-xs font-bold text-white hover:text-cyan-400 cursor-pointer underline transition-all font-display"
                >
                  {selectedNode.repoName}
                </h4>
              </div>

              <div className="bg-[#12131a] p-3 rounded-lg border border-white/[0.04] space-y-1.5 font-sans">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-zinc-500 uppercase">Risk Category</span>
                  <span className="text-zinc-300 font-bold uppercase">{selectedNode.category}</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug font-medium">
                  {selectedNode.riskName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[9.5px] border-t border-white/[0.04] pt-3 font-mono">
                <div>
                  <span className="text-zinc-500 block text-[8px] uppercase">Severity</span>
                  <span className={`font-bold ${getSeverityColor(selectedNode.severity).text}`}>
                    {selectedNode.severity}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[8px] uppercase">Hours to Fix</span>
                  <span className="font-bold text-violet-400 font-mono">{selectedNode.hours} hrs</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[8px] uppercase">Primary Agent</span>
                  <span className="text-zinc-300 font-bold">{selectedNode.primaryAgent}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[8px] uppercase">Risk Impact</span>
                  <span className="text-zinc-300 font-bold">{selectedNode.impact}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
              <AlertCircle size={22} className="text-zinc-600" />
              <span className="text-[10px] text-zinc-500 leading-relaxed font-sans">
                Select a coordinate node in the matrix grid to inspect active codebase vulnerabilities.
              </span>
            </div>
          )}

          {selectedNode && (
            <button
              onClick={() => onNodeClick(selectedNode.repoId)}
              className="mt-4 yowon-btn-primary h-8 text-[10px]"
            >
              Open Project Scorecard
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
