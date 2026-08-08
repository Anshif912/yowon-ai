interface TagStat {
  label: string
  count: number
  category: 'language' | 'framework' | 'database' | 'vectorStore' | 'cicd' | string
}

interface PortfolioAnalyticsProps {
  stats: TagStat[]
  onTagClick: (tag: string) => void
  activeTag?: string
  loading?: boolean
}

export default function PortfolioAnalytics({
  stats = [],
  onTagClick,
  activeTag,
  loading,
}: PortfolioAnalyticsProps) {
  if (loading) {
    return (
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/4" />
        <div className="flex gap-2">
          <div className="h-6 bg-zinc-800 rounded w-16" />
          <div className="h-6 bg-zinc-800 rounded w-20" />
        </div>
      </div>
    )
  }

  // Group stats by categories
  const categories = [
    { key: 'language', label: 'Languages' },
    { key: 'framework', label: 'AI Frameworks' },
    { key: 'database', label: 'Databases' },
    { key: 'vectorStore', label: 'Vector Stores' },
    { key: 'cicd', label: 'CI/CD Configuration' },
  ]

  return (
    <section className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 font-mono space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          Portfolio Tech Stack
        </h3>
        <p className="text-[9.5px] text-zinc-500 font-sans leading-relaxed">
          Aggregated language and database statistics. Click any badge to drill down and filter repositories.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {categories.map((cat) => {
          const catStats = stats.filter((s) => s.category === cat.key)

          return (
            <div key={cat.key} className="space-y-2.5">
              <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block border-b border-white/[0.03] pb-1.5">
                {cat.label}
              </span>

              <div className="flex flex-wrap lg:flex-col gap-2">
                {catStats.length > 0 ? (
                  catStats.map((stat) => {
                    const isActive = activeTag?.toLowerCase() === stat.label.toLowerCase()
                    return (
                      <button
                        key={stat.label}
                        onClick={() => onTagClick(stat.label)}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400'
                            : 'bg-[#12131a] hover:bg-[#161822] border-white/[0.06] hover:border-white/20 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className="truncate max-w-[100px]">{stat.label}</span>
                        <span
                          className={`text-[8.5px] px-1.5 py-0.5 rounded font-mono ${
                            isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/[0.03] text-zinc-500'
                          }`}
                        >
                          {stat.count}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <span className="text-[10px] text-zinc-600 italic">None indexed</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
