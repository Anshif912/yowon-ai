import React from 'react'
import { Trophy, Scale } from 'lucide-react'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { computeConsensus } from '../../utils/reportParser'
import type { RankingData } from '../../types'

interface RankingsPanelProps {
  projectId: string
}

function hasRankingValue(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
}

function rankText(rank?: string) {
  return rank && rank !== 'Insufficient Data' ? rank : 'Insufficient Data'
}

function BenchmarkComparison({ score, consensus, ranking }: { score: number; consensus: number; ranking?: RankingData }) {
  const globalPercentile = hasRankingValue(ranking?.global_percentile) ? ranking?.global_percentile ?? 0 : null
  const categoryPercentile = hasRankingValue(ranking?.category_percentile) ? ranking?.category_percentile ?? 0 : null
  const rows = [
    { label: 'Global Percentile', value: globalPercentile },
    { label: 'Category Percentile', value: categoryPercentile },
    { label: 'This Project', value: score },
    { label: 'Agent Consensus', value: consensus },
  ]
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-lg">Benchmark Comparison</h3>
        <Scale size={18} className="text-emerald-300" />
      </div>
      <div className="space-y-3">
        {rows.map(row => (
          <div key={row.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-yowon-muted">{row.label}</span>
              <span className="font-mono text-yowon-text">
                {row.value === null ? 'Insufficient Data' : `${Math.round(row.value)}/100`}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300"
                style={{ width: `${row.value ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-yowon-muted mt-4 font-mono">
        Compared against {ranking?.projects_compared ?? 0} historical projects.
      </p>
    </div>
  )
}

function RankingsContent({ projectId }: { projectId: string }) {
  const { data: report, isLoading } = useEvaluationReport(projectId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (!report) return null

  const vd = report.verdict_data
  const overallScore = report.overall_score ?? vd?.overall_score ?? 0
  const consensus = computeConsensus(vd?.agent_scores)
  const ranking = vd?.ranking

  return (
    <DashboardSection id="rankings" title="Rankings" icon={Trophy} accent="violet">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-lg">Global Ranking Indicator</h3>
            <Trophy size={18} className="text-violet-300" />
          </div>
          <p className="text-4xl font-display font-bold text-yowon-text">{rankText(ranking?.global_rank)}</p>
          <p className="text-sm text-yowon-muted mt-3">
            Compared Against: {ranking?.projects_compared ?? 0} Projects
          </p>
        </div>
        <div className="glass-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-lg">Category Ranking</h3>
            <Scale size={18} className="text-emerald-300" />
          </div>
          <p className="text-4xl font-display font-bold text-yowon-text">{rankText(ranking?.category_rank)}</p>
          <p className="text-sm text-yowon-muted mt-3">
            Among {vd?.project_type ?? report.project_type ?? 'This Category'} Projects
          </p>
          <p className="text-xs text-yowon-muted/80 mt-1 font-mono">
            Compared Against: {ranking?.category_projects_compared ?? 0}
          </p>
        </div>
        <BenchmarkComparison score={overallScore} consensus={consensus} ranking={ranking} />
      </div>
    </DashboardSection>
  )
}

export default function RankingsPanel({ projectId }: RankingsPanelProps) {
  return (
    <ErrorBoundary name="Rankings Panel">
      <RankingsContent projectId={projectId} />
    </ErrorBoundary>
  )
}
