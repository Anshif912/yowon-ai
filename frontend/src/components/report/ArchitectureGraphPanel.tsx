import React, { useState } from 'react'
import { Cpu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useArchitectureGraph } from './queries'
import { DashboardSection } from './DashboardSection'
import { GraphSkeleton } from './Skeletons'
import { ErrorBoundary, PanelErrorFallback } from './ErrorBoundary'
import { RepositoryIntelligenceWrapper } from './RepositoryIntelligenceWrapper'

interface ArchitectureGraphPanelProps {
  projectId: string
}

function ArchitectureGraphContent({ projectId }: { projectId: string }) {
  const { data: archGraph, isLoading, isError, error, refetch } = useArchitectureGraph(projectId)
  const [zoomScale, setZoomScale] = useState(1.0)

  if (isLoading) {
    return <GraphSkeleton />
  }

  if (isError) {
    return <PanelErrorFallback name="Architecture Graph" error={error} refetch={refetch} />
  }

  const graph = archGraph?.success ? archGraph.data : archGraph

  return (
    <DashboardSection id="architecture" title="Architecture Graph" icon={Cpu} accent="cyan">
      <div className="glass-card min-h-[500px]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-yowon-muted">Pipeline Architecture Topology</p>
            <p className="text-xs text-white mt-1">Inferred runtime blocks and sequential connection flows.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setZoomScale(s => Math.max(0.6, s - 0.1))} className="px-2 py-1 bg-white/[0.04] border border-white/10 rounded text-xs hover:bg-white/[0.08] transition-colors">-</button>
            <button onClick={() => setZoomScale(s => Math.min(2.0, s + 0.1))} className="px-2 py-1 bg-white/[0.04] border border-white/10 rounded text-xs hover:bg-white/[0.08] transition-colors">+</button>
            <button onClick={() => setZoomScale(1.0)} className="px-2 py-1 bg-white/[0.04] border border-white/10 rounded text-xs hover:bg-white/[0.08] transition-colors">Reset</button>
          </div>
        </div>

        {graph?.nodes ? (
          <div className="relative overflow-hidden bg-black/30 border border-white/5 rounded-xl min-h-[400px] flex items-center justify-center">
            <div
              className="flex flex-wrap gap-12 justify-center items-center p-8 transition-transform duration-200"
              style={{ transform: `scale(${zoomScale})` }}
            >
              {graph.nodes.map((node: any) => (
                <motion.div
                  key={node.id}
                  whileHover={{ scale: 1.05 }}
                  className="bg-yowon-bg/95 border border-cyan-500/30 rounded-xl p-4 w-44 shadow-2xl backdrop-blur relative z-10"
                >
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                    {(node.type || 'NODE').toUpperCase()}
                  </span>
                  <h4 className="text-xs font-bold text-white mb-2">{node.label}</h4>
                  <p className="text-[10px] text-yowon-muted leading-snug">{node.metadata?.description}</p>
                  
                  {node.metadata?.technologies && node.metadata.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {node.metadata.technologies.map((t: string) => (
                        <span key={t} className="text-[8px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-1 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-yowon-muted text-xs py-24 text-center">No architecture nodes are currently loaded.</div>
        )}
      </div>
    </DashboardSection>
  )
}

export default function ArchitectureGraphPanel({ projectId }: ArchitectureGraphPanelProps) {
  return (
    <ErrorBoundary name="Architecture Graph Panel">
      <RepositoryIntelligenceWrapper projectId={projectId}>
        <ArchitectureGraphContent projectId={projectId} />
      </RepositoryIntelligenceWrapper>
    </ErrorBoundary>
  )
}
