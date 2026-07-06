import React from 'react'
import { Cpu } from 'lucide-react'
import { useDependencyGraph } from './queries'
import { DashboardSection } from './DashboardSection'
import { GraphSkeleton } from './Skeletons'
import { ErrorBoundary, PanelErrorFallback } from './ErrorBoundary'
import { RepositoryIntelligenceWrapper } from './RepositoryIntelligenceWrapper'

interface DependencyGraphPanelProps {
  projectId: string
}

function DependencyGraphContent({ projectId }: { projectId: string }) {
  const { data: depGraph, isLoading, isError, error, refetch } = useDependencyGraph(projectId)

  if (isLoading) {
    return <GraphSkeleton />
  }

  if (isError) {
    return <PanelErrorFallback name="Dependency Graph" error={error} refetch={refetch} />
  }

  const graph = depGraph?.success ? depGraph.data : depGraph

  return (
    <DashboardSection id="dependencies" title="Dependency Graph" icon={Cpu} accent="cyan">
      <div className="glass-card min-h-[500px]">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-yowon-muted mb-4">Code Manifest Dependencies</p>
        {graph?.nodes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {graph.nodes.filter((n: any) => n.type === 'dependency').map((node: any) => (
              <div key={node.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-xs font-mono font-bold text-white truncate">{node.label.split('@')[0]}</span>
                <span className="text-[10px] text-yowon-muted font-mono mt-2">
                  Version: <span className="text-cyan-400 font-bold">{node.metadata?.version || 'unknown'}</span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-yowon-muted text-xs py-24 text-center">No dependency nodes are currently loaded.</div>
        )}
      </div>
    </DashboardSection>
  )
}

export default function DependencyGraphPanel({ projectId }: DependencyGraphPanelProps) {
  return (
    <ErrorBoundary name="Dependency Graph Panel">
      <RepositoryIntelligenceWrapper projectId={projectId}>
        <DependencyGraphContent projectId={projectId} />
      </RepositoryIntelligenceWrapper>
    </ErrorBoundary>
  )
}
