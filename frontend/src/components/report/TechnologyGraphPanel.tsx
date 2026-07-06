import React from 'react'
import { Cpu } from 'lucide-react'
import { useTechnologyGraph } from './queries'
import { DashboardSection } from './DashboardSection'
import { GraphSkeleton } from './Skeletons'
import { ErrorBoundary, PanelErrorFallback } from './ErrorBoundary'
import { RepositoryIntelligenceWrapper } from './RepositoryIntelligenceWrapper'

interface TechnologyGraphPanelProps {
  projectId: string
}

function TechnologyGraphContent({ projectId }: { projectId: string }) {
  const { data: techGraph, isLoading, isError, error, refetch } = useTechnologyGraph(projectId)

  if (isLoading) {
    return <GraphSkeleton />
  }

  if (isError) {
    return <PanelErrorFallback name="Technology Graph" error={error} refetch={refetch} />
  }

  const graph = techGraph?.success ? techGraph.data : techGraph

  return (
    <DashboardSection id="technology" title="Technology Graph" icon={Cpu} accent="emerald">
      <div className="glass-card min-h-[500px]">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-yowon-muted mb-4">Detected Technology Relations</p>
        {graph?.nodes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {graph.nodes.map((node: any) => (
              <div key={node.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400">
                  {node.label.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{node.label}</h4>
                  <p className="text-[10px] text-yowon-muted mt-0.5">Stack Framework</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-yowon-muted text-xs py-24 text-center">No technology stack nodes are currently loaded.</div>
        )}
      </div>
    </DashboardSection>
  )
}

export default function TechnologyGraphPanel({ projectId }: TechnologyGraphPanelProps) {
  return (
    <ErrorBoundary name="Technology Graph Panel">
      <RepositoryIntelligenceWrapper projectId={projectId}>
        <TechnologyGraphContent projectId={projectId} />
      </RepositoryIntelligenceWrapper>
    </ErrorBoundary>
  )
}
