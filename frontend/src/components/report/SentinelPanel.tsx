import React from 'react'
import { Shield } from 'lucide-react'
import ThreatRadar from '../results/ThreatRadar'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'

interface SentinelPanelProps {
  projectId: string
}

function SentinelContent({ projectId }: { projectId: string }) {
  const { data: report, isLoading } = useEvaluationReport(projectId)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {[1, 2].map(i => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (!report) return null

  const vd = report.verdict_data
  const riskLevel = vd?.risk_level ?? 'MEDIUM'
  const sentinelScore = Math.round(vd?.agent_scores?.security ?? report.evaluations?.sentinel?.score ?? report.evaluations?.security?.score ?? 0)

  return (
    <DashboardSection id="security" title="Sentinel" icon={Shield} accent="red">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ThreatRadar riskLevel={riskLevel} />
        <div className="glass-card xl:col-span-2">
          <h3 className="font-display font-bold text-lg mb-4">Sentinel Signal</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-yowon-muted">Risk Level</p>
              <p className="mt-2 font-display text-xl font-bold text-red-300">{riskLevel}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-yowon-muted">Sentinel Score</p>
              <p className="mt-2 font-display text-xl font-bold text-cyan-300">
                {sentinelScore}/100
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[10px] font-mono uppercase tracking-widest text-yowon-muted">Evidence Quality</p>
              <p className="mt-2 font-display text-xl font-bold text-amber-300">{vd?.evidence_quality ?? 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardSection>
  )
}

export default function SentinelPanel({ projectId }: SentinelPanelProps) {
  return (
    <ErrorBoundary name="Sentinel Panel">
      <SentinelContent projectId={projectId} />
    </ErrorBoundary>
  )
}
