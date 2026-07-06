import React from 'react'
import { LayoutDashboard } from 'lucide-react'
import ScoreRing from '../ScoreRing'
import ConfidenceMeter from '../results/ConfidenceMeter'
import AgentConsensus from '../results/AgentConsensus'
import ReadinessGauge from '../results/ReadinessGauge'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { computeConsensus } from '../../utils/reportParser'

interface OverviewPanelProps {
  projectId: string
}

function OverviewContent({ projectId }: { projectId: string }) {
  const { data: report, isLoading } = useEvaluationReport(projectId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (!report) return null

  const vd = report.verdict_data
  const overallScore = report.overall_score ?? vd?.overall_score ?? 0
  const confidence = vd?.confidence ?? 0
  const consensus = computeConsensus(vd?.agent_scores)

  return (
    <DashboardSection id="overview" title="Overview" icon={LayoutDashboard}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-card flex flex-col items-center py-8 sm:col-span-2 xl:col-span-1">
          <ScoreRing score={overallScore} size={160} label="Overall Score" />
        </div>
        <ConfidenceMeter value={confidence} />
        <AgentConsensus score={consensus} />
        <ReadinessGauge score={overallScore} />
      </div>
    </DashboardSection>
  )
}

export default function OverviewPanel({ projectId }: OverviewPanelProps) {
  return (
    <ErrorBoundary name="Overview Panel">
      <OverviewContent projectId={projectId} />
    </ErrorBoundary>
  )
}
