import React, { useState } from 'react'
import { Activity, Shield, ChevronDown, ChevronUp, Cpu, Lock, Star, Zap, Globe, AlertTriangle, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { scoreColor } from '../../utils/reportParser'
import type { Evaluation } from '../../types'

const AGENT_META: Record<string, { icon: any; label: string; color: string }> = {
  forge: { icon: Cpu, label: 'Forge', color: '#00E5FF' },
  sentinel: { icon: Lock, label: 'Sentinel', color: '#EF4444' },
  visionary: { icon: Zap, label: 'Visionary', color: '#00FFA3' },
  showcase: { icon: Star, label: 'Showcase', color: '#7C3AED' },
  guardian: { icon: Globe, label: 'Guardian', color: '#00FFA3' },
  yowon_prime: { icon: Shield, label: 'YOWON Prime', color: '#7C3AED' },
  engineering: { icon: Cpu, label: 'Forge', color: '#00E5FF' },
  innovation_scalability: { icon: TrendingUp, label: 'Visionary', color: '#00FFA3' },
  ppt: { icon: Star, label: 'Showcase', color: '#7C3AED' },
  risk_impact: { icon: Globe, label: 'Guardian', color: '#00FFA3' },
  risk: { icon: Globe, label: 'Guardian', color: '#00FFA3' },
  chief_evaluation: { icon: Shield, label: 'YOWON Prime', color: '#7C3AED' },
  technical: { icon: Cpu, label: 'Forge', color: '#00E5FF' },
  security: { icon: Lock, label: 'Sentinel', color: '#EF4444' },
  presentation: { icon: Star, label: 'Showcase', color: '#7C3AED' },
  innovation: { icon: Zap, label: 'Visionary', color: '#00FFA3' },
  impact: { icon: Globe, label: 'Guardian', color: '#00FFA3' },
  failure: { icon: AlertTriangle, label: 'Failure Risk', color: '#F97316' },
  scalability: { icon: TrendingUp, label: 'Scalability', color: '#00E5FF' },
}

interface AgentReportsPanelProps {
  projectId: string
}

function AgentCard({ agentKey, evaluation }: { agentKey: string; evaluation: Evaluation }) {
  const [expanded, setExpanded] = useState(false)
  const meta = AGENT_META[agentKey] || { icon: Shield, label: agentKey, color: '#64748B' }
  const Icon = meta.icon
  const score = evaluation.score ?? 0

  return (
    <motion.div className="glass-card" layout>
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${meta.color}20` }}
          >
            <Icon size={18} style={{ color: meta.color }} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-yowon-text">{meta.label}</h3>
            {evaluation.score !== null && (
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-24 bg-yowon-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: scoreColor(score) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.2 }}
                  />
                </div>
                <span className="text-xs font-mono" style={{ color: scoreColor(score) }}>
                  {score.toFixed(0)}/100
                </span>
              </div>
            )}
          </div>
        </div>
        <button className="text-yowon-muted hover:text-white transition-colors">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-white/5 space-y-3"
        >
          <div className="bg-black/25 rounded-lg p-3 font-mono text-xs leading-relaxed border border-white/5 whitespace-pre-wrap">
            {evaluation.findings}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function AgentReportsContent({ projectId }: { projectId: string }) {
  const { data: report, isLoading } = useEvaluationReport(projectId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (!report) return null

  const vd = report.verdict_data
  const reportEvaluations = Object.entries(report.evaluations)

  return (
    <DashboardSection id="agent-reports" title="Agent Reports" icon={Activity}>
      {vd?.contradictions && vd.contradictions.length > 0 && (
        <div className="glass-card border border-purple-500/20 p-5 mb-3">
          <h3 className="text-xs font-mono text-purple-300 uppercase tracking-widest mb-3">
            YOWON Prime Cross-Examination
          </h3>
          <ul className="space-y-2">
            {vd.contradictions.map((c, i) => (
              <li key={i} className="text-sm text-yowon-muted flex gap-2">
                <span className="text-purple-400">!</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="space-y-3">
        {reportEvaluations.map(([key, ev]) => (
          <AgentCard
            key={key}
            agentKey={key}
            evaluation={ev}
          />
        ))}
      </div>
    </DashboardSection>
  )
}

export default function AgentReportsPanel({ projectId }: AgentReportsPanelProps) {
  return (
    <ErrorBoundary name="Agent Reports Panel">
      <AgentReportsContent projectId={projectId} />
    </ErrorBoundary>
  )
}
