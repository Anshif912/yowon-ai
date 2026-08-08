import { ShieldAlert, AlertTriangle, Play, CheckCircle } from 'lucide-react'

export interface Recommendation {
  id: string
  repoId: string
  repoName: string
  recommendation: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  difficulty: 'HIGH' | 'MEDIUM' | 'LOW'
  category: 'Immediate' | 'Today' | 'This Week' | 'Long Term' | string
  eta: string
  files: string[]
}

interface RecommendationsFeedProps {
  items: Recommendation[]
  onItemClick: (repoId: string) => void
  onReview?: (repoId: string) => void
  onApply?: (id: string) => void
  loading?: boolean
}

export default function RecommendationsFeed({
  items,
  onItemClick,
  onReview,
  onApply,
  loading,
}: RecommendationsFeedProps) {
  if (loading) {
    return (
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/4" />
        <div className="h-20 bg-zinc-800 rounded w-full" />
      </div>
    )
  }

  // Horizon mappings
  const horizons = [
    { key: 'Immediate', label: 'Immediate', border: 'border-red-500/20 bg-red-500/5', text: 'text-red-400' },
    { key: 'Today', label: 'Today Action Plan', border: 'border-orange-500/20 bg-orange-500/5', text: 'text-orange-400' },
    { key: 'This Week', label: 'This Week Targets', border: 'border-amber-500/20 bg-amber-500/5', text: 'text-amber-400' },
    { key: 'Long Term', label: 'Later Backlog', border: 'border-zinc-500/20 bg-zinc-500/5', text: 'text-zinc-500' },
  ]

  const hasItems = items && items.length > 0

  return (
    <section className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono flex flex-col justify-between h-full">
      <div className="border-b border-white/[0.04] pb-3 mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Priority Action Queue
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar max-h-[360px]">
        {hasItems ? (
          horizons.map((hor) => {
            const horItems = items.filter(
              (i) =>
                i.category?.toLowerCase() === hor.key.toLowerCase() ||
                (hor.key === 'Long Term' && i.category?.toLowerCase() === 'later')
            )

            if (horItems.length === 0) return null

            return (
              <div key={hor.key} className="space-y-2">
                <span className={`text-[9px] font-bold uppercase tracking-widest block ${hor.text}`}>
                  {hor.label}
                </span>

                <div className="space-y-2">
                  {horItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-[#0c0d12] border border-white/[0.04] p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:bg-[#12131a]"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            onClick={() => onItemClick(item.repoId)}
                            className="text-[8px] text-zinc-500 hover:text-cyan-400 font-bold uppercase cursor-pointer"
                          >
                            {item.repoName}
                          </span>
                          <span className="text-zinc-700 font-bold">•</span>
                          <span className="text-[8px] text-zinc-500 uppercase font-mono truncate max-w-[150px]">
                            {item.files?.[0] || 'Multiple files'}
                          </span>
                          <span className="text-zinc-700 font-bold">•</span>
                          <span className="text-[8px] text-violet-400 font-bold font-mono">
                            {item.eta}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-zinc-300 font-sans leading-snug font-medium">
                          {item.recommendation}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onReview?.(item.repoId)}
                          className="px-2 py-1 rounded bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-[8.5px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all cursor-pointer"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => onApply?.(item.id)}
                          className="px-2 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-[8.5px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center text-zinc-500 italic text-[10px] font-sans">
            All repositories clear. No active recommendations.
          </div>
        )}
      </div>
    </section>
  )
}
