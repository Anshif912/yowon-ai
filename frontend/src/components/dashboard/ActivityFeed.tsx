import { Bot, Loader2, ShieldCheck, Database, Layout, Shield } from 'lucide-react'

export interface ActivityEvent {
  timestamp: string
  repoName: string
  event: string
  details?: string
  status: 'info' | 'success' | 'warning'
}

interface ActivityFeedProps {
  activities: ActivityEvent[]
  activeJobsCount: number
  loading?: boolean
}

export default function ActivityFeed({ activities = [], activeJobsCount, loading }: ActivityFeedProps) {
  // AI Agent Crew definitions
  const agents = [
    { name: 'Prime', role: 'Executive Briefing', activeDesc: 'Synthesizing Consensus Report', idleDesc: 'Standby Monitoring', icon: Bot, color: 'text-cyan-400' },
    { name: 'Sentinel', role: 'Vulnerabilities', activeDesc: 'Scanning Codebase AST Paths', idleDesc: 'Monitoring Dependencies', icon: Shield, color: 'text-emerald-400' },
    { name: 'Forge', role: 'Architecture Review', activeDesc: 'Analyzing Dependency Layering', idleDesc: 'Standby Architecting', icon: Layout, color: 'text-purple-400' },
    { name: 'Guardian', role: 'Risk Engine', activeDesc: 'Computing Severity Weights', idleDesc: 'Watching Security Backlog', icon: ShieldCheck, color: 'text-amber-400' },
  ]

  if (loading) {
    return (
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="h-32 bg-zinc-800 rounded w-full" />
      </div>
    )
  }

  const isRunning = activeJobsCount > 0

  return (
    <section className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono flex flex-col justify-between h-full">
      <div className="border-b border-white/[0.04] pb-3 mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Live Agent Activity
        </h3>
        {isRunning && (
          <span className="flex items-center gap-1.5 text-[8.5px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 animate-pulse font-bold">
            <Loader2 size={10} className="animate-spin" /> RUNNING
          </span>
        )}
      </div>

      {/* AI Agents Grid */}
      <div className="grid grid-cols-1 gap-2.5 mb-4">
        {agents.map((agent) => {
          const Icon = agent.icon
          const description = isRunning ? agent.activeDesc : agent.idleDesc
          
          return (
            <div
              key={agent.name}
              className="bg-[#0c0d12] border border-white/[0.04] p-3 rounded-xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] ${agent.color}`}>
                  <Icon size={13} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-white font-display">
                    {agent.name}
                  </span>
                  <span className="block text-[8px] text-zinc-500 uppercase tracking-wider">
                    {agent.role}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-[9.5px] font-medium font-sans ${isRunning ? 'text-cyan-400 font-bold' : 'text-zinc-400'}`}>
                  {description}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mini Event Log */}
      <div className="border-t border-white/[0.04] pt-3 flex-1 overflow-y-auto space-y-2.5 max-h-[140px] pr-1 custom-scrollbar">
        {activities.length > 0 ? (
          activities.slice(0, 3).map((act, i) => (
            <div key={i} className="flex gap-2 text-[9px] items-start text-zinc-400">
              <span className="text-[8px] text-zinc-600 select-none pt-0.5">{act.timestamp}</span>
              <span className="font-bold text-white truncate max-w-[120px]">{act.repoName}</span>
              <span className="truncate max-w-[200px]">{act.event}</span>
            </div>
          ))
        ) : (
          <div className="py-2 text-center text-zinc-600 italic text-[9.5px]">
            No recent active evaluations logs.
          </div>
        )}
      </div>
    </section>
  )
}
