import React from 'react'
import { FileText } from 'lucide-react'
import { useMetrics } from './queries'
import { DashboardSection } from './DashboardSection'
import { MetricsSkeleton } from './Skeletons'
import { ErrorBoundary, PanelErrorFallback } from './ErrorBoundary'
import { RepositoryIntelligenceWrapper } from './RepositoryIntelligenceWrapper'

interface MetricsPanelProps {
  projectId: string
}

function MetricsContent({ projectId }: { projectId: string }) {
  const { data: metricsData, isLoading, isError, error, refetch } = useMetrics(projectId)

  if (isLoading) {
    return <MetricsSkeleton />
  }

  if (isError) {
    return <PanelErrorFallback name="Code Metrics" error={error} refetch={refetch} />
  }

  const payload = metricsData?.success ? metricsData.data : metricsData
  const metrics = payload?.metrics || payload || {}

  return (
    <DashboardSection id="metrics" title="Code Metrics" icon={FileText} accent="emerald">
      <div className="glass-card min-h-[500px]">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-yowon-muted mb-4">Static Code Metrics Logs</p>
        {Object.keys(metrics).length > 0 ? (
          <div className="overflow-x-auto font-mono">
            <table className="w-full font-mono text-[10px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-yowon-muted">
                  <th className="pb-2">FILE PATH</th>
                  <th className="pb-2">LOC</th>
                  <th className="pb-2">CYCLOMATIC</th>
                  <th className="pb-2">COGNITIVE</th>
                  <th className="pb-2">MAINTAINABILITY</th>
                  <th className="pb-2">RISK</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics).map(([path, data]: any) => (
                  <tr key={path} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="py-2 text-white truncate max-w-[250px]" title={path}>{path}</td>
                    <td className="py-2 text-cyan-400 font-bold">{data.loc}</td>
                    <td className="py-2 text-slate-300">{data.complexity?.cyclomatic_complexity || 1}</td>
                    <td className="py-2 text-slate-300">{data.complexity?.cognitive_complexity || 1}</td>
                    <td className="py-2 text-emerald-400 font-bold">{Math.round(data.complexity?.maintainability_index || 80)}%</td>
                    <td className="py-2 text-red-400 font-bold">{data.risk}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-yowon-muted text-xs py-24 text-center">No metrics logs are available for this codebase.</div>
        )}
      </div>
    </DashboardSection>
  )
}

export default function MetricsPanel({ projectId }: MetricsPanelProps) {
  return (
    <ErrorBoundary name="Code Metrics Panel">
      <RepositoryIntelligenceWrapper projectId={projectId}>
        <MetricsContent projectId={projectId} />
      </RepositoryIntelligenceWrapper>
    </ErrorBoundary>
  )
}
