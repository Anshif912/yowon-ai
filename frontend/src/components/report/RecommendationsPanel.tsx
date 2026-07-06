import React from 'react'
import { Wrench, CheckCircle2, Sparkles } from 'lucide-react'
import ExecutiveSummary from '../results/ExecutiveSummary'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'

interface RecommendationsPanelProps {
  projectId: string
}

function ReadinessLadder({ score }: { score: number }) {
  const stages = ['Evidence', 'Prototype', 'Validated', 'Deployable', 'Enterprise Ready']
  const active = Math.min(stages.length - 1, Math.floor(score / 20))
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-lg">Readiness Ladder</h3>
        <CheckCircle2 size={18} className="text-cyan-300" />
      </div>
      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div key={stage} className={`flex items-center gap-3 rounded-xl border p-3 ${index <= active ? 'border-cyan-300/20 bg-cyan-300/5' : 'border-white/10 bg-white/[0.02]'}`}>
            <CheckCircle2 size={16} className={index <= active ? 'text-emerald-300' : 'text-yowon-muted'} />
            <span className="text-sm text-yowon-text">{stage}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendationEngine({ fixes = [] }: { fixes?: string[] }) {
  const items = fixes.length ? fixes.slice(0, 4) : ['Add testing evidence', 'Document deployment path', 'Strengthen security review']
  return (
    <div className="glass-card border-violet-400/20">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-lg">AI Recommendation Engine</h3>
        <Sparkles size={18} className="text-violet-300" />
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item} className="flex gap-3 rounded-xl bg-white/[0.03] border border-white/10 p-3">
            <span className="font-mono text-xs text-cyan-300">P{index + 1}</span>
            <p className="text-sm text-yowon-muted">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendationsContent({ projectId }: { projectId: string }) {
  const { data: report, isLoading } = useEvaluationReport(projectId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[1, 2].map(i => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (!report) return null

  const vd = report.verdict_data
  const overallScore = report.overall_score ?? vd?.overall_score ?? 0

  return (
    <DashboardSection id="recommendations" title="Recommendations" icon={Wrench} accent="violet">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ReadinessLadder score={overallScore} />
        <RecommendationEngine fixes={vd?.recommended_fixes} />
      </div>
      {vd && <ExecutiveSummary data={vd} showRoadmap={false} />}
    </DashboardSection>
  )
}

export default function RecommendationsPanel({ projectId }: RecommendationsPanelProps) {
  return (
    <ErrorBoundary name="Recommendations Panel">
      <RecommendationsContent projectId={projectId} />
    </ErrorBoundary>
  )
}
