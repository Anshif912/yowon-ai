import { Sparkles, ShieldCheck, ShieldAlert, Cpu, BarChart2, Shield, Wrench, Globe, AlertTriangle } from 'lucide-react'
import { useExecutiveSummary, useEvaluationReport } from './queries'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'

import { DashboardSection } from './DashboardSection'

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
      <div className="glass-card flex items-center gap-3 text-rose-350 p-5 font-mono">
        <ShieldAlert size={20} />
        <span>Failed to load Executive Summary. Verify Ollama / LLM container connection.</span>
      </div>
    )
  }

  const summary = summaryData.data
  const report = reportData
  const vd = report?.verdict_data as any

  // Custom matrices
  const techs = vd?.detected_technologies || []
  const langs = techs.filter((t: string) => ['Python', 'TypeScript', 'JavaScript', 'Go', 'Rust', 'Java', 'C#', 'Ruby', 'PHP', 'Kotlin'].includes(t))
  const frameworks = techs.filter((t: string) => ['FastAPI', 'React', 'Django', 'Express', 'Next.js', 'Vue', 'Angular', 'Spring', 'Rails'].includes(t))
  
  const infraTech = techs.find((t: string) => ['Docker', 'Kubernetes', 'docker'].includes(t))
  const aiComponents = techs.filter((t: string) => ['CrewAI', 'LangChain', 'OpenAI', 'Ollama', 'LlamaIndex'].includes(t)).join(', ')

  const stack = [
    { label: 'Programming Languages', value: langs.length > 0 ? langs.join(', ') : '—' },
    { label: 'Primary Frameworks', value: frameworks.length > 0 ? frameworks.join(', ') : '—' },
    { label: 'Infrastructure setup', value: infraTech ? infraTech : '—' },
    { label: 'AI Agent components', value: aiComponents ? aiComponents : '—' }
  ]

  const overallScore = report?.overall_score || 0
  const securityScore = vd?.agent_scores?.security ?? 0

  const maturity = [
    { label: 'Deployment Readiness', value: overallScore >= 70 ? 'APPROVED' : 'DEFERRED', color: overallScore >= 70 ? 'text-emerald-400' : 'text-amber-400' },
    { label: 'Security Maturity', value: securityScore >= 75 ? 'SECURE' : 'EXPOSED', color: securityScore >= 75 ? 'text-emerald-400' : 'text-rose-400' },
    { label: 'Complexity Index', value: vd?.complexity_index ? `${vd.complexity_index}/10` : '—', color: 'text-cyan-400' },
    { label: 'Risk Profile', value: vd?.risk_level || 'MEDIUM', color: vd?.risk_level === 'LOW' ? 'text-emerald-400' : 'text-amber-400' }
  ]

  return (
    <DashboardSection id="executive-summary" title="Executive Summary & RKM DNA" icon={Sparkles} accent="violet">
      <div className="space-y-6 font-mono text-[10px] text-white">
        
        {/* Purpose Overview Header */}
        <div className="p-5 bg-white/[0.02] rounded-xl">
          <p className="text-[11px] text-zinc-350 leading-relaxed font-sans">{summary.purpose}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Technology Stack Matrix */}
          <div className="p-5 bg-white/[0.01] rounded-xl space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.04]">
              <Cpu size={14} className="text-cyan-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Technology Stack Profile</h4>
            </div>
            <div className="space-y-3 font-sans">
              {stack.map(item => (
                <div key={item.label} className="flex justify-between items-start gap-4 text-[11px]">
                  <span className="text-zinc-500">{item.label}</span>
                  <span className="text-zinc-200 text-right font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Maturity Matrix */}
          <div className="p-5 bg-white/[0.01] rounded-xl space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.04]">
              <Shield size={14} className="text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Maturity & Risks Indices</h4>
            </div>
            <div className="space-y-3 font-sans">
              {maturity.map(item => (
                <div key={item.label} className="flex justify-between items-center text-[11px]">
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
            <div key={card.title} className="p-5 bg-white/[0.01] rounded-xl space-y-2">
              <h5 className={`font-bold text-xs uppercase tracking-wider font-display ${card.color}`}>{card.title}</h5>
              <p className="text-zinc-350 leading-relaxed font-sans text-[10px]">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardSection>
  )
}
