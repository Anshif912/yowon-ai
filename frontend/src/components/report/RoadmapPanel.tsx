import React from 'react'
import { Map, Shield, Download } from 'lucide-react'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { phaseDeploymentRoadmap } from '../../utils/listNormalizer'
import { getPdfUrl } from '../../api/api'

interface RoadmapPanelProps {
  projectId: string
  demo?: boolean
}

function DeploymentRoadmapSection({ items }: { items: string[] | string | undefined }) {
  const phases = phaseDeploymentRoadmap(items)

  return (
    <div className="glass-card border-cyan-300/15">
      {phases.length === 0 ? (
        <p className="text-sm text-yowon-muted">No deployment roadmap generated.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {phases.map((phase, index) => (
            <div key={phase.title} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10 text-xs font-mono text-cyan-200">
                  {index + 1}
                </span>
                <h3 className="font-display font-semibold text-yowon-text">{phase.title}</h3>
              </div>
              <div className="space-y-2">
                {phase.items.map((item, itemIndex) => (
                  <p key={`${phase.title}-${itemIndex}`} className="text-sm leading-relaxed text-yowon-muted">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function RoadmapContent({ projectId, demo }: { projectId: string; demo?: boolean }) {
  const { data: report, isLoading } = useEvaluationReport(projectId)

  if (isLoading) {
    return <CardSkeleton />
  }

  if (!report) return null

  const vd = report.verdict_data
  const pdfId = demo ? null : projectId

  return (
    <DashboardSection id="deployment-roadmap" title="Deployment Roadmap" icon={Map}>
      <DeploymentRoadmapSection items={vd?.roadmap ?? vd?.deployment_roadmap} />
      {pdfId && report.report_status !== 'failed' && (
        <div className="glass-card text-center py-12 border border-violet-500/10">
          <Shield size={40} className="mx-auto mb-4 text-yowon-primary" />
          <h3 className="font-display font-bold text-xl text-yowon-text mb-2">
            Export Full Intelligence Report
          </h3>
          <p className="text-yowon-muted mb-6 text-sm max-w-md mx-auto">
            Download the complete PDF with executive summary, agent findings,
            failure predictions, and deployment roadmap.
          </p>
          <a
            href={getPdfUrl(pdfId)}
            target="_blank"
            rel="noreferrer"
            className="yowon-btn-primary inline-flex items-center gap-2"
          >
            <Download size={18} />
            Download PDF Report
          </a>
        </div>
      )}
    </DashboardSection>
  )
}

export default function RoadmapPanel({ projectId, demo }: RoadmapPanelProps) {
  return (
    <ErrorBoundary name="Roadmap Panel">
      <RoadmapContent projectId={projectId} demo={demo} />
    </ErrorBoundary>
  )
}
