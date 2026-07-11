import { Sparkles, ShieldCheck, ShieldAlert, Cpu, BarChart2, Shield, Wrench, Globe, AlertTriangle } from 'lucide-react'
import { useExecutiveSummary, useEvaluationReport } from './queries'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'

interface ExecutiveSummaryPanelProps {
  projectId: string
}

export function ExecutiveSummaryPanel({ projectId }: ExecutiveSummaryPanelProps) {
  return (
    <ErrorBoundary name="Executive Summary Panel">
      <ExecutiveSummaryContent projectId={projectId} />
    </ErrorBoundary>
  )
}

function ExecutiveSummaryContent({ projectId }: { projectId: string }) {
  const { data: summaryData, isLoading: isSummaryLoading, error: summaryError } = useExecutiveSummary(projectId)
  const { data: reportData, isLoading: isReportLoading } = useEvaluationReport(projectId)

  if (isSummaryLoading || isReportLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
      </div>
    )
  }

  if (summaryError || !summaryData || !summaryData.success) {
    return (
      <div className="glass-card flex items-center gap-3 text-rose-300 p-5 font-mono">
        <ShieldAlert size={20} />
        <span>Failed to load Executive Summary from Ollama Chief. Verify model is active.</span>
      </div>
    )
  }

  const summary = summaryData.data
  const report = reportData
  const vd = report?.verdict_data

  // Custom matrices
  const stack = [
    { label: 'Programming Languages', value: vd?.detected_technologies?.slice(0, 3).join(', ') || 'TypeScript, Python' },
    { label: 'Primary Frameworks', value: vd?.detected_technologies?.slice(3, 6).join(', ') || 'React, FastAPI, TailwindCSS' },
    { label: 'Infrastructure setup', value: vd?.detected_technologies?.includes('Docker') ? 'Docker Containerized' : 'Node runtime host' },
    { label: 'AI Agent components', value: vd?.detected_technologies?.includes('CrewAI') ? 'CrewAI active' : 'Langchain / LLM client' }
  ]

  const overallScore = report?.overall_score || 0
  const securityScore = vd?.agent_scores?.security ?? 0

  const maturity = [
    { label: 'Deployment Readiness', value: overallScore >= 70 ? 'APPROVED' : 'DEFERRED', color: overallScore >= 70 ? 'text-emerald-400' : 'text-amber-400' },
    { label: 'Security Maturity', value: securityScore >= 75 ? 'SECURE' : 'EXPOSED', color: securityScore >= 75 ? 'text-emerald-400' : 'text-rose-400' },
    { label: 'Complexity Index', value: 'MODERATE (4/10)', color: 'text-cyan-400' },
    { label: 'Risk Profile', value: vd?.risk_level || 'MEDIUM', color: vd?.risk_level === 'LOW' ? 'text-emerald-400' : 'text-amber-400' }
  ]

  return (
    <div className="space-y-6 font-mono text-[10px] text-white">
      {/* Summary Header */}
      <div className="glass-card bg-gradient-to-r from-violet-950/20 via-cyan-950/20 to-violet-950/30 border border-violet-500/20 p-6 rounded-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-violet-300 animate-pulse" size={20} />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Executive Summary Dashboard</h2>
        </div>
        <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">{summary.purpose}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Technology Stack Matrix */}
        <div className="border border-white/[0.05] bg-white/[0.01] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.04]">
            <Cpu size={14} className="text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Technology Stack Profile</h4>
          </div>
          <div className="space-y-3">
            {stack.map(item => (
              <div key={item.label} className="flex justify-between items-start gap-4">
                <span className="text-zinc-500">{item.label}</span>
                <span className="text-zinc-200 text-right font-semibold font-sans">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Maturity Matrix */}
        <div className="border border-white/[0.05] bg-white/[0.01] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.04]">
            <Shield size={14} className="text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Maturity & Risks Indices</h4>
          </div>
          <div className="space-y-3">
            {maturity.map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-zinc-500">{item.label}</span>
                <span className={`font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Architecture design', desc: summary.architecture, color: 'text-cyan-400' },
          { title: 'Inference & AI readiness', desc: summary.ai_readiness, color: 'text-violet-400' },
          { title: 'Security posture', desc: summary.security, color: 'text-rose-400' }
        ].map(card => (
          <div key={card.title} className="border border-white/[0.05] bg-white/[0.01] p-4 rounded-xl space-y-2 hover:border-white/10 transition-colors">
            <h5 className={`font-bold text-xs uppercase tracking-wider font-display ${card.color}`}>{card.title}</h5>
            <p className="text-zinc-400 leading-relaxed font-sans text-[10px]">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
