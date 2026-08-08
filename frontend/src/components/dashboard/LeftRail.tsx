import { useState } from 'react'
import { Building2, ChevronLeft, ChevronRight, Star, Search, Plus, RefreshCw, Clock } from 'lucide-react'
import type { ActiveFilters } from '../../hooks/useDashboardState'

export interface CompactRepo {
  uuid: string
  name: string
  health_score: number
  verdict: string
  language?: string
}

interface LeftRailProps {
  collapsed: boolean
  onToggle: () => void
  repos: CompactRepo[]
  favoriteRepoIds: string[]
  onToggleFavorite: (id: string) => void
  filters: ActiveFilters
  onFilterChange: (f: Partial<ActiveFilters>) => void
  onRepoClick: (id: string) => void
  onConnectClick: () => void
  onSyncClick: () => void
  onSearchClick: () => void
  orgs: string[]
  recentRepoIds: string[]
}

const DOT: Record<string, string> = {
  APPROVE:             'bg-emerald-400',
  CONDITIONAL_APPROVE: 'bg-amber-400',
  REJECT:              'bg-red-400',
  EVALUATING:          'bg-purple-400',
}

const FILTERS = [
  { key: 'all',                 label: 'All'     },
  { key: 'REJECT',              label: 'Blocked' },
  { key: 'CONDITIONAL_APPROVE', label: 'Review'  },
  { key: 'APPROVE',             label: 'Ready'   },
]

