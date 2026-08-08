import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, CheckCircle2, Search, Cpu, Layers, FileText, AlertCircle } from 'lucide-react'
import ExecutiveSummary from '../results/ExecutiveSummary'
import { useEvaluationReport, useRecommendations } from './queries'
import { DashboardSection } from './DashboardSection'
import { CardSkeleton } from './Skeletons'
import { ErrorBoundary } from './ErrorBoundary'
import { useSharedIntelligenceContext } from './RepositoryIntelligenceWrapper'
import PremiumWorkspaceCard, {
  WorkspaceHeader,
  WorkspaceBody,
  WorkspaceFooter
} from './PremiumWorkspaceCard'

interface RecommendationsPanelProps {
  projectId: string
}

interface RecItem {
  id: string
  title: string
  severity: string
  description: string
  files: string[]
  evidence: string[]
  nodeId?: string
  view: 'architecture' | 'technology' | 'unknown'
  confidence?: number
  confidenceReason?: string
  source?: string
  symbols?: string[]
  astNodes?: string[]
  metrics?: string[]
}

function RecommendationsContent({ projectId }: { projectId: string }) {
  const { data: report, isLoading: isReportLoading } = useEvaluationReport(projectId)
  const { data: recResponse, isLoading: isRecsLoading } = useRecommendations(projectId)
  const context = useSharedIntelligenceContext()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [activeSeverity, setActiveSeverity] = useState<string | null>(null)

  const handleJump = (nodeId: string, view: 'architecture' | 'technology' | 'unknown') => {
    if (view === 'unknown') return
    const rkmEntities = context.rkm?.entities || {}
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

  const rawRecs: any[] = useMemo(() => {
    if (!recResponse) return []
    return Array.isArray(recResponse.data) ? recResponse.data : Array.isArray(recResponse) ? recResponse : []
  }, [recResponse])

  const mappedRecs: RecItem[] = useMemo(() => {
    return rawRecs.map((rec, idx) => ({
      id: rec.id || `rec-${idx}`,
      title: rec.title || 'Untitled Recommendation',
      severity: (rec.severity || rec.priority || 'MEDIUM').toUpperCase(),
      description: rec.problem || rec.description || '',
      files: rec.affected_files || rec.files || [],
      evidence: Array.isArray(rec.evidence) ? rec.evidence : typeof rec.evidence === 'string' ? [rec.evidence] : [],
      nodeId: rec.nodeId || rec.node_id || undefined,
      view: (rec.view as 'architecture' | 'technology') || 'unknown',
      confidence: rec.confidence ?? 90,
      confidenceReason: rec.confidence_reason || rec.confidenceReason || 'Observed directly',
      source: rec.source || 'RULE_ENGINE',
      symbols: rec.symbols || [],
      astNodes: rec.ast_nodes || rec.astNodes || [],
      metrics: rec.metrics || []
    }))
  }, [rawRecs])

  const filteredRecs = useMemo(() => {
    return mappedRecs.filter(rec => {
      const matchSearch = !searchTerm || rec.title.toLowerCase().includes(searchTerm.toLowerCase()) || rec.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchSeverity = !activeSeverity || rec.severity === activeSeverity
      return matchSearch && matchSeverity
    })
  }, [searchTerm, activeSeverity, mappedRecs])

  if (isReportLoading || isRecsLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <CardSkeleton />
      </div>
    )
  }

  if (mappedRecs.length === 0) {
    return (
      <DashboardSection id="recommendations" title="Recommendations & Advice" icon={Wrench}>
        <PremiumWorkspaceCard accent="recommendation" className="!p-8 text-center flex flex-col items-center justify-center select-none">
          <WorkspaceBody>
            <AlertCircle className="w-8 h-8 text-zinc-500 mb-3" />
            <p className="text-sm text-zinc-350 font-bold uppercase tracking-wider">No recommendations generated</p>
            <p className="text-xs text-zinc-500 mt-1">Run evaluation to analyze the repository</p>
          </WorkspaceBody>
        </PremiumWorkspaceCard>
      </DashboardSection>
    )
  }

  const vd = report?.verdict_data
  const overallScore = report?.overall_score ?? vd?.overall_score ?? 0

  return (
    <DashboardSection id="recommendations" title="Recommendations & Advice" icon={Wrench}>
      <div className="space-y-6 font-mono text-[10px] text-white select-text">
        
        {/* Readiness overview */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white/[0.02] rounded-xl select-none">
          <div className="space-y-1">
            <span className="text-zinc-500 uppercase tracking-widest text-[8px] block font-bold">readiness score</span>
            <span className="text-2xl font-display font-extrabold text-cyan-300">{overallScore}/100</span>
          </div>
          <div className="flex items-center gap-1.5 py-1 px-3 rounded-full border border-emerald-500/15 bg-emerald-500/5 text-emerald-400 font-bold">
            <CheckCircle2 size={13} />
            <span>EVIDENCE-DRIVEN</span>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 select-none">
          <div className="flex flex-wrap gap-1 items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setActiveSeverity(null)}
              className={`px-2.5 py-1 rounded-md text-[8.5px] font-bold uppercase transition-all cursor-pointer ${
                !activeSeverity ? 'bg-cyan-500/10 text-cyan-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All
            </button>
            {Array.from(new Set(mappedRecs.map(r => r.severity))).map(sev => (
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
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500/40 text-zinc-200 pl-8 pr-3 py-1 text-xs h-8 rounded-lg outline-none transition-colors"
              placeholder="Search recommendations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Recommendations list */}
        <div className="space-y-4">
          {filteredRecs.map(rec => {
            const isCritical = rec.severity === 'CRITICAL' || rec.severity === 'HIGH' || rec.severity === 'IMMEDIATE'
            const borderCol = isCritical ? 'border-l-red-500' : rec.severity === 'HIGH' ? 'border-l-amber-400' : 'border-l-cyan-400'
            const sevColor = isCritical ? 'text-red-400 border-red-500/20 bg-red-500/5' : rec.severity === 'HIGH' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' : 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5'

            return (
              <div key={rec.id} className={`border-l-4 ${borderCol} p-5 bg-white/[0.01] rounded-xl space-y-3`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-bold select-none ${sevColor}`}>{rec.severity}</span>
                      <h4 className="font-bold text-white text-[11px] font-display leading-tight">{rec.title}</h4>
                    </div>
                    <p className="text-zinc-350 font-sans leading-relaxed text-[10px] pt-1">{rec.description}</p>
                  </div>

                  {rec.nodeId && rec.view !== 'unknown' && (
                    <button
                      onClick={() => handleJump(rec.nodeId!, rec.view as 'architecture' | 'technology')}
                      className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-[8.5px] font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 transition-all shrink-0 cursor-pointer select-none"
                    >
                      {rec.view === 'architecture' ? <Layers size={11} /> : <Cpu size={11} />}
                      Jump to view
                    </button>
                  )}
                </div>

                {/* Evidence metadata */}
                <div className="pt-2 border-t border-white/[0.03] space-y-2">
                  {rec.files && rec.files.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-bold shrink-0 select-none">Source files:</span>
                      {rec.files.map((file, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => window.dispatchEvent(new CustomEvent('yowon-view-file', { detail: { path: file } }))}
                          className="text-cyan-400 hover:text-cyan-300 font-mono text-[8px] bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-800/30 hover:border-cyan-700/40 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FileText size={8} />
                          {file}
                        </button>
                      ))}
                    </div>
                  )}

                  {((rec.symbols && rec.symbols.length > 0) || (rec.astNodes && rec.astNodes.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-bold shrink-0 select-none">Symbols & AST:</span>
                      {rec.symbols?.map((sym, sIdx) => (
                        <span key={sIdx} className="text-cyan-300 font-mono text-[8px] bg-cyan-950/20 border border-cyan-800/30 px-1.5 py-0.5 rounded">
                          🔤 {sym}
                        </span>
                      ))}
                      {rec.astNodes?.map((node, nIdx) => (
                        <span key={nIdx} className="text-zinc-400 font-mono text-[8px] bg-white/[0.03] border border-white/[0.05] px-1.5 py-0.5 rounded">
                          🌐 {node}
                        </span>
                      ))}
                    </div>
                  )}

                  {rec.metrics && rec.metrics.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-bold shrink-0 select-none">Metrics:</span>
                      {rec.metrics.map((met, mIdx) => (
                        <span key={mIdx} className="text-pink-400 font-mono text-[8px] bg-pink-950/10 border border-pink-800/20 px-1.5 py-0.5 rounded">
                          📈 {met}
                        </span>
                      ))}
                    </div>
                  )}

                  {rec.evidence && rec.evidence.length > 0 && (
                    <div className="space-y-0.5">
                      <span className="text-[7.5px] text-zinc-500 uppercase font-bold block select-none">Scanned evidence:</span>
                      {rec.evidence.map((ev, eIdx) => (
                        <span key={eIdx} className="text-zinc-500 font-sans leading-normal block">
                          ➔ {ev}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.02]">
                    <div className="flex items-center gap-1.5 text-[8px] text-zinc-500 font-mono select-none">
                      <span>SOURCE ENGINE:</span>
                      <span className="text-zinc-400 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{rec.source}</span>
                    </div>
                    <span className="text-[8px] font-mono text-zinc-500 select-none">
                      CONFIDENCE: <span className="text-cyan-400 font-bold">{rec.confidence}%</span> ({rec.confidenceReason})
                    </span>
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
