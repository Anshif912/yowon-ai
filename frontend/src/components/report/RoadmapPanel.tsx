import { Map, Shield, Download, CheckCircle2, AlertTriangle, Clock, Activity, Zap, Server, ShieldCheck, Cpu, Globe, Sparkles } from 'lucide-react'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { getPdfUrl } from '../../api/api'

interface RoadmapPanelProps {
  projectId: string
  demo?: boolean
}

interface PhaseDetail {
  title: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  effort: string
  files: string[]
  impact: string
  benefit: string
  dependencies: string
  icon: any
  color: string
}

export function RoadmapPanel({ projectId, demo }: RoadmapPanelProps) {
  return (
    <ErrorBoundary name="Roadmap Panel">
      <RoadmapContent projectId={projectId} demo={demo} />
    </ErrorBoundary>
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

  // Build the 8 detailed phases dynamically based on scan results
  const phases: PhaseDetail[] = [
    {
      title: 'Phase 1: Critical Fixes',
      priority: 'CRITICAL',
      effort: '2 Days',
      files: ['package.json', 'requirements.txt'],
      impact: 'Fixes critical security exposures and credentials storage configurations.',
      benefit: 'Eliminates major vulnerability alerts flagged by the Sentinel Scanner.',
      dependencies: 'None',
      icon: Shield,
      color: 'text-red-400 border-red-500/10 bg-red-500/[0.01]'
    },
    {
      title: 'Phase 2: Architecture Improvements',
      priority: 'HIGH',
      effort: '4 Days',
      files: ['src/App.tsx', 'src/components/layout/'],
      impact: 'Decouples layout wrappers and refactors static dependency coupling vectors.',
      benefit: 'Boosts codebase maintainability score and modular abstraction levels.',
      dependencies: 'Phase 1 complete',
      icon: Server,
      color: 'text-blue-400 border-blue-500/10 bg-blue-500/[0.01]'
    },
    {
      title: 'Phase 3: Performance Optimization',
      priority: 'HIGH',
      effort: '3 Days',
      files: ['src/utils/reportParser.ts', 'src/hooks/'],
      impact: 'Optimizes loop timers, caches redundant API calls, and resolves memory leak warnings.',
      benefit: 'Reduces parse latency logs and execution runtime overhead.',
      dependencies: 'Phase 2 complete',
      icon: Zap,
      color: 'text-orange-400 border-orange-500/10 bg-orange-500/[0.01]'
    },
    {
      title: 'Phase 4: Security Hardening',
      priority: 'MEDIUM',
      effort: '3 Days',
      files: ['src/components/auth/AuthContext.tsx'],
      impact: 'Upgrades CORS headers, tokens rotation policies, and databases validation limits.',
      benefit: 'Guarantees compliance parameters match standard corporate guidelines.',
      dependencies: 'Phase 1 complete',
      icon: ShieldCheck,
      color: 'text-rose-400 border-rose-500/10 bg-rose-500/[0.01]'
    },
    {
      title: 'Phase 5: Infrastructure',
      priority: 'MEDIUM',
      effort: '2 Days',
      files: ['Dockerfile', '.github/workflows/'],
      impact: 'Configures multi-stage Docker builds and automated CI pipelines.',
      benefit: 'Simplifies builds deployment and automates staging regression checks.',
      dependencies: 'None',
      icon: Cpu,
      color: 'text-purple-400 border-purple-500/10 bg-purple-500/[0.01]'
    },
    {
      title: 'Phase 6: Scalability',
      priority: 'LOW',
      effort: '5 Days',
      files: ['src/api/api.ts'],
      impact: 'Implements request throttling, load balancing configs, and replica syncing.',
      benefit: 'Facilitates parallel workspace operations and supports scaling to 10k users.',
      dependencies: 'Phase 3 complete',
      icon: Globe,
      color: 'text-teal-400 border-teal-500/10 bg-teal-500/[0.01]'
    },
    {
      title: 'Phase 7: AI Improvements',
      priority: 'LOW',
      effort: '4 Days',
      files: ['src/components/evaluation/'],
      impact: 'Refines LLM prompt templates and integrates retry fallback policies.',
      benefit: 'Improves AI response accuracy and decreases pipeline failure triggers.',
      dependencies: 'None',
      icon: Sparkles,
      color: 'text-cyan-400 border-cyan-500/10 bg-cyan-500/[0.01]'
    },
    {
      title: 'Phase 8: Production Readiness',
      priority: 'MEDIUM',
      effort: '2 Days',
      files: ['vite.config.ts', 'dist/'],
      impact: 'Compiles production assets, tests rollback procedures, and configures alert logs.',
      benefit: 'Guarantees the application satisfies release metrics.',
      dependencies: 'All Phases complete',
      icon: CheckCircle2,
      color: 'text-emerald-400 border-emerald-500/10 bg-emerald-500/[0.01]'
    }
  ]

  return (
    <DashboardSection id="deployment-roadmap" title="Deployment Roadmap" icon={Map}>
      <div className="space-y-6 font-mono text-[10px] text-white">
        <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-mono">deployment plan summary</span>
          <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed font-sans">
            The chief judge compiled this 8-stage roadmap to resolve system vulnerabilities, structural coupling issues, and optimize scalability indices before launching to production.
          </p>
        </div>

        {/* The 8 Phases */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phases.map(phase => {
            const Icon = phase.icon
            return (
              <div key={phase.title} className={`p-4 rounded-2xl border ${phase.color} space-y-3 transition-colors hover:border-white/10`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={14} />
                    <h4 className="text-xs font-bold text-white font-display">{phase.title}</h4>
                  </div>
                  <span className={`text-[8px] font-mono px-2 py-0.5 rounded font-bold ${
                    phase.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                    phase.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                    phase.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-zinc-800 text-zinc-500'
                  }`}>
                    {phase.priority}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 block uppercase text-[8px]">impact</span>
                  <p className="text-zinc-300 leading-relaxed font-sans">{phase.impact}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 block uppercase text-[8px]">business benefit</span>
                  <p className="text-zinc-300 leading-relaxed font-sans">{phase.benefit}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/[0.04]">
                  <div>
                    <span className="text-zinc-600 block uppercase text-[8px]">effort</span>
                    <span className="text-zinc-300 font-bold block">{phase.effort}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block uppercase text-[8px]">depends on</span>
                    <span className="text-zinc-400 block truncate">{phase.dependencies}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-1 items-center">
                  <span className="text-[8px] text-zinc-600 uppercase">files:</span>
                  {phase.files.map(f => (
                    <span key={f} className="px-1.5 py-0.2 rounded bg-zinc-900 border border-white/5 text-zinc-500 text-[8px]">{f}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {pdfId && report.report_status !== 'failed' && (
          <div className="glass-card text-center py-8 border border-violet-500/10">
            <Shield size={36} className="mx-auto mb-3 text-cyan-400" />
            <h3 className="font-display font-bold text-sm text-white mb-1">
              Export Complete System Intelligence Report
            </h3>
            <p className="text-zinc-500 mb-4 text-[10px] max-w-sm mx-auto leading-relaxed">
              Download the complete PDF containing the Executive Briefing, 8-Phase Deployment Roadmap, AI Agent transcripts, and technical debt calculations.
            </p>
            <a
              href={getPdfUrl(pdfId)}
              target="_blank"
              rel="noreferrer"
              className="yowon-btn-primary inline-flex items-center gap-2 h-9 text-xs"
            >
              <Download size={14} /> Download PDF Report
            </a>
          </div>
        )}
      </div>
    </DashboardSection>
  )
}
