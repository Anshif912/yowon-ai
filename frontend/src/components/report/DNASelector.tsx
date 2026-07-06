import React from 'react'
import { Fingerprint } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { getRadarData } from '../../utils/reportParser'

interface DNASelectorProps {
  projectId: string
}

function DNAContent({ projectId }: { projectId: string }) {
  const { data: report, isLoading } = useEvaluationReport(projectId)

  if (isLoading) {
    return <CardSkeleton />
  }

  if (!report) return null

  const vd = report.verdict_data
  const radarData = getRadarData(vd?.agent_scores)
  const items = radarData.length ? radarData.slice(0, 6) : [
    { subject: 'Evidence', score: 30 },
    { subject: 'Architecture', score: 30 },
    { subject: 'Sentinel', score: 30 },
  ]

  return (
    <DashboardSection id="project-dna" title="Project DNA" icon={Fingerprint} accent="emerald">
      <div className="glass-card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-lg">Project DNA</h3>
          <Fingerprint size={18} className="text-cyan-300" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.subject} className="rounded-xl bg-white/[0.035] border border-white/10 p-3">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-yowon-muted">{item.subject}</span>
                <span className="font-mono text-cyan-300">{Math.round(item.score)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardSection>
  )
}

export default function DNASelector({ projectId }: DNASelectorProps) {
  return (
    <ErrorBoundary name="Project DNA Selector">
      <DNAContent projectId={projectId} />
    </ErrorBoundary>
  )
}
