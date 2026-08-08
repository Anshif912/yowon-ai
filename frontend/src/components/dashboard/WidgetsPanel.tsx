import { CheckSquare, Download, Star, ShieldAlert } from 'lucide-react'

export interface QueueItem {
  repoId: string
  name: string
  verdict: string
  lastSync: string
}

export interface ExportItem {
  id: string
  name: string
  format: string
  timestamp: string
}

interface WidgetsPanelProps {
  queue: QueueItem[]
  exports: ExportItem[]
  favorites: any[]
  alerts: string[]
  onRepoClick: (id: string) => void
  onExportClick?: (id: string) => void
}

export default function WidgetsPanel({
  queue = [],
  exports = [],
  favorites = [],
  alerts = [],
  onRepoClick,
  onExportClick,
}: WidgetsPanelProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
      {/* Production Queue */}
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2">
            <CheckSquare size={13} className="text-cyan-400" />
            <h4 className="font-bold uppercase tracking-wider text-white">Production Queue</h4>
          </div>

          <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
            {queue.length > 0 ? (
              queue.slice(0, 3).map((item) => (
                <div
                  key={item.repoId}
                  onClick={() => onRepoClick(item.repoId)}
                  className="flex justify-between items-center p-2 rounded bg-[#0c0d12] hover:bg-white/[0.02] border border-white/[0.03] cursor-pointer transition-all"
                >
                  <span className="text-[10px] text-zinc-300 font-sans truncate max-w-[120px]">
                    {item.name}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold font-mono">
                    {item.verdict}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-500 italic py-2">Queue is empty</p>
            )}
          </div>
        </div>
      </div>

      {/* Recently Exported Reports */}
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2">
            <Download size={13} className="text-cyan-400" />
            <h4 className="font-bold uppercase tracking-wider text-white">Exports History</h4>
          </div>

          <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
            {exports.length > 0 ? (
              exports.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onExportClick?.(item.id)}
                  className="flex justify-between items-center p-2 rounded bg-[#0c0d12] hover:bg-white/[0.02] border border-white/[0.03] cursor-pointer transition-all"
                >
                  <span className="text-[10px] text-zinc-300 font-sans truncate max-w-[120px]">
                    {item.name}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500">{item.format}</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-500 italic py-2">No recent exports</p>
            )}
          </div>
        </div>
      </div>

      {/* Pinned / Favorites */}
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2">
            <Star size={13} className="text-cyan-400" />
            <h4 className="font-bold uppercase tracking-wider text-white">Favorite Codebases</h4>
          </div>

          <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
            {favorites.length > 0 ? (
              favorites.slice(0, 3).map((item) => (
                <div
                  key={item.uuid}
                  onClick={() => onRepoClick(item.uuid)}
                  className="flex justify-between items-center p-2 rounded bg-[#0c0d12] hover:bg-white/[0.02] border border-white/[0.03] cursor-pointer transition-all"
                >
                  <span className="text-[10px] text-zinc-300 font-sans truncate max-w-[130px]">
                    {item.name}
                  </span>
                  <span className="text-[9px] text-cyan-400 font-bold font-mono">
                    {item.statistics?.health_score}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-500 italic py-2">No pinned projects</p>
            )}
          </div>
        </div>
      </div>

      {/* Security Alerts Feed */}
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2">
            <ShieldAlert size={13} className="text-cyan-400" />
            <h4 className="font-bold uppercase tracking-wider text-white">Security Alerts</h4>
          </div>

          <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
            {alerts.length > 0 ? (
              alerts.slice(0, 3).map((alert, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded bg-red-500/5 border border-red-500/10 text-[9.5px] leading-relaxed font-sans text-red-400 font-medium"
                >
                  ⚠️ {alert}
                </div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-500 italic py-2">Zero critical alerts</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