export default function LeftRail({
  collapsed, onToggle, repos, favoriteRepoIds, onToggleFavorite,
  filters, onFilterChange, onRepoClick, onConnectClick, onSyncClick,
  onSearchClick, orgs, recentRepoIds,
}: LeftRailProps) {
  const [showOrgMenu, setShowOrgMenu] = useState(false)

  const filtered = repos.filter((r) =>
    filters.verdict === 'all' || r.verdict === filters.verdict
  )
  const favorites = repos.filter((r) => favoriteRepoIds.includes(r.uuid))
  const nonFav    = filtered.filter((r) => !favoriteRepoIds.includes(r.uuid))
  const recentRepos = recentRepoIds
    .map((id) => repos.find((r) => r.uuid === id))
    .filter(Boolean) as CompactRepo[]

  return (
    <aside
      style={{ width: collapsed ? '48px' : '216px' }}
      className="shrink-0 flex flex-col bg-[#07090e] border-r border-white/[0.05] overflow-hidden transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      {/* Toggle */}
      <div className="flex items-center justify-end px-2 pt-2 pb-1">
        <button
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04] transition-colors"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden custom-scrollbar px-2 gap-1">

        {/* Org switcher */}
        <div className="relative mb-1">
          <button
            onClick={() => setShowOrgMenu((o) => !o)}
            title="Workspace"
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors"
          >
            <Building2 size={13} className="shrink-0 text-zinc-600" />
            {!collapsed && (
              <span className="text-[11px] font-medium truncate flex-1 text-left">
                {filters.org === 'all' ? 'All Workspaces' : filters.org}
              </span>
            )}
          </button>

          {showOrgMenu && !collapsed && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowOrgMenu(false)} />
              <div className="absolute left-0 mt-1 w-48 bg-[#0d0f16] border border-white/[0.08] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                {['all', ...orgs].map((org) => (
                  <button
                    key={org}
                    onClick={() => { onFilterChange({ org }); setShowOrgMenu(false) }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/[0.03] transition-colors ${
                      filters.org === org ? 'text-cyan-400 font-semibold' : 'text-zinc-400'
                    }`}
                  >
                    {org === 'all' ? 'All Workspaces' : org}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search */}
        <button
          onClick={onSearchClick}
          title="Search (⌘K)"
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] transition-colors"
        >
          <Search size={13} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="text-[11px] flex-1 text-left">Search</span>
              <span className="text-[9px] text-zinc-700 font-mono">⌘K</span>
            </>
          )}
        </button>

        {/* Filters */}
        {!collapsed && (
          <div className="flex gap-1 flex-wrap mt-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => onFilterChange({ verdict: f.key })}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  filters.verdict === f.key
                    ? 'text-cyan-400 bg-cyan-400/[0.08]'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-white/[0.04] my-2" />

        {/* Favorites */}
        {favorites.length > 0 && (
          <>
            {!collapsed && <p className="px-2 text-[9px] text-zinc-700 uppercase tracking-wider font-medium mb-0.5">Favorites</p>}
            {favorites.map((r) => (
              <Row key={r.uuid} repo={r} collapsed={collapsed} fav isFav
                onFav={() => onToggleFavorite(r.uuid)} onClick={() => onRepoClick(r.uuid)} />
            ))}
            <div className="border-t border-white/[0.04] my-1" />
          </>
        )}

        {/* Repo list */}
        {!collapsed && <p className="px-2 text-[9px] text-zinc-700 uppercase tracking-wider font-medium mb-0.5">Repositories</p>}
        <div className="flex-1 flex flex-col gap-0">
          {nonFav.length > 0
            ? nonFav.map((r) => (
                <Row key={r.uuid} repo={r} collapsed={collapsed}
                  isFav={false} onFav={() => onToggleFavorite(r.uuid)} onClick={() => onRepoClick(r.uuid)} />
              ))
            : !collapsed && (
                <p className="px-2 py-3 text-[10px] text-zinc-700">No repositories.</p>
              )}
        </div>

        {/* Recent */}
        {recentRepos.length > 0 && !collapsed && (
          <>
            <div className="border-t border-white/[0.04] mt-1 pt-2">
              <p className="px-2 text-[9px] text-zinc-700 uppercase tracking-wider font-medium mb-0.5 flex items-center gap-1">
                <Clock size={9} /> Recent
              </p>
              {recentRepos.slice(0, 3).map((r) => (
                <Row key={r.uuid} repo={r} collapsed={collapsed} dimmed
                  isFav={favoriteRepoIds.includes(r.uuid)}
                  onFav={() => onToggleFavorite(r.uuid)} onClick={() => onRepoClick(r.uuid)} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom actions */}
      <div className="border-t border-white/[0.04] px-2 py-2 flex gap-1">
        <button
          onClick={onConnectClick} title="Connect"
          className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] transition-colors text-[11px]"
        >
          <Plus size={12} />
          {!collapsed && <span>Connect</span>}
        </button>
        <button
          onClick={onSyncClick} title="Sync"
          className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03] transition-colors text-[11px]"
        >
          <RefreshCw size={12} />
          {!collapsed && <span>Sync</span>}
        </button>
      </div>
    </aside>
  )
}

function Row({
  repo, collapsed, isFav, onFav, onClick, dimmed = false, fav: _fav,
}: {
  repo: CompactRepo
  collapsed: boolean
  isFav: boolean
  onFav: () => void
  onClick: () => void
  dimmed?: boolean
  fav?: boolean
}) {
  const [hov, setHov] = useState(false)
  const dot = DOT[repo.verdict] ?? 'bg-zinc-700'

  return (
    <div
      className={`group flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-colors ${
        hov ? 'bg-white/[0.03]' : ''
      } ${dimmed ? 'opacity-40 hover:opacity-70' : ''}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      title={repo.name}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {!collapsed && (
        <>
          <span className="flex-1 text-[11px] text-zinc-400 group-hover:text-zinc-200 truncate transition-colors">{repo.name}</span>
          {hov && (
            <button
              onClick={(e) => { e.stopPropagation(); onFav() }}
              className={`shrink-0 ${isFav ? 'text-amber-400' : 'text-zinc-700 hover:text-amber-400'} transition-colors`}
            >
              <Star size={10} fill={isFav ? 'currentColor' : 'none'} />
            </button>
          )}
          {!hov && <span className="text-[10px] text-zinc-700 font-mono shrink-0">{repo.health_score}%</span>}
        </>
      )}
    </div>
  )
}
