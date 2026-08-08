import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, BarChart2, Layout, ShieldCheck, Eye, Shield } from 'lucide-react'
import type { ActiveJob } from './ActivePipeline'
import type { Recommendation } from './RecommendationsFeed'
import type { ActivityEvent } from './ActivityFeed'

interface RightRailProps {
  collapsed: boolean
  onToggle: () => void
  activeJobs: ActiveJob[]
  onAbortJob: (id: string) => void
  recommendations: Recommendation[]
  activities: ActivityEvent[]
  securityAlerts: string[]
  trackedRecommendations: string[]
  dismissedRecommendations: string[]
  onReviewRecommendation: (repoId: string) => void
  onDismissRecommendation: (id: string) => void
  onTrackRecommendation: (id: string) => void
}

const AGENTS = [
  { name: 'Prime',     role: 'Intelligence', icon: BarChart2,  color: 'text-cyan-500'   },
  { name: 'Sentinel',  role: 'Security',     icon: Shield,     color: 'text-emerald-500' },
  { name: 'Forge',     role: 'Architecture', icon: Layout,     color: 'text-purple-500'  },
  { name: 'Guardian',  role: 'Risk',         icon: ShieldCheck, color: 'text-amber-500'  },
  { name: 'Visionary', role: 'Innovation',   icon: Eye,        color: 'text-pink-500'    },
]

const SEV_COLOR: Record<string, string> = {
  HIGH: 'bg-red-400', MEDIUM: 'bg-amber-400', LOW: 'bg-cyan-400',
}

export default function RightRail({
  collapsed, onToggle, activeJobs, onAbortJob, recommendations,
  activities, securityAlerts, trackedRecommendations, dismissedRecommendations,
  onReviewRecommendation, onDismissRecommendation, onTrackRecommendation,
}: RightRailProps) {
  const isRunning    = activeJobs.length > 0
  const visibleRecs  = recommendations.filter((r) => !dismissedRecommendations.includes(r.id))

  return (
    <aside
      style={{ width: collapsed ? '0px' : '272px' }}
      className="shrink-0 flex flex-col bg-[#07090e] border-l border-white/[0.05] overflow-hidden transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      {/* Toggle */}
      <div className="flex items-center px-2 pt-2 pb-1">
        <button
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04] transition-colors"
          title="Collapse"
        >
          <ChevronRight size={12} />
        </button>
        {!collapsed && (
          <span className="ml-2 text-[9px] uppercase tracking-widest text-zinc-700 font-medium">Intelligence</span>
        )}
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">

          {/* NOW */}
          {isRunning && (
            <Block label="Now">
              {activeJobs.map((job) => (
                <div key={job.projectId} className="py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-zinc-300 truncate flex-1">{job.name}</span>
                    <button
                      onClick={() => onAbortJob(job.projectId)}
                      className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors ml-2 shrink-0"
                    >
                      Abort
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400/60 rounded-full transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono shrink-0">{job.progress}%</span>
                  </div>
                </div>
              ))}
            </Block>
          )}

          {/* NEXT */}
          {visibleRecs.length > 0 && (
            <Block label="Next">
              {visibleRecs.slice(0, 8).map((rec) => {
                const tracked = trackedRecommendations.includes(rec.id)
                return (
                  <div key={rec.id} className="py-2 border-b border-white/[0.04] last:border-0">
                    <div className="flex gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${SEV_COLOR[rec.impact] ?? 'bg-zinc-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-zinc-300 leading-snug">{rec.recommendation}</p>
                        {rec.files?.[0] && (
                          <p className="text-[10px] text-zinc-700 font-mono mt-0.5 truncate">{rec.files[0]}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-zinc-600">{rec.repoName}</span>
                          <span className="text-[10px] text-violet-500 font-mono">{rec.eta}</span>
                        </div>
                        <div className="flex gap-2 mt-1.5">
                          <button
                            onClick={() => onReviewRecommendation(rec.repoId)}
                            className="text-[10px] text-zinc-600 hover:text-cyan-400 transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => onTrackRecommendation(rec.id)}
                            className={`text-[10px] transition-colors ${tracked ? 'text-amber-400' : 'text-zinc-600 hover:text-amber-400'}`}
                          >
                            {tracked ? 'Tracked' : 'Track'}
                          </button>
                          <button
                            onClick={() => onDismissRecommendation(rec.id)}
                            className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {visibleRecs.length > 8 && (
                <p className="text-[10px] text-zinc-700 pt-1.5">+{visibleRecs.length - 8} more</p>
              )}
            </Block>
          )}

          {/* WATCH */}
          {securityAlerts.length > 0 && (
            <Block label="Watch">
              {securityAlerts.map((alert, i) => (
                <div key={i} className="flex gap-2 py-1.5">
                  <AlertTriangle size={11} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-zinc-400 leading-snug">{alert}</p>
                </div>
              ))}
            </Block>
          )}

          {/* AI */}
          <Block label="AI Agents">
            {AGENTS.map((agent) => {
              const Icon = agent.icon
              const job  = activeJobs[0]
              const act  = activities.find((a) => a.repoName)

              return (
                <div key={agent.name} className="flex gap-2.5 py-2 border-b border-white/[0.03] last:border-0">
                  <Icon size={12} className={`${agent.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-zinc-300">{agent.name}</span>
                      <span className={`text-[8px] font-semibold uppercase tracking-wide ${isRunning ? 'text-cyan-500' : 'text-zinc-700'}`}>
                        {isRunning ? 'Active' : 'Idle'}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{agent.role}</p>
                    {isRunning && job ? (
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{job.name} · {job.progress}%</p>
                    ) : act ? (
                      <p className="text-[10px] text-zinc-700 mt-0.5 truncate">Last: {act.repoName}</p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </Block>

        </div>
      )}
    </aside>
  )
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <p className="text-[9px] text-zinc-700 uppercase tracking-widest font-medium mb-2">{label}</p>
      {children}
    </div>
  )
}
