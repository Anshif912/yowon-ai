import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, CheckCircle2, Sparkles, Search, ArrowRight, ShieldAlert, Cpu, Layers, FileText } from 'lucide-react'
import ExecutiveSummary from '../results/ExecutiveSummary'
import { useEvaluationReport } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'

interface RecommendationsPanelProps {
  projectId: string
}

interface RecItem {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  files: string[]
  evidence: string[]
  nodeId?: string
  view: 'architecture' | 'technology'
}

const STATIC_RECS: RecItem[] = [
  {
    id: 'rec-1',
    title: 'Implement Middleware Decoupling',
    severity: 'CRITICAL',
    description: 'Decouple direct imports of security modules from the route middleware chain to avoid circular references packages.',
    files: ['/app/core/middleware.py', '/app/core/security.py'],
    evidence: ['Circular imports detected inside core packages.'],
    nodeId: 'gateway',
    view: 'architecture'
  },
  {
    id: 'rec-2',
    title: 'Pin requirements.txt package versioning',
    severity: 'HIGH',
    description: 'Pin FastAPI and Uvicorn dependency packages to exact versions to avoid unverified package downloads in production environments.',
    files: ['/requirements.txt'],
    evidence: ['Uvicorn package version declared as dynamic wildcard range.'],
    nodeId: 'technology',
    view: 'technology'
  },
  {
    id: 'rec-3',
    title: 'Increase DB Connection Pooling Limits',
    severity: 'MEDIUM',
    description: 'Set database pooling engine thresholds to 20 to prevent transaction concurrency bottlenecks.',
    files: ['/app/models/database.py'],
    evidence: ['SQLAlchemy pool_size limit parameter configuration resolved as 5.'],
    nodeId: 'database',
    view: 'architecture'
  },
  {
    id: 'rec-4',
    title: 'Isolate CrewAI Prompt Declarations',
    severity: 'LOW',
    description: 'Consolidate prompts templates into a separate prompts configurations package.',
    files: ['/app/services/evaluator.py'],
    evidence: ['Direct string literals resolved in agent prompt definitions.'],
    nodeId: 'agents',
    view: 'technology'
  }
]

function RecommendationsContent({ projectId }: { projectId: string }) {
  const { data: report, isLoading } = useEvaluationReport(projectId)
  const context = useSharedIntelligenceContext()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeSeverity, setActiveSeverity] = useState<string | null>(null)

  const handleJump = (nodeId: string, view: 'architecture' | 'technology') => {
    const rkmEntities = context.rkm?.entities || {}
    // Try to match RKM node by ID or label
    const entity = rkmEntities[nodeId] || Object.values(rkmEntities).find(e => e.label.toLowerCase().includes(nodeId.toLowerCase()))
    
    if (entity) {
      context.setSelectedEntity({
        id: entity.id,
        type: entity.type,
        label: entity.label,
        metadata: entity
      })
    }
    navigate(`/intelligence/${projectId}/${view}`)
  }

  // Filter recommendations
  const filteredRecs = useMemo(() => {
    return STATIC_RECS.filter(rec => {
      const matchSearch = !searchTerm || rec.title.toLowerCase().includes(searchTerm.toLowerCase()) || rec.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchSeverity = !activeSeverity || rec.severity === activeSeverity
      return matchSearch && matchSeverity
    })
  }, [searchTerm, activeSeverity])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <CardSkeleton />
      </div>
    )
  }

  if (!report) return null

  const vd = report.verdict_data
  const overallScore = report.overall_score ?? vd?.overall_score ?? 0

  return (
    <DashboardSection id="recommendations" title="Recommendations & Advice" icon={Wrench} accent="violet">
      <div className="space-y-6 font-mono text-[10px] text-white">
        
        {/* Readiness overview */}
        <div className="p-4 border border-white/[0.05] bg-white/[0.01] rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-zinc-500 uppercase tracking-widest text-[8px] block">readiness score</span>
            <span className="text-2xl font-display font-bold text-cyan-300">{overallScore}/100</span>
          </div>
          <div className="flex items-center gap-1.5 py-1 px-3 rounded-full border border-emerald-500/15 bg-emerald-500/5 text-emerald-400">
            <CheckCircle2 size={13} />
            <span>Codebase validation accepted</span>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap gap-1 items-center bg-white/5 border border-white/10 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setActiveSeverity(null)}
              className={`px-2.5 py-1 rounded-md text-[8.5px] font-bold uppercase transition-all cursor-pointer ${
                !activeSeverity ? 'bg-cyan-500/10 text-cyan-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All
            </button>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
              <button
                key={sev}
                onClick={() => setActiveSeverity(sev)}
                className={`px-2.5 py-1 rounded-md text-[8.5px] font-bold uppercase transition-all cursor-pointer ${
                  activeSeverity === sev ? 'bg-cyan-500/10 text-cyan-300' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              className="glass-input pl-8 py-1 text-xs h-7 rounded-lg"
              placeholder="Search recommendations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Recommendations list */}
        <div className="space-y-4">
          {filteredRecs.map(rec => {
            const isCritical = rec.severity === 'CRITICAL' || rec.severity === 'HIGH'
            const sevColor = rec.severity === 'CRITICAL' ? 'text-red-400 border-red-500/20 bg-red-500/5' : rec.severity === 'HIGH' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5'

            return (
              <div
                key={rec.id}
                className="p-4 rounded-2xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.015] hover:border-white/10 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-bold ${sevColor}`}>{rec.severity}</span>
                      <h4 className="font-bold text-white text-[11px] font-display">{rec.title}</h4>
                    </div>
                    <p className="text-zinc-300 font-sans leading-relaxed text-[9.5px] pt-1">{rec.description}</p>
                  </div>

                  {rec.nodeId && (
                    <button
                      onClick={() => handleJump(rec.nodeId!, rec.view)}
                      className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/5 text-[8.5px] font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    >
                      {rec.view === 'architecture' ? <Layers size={11} /> : <Cpu size={11} />}
                      Jump to view
                    </button>
                  )}
                </div>

                {/* Evidence metadata */}
                <div className="pt-2 border-t border-white/[0.03] space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[7.5px] text-zinc-500 uppercase font-bold shrink-0">Source files:</span>
                    {rec.files.map((file, fIdx) => (
                      <span key={fIdx} className="text-zinc-400 font-mono text-[8px] flex items-center gap-1">
                        <FileText size={8} />
                        {file}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[7.5px] text-zinc-500 uppercase font-bold block">Scanned evidence:</span>
                    {rec.evidence.map((ev, eIdx) => (
                      <span key={eIdx} className="text-zinc-500 font-sans leading-normal block">
                        ➔ {ev}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )
          })}
        </div>

        {vd && <ExecutiveSummary data={vd} showRoadmap={false} />}
      </div>
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
