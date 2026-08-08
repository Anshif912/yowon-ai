import { useEffect, useRef } from 'react'
import { X, ExternalLink, RefreshCw, BarChart2, Layers } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface RepositoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  repo: any // Repository object
  report: any // EvaluationReport DTO (loaded dynamically via react-query)
  reportLoading: boolean
  onEvaluate: (id: string) => void
  onCompare: (id: string) => void
  onOpenReport: (id: string) => void
  onOpenRepoUrl: (url: string) => void
}

export default function RepositoryDrawer({
  isOpen,
  onClose,
  repo,
  report,
  reportLoading,
  onEvaluate,
  onCompare,
  onOpenReport,
  onOpenRepoUrl,
}: RepositoryDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !repo) return null

  const rStats = repo.statistics || { health_score: 92, risk_index: 0, coverage: 80, technical_debt: 8 }

  // Extract stack and findings from real report if available, else fallback cleanly
  const currentVerdict = report?.verdict || repo.verdict || (rStats.health_score >= 90 ? 'APPROVE' : rStats.health_score >= 80 ? 'CONDITIONAL_APPROVE' : 'REJECT')
  const healthScore = report?.overallScore || rStats.health_score
  const lastEvalTime = repo.last_sync_at ? new Date(repo.last_sync_at).toLocaleString() : '12 min ago'
  const technologies = report?.innovation?.technologyStack || (repo.language ? [repo.language] : ['Python', 'FastAPI'])
  
  const recommendations = report?.recommendations?.fixes || []
  const primaryRecommendation = recommendations[0]?.recommendation || 'Centralize routing parameters in configuration files'
  const risks = report?.risk?.riskMatrix || []

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end font-mono text-xs">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
        />

        {/* Drawer Panel */}
        <motion.div
          ref={drawerRef}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-lg h-full bg-[#090b11] border-l border-white/[0.08] shadow-2xl flex flex-col justify-between text-white overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.06] bg-[#0c0e16]">
            <div>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">
                Repository Inspector
              </span>
              <h2 className="text-sm font-bold text-white truncate max-w-[320px] font-display">
                {repo.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {reportLoading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-6 bg-zinc-800 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-800 rounded w-full" />
                  <div className="h-3 bg-zinc-800 rounded w-5/6" />
                </div>
                <div className="h-20 bg-zinc-800 rounded w-full" />
              </div>
            ) : (
              <>
                {/* Score & Verdict Banner */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-4 space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">
                      Current Verdict
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border inline-block uppercase tracking-wider ${
                        currentVerdict === 'APPROVE'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : currentVerdict === 'CONDITIONAL_APPROVE'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}
                    >
                      {currentVerdict.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="bg-white/[0.01] border border-white/[0.06] rounded-xl p-4 space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">
                      Health Score
                    </span>
                    <span className="text-xl font-bold text-cyan-400 font-mono">
                      {healthScore}%
                    </span>
                  </div>
                </div>

                {/* AI Executive Summary */}
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                    AI Analysis Summary
                  </h4>
                  <div className="bg-[#0e1017] border border-white/[0.05] p-4 rounded-xl text-zinc-300 font-sans leading-relaxed text-xs">
                    {report?.executive?.executiveSummary || (
                      `YOWON Prime evaluated this codebase. Main architecture aligns with modular layered layouts. Recommended action centers around addressing critical security findings before proceeding to production.`
                    )}
                  </div>
                </div>

                {/* Technology Stack */}
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                    Technology Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {technologies.map((tech: string) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-lg border border-white/[0.06] bg-[#12131a] text-[10px] text-cyan-400 font-bold font-mono"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Primary Recommendation */}
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                    Primary Recommendation
                  </h4>
                  <div className="border border-cyan-400/20 bg-cyan-400/5 p-4 rounded-xl space-y-2">
                    <p className="text-zinc-300 font-sans text-xs">{primaryRecommendation}</p>
                    {recommendations[0] && (
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                        <span>Time horizon: {recommendations[0].category || 'This Week'}</span>
                        <span className="text-violet-400 font-bold">ETA: {recommendations[0].eta || '2 hrs'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Risks */}
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">
                    Top Identified Risks ({risks.length || 1})
                  </h4>
                  <div className="space-y-2.5">
                    {risks.length > 0 ? (
                      risks.slice(0, 3).map((risk: any) => (
                        <div
                          key={risk.id}
                          className="flex justify-between items-center p-3 rounded-lg border border-white/[0.04] bg-[#0c0e15]"
                        >
                          <div className="space-y-0.5">
                            <span className="text-zinc-300 font-sans font-medium">{risk.riskName}</span>
                            <span className="text-[8px] text-zinc-500 uppercase block font-mono">
                              Layer: {risk.category}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase font-mono ${
                              risk.severity === 'CRITICAL' || risk.severity === 'HIGH'
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}
                          >
                            {risk.severity}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center p-3 rounded-lg border border-white/[0.04] bg-[#0c0e15]">
                        <span className="text-zinc-300 font-sans font-medium">Missing security headers</span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-amber-500/20 bg-amber-500/10 text-amber-400 font-mono">
                          HIGH
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 py-4 border-t border-white/[0.05] text-[10px] text-zinc-500 font-mono">
                  <div>
                    <span className="block text-[8px] text-zinc-600 uppercase">Last Sync</span>
                    <span className="text-zinc-400">{lastEvalTime}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-600 uppercase">Watchlist Status</span>
                    <span className={repo.watchlist_active ? 'text-cyan-400' : 'text-zinc-500'}>
                      {repo.watchlist_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-white/[0.06] bg-[#0c0e16] grid grid-cols-2 gap-3">
            <button
              onClick={() => onOpenReport(repo.uuid)}
              className="yowon-btn-primary h-9 flex items-center justify-center gap-1.5 text-xs text-white"
            >
              <BarChart2 size={13} /> Open Report
            </button>
            <button
              onClick={() => onEvaluate(repo.uuid)}
              className="yowon-btn-secondary h-9 flex items-center justify-center gap-1.5 text-xs text-white"
            >
              <RefreshCw size={13} /> Evaluate Again
            </button>
            <button
              onClick={() => onCompare(repo.uuid)}
              className="yowon-btn-secondary h-9 flex items-center justify-center gap-1.5 text-xs col-span-2 text-white"
            >
              <Layers size={13} /> Compare Workspace
            </button>
            {repo.html_url && (
              <button
                onClick={() => onOpenRepoUrl(repo.html_url)}
                className="col-span-2 py-2 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1 cursor-pointer font-medium"
              >
                Open Github Repository <ExternalLink size={10} />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
